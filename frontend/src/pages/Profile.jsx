import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Profile() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    dob: "",
    city: "",
    incomeRangeMonthly: "",
    primaryBank: ""
  });

  const [expenses, setExpenses] = useState({
    travel: "",
    utilities: "",
    groceries: "",
    shopping: "",
    dining: "",
    food_delivery: ""
  });

  const submit = async () => {
    try {
      await axios.post("http://localhost:3001/profile", form, {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") }
      });

      await axios.post(
        "http://localhost:3001/expenses",
        {
          expenses: Object.entries(expenses).map(([categoryKey, amount]) => ({
            categoryKey,
            amount: parseFloat(amount)
          }))
        },
        {
          headers: { Authorization: "Bearer " + localStorage.getItem("token") }
        }
      );

      navigate("/consent");
    } catch {
      alert("Error submitting profile");
    }
  };

  return (
    <div className="max-w-md p-6 mx-auto mt-6 bg-white shadow-md rounded-xl">
      <h1 className="mb-4 text-2xl font-bold text-center text-teal-700">Profile Details</h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700">Full Name</label>
          <input
            type="text"
            className="w-full p-2 border rounded border-zinc-300 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">Date of Birth</label>
          <input
            type="date"
            className="w-full p-2 border rounded border-zinc-300 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
            value={form.dob}
            onChange={(e) => setForm({ ...form, dob: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">City</label>
          <input
            type="text"
            className="w-full p-2 border rounded border-zinc-300 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">Monthly Income (₹)</label>
          <input
            type="number"
            className="w-full p-2 border rounded border-zinc-300 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
            value={form.incomeRangeMonthly}
            onChange={(e) => setForm({ ...form, incomeRangeMonthly: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">Primary Bank</label>
          <input
            type="text"
            className="w-full p-2 border rounded border-zinc-300 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
            value={form.primaryBank}
            onChange={(e) => setForm({ ...form, primaryBank: e.target.value })}
          />
        </div>
      </div>

      <h2 className="mt-6 mb-2 text-lg font-semibold text-teal-700">Monthly Expenses (₹)</h2>
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(expenses).map(([key, val]) => (
          <div key={key}>
            <label className="block text-sm capitalize text-zinc-700">{key.replace("_", " ")}</label>
            <input
              type="number"
              className="w-full p-2 border rounded border-zinc-300 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={val}
              onChange={(e) => setExpenses({ ...expenses, [key]: e.target.value })}
            />
          </div>
        ))}
      </div>

      <button
        onClick={submit}
        className="w-full py-2 mt-6 text-white transition bg-teal-600 rounded hover:bg-teal-700"
      >
        Next
      </button>
    </div>
  );
}
