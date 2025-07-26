import { useEffect, useState } from "react";
import axios from "axios";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [statements, setStatements] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    axios.get("http://localhost:3001/dashboard", {
      headers: { Authorization: "Bearer " + token }
    }).then(res => setData(res.data));

    axios.get("http://localhost:3001/statements", {
      headers: { Authorization: "Bearer " + token }
    }).then(res => setStatements(res.data));
  }, []);

  const connectGmail = () => {
    const token = localStorage.getItem("token");
    window.location.href = `http://localhost:3001/auth/gmail?token=${token}`;
  };

  if (!data) return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-lg text-gray-500 animate-pulse">Loading your dashboard...</p>
    </div>
  );

  return (
    <div className="min-h-screen px-4 py-8 bg-slate-100">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h1 className="mb-2 text-2xl font-bold text-teal-700">
            👋 Hello, {data.profile?.fullName}
          </h1>
          <p className="text-sm text-zinc-600">Welcome back to your dashboard</p>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="mb-4 text-lg font-semibold text-teal-600">📄 Profile Info</h2>
          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 text-zinc-800">
            <p><span className="font-medium">Email:</span> {data.email}</p>
            <p><span className="font-medium">City:</span> {data.profile?.city}</p>
            <p><span className="font-medium">Bank:</span> {data.profile?.primaryBank}</p>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="mb-4 text-lg font-semibold text-teal-600">💸 Monthly Expenses</h2>
          {data.expenses?.length ? (
            <ul className="space-y-2 text-sm text-gray-700">
              {data.expenses.map((e, i) => (
                <li key={i} className="flex justify-between pb-1 border-b">
                  <span className="capitalize">{e.categoryKey}</span>
                  <span className="font-medium text-right text-teal-800">₹{e.amount}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No expenses recorded.</p>
          )}
        </div>

        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="mb-4 text-lg font-semibold text-teal-600">📧 Gmail Statements</h2>
          {statements.length === 0 ? (
            <p className="mb-2 text-sm text-gray-500">No Gmail statements found. You can connect your Gmail below.</p>
          ) : (
            <div className="pr-1 space-y-3 overflow-y-auto max-h-64">
              {statements.map((s, i) => (
                <div
                  key={i}
                  className="p-3 text-xs text-gray-700 whitespace-pre-wrap border rounded bg-zinc-50 border-zinc-200"
                >
                  {s.content.slice(0, 500)}...
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <button
            onClick={connectGmail}
            className="w-full py-3 text-sm font-medium text-white transition bg-teal-600 rounded-lg hover:bg-teal-700"
          >
            📎 Connect Gmail to Parse Statements
          </button>
        </div>
      </div>
    </div>
  );
}
