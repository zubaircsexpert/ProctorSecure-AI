import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Camera,
  CheckCircle2,
  ClipboardX,
  Eye,
  Gauge,
  Mic,
  MonitorStop,
  Plus,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import API from "../services/api";
import { getAuthUser } from "../utils/authSession";

const defaultQuestion = {
  questionText: "",
  options: ["", "", "", ""],
  correctAnswer: "",
  explanation: "",
};

const violationWeights = {
  tab_switch: 10,
  focus_loss: 10,
  fullscreen_exit: 15,
  copy: 25,
  paste: 25,
  cut: 20,
  right_click: 12,
  text_selection: 8,
  inspect_element: 40,
  keyboard_shortcut: 20,
  print_screen: 30,
  browser_resize: 8,
  inactivity: 10,
  no_face: 25,
  multiple_faces: 50,
  looking_away: 20,
  voice_detected: 20,
  camera_disabled: 35,
  microphone_disabled: 15,
};

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
};

function ExamAI() {
  const user = getAuthUser();
  const isTeacher = user?.role === "teacher" || user?.role === "admin";
  const [exams, setExams] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [activeExam, setActiveExam] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [examRes, reportRes] = await Promise.all([
        API.get("/api/exam-ai"),
        isTeacher ? API.get("/api/exam-ai/reports/all") : Promise.resolve({ data: [] }),
      ]);
      setExams(examRes.data || []);
      setReports(reportRes.data || []);
    } catch (error) {
      setNotice(error.response?.data?.message || "Exam AI data could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (activeExam) {
    return <StudentExamAI exam={activeExam} onExit={() => { setActiveExam(null); loadData(); }} />;
  }

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div>
          <div style={styles.badge}>Premium Exam AI</div>
          <h1 style={styles.title}>AI-powered secure examination</h1>
          <p style={styles.subtitle}>
            Proctored MCQs, fullscreen protection, browser activity tracking, webcam and microphone signals, and integrity reports.
          </p>
        </div>
        <div style={styles.heroStats}>
          <Metric label="AI Exams" value={exams.length} />
          <Metric label="Reports" value={reports.length} />
          <Metric label="Mode" value={isTeacher ? "Teacher" : "Student"} />
        </div>
      </section>

      {notice ? <div style={styles.notice}>{notice}</div> : null}

      {loading ? (
        <div style={styles.panel}>Loading Exam AI...</div>
      ) : isTeacher ? (
        <TeacherExamAI exams={exams} reports={reports} onRefresh={loadData} setNotice={setNotice} />
      ) : (
        <StudentExamList exams={exams} onStart={setActiveExam} />
      )}
    </div>
  );
}

