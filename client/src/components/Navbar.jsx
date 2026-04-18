import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell } from "lucide-react"; 
import axios from "axios";

const Navbar = () => {
  const [notificationCount, setNotificationCount] = useState(0);
  const navigate = useNavigate();

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
        const res = await axios.get("http://localhost:5000/api/notifications/all");
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

  return (
    <nav style={navStyle}>
      {/* --- LEFT SIDE: LOGO --- */}
      <div style={logoWrapper}>
        <h2 style={logoStyle}>PROCTOR-AI</h2>
      </div>

      {/* --- RIGHT SIDE: ALL LINKS & ACTIONS --- */}
      <div style={menuContainer}>
        {role === "student" && (
          <>
            <Link to="/dashboard" style={linkStyle}>Dashboard</Link>
            <Link to="/exam" style={linkStyle}>Exam</Link>
            <Link to="/results" style={linkStyle}>Results</Link>
            <Link to="/assignment-list" style={linkStyle}>Assignments</Link>
          </>
        )}

        {role === "teacher" && (
          <>
            <Link to="/teacher-panel" style={linkStyle}>Teacher Panel</Link>
            <Link to="/all-results" style={linkStyle}>Student Results</Link>
          </>
        )}

        <Link to="/schedule" style={linkStyle}>Schedule</Link>

        {/* 🔔 Notification Icon */}
        <div style={iconWrapper}>
          <Link to="/notifications" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
            <Bell size={22} color="#fff" strokeWidth={2} />
            {notificationCount > 0 && (
              <span style={badgeStyle}>
                {notificationCount}
              </span>
            )}
          </Link>
        </div>

        {/* Logout Button */}
        <button onClick={handleLogout} style={logoutBtn}>Logout</button>
      </div>
    </nav>
  );
};

// --- Updated UI Styles (Full Width Fix) ---

const navStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0 40px", 
  background: "linear-gradient(90deg, #1a2a6c, #b21f1f)",
  height: "70px",
  // ✅ Fixed Full Width Properties
  position: "fixed", // Sticky ki bajaye fixed use karen taake layout shift na ho
  top: 0,
  left: 0,
  width: "100%", // Poori screen width
  boxSizing: "border-box", // Padding ko width ke andar rakhne ke liye
  zIndex: 2000, // Sab se upar rakhne ke liye
  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
};

const logoWrapper = {
  display: "flex",
  alignItems: "center",
};

const logoStyle = {
  color: "#fff",
  margin: 0,
  fontSize: "24px",
  fontWeight: "900",
  letterSpacing: "1.5px",
  textTransform: "uppercase",
};

const menuContainer = {
  display: "flex",
  alignItems: "center",
  gap: "5px",
};

const linkStyle = {
  color: "#fff",
  padding: "8px 12px",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: "600",
  borderRadius: "5px",
};

const iconWrapper = {
  position: "relative",
  margin: "0 10px",
  cursor: "pointer",
};

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