import React, { useState } from "react";
import { authApi } from "../utils/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await authApi.login({ email, password });
      localStorage.setItem("token", data.token);
      window.location.href = "/";
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto p-4">
      <h1 className="text-xl font-semibold mb-3">Login</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="w-full border rounded px-2 py-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="w-full border rounded px-2 py-2"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button
          disabled={loading}
          className="w-full px-3 py-2 bg-blue-600 text-white rounded"
        >
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
      <div className="mt-3 text-sm">
        No account?{" "}
        <a className="text-blue-600 underline" href="/register">
          Sign up
        </a>
      </div>
    </div>
  );
}
