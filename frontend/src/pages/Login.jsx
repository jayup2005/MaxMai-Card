import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Mail, Lock, Phone, KeyRound } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [method, setMethod] = useState("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const googleButtonRef = useRef();

  const checkUserFlow = async () => {
    try {
      const res = await axios.get("http://localhost:3001/auth/status", {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      });
      const { profile, consent } = res.data;
      if (!profile) return navigate("/profile");
      if (!consent) return navigate("/consent");
      navigate("/dashboard");
    } catch {
      navigate("/profile");
    }
  };

  const handleSubmit = async () => {
    if (method === "email") {
      if (!email || !password) return alert("Email and password required");
      try {
        if (isLogin) {
          const res = await axios.post("http://localhost:3001/auth/login", { email, password });
          localStorage.setItem("token", res.data.token);
          checkUserFlow();
        } else {
          await axios.post("http://localhost:3001/auth/register", { email, password });
          alert("Registered! Please log in.");
          setIsLogin(true);
        }
      } catch {
        alert("Authentication failed");
      }
    } else {
      if (!phone) return alert("Phone number required");
      if (!showOtpInput) {
        alert("📲 Mock OTP sent: 123456");
        setShowOtpInput(true);
        return;
      }
      if (otp !== "123456") return alert("Invalid OTP (Hint: use 123456)");
      localStorage.setItem("token", "mock-phone-token");
      checkUserFlow();
    }
  };

  const handleGoogleResponse = async (response) => {
    try {
      const res = await axios.post("http://localhost:3001/auth/google", {
        idToken: response.credential,
      });
      localStorage.setItem("token", res.data.token);
      checkUserFlow();
    } catch (err) {
      console.error("Google login failed:", err);
      alert("Google login error");
    }
  };

  useEffect(() => {
    if (!window.google || !googleButtonRef.current) return;

    window.google.accounts.id.initialize({
      client_id: "888140845830-oktuoa2egt6ifegj5jdcrn13oangbsvd.apps.googleusercontent.com",
      callback: handleGoogleResponse,
    });

    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: "outline",
      size: "large",
      type: "standard",
    });
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-gradient-to-br from-slate-100 to-teal-100">
      <div className="w-full max-w-md p-8 bg-white shadow-xl rounded-2xl">
        <h1 className="mb-6 text-3xl font-bold text-center text-teal-700">
          {isLogin ? "Welcome Back" : "Create an Account"}
        </h1>

        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setMethod("email")}
            className={`px-4 py-1 rounded-full border transition ${
              method === "email"
                ? "bg-teal-600 text-white border-teal-600"
                : "bg-zinc-100 text-zinc-700 border-zinc-300"
            }`}
          >
            Email
          </button>
          <button
            onClick={() => setMethod("phone")}
            className={`px-4 py-1 rounded-full border transition ${
              method === "phone"
                ? "bg-teal-600 text-white border-teal-600"
                : "bg-zinc-100 text-zinc-700 border-zinc-300"
            }`}
          >
            Phone
          </button>
        </div>

        {method === "email" ? (
          <>
            <div className="flex items-center px-3 py-2 mb-3 rounded bg-zinc-100">
              <Mail className="w-4 h-4 mr-2 text-zinc-500" />
              <input
                type="email"
                placeholder="Email"
                autoComplete="email"
                className="w-full text-sm bg-transparent outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex items-center px-3 py-2 mb-4 rounded bg-zinc-100">
              <Lock className="w-4 h-4 mr-2 text-zinc-500" />
              <input
                type="password"
                placeholder="Password"
                autoComplete="current-password"
                className="w-full text-sm bg-transparent outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center px-3 py-2 mb-3 rounded bg-zinc-100">
              <Phone className="w-4 h-4 mr-2 text-zinc-500" />
              <input
                type="tel"
                placeholder="Phone number"
                autoComplete="tel"
                className="w-full text-sm bg-transparent outline-none"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            {showOtpInput && (
              <div className="flex items-center px-3 py-2 mb-3 rounded bg-zinc-100">
                <KeyRound className="w-4 h-4 mr-2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Enter OTP"
                  className="w-full text-sm bg-transparent outline-none"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
            )}
          </>
        )}

        <button
          onClick={handleSubmit}
          className="w-full py-2 font-semibold text-white transition bg-teal-600 rounded hover:bg-teal-700"
        >
          {isLogin ? "Login" : "Register"}
        </button>

        <p className="mt-4 text-sm text-center text-zinc-600">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setShowOtpInput(false);
              setOtp("");
            }}
            className="font-medium text-amber-600 hover:underline"
          >
            {isLogin ? "Register" : "Login"}
          </button>
        </p>

        <div className="my-5">
          <div className="mb-2 text-sm text-center text-zinc-500">or sign in with</div>
          <div ref={googleButtonRef} className="flex justify-center" />
        </div>
      </div>
    </div>
  );
}
