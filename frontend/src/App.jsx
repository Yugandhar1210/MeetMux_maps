import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Profile from "./pages/Profile.jsx";
import Login from "./components/Login.jsx";
import Register from "./components/Register.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <header className="w-full border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-semibold">
            MeetMux
          </Link>
          <nav className="space-x-3">
            <Link to="/" className="px-3 py-1 border rounded">
              Home
            </Link>
            <Link to="/profile" className="px-3 py-1 border rounded">
              Profile
            </Link>
            <Link to="/login" className="px-3 py-1 border rounded">
              Login
            </Link>
            <Link to="/register" className="px-3 py-1 border rounded">
              Sign Up
            </Link>
          </nav>
        </div>
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}
