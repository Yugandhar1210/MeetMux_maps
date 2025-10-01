import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import Home from "./pages/Home.jsx";
import Profile from "./pages/Profile.jsx";
import Login from "./components/Login.jsx";
import Register from "./components/Register.jsx";

function Navigation() {
  const location = useLocation();
  const isAuthed = !!localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="logo">
          <div className="logo-icon">
            <span className="logo-text">M</span>
          </div>
          <span className="logo-title">MeetMux</span>
        </Link>

        {/* Navigation Links */}
        <nav className="nav-links">
          <Link
            to="/"
            className={`nav-link ${isActive("/") ? "nav-link-active" : ""}`}
          >
            <span className="nav-icon">🏠</span>
            <span>Home</span>
          </Link>

          {isAuthed ? (
            <>
              <Link
                to="/profile"
                className={`nav-link ${
                  isActive("/profile") ? "nav-link-active" : ""
                }`}
              >
                <span className="nav-icon">👤</span>
                <span>Profile</span>
              </Link>

              <div className="nav-divider"></div>

              <button onClick={handleLogout} className="logout-button">
                <span className="nav-icon">🚪</span>
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={`nav-link ${
                  isActive("/login") ? "nav-link-active" : ""
                }`}
              >
                <span className="nav-icon">🔑</span>
                <span>Login</span>
              </Link>

              <Link to="/register" className="signup-button">
                <span className="nav-icon">✨</span>
                <span>Sign Up</span>
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* Animated gradient line */}
      <div className="navbar-gradient-line"></div>
    </header>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Navigation />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
