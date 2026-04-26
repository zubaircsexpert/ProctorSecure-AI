import { useEffect, useMemo, useState } from "react";
import { BrainCircuit, CalendarClock, Clock3, FileStack, ShieldCheck } from "lucide-react";
import API from "../services/api";

const getDaysUntil = (value) => {
  if (!value) return null;
  const target = new Date(value).getTime();
  if (Number.isNaN(target)) return null;
  return Math.ceil((target - Date.now()) / (1000 * 60 * 60 * 24));
};

const formatDateTime = (value, fallback = "Teacher will update timing") => {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toLocaleString();
};

function Schedule() {
  const [profile, setProfile] = useState(null);
  const [exams, setExams] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadSchedule = async () => {
      try {
        setLoading(true);
        const [profileRes, examsRes, assignmentsRes] = await Promise.all([
          API.get("/api/auth/me"),
          API.get("/api/exams/all"),
          API.get("/api/assignments/all"),
        ]);

        if (!active) return;

        setProfile(profileRes.data?.user || null);
        setExams(Array.isArray(examsRes.data) ? examsRes.data : []);
        setAssignments(Array.isArray(assignmentsRes.data) ? assignmentsRes.data : []);
      } catch (error) {
        console.error("Schedule load error:", error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadSchedule();
    return () => {
      active = false;
    };
  }, []);

  const timeline = useMemo(() => {
    const examEvents = exams.map((exam) => ({
      id: exam._id,
      type: exam.assessmentType || "exam",
      title: exam.title,
      subtitle: `${exam.course} | ${exam.classroomName || profile?.classroomName || "Classroom"}`,
      date: exam.startTime || exam.createdAt,
      meta: `${exam.duration} min | ${exam.status}`,
      accent: exam.status === "live" ? "#16a34a" : "#2563eb",
    }));

    const assignmentEvents = assignments.map((assignment) => ({
      id: assignment._id,
      type: "assignment",
      title: assignment.title,
      subtitle: assignment.classroomName || profile?.classroomName || "Classroom",
      date: assignment.dueDate || assignment.createdAt,
      meta:
        profile?.role === "teacher"
          ? `${assignment.submissionCount || assignment.submissions?.length || 0} submissions`
          : assignment.status || "Pending",
      accent: "#0f766e",
    }));

    return [...examEvents, ...assignmentEvents].sort(
      (left, right) => new Date(left.date || 0) - new Date(right.date || 0)
    );
  }, [assignments, exams, profile?.classroomName, profile?.role]);

  const plannerNotes = useMemo(() => {
    const nextExam = timeline.find((item) => item.type !== "assignment");
    const notes = [];

    if (nextExam) {
      const days = getDaysUntil(nextExam.date);
      if (days !== null) {
        notes.push(
          days <= 1
            ? `${nextExam.title} is very close. Keep room setup, notifications, and attendance flow ready.`
            : `${nextExam.title} is in ${days} day(s). Use this window for reminders and preparation.`
        );
      }
    }

    if (assignments.length > 0) {
      notes.push(
        `There are ${assignments.length} assignment item(s) on the board. Keep their dates aligned with the exam rhythm.`
      );
    }

    if (profile?.role === "teacher") {
      notes.push(
        "Teacher planner: post announcements early, enable exam access only near start time, and review flagged results after submission."
      );
    } else {
      notes.push(
        "Student planner: keep device ready, finish pending assignments early, and use the readiness checks before each live exam."
      );
    }

    return notes.slice(0, 3);
  }, [assignments.length, profile?.role, timeline]);

  if (loading) {
    return (
      <div style={styles.loaderState}>
        <div style={styles.loaderOrb} />
        <h2 style={{ margin: "18px 0 8px", color: "#0f172a" }}>Preparing schedule intelligence</h2>
        <p style={{ margin: 0, color: "#64748b" }}>
          Loading your assessments, deadlines, and AI planner notes.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div>
          <div style={styles.heroKicker}>Smart calendar</div>
          <h1 style={styles.heroTitle}>
            {profile?.role === "teacher" ? "Teaching schedule overview" : "Student preparation schedule"}
          </h1>
          <p style={styles.heroText}>
            {profile?.classroomName || profile?.department || "Academic workspace"} | timeline-driven
            planning for exams, assignments, and readiness.
          </p>
        </div>

        <div style={styles.heroStats}>
          <StatCard label="Total Events" value={timeline.length} />
          <StatCard label="Exams" value={exams.length} />
          <StatCard label="Assignments" value={assignments.length} />
        </div>
      </section>

      <section style={styles.gridTwo}>
        <div style={styles.card}>
          <div style={styles.sectionHeader}>
            <div>
              <div style={styles.sectionKicker}>AI Planner</div>
              <h2 style={styles.sectionTitle}>Suggested rhythm</h2>
            </div>
            <div style={styles.iconBadge("#dbeafe", "#1d4ed8")}>
              <BrainCircuit size={18} />
            </div>
          </div>

          <div style={{ display: "grid", gap: "12px" }}>
            {plannerNotes.map((note) => (
              <div key={note} style={styles.noteCard}>
                <ShieldCheck size={16} color="#1d4ed8" />
                <span style={{ lineHeight: 1.65 }}>{note}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.sectionHeader}>
            <div>
              <div style={styles.sectionKicker}>Quick View</div>
              <h2 style={styles.sectionTitle}>Next timeline items</h2>
            </div>
            <div style={styles.iconBadge("#dcfce7", "#166534")}>
              <CalendarClock size={18} />
            </div>
          </div>

          {timeline.length === 0 ? (
            <div style={styles.emptyState}>No schedule event is available yet.</div>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {timeline.slice(0, 3).map((item) => (
                <div key={`${item.type}-${item.id}`} style={styles.peekCard}>
                  <div style={{ color: item.accent, fontWeight: 800, textTransform: "capitalize" }}>
                    {item.type}
                  </div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>
                    {item.title}
                  </div>
                  <div style={{ color: "#475569", marginTop: "6px" }}>{item.subtitle}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section style={styles.card}>
        <div style={styles.sectionHeader}>
          <div>
            <div style={styles.sectionKicker}>Master Timeline</div>
            <h2 style={styles.sectionTitle}>All upcoming events</h2>
          </div>
          <div style={styles.iconBadge("#fef3c7", "#b45309")}>
            <Clock3 size={18} />
          </div>
        </div>

        {timeline.length === 0 ? (
          <div style={styles.emptyState}>Nothing has been scheduled yet.</div>
        ) : (
          <div style={styles.timeline}>
            {timeline.map((item) => (
              <div key={`${item.type}-${item.id}`} style={styles.timelineRow}>
                <div style={styles.timelineMarker(item.accent)}>
                  {item.type === "assignment" ? <FileStack size={16} /> : <CalendarClock size={16} />}
                </div>

                <div style={styles.timelineContent}>
                  <div style={styles.timelineTop}>
                    <div>
                      <div style={{ color: item.accent, fontWeight: 800, textTransform: "capitalize" }}>
                        {item.type}
                      </div>
                      <div style={styles.timelineTitle}>{item.title}</div>
                      <div style={styles.timelineText}>{item.subtitle}</div>
                    </div>
                    <div style={styles.timelineMeta}>
                      <strong>{formatDateTime(item.date)}</strong>
                      <span>{item.meta}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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

const StatCard = ({ label, value }) => (
  <div style={styles.statCard}>
    <span style={styles.statLabel}>{label}</span>
    <strong style={styles.statValue}>{value}</strong>
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
    marginBottom: "20px",
  },
  heroKicker: {
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
    fontSize: "clamp(34px, 5vw, 56px)",
    lineHeight: 1.02,
  },
  heroText: {
    margin: 0,
    color: "rgba(255,255,255,0.82)",
    lineHeight: 1.75,
    fontSize: "15px",
  },
  heroStats: {
    display: "grid",
    gap: "12px",
  },
  statCard: {
    padding: "18px 20px",
    borderRadius: "22px",
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.1)",
    display: "grid",
    gap: "8px",
  },
  statLabel: {
    color: "rgba(255,255,255,0.78)",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  statValue: {
    fontSize: "30px",
  },
  gridTwo: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "18px",
    marginBottom: "18px",
  },
  card: {
    background: "rgba(255,255,255,0.96)",
    borderRadius: "28px",
    padding: "24px",
    border: "1px solid rgba(148,163,184,0.14)",
    boxShadow: "0 22px 44px rgba(15, 23, 42, 0.08)",
  },
  sectionHeader: {
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
    lineHeight: 1.15,
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
  noteCard: {
    display: "flex",
    gap: "12px",
    padding: "15px 16px",
    borderRadius: "18px",
    background: "#f8fbff",
    border: "1px solid rgba(37,99,235,0.12)",
    color: "#334155",
  },
  peekCard: {
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
  timeline: {
    display: "grid",
    gap: "16px",
  },
  timelineRow: {
    display: "grid",
    gridTemplateColumns: "56px minmax(0, 1fr)",
    gap: "14px",
    alignItems: "start",
  },
  timelineMarker: (color) => ({
    width: "48px",
    height: "48px",
    borderRadius: "16px",
    display: "grid",
    placeItems: "center",
    background: `${color}18`,
    color,
    border: `1px solid ${color}33`,
  }),
  timelineContent: {
    padding: "16px 18px",
    borderRadius: "22px",
    background: "#f8fafc",
    border: "1px solid rgba(148,163,184,0.14)",
  },
  timelineTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  timelineTitle: {
    fontSize: "20px",
    fontWeight: 800,
    color: "#0f172a",
    marginTop: "4px",
  },
  timelineText: {
    color: "#475569",
    marginTop: "6px",
    lineHeight: 1.6,
  },
  timelineMeta: {
    display: "grid",
    gap: "6px",
    color: "#475569",
    minWidth: "180px",
  },
};

export default Schedule;
