import { useEffect, useState } from "react";
import { Bell, Menu, ShieldCheck, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import API from "../services/api";

const NAV_HEIGHT = 84;

const getSavedUser = () => {
  try {
    const rawUser = localStorage.getItem("user");
    if (!rawUser || rawUser === "undefined") return null;
    return JSON.parse(rawUser);
  } catch (error) {
    console.error("Navbar user parse error:", error);
    return null;
  }
};

function Navbar() {
  const location = useLocation();
  const user = getSavedUser();
  const [notificationCount, setNotificationCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      const nextIsMobile = window.innerWidth < 1024;
      setIsMobile(nextIsMobile);
      if (!nextIsMobile) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await API.get("/api/notifications/all");
        setNotificationCount(Array.isArray(response.data) ? response.data.length : 0);
      } catch (error) {
        console.error("Navbar notification fetch error:", error);
      }
    };

    if (user) {
      fetchNotifications();
    }
  }, [user]);

  if (!user) {
    return null;
  }

  const role = user.role;
  const notificationTarget = role === "teacher" ? "/teacher-panel" : "/notifications";
  const dashboardTarget = role === "teacher" ? "/teacher-panel" : "/dashboard";
  const navLinks =
    role === "teacher"
      ? [
          { label: "Teacher Panel", to: "/teacher-panel" },
          { label: "Schedule", to: "/schedule" },
        ]
      : [
          { label: "Dashboard", to: "/dashboard" },
          { label: "Exam", to: "/exam" },
          { label: "Quiz", to: "/quiz" },
          { label: "Results", to: "/results" },
          { label: "Assignments", to: "/assignment-list" },
          { label: "Schedule", to: "/schedule" },
        ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <nav
      style={{
        position: "fixed",
        inset: "0 0 auto 0",
        height: `${NAV_HEIGHT}px`,
        zIndex: 2200,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "24px",
        padding: isMobile ? "16px 18px" : "16px 34px",
        background:
          "linear-gradient(120deg, rgba(25,35,88,0.98) 0%, rgba(17,94,89,0.96) 46%, rgba(30,64,175,0.96) 100%)",
        boxShadow: "0 20px 45px rgba(15, 23, 42, 0.18)",
        backdropFilter: "blur(16px)",
      }}
    >
      <Link
        to={dashboardTarget}
        style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}
      >
        <div
          style={{
            width: isMobile ? "42px" : "48px",
            height: isMobile ? "42px" : "48px",
            borderRadius: "16px",
            display: "grid",
            placeItems: "center",
            background: "linear-gradient(135deg, rgba(255,255,255,0.16), rgba(255,255,255,0.04))",
            border: "1px solid rgba(255,255,255,0.18)",
          }}
        >
          <ShieldCheck size={isMobile ? 22 : 26} color="#f8fafc" />
        </div>
        <div style={{ textAlign: "left" }}>
          <div
            style={{
              color: "#ffffff",
              fontWeight: 900,
              fontSize: isMobile ? "22px" : "30px",
              letterSpacing: "0.08em",
              lineHeight: 1,
            }}
          >
            PROCTOR-AI
          </div>
          {!isMobile ? (
            <div style={{ color: "rgba(255,255,255,0.78)", fontSize: "12px" }}>
              {role === "teacher" ? "Teacher operations suite" : "Secure exam intelligence suite"}
            </div>
          ) : null}
        </div>
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "12px" : "18px" }}>
        <div
          style={{
            display: isMobile ? (isMenuOpen ? "flex" : "none") : "flex",
            flexDirection: isMobile ? "column" : "row",
            position: isMobile ? "absolute" : "static",
            top: `${NAV_HEIGHT}px`,
            left: isMobile ? "16px" : "auto",
            right: isMobile ? "16px" : "auto",
            width: isMobile ? "calc(100% - 32px)" : "auto",
            padding: isMobile ? "18px" : 0,
            borderRadius: isMobile ? "24px" : 0,
            background: isMobile
              ? "linear-gradient(180deg, rgba(20,27,65,0.98), rgba(14,116,144,0.96))"
              : "transparent",
            border: isMobile ? "1px solid rgba(255,255,255,0.1)" : "none",
            boxShadow: isMobile ? "0 22px 40px rgba(15, 23, 42, 0.28)" : "none",
            gap: isMobile ? "10px" : "8px",
          }}
        >
          {navLinks.map((link) => {
            const active = location.pathname === link.to;

            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsMenuOpen(false)}
                style={{
                  padding: isMobile ? "12px 14px" : "11px 16px",
                  borderRadius: "14px",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: isMobile ? "16px" : "15px",
                  background: active ? "rgba(255,255,255,0.14)" : "transparent",
                  border: active
                    ? "1px solid rgba(255,255,255,0.16)"
                    : "1px solid transparent",
                  whiteSpace: "nowrap",
                }}
              >
                {link.label}
              </Link>
            );
          })}

          <div
            style={{
              padding: isMobile ? "12px 14px" : "11px 16px",
              borderRadius: "14px",
              color: "#fff",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              fontWeight: 700,
            }}
          >
            {role === "teacher" ? "Teacher" : "Student"} | {user.name}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              border: "none",
              padding: isMobile ? "12px 14px" : "12px 20px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #ff7a18, #ff4d4f)",
              color: "#fff",
              fontWeight: 800,
              boxShadow: "0 12px 24px rgba(255, 77, 79, 0.24)",
              minWidth: isMobile ? "100%" : "auto",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>

        <Link
          to={notificationTarget}
          style={{
            position: "relative",
            display: "grid",
            placeItems: "center",
            width: isMobile ? "42px" : "46px",
            height: isMobile ? "42px" : "46px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <Bell color="#fff" size={isMobile ? 21 : 23} />
          {notificationCount > 0 ? (
            <span
              style={{
                position: "absolute",
                top: "-6px",
                right: "-4px",
                minWidth: "22px",
                height: "22px",
                padding: "0 6px",
                borderRadius: "999px",
                display: "grid",
                placeItems: "center",
                background: "#facc15",
                color: "#111827",
                fontWeight: 800,
                fontSize: "11px",
                boxShadow: "0 8px 16px rgba(250, 204, 21, 0.35)",
              }}
            >
              {notificationCount}
            </span>
          ) : null}
        </Link>

        {isMobile ? (
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            style={{
              display: "grid",
              placeItems: "center",
              width: "42px",
              height: "42px",
              borderRadius: "14px",
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
            }}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        ) : null}
      </div>
    </nav>
  );
}

export default Navbar;
