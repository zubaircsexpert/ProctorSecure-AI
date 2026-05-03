import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Layers,
  LogIn,
  Megaphone,
  RefreshCw,
  Send,
  ShieldCheck,
  Trash2,
  Upload,
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
  studyResources: [],
  systemChecks: [],
};

const initialAnnouncementForm = {
  title: "",
  message: "",
  audience: "all",
  priority: "normal",
  type: "general",
  classroomId: "",
};

const initialStudyResourceForm = {
  classroomId: "",
  title: "",
  description: "",
  resourceType: "notes",
  externalUrl: "",
};

const initialTeacherForm = {
  name: "",
  email: "",
  password: "Teacher-12345",
  department: "",
};

const initialClassroomForm = {
  teacherId: "",
  name: "",
  department: "",
  program: "",
  section: "A",
  semester: "",
  description: "",
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
  const [announcementForm, setAnnouncementForm] = useState(initialAnnouncementForm);
  const [studyResourceForm, setStudyResourceForm] = useState(initialStudyResourceForm);
  const [studyResourceFile, setStudyResourceFile] = useState(null);
  const [teacherForm, setTeacherForm] = useState(initialTeacherForm);
  const [classroomForm, setClassroomForm] = useState(initialClassroomForm);

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

  const openPortalAccess = async (userId) => {
    setBusyKey(`impersonate-${userId}`);
    try {
      const response = await API.post(`/api/admin/impersonate/${userId}`);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      window.location.href =
        response.data.user.role === "teacher" ? "/teacher-panel" : "/dashboard";
    } catch (error) {
      setNotice(error.response?.data?.message || "Portal access failed.");
    } finally {
      setBusyKey("");
    }
  };

  const publishAnnouncement = async (event) => {
    event.preventDefault();
    setBusyKey("admin-announcement");
    try {
      await API.post("/api/admin/notifications", announcementForm);
      setAnnouncementForm(initialAnnouncementForm);
      await loadAdminData(true);
    } catch (error) {
      setNotice(error.response?.data?.message || "Announcement publish failed.");
    } finally {
      setBusyKey("");
    }
  };

  const deleteAdminItem = async (kind, id) => {
    if (!window.confirm(`Remove this ${kind}?`)) return;
    setBusyKey(`${kind}-${id}`);
    try {
      await API.delete(`/api/admin/${kind}/${id}`);
      await loadAdminData(true);
    } catch (error) {
      setNotice(error.response?.data?.message || "Delete failed.");
    } finally {
      setBusyKey("");
    }
  };

  const publishStudyResource = async (event) => {
    event.preventDefault();
    setBusyKey("admin-study-resource");
    try {
      const payload = new FormData();
      Object.entries(studyResourceForm).forEach(([key, value]) => payload.append(key, value));
      if (studyResourceFile) payload.append("file", studyResourceFile);
      await API.post("/api/study-vault", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setStudyResourceForm(initialStudyResourceForm);
      setStudyResourceFile(null);
      await loadAdminData(true);
    } catch (error) {
      setNotice(error.response?.data?.message || "Study resource publish failed.");
    } finally {
      setBusyKey("");
    }
  };

  const createTeacher = async (event) => {
    event.preventDefault();
    setBusyKey("admin-create-teacher");
    try {
      await API.post("/api/admin/teachers", teacherForm);
      setTeacherForm(initialTeacherForm);
      await loadAdminData(true);
    } catch (error) {
      setNotice(error.response?.data?.message || "Teacher creation failed.");
    } finally {
      setBusyKey("");
    }
  };

  const createClassroom = async (event) => {
    event.preventDefault();
    setBusyKey("admin-create-classroom");
    try {
      await API.post("/api/admin/classrooms", classroomForm);
      setClassroomForm(initialClassroomForm);
      await loadAdminData(true);
    } catch (error) {
      setNotice(error.response?.data?.message || "Classroom creation failed.");
    } finally {
      setBusyKey("");
    }
  };

  const deleteStudyResource = async (resourceId) => {
    if (!window.confirm("Remove this study resource?")) return;
    setBusyKey(`study-${resourceId}`);
    try {
      await API.delete(`/api/study-vault/${resourceId}`);
      await loadAdminData(true);
    } catch (error) {
      setNotice(error.response?.data?.message || "Study resource delete failed.");
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
    { id: "system", label: "Vault & Checks", icon: Layers },
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
            <form onSubmit={createTeacher} style={styles.inlineForm}>
              <input value={teacherForm.name} onChange={(event) => setTeacherForm({ ...teacherForm, name: event.target.value })} placeholder="Teacher name" style={styles.input} />
              <input value={teacherForm.email} onChange={(event) => setTeacherForm({ ...teacherForm, email: event.target.value })} placeholder="Teacher email" style={styles.input} />
              <input value={teacherForm.password} onChange={(event) => setTeacherForm({ ...teacherForm, password: event.target.value })} placeholder="Temporary password" style={styles.input} />
              <input value={teacherForm.department} onChange={(event) => setTeacherForm({ ...teacherForm, department: event.target.value })} placeholder="Department" style={styles.input} />
              <button type="submit" style={styles.primaryButton} disabled={busyKey === "admin-create-teacher"}>
                <CheckCircle2 size={15} />
                Create Teacher
              </button>
            </form>
            {data.teachers.length === 0 ? <EmptyState text="No teacher accounts yet." /> : null}
            {data.teachers.map((teacher) => (
              <div key={teacher._id} style={styles.adminRow}>
                <UserRow user={teacher} />
                <div style={styles.actionRow}>
                  <button
                    type="button"
                    style={styles.primaryButton}
                    disabled={busyKey === `impersonate-${teacher._id}`}
                    onClick={() => openPortalAccess(teacher._id)}
                  >
                    <LogIn size={15} />
                    Open Teacher Portal
                  </button>
                  <button
                    type="button"
                    style={styles.dangerButton}
                    onClick={() => deleteAdminItem("users", teacher._id)}
                  >
                    <Trash2 size={15} />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </Panel>

          <Panel title="Students" kicker="Approval control" icon={<Users size={18} />}>
            <form onSubmit={createClassroom} style={styles.inlineForm}>
              <select value={classroomForm.teacherId} onChange={(event) => setClassroomForm({ ...classroomForm, teacherId: event.target.value })} style={styles.input}>
                <option value="">Assign teacher</option>
                {data.teachers.map((teacher) => (
                  <option key={teacher._id} value={teacher._id}>{teacher.name}</option>
                ))}
              </select>
              <input value={classroomForm.name} onChange={(event) => setClassroomForm({ ...classroomForm, name: event.target.value })} placeholder="Classroom name" style={styles.input} />
              <input value={classroomForm.department} onChange={(event) => setClassroomForm({ ...classroomForm, department: event.target.value })} placeholder="Department" style={styles.input} />
              <input value={classroomForm.program} onChange={(event) => setClassroomForm({ ...classroomForm, program: event.target.value })} placeholder="Program" style={styles.input} />
              <input value={classroomForm.section} onChange={(event) => setClassroomForm({ ...classroomForm, section: event.target.value })} placeholder="Section" style={styles.input} />
              <input value={classroomForm.semester} onChange={(event) => setClassroomForm({ ...classroomForm, semester: event.target.value })} placeholder="Semester" style={styles.input} />
              <button type="submit" style={styles.primaryButton} disabled={busyKey === "admin-create-classroom"}>
                <CheckCircle2 size={15} />
                Create Classroom
              </button>
            </form>
            {data.students.length === 0 ? <EmptyState text="No student accounts yet." /> : null}
            {data.students.map((student) => (
              <div key={student._id} style={styles.adminRow}>
                <UserRow user={student} />
                <div style={styles.actionRow}>
                  <button
                    type="button"
                    style={styles.primaryButton}
                    disabled={busyKey === `impersonate-${student._id}`}
                    onClick={() => openPortalAccess(student._id)}
                  >
                    <LogIn size={15} />
                    Open Student Portal
                  </button>
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
                  <button
                    type="button"
                    style={styles.dangerButton}
                    onClick={() => deleteAdminItem("users", student._id)}
                  >
                    <Trash2 size={15} />
                    Remove
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
            onDelete={(id) => deleteAdminItem("exams", id)}
          />
          <AssessmentPanel
            title="Quizzes"
            items={data.quizzes}
            busyKey={busyKey}
            onUpdate={updateAssessment}
            onDelete={(id) => deleteAdminItem("exams", id)}
          />
        </section>
      ) : null}

      {activeTab === "results" ? (
        <Panel title="All Student Results" kicker="AI exam and quiz ledger" icon={<ClipboardCheck size={18} />}>
          {resultRows.length === 0 ? <EmptyState text="No results submitted yet." /> : null}
          <div style={styles.resultGrid}>
            {resultRows.map((result) => (
              <div key={result._id} style={styles.adminRow}>
                <ResultRow result={result} detailed />
                <button
                  type="button"
                  style={styles.dangerButton}
                  onClick={() => deleteAdminItem("results", result._id)}
                >
                  <Trash2 size={15} />
                  Delete Result
                </button>
              </div>
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
                <button type="button" style={styles.dangerButton} onClick={() => deleteAdminItem("assignments", assignment._id)}>
                  <Trash2 size={15} />
                  Remove Assignment
                </button>
              </div>
            ))}
          </Panel>

          <Panel title="Announcements" kicker="Notification feed" icon={<Megaphone size={18} />}>
            <form onSubmit={publishAnnouncement} style={styles.inlineForm}>
              <input
                value={announcementForm.title}
                onChange={(event) => setAnnouncementForm({ ...announcementForm, title: event.target.value })}
                placeholder="Announcement title"
                style={styles.input}
              />
              <textarea
                value={announcementForm.message}
                onChange={(event) => setAnnouncementForm({ ...announcementForm, message: event.target.value })}
                placeholder="Message for students/teachers"
                style={{ ...styles.input, minHeight: "90px" }}
              />
              <select
                value={announcementForm.audience}
                onChange={(event) => setAnnouncementForm({ ...announcementForm, audience: event.target.value })}
                style={styles.input}
              >
                <option value="all">All users</option>
                <option value="all-students">All students</option>
                <option value="teachers">Teachers</option>
                <option value="classroom">Selected classroom</option>
              </select>
              <select
                value={announcementForm.classroomId}
                onChange={(event) => setAnnouncementForm({ ...announcementForm, classroomId: event.target.value })}
                style={styles.input}
              >
                <option value="">No classroom</option>
                {data.classrooms.map((classroom) => (
                  <option key={classroom._id} value={classroom._id}>
                    {classroom.name || classroom.program || classroom.department}
                  </option>
                ))}
              </select>
              <button type="submit" style={styles.primaryButton} disabled={busyKey === "admin-announcement"}>
                <Send size={15} />
                Publish Announcement
              </button>
            </form>
            {data.notifications.length === 0 ? <EmptyState text="No announcements yet." /> : null}
            {data.notifications.map((notice) => (
              <div key={notice._id} style={styles.adminRow}>
                <strong style={styles.rowTitle}>{notice.title}</strong>
                <span style={styles.rowMeta}>{notice.message}</span>
                <button type="button" style={styles.dangerButton} onClick={() => deleteAdminItem("notifications", notice._id)}>
                  <Trash2 size={15} />
                  Remove Notice
                </button>
              </div>
            ))}
          </Panel>
        </section>
      ) : null}

      {activeTab === "system" ? (
        <section style={styles.gridTwo}>
          <Panel title="Study Vault" kicker="All teacher resources" icon={<Layers size={18} />}>
            <form onSubmit={publishStudyResource} style={styles.inlineForm}>
              <input
                value={studyResourceForm.title}
                onChange={(event) => setStudyResourceForm({ ...studyResourceForm, title: event.target.value })}
                placeholder="Resource title"
                style={styles.input}
              />
              <select
                value={studyResourceForm.classroomId}
                onChange={(event) => setStudyResourceForm({ ...studyResourceForm, classroomId: event.target.value })}
                style={styles.input}
              >
                <option value="">Select classroom</option>
                {data.classrooms.map((classroom) => (
                  <option key={classroom._id} value={classroom._id}>
                    {classroom.name || classroom.program || classroom.department}
                  </option>
                ))}
              </select>
              <select
                value={studyResourceForm.resourceType}
                onChange={(event) => setStudyResourceForm({ ...studyResourceForm, resourceType: event.target.value })}
                style={styles.input}
              >
                <option value="notes">Notes</option>
                <option value="pdf">PDF</option>
                <option value="slides">Slides</option>
                <option value="lecture">Recorded lecture</option>
                <option value="link">Link</option>
                <option value="other">Other</option>
              </select>
              <input
                value={studyResourceForm.externalUrl}
                onChange={(event) => setStudyResourceForm({ ...studyResourceForm, externalUrl: event.target.value })}
                placeholder="Optional external link"
                style={styles.input}
              />
              <textarea
                value={studyResourceForm.description}
                onChange={(event) => setStudyResourceForm({ ...studyResourceForm, description: event.target.value })}
                placeholder="Resource description"
                style={{ ...styles.input, minHeight: "86px" }}
              />
              <input
                type="file"
                onChange={(event) => setStudyResourceFile(event.target.files?.[0] || null)}
                style={styles.input}
              />
              <button type="submit" style={styles.primaryButton} disabled={busyKey === "admin-study-resource"}>
                <Upload size={15} />
                Publish Resource
              </button>
            </form>
            {data.studyResources.length === 0 ? <EmptyState text="No study vault resources yet." /> : null}
            {data.studyResources.map((resource) => (
              <div key={resource._id} style={styles.adminRow}>
                <strong style={styles.rowTitle}>{resource.title}</strong>
                <span style={styles.rowMeta}>{resource.classroomName || "Classroom"} | {resource.resourceType || "notes"}</span>
                <button type="button" style={styles.dangerButton} onClick={() => deleteStudyResource(resource._id)}>
                  <Trash2 size={15} />
                  Remove Resource
                </button>
              </div>
            ))}
          </Panel>

          <Panel title="System Checks" kicker="Student readiness logs" icon={<ShieldCheck size={18} />}>
            {data.systemChecks.length === 0 ? <EmptyState text="No system check reports yet." /> : null}
            {data.systemChecks.map((check) => (
              <div key={check._id} style={styles.adminRow}>
                <strong style={styles.rowTitle}>{check.studentName || "Student"}</strong>
                <span style={styles.rowMeta}>
                  {check.classroomName || "Classroom"} | Camera {check.camera} | Mic {check.microphone} | Internet {check.internet}
                </span>
                <span style={styles.rowMeta}>{check.speedMbps || 0} Mbps | {check.latencyMs || 0} ms | {formatDateTime(check.createdAt)}</span>
              </div>
            ))}
          </Panel>
        </section>
      ) : null}
    </div>
  );
};

const AssessmentPanel = ({ title, items, busyKey, onUpdate, onDelete }) => (
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
          <button
            type="button"
            style={styles.dangerButton}
            disabled={busyKey === `exams-${item._id}`}
            onClick={() => onDelete(item._id)}
          >
            <Trash2 size={15} />
            Delete
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
  inlineForm: {
    display: "grid",
    gap: "10px",
    padding: "16px",
    borderRadius: "18px",
    background: "#f8fafc",
    border: "1px solid rgba(148,163,184,0.14)",
  },
  input: {
    width: "100%",
    border: "1px solid rgba(148,163,184,0.22)",
    borderRadius: "14px",
    padding: "12px 14px",
    fontSize: "14px",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  primaryButton: {
    border: "none",
    borderRadius: "14px",
    padding: "10px 13px",
    background: "linear-gradient(135deg, #1d4ed8, #0f766e)",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
  },
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
