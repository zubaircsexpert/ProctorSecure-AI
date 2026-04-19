import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Menu, X } from "lucide-react"; // Hamburger icons add kiye
import axios from "axios";

const Navbar = () => {
  const [notificationCount, setNotificationCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Mobile menu state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 850);
  const navigate = useNavigate();

  // Screen size check karne ke liye
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 850);
      if (window.innerWidth > 850) setIsMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getAuthUser = () => {
    try {
      const data = localStorage.getItem("user");
      if (!data || data === "undefined") return null;
      return JSON.parse(data);
    } catch (err) {
      console.error("Local storage parse error:", err);
      return null;
    }
  };

  const user = getAuthUser();
  const role = user?.role;

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get("https://proctorsecure-ai-jkc2.onrender.com/api/notifications/all");
        if (res.data) {
          setNotificationCount(res.data.length);
        }
      } catch (err) {
        console.error("Error fetching notifications", err);
      }
    };
    if (user) { fetchNotifications(); }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  if (!user) return null;

  // --- Dynamic Styles ---
  const navStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: isMobile ? "0 20px" : "0 40px",
    background: "linear-gradient(90deg, #1a2a6c, #b21f1f)",
    height: "70px",
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    boxSizing: "border-box",
    zIndex: 2000,
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
  };

  const menuContainer = {
    display: isMobile ? (isMenuOpen ? "flex" : "none") : "flex",
    flexDirection: isMobile ? "column" : "row",
    position: isMobile ? "absolute" : "static",
    top: isMobile ? "70px" : "auto",
    left: 0,
    width: isMobile ? "100%" : "auto",
    background: isMobile ? "#1a2a6c" : "transparent",
    padding: isMobile ? "20px" : "0",
    alignItems: "center",
    gap: isMobile ? "15px" : "5px",
    transition: "0.3s ease",
  };

  const linkStyle = {
    color: "#fff",
    padding: "8px 12px",
    textDecoration: "none",
    fontSize: isMobile ? "16px" : "14px",
    fontWeight: "600",
    borderRadius: "5px",
    width: isMobile ? "100%" : "auto",
    textAlign: isMobile ? "center" : "left",
  };

  return (
    <nav style={navStyle}>
      {/* --- LEFT SIDE: LOGO --- */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <h2 style={{ color: "#fff", margin: 0, fontSize: isMobile ? "18px" : "24px", fontWeight: "900", letterSpacing: "1.5px" }}>
          PROCTOR-AI
        </h2>
      </div>

      {/* --- RIGHT SIDE: ACTIONS --- */}
      <div style={{ display: "flex", alignItems: "center" }}>
        
        {/* Menu Links */}
        <div style={menuContainer}>
          {role === "student" && (
            <>
              <Link to="/dashboard" style={linkStyle} onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
              <Link to="/exam" style={linkStyle} onClick={() => setIsMenuOpen(false)}>Exam</Link>
              <Link to="/results" style={linkStyle} onClick={() => setIsMenuOpen(false)}>Results</Link>
              <Link to="/assignment-list" style={linkStyle} onClick={() => setIsMenuOpen(false)}>Assignments</Link>
            </>
          )}

          {role === "teacher" && (
            <>
              <Link to="/teacher-panel" style={linkStyle} onClick={() => setIsMenuOpen(false)}>Teacher Panel</Link>
              <Link to="/all-results" style={linkStyle} onClick={() => setIsMenuOpen(false)}>Student Results</Link>
            </>
          )}

          <Link to="/schedule" style={linkStyle} onClick={() => setIsMenuOpen(false)}>Schedule</Link>
          
          <button onClick={handleLogout} style={{ ...logoutBtn, width: isMobile ? "80%" : "auto" }}>Logout</button>
        </div>

        {/* 🔔 Notification Icon (Hamesha dikhayi dega) */}
        <div style={{ position: "relative", margin: "0 15px", cursor: "pointer" }}>
          <Link to="/notifications" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
            <Bell size={isMobile ? 20 : 22} color="#fff" strokeWidth={2} />
            {notificationCount > 0 && (
              <span style={badgeStyle}>{notificationCount}</span>
            )}
          </Link>
        </div>

        {/* 🍔 Hamburger Button (Sirf Mobile par) */}
        {isMobile && (
          <div onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ cursor: "pointer", color: "#fff", marginLeft: "10px" }}>
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </div>
        )}
      </div>
    </nav>
  );
};

// --- Constant Styles ---
const badgeStyle = {
  position: "absolute",
  top: "-5px",
  right: "-8px",
  background: "#ffc107",
  color: "#000",
  fontSize: "10px",
  fontWeight: "bold",
  width: "18px",
  height: "18px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "50%",
};

const logoutBtn = {
  background: "#ff4b2b",
  padding: "8px 20px",
  borderRadius: "6px",
  color: "#fff",
  border: "none",
  cursor: "pointer",
  marginLeft: "10px",
  fontSize: "14px",
  fontWeight: "bold",
};

export default Navbar;