const TeacherExamAI = ({ exams, reports, onRefresh, setNotice }) => {
  const [form, setForm] = useState({
    title: "",
    subject: "",
    description: "",
    duration: 30,
    passingMarks: 1,
    isPublished: false,
    questions: [{ ...defaultQuestion }],
  });

  const updateQuestion = (index, patch) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((question, qIndex) => (qIndex === index ? { ...question, ...patch } : question)),
    }));
  };

  const updateOption = (qIndex, optionIndex, value) => {
    const question = form.questions[qIndex];
    const options = [...question.options];
    options[optionIndex] = value;
    updateQuestion(qIndex, { options, correctAnswer: question.correctAnswer || value });
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    try {
      await API.post("/api/exam-ai", form);
      setForm({ title: "", subject: "", description: "", duration: 30, passingMarks: 1, isPublished: false, questions: [{ ...defaultQuestion }] });
      setNotice("Exam AI created successfully.");
      onRefresh();
    } catch (error) {
      setNotice(error.response?.data?.message || "Could not create Exam AI.");
    }
  };

  const togglePublish = async (exam) => {
    await API.put(`/api/exam-ai/${exam.id}/status`, { isPublished: !exam.isPublished });
    onRefresh();
  };

  const deleteExam = async (exam) => {
    if (!window.confirm(`Delete ${exam.title}?`)) return;
    await API.delete(`/api/exam-ai/${exam.id}`);
    onRefresh();
  };

  return (
    <div style={styles.teacherGrid}>
      <form onSubmit={handleCreate} style={styles.panel}>
        <h2 style={styles.panelTitle}>Create AI exam</h2>
        <div style={styles.formGrid}>
          <input placeholder="Exam title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={styles.input} />
          <input placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} style={styles.input} />
          <input type="number" min="5" placeholder="Duration" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} style={styles.input} />
          <input type="number" min="1" placeholder="Passing marks" value={form.passingMarks} onChange={(e) => setForm({ ...form, passingMarks: Number(e.target.value) })} style={styles.input} />
        </div>
        <textarea placeholder="Instructions / description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={styles.textarea} />

        <div style={styles.questionStack}>
          {form.questions.map((question, qIndex) => (
            <div key={qIndex} style={styles.questionEditor}>
              <input placeholder={`Question ${qIndex + 1}`} value={question.questionText} onChange={(e) => updateQuestion(qIndex, { questionText: e.target.value })} style={styles.input} />
              <div style={styles.optionGrid}>
                {question.options.map((option, optionIndex) => (
                  <input key={optionIndex} placeholder={`Option ${optionIndex + 1}`} value={option} onChange={(e) => updateOption(qIndex, optionIndex, e.target.value)} style={styles.input} />
                ))}
              </div>
              <select value={question.correctAnswer} onChange={(e) => updateQuestion(qIndex, { correctAnswer: e.target.value })} style={styles.input}>
                <option value="">Select correct answer</option>
                {question.options.filter(Boolean).map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              <input placeholder="Explanation" value={question.explanation} onChange={(e) => updateQuestion(qIndex, { explanation: e.target.value })} style={styles.input} />
            </div>
          ))}
        </div>

        <div style={styles.row}>
          <button type="button" onClick={() => setForm({ ...form, questions: [...form.questions, { ...defaultQuestion }] })} style={styles.ghostButton}>
            <Plus size={16} /> Add MCQ
          </button>
          <label style={styles.checkLabel}>
            <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
            Publish now
          </label>
        </div>
        <button type="submit" style={styles.primaryButton}>Create Exam AI</button>
      </form>

      <div style={styles.sideStack}>
        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>Manage exams</h2>
          {exams.map((exam) => (
            <div key={exam.id} style={styles.examCard}>
              <div>
                <strong>{exam.title}</strong>
                <span>{exam.subject} | {exam.questionCount} MCQs | {exam.isPublished ? "Published" : "Draft"}</span>
              </div>
              <div style={styles.row}>
                <button onClick={() => togglePublish(exam)} style={styles.smallButton}>{exam.isPublished ? "Unpublish" : "Publish"}</button>
                <button onClick={() => deleteExam(exam)} style={styles.dangerIcon}><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </section>

        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>Integrity reports</h2>
          {reports.slice(0, 8).map((report) => (
            <div key={report._id} style={styles.reportCard}>
              <strong>{report.studentName}</strong>
              <span>{report.examTitle}</span>
              <b>{report.integrityStatus} | cheating {report.cheatingScore}</b>
            </div>
          ))}
          {!reports.length ? <p style={styles.muted}>No AI reports yet.</p> : null}
        </section>
      </div>
    </div>
  );
};

const StudentExamList = ({ exams, onStart }) => (
  <div style={styles.examGrid}>
    {exams.map((exam) => (
      <div key={exam.id} style={styles.studentExamCard}>
        <div style={styles.iconBubble}><ShieldAlert size={24} /></div>
        <h2>{exam.title}</h2>
        <p>{exam.description || `${exam.subject} secure AI exam`}</p>
        <div style={styles.metaLine}>{exam.duration} min | {exam.questionCount} MCQs | pass {exam.passingMarks}</div>
        <button onClick={() => onStart(exam)} style={styles.primaryButton}>Start secure exam</button>
      </div>
    ))}
    {!exams.length ? <div style={styles.panel}>No published Exam AI assessments yet.</div> : null}
  </div>
);

const StudentExamAI = ({ exam, onExit }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const [answers, setAnswers] = useState({});
  const [logs, setLogs] = useState([]);
  const [cheatingScore, setCheatingScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState((exam.duration || 30) * 60);
  const [cameraStatus, setCameraStatus] = useState("starting");
  const [micStatus, setMicStatus] = useState("starting");
  const [submitted, setSubmitted] = useState(null);

  const addViolation = async (violationType, message, confidenceScore = 1) => {
    const weight = violationWeights[violationType] || 5;
    const item = { violationType, message, weight, confidenceScore, timestamp: new Date().toISOString() };
    setLogs((prev) => [item, ...prev].slice(0, 60));
    setCheatingScore((prev) => prev + weight);
    try {
      await API.post(`/api/exam-ai/${exam.id}/violations`, item);
    } catch {
      // Keep local log even if the network is temporarily unavailable.
    }
  };

  useEffect(() => {
    const startMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCameraStatus("active");
        setMicStatus("active");
      } catch {
        setCameraStatus("blocked");
        setMicStatus("blocked");
        addViolation("camera_disabled", "Camera or microphone permission was blocked.");
      }
    };
    startMedia();

    return () => {
      streamRef.current?.getTracks?.().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    const requestFullscreen = () => document.documentElement.requestFullscreen?.().catch(() => {});
    requestFullscreen();

    const markActivity = () => { lastActivityRef.current = Date.now(); };
    const handlers = {
      visibilitychange: () => document.hidden && addViolation("tab_switch", "Tab switched or page hidden."),
      blur: () => addViolation("focus_loss", "Browser focus lost or app changed."),
      fullscreenchange: () => !document.fullscreenElement && addViolation("fullscreen_exit", "Fullscreen mode exited."),
      copy: (event) => { event.preventDefault(); addViolation("copy", "Copy attempt blocked."); },
      paste: (event) => { event.preventDefault(); addViolation("paste", "Paste attempt blocked."); },
      cut: (event) => { event.preventDefault(); addViolation("cut", "Cut attempt blocked."); },
      contextmenu: (event) => { event.preventDefault(); addViolation("right_click", "Right click blocked."); },
      selectstart: () => addViolation("text_selection", "Text selection detected."),
      resize: () => addViolation("browser_resize", "Browser window resized."),
      keydown: (event) => {
        markActivity();
        const key = event.key.toLowerCase();
        if (event.key === "PrintScreen") addViolation("print_screen", "Print screen key detected.");
        if (event.key === "Meta" || event.key === "Alt") addViolation("keyboard_shortcut", "System shortcut key detected.");
        if ((event.ctrlKey || event.metaKey) && ["c", "v", "x", "p", "s", "u", "i", "j"].includes(key)) {
          event.preventDefault();
          addViolation(key === "i" || key === "j" ? "inspect_element" : "keyboard_shortcut", "Restricted keyboard shortcut blocked.");
        }
      },
      mousemove: markActivity,
      click: markActivity,
    };

    Object.entries(handlers).forEach(([name, handler]) => window.addEventListener(name, handler));
    document.addEventListener("fullscreenchange", handlers.fullscreenchange);
    document.addEventListener("visibilitychange", handlers.visibilitychange);

    const inactivity = setInterval(() => {
      if (Date.now() - lastActivityRef.current > 45000) {
        lastActivityRef.current = Date.now();
        addViolation("inactivity", "No activity detected for 45 seconds.");
      }
    }, 5000);

    return () => {
      Object.entries(handlers).forEach(([name, handler]) => window.removeEventListener(name, handler));
      document.removeEventListener("fullscreenchange", handlers.fullscreenchange);
      document.removeEventListener("visibilitychange", handlers.visibilitychange);
      clearInterval(inactivity);
    };
  }, []);

  useEffect(() => {
    if (submitted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted, answers, logs, cheatingScore]);

  const handleSubmit = async () => {
    const response = await API.post(`/api/exam-ai/${exam.id}/submit`, { answers, violations: logs });
    setSubmitted(response.data);
    document.exitFullscreen?.().catch(() => {});
  };

  if (submitted) {
    return (
      <div style={styles.page}>
        <section style={styles.panel}>
          <CheckCircle2 size={42} color="#10b981" />
          <h1 style={styles.panelTitle}>Exam submitted</h1>
          <p>Academic score: {submitted.result.score}/{submitted.result.totalMarks} ({submitted.result.percentage}%)</p>
          <p>Integrity: {submitted.result.integrityStatus} | Cheating score {submitted.result.cheatingScore}</p>
          <button onClick={onExit} style={styles.primaryButton}>Back to Exam AI</button>
        </section>
      </div>
    );
  }

  return (
    <div style={styles.examRuntime}>
      <main style={styles.questionPane}>
        <div style={styles.runtimeHeader}>
          <div>
            <strong>{exam.title}</strong>
            <span>{exam.subject} | {exam.questions.length} MCQs</span>
          </div>
          <b>{formatTime(timeLeft)}</b>
        </div>
        {exam.questions.map((question, index) => (
          <section key={question.id} style={styles.questionCard}>
            <h3>{index + 1}. {question.questionText}</h3>
            <div style={styles.answerGrid}>
              {question.options.map((option) => (
                <button
                  key={option}
                  onClick={() => setAnswers({ ...answers, [question.id]: option })}
                  style={answers[question.id] === option ? styles.answerActive : styles.answerButton}
                >
                  {option}
                </button>
              ))}
            </div>
          </section>
        ))}
        <button onClick={handleSubmit} style={styles.submitButton}>Submit secure exam</button>
      </main>

      <aside style={styles.monitorPane}>
        <video ref={videoRef} autoPlay muted playsInline style={styles.video} />
        <div style={styles.monitorGrid}>
          <Monitor label="Camera" value={cameraStatus} icon={Camera} />
          <Monitor label="Microphone" value={micStatus} icon={Mic} />
          <Monitor label="Fullscreen" value={document.fullscreenElement ? "active" : "watching"} icon={MonitorStop} />
          <Monitor label="Cheating" value={cheatingScore} icon={Gauge} />
        </div>
        <div style={styles.scoreBox}>
          <Activity size={18} />
          <span>AI integrity score</span>
          <strong>{Math.max(0, 100 - cheatingScore)}%</strong>
        </div>
        <div style={styles.logBox}>
          <h3>Real-time suspicious activity logs</h3>
          {logs.map((log, index) => (
            <div key={`${log.timestamp}-${index}`} style={styles.logItem}>
              <ClipboardX size={14} />
              <span>{new Date(log.timestamp).toLocaleTimeString()} - {log.message}</span>
              <b>+{log.weight}</b>
            </div>
          ))}
          {!logs.length ? <p style={styles.muted}>No violations detected yet.</p> : null}
        </div>
      </aside>
    </div>
  );
};

const Metric = ({ label, value }) => <div style={styles.metric}><span>{label}</span><strong>{value}</strong></div>;
const Monitor = ({ label, value, icon: Icon }) => <div style={styles.monitorCard}><Icon size={18} /><span>{label}</span><strong>{value}</strong></div>;

const styles = {
  page: { minHeight: "100vh", padding: "28px 24px", background: "linear-gradient(180deg, #07111f 0%, #0f172a 45%, #eef4ff 45%, #f8fafc 100%)" },
  hero: { maxWidth: 1180, margin: "0 auto 22px", color: "#fff", display: "flex", justifyContent: "space-between", gap: 18, flexWrap: "wrap" },
  badge: { display: "inline-flex", padding: "8px 12px", borderRadius: 999, background: "rgba(34,211,238,.14)", border: "1px solid rgba(34,211,238,.24)", fontWeight: 900 },
  title: { margin: "14px 0 8px", fontSize: "clamp(32px, 5vw, 58px)", lineHeight: 1, letterSpacing: 0 },
  subtitle: { margin: 0, maxWidth: 720, color: "rgba(255,255,255,.76)", lineHeight: 1.7 },
  heroStats: { display: "grid", gridTemplateColumns: "repeat(3, minmax(90px, 1fr))", gap: 10, alignSelf: "end" },
  metric: { background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.14)", borderRadius: 16, padding: 14, display: "grid", gap: 6 },
  panel: { maxWidth: 1180, margin: "0 auto", background: "#fff", borderRadius: 22, padding: 22, boxShadow: "0 20px 50px rgba(15,23,42,.1)", border: "1px solid #e2e8f0" },
  panelTitle: { margin: "0 0 14px", color: "#0f172a", letterSpacing: 0 },
  notice: { maxWidth: 1180, margin: "0 auto 18px", padding: 14, borderRadius: 14, background: "#fef3c7", color: "#92400e", fontWeight: 800 },
  teacherGrid: { maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: "minmax(0, 1.25fr) minmax(320px, .75fr)", gap: 18 },
  sideStack: { display: "grid", gap: 18, alignContent: "start" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 },
  input: { width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 14, border: "1px solid #cbd5e1" },
  textarea: { width: "100%", boxSizing: "border-box", minHeight: 90, padding: 14, borderRadius: 14, border: "1px solid #cbd5e1", marginTop: 12 },
  questionStack: { display: "grid", gap: 12, marginTop: 12 },
  questionEditor: { display: "grid", gap: 10, padding: 14, borderRadius: 16, background: "#f8fafc", border: "1px solid #e2e8f0" },
  optionGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 },
  row: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
  checkLabel: { display: "inline-flex", gap: 8, alignItems: "center", fontWeight: 800, color: "#0f172a" },
  primaryButton: { border: "none", borderRadius: 14, padding: "12px 16px", background: "linear-gradient(135deg,#2563eb,#06b6d4)", color: "#fff", fontWeight: 900, cursor: "pointer" },
  ghostButton: { border: "1px solid #bfdbfe", borderRadius: 14, padding: "10px 14px", background: "#eff6ff", color: "#1d4ed8", fontWeight: 900, cursor: "pointer", display: "inline-flex", gap: 8, alignItems: "center" },
  smallButton: { border: "none", borderRadius: 12, padding: "9px 12px", background: "#0f172a", color: "#fff", fontWeight: 800, cursor: "pointer" },
  dangerIcon: { border: "none", borderRadius: 12, width: 38, height: 38, background: "#fee2e2", color: "#b91c1c", cursor: "pointer" },
  examCard: { display: "flex", justifyContent: "space-between", gap: 12, padding: 14, borderRadius: 16, background: "#f8fafc", border: "1px solid #e2e8f0", marginBottom: 10 },
  reportCard: { display: "grid", gap: 4, padding: 12, borderRadius: 14, background: "#f8fafc", border: "1px solid #e2e8f0", marginBottom: 10 },
  muted: { color: "#64748b" },
  examGrid: { maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 },
  studentExamCard: { background: "#fff", borderRadius: 22, padding: 22, boxShadow: "0 18px 45px rgba(15,23,42,.1)", border: "1px solid #e2e8f0" },
  iconBubble: { width: 54, height: 54, borderRadius: 18, display: "grid", placeItems: "center", background: "#e0f2fe", color: "#0369a1" },
  metaLine: { color: "#475569", fontWeight: 800, marginBottom: 16 },
  examRuntime: { minHeight: "100vh", display: "grid", gridTemplateColumns: "minmax(0, 1fr) 360px", background: "#eef4ff" },
  questionPane: { padding: 22, overflowY: "auto" },
  runtimeHeader: { position: "sticky", top: 0, zIndex: 2, display: "flex", justifyContent: "space-between", padding: 16, borderRadius: 18, background: "#0f172a", color: "#fff", marginBottom: 16 },
  questionCard: { background: "#fff", borderRadius: 18, padding: 18, border: "1px solid #e2e8f0", marginBottom: 14 },
  answerGrid: { display: "grid", gap: 10 },
  answerButton: { textAlign: "left", padding: 13, borderRadius: 14, border: "1px solid #cbd5e1", background: "#f8fafc", cursor: "pointer", fontWeight: 800 },
  answerActive: { textAlign: "left", padding: 13, borderRadius: 14, border: "2px solid #2563eb", background: "#eff6ff", cursor: "pointer", fontWeight: 900 },
  submitButton: { width: "100%", border: "none", borderRadius: 16, padding: 16, background: "#10b981", color: "#fff", fontWeight: 900, cursor: "pointer" },
  monitorPane: { background: "#07111f", color: "#fff", padding: 18, display: "grid", gap: 14, alignContent: "start" },
  video: { width: "100%", aspectRatio: "4/3", background: "#020617", borderRadius: 18, objectFit: "cover", border: "1px solid rgba(255,255,255,.16)" },
  monitorGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  monitorCard: { display: "grid", gap: 5, padding: 12, borderRadius: 14, background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)" },
  scoreBox: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: 14, borderRadius: 16, background: "linear-gradient(135deg,rgba(37,99,235,.35),rgba(16,185,129,.22))" },
  logBox: { maxHeight: 360, overflowY: "auto", padding: 12, borderRadius: 16, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)" },
  logItem: { display: "grid", gridTemplateColumns: "18px 1fr auto", gap: 8, alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,.08)", fontSize: 13 },
};

export default ExamAI;
