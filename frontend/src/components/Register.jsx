import { useState } from "react";
import { authApi } from "../utils/api"; // changed

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await authApi.register({ name, email, password }); // changed
      localStorage.setItem("token", data.token);
      window.location.href = "/";
    } catch (err) {
      setError(err?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={onSubmit}
        className="bg-white p-6 rounded shadow w-full max-w-sm"
      >
        <h1 className="text-xl font-semibold mb-4">Create account</h1>
        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
        <label className="block text-sm mb-1">Name</label>
        <input
          className="border rounded w-full p-2 mb-3"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <label className="block text-sm mb-1">Email</label>
        <input
          className="border rounded w-full p-2 mb-3"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label className="block text-sm mb-1">Password</label>
        <input
          className="border rounded w-full p-2 mb-4"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          className="w-full bg-blue-600 text-white py-2 rounded"
          disabled={loading}
        >
          {loading ? "Creating..." : "Register"}
        </button>
        <p className="text-sm mt-3">
          Have an account?{" "}
          <a className="text-blue-600" href="/login">
            Login
          </a>
        </p>
      </form>
    </div>
  );
}
