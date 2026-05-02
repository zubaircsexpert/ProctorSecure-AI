import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Layers,
  Megaphone,
  RefreshCw,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";
import API from "../services/api";

const emptyData = {
  metrics: {},
  users: [],
  teachers: [],
  students: [],
  classrooms: [],
  aiExams: [],
  quizzes: [],
  aiExamResults: [],
  quizResults: [],
  assignments: [],
  submissions: [],
  notifications: [],
};

const formatDateTime = (value) => {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not recorded" : date.toLocaleString();
};

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [notice, setNotice] = useState("");

  const loadAdminData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await API.get("/api/admin/overview");
      setData({ ...emptyData, ...(response.data || {}) });
      setNotice("");
    } catch (error) {
      console.error("Admin overview load failed:", error);
      setNotice(error.response?.data?.message || "Admin data could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const updateStudentStatus = async (studentId, approvalStatus) => {
    setBusyKey(`student-${studentId}-${approvalStatus}`);
    try {
      await API.put(`/api/admin/users/${studentId}/status`, { approvalStatus });
      await loadAdminData(true);
    } catch (error) {
      setNotice(error.response?.data?.message || "Student status update failed.");
    } finally {
      setBusyKey("");
    }
  };

  const updateAssessment = async (examId, payload) => {
    setBusyKey(`exam-${examId}`);
    try {
      await API.put(`/api/admin/exams/${examId}/status`, payload);
      await loadAdminData(true);
    } catch (error) {
      setNotice(error.response?.data?.message || "Assessment update failed.");
    } finally {
      setBusyKey("");
    }
  };

  const metrics = data.metrics || {};
  const tabs = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "users", label: "Users", icon: Users },
    { id: "assessments", label: "AI Exams & Quizzes", icon: BookOpenCheck },
    { id: "results", label: "Results", icon: ClipboardCheck },
    { id: "content", label: "Assignments & Notices", icon: Megaphone },
  ];

  const resultRows = useMemo(
    () => [
      ...data.aiExamResults.map((result) => ({ ...result, typeLabel: "AI Exam" })),
      ...data.quizResults.map((result) => ({ ...result, typeLabel: "Quiz" })),
    ].sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0)),
    [data.aiExamResults, data.quizResults]
  );

  if (loading) {
    return (
      <div style={styles.loaderState}>
        <div style={styles.loaderOrb} />
        <h2 style={{ margin: "18px 0 8px", color: "#0f172a" }}>Loading admin command center</h2>
        <p style={{ margin: 0, color: "#64748b" }}>Preparing users, assessments, and reports.</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div>
          <div style={styles.heroBadge}>Admin Command Center</div>
          <h1 style={styles.heroTitle}>Complete system access</h1>
          <p style={styles.heroText}>
            Manage teachers, students, AI exams, quizzes, reports, assignments, and announcements from one fast workspace.
          </p>
        </div>
        <div style={styles.heroMetricGrid}>
          <MetricCard label="Users" value={metrics.users || 0} bright />
          <MetricCard label="Teachers" value={metrics.teachers || 0} bright />
          <MetricCard label="Students" value={metrics.students || 0} bright />
          <MetricCard label="Pending" value={metrics.pendingStudents || 0} bright />
        </div>
      </section>

      {notice ? <div style={styles.noticeError}>{notice}</div> : null}

      <div style={styles.tabRow}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} style={styles.tabButton(activeTab === tab.id)}>
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
        <button type="button" onClick={() => loadAdminData()} style={styles.refreshButton}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {activeTab === "overview" ? (
        <div style={styles.sectionStack}>
          <section style={styles.gridFour}>
            <MetricCard label="Classrooms" value={metrics.classrooms || 0} />
            <MetricCard label="AI Exams" value={metrics.aiExams || 0} />
            <MetricCard label="Quizzes" value={metrics.quizzes || 0} />
            <MetricCard label="Reports" value={(metrics.aiExamResults || 0) + (metrics.quizResults || 0)} />
          </section>

          <section style={styles.gridTwo}>
            <Panel title="Recent Students" kicker="Approvals" icon={<GraduationCap size={18} />}>
              {data.students.slice(0, 6).map((student) => (
                <UserRow key={student._id} user={student} />
              ))}
            </Panel>
            <Panel title="Recent Results" kicker="Reports" icon={<ClipboardCheck size={18} />}>
              {resultRows.slice(0, 6).map((result) => (
                <ResultRow key={result._id} result={result} />
              ))}
            </Panel>
          </section>
        </div>
      ) : null}

      {activeTab === "users" ? (
        <section style={styles.gridTwo}>
          <Panel title="Teachers" kicker="Faculty accounts" icon={<ShieldCheck size={18} />}>
            {data.teachers.length === 0 ? <EmptyState text="No teacher accounts yet." /> : null}
            {data.teachers.map((teacher) => (
              <UserRow key={teacher._id} user={teacher} />
            ))}
          </Panel>

          <Panel title="Students" kicker="Approval control" icon={<Users size={18} />}>
            {data.students.length === 0 ? <EmptyState text="No student accounts yet." /> : null}
            {data.students.map((student) => (
              <div key={student._id} style={styles.adminRow}>
                <UserRow user={student} />
                <div style={styles.actionRow}>
                  <button
                    type="button"
                    style={styles.successButton}
                    disabled={busyKey === `student-${student._id}-approved`}
                    onClick={() => updateStudentStatus(student._id, "approved")}
                  >
                    <CheckCircle2 size={15} />
                    Approve
                  </button>
                  <button
                    type="button"
                    style={styles.dangerButton}
                    disabled={busyKey === `student-${student._id}-rejected`}
                    onClick={() => updateStudentStatus(student._id, "rejected")}
                  >
                    <XCircle size={15} />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </Panel>
        </section>
      ) : null}

      {activeTab === "assessments" ? (
        <section style={styles.gridTwo}>
          <AssessmentPanel
            title="AI Exams"
            items={data.aiExams}
            busyKey={busyKey}
            onUpdate={updateAssessment}
          />
          <AssessmentPanel
            title="Quizzes"
            items={data.quizzes}
            busyKey={busyKey}
            onUpdate={updateAssessment}
          />
        </section>
      ) : null}

      {activeTab === "results" ? (
        <Panel title="All Student Results" kicker="AI exam and quiz ledger" icon={<ClipboardCheck size={18} />}>
          {resultRows.length === 0 ? <EmptyState text="No results submitted yet." /> : null}
          <div style={styles.resultGrid}>
            {resultRows.map((result) => (
              <ResultRow key={result._id} result={result} detailed />
            ))}
          </div>
        </Panel>
      ) : null}

      {activeTab === "content" ? (
        <section style={styles.gridTwo}>
          <Panel title="Assignments" kicker="Teacher uploads" icon={<Layers size={18} />}>
            {data.assignments.length === 0 ? <EmptyState text="No assignments yet." /> : null}
            {data.assignments.map((assignment) => (
              <div key={assignment._id} style={styles.adminRow}>
                <strong style={styles.rowTitle}>{assignment.title}</strong>
                <span style={styles.rowMeta}>{assignment.classroomName || "Classroom"} | Due {assignment.dueDate || "N/A"}</span>
              </div>
            ))}
          </Panel>

          <Panel title="Announcements" kicker="Notification feed" icon={<Megaphone size={18} />}>
            {data.notifications.length === 0 ? <EmptyState text="No announcements yet." /> : null}
            {data.notifications.map((notice) => (
              <div key={notice._id} style={styles.adminRow}>
                <strong style={styles.rowTitle}>{notice.title}</strong>
                <span style={styles.rowMeta}>{notice.message}</span>
              </div>
            ))}
          </Panel>
        </section>
      ) : null}
    </div>
  );
};

const AssessmentPanel = ({ title, items, busyKey, onUpdate }) => (
  <Panel title={title} kicker="Access control" icon={<BookOpenCheck size={18} />}>
    {items.length === 0 ? <EmptyState text={`No ${title.toLowerCase()} created yet.`} /> : null}
    {items.map((item) => (
      <div key={item._id} style={styles.adminRow}>
        <div style={styles.rowTop}>
          <div>
            <strong style={styles.rowTitle}>{item.title}</strong>
            <span style={styles.rowMeta}>{item.course || "Course"} | {item.classroomName || "Classroom"} | {item.duration} min</span>
          </div>
          <span style={styles.statusBadge(item.status)}>{item.status}</span>
        </div>
        <div style={styles.actionRow}>
          <button
            type="button"
            style={styles.successButton}
            disabled={busyKey === `exam-${item._id}`}
            onClick={() => onUpdate(item._id, { status: "live", accessGranted: true })}
          >
            Start
          </button>
          <button
            type="button"
            style={styles.warningButton}
            disabled={busyKey === `exam-${item._id}`}
            onClick={() => onUpdate(item._id, { status: "scheduled", accessGranted: false })}
          >
            Pause
          </button>
          <button
            type="button"
            style={styles.dangerButton}
            disabled={busyKey === `exam-${item._id}`}
            onClick={() => onUpdate(item._id, { status: "closed", accessGranted: false })}
          >
            Close
          </button>
        </div>
      </div>
    ))}
  </Panel>
);

const Panel = ({ kicker, title, icon, children }) => (
  <section style={styles.card}>
    <div style={styles.sectionHeader}>
      <div>
        <div style={styles.sectionKicker}>{kicker}</div>
        <h2 style={styles.sectionTitle}>{title}</h2>
      </div>
      <div style={styles.iconBadge}>{icon}</div>
    </div>
    <div style={styles.cardGrid}>{children}</div>
  </section>
);

const MetricCard = ({ label, value, bright = false }) => (
  <div style={bright ? styles.heroStatCard : styles.metricCard}>
    <span style={bright ? styles.heroStatLabel : styles.metricLabel}>{label}</span>
    <strong style={bright ? styles.heroStatValue : styles.metricValue}>{value}</strong>
  </div>
);

const UserRow = ({ user }) => (
  <div style={styles.userLine}>
    <div>
      <strong style={styles.rowTitle}>{user.name || "User"}</strong>
      <div style={styles.rowMeta}>{user.email} | {user.classroomName || user.department || "No class"}</div>
    </div>
    <span style={styles.statusBadge(user.approvalStatus || user.role)}>{user.approvalStatus || user.role}</span>
  </div>
);

const ResultRow = ({ result, detailed = false }) => (
  <div style={styles.adminRow}>
    <div style={styles.rowTop}>
      <div>
        <strong style={styles.rowTitle}>{result.studentName || "Student"}</strong>
        <div style={styles.rowMeta}>{result.typeLabel || result.assessmentType || "AI Exam"} | {result.testName || "Assessment"}</div>
        {detailed ? <div style={styles.rowMeta}>Attempted {formatDateTime(result.createdAt)}</div> : null}
      </div>
      <span style={styles.statusBadge(result.status || "saved")}>{result.status || "saved"}</span>
    </div>
    <div style={styles.miniStats}>
      <span>{result.score || 0}/{result.total || 0}</span>
      <span>{result.percentage || 0}%</span>
      <span>Alerts {result.warnings || 0}</span>
    </div>
  </div>
);

const EmptyState = ({ text }) => <div style={styles.emptyState}>{text}</div>;

const styles = {
  page: {
    minHeight: "calc(100vh - 104px)",
    padding: "26px clamp(16px, 3vw, 34px) 40px",
    background:
      "radial-gradient(circle at top right, rgba(37,99,235,0.10), transparent 28%), linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%)",
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
    borderRadius: "30px",
    background: "linear-gradient(135deg, #0f172a 0%, #123c6b 48%, #0f766e 100%)",
    color: "#fff",
    boxShadow: "0 28px 60px rgba(15, 23, 42, 0.18)",
    marginBottom: "20px",
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
    margin: "14px 0 12px",
    fontSize: "clamp(34px, 5vw, 58px)",
    lineHeight: 1.02,
  },
  heroText: {
    margin: 0,
    color: "rgba(255,255,255,0.82)",
    lineHeight: 1.75,
    fontSize: "15px",
  },
  heroMetricGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "12px",
  },
  heroStatCard: {
    padding: "18px 20px",
    borderRadius: "22px",
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.1)",
    display: "grid",
    gap: "8px",
  },
  heroStatLabel: {
    color: "rgba(255,255,255,0.78)",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  heroStatValue: {
    fontSize: "30px",
  },
  noticeError: {
    padding: "14px 16px",
    borderRadius: "18px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    marginBottom: "18px",
  },
  tabRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "20px",
  },
  tabButton: (active) => ({
    border: active ? "1px solid #0f766e" : "1px solid rgba(148,163,184,0.2)",
    background: active ? "linear-gradient(135deg, rgba(15,118,110,0.1), rgba(37,99,235,0.08))" : "#fff",
    color: "#0f172a",
    borderRadius: "16px",
    padding: "12px 16px",
    fontWeight: 800,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
  }),
  refreshButton: {
    border: "none",
    borderRadius: "16px",
    padding: "12px 16px",
    background: "#0f172a",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
  },
  sectionStack: { display: "grid", gap: "18px" },
  gridFour: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "14px",
  },
  gridTwo: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "18px",
  },
  card: {
    background: "rgba(255,255,255,0.96)",
    borderRadius: "24px",
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
  sectionTitle: { margin: 0, color: "#0f172a", fontSize: "26px", lineHeight: 1.15 },
  iconBadge: {
    width: "42px",
    height: "42px",
    borderRadius: "14px",
    display: "grid",
    placeItems: "center",
    background: "#dbeafe",
    color: "#1d4ed8",
  },
  cardGrid: { display: "grid", gap: "12px" },
  metricCard: {
    padding: "18px 20px",
    borderRadius: "20px",
    background: "#fff",
    border: "1px solid rgba(148,163,184,0.14)",
    display: "grid",
    gap: "8px",
    boxShadow: "0 16px 32px rgba(15, 23, 42, 0.06)",
  },
  metricLabel: {
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#64748b",
  },
  metricValue: { fontSize: "28px", color: "#0f172a" },
  adminRow: {
    padding: "16px",
    borderRadius: "18px",
    background: "#f8fafc",
    border: "1px solid rgba(148,163,184,0.14)",
    display: "grid",
    gap: "12px",
  },
  userLine: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    flexWrap: "wrap",
  },
  rowTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  rowTitle: { color: "#0f172a", fontSize: "16px" },
  rowMeta: { color: "#64748b", lineHeight: 1.55, fontSize: "13px", display: "block", marginTop: "4px" },
  statusBadge: (status) => ({
    padding: "8px 12px",
    borderRadius: "999px",
    background:
      status === "approved" || status === "live" || status === "PASSED"
        ? "#dcfce7"
        : status === "rejected" || status === "closed" || status === "FAILED"
        ? "#fee2e2"
        : "#dbeafe",
    color:
      status === "approved" || status === "live" || status === "PASSED"
        ? "#166534"
        : status === "rejected" || status === "closed" || status === "FAILED"
        ? "#b91c1c"
        : "#1d4ed8",
    fontWeight: 800,
    textTransform: "capitalize",
    whiteSpace: "nowrap",
  }),
  actionRow: { display: "flex", gap: "10px", flexWrap: "wrap" },
  successButton: {
    border: "none",
    borderRadius: "14px",
    padding: "10px 13px",
    background: "#16a34a",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
  },
  warningButton: {
    border: "none",
    borderRadius: "14px",
    padding: "10px 13px",
    background: "#f59e0b",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },
  dangerButton: {
    border: "none",
    borderRadius: "14px",
    padding: "10px 13px",
    background: "#dc2626",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
  },
  miniStats: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    color: "#475569",
    fontWeight: 700,
    fontSize: "13px",
  },
  resultGrid: { display: "grid", gap: "12px" },
  emptyState: {
    padding: "18px",
    borderRadius: "18px",
    background: "#f8fafc",
    border: "1px dashed rgba(148,163,184,0.26)",
    color: "#64748b",
  },
};

export default AdminPanel;
