import { useEffect, useState } from "react";
import { Bell, Menu, ShieldCheck, X, MessageCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import API from "../services/api";
import { clearAuthSession, getAuthUser } from "../utils/authSession";

const NAV_HEIGHT = 84;

function Navbar() {
  const location = useLocation();
  const user = getAuthUser();
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
  const notificationTarget =
    role === "admin"
      ? "/admin-panel?tab=content"
      : role === "teacher"
      ? "/teacher-panel?tab=announcements"
      : "/notifications";
  const dashboardTarget =
    role === "admin" ? "/admin-panel" : role === "teacher" ? "/teacher-panel" : "/dashboard";
  const navLinks =
    role === "admin"
      ? [{ label: "Admin Panel", to: "/admin-panel" }]
      : role === "teacher"
      ? [
          { label: "Teacher Panel", to: "/teacher-panel" },
          { label: "Schedule", to: "/schedule" },
          { label: "Profile", to: "/profile" },
        ]
      : [
          { label: "Dashboard", to: "/dashboard" },
          { label: "Results", to: "/results" },
          { label: "Assignments", to: "/assignment-list" },
          { label: "Schedule", to: "/schedule" },
          { label: "Profile", to: "/profile" },
        ];

  const handleLogout = () => {
    clearAuthSession();
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
        justifyContent: "center",
        padding: isMobile ? "12px 14px" : "12px 30px",
        background: "rgba(6, 15, 40, 0.92)",
        boxShadow: "0 18px 40px rgba(5, 12, 35, 0.22)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(20px)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1440px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "20px",
        }}
      >
        <Link
          to={dashboardTarget}
          style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}
        >
          <div
            style={{
              width: isMobile ? "40px" : "46px",
              height: isMobile ? "40px" : "46px",
              borderRadius: "16px",
              display: "grid",
              placeItems: "center",
              background: "linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.04))",
              border: "1px solid rgba(255,255,255,0.14)",
            }}
          >
            <ShieldCheck size={isMobile ? 20 : 24} color="#f8fafc" />
          </div>
          <div style={{ textAlign: "left" }}>
            <div
              style={{
                color: "#fff",
                fontWeight: 900,
                fontSize: isMobile ? "20px" : "26px",
                letterSpacing: "0.08em",
                lineHeight: 1,
              }}
            >
              PROCTOR-AI
            </div>
            {!isMobile ? (
              <div style={{ color: "rgba(255,255,255,0.72)", fontSize: "12px" }}>
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
              top: `${NAV_HEIGHT + 10}px`,
              left: isMobile ? "12px" : "auto",
              right: isMobile ? "12px" : "auto",
              width: isMobile ? "calc(100% - 24px)" : "auto",
              padding: isMobile ? "18px" : 0,
              borderRadius: isMobile ? "22px" : 0,
              background: isMobile
                ? "linear-gradient(180deg, rgba(8, 18, 48, 0.98), rgba(16, 95, 110, 0.96))"
                : "transparent",
              border: isMobile ? "1px solid rgba(255,255,255,0.12)" : "none",
              boxShadow: isMobile ? "0 20px 50px rgba(0, 0, 0, 0.22)" : "none",
              gap: isMobile ? "10px" : "12px",
              alignItems: isMobile ? "stretch" : "center",
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
                    padding: isMobile ? "14px 16px" : "10px 18px",
                    borderRadius: "16px",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: isMobile ? "15px" : "14px",
                    background: active ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)",
                    border: active ? "1px solid rgba(255,255,255,0.18)" : "1px solid transparent",
                    whiteSpace: "nowrap",
                    transition: "transform 180ms ease, background 180ms ease",
                  }}
                >
                  {link.label}
                </Link>
              );
            })}

            <button
              type="button"
              onClick={handleLogout}
              style={{
                border: "none",
                padding: isMobile ? "14px 16px" : "12px 22px",
                borderRadius: "18px",
                background: "linear-gradient(135deg, #ff6f45, #ff3d4d)",
                color: "#fff",
                fontWeight: 800,
                boxShadow: "0 10px 24px rgba(255, 77, 79, 0.24)",
                cursor: "pointer",
                minWidth: isMobile ? "100%" : "120px",
                transition: "transform 180ms ease",
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
              width: isMobile ? "44px" : "48px",
              height: isMobile ? "44px" : "48px",
              borderRadius: "16px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <Bell color="#fff" size={isMobile ? 20 : 22} />
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
                  boxShadow: "0 8px 18px rgba(250, 204, 21, 0.28)",
                }}
              >
                {notificationCount}
              </span>
            ) : null}
          </Link>

          <Link
            to="/chat"
            style={{
              position: "relative",
              display: "grid",
              placeItems: "center",
              width: isMobile ? "44px" : "48px",
              height: isMobile ? "44px" : "48px",
              borderRadius: "16px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
            title="Messages"
          >
            <MessageCircle color="#fff" size={isMobile ? 20 : 22} />
          </Link>

          {isMobile ? (
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              style={{
                display: "grid",
                placeItems: "center",
                width: "44px",
                height: "44px",
                borderRadius: "16px",
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.08)",
                color: "#fff",
              }}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          ) : null}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
