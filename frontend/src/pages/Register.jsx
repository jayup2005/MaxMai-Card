import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const register = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:3001/auth/register", { email, password });
      alert("Account created! Please login.");
      navigate("/");
    } catch {
      alert("Registration failed. Try a different email.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-gradient-to-br from-teal-50 to-amber-50">
      <form
        onSubmit={register}
        className="w-full max-w-sm p-8 bg-white shadow-lg rounded-xl"
      >
        <h1 className="mb-6 text-2xl font-bold text-center text-teal-700">
          Create Your Account
        </h1>

        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium text-zinc-700">Email</label>
          <input
            type="email"
            className="w-full px-3 py-2 border rounded border-zinc-300 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-5">
          <label className="block mb-1 text-sm font-medium text-zinc-700">Password</label>
          <input
            type="password"
            className="w-full px-3 py-2 border rounded border-zinc-300 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 font-semibold text-white transition bg-teal-600 rounded hover:bg-teal-700"
        >
          Register
        </button>

        <p className="mt-4 text-sm text-center text-zinc-600">
          Already registered?{" "}
          <span
            onClick={() => navigate("/")}
            className="font-medium text-teal-600 cursor-pointer hover:underline"
          >
            Login here
          </span>
        </p>
      </form>
    </div>
  );
}
