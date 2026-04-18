import React, { useEffect, useState } from "react";
import axios from "axios";


const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // Backend se data mangwana
        const res = await axios.get("http://localhost:5000/api/notifications/all");
        setNotifications(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching notifications", err);
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  if (loading) return <div style={{color: "white", textAlign: "center", marginTop: "50px"}}>Loading Announcements...</div>;

  return (
    <div style={containerStyle}>
      <h2 style={headerStyle}>Academic Announcements 📢</h2>
      <div style={listStyle}>
        {notifications.length === 0 ? (
          <p style={{color: "#666"}}>Koi nayi notification nahi hai.</p>
        ) : (
          notifications.map((n) => (
            <div key={n._id} style={cardStyle}>
              <div style={cardHeader}>
                <h3 style={titleStyle}>{n.title}</h3>
                <span style={badgeStyle(n.type)}>{n.type}</span>
              </div>
              <p style={messageStyle}>{n.message}</p>
              <div style={cardFooter}>
                <span>👤 {n.sender}</span>
                <span>📅 {new Date(n.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// --- Professional Styles ---

const containerStyle = {
  padding: "40px 20px",
  maxWidth: "900px",
  margin: "0 auto",
  minHeight: "100vh"
};

const headerStyle = {
  color: "#1a2a6c",
  borderBottom: "3px solid #b21f1f",
  display: "inline-block",
  marginBottom: "30px",
  paddingBottom: "5px"
};

const listStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "20px"
};

const cardStyle = {
  background: "#fff",
  borderRadius: "12px",
  padding: "20px",
  boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
  borderLeft: "6px solid #1a2a6c",
  transition: "transform 0.2s",
};

const cardHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "10px"
};

const titleStyle = { margin: 0, color: "#333", fontSize: "20px" };

const messageStyle = { color: "#555", lineHeight: "1.6", fontSize: "16px" };

const cardFooter = {
  marginTop: "15px",
  display: "flex",
  justifyContent: "space-between",
  color: "#888",
  fontSize: "13px",
  borderTop: "1px solid #eee",
  paddingTop: "10px"
};

const badgeStyle = (type) => ({
  fontSize: "11px",
  padding: "4px 12px",
  borderRadius: "20px",
  textTransform: "uppercase",
  fontWeight: "bold",
  color: "#fff",
  background: type === "test" ? "#ff4b2b" : type === "vacation" ? "#f39c12" : "#4e54c8"
});

export default Notifications;