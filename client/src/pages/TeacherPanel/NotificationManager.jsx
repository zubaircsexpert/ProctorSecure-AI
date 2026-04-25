import React from "react";
import { PlusCircle, Edit, Trash2, Megaphone, BellRing } from "lucide-react";

const NotificationManager = ({
  formData,
  setFormData,
  isEditing,
  setIsEditing,
  handleSubmit,
  notifications = [],
  setCurrentId,
  handleDelete,
}) => {
  const totalNotifications = Array.isArray(notifications) ? notifications.length : 0;

  const layout = {
    display: "flex",
    flexWrap: "wrap",
    gap: "24px",
    alignItems: "flex-start",
  };

  const formColumn = {
    flex: "0 0 360px",
    minWidth: "320px",
  };

  const listColumn = {
    flex: "1 1 620px",
    minWidth: "320px",
  };

  const formBox = {
    backgroundColor: "#fff",
    padding: "24px",
    borderRadius: "20px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 14px 30px rgba(15,23,42,0.06)",
  };

  const formTitle = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: 0,
    marginBottom: "8px",
    color: "#1a2a6c",
  };

  const formSubtitle = {
    margin: "0 0 18px 0",
    color: "#64748b",
    fontSize: "14px",
    lineHeight: 1.6,
  };

  const inputStyle = {
    width: "100%",
    padding: "14px 16px",
    marginBottom: "12px",
    borderRadius: "14px",
    border: "1px solid #d6deeb",
    backgroundColor: "#f8fafc",
    boxSizing: "border-box",
  };

  const postBtn = {
    width: "100%",
    padding: "14px 18px",
    background: "#1a2a6c",
    color: "#fff",
    border: "none",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "15px",
    boxShadow: "0 10px 20px rgba(29,78,216,0.16)",
  };

  const listBox = {
    backgroundColor: "#fff",
    padding: "24px",
    borderRadius: "20px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 14px 30px rgba(15,23,42,0.06)",
  };

  const listHeader = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "18px",
  };

  const statBadge = {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 14px",
    borderRadius: "999px",
    background: "#eef2ff",
    color: "#1d4ed8",
    fontWeight: 700,
    fontSize: "13px",
  };

  const cardGrid = {
    display: "grid",
    gap: "16px",
  };

  const notificationCard = {
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "18px",
    background: "#fcfdff",
    boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
  };

  const cardTop = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "14px",
    flexWrap: "wrap",
    marginBottom: "10px",
  };

  const titleWrap = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  };

  const titleStyle = {
    margin: 0,
    color: "#102a43",
    fontSize: "22px",
  };

  const messageStyle = {
    margin: "0 0 14px 0",
    color: "#475569",
    lineHeight: 1.7,
    fontSize: "14px",
  };

  const footerRow = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  };

  const metaStyle = {
    color: "#64748b",
    fontSize: "13px",
  };

  const actionRow = {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  };

  const iconBtn = {
    padding: "10px",
    border: "none",
    background: "#eef2ff",
    color: "#4e73df",
    cursor: "pointer",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const delBtn = {
    ...iconBtn,
    background: "#fef2f2",
    color: "#ef4444",
  };

  const emptyState = {
    padding: "28px",
    borderRadius: "16px",
    backgroundColor: "#f8fafc",
    border: "1px dashed #cbd5e1",
    color: "#64748b",
    textAlign: "center",
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
      };
    }

    return {
      padding: "6px 12px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: "bold",
      background: "#f3f4f6",
      color: "#374151",
    };
  };

  return (
    <div style={layout}>
      <div style={formColumn}>
        <div style={{ position: "sticky", top: "100px" }}>
          <form onSubmit={handleSubmit} style={formBox}>
            <h3 style={formTitle}>
              {isEditing ? <Edit size={20} /> : <PlusCircle size={20} />}
              {isEditing ? " Edit Notification" : " New Notification"}
            </h3>

            <p style={formSubtitle}>
              Publish polished class announcements, exam alerts, and schedule
              updates from one place.
            </p>

            <input
              name="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Title"
              style={inputStyle}
              required
            />

            <textarea
              name="message"
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              placeholder="Details..."
              style={{ ...inputStyle, minHeight: "120px", resize: "vertical" }}
              required
            />

            <select
              name="type"
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              style={inputStyle}
            >
              <option value="general">General</option>
              <option value="test">Exam Alert</option>
              <option value="vacation">Vacation</option>
            </select>

            <button type="submit" style={postBtn}>
              {isEditing ? "Update Now" : "Publish to Students"}
            </button>
          </form>
        </div>
      </div>

      <div style={listColumn}>
        <div style={listBox}>
          <div style={listHeader}>
            <div>
              <h3 style={{ margin: 0, color: "#1a2a6c" }}>
                Active Notifications
              </h3>
              <p style={{ ...formSubtitle, margin: "8px 0 0 0" }}>
                Review what students will see, then edit or delete when needed.
              </p>
            </div>

            <div style={statBadge}>
              <BellRing size={16} />
              {totalNotifications} active
            </div>
          </div>

          {!totalNotifications ? (
            <div style={emptyState}>No notifications found.</div>
          ) : (
            <div style={cardGrid}>
              {notifications.map((n) => (
                <div key={n._id} style={notificationCard}>
                  <div style={cardTop}>
                    <div style={titleWrap}>
                      <Megaphone size={20} color="#1d4ed8" />
                      <h4 style={titleStyle}>{n.title}</h4>
                      <span style={badgeStyle(n.type)}>{n.type}</span>
                    </div>

                    <div style={actionRow}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(true);
                          setCurrentId(n._id);
                          setFormData({
                            title: n.title || "",
                            message: n.message || "",
                            type: n.type || "general",
                          });
                        }}
                        style={iconBtn}
                      >
                        <Edit size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete("notifications", n._id)}
                        style={delBtn}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <p style={messageStyle}>{n.message}</p>

                  <div style={footerRow}>
                    <span style={metaStyle}>
                      Published on{" "}
                      {n.createdAt
                        ? new Date(n.createdAt).toLocaleDateString()
                        : "N/A"}
                    </span>

                    {n.updatedAt && (
                      <span style={metaStyle}>
                        Updated{" "}
                        {new Date(n.updatedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationManager;
