const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config();
const { OAuth2Client } = require("google-auth-library");
const { google } = require("googleapis");
const pdfParse = require("pdf-parse");

const prisma = new PrismaClient();
const app = express();
const googleClient = new OAuth2Client();

app.use(cors());

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

app.use(cors());
app.use(express.json());

// ✅ Auth Middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1] || req.query.token;
  if (token === "mock-phone-token") {
    req.user = { userId: "mock-user-id" };
    return next();
  }
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// ✅ Auth Routes
app.post("/auth/register", async (req, res) => {
  const { email, password } = req.body;
  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({ data: { email, passwordHash } });
    res.json({ success: true });
  } catch {
    res.status(400).json({ error: "Email exists" });
  }
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
  res.json({ token });
});

app.post("/auth/google", async (req, res) => {
  const { idToken } = req.body;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: "google-oauth",
      },
    });
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (err) {
    console.error("Google auth error:", err);
    res.status(401).json({ error: "Invalid Google token" });
  }
});

// ✅ Profile & Consent
app.post("/profile", authenticateToken, async (req, res) => {
  const { fullName, dob, city, incomeRangeMonthly, primaryBank } = req.body;
  const profile = await prisma.profile.upsert({
    where: { userId: req.user.userId },
    update: { fullName, dob: new Date(dob), city, incomeRangeMonthly: parseFloat(incomeRangeMonthly), primaryBank },
    create: { userId: req.user.userId, fullName, dob: new Date(dob), city, incomeRangeMonthly: parseFloat(incomeRangeMonthly), primaryBank },
  });
  res.json(profile);
});

app.post("/consent", authenticateToken, async (req, res) => {
  const profile = await prisma.profile.update({
    where: { userId: req.user.userId },
    data: { consentAccepted: true },
  });
  res.json(profile);
});

app.post("/expenses", authenticateToken, async (req, res) => {
  const expenses = req.body.expenses;
  await Promise.all(
    expenses.map((e) =>
      prisma.userMonthlyExpense.upsert({
        where: { userId_categoryKey: { userId: req.user.userId, categoryKey: e.categoryKey } },
        update: { amount: e.amount },
        create: { userId: req.user.userId, categoryKey: e.categoryKey, amount: e.amount },
      })
    )
  );
  res.json({ success: true });
});

app.get("/dashboard", authenticateToken, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    include: { profile: true, expenses: true },
  });
  res.json(user);
});

app.get("/auth/status", authenticateToken, async (req, res) => {
  const profile = await prisma.profile.findUnique({ where: { userId: req.user.userId } });
  res.json({ profile: !!profile, consent: profile?.consentAccepted ?? false });
});

// ✅ Gmail OAuth & PDF Parse
app.get("/auth/gmail", authenticateToken, (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/userinfo.email"],
    state: req.user.userId,
  });
  res.redirect(url);
});

app.get("/auth/gmail/callback", async (req, res) => {
  const { code, state: userId } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const messageList = await gmail.users.messages.list({
      userId: "me",
      maxResults: 1,
      q: "subject:statement OR subject:e‑statement",
    });

    const messageId = messageList.data.messages?.[0]?.id;
    if (!messageId) return res.send("❌ No statement found");

    const message = await gmail.users.messages.get({ userId: "me", id: messageId });
    const parts = message.data.payload.parts || [];
    const attachmentPart = parts.find(p => p.filename?.toLowerCase().endsWith(".pdf") && p.body?.attachmentId);

    if (!attachmentPart) return res.send("❌ No PDF attachment found.");

    const attachment = await gmail.users.messages.attachments.get({
      userId: "me",
      messageId,
      id: attachmentPart.body.attachmentId,
    });

    const buffer = Buffer.from(attachment.data.data, "base64");
    const parsed = await pdfParse(buffer);

    await prisma.statement.create({
      data: { userId, content: parsed.text },
    });

    res.redirect("http://localhost:5173/dashboard");
  } catch (err) {
    console.error("/auth/gmail/callback error:", err);
    res.status(500).send("❌ Gmail parsing failed");
  }
});

app.get("/statements", authenticateToken, async (req, res) => {
  const statements = await prisma.statement.findMany({
    where: { userId: req.user.userId },
    orderBy: { createdAt: "desc" },
  });
  res.json(statements);
});

// ✅ Seeder
const seedCategories = async () => {
  const categories = ["travel", "utilities", "groceries", "shopping", "dining", "food_delivery"];
  await Promise.all(categories.map((key) =>
    prisma.expenseCategory.upsert({
      where: { key },
      update: {},
      create: { key, displayName: key.charAt(0).toUpperCase() + key.slice(1).replace("_", " ") },
    })
  ));
};

const seedMockUser = async () => {
  await prisma.user.upsert({
    where: { id: "mock-user-id" },
    update: {},
    create: { id: "mock-user-id", email: "mock@phone.com", passwordHash: "mock" },
  });
};

Promise.all([seedCategories(), seedMockUser()])
  .then(() => app.listen(3001, () => console.log("🚀 Server running on http://localhost:3001")))
  .catch((err) => {
    console.error("❌ Seeder error:", err);
    process.exit(1);
  });