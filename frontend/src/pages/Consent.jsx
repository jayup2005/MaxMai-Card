import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Consent() {
  const [checked, setChecked] = useState(false);
  const navigate = useNavigate();

  const submit = async () => {
    if (!checked) return alert("Please accept the terms.");
    try {
      await axios.post("http://localhost:3001/consent", {}, {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      });
      navigate("/dashboard");
    } catch (err) {
      alert("Error submitting consent.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-gradient-to-br from-slate-100 to-teal-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-xl">
        <h1 className="mb-4 text-2xl font-bold text-center text-teal-700">
          Consent Required
        </h1>

        <p className="mb-6 text-sm text-center text-zinc-700">
          Please review and accept our Terms & Conditions to continue using the app. We respect your privacy and only collect data with your consent.
        </p>

        <div className="flex items-start mb-6 space-x-3">
          <input
            id="terms"
            type="checkbox"
            className="w-5 h-5 mt-1 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
            onChange={(e) => setChecked(e.target.checked)}
          />
          <label htmlFor="terms" className="text-sm text-gray-800">
            I agree to the <span className="underline cursor-pointer text-amber-600">Terms & Conditions</span>
          </label>
        </div>

        <button
          onClick={submit}
          disabled={!checked}
          className={`w-full py-2.5 rounded-md font-semibold text-white transition ${
            checked ? "bg-teal-600 hover:bg-teal-700" : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Submit & Continue
        </button>
      </div>
    </div>
  );
}
