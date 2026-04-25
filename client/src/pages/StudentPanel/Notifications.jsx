import React, { useEffect, useState } from "react";
import axios from "axios";
import { BellRing, CalendarDays, Megaphone, Sparkles } from "lucide-react";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get(
          "https://proctorsecure-ai-jkc2.onrender.com/api/notifications/all"
        );
        setNotifications(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Error fetching notifications", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={heroStyle}>
          <div style={heroBadge}>
            <BellRing size={16} />
            Loading announcements...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={heroStyle}>
        <div style={heroCopy}>
          <div style={heroBadge}>
            <Sparkles size={16} />
            Student Noticeboard
          </div>
          <h1 style={heroTitle}>Academic Announcements</h1>
          <p style={heroText}>
            Stay updated with class alerts, exam notices, and official
            announcements from your teacher.
          </p>
        </div>

        <div style={heroStatCard}>
          <div style={heroStatLabel}>Available Updates</div>
          <div style={heroStatValue}>{notifications.length}</div>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div style={emptyState}>
          <BellRing size={22} />
          No announcements available right now.
        </div>
      ) : (
        <div style={gridStyle}>
          {notifications.map((n) => (
            <div key={n._id} style={cardStyle}>
              <div style={cardTop}>
                <div style={titleWrap}>
                  <div style={iconWrap}>
                    <Megaphone size={18} />
                  </div>
                  <div>
                    <h3 style={titleStyle}>{n.title}</h3>
                    <div style={dateStyle}>
                      <CalendarDays size={14} />
                      {n.createdAt
                        ? new Date(n.createdAt).toLocaleDateString()
                        : "N/A"}
                    </div>
                  </div>
                </div>

                <span style={badgeStyle(n.type)}>{n.type}</span>
              </div>

              <p style={messageStyle}>{n.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const pageStyle = {
  padding: "40px 20px 56px",
  maxWidth: "1180px",
  margin: "0 auto",
  minHeight: "100vh",
};

const heroStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "20px",
  justifyContent: "space-between",
  alignItems: "stretch",
  marginBottom: "28px",
};

const heroCopy = {
  flex: "1 1 620px",
  background:
    "linear-gradient(135deg, #123c6b 0%, #1d4ed8 100%)",
  color: "#fff",
  borderRadius: "26px",
  padding: "28px",
  boxShadow: "0 20px 35px rgba(18,60,107,0.16)",
};

const heroBadge = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  padding: "8px 12px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.16)",
  color: "#fff",
  fontSize: "13px",
  fontWeight: 700,
  marginBottom: "14px",
};

const heroTitle = {
  margin: "0 0 10px 0",
  fontSize: "40px",
  lineHeight: 1.1,
};

const heroText = {
  margin: 0,
  maxWidth: "720px",
  opacity: 0.92,
  lineHeight: 1.7,
  fontSize: "15px",
};

const heroStatCard = {
  flex: "0 0 220px",
  minWidth: "220px",
  background: "#fff",
  borderRadius: "24px",
  padding: "24px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 14px 30px rgba(15,23,42,0.06)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
};

const heroStatLabel = {
  fontSize: "12px",
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: "10px",
};

const heroStatValue = {
  fontSize: "42px",
  fontWeight: 800,
  color: "#102a43",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: "18px",
};

const cardStyle = {
  background: "#fff",
  borderRadius: "22px",
  padding: "22px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 14px 28px rgba(15,23,42,0.05)",
};

const cardTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "14px",
  flexWrap: "wrap",
  marginBottom: "14px",
};

const titleWrap = {
  display: "flex",
  alignItems: "flex-start",
  gap: "12px",
};

const iconWrap = {
  width: "40px",
  height: "40px",
  borderRadius: "14px",
  background: "#eef2ff",
  color: "#1d4ed8",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const titleStyle = {
  margin: "0 0 8px 0",
  color: "#102a43",
  fontSize: "22px",
};

const dateStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  color: "#64748b",
  fontSize: "13px",
};

const messageStyle = {
  margin: 0,
  color: "#475569",
  lineHeight: 1.75,
  fontSize: "14px",
};

const emptyState = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  background: "#fff",
  borderRadius: "22px",
  border: "1px dashed #cbd5e1",
  padding: "32px",
  color: "#64748b",
  boxShadow: "0 14px 28px rgba(15,23,42,0.04)",
};

const badgeStyle = (type) => {
  if (type === "test") {
    return {
      padding: "6px 12px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: "bold",
      background: "#fff7ed",
      color: "#ea580c",
      textTransform: "capitalize",
    };
  }

  if (type === "vacation") {
    return {
      padding: "6px 12px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: "bold",
      background: "#ecfeff",
      color: "#0891b2",
      textTransform: "capitalize",
    };
  }

  return {
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "bold",
    background: "#f3f4f6",
    color: "#374151",
    textTransform: "capitalize",
  };
};

export default Notifications;
