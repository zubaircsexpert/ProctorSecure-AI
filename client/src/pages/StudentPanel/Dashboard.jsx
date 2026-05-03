import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BellRing,
  BookOpenCheck,
  BrainCircuit,
  CalendarClock,
  ClipboardCheck,
  FileStack,
  Gauge,
  Shield,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import API from "../../services/api";

const getDaysUntil = (dateValue) => {
  if (!dateValue) return null;
  const now = Date.now();
  const target = new Date(dateValue).getTime();
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
};

function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [exams, setExams] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [profileRes, examsRes, assignmentsRes, notificationsRes, resultsRes] =
          await Promise.all([
            API.get("/api/auth/me"),
            API.get("/api/exams/all"),
            API.get("/api/assignments/all"),
            API.get("/api/notifications/all"),
            API.get("/api/results/my"),
          ]);

        if (!active) return;

        setProfile(profileRes.data?.user || null);
        setExams(Array.isArray(examsRes.data) ? examsRes.data : []);
        setAssignments(Array.isArray(assignmentsRes.data) ? assignmentsRes.data : []);
        setNotifications(Array.isArray(notificationsRes.data) ? notificationsRes.data : []);
        setResults(Array.isArray(resultsRes.data) ? resultsRes.data : []);
      } catch (error) {
        console.error("Student dashboard load error:", error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  const upcomingExams = useMemo(
    () =>
      [...exams]
        .filter((exam) => exam.status !== "closed")
        .filter((exam) => (exam.assessmentType || "exam") !== "quiz")
        .sort((left, right) => {
          const leftTime = left.startTime ? new Date(left.startTime).getTime() : Infinity;
          const rightTime = right.startTime ? new Date(right.startTime).getTime() : Infinity;
          return leftTime - rightTime;
        })
        .slice(0, 4),
    [exams]
  );

  const latestResult = results[0] || null;
  const pendingAssignments = assignments.filter(
    (assignment) => assignment.status !== "Checked"
  );

  const coachSuggestions = useMemo(() => {
    const suggestions = [];
    const nextExam = upcomingExams[0];
    const daysUntilExam = nextExam?.startTime ? getDaysUntil(nextExam.startTime) : null;

    if (nextExam && daysUntilExam !== null) {
      if (daysUntilExam <= 1) {
        suggestions.push(
          `AI Coach: ${nextExam.title} is very close. Use a quick revision block and test your camera setup before starting.`
        );
      } else if (daysUntilExam <= 5) {
        suggestions.push(
          `AI Coach: ${nextExam.title} is in ${daysUntilExam} day(s). Split revision into concept review, MCQ practice, and a final integrity check.`
        );
      } else {
        suggestions.push(
          `AI Coach: Your next assessment is ${nextExam.title}. Start with syllabus mapping so the last 3 days stay focused.`
        );
      }
    }

    if (pendingAssignments.length > 0) {
      suggestions.push(
        `AI Coach: You still have ${pendingAssignments.length} assignment(s) not fully checked. Clear those early so exam prep remains clean.`
      );
    }

    if (latestResult?.suspiciousScore >= 35) {
      suggestions.push(
        "Integrity Coach: Your last suspicious score was elevated. Keep your face centered, reduce room noise, and avoid switching tabs in the next attempt."
      );
    } else if (latestResult) {
      suggestions.push(
        "Integrity Coach: Your recent exam integrity looks healthy. Repeat the same quiet setup and forward-facing posture for future exams."
      );
    }

    if (!suggestions.length) {
      suggestions.push(
        "AI Coach: You are in a good position. Review class notifications, confirm pending work, and keep your device ready before the next assessment."
      );
    }

    return suggestions.slice(0, 3);
  }, [latestResult, pendingAssignments.length, upcomingExams]);

  const quickModules = [
    {
      to: "/ai-tutor",
      icon: BrainCircuit,
      title: "AI Tutor",
      text: "Ask for assignment help, quiz preparation, exam guidance, and study fixes.",
    },
    {
      to: "/study-vault",
      icon: FileStack,
      title: "Study Vault",
      text: "Open teacher notes, PDFs, slides, lecture links, and classroom resources.",
    },
    {
      to: "/system-checks",
      icon: Gauge,
      title: "System Checks",
      text: "Test camera, microphone, and internet readiness before secure exams.",
    },
    {
      to: "/performance-analytics",
      icon: TrendingUp,
      title: "Performance Analytics",
      text: "Track old results, score trends, and improvement suggestions.",
    },
    {
      to: "/exam",
      icon: Shield,
      title: "Secure Exams",
      text: "Open live exams, readiness checks, and AI proctoring workspace.",
    },
    {
      to: "/quiz",
      icon: BrainCircuit,
      title: "Quizzes",
      text: "Attempt timed MCQ quizzes and review your submitted quiz results.",
    },
    {
      to: "/results",
      icon: ClipboardCheck,
      title: "Results Center",
      text: "Review academic score, suspicious analytics, and integrity reports.",
    },
    {
      to: "/assignment-list",
      icon: FileStack,
      title: "Assignments",
      text: "Track tasks, upload files, and follow teacher review status.",
    },
    {
      to: "/notifications",
      icon: BellRing,
      title: "Announcements",
      text: "Read classroom alerts, approval updates, and official notices.",
    },
  ];

  if (loading) {
    return (
      <div style={styles.loaderState}>
        <div style={styles.loaderOrb} />
        <h2 style={{ margin: "18px 0 8px", color: "#0f172a" }}>Preparing your classroom workspace</h2>
        <p style={{ margin: 0, color: "#64748b" }}>
          Loading your classroom, assessments, and AI study suggestions.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div>
          <div style={styles.heroBadge}>Student Operations Hub</div>
          <h1 style={styles.heroTitle}>Welcome back, {profile?.name || "Student"}</h1>
          <p style={styles.heroText}>
            {profile?.classroomName || "Your classroom approval is now part of the system."} |
            {` `}Teacher {profile?.teacherName || "Faculty"} | Roll No. {profile?.rollNumber || "Pending"}
          </p>
        </div>

        <div style={styles.heroPanel}>
          <div style={styles.heroMetric}>
            <span>Upcoming Exams</span>
            <strong>{upcomingExams.length}</strong>
          </div>
          <div style={styles.heroMetric}>
            <span>Pending Assignments</span>
            <strong>{pendingAssignments.length}</strong>
          </div>
          <div style={styles.heroMetric}>
            <span>Trust Snapshot</span>
            <strong>{latestResult?.trustFactor || "Fresh Start"}</strong>
          </div>
        </div>
      </section>

      <section style={styles.gridTwo}>
        <div style={styles.card}>
          <div style={styles.sectionHead}>
            <div>
              <div style={styles.sectionKicker}>AI Study Coach</div>
              <h2 style={styles.sectionTitle}>Preparation suggestions</h2>
            </div>
            <div style={styles.iconBadge("#e0f2fe", "#0369a1")}>
              <BrainCircuit size={18} />
            </div>
          </div>

          <div style={{ display: "grid", gap: "12px" }}>
            {coachSuggestions.map((item) => (
              <div key={item} style={styles.coachCard}>
                <Sparkles size={16} color="#1d4ed8" />
                <span style={{ lineHeight: 1.65 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.sectionHead}>
            <div>
              <div style={styles.sectionKicker}>Readiness Snapshot</div>
              <h2 style={styles.sectionTitle}>Current learning status</h2>
            </div>
            <div style={styles.iconBadge("#dcfce7", "#166534")}>
              <Shield size={18} />
            </div>
          </div>

          <div style={styles.miniGrid}>
            <MetricCard label="Latest Score" value={latestResult ? `${latestResult.percentage || 0}%` : "N/A"} />
            <MetricCard
              label="Suspicious Score"
              value={latestResult ? `${latestResult.suspiciousScore || latestResult.cheatingPercent || 0}%` : "N/A"}
            />
            <MetricCard label="Notifications" value={notifications.length} />
            <MetricCard label="Approved Status" value={profile?.approvalStatus || "approved"} />
          </div>
        </div>
      </section>

      <section style={styles.modulesGrid}>
        {quickModules.map((module) => {
          const Icon = module.icon;
          return (
            <Link key={module.to} to={module.to} style={styles.moduleCard}>
              <div style={styles.moduleIcon}>
                <Icon size={22} />
              </div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>{module.title}</div>
              <p style={styles.moduleText}>{module.text}</p>
            </Link>
          );
        })}
      </section>

      <section style={styles.gridTwo}>
        <div style={styles.card}>
          <div style={styles.sectionHead}>
            <div>
              <div style={styles.sectionKicker}>Upcoming Assessments</div>
              <h2 style={styles.sectionTitle}>Classroom exam pipeline</h2>
            </div>
            <div style={styles.iconBadge("#fef3c7", "#b45309")}>
              <CalendarClock size={18} />
            </div>
          </div>

          {upcomingExams.length === 0 ? (
            <div style={styles.emptyState}>No scheduled exams are available for your class yet.</div>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {upcomingExams.map((exam) => (
                <div key={exam._id} style={styles.timelineCard}>
                  <div>
                    <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b" }}>
                      {exam.assessmentType || "exam"}
                    </div>
                    <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginTop: "6px" }}>
                      {exam.title}
                    </div>
                    <div style={{ color: "#475569", marginTop: "6px", lineHeight: 1.6 }}>
                      {exam.course} | {exam.classroomName || profile?.classroomName || "Classroom"}
                    </div>
                  </div>
                  <div style={styles.timelineMeta}>
                    <strong>{exam.startTime ? new Date(exam.startTime).toLocaleString() : "Teacher will schedule time"}</strong>
                    <span>{exam.duration} min</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.card}>
          <div style={styles.sectionHead}>
            <div>
              <div style={styles.sectionKicker}>Classroom Feed</div>
              <h2 style={styles.sectionTitle}>Recent academic signals</h2>
            </div>
            <div style={styles.iconBadge("#ede9fe", "#6d28d9")}>
              <BookOpenCheck size={18} />
            </div>
          </div>

          <div style={{ display: "grid", gap: "12px" }}>
            {notifications.slice(0, 4).map((notice) => (
              <div key={notice._id} style={styles.feedCard}>
                <div style={{ fontWeight: 800, color: "#0f172a" }}>{notice.title}</div>
                <div style={{ color: "#475569", marginTop: "6px", lineHeight: 1.65 }}>
                  {notice.message}
                </div>
              </div>
            ))}

            {notifications.length === 0 ? (
              <div style={styles.emptyState}>No notifications available right now.</div>
            ) : null}
          </div>
        </div>
      </section>

      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

const MetricCard = ({ label, value }) => (
  <div style={styles.metricCard}>
    <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b" }}>
      {label}
    </span>
    <strong style={{ fontSize: "24px", color: "#0f172a" }}>{value}</strong>
  </div>
);

const styles = {
  page: {
    minHeight: "calc(100vh - 104px)",
    padding: "26px clamp(16px, 3vw, 34px) 40px",
    background:
      "radial-gradient(circle at top right, rgba(37,99,235,0.08), transparent 28%), linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%)",
  },
  loaderState: {
    minHeight: "calc(100vh - 104px)",
    display: "grid",
    placeItems: "center",
    textAlign: "center",
    padding: "24px",
  },
  loaderOrb: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background: "conic-gradient(from 180deg, #0f766e, #2563eb, #0f766e)",
    animation: "spin 1.1s linear infinite",
  },
  hero: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
    padding: "32px",
    borderRadius: "32px",
    background: "linear-gradient(135deg, #0f172a 0%, #123c6b 48%, #0f766e 100%)",
    color: "#fff",
    boxShadow: "0 28px 60px rgba(15, 23, 42, 0.18)",
    marginBottom: "24px",
  },
  heroBadge: {
    display: "inline-flex",
    padding: "8px 12px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.12)",
    fontSize: "12px",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    fontWeight: 800,
  },
  heroTitle: {
    margin: "14px 0 12px 0",
    fontSize: "clamp(34px, 5vw, 58px)",
    lineHeight: 1.02,
  },
  heroText: {
    margin: 0,
    color: "rgba(255,255,255,0.82)",
    lineHeight: 1.75,
    fontSize: "15px",
  },
  heroPanel: {
    display: "grid",
    gap: "12px",
    alignContent: "start",
  },
  heroMetric: {
    padding: "18px 20px",
    borderRadius: "20px",
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.12)",
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
  },
  gridTwo: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "18px",
    marginBottom: "20px",
  },
  card: {
    background: "rgba(255,255,255,0.96)",
    borderRadius: "28px",
    padding: "24px",
    border: "1px solid rgba(148,163,184,0.14)",
    boxShadow: "0 22px 44px rgba(15, 23, 42, 0.08)",
  },
  sectionHead: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "flex-start",
    marginBottom: "18px",
  },
  sectionKicker: {
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: "#2563eb",
    fontWeight: 800,
    marginBottom: "6px",
  },
  sectionTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "28px",
  },
  iconBadge: (background, color) => ({
    width: "42px",
    height: "42px",
    borderRadius: "14px",
    display: "grid",
    placeItems: "center",
    background,
    color,
    flexShrink: 0,
  }),
  coachCard: {
    display: "flex",
    gap: "12px",
    padding: "15px 16px",
    borderRadius: "18px",
    background: "#f8fbff",
    border: "1px solid rgba(37,99,235,0.12)",
    color: "#334155",
  },
  miniGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "12px",
  },
  metricCard: {
    padding: "16px 18px",
    borderRadius: "20px",
    background: "#f8fafc",
    border: "1px solid rgba(148,163,184,0.14)",
    display: "grid",
    gap: "10px",
  },
  modulesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "18px",
    marginBottom: "20px",
  },
  moduleCard: {
    textDecoration: "none",
    background: "rgba(255,255,255,0.96)",
    borderRadius: "26px",
    padding: "22px",
    border: "1px solid rgba(148,163,184,0.14)",
    boxShadow: "0 18px 36px rgba(15, 23, 42, 0.06)",
    display: "grid",
    gap: "14px",
  },
  moduleIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "16px",
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(135deg, #dbeafe, #d1fae5)",
    color: "#0f172a",
  },
  moduleText: {
    margin: 0,
    color: "#64748b",
    lineHeight: 1.7,
  },
  timelineCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
    padding: "16px 18px",
    borderRadius: "20px",
    background: "#f8fafc",
    border: "1px solid rgba(148,163,184,0.14)",
  },
  timelineMeta: {
    display: "grid",
    gap: "6px",
    color: "#475569",
    minWidth: "190px",
  },
  feedCard: {
    padding: "16px 18px",
    borderRadius: "20px",
    background: "#f8fafc",
    border: "1px solid rgba(148,163,184,0.14)",
  },
  emptyState: {
    padding: "20px",
    borderRadius: "18px",
    background: "#f8fafc",
    border: "1px dashed rgba(148,163,184,0.26)",
    color: "#64748b",
  },
};

export default Dashboard;
