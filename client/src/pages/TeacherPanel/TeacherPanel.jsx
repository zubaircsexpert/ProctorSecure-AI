import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, ClipboardList, Pencil, Play, Square, Trash2, XCircle } from "lucide-react";
import NotificationManager from "./NotificationManager";
import AssignmentManager from "./AssignmentManager";
import ResultsList from "./ResultsList";
import API from "../../services/api";

const TeacherPanel = () => {
  const [activeTab, setActiveTab] = useState("exams");

  const [notifications, setNotifications] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "general",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const [exams, setExams] = useState([]);
  const [examForm, setExamForm] = useState({
    course: "",
    title: "",
    syllabus: "",
    duration: "",
    examKey: "",
    startTime: "",
    endTime: "",
  });
  const [editingExamId, setEditingExamId] = useState(null);

  const [assignments, setAssignments] = useState([]);
  const [assignForm, setAssignForm] = useState({ title: "", dueDate: "" });
  const [selectedFile, setSelectedFile] = useState(null);
  const [marksInput, setMarksInput] = useState({});

  const [questionForm, setQuestionForm] = useState({
    examId: "",
    questionText: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: "",
  });

  const isExamEditing = Boolean(editingExamId);

  useEffect(() => {
    fetchExams();
    const examInterval = setInterval(fetchExams, 10000);
    return () => clearInterval(examInterval);
  }, []);

  useEffect(() => {
    if (activeTab === "notifications" && notifications.length === 0) {
      fetchNotifications();
    }

    if (activeTab === "assignments" && assignments.length === 0) {
      fetchAssignments();
    }
  }, [activeTab]);

  const toISODateTime = (value) => {
    return value ? new Date(value).toISOString() : null;
  };

  const toLocalInputValue = (value) => {
    if (!value) return "";
    const date = new Date(value);
    const pad = (n) => String(n).padStart(2, "0");

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const resetExamForm = () => {
    setExamForm({
      course: "",
      title: "",
      syllabus: "",
      duration: "",
      examKey: "",
      startTime: "",
      endTime: "",
    });
    setEditingExamId(null);
  };

  const fetchNotifications = async () => {
    try {
      const res = await API.get("/api/notifications/all");
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const fetchExams = async () => {
    try {
      const res = await API.get("/api/exams/all");
      setExams(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching exams:", err);
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await API.get("/api/assignments/all");
      setAssignments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching assignments:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await API.put(`/api/notifications/update/${currentId}`, formData);
        setIsEditing(false);
      } else {
        await API.post("/api/notifications/add", formData);
      }

      setFormData({ title: "", message: "", type: "general" });
      fetchNotifications();
    } catch {
      alert("Failed to save notification");
    }
  };

  const handleExamPost = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        course: examForm.course,
        title: examForm.title,
        syllabus: examForm.syllabus,
        duration: Number(examForm.duration),
        examKey: examForm.examKey,
        startTime: toISODateTime(examForm.startTime),
        endTime: toISODateTime(examForm.endTime),
      };

      if (isExamEditing) {
        await API.put(`/api/exams/update/${editingExamId}`, payload);
        alert("Exam Updated ✅");
      } else {
        await API.post("/api/exams/add", payload);
        alert("Exam Scheduled ✅");
      }

      resetExamForm();
      fetchExams();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save exam");
    }
  };

  const startEditExam = (exam) => {
    setEditingExamId(exam._id);
    setExamForm({
      course: exam.course || "",
      title: exam.title || "",
      syllabus: exam.syllabus || "",
      duration: exam.duration || "",
      examKey: exam.examKey || "",
      startTime: toLocalInputValue(exam.startTime),
      endTime: toLocalInputValue(exam.endTime),
    });
    setActiveTab("exams");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateExamState = async (id, payload) => {
    try {
      await API.put(`/api/exams/update-status/${id}`, payload);
      fetchExams();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update exam");
    }
  };

  const goLiveExam = async (exam) => {
    await updateExamState(exam._id, {
      status: "live",
      accessGranted: true,
    });
  };

  const stopExamAccess = async (exam) => {
    await updateExamState(exam._id, {
      status: "scheduled",
      accessGranted: false,
    });
  };

  const closeExam = async (exam) => {
    await updateExamState(exam._id, {
      status: "closed",
      accessGranted: false,
    });
  };

  const deleteExam = async (id) => {
    const ok = window.confirm("Are you sure you want to delete this exam?");
    if (!ok) return;

    try {
      await API.delete(`/api/exams/delete/${id}`);
      fetchExams();

      if (editingExamId === id) {
        resetExamForm();
      }

      alert("Exam deleted ✅");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete exam");
    }
  };

  const handleQuestionSubmit = async (e) => {
    e.preventDefault();

    if (!questionForm.examId) {
      return alert("Select an exam first");
    }

    try {
      const payload = {
        examId: questionForm.examId,
        questionText: questionForm.questionText,
        options: [
          questionForm.optionA,
          questionForm.optionB,
          questionForm.optionC,
          questionForm.optionD,
        ],
        correctAnswer: questionForm.correctAnswer,
      };

      await API.post("/api/questions/add", payload);

      alert("MCQ Added Successfully ✅");
      setQuestionForm({
        examId: questionForm.examId,
        questionText: "",
        optionA: "",
        optionB: "",
        optionC: "",
        optionD: "",
        correctAnswer: "",
      });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add MCQ");
    }
  };

  const handleAssignPost = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append("title", assignForm.title);
      data.append("dueDate", assignForm.dueDate);
      if (selectedFile) data.append("file", selectedFile);

      await API.post("/api/assignments/add", data);
      setAssignForm({ title: "", dueDate: "" });
      setSelectedFile(null);
      fetchAssignments();
    } catch {
      alert("Failed to upload assignment");
    }
  };

  const handleGiveMarks = async (assignmentId) => {
    const marks = marksInput[assignmentId];

    if (!String(marks || "").trim()) {
      alert("Please enter marks first");
      return;
    }

    try {
      await API.post("/api/assignments/give-marks", {
        assignmentId,
        marks,
      });

      setMarksInput((prev) => ({
        ...prev,
        [assignmentId]: "",
      }));

      fetchAssignments();
      alert("Marks saved successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save marks");
    }
  };

  const handleDelete = async (type, id) => {
    try {
      await API.delete(`/api/${type}/delete/${id}`);
      if (type === "notifications") fetchNotifications();
      else if (type === "assignments") fetchAssignments();
      else if (type === "exams") fetchExams();
    } catch {
      alert("Delete failed");
    }
  };

  const examStats = useMemo(() => {
    const live = exams.filter((ex) => ex.status === "live").length;
    const scheduled = exams.filter((ex) => ex.status === "scheduled").length;
    const closed = exams.filter((ex) => ex.status === "closed").length;
    return { live, scheduled, closed };
  }, [exams]);

  const styles = {
    page: {
      padding: "32px",
      background:
        "linear-gradient(180deg, #f6f8fb 0%, #eef3f8 100%)",
      minHeight: "100vh",
      color: "#172b4d",
    },
    nav: {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
      marginBottom: "24px",
    },
    tabBtn: (active) => ({
      padding: "12px 18px",
      borderRadius: "999px",
      border: active ? "1px solid #1d4ed8" : "1px solid #d6deeb",
      background: active ? "#1d4ed8" : "#fff",
      color: active ? "#fff" : "#243b53",
      cursor: "pointer",
      fontWeight: 700,
      boxShadow: active ? "0 10px 25px rgba(29,78,216,0.18)" : "none",
    }),
    hero: {
      display: "grid",
      gridTemplateColumns: "2fr 1fr",
      gap: "20px",
      marginBottom: "24px",
    },
    heroCard: {
      background: "linear-gradient(135deg, #123c6b 0%, #1d4ed8 100%)",
      color: "#fff",
      borderRadius: "24px",
      padding: "28px",
      boxShadow: "0 20px 35px rgba(18,60,107,0.16)",
    },
    statGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: "12px",
    },
    statCard: {
      background: "#fff",
      borderRadius: "20px",
      padding: "20px",
      boxShadow: "0 12px 25px rgba(15,23,42,0.06)",
    },
    section: {
      background: "#fff",
      borderRadius: "24px",
      padding: "24px",
      boxShadow: "0 14px 30px rgba(15,23,42,0.06)",
      marginBottom: "24px",
    },
    sectionTitle: {
      margin: "0 0 18px 0",
      fontSize: "30px",
      color: "#16324f",
    },
    subTitle: {
      margin: "0 0 14px 0",
      fontSize: "20px",
      color: "#16324f",
    },
    formGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "14px",
    },
    input: {
      width: "100%",
      padding: "14px 16px",
      borderRadius: "14px",
      border: "1px solid #d6deeb",
      background: "#f8fafc",
      boxSizing: "border-box",
      fontSize: "15px",
    },
    fullWidth: {
      gridColumn: "1 / -1",
    },
    primaryBtn: {
      padding: "14px 20px",
      borderRadius: "14px",
      border: "none",
      background: "#1d4ed8",
      color: "#fff",
      cursor: "pointer",
      fontWeight: 700,
      boxShadow: "0 10px 20px rgba(29,78,216,0.16)",
    },
    ghostBtn: {
      padding: "14px 20px",
      borderRadius: "14px",
      border: "1px solid #d6deeb",
      background: "#fff",
      color: "#334155",
      cursor: "pointer",
      fontWeight: 700,
    },
    examCard: {
      border: "1px solid #e2e8f0",
      borderRadius: "20px",
      padding: "20px",
      background: "#fcfdff",
      boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
      marginBottom: "16px",
    },
    statusPill: (status) => ({
      display: "inline-block",
      padding: "6px 12px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: 700,
      background:
        status === "live"
          ? "#dcfce7"
          : status === "closed"
          ? "#f1f5f9"
          : "#dbeafe",
      color:
        status === "live"
          ? "#166534"
          : status === "closed"
          ? "#475569"
          : "#1d4ed8",
      textTransform: "capitalize",
    }),
    examTop: {
      display: "flex",
      justifyContent: "space-between",
      gap: "16px",
      alignItems: "flex-start",
      flexWrap: "wrap",
      marginBottom: "12px",
    },
    metaGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "10px 18px",
      color: "#475569",
      marginBottom: "16px",
    },
    actionRow: {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
    },
    actionBtn: (bg) => ({
      padding: "11px 16px",
      borderRadius: "12px",
      border: "none",
      background: bg,
      color: "#fff",
      cursor: "pointer",
      fontWeight: 700,
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
    }),
  };

  return (
    <div style={styles.page}>
      <div style={styles.nav}>
        <button style={styles.tabBtn(activeTab === "notifications")} onClick={() => setActiveTab("notifications")}>
          Announcements
        </button>
        <button style={styles.tabBtn(activeTab === "exams")} onClick={() => setActiveTab("exams")}>
          Manage Exams
        </button>
        <button style={styles.tabBtn(activeTab === "assignments")} onClick={() => setActiveTab("assignments")}>
          Assignments
        </button>
        <button style={styles.tabBtn(activeTab === "studentResult")} onClick={() => setActiveTab("studentResult")}>
          Results
        </button>
      </div>

      {activeTab === "exams" && (
        <>
          <div style={styles.hero}>
            <div style={styles.heroCard}>
              <div style={{ fontSize: "13px", opacity: 0.85, letterSpacing: "1px", textTransform: "uppercase" }}>
                Teacher Control Center
              </div>
              <h1 style={{ margin: "10px 0 8px 0", fontSize: "40px" }}>
                Schedule, edit, control, and monitor exams
              </h1>
              <p style={{ margin: 0, maxWidth: "700px", opacity: 0.92, lineHeight: 1.6 }}>
                Create exam schedules, update timings or exam keys, enable student access when needed,
                and manage MCQs from one place.
              </p>
            </div>

            <div style={styles.statGrid}>
              <div style={styles.statCard}>
                <div style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase" }}>Live</div>
                <div style={{ fontSize: "34px", fontWeight: 800 }}>{examStats.live}</div>
              </div>
              <div style={styles.statCard}>
                <div style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase" }}>Scheduled</div>
                <div style={{ fontSize: "34px", fontWeight: 800 }}>{examStats.scheduled}</div>
              </div>
              <div style={styles.statCard}>
                <div style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase" }}>Closed</div>
                <div style={{ fontSize: "34px", fontWeight: 800 }}>{examStats.closed}</div>
              </div>
            </div>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              {isExamEditing ? "Edit Scheduled Exam" : "Create / Schedule Exam"}
            </h2>

            <form onSubmit={handleExamPost} style={styles.formGrid}>
              <input
                style={styles.input}
                placeholder="Course"
                value={examForm.course}
                onChange={(e) => setExamForm({ ...examForm, course: e.target.value })}
              />
              <input
                style={styles.input}
                placeholder="Title"
                value={examForm.title}
                onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
              />
              <input
                style={styles.input}
                placeholder="Duration (min)"
                type="number"
                value={examForm.duration}
                onChange={(e) => setExamForm({ ...examForm, duration: e.target.value })}
              />
              <input
                style={styles.input}
                placeholder="Exam Key (optional)"
                value={examForm.examKey}
                onChange={(e) => setExamForm({ ...examForm, examKey: e.target.value })}
              />
              <input
                style={{ ...styles.input, ...styles.fullWidth }}
                placeholder="Syllabus"
                value={examForm.syllabus}
                onChange={(e) => setExamForm({ ...examForm, syllabus: e.target.value })}
              />
              <div>
                <label style={{ display: "block", marginBottom: "8px", color: "#475569", fontWeight: 600 }}>
                  Start Time
                </label>
                <input
                  style={styles.input}
                  type="datetime-local"
                  value={examForm.startTime}
                  onChange={(e) => setExamForm({ ...examForm, startTime: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "8px", color: "#475569", fontWeight: 600 }}>
                  End Time
                </label>
                <input
                  style={styles.input}
                  type="datetime-local"
                  value={examForm.endTime}
                  onChange={(e) => setExamForm({ ...examForm, endTime: e.target.value })}
                />
              </div>

              <div style={{ ...styles.fullWidth, display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button style={styles.primaryBtn} type="submit">
                  {isExamEditing ? "Update Exam" : "Schedule Exam"}
                </button>

                {isExamEditing && (
                  <button type="button" style={styles.ghostBtn} onClick={resetExamForm}>
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Control Center</h2>

            {!Array.isArray(exams) || exams.length === 0 ? (
              <p style={{ color: "#64748b" }}>No exams found.</p>
            ) : (
              exams.map((ex) => (
                <div key={ex._id} style={styles.examCard}>
                  <div style={styles.examTop}>
                    <div>
                      <div style={{ fontSize: "28px", fontWeight: 800, color: "#102a43" }}>
                        {ex.title}
                      </div>
                      <div style={{ color: "#64748b", marginTop: "4px" }}>
                        {ex.course}
                      </div>
                    </div>

                    <span style={styles.statusPill(ex.status)}>{ex.status}</span>
                  </div>

                  <div style={styles.metaGrid}>
                    <div><strong>Access:</strong> {ex.accessGranted ? "Enabled" : "Disabled"}</div>
                    <div><strong>Duration:</strong> {ex.duration} min</div>
                    <div><strong>Exam Key:</strong> {ex.examKey || "Not set"}</div>
                    <div><strong>Start:</strong> {ex.startTime ? new Date(ex.startTime).toLocaleString() : "Not set"}</div>
                    <div><strong>End:</strong> {ex.endTime ? new Date(ex.endTime).toLocaleString() : "Not set"}</div>
                    <div><strong>Syllabus:</strong> {ex.syllabus || "Not added"}</div>
                  </div>

                  <div style={styles.actionRow}>
                    <button style={styles.actionBtn("#1d4ed8")} type="button" onClick={() => startEditExam(ex)}>
                      <Pencil size={16} /> Edit
                    </button>
                    <button style={styles.actionBtn("#16a34a")} type="button" onClick={() => goLiveExam(ex)}>
                      <Play size={16} /> Allow / Go Live
                    </button>
                    <button style={styles.actionBtn("#f59e0b")} type="button" onClick={() => stopExamAccess(ex)}>
                      <Square size={16} /> Stop Access
                    </button>
                    <button style={styles.actionBtn("#64748b")} type="button" onClick={() => closeExam(ex)}>
                      <XCircle size={16} /> Close Exam
                    </button>
                    <button style={styles.actionBtn("#dc2626")} type="button" onClick={() => deleteExam(ex._id)}>
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Add MCQ</h2>

            <form onSubmit={handleQuestionSubmit} style={styles.formGrid}>
              <select
                style={{ ...styles.input, ...styles.fullWidth }}
                value={questionForm.examId}
                onChange={(e) => setQuestionForm({ ...questionForm, examId: e.target.value })}
              >
                <option value="">Select Exam</option>
                {Array.isArray(exams) &&
                  exams
                    .filter((ex) => ex.status !== "closed")
                    .map((ex) => (
                      <option key={ex._id} value={ex._id}>
                        {ex.title}
                      </option>
                    ))}
              </select>

              <input
                style={{ ...styles.input, ...styles.fullWidth }}
                placeholder="Question"
                value={questionForm.questionText}
                onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
              />
              <input
                style={styles.input}
                placeholder="Option A"
                value={questionForm.optionA}
                onChange={(e) => setQuestionForm({ ...questionForm, optionA: e.target.value })}
              />
              <input
                style={styles.input}
                placeholder="Option B"
                value={questionForm.optionB}
                onChange={(e) => setQuestionForm({ ...questionForm, optionB: e.target.value })}
              />
              <input
                style={styles.input}
                placeholder="Option C"
                value={questionForm.optionC}
                onChange={(e) => setQuestionForm({ ...questionForm, optionC: e.target.value })}
              />
              <input
                style={styles.input}
                placeholder="Option D"
                value={questionForm.optionD}
                onChange={(e) => setQuestionForm({ ...questionForm, optionD: e.target.value })}
              />
              <input
                style={{ ...styles.input, ...styles.fullWidth }}
                placeholder="Correct Answer"
                value={questionForm.correctAnswer}
                onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
              />

              <div style={styles.fullWidth}>
                <button style={styles.primaryBtn} type="submit">
                  <ClipboardList size={16} style={{ marginRight: "8px", verticalAlign: "middle" }} />
                  Add MCQ
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {activeTab === "notifications" && (
        <NotificationManager
          {...{
            formData,
            setFormData,
            isEditing,
            setIsEditing,
            handleSubmit,
            notifications,
            setCurrentId,
            handleDelete,
          }}
        />
      )}

      {activeTab === "assignments" && (
        <AssignmentManager
          {...{
            assignForm,
            setAssignForm,
            setSelectedFile,
            handleAssignPost,
            assignments,
            marksInput,
            setMarksInput,
            handleGiveMarks,
            handleDelete,
          }}
        />
      )}

      {activeTab === "studentResult" && <ResultsList />}
    </div>
  );
};

export default TeacherPanel;
