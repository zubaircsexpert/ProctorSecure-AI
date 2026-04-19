import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Menu, X } from "lucide-react";
import axios from "axios";

const Navbar = () => {
  const [notificationCount, setNotificationCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024); // Professional break-point 1024px
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth > 1024) setIsMenuOpen(false);
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

  // --- Dynamic Styles for "VIP" Look ---
  const navStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: isMobile ? "0 20px" : "0 60px", // Laptop par zyada padding for premium feel
    background: "linear-gradient(135deg, #1a2a6c, #b21f1f)", // 135deg for better gradient flow
    height: "75px",
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    boxSizing: "border-box",
    zIndex: 2000,
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
  };

  const menuContainer = {
    display: isMobile ? (isMenuOpen ? "flex" : "none") : "flex",
    flexDirection: isMobile ? "column" : "row",
    position: isMobile ? "absolute" : "static",
    top: isMobile ? "75px" : "auto",
    left: 0,
    width: isMobile ? "100%" : "auto",
    background: isMobile ? "rgba(26, 42, 108, 0.98)" : "transparent", // Blur effect style for mobile
    padding: isMobile ? "30px 20px" : "0",
    alignItems: "center",
    gap: isMobile ? "20px" : "15px", // Professional spacing between links
    transition: "all 0.4s ease-in-out",
    backdropFilter: isMobile ? "blur(10px)" : "none",
  };

  const linkStyle = {
    color: "#fff",
    padding: "10px 15px",
    textDecoration: "none",
    fontSize: isMobile ? "18px" : "15px",
    fontWeight: "600",
    borderRadius: "8px",
    transition: "0.3s",
    borderBottom: isMobile ? "1px solid rgba(255,255,255,0.1)" : "none",
    width: isMobile ? "100%" : "auto",
    textAlign: "center",
  };

  return (
    <nav style={navStyle}>
      {/* --- LOGO --- */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <h2 style={{ 
          color: "#fff", 
          margin: 0, 
          fontSize: isMobile ? "20px" : "26px", 
          fontWeight: "900", 
          letterSpacing: "2px",
          textShadow: "2px 2px 4px rgba(0,0,0,0.3)" 
        }}>
          PROCTOR-AI
        </h2>
      </div>

      {/* --- ACTIONS & NAVIGATION --- */}
      <div style={{ display: "flex", alignItems: "center" }}>
        
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
          
          <button 
            onClick={handleLogout} 
            style={{ 
              ...logoutBtn, 
              width: isMobile ? "100%" : "auto",
              marginTop: isMobile ? "10px" : "0" 
            }}
          >
            Logout
          </button>
        </div>

        {/* 🔔 Notifications */}
        <div style={{ position: "relative", marginLeft: isMobile ? "15px" : "25px", cursor: "pointer" }}>
          <Link to="/notifications" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
            <Bell size={isMobile ? 22 : 24} color="#fff" strokeWidth={2.5} />
            {notificationCount > 0 && (
              <span style={badgeStyle}>{notificationCount}</span>
            )}
          </Link>
        </div>

        {/* 🍔 Hamburger for Mobile */}
        {isMobile && (
          <div 
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            style={{ cursor: "pointer", color: "#fff", marginLeft: "20px" }}
          >
            {isMenuOpen ? <X size={32} /> : <Menu size={32} />}
          </div>
        )}
      </div>
    </nav>
  );
};

// --- Constant Styles for Premium Look ---
const badgeStyle = {
  position: "absolute",
  top: "-8px",
  right: "-10px",
  background: "#ffc107",
  color: "#000",
  fontSize: "11px",
  fontWeight: "bold",
  width: "20px",
  height: "20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "50%",
  boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
};

const logoutBtn = {
  background: "#ff4b2b",
  padding: "10px 24px",
  borderRadius: "8px",
  color: "#fff",
  border: "none",
  cursor: "pointer",
  marginLeft: "15px",
  fontSize: "14px",
  fontWeight: "bold",
  boxShadow: "0 4px 10px rgba(255, 75, 43, 0.3)",
  transition: "0.3s",
};

export default Navbar;