import { useEffect, useState } from "react";
import { BellRing, CalendarDays, Megaphone, ShieldCheck, Sparkles } from "lucide-react";
import API from "../../services/api";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await API.get("/api/notifications/all");
        setNotifications(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching notifications", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.hero}>
          <div style={styles.heroBadge}>
            <BellRing size={16} />
            Loading classroom announcements...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <div style={styles.heroCopy}>
          <div style={styles.heroBadge}>
            <Sparkles size={16} />
            Smart Noticeboard
          </div>
          <h1 style={styles.heroTitle}>Classroom announcements and access updates</h1>
          <p style={styles.heroText}>
            Review teacher notices, assignment alerts, approval updates, and class-wide exam
            messages from one organized stream.
          </p>
        </div>

        <div style={styles.heroStatCard}>
          <div style={styles.heroStatLabel}>Available Updates</div>
          <div style={styles.heroStatValue}>{notifications.length}</div>
          <div style={{ color: "#64748b", marginTop: "8px", lineHeight: 1.5 }}>
            Classroom-specific and global notifications are both included here.
          </div>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div style={styles.emptyState}>
          <BellRing size={22} />
          No announcements available right now.
        </div>
      ) : (
        <div style={styles.grid}>
          {notifications.map((notice) => (
            <article key={notice._id} style={styles.card}>
              <div style={styles.cardTop}>
                <div style={styles.titleWrap}>
                  <div style={styles.iconWrap}>
                    {notice.type === "approval" ? <ShieldCheck size={18} /> : <Megaphone size={18} />}
                  </div>
                  <div>
                    <h3 style={styles.titleStyle}>{notice.title}</h3>
                    <div style={styles.dateStyle}>
                      <CalendarDays size={14} />
                      {notice.createdAt ? new Date(notice.createdAt).toLocaleString() : "N/A"}
                    </div>
                  </div>
                </div>

                <span style={styles.badgeStyle(notice.type, notice.priority)}>
                  {notice.priority === "high" ? "High" : notice.type}
                </span>
              </div>

              <p style={styles.messageStyle}>{notice.message}</p>

              {notice.classroomName ? (
                <div style={styles.classroomStrip}>Classroom: {notice.classroomName}</div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  page: {
    padding: "40px 20px 56px",
    maxWidth: "1180px",
    margin: "0 auto",
    minHeight: "calc(100vh - 104px)",
  },
  hero: {
    display: "flex",
    flexWrap: "wrap",
    gap: "20px",
    justifyContent: "space-between",
    alignItems: "stretch",
    marginBottom: "28px",
  },
  heroCopy: {
    flex: "1 1 620px",
    background: "linear-gradient(135deg, #123c6b 0%, #1d4ed8 58%, #0f766e 100%)",
    color: "#fff",
    borderRadius: "26px",
    padding: "28px",
    boxShadow: "0 20px 35px rgba(18,60,107,0.16)",
  },
  heroBadge: {
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
  },
  heroTitle: {
    margin: "0 0 10px 0",
    fontSize: "clamp(34px, 5vw, 50px)",
    lineHeight: 1.08,
  },
  heroText: {
    margin: 0,
    maxWidth: "720px",
    opacity: 0.92,
    lineHeight: 1.7,
    fontSize: "15px",
  },
  heroStatCard: {
    flex: "0 0 260px",
    minWidth: "240px",
    background: "#fff",
    borderRadius: "24px",
    padding: "24px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 14px 30px rgba(15,23,42,0.06)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  heroStatLabel: {
    fontSize: "12px",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "10px",
  },
  heroStatValue: {
    fontSize: "42px",
    fontWeight: 800,
    color: "#102a43",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "18px",
  },
  card: {
    background: "#fff",
    borderRadius: "22px",
    padding: "22px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 14px 28px rgba(15,23,42,0.05)",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "14px",
    flexWrap: "wrap",
    marginBottom: "14px",
  },
  titleWrap: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
  },
  iconWrap: {
    width: "40px",
    height: "40px",
    borderRadius: "14px",
    background: "#eef2ff",
    color: "#1d4ed8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  titleStyle: {
    margin: "0 0 8px 0",
    color: "#102a43",
    fontSize: "22px",
  },
  dateStyle: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    color: "#64748b",
    fontSize: "13px",
  },
  messageStyle: {
    margin: 0,
    color: "#475569",
    lineHeight: 1.75,
    fontSize: "14px",
  },
  classroomStrip: {
    marginTop: "14px",
    padding: "10px 12px",
    borderRadius: "14px",
    background: "#f8fafc",
    color: "#475569",
    border: "1px solid rgba(148,163,184,0.14)",
    fontSize: "13px",
  },
  emptyState: {
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
  },
  badgeStyle: (type, priority) => ({
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "bold",
    background:
      priority === "high"
        ? "#fee2e2"
        : type === "assignment"
        ? "#ecfeff"
        : type === "approval"
        ? "#ede9fe"
        : "#f3f4f6",
    color:
      priority === "high"
        ? "#b91c1c"
        : type === "assignment"
        ? "#0f766e"
        : type === "approval"
        ? "#6d28d9"
        : "#374151",
    textTransform: "capitalize",
  }),
};

export default Notifications;
