import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BellRing,
  BookOpenCheck,
  BrainCircuit,
  CalendarClock,
  Check,
  ClipboardCheck,
  ExternalLink,
  FileStack,
  GraduationCap,
  LayoutDashboard,
  Pencil,
  Play,
  ShieldCheck,
  Square,
  Trash2,
  UserCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";
import API from "../../services/api";
import ExamChecker from "./ExamChecker";

const FILE_BASE_URL = `${API.defaults.baseURL}/uploads`;

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "classrooms", label: "Classrooms", icon: GraduationCap },
  { id: "approvals", label: "Approvals", icon: UserCheck },
  { id: "exams", label: "Exams", icon: CalendarClock },
  { id: "quizzes", label: "Quizzes", icon: BrainCircuit },
  { id: "assignments", label: "Assignments", icon: FileStack },
  { id: "announcements", label: "Announcements", icon: BellRing },
  { id: "results", label: "Results", icon: ClipboardCheck },
  { id: "examCheck", label: "Paper Check", icon: BookOpenCheck },
];

const emptyNotice = { type: "", text: "" };

const initialClassroomForm = {
  name: "",
  department: "",
  program: "",
  section: "",
  semester: "",
  description: "",
};

const initialExamForm = {
  classroomId: "",
  course: "",
  title: "",
  syllabus: "",
  duration: "",
  examKey: "",
  assessmentType: "exam",
  responseMode: "mcq",
  instructions: "",
  submissionPrompt: "",
  requiresCamera: true,
  requiresMicrophone: true,
  requiresScreenShare: true,
  startTime: "",
  endTime: "",
};

const initialQuestionForm = {
  examId: "",
  questionText: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctAnswer: "",
};

const initialQuizForm = {
  classroomId: "",
  course: "",
  title: "",
  duration: "10",
  examKey: "",
  instructions: "",
  submissionPrompt: "",
  startTime: "",
  endTime: "",
};

const initialAssignmentForm = {
  classroomId: "",
  title: "",
  dueDate: "",
  description: "",
};

const initialNotificationForm = {
  classroomId: "",
  title: "",
  message: "",
  type: "general",
  priority: "normal",
  audience: "classroom",
};

const toLocalInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (number) => String(number).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
};

const formatDateTime = (value, fallback = "Not scheduled") => {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toLocaleString();
};

const getDaysUntil = (value) => {
  if (!value) return null;
  const target = new Date(value).getTime();
  if (Number.isNaN(target)) return null;
  return Math.ceil((target - Date.now()) / (1000 * 60 * 60 * 24));
};

const buildUploadUrl = (relativePath) =>
  relativePath ? `${FILE_BASE_URL}/${String(relativePath).replace(/^\/+/, "")}` : "";

function TeacherPanel() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [notice, setNotice] = useState(emptyNotice);

  const [profile, setProfile] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [approvalQueue, setApprovalQueue] = useState([]);
  const [roster, setRoster] = useState([]);
  const [exams, setExams] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [results, setResults] = useState([]);

  const [classroomForm, setClassroomForm] = useState(initialClassroomForm);
  const [examForm, setExamForm] = useState(initialExamForm);
  const [questionForm, setQuestionForm] = useState(initialQuestionForm);
  const [quizForm, setQuizForm] = useState(initialQuizForm);
  const [quizQuestionForm, setQuizQuestionForm] = useState(initialQuestionForm);
  const [assignmentForm, setAssignmentForm] = useState(initialAssignmentForm);
  const [assignmentFile, setAssignmentFile] = useState(null);
  const [notificationForm, setNotificationForm] = useState(initialNotificationForm);
  const [editingExamId, setEditingExamId] = useState(null);
  const [editingNotificationId, setEditingNotificationId] = useState(null);
  const [submissionDrafts, setSubmissionDrafts] = useState({});

  const classOptions = useMemo(
    () => classrooms.map((classroom) => ({ value: classroom.id, label: classroom.label })),
    [classrooms]
  );

  const mcqExamOptions = useMemo(
    () =>
      exams
        .filter((exam) => (exam.responseMode || "mcq") === "mcq")
        .map((exam) => ({
          value: exam._id,
          label: `${exam.title} | ${exam.classroomName}`,
        })),
    [exams]
  );

  const quizOptions = useMemo(
    () =>
      exams
        .filter((exam) => (exam.assessmentType || "exam") === "quiz")
        .map((quiz) => ({
          value: quiz._id,
          label: `${quiz.title} | ${quiz.classroomName}`,
        })),
    [exams]
  );

  const quizResults = useMemo(
    () => results.filter((result) => (result.assessmentType || "exam") === "quiz"),
    [results]
  );

  const examResults = useMemo(
    () => results.filter((result) => (result.assessmentType || "exam") !== "quiz"),
    [results]
  );

  const questionsByExam = useMemo(
    () =>
      questions.reduce((accumulator, question) => {
        const key = String(question.examId);
        accumulator[key] = accumulator[key] || [];
        accumulator[key].push(question);
        return accumulator;
      }, {}),
    [questions]
  );

  const rosterByClassroom = useMemo(
    () =>
      roster.reduce((accumulator, student) => {
        const key = student.classroomName || "Unassigned";
        accumulator[key] = accumulator[key] || [];
        accumulator[key].push(student);
        return accumulator;
      }, {}),
    [roster]
  );

  const dashboardMetrics = useMemo(() => {
    const aiExams = exams.filter((exam) => (exam.assessmentType || "exam") !== "quiz");
    const liveExams = aiExams.filter((exam) => exam.status === "live").length;
    const scheduledExams = aiExams.filter((exam) => exam.status === "scheduled").length;
    const submissionsToReview = assignments.reduce(
      (sum, assignment) =>
        sum +
        (assignment.submissions || []).filter((submission) => submission.status !== "Checked").length,
      0
    );
    const flaggedResults = examResults.filter(
      (result) => Number(result.suspiciousScore || result.cheatingPercent || 0) >= 35
    ).length;

    return {
      classrooms: classrooms.length,
      pendingApprovals: approvalQueue.length,
      roster: roster.length,
      liveExams,
      scheduledExams,
      submissionsToReview,
      flaggedResults,
      notifications: notifications.length,
    };
  }, [approvalQueue.length, assignments, classrooms.length, examResults, exams, notifications.length, roster.length]);

  const aiCoach = useMemo(() => {
    const nextExam = [...exams]
      .filter((exam) => exam.status !== "closed")
      .sort((left, right) => new Date(left.startTime || 0) - new Date(right.startTime || 0))[0];
    const daysToExam = getDaysUntil(nextExam?.startTime);
    const cards = [];

    if (approvalQueue.length) {
      cards.push(
        `${approvalQueue.length} student approval request(s) are waiting. Clearing them early keeps classroom access clean before the next exam.`
      );
    }

    if (nextExam && daysToExam !== null) {
      if (daysToExam <= 1) {
        cards.push(
          `${nextExam.title} is close. Double-check exam key, question bank, and camera guidance before going live.`
        );
      } else {
        cards.push(
          `${nextExam.title} is in ${daysToExam} day(s). Use today for announcements and tomorrow for readiness checks.`
        );
      }
    }

    if (dashboardMetrics.flaggedResults > 0) {
      cards.push(
        `${dashboardMetrics.flaggedResults} result(s) have elevated suspicious score. Review integrity logs before final academic decisions.`
      );
    }

    if (dashboardMetrics.submissionsToReview > 0) {
      cards.push(
        `${dashboardMetrics.submissionsToReview} assignment submission(s) still need review. Closing them keeps student dashboard signals accurate.`
      );
    }

    if (!cards.length) {
      cards.push(
        "Your teacher workspace is in a healthy state. You can use this window to create the next class exam or publish a schedule update."
      );
    }

    return cards.slice(0, 4);
  }, [approvalQueue.length, dashboardMetrics.flaggedResults, dashboardMetrics.submissionsToReview, exams]);

  useEffect(() => {
    setQuestionForm((prev) => ({
      ...prev,
      examId:
        mcqExamOptions.find((option) => option.value === prev.examId)?.value ||
        mcqExamOptions[0]?.value ||
        "",
    }));
  }, [mcqExamOptions]);

  useEffect(() => {
    setQuizQuestionForm((prev) => ({
      ...prev,
      examId:
        quizOptions.find((option) => option.value === prev.examId)?.value ||
        quizOptions[0]?.value ||
        "",
    }));
  }, [quizOptions]);

  const loadWorkspace = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    const requests = await Promise.allSettled([
      API.get("/api/auth/me"),
      API.get("/api/classrooms/my"),
      API.get("/api/teacher/approval-queue"),
      API.get("/api/teacher/roster"),
      API.get("/api/exams/all"),
      API.get("/api/questions"),
      API.get("/api/assignments/all"),
      API.get("/api/notifications/all"),
      API.get("/api/results"),
    ]);

    const [
      profileRes,
      classroomsRes,
      approvalsRes,
      rosterRes,
      examsRes,
      questionsRes,
      assignmentsRes,
      notificationsRes,
      resultsRes,
    ] = requests;

    if (profileRes.status === "fulfilled") {
      setProfile(profileRes.value.data?.user || null);
    }

    if (classroomsRes.status === "fulfilled") {
      const nextClassrooms = Array.isArray(classroomsRes.value.data) ? classroomsRes.value.data : [];
      setClassrooms(nextClassrooms);
      setClassroomForm((prev) => ({
        ...prev,
        department: prev.department || profileRes.value?.data?.user?.department || "",
      }));
      setExamForm((prev) => ({
        ...prev,
        classroomId: prev.classroomId || nextClassrooms[0]?.id || "",
      }));
      setQuizForm((prev) => ({
        ...prev,
        classroomId: prev.classroomId || nextClassrooms[0]?.id || "",
      }));
      setAssignmentForm((prev) => ({
        ...prev,
        classroomId: prev.classroomId || nextClassrooms[0]?.id || "",
      }));
      setNotificationForm((prev) => ({
        ...prev,
        classroomId: prev.classroomId || nextClassrooms[0]?.id || "",
      }));
    }

    if (approvalsRes.status === "fulfilled") {
      setApprovalQueue(Array.isArray(approvalsRes.value.data) ? approvalsRes.value.data : []);
    }

    if (rosterRes.status === "fulfilled") {
      setRoster(Array.isArray(rosterRes.value.data) ? rosterRes.value.data : []);
    }

    if (examsRes.status === "fulfilled") {
      setExams(Array.isArray(examsRes.value.data) ? examsRes.value.data : []);
    }

    if (questionsRes.status === "fulfilled") {
      setQuestions(Array.isArray(questionsRes.value.data) ? questionsRes.value.data : []);
    }

    if (assignmentsRes.status === "fulfilled") {
      setAssignments(Array.isArray(assignmentsRes.value.data) ? assignmentsRes.value.data : []);
    }

    if (notificationsRes.status === "fulfilled") {
      setNotifications(Array.isArray(notificationsRes.value.data) ? notificationsRes.value.data : []);
    }

    if (resultsRes.status === "fulfilled") {
      setResults(Array.isArray(resultsRes.value.data) ? resultsRes.value.data : []);
    }

    const hasFailure = requests.some((request) => request.status === "rejected");
    if (hasFailure) {
      setNotice({
        type: "error",
        text: "Some teacher workspace data could not be refreshed. Retry after a moment.",
      });
    }

    if (!silent) {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspace();
    const refreshTimer = window.setInterval(() => loadWorkspace(true), 15000);
    return () => window.clearInterval(refreshTimer);
  }, [loadWorkspace]);

  const resetExamForm = () => {
    setEditingExamId(null);
    setExamForm((prev) => ({
      ...initialExamForm,
      classroomId: classrooms[0]?.id || prev.classroomId || "",
    }));
  };

  const resetNotificationForm = () => {
    setEditingNotificationId(null);
    setNotificationForm((prev) => ({
      ...initialNotificationForm,
      classroomId: classrooms[0]?.id || prev.classroomId || "",
    }));
  };

  const handleCreateClassroom = async (event) => {
    event.preventDefault();
    setBusyKey("create-classroom");
    setNotice(emptyNotice);

    try {
      await API.post("/api/classrooms", classroomForm);
      setClassroomForm({
        ...initialClassroomForm,
        department: classroomForm.department || profile?.department || "",
      });
      await loadWorkspace(true);
      setNotice({ type: "success", text: "New classroom created successfully." });
    } catch (error) {
      setNotice({
        type: "error",
        text: error.response?.data?.message || "Failed to create classroom.",
      });
    } finally {
      setBusyKey("");
    }
  };

  const handleApproval = async (studentId, action) => {
    let rejectedReason = "";

    if (action === "reject") {
      rejectedReason =
        window.prompt("Optional rejection reason for this student request:") || "";
    }

    setBusyKey(`approval-${studentId}-${action}`);
    setNotice(emptyNotice);

    try {
      await API.put(`/api/teacher/approval-queue/${studentId}`, {
        action,
        rejectedReason,
      });
      await loadWorkspace(true);
      setNotice({
        type: "success",
        text:
          action === "approve"
            ? "Student approved successfully."
            : "Student request rejected successfully.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        text: error.response?.data?.message || "Failed to update student approval.",
      });
    } finally {
      setBusyKey("");
    }
  };

  const handleExamSubmit = async (event) => {
    event.preventDefault();
    setBusyKey("save-exam");
    setNotice(emptyNotice);

    const payload = {
      ...examForm,
      duration: Number(examForm.duration),
      startTime: examForm.startTime ? new Date(examForm.startTime).toISOString() : null,
      endTime: examForm.endTime ? new Date(examForm.endTime).toISOString() : null,
    };

    try {
      if (editingExamId) {
        await API.put(`/api/exams/update/${editingExamId}`, payload);
      } else {
        await API.post("/api/exams/add", payload);
      }

      resetExamForm();
      await loadWorkspace(true);
      setNotice({
        type: "success",
        text: editingExamId ? "Exam updated successfully." : "Exam scheduled successfully.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        text: error.response?.data?.message || "Failed to save exam.",
      });
    } finally {
      setBusyKey("");
    }
  };

  const startEditExam = (exam) => {
    setEditingExamId(exam._id);
    setExamForm({
      classroomId: exam.classroomId || classrooms[0]?.id || "",
      course: exam.course || "",
      title: exam.title || "",
      syllabus: exam.syllabus || "",
      duration: exam.duration || "",
      examKey: exam.examKey || "",
      assessmentType: exam.assessmentType || "exam",
      responseMode: exam.responseMode || "mcq",
      instructions: exam.instructions || "",
      submissionPrompt: exam.submissionPrompt || "",
      requiresCamera: exam.requiresCamera !== false,
      requiresMicrophone: exam.requiresMicrophone !== false,
      requiresScreenShare: exam.requiresScreenShare !== false,
      startTime: toLocalInputValue(exam.startTime),
      endTime: toLocalInputValue(exam.endTime),
    });
    setActiveTab("exams");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateExamState = async (examId, payload, message) => {
    setBusyKey(`exam-status-${examId}`);
    setNotice(emptyNotice);

    try {
      await API.put(`/api/exams/update-status/${examId}`, payload);
      await loadWorkspace(true);
      setNotice({ type: "success", text: message });
    } catch (error) {
      setNotice({
        type: "error",
        text: error.response?.data?.message || "Failed to update exam status.",
      });
    } finally {
      setBusyKey("");
    }
  };

  const deleteExam = async (examId) => {
    if (!window.confirm("Delete this exam and all linked MCQs?")) {
      return;
    }

    setBusyKey(`delete-exam-${examId}`);
    setNotice(emptyNotice);

    try {
      await API.delete(`/api/exams/delete/${examId}`);
      if (editingExamId === examId) {
        resetExamForm();
      }
      await loadWorkspace(true);
      setNotice({ type: "success", text: "Exam deleted successfully." });
    } catch (error) {
      setNotice({
        type: "error",
        text: error.response?.data?.message || "Failed to delete exam.",
      });
    } finally {
      setBusyKey("");
    }
  };

  const handleQuestionSubmit = async (event) => {
    event.preventDefault();
    setBusyKey("add-question");
    setNotice(emptyNotice);

    try {
      await API.post("/api/questions/add", {
        examId: questionForm.examId,
        questionText: questionForm.questionText,
        options: [
          questionForm.optionA,
          questionForm.optionB,
          questionForm.optionC,
          questionForm.optionD,
        ],
        correctAnswer: questionForm.correctAnswer,
      });

      setQuestionForm((prev) => ({
        ...initialQuestionForm,
        examId: prev.examId,
      }));
      await loadWorkspace(true);
      setNotice({ type: "success", text: "MCQ added successfully." });
    } catch (error) {
      setNotice({
        type: "error",
        text: error.response?.data?.message || "Failed to add question.",
      });
    } finally {
      setBusyKey("");
    }
  };

  const handleQuizSubmit = async (event) => {
    event.preventDefault();
    setBusyKey("save-quiz");
    setNotice(emptyNotice);

    const payload = {
      ...quizForm,
      duration: Number(quizForm.duration),
      assessmentType: "quiz",
      responseMode: "mcq",
      requiresCamera: false,
      requiresMicrophone: false,
      requiresScreenShare: false,
      syllabus: quizForm.instructions,
      startTime: quizForm.startTime ? new Date(quizForm.startTime).toISOString() : null,
      endTime: quizForm.endTime ? new Date(quizForm.endTime).toISOString() : null,
    };

    try {
      await API.post("/api/exams/add", payload);
      setQuizForm((prev) => ({
        ...initialQuizForm,
        classroomId: prev.classroomId || classrooms[0]?.id || "",
      }));
      await loadWorkspace(true);
      setNotice({ type: "success", text: "Quiz created successfully." });
    } catch (error) {
      setNotice({
        type: "error",
        text: error.response?.data?.message || "Failed to create quiz.",
      });
    } finally {
      setBusyKey("");
    }
  };

  const handleQuizQuestionSubmit = async (event) => {
    event.preventDefault();
    setBusyKey("add-quiz-question");
    setNotice(emptyNotice);

    try {
      await API.post("/api/questions/add", {
        examId: quizQuestionForm.examId,
        questionText: quizQuestionForm.questionText,
        options: [
          quizQuestionForm.optionA,
          quizQuestionForm.optionB,
          quizQuestionForm.optionC,
          quizQuestionForm.optionD,
        ],
        correctAnswer: quizQuestionForm.correctAnswer,
      });

      setQuizQuestionForm((prev) => ({
        ...initialQuestionForm,
        examId: prev.examId,
      }));
      await loadWorkspace(true);
      setNotice({ type: "success", text: "Quiz MCQ added successfully." });
    } catch (error) {
      setNotice({
        type: "error",
        text: error.response?.data?.message || "Failed to add quiz MCQ.",
      });
    } finally {
      setBusyKey("");
    }
  };

  const handleAssignmentSubmit = async (event) => {
    event.preventDefault();
    setBusyKey("save-assignment");
    setNotice(emptyNotice);

    try {
      const formData = new FormData();
      formData.append("classroomId", assignmentForm.classroomId);
      formData.append("title", assignmentForm.title);
      formData.append("dueDate", assignmentForm.dueDate);
      formData.append("description", assignmentForm.description);
      if (assignmentFile) {
        formData.append("file", assignmentFile);
      }

      await API.post("/api/assignments/add", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setAssignmentForm((prev) => ({
        ...initialAssignmentForm,
        classroomId: prev.classroomId || classrooms[0]?.id || "",
      }));
      setAssignmentFile(null);
      await loadWorkspace(true);
      setNotice({ type: "success", text: "Assignment published successfully." });
    } catch (error) {
      setNotice({
        type: "error",
        text: error.response?.data?.message || "Failed to create assignment.",
      });
    } finally {
      setBusyKey("");
    }
  };

  const handleMarksSave = async (submissionId) => {
    const draft = submissionDrafts[submissionId] || {};
    setBusyKey(`submission-${submissionId}`);
    setNotice(emptyNotice);

    try {
      await API.post("/api/assignments/give-marks", {
        submissionId,
        marks: Number(draft.marks),
        feedback: draft.feedback || "",
      });

      await loadWorkspace(true);
      setNotice({ type: "success", text: "Submission reviewed successfully." });
    } catch (error) {
      setNotice({
        type: "error",
        text: error.response?.data?.message || "Failed to save marks.",
      });
    } finally {
      setBusyKey("");
    }
  };

  const deleteAssignment = async (assignmentId) => {
    if (!window.confirm("Delete this assignment and all linked submissions?")) {
      return;
    }

    setBusyKey(`delete-assignment-${assignmentId}`);
    setNotice(emptyNotice);

    try {
      await API.delete(`/api/assignments/delete/${assignmentId}`);
      await loadWorkspace(true);
      setNotice({ type: "success", text: "Assignment deleted successfully." });
    } catch (error) {
      setNotice({
        type: "error",
        text: error.response?.data?.message || "Failed to delete assignment.",
      });
    } finally {
      setBusyKey("");
    }
  };

  const handleNotificationSubmit = async (event) => {
    event.preventDefault();
    setBusyKey("save-notification");
    setNotice(emptyNotice);

    const payload = {
      ...notificationForm,
      classroomId: notificationForm.audience === "classroom" ? notificationForm.classroomId : "",
    };

    try {
      if (editingNotificationId) {
        await API.put(`/api/notifications/update/${editingNotificationId}`, payload);
      } else {
        await API.post("/api/notifications/add", payload);
      }

      resetNotificationForm();
      await loadWorkspace(true);
      setNotice({
        type: "success",
        text: editingNotificationId
          ? "Announcement updated successfully."
          : "Announcement published successfully.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        text: error.response?.data?.message || "Failed to save announcement.",
      });
    } finally {
      setBusyKey("");
    }
  };

  const startEditNotification = (notification) => {
    setEditingNotificationId(notification._id);
    setNotificationForm({
      classroomId: notification.classroomId || classrooms[0]?.id || "",
      title: notification.title || "",
      message: notification.message || "",
      type: notification.type || "general",
      priority: notification.priority || "normal",
      audience: notification.audience || "classroom",
    });
    setActiveTab("announcements");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteNotification = async (notificationId) => {
    if (!window.confirm("Delete this announcement?")) {
      return;
    }

    setBusyKey(`delete-notification-${notificationId}`);
    setNotice(emptyNotice);

    try {
      await API.delete(`/api/notifications/delete/${notificationId}`);
      if (editingNotificationId === notificationId) {
        resetNotificationForm();
      }
      await loadWorkspace(true);
      setNotice({ type: "success", text: "Announcement deleted successfully." });
    } catch (error) {
      setNotice({
        type: "error",
        text: error.response?.data?.message || "Failed to delete announcement.",
      });
    } finally {
      setBusyKey("");
    }
  };

  const deleteResult = async (resultId) => {
    if (!window.confirm("Delete this result record?")) {
      return;
    }

    setBusyKey(`delete-result-${resultId}`);
    setNotice(emptyNotice);

    try {
      await API.delete(`/api/results/delete/${resultId}`);
      await loadWorkspace(true);
      setNotice({ type: "success", text: "Result deleted successfully." });
    } catch (error) {
      setNotice({
        type: "error",
        text: error.response?.data?.message || "Failed to delete result.",
      });
    } finally {
      setBusyKey("");
    }
  };

  const topUpcomingExams = useMemo(
    () =>
      [...exams]
        .filter((exam) => exam.status !== "closed")
        .sort((left, right) => new Date(left.startTime || 0) - new Date(right.startTime || 0))
        .slice(0, 3),
    [exams]
  );

  if (loading) {
    return (
      <div style={styles.loaderState}>
        <div style={styles.loaderOrb} />
        <h2 style={{ margin: "18px 0 8px", color: "#0f172a" }}>Preparing teacher workspace</h2>
        <p style={{ margin: 0, color: "#64748b" }}>
          Loading classrooms, approvals, exams, assignments, and AI teaching signals.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div>
          <div style={styles.heroKicker}>Teacher Command Center</div>
          <h1 style={styles.heroTitle}>{profile?.name || "Teacher"} classroom operations hub</h1>
          <p style={styles.heroText}>
            {profile?.department || "Academic department"} | {classrooms.length} classroom(s) |
            {` `}approval-gated onboarding, AI proctoring, and exam workflow control.
          </p>
        </div>

        <div style={styles.heroMetricGrid}>
          <MetricCard label="Classrooms" value={dashboardMetrics.classrooms} bright />
          <MetricCard label="Pending Approvals" value={dashboardMetrics.pendingApprovals} bright />
          <MetricCard label="Live Exams" value={dashboardMetrics.liveExams} bright />
          <MetricCard label="Flagged Results" value={dashboardMetrics.flaggedResults} bright />
        </div>
      </section>

      {notice.text ? (
        <div style={notice.type === "error" ? styles.noticeError : styles.noticeSuccess}>
          {notice.text}
        </div>
      ) : null}

      <div style={styles.tabRow}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={styles.tabButton(active)}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "overview" && (
        <div style={styles.sectionStack}>
          <section style={styles.gridTwo}>
            <div style={styles.card}>
              <SectionHeader
                kicker="AI Teacher Coach"
                title="Recommended next actions"
                icon={<BrainCircuit size={18} />}
                iconTone={["#dbeafe", "#1d4ed8"]}
              />

              <div style={{ display: "grid", gap: "12px" }}>
                {aiCoach.map((item) => (
                  <div key={item} style={styles.coachCard}>
                    <ShieldCheck size={16} color="#1d4ed8" />
                    <span style={{ lineHeight: 1.65 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.card}>
              <SectionHeader
                kicker="Quick Health"
                title="Workspace snapshot"
                icon={<LayoutDashboard size={18} />}
                iconTone={["#dcfce7", "#166534"]}
              />

              <div style={styles.metricGrid}>
                <MetricCard label="Approved Students" value={dashboardMetrics.roster} />
                <MetricCard label="Scheduled Exams" value={dashboardMetrics.scheduledExams} />
                <MetricCard
                  label="Submissions To Review"
                  value={dashboardMetrics.submissionsToReview}
                />
                <MetricCard label="Announcements" value={dashboardMetrics.notifications} />
              </div>
            </div>
          </section>

          <section style={styles.gridTwo}>
            <div style={styles.card}>
              <SectionHeader
                kicker="Upcoming"
                title="Next assessments"
                icon={<CalendarClock size={18} />}
                iconTone={["#fef3c7", "#b45309"]}
              />

              {topUpcomingExams.length === 0 ? (
                <EmptyState text="No exams are scheduled for your classrooms yet." />
              ) : (
                <div style={{ display: "grid", gap: "12px" }}>
                  {topUpcomingExams.map((exam) => (
                    <div key={exam._id} style={styles.timelineCard}>
                      <div>
                        <div style={styles.smallKicker}>{exam.assessmentType || "exam"}</div>
                        <div style={styles.timelineTitle}>{exam.title}</div>
                        <div style={styles.timelineText}>
                          {exam.course} | {exam.classroomName}
                        </div>
                      </div>
                      <div style={styles.timelineMeta}>
                        <strong>{formatDateTime(exam.startTime)}</strong>
                        <span>{exam.duration} min</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={styles.card}>
              <SectionHeader
                kicker="Integrity Watch"
                title="Students needing review"
                icon={<Users size={18} />}
                iconTone={["#fee2e2", "#b91c1c"]}
              />

              {results.filter((result) => Number(result.suspiciousScore || result.cheatingPercent || 0) >= 35)
                .length === 0 ? (
                <EmptyState text="No elevated suspicious result is waiting right now." />
              ) : (
                <div style={{ display: "grid", gap: "12px" }}>
                  {results
                    .filter((result) => Number(result.suspiciousScore || result.cheatingPercent || 0) >= 35)
                    .slice(0, 4)
                    .map((result) => (
                      <div key={result._id} style={styles.alertCard}>
                        <div>
                          <div style={styles.timelineTitle}>{result.studentName || "Student"}</div>
                          <div style={styles.timelineText}>
                            {result.testName || "Exam"} | {result.classroomName || "Classroom"}
                          </div>
                        </div>
                        <div style={styles.riskBadge}>
                          {Number(result.suspiciousScore || result.cheatingPercent || 0)}%
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {activeTab === "classrooms" && (
        <div style={styles.sectionStack}>
          <section style={styles.gridTwo}>
            <form onSubmit={handleCreateClassroom} style={styles.card}>
              <SectionHeader
                kicker="Create Classroom"
                title="Add a new batch or section"
                icon={<GraduationCap size={18} />}
                iconTone={["#d1fae5", "#0f766e"]}
              />

              <div style={styles.formGrid}>
                <Field
                  label="Classroom Name"
                  value={classroomForm.name}
                  onChange={(value) => setClassroomForm((prev) => ({ ...prev, name: value }))}
                  placeholder="BSCS Morning"
                />
                <Field
                  label="Department"
                  value={classroomForm.department}
                  onChange={(value) => setClassroomForm((prev) => ({ ...prev, department: value }))}
                  placeholder="Computer Science"
                />
                <Field
                  label="Program"
                  value={classroomForm.program}
                  onChange={(value) => setClassroomForm((prev) => ({ ...prev, program: value }))}
                  placeholder="BS Computer Science"
                />
                <Field
                  label="Section"
                  value={classroomForm.section}
                  onChange={(value) => setClassroomForm((prev) => ({ ...prev, section: value }))}
                  placeholder="A"
                />
                <Field
                  label="Semester"
                  value={classroomForm.semester}
                  onChange={(value) => setClassroomForm((prev) => ({ ...prev, semester: value }))}
                  placeholder="6th"
                />
                <TextAreaField
                  label="Description"
                  value={classroomForm.description}
                  onChange={(value) => setClassroomForm((prev) => ({ ...prev, description: value }))}
                  placeholder="Lab, session notes, or invite context."
                  full
                />
              </div>

              <button type="submit" style={styles.primaryButton} disabled={busyKey === "create-classroom"}>
                {busyKey === "create-classroom" ? "Creating..." : "Create Classroom"}
              </button>
            </form>

            <section style={styles.card}>
              <SectionHeader
                kicker="Managed Rooms"
                title="All active classrooms"
                icon={<Users size={18} />}
                iconTone={["#ede9fe", "#6d28d9"]}
              />

              {classrooms.length === 0 ? (
                <EmptyState text="No classroom found yet." />
              ) : (
                <div style={{ display: "grid", gap: "12px" }}>
                  {classrooms.map((classroom) => (
                    <div key={classroom.id} style={styles.classroomCard}>
                      <div>
                        <div style={styles.timelineTitle}>{classroom.label}</div>
                        <div style={styles.timelineText}>
                          Teacher {classroom.teacherName || profile?.name || "Faculty"}
                        </div>
                      </div>
                      <div style={styles.classroomMeta}>
                        <span>Invite {classroom.inviteCode || "N/A"}</span>
                        <span>
                          {roster.filter(
                            (student) => String(student.classroomId || "") === String(classroom.id || "")
                          ).length} approved
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </section>
        </div>
      )}

      {activeTab === "approvals" && (
        <div style={styles.sectionStack}>
          <section style={styles.card}>
            <SectionHeader
              kicker="Pending Requests"
              title="Student onboarding approvals"
              icon={<UserCheck size={18} />}
              iconTone={["#fef3c7", "#b45309"]}
            />

            {approvalQueue.length === 0 ? (
              <EmptyState text="No student approval request is pending right now." />
            ) : (
              <div style={styles.cardGrid}>
                {approvalQueue.map((student) => (
                  <div key={student._id} style={styles.approvalCard}>
                    <div style={styles.approvalTop}>
                      <div>
                        <div style={styles.timelineTitle}>{student.name}</div>
                        <div style={styles.timelineText}>
                          {student.rollNumber || "No roll number"} | {student.classroomName}
                        </div>
                      </div>
                      <div style={styles.pendingBadge}>Pending</div>
                    </div>

                    <div style={styles.approvalMetaGrid}>
                      <InfoPill label="Email" value={student.email} />
                      <InfoPill label="Department" value={student.department || "N/A"} />
                      <InfoPill label="Teacher" value={student.teacherName || "N/A"} />
                      <InfoPill label="Requested" value={formatDateTime(student.createdAt, "N/A")} />
                    </div>

                    {student.studentIdCardUrl ? (
                      <a
                        href={buildUploadUrl(student.studentIdCardUrl)}
                        target="_blank"
                        rel="noreferrer"
                        style={styles.fileLink}
                      >
                        <ExternalLink size={14} />
                        View ID Card
                      </a>
                    ) : null}

                    <div style={styles.actionRow}>
                      <button
                        type="button"
                        onClick={() => handleApproval(student._id, "approve")}
                        style={styles.successButton}
                        disabled={busyKey === `approval-${student._id}-approve`}
                      >
                        <Check size={16} />
                        {busyKey === `approval-${student._id}-approve` ? "Approving..." : "Approve"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApproval(student._id, "reject")}
                        style={styles.dangerButton}
                        disabled={busyKey === `approval-${student._id}-reject`}
                      >
                        <X size={16} />
                        {busyKey === `approval-${student._id}-reject` ? "Rejecting..." : "Reject"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section style={styles.card}>
            <SectionHeader
              kicker="Approved Roster"
              title="Students grouped by classroom"
              icon={<Users size={18} />}
              iconTone={["#dbeafe", "#1d4ed8"]}
            />

            {roster.length === 0 ? (
              <EmptyState text="Approved roster is still empty." />
            ) : (
              <div style={styles.cardGrid}>
                {Object.entries(rosterByClassroom).map(([classroomName, students]) => (
                  <div key={classroomName} style={styles.rosterGroup}>
                    <div style={styles.rosterTitle}>{classroomName}</div>
                    <div style={{ display: "grid", gap: "10px" }}>
                      {students.map((student) => (
                        <div key={student._id} style={styles.rosterRow}>
                          <strong>{student.name}</strong>
                          <span>
                            {student.rollNumber || "No roll number"} | {student.email}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === "exams" && (
        <div style={styles.sectionStack}>
          <section style={styles.gridTwo}>
            <form onSubmit={handleExamSubmit} style={styles.card}>
              <SectionHeader
                kicker={editingExamId ? "Edit Exam" : "Create Exam"}
                title="Assessment publishing"
                icon={<CalendarClock size={18} />}
                iconTone={["#dbeafe", "#1d4ed8"]}
              />

              <div style={styles.formGrid}>
                <SelectField
                  label="Classroom"
                  value={examForm.classroomId}
                  onChange={(value) => setExamForm((prev) => ({ ...prev, classroomId: value }))}
                  options={classOptions}
                />
                <SelectField
                  label="Assessment Type"
                  value={examForm.assessmentType}
                  onChange={(value) => setExamForm((prev) => ({ ...prev, assessmentType: value }))}
                  options={[
                    { value: "exam", label: "Exam" },
                    { value: "quiz", label: "Quiz" },
                    { value: "test", label: "Test" },
                  ]}
                />
                <SelectField
                  label="Response Mode"
                  value={examForm.responseMode}
                  onChange={(value) => setExamForm((prev) => ({ ...prev, responseMode: value }))}
                  options={[
                    { value: "mcq", label: "MCQ Exam" },
                    { value: "written", label: "Written / Upload Exam" },
                  ]}
                />
                <Field
                  label="Course"
                  value={examForm.course}
                  onChange={(value) => setExamForm((prev) => ({ ...prev, course: value }))}
                  placeholder="Operating Systems"
                />
                <Field
                  label="Title"
                  value={examForm.title}
                  onChange={(value) => setExamForm((prev) => ({ ...prev, title: value }))}
                  placeholder="Midterm 1"
                />
                <Field
                  label="Duration (minutes)"
                  type="number"
                  value={examForm.duration}
                  onChange={(value) => setExamForm((prev) => ({ ...prev, duration: value }))}
                  placeholder="60"
                />
                <Field
                  label="Exam Key"
                  value={examForm.examKey}
                  onChange={(value) => setExamForm((prev) => ({ ...prev, examKey: value }))}
                  placeholder="Optional secure key"
                />
                <TextAreaField
                  label="Syllabus"
                  value={examForm.syllabus}
                  onChange={(value) => setExamForm((prev) => ({ ...prev, syllabus: value }))}
                  placeholder="Modules, chapters, or focus topics"
                  full
                />
                <TextAreaField
                  label="Instructions"
                  value={examForm.instructions}
                  onChange={(value) => setExamForm((prev) => ({ ...prev, instructions: value }))}
                  placeholder="Exam room rules or special guidance"
                  full
                />
                <TextAreaField
                  label={
                    examForm.responseMode === "written"
                      ? "Written Prompt"
                      : "Question Prompt / Opening Note"
                  }
                  value={examForm.submissionPrompt}
                  onChange={(value) => setExamForm((prev) => ({ ...prev, submissionPrompt: value }))}
                  placeholder={
                    examForm.responseMode === "written"
                      ? "Describe the written question, case study, or answer requirements"
                      : "Optional opening note before the MCQs begin"
                  }
                  full
                />
                <Field
                  label="Start Time"
                  type="datetime-local"
                  value={examForm.startTime}
                  onChange={(value) => setExamForm((prev) => ({ ...prev, startTime: value }))}
                />
                <Field
                  label="End Time"
                  type="datetime-local"
                  value={examForm.endTime}
                  onChange={(value) => setExamForm((prev) => ({ ...prev, endTime: value }))}
                />
                <div style={styles.toggleGroup}>
                  <label style={styles.toggleField}>
                    <input
                      type="checkbox"
                      checked={examForm.requiresCamera}
                      onChange={(event) =>
                        setExamForm((prev) => ({ ...prev, requiresCamera: event.target.checked }))
                      }
                    />
                    Require camera access
                  </label>
                  <label style={styles.toggleField}>
                    <input
                      type="checkbox"
                      checked={examForm.requiresMicrophone}
                      onChange={(event) =>
                        setExamForm((prev) => ({
                          ...prev,
                          requiresMicrophone: event.target.checked,
                        }))
                      }
                    />
                    Require microphone access
                  </label>
                  <label style={styles.toggleField}>
                    <input
                      type="checkbox"
                      checked={examForm.requiresScreenShare}
                      onChange={(event) =>
                        setExamForm((prev) => ({
                          ...prev,
                          requiresScreenShare: event.target.checked,
                        }))
                      }
                    />
                    Require screen share
                  </label>
                </div>
              </div>

              <div style={styles.actionRow}>
                <button type="submit" style={styles.primaryButton} disabled={busyKey === "save-exam"}>
                  {busyKey === "save-exam"
                    ? "Saving..."
                    : editingExamId
                    ? "Update Exam"
                    : "Schedule Exam"}
                </button>
                {editingExamId ? (
                  <button type="button" style={styles.secondaryButton} onClick={resetExamForm}>
                    Cancel Edit
                  </button>
                ) : null}
              </div>
            </form>

            <form onSubmit={handleQuestionSubmit} style={styles.card}>
              <SectionHeader
                kicker="Question Bank"
                title="Add MCQs to an exam"
                icon={<ClipboardCheck size={18} />}
                iconTone={["#ecfccb", "#3f6212"]}
              />

              {mcqExamOptions.length === 0 ? (
                <EmptyState text="Create an MCQ-mode exam first. Written exams use a prompt plus typed/uploaded answers instead of MCQ options." compact />
              ) : (
                <>
                  <div style={styles.formGrid}>
                    <SelectField
                      label="Exam"
                      value={questionForm.examId}
                      onChange={(value) => setQuestionForm((prev) => ({ ...prev, examId: value }))}
                      options={mcqExamOptions}
                      full
                    />
                    <TextAreaField
                      label="Question"
                      value={questionForm.questionText}
                      onChange={(value) => setQuestionForm((prev) => ({ ...prev, questionText: value }))}
                      placeholder="Enter question statement"
                      full
                    />
                    <Field
                      label="Option A"
                      value={questionForm.optionA}
                      onChange={(value) => setQuestionForm((prev) => ({ ...prev, optionA: value }))}
                    />
                    <Field
                      label="Option B"
                      value={questionForm.optionB}
                      onChange={(value) => setQuestionForm((prev) => ({ ...prev, optionB: value }))}
                    />
                    <Field
                      label="Option C"
                      value={questionForm.optionC}
                      onChange={(value) => setQuestionForm((prev) => ({ ...prev, optionC: value }))}
                    />
                    <Field
                      label="Option D"
                      value={questionForm.optionD}
                      onChange={(value) => setQuestionForm((prev) => ({ ...prev, optionD: value }))}
                    />
                    <Field
                      label="Correct Answer"
                      value={questionForm.correctAnswer}
                      onChange={(value) =>
                        setQuestionForm((prev) => ({ ...prev, correctAnswer: value }))
                      }
                      placeholder="Exact option text"
                    />
                  </div>

                  <button type="submit" style={styles.primaryButton} disabled={busyKey === "add-question"}>
                    {busyKey === "add-question" ? "Saving..." : "Add MCQ"}
                  </button>
                </>
              )}
            </form>
          </section>

          <section style={styles.card}>
            <SectionHeader
              kicker="Exam Control"
              title="Scheduled and live assessments"
              icon={<ShieldCheck size={18} />}
              iconTone={["#fef3c7", "#b45309"]}
            />

            {exams.length === 0 ? (
              <EmptyState text="No exam exists yet." />
            ) : (
              <div style={styles.cardGrid}>
                {exams.map((exam) => (
                  <div key={exam._id} style={styles.examCard}>
                    <div style={styles.examTop}>
                      <div>
                        <div style={styles.smallKicker}>{exam.classroomName}</div>
                        <div style={styles.timelineTitle}>{exam.title}</div>
                        <div style={styles.timelineText}>
                          {exam.course} | {exam.duration} minutes
                        </div>
                      </div>
                      <div style={styles.statusBadge(exam.status)}>{exam.status}</div>
                    </div>

                    <div style={styles.approvalMetaGrid}>
                      <InfoPill label="Start" value={formatDateTime(exam.startTime)} />
                      <InfoPill label="End" value={formatDateTime(exam.endTime)} />
                      <InfoPill label="Access" value={exam.accessGranted ? "Enabled" : "Locked"} />
                      <InfoPill
                        label="Mode"
                        value={(exam.responseMode || "mcq") === "written" ? "Written" : "MCQ"}
                      />
                      <InfoPill
                        label={(exam.responseMode || "mcq") === "written" ? "Prompt" : "Questions"}
                        value={
                          (exam.responseMode || "mcq") === "written"
                            ? exam.submissionPrompt
                              ? "Added"
                              : "Pending"
                            : questionsByExam[String(exam._id)]?.length || 0
                        }
                      />
                    </div>

                    <div style={{ color: "#475569", lineHeight: 1.65, marginTop: "14px" }}>
                      {exam.submissionPrompt || exam.instructions || exam.syllabus || "No extra instructions added yet."}
                    </div>

                    <div style={styles.actionRow}>
                      <button type="button" style={styles.secondaryButton} onClick={() => startEditExam(exam)}>
                        <Pencil size={16} />
                        Edit
                      </button>
                      <button
                        type="button"
                        style={styles.successButton}
                        onClick={() =>
                          updateExamState(exam._id, { status: "live", accessGranted: true }, "Exam is now live.")
                        }
                        disabled={busyKey === `exam-status-${exam._id}`}
                      >
                        <Play size={16} />
                        Go Live
                      </button>
                      <button
                        type="button"
                        style={styles.warningButton}
                        onClick={() =>
                          updateExamState(
                            exam._id,
                            { status: "scheduled", accessGranted: false },
                            "Exam access stopped."
                          )
                        }
                        disabled={busyKey === `exam-status-${exam._id}`}
                      >
                        <Square size={16} />
                        Stop
                      </button>
                      <button
                        type="button"
                        style={styles.secondaryButton}
                        onClick={() =>
                          updateExamState(
                            exam._id,
                            { status: "closed", accessGranted: false },
                            "Exam closed successfully."
                          )
                        }
                        disabled={busyKey === `exam-status-${exam._id}`}
                      >
                        <XCircle size={16} />
                        Close
                      </button>
                      <button
                        type="button"
                        style={styles.dangerButton}
                        onClick={() => deleteExam(exam._id)}
                        disabled={busyKey === `delete-exam-${exam._id}`}
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === "quizzes" && (
        <div style={styles.sectionStack}>
          <section style={styles.gridTwo}>
            <form onSubmit={handleQuizSubmit} style={styles.card}>
              <SectionHeader
                kicker="Quiz Add"
                title="Create simple MCQ quiz"
                icon={<BrainCircuit size={18} />}
                iconTone={["#e0f2fe", "#0369a1"]}
              />

              <div style={styles.formGrid}>
                <SelectField
                  label="Classroom"
                  value={quizForm.classroomId}
                  onChange={(value) => setQuizForm((prev) => ({ ...prev, classroomId: value }))}
                  options={classOptions}
                />
                <Field
                  label="Course"
                  value={quizForm.course}
                  onChange={(value) => setQuizForm((prev) => ({ ...prev, course: value }))}
                  placeholder="Computer Science"
                />
                <Field
                  label="Quiz Title"
                  value={quizForm.title}
                  onChange={(value) => setQuizForm((prev) => ({ ...prev, title: value }))}
                  placeholder="Quiz 1"
                />
                <Field
                  label="Time (minutes)"
                  type="number"
                  value={quizForm.duration}
                  onChange={(value) => setQuizForm((prev) => ({ ...prev, duration: value }))}
                  placeholder="10"
                />
                <Field
                  label="Quiz Key"
                  value={quizForm.examKey}
                  onChange={(value) => setQuizForm((prev) => ({ ...prev, examKey: value }))}
                  placeholder="Optional"
                />
                <Field
                  label="Start Time"
                  type="datetime-local"
                  value={quizForm.startTime}
                  onChange={(value) => setQuizForm((prev) => ({ ...prev, startTime: value }))}
                />
                <Field
                  label="End Time"
                  type="datetime-local"
                  value={quizForm.endTime}
                  onChange={(value) => setQuizForm((prev) => ({ ...prev, endTime: value }))}
                />
                <TextAreaField
                  label="Quiz Note"
                  value={quizForm.submissionPrompt}
                  onChange={(value) =>
                    setQuizForm((prev) => ({ ...prev, submissionPrompt: value }))
                  }
                  placeholder="Short note shown to students"
                  full
                />
              </div>

              <button type="submit" style={styles.primaryButton} disabled={busyKey === "save-quiz"}>
                <Play size={16} />
                {busyKey === "save-quiz" ? "Saving..." : "Create Quiz"}
              </button>
            </form>

            <form onSubmit={handleQuizQuestionSubmit} style={styles.card}>
              <SectionHeader
                kicker="Quiz MCQs"
                title="Add four-option questions"
                icon={<ClipboardCheck size={18} />}
                iconTone={["#ecfccb", "#3f6212"]}
              />

              {quizOptions.length === 0 ? (
                <EmptyState text="Create a quiz first, then add MCQs here." compact />
              ) : (
                <>
                  <div style={styles.formGrid}>
                    <SelectField
                      label="Quiz"
                      value={quizQuestionForm.examId}
                      onChange={(value) =>
                        setQuizQuestionForm((prev) => ({ ...prev, examId: value }))
                      }
                      options={quizOptions}
                      full
                    />
                    <TextAreaField
                      label="Question"
                      value={quizQuestionForm.questionText}
                      onChange={(value) =>
                        setQuizQuestionForm((prev) => ({ ...prev, questionText: value }))
                      }
                      placeholder="Write quiz question"
                      full
                    />
                    {["A", "B", "C", "D"].map((label) => (
                      <Field
                        key={label}
                        label={`Option ${label}`}
                        value={quizQuestionForm[`option${label}`]}
                        onChange={(value) =>
                          setQuizQuestionForm((prev) => ({ ...prev, [`option${label}`]: value }))
                        }
                        placeholder={`Option ${label}`}
                      />
                    ))}
                    <Field
                      label="Correct Answer"
                      value={quizQuestionForm.correctAnswer}
                      onChange={(value) =>
                        setQuizQuestionForm((prev) => ({ ...prev, correctAnswer: value }))
                      }
                      placeholder="Exact option text"
                      full
                    />
                  </div>
                  <button
                    type="submit"
                    style={styles.successButton}
                    disabled={busyKey === "add-quiz-question"}
                  >
                    <Check size={16} />
                    {busyKey === "add-quiz-question" ? "Adding..." : "Add Quiz MCQ"}
                  </button>
                </>
              )}
            </form>
          </section>

          <section style={styles.gridTwo}>
            <div style={styles.card}>
              <SectionHeader
                kicker="Quiz Access"
                title="Start, stop, and review quizzes"
                icon={<Play size={18} />}
                iconTone={["#dbeafe", "#1d4ed8"]}
              />

              {quizOptions.length === 0 ? (
                <EmptyState text="No quiz has been created yet." />
              ) : (
                <div style={styles.cardGrid}>
                  {exams
                    .filter((exam) => (exam.assessmentType || "exam") === "quiz")
                    .map((quiz) => (
                      <div key={quiz._id} style={styles.examCard}>
                        <div style={styles.examTop}>
                          <div>
                            <span style={styles.statusBadge(quiz.status)}>{quiz.status}</span>
                            <div style={styles.timelineTitle}>{quiz.title}</div>
                            <div style={styles.timelineText}>
                              {quiz.course} | {quiz.classroomName}
                            </div>
                          </div>
                          <div style={styles.countBadge}>
                            {questionsByExam[String(quiz._id)]?.length || 0} MCQs
                          </div>
                        </div>
                        <div style={{ display: "grid", gap: "10px", marginTop: "14px" }}>
                          <InfoPill label="Time" value={`${quiz.duration} min`} />
                          <InfoPill
                            label="Result Count"
                            value={
                              quizResults.filter((result) => String(result.examId) === String(quiz._id))
                                .length
                            }
                          />
                        </div>
                        <div style={styles.actionRow}>
                          <button
                            type="button"
                            style={styles.successButton}
                            onClick={() =>
                              updateExamState(
                                quiz._id,
                                { status: "live", accessGranted: true },
                                "Quiz access started."
                              )
                            }
                          >
                            <Play size={16} />
                            Start Access
                          </button>
                          <button
                            type="button"
                            style={styles.warningButton}
                            onClick={() =>
                              updateExamState(
                                quiz._id,
                                { status: "scheduled", accessGranted: false },
                                "Quiz access paused."
                              )
                            }
                          >
                            <Square size={16} />
                            Pause
                          </button>
                          <button
                            type="button"
                            style={styles.dangerButton}
                            onClick={() =>
                              updateExamState(
                                quiz._id,
                                { status: "closed", accessGranted: false },
                                "Quiz closed."
                              )
                            }
                          >
                            <XCircle size={16} />
                            Close
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div style={styles.card}>
              <SectionHeader
                kicker="Quiz Results"
                title="Student quiz outcomes"
                icon={<ClipboardCheck size={18} />}
                iconTone={["#fef3c7", "#b45309"]}
              />

              {quizResults.length === 0 ? (
                <EmptyState text="No student quiz result exists yet." />
              ) : (
                <div style={styles.cardGrid}>
                  {quizResults.map((result) => (
                    <div key={result._id} style={styles.resultCard}>
                      <div style={styles.examTop}>
                        <div>
                          <div style={styles.timelineTitle}>{result.studentName || "Student"}</div>
                          <div style={styles.timelineText}>
                            {result.testName || "Quiz"} | {result.classroomName || "Classroom"}
                          </div>
                          <div style={styles.timelineText}>
                            Attempted {formatDateTime(result.createdAt, "Recently")}
                          </div>
                        </div>
                        <span style={styles.statusBadge(result.status || "PASSED")}>
                          {result.status || "Submitted"}
                        </span>
                      </div>
                      <div style={styles.metricGrid}>
                        <InfoPill label="Score" value={`${result.score || 0}/${result.total || 0}`} />
                        <InfoPill label="Percentage" value={`${result.percentage || 0}%`} />
                      </div>
                      {Array.isArray(result.answerSheet) && result.answerSheet.length > 0 ? (
                        <div style={styles.feedbackPanel}>
                          <strong style={{ color: "#0f172a" }}>Answer review</strong>
                          <div style={{ display: "grid", gap: "10px", marginTop: "8px" }}>
                            {result.answerSheet.slice(0, 6).map((answer, index) => (
                              <div key={`${result._id}-answer-${index}`} style={styles.answerReviewRow(answer.isCorrect)}>
                                <div>
                                  <div style={{ color: "#0f172a", fontWeight: 800 }}>
                                    Q{index + 1}. {answer.questionText || "Question"}
                                  </div>
                                  <div style={{ color: "#475569", marginTop: "4px" }}>
                                    Selected: {answer.selectedAnswer || "Not answered"} | Correct:{" "}
                                    {answer.correctAnswer || "N/A"}
                                  </div>
                                </div>
                                <span style={styles.statusBadge(answer.isCorrect ? "PASSED" : "FAILED")}>
                                  {answer.isCorrect ? "Correct" : "Wrong"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {activeTab === "assignments" && (
        <div style={styles.sectionStack}>
          <section style={styles.gridTwo}>
            <form onSubmit={handleAssignmentSubmit} style={styles.card}>
              <SectionHeader
                kicker="Publish Assignment"
                title="Class task distribution"
                icon={<FileStack size={18} />}
                iconTone={["#d1fae5", "#0f766e"]}
              />

              <div style={styles.formGrid}>
                <SelectField
                  label="Classroom"
                  value={assignmentForm.classroomId}
                  onChange={(value) => setAssignmentForm((prev) => ({ ...prev, classroomId: value }))}
                  options={classOptions}
                />
                <Field
                  label="Title"
                  value={assignmentForm.title}
                  onChange={(value) => setAssignmentForm((prev) => ({ ...prev, title: value }))}
                  placeholder="Lab Report 2"
                />
                <Field
                  label="Due Date"
                  type="date"
                  value={assignmentForm.dueDate}
                  onChange={(value) => setAssignmentForm((prev) => ({ ...prev, dueDate: value }))}
                />
                <TextAreaField
                  label="Description"
                  value={assignmentForm.description}
                  onChange={(value) => setAssignmentForm((prev) => ({ ...prev, description: value }))}
                  placeholder="Explain the assignment brief"
                  full
                />
                <label style={{ ...styles.label, gridColumn: "1 / -1" }}>
                  Assignment File
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(event) => setAssignmentFile(event.target.files?.[0] || null)}
                    style={styles.fileInput}
                  />
                </label>
              </div>

              <button
                type="submit"
                style={styles.primaryButton}
                disabled={busyKey === "save-assignment"}
              >
                {busyKey === "save-assignment" ? "Publishing..." : "Publish Assignment"}
              </button>
            </form>

            <section style={styles.card}>
              <SectionHeader
                kicker="Review Queue"
                title="Latest submissions needing marks"
                icon={<ClipboardCheck size={18} />}
                iconTone={["#dbeafe", "#1d4ed8"]}
              />

              {assignments.every(
                (assignment) =>
                  !assignment.submissions || assignment.submissions.every((submission) => submission.status === "Checked")
              ) ? (
                <EmptyState text="No submission is waiting for review right now." />
              ) : (
                <div style={styles.cardGrid}>
                  {assignments.flatMap((assignment) =>
                    (assignment.submissions || [])
                      .filter((submission) => submission.status !== "Checked")
                      .slice(0, 4)
                      .map((submission) => (
                        <div key={submission._id} style={styles.reviewCard}>
                          <div style={styles.timelineTitle}>{submission.studentName}</div>
                          <div style={styles.timelineText}>
                            {assignment.title} | {submission.rollNumber || "No roll number"}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}
            </section>
          </section>

          <section style={styles.card}>
            <SectionHeader
              kicker="Assignment Ledger"
              title="All assignment posts and submissions"
              icon={<FileStack size={18} />}
              iconTone={["#fef3c7", "#b45309"]}
            />

            {assignments.length === 0 ? (
              <EmptyState text="No assignment has been posted yet." />
            ) : (
              <div style={styles.cardGrid}>
                {assignments.map((assignment) => (
                  <div key={assignment._id} style={styles.assignmentCard}>
                    <div style={styles.examTop}>
                      <div>
                        <div style={styles.smallKicker}>{assignment.classroomName}</div>
                        <div style={styles.timelineTitle}>{assignment.title}</div>
                        <div style={styles.timelineText}>
                          Due {formatDateTime(assignment.dueDate, "No due date")}
                        </div>
                      </div>
                      <div style={styles.countBadge}>
                        {assignment.submissionCount || assignment.submissions?.length || 0} submissions
                      </div>
                    </div>

                    {assignment.description ? (
                      <div style={{ color: "#475569", lineHeight: 1.65, marginBottom: "14px" }}>
                        {assignment.description}
                      </div>
                    ) : null}

                    {assignment.fileUrl ? (
                      <a
                        href={buildUploadUrl(assignment.fileUrl)}
                        target="_blank"
                        rel="noreferrer"
                        style={styles.fileLink}
                      >
                        <ExternalLink size={14} />
                        View assignment file
                      </a>
                    ) : null}

                    <div style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
                      {(assignment.submissions || []).length === 0 ? (
                        <EmptyState text="No student submission yet for this assignment." compact />
                      ) : (
                        (assignment.submissions || []).map((submission) => {
                          const draft = submissionDrafts[submission._id] || {
                            marks: submission.marks ?? "",
                            feedback: submission.feedback || "",
                          };

                          return (
                            <div key={submission._id} style={styles.submissionRow}>
                              <div style={styles.submissionHeader}>
                                <div>
                                  <strong>{submission.studentName}</strong>
                                  <div style={styles.timelineText}>
                                    {submission.rollNumber || "No roll number"} | {submission.status}
                                  </div>
                                </div>
                                {submission.fileUrl ? (
                                  <a
                                    href={buildUploadUrl(submission.fileUrl)}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={styles.fileLink}
                                  >
                                    <ExternalLink size={14} />
                                    Open file
                                  </a>
                                ) : null}
                              </div>

                              <div style={styles.marksGrid}>
                                <Field
                                  label="Marks"
                                  type="number"
                                  value={draft.marks}
                                  onChange={(value) =>
                                    setSubmissionDrafts((prev) => ({
                                      ...prev,
                                      [submission._id]: {
                                        ...draft,
                                        marks: value,
                                      },
                                    }))
                                  }
                                />
                                <TextAreaField
                                  label="Feedback"
                                  value={draft.feedback}
                                  onChange={(value) =>
                                    setSubmissionDrafts((prev) => ({
                                      ...prev,
                                      [submission._id]: {
                                        ...draft,
                                        feedback: value,
                                      },
                                    }))
                                  }
                                  placeholder="Optional teacher feedback"
                                  full
                                />
                              </div>

                              <button
                                type="button"
                                style={styles.successButton}
                                onClick={() => handleMarksSave(submission._id)}
                                disabled={busyKey === `submission-${submission._id}`}
                              >
                                <Check size={16} />
                                {busyKey === `submission-${submission._id}`
                                  ? "Saving..."
                                  : "Save Review"}
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div style={styles.actionRow}>
                      <button
                        type="button"
                        style={styles.dangerButton}
                        onClick={() => deleteAssignment(assignment._id)}
                        disabled={busyKey === `delete-assignment-${assignment._id}`}
                      >
                        <Trash2 size={16} />
                        Delete Assignment
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === "announcements" && (
        <div style={styles.sectionStack}>
          <section style={styles.gridTwo}>
            <form onSubmit={handleNotificationSubmit} style={styles.card}>
              <SectionHeader
                kicker={editingNotificationId ? "Edit Announcement" : "Publish Announcement"}
                title="Teacher communication center"
                icon={<BellRing size={18} />}
                iconTone={["#dbeafe", "#1d4ed8"]}
              />

              <div style={styles.formGrid}>
                <SelectField
                  label="Audience"
                  value={notificationForm.audience}
                  onChange={(value) =>
                    setNotificationForm((prev) => ({ ...prev, audience: value }))
                  }
                  options={[
                    { value: "classroom", label: "Specific classroom" },
                    { value: "all-students", label: "All students" },
                    { value: "teachers", label: "Teachers" },
                    { value: "all", label: "Everyone" },
                  ]}
                />
                <SelectField
                  label="Priority"
                  value={notificationForm.priority}
                  onChange={(value) =>
                    setNotificationForm((prev) => ({ ...prev, priority: value }))
                  }
                  options={[
                    { value: "normal", label: "Normal" },
                    { value: "high", label: "High" },
                  ]}
                />
                {notificationForm.audience === "classroom" ? (
                  <SelectField
                    label="Classroom"
                    value={notificationForm.classroomId}
                    onChange={(value) =>
                      setNotificationForm((prev) => ({ ...prev, classroomId: value }))
                    }
                    options={classOptions}
                    full
                  />
                ) : null}
                <Field
                  label="Title"
                  value={notificationForm.title}
                  onChange={(value) =>
                    setNotificationForm((prev) => ({ ...prev, title: value }))
                  }
                  placeholder="Exam Room Reminder"
                  full
                />
                <Field
                  label="Type"
                  value={notificationForm.type}
                  onChange={(value) =>
                    setNotificationForm((prev) => ({ ...prev, type: value }))
                  }
                  placeholder="general / approval / assignment"
                />
                <TextAreaField
                  label="Message"
                  value={notificationForm.message}
                  onChange={(value) =>
                    setNotificationForm((prev) => ({ ...prev, message: value }))
                  }
                  placeholder="Write the announcement body"
                  full
                />
              </div>

              <div style={styles.actionRow}>
                <button
                  type="submit"
                  style={styles.primaryButton}
                  disabled={busyKey === "save-notification"}
                >
                  {busyKey === "save-notification"
                    ? "Saving..."
                    : editingNotificationId
                    ? "Update Announcement"
                    : "Publish Announcement"}
                </button>
                {editingNotificationId ? (
                  <button type="button" style={styles.secondaryButton} onClick={resetNotificationForm}>
                    Cancel Edit
                  </button>
                ) : null}
              </div>
            </form>

            <section style={styles.card}>
              <SectionHeader
                kicker="Live Feed"
                title="Recent announcement records"
                icon={<BellRing size={18} />}
                iconTone={["#ecfccb", "#3f6212"]}
              />

              {notifications.length === 0 ? (
                <EmptyState text="No announcement exists yet." />
              ) : (
                <div style={styles.cardGrid}>
                  {notifications.slice(0, 6).map((notification) => (
                    <div key={notification._id} style={styles.feedCard}>
                      <div style={styles.examTop}>
                        <div>
                          <div style={styles.timelineTitle}>{notification.title}</div>
                          <div style={styles.timelineText}>
                            {notification.classroomName || notification.audience || "General"}
                          </div>
                        </div>
                        <div style={styles.priorityBadge(notification.priority)}>
                          {notification.priority || "normal"}
                        </div>
                      </div>

                      <div style={{ color: "#475569", lineHeight: 1.65 }}>{notification.message}</div>

                      <div style={styles.actionRow}>
                        <button
                          type="button"
                          style={styles.secondaryButton}
                          onClick={() => startEditNotification(notification)}
                        >
                          <Pencil size={16} />
                          Edit
                        </button>
                        <button
                          type="button"
                          style={styles.dangerButton}
                          onClick={() => deleteNotification(notification._id)}
                          disabled={busyKey === `delete-notification-${notification._id}`}
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </section>
        </div>
      )}

      {activeTab === "results" && (
        <section style={styles.card}>
          <SectionHeader
            kicker="Result Ledger"
            title="Student academic and integrity outcomes"
            icon={<ClipboardCheck size={18} />}
            iconTone={["#dbeafe", "#1d4ed8"]}
          />

          {examResults.length === 0 ? (
            <EmptyState text="No AI exam result exists yet." />
          ) : (
            <div style={styles.cardGrid}>
              {examResults.map((result) => (
                <div key={result._id} style={styles.resultCard}>
                  <div style={styles.examTop}>
                    <div>
                      <div style={styles.timelineTitle}>{result.studentName || "Student"}</div>
                      <div style={styles.timelineText}>
                        {result.testName || "Exam"} | {result.classroomName || "Classroom"}
                      </div>
                      <div style={styles.timelineText}>
                        Attempted {formatDateTime(result.createdAt, "Recently")}
                      </div>
                    </div>
                    <div style={styles.statusBadge(result.status || "saved")}>
                      {result.status || "saved"}
                    </div>
                  </div>

                  <div style={styles.approvalMetaGrid}>
                    <InfoPill
                      label="Score"
                      value={`${result.score || 0}/${result.total || 0}`}
                    />
                    <InfoPill label="Percentage" value={`${result.percentage || 0}%`} />
                    <InfoPill
                      label="Suspicious"
                      value={`${result.suspiciousScore || result.cheatingPercent || 0}%`}
                    />
                    <InfoPill label="Trust" value={result.trustFactor || "Reliable"} />
                  </div>

                  <div style={{ color: "#475569", lineHeight: 1.65 }}>
                    Warnings {result.warnings || 0} | Eye {result.eyeWarnings || 0} | Head{" "}
                    {result.headWarnings || 0} | Screenshot {result.screenshotWarnings || 0}
                  </div>

                  {(result.responseMode || "mcq") === "written" ? (
                    <div style={styles.feedbackPanel}>
                      <strong style={{ color: "#0f172a" }}>Written response</strong>
                      <div style={{ color: "#475569", lineHeight: 1.65, marginTop: "6px" }}>
                        {result.writtenAnswer || "No typed answer was submitted."}
                      </div>
                      {result.writtenFileUrl ? (
                        <a
                          href={buildUploadUrl(result.writtenFileUrl)}
                          target="_blank"
                          rel="noreferrer"
                          style={styles.fileLink}
                        >
                          <ExternalLink size={14} />
                          View uploaded answer sheet
                        </a>
                      ) : null}
                    </div>
                  ) : null}

                  {Array.isArray(result.evidenceShots) && result.evidenceShots.length > 0 ? (
                    <div style={{ display: "grid", gap: "10px" }}>
                      <div style={styles.metricLabel}>Cheating Detection Evidence</div>
                      <div style={styles.resultEvidenceGrid}>
                        {result.evidenceShots.slice(0, 4).map((shot, index) => (
                          <div key={`${result._id}-shot-${index}`} style={styles.resultEvidenceCard}>
                            <img
                              src={shot.imageData}
                              alt={`${shot.type || "movement"} evidence`}
                              style={styles.resultEvidenceImage}
                            />
                            <div style={styles.resultEvidenceMeta}>
                              <strong style={{ textTransform: "capitalize", color: "#0f172a" }}>
                                {shot.type || "movement"}
                              </strong>
                              <span>
                                {shot.occurredAt
                                  ? new Date(shot.occurredAt).toLocaleTimeString()
                                  : "Captured"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div style={styles.actionRow}>
                    <button
                      type="button"
                      style={styles.dangerButton}
                      onClick={() => deleteResult(result._id)}
                      disabled={busyKey === `delete-result-${result._id}`}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "examCheck" && <ExamChecker />}

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

const SectionHeader = ({ kicker, title, icon, iconTone }) => (
  <div style={styles.sectionHeader}>
    <div>
      <div style={styles.sectionKicker}>{kicker}</div>
      <h2 style={styles.sectionTitle}>{title}</h2>
    </div>
    <div style={styles.iconBadge(iconTone[0], iconTone[1])}>{icon}</div>
  </div>
);

const MetricCard = ({ label, value, bright = false }) => (
  <div style={bright ? styles.heroStatCard : styles.metricCard}>
    <span style={bright ? styles.heroStatLabel : styles.metricLabel}>{label}</span>
    <strong style={bright ? styles.heroStatValue : styles.metricValue}>{value}</strong>
  </div>
);

const InfoPill = ({ label, value }) => (
  <div style={styles.infoPill}>
    <span style={styles.metricLabel}>{label}</span>
    <strong style={styles.infoPillValue}>{value}</strong>
  </div>
);

const EmptyState = ({ text, compact = false }) => (
  <div style={compact ? styles.emptyCompact : styles.emptyState}>{text}</div>
);

const Field = ({ label, value, onChange, placeholder = "", type = "text", full = false }) => (
  <label style={{ ...styles.label, gridColumn: full ? "1 / -1" : "auto" }}>
    {label}
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      style={styles.input}
    />
  </label>
);

const SelectField = ({ label, value, onChange, options, full = false }) => (
  <label style={{ ...styles.label, gridColumn: full ? "1 / -1" : "auto" }}>
    {label}
    <select value={value} onChange={(event) => onChange(event.target.value)} style={styles.input}>
      <option value="">Select</option>
      {options.map((option) => (
        <option key={`${option.value}-${option.label}`} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

const TextAreaField = ({
  label,
  value,
  onChange,
  placeholder = "",
  full = false,
}) => (
  <label style={{ ...styles.label, gridColumn: full ? "1 / -1" : "auto" }}>
    {label}
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      style={{ ...styles.input, minHeight: "110px", resize: "vertical" }}
    />
  </label>
);

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
  noticeSuccess: {
    padding: "14px 16px",
    borderRadius: "18px",
    background: "#ecfdf5",
    border: "1px solid #bbf7d0",
    color: "#166534",
    marginBottom: "18px",
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
    background: active
      ? "linear-gradient(135deg, rgba(15,118,110,0.1), rgba(37,99,235,0.08))"
      : "#fff",
    color: "#0f172a",
    borderRadius: "16px",
    padding: "12px 16px",
    fontWeight: 800,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
  }),
  sectionStack: {
    display: "grid",
    gap: "18px",
  },
  gridTwo: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "18px",
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
  coachCard: {
    display: "flex",
    gap: "12px",
    padding: "15px 16px",
    borderRadius: "18px",
    background: "#f8fbff",
    border: "1px solid rgba(37,99,235,0.12)",
    color: "#334155",
  },
  metricGrid: {
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
  metricLabel: {
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#64748b",
  },
  metricValue: {
    fontSize: "26px",
    color: "#0f172a",
  },
  timelineCard: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
    padding: "16px 18px",
    borderRadius: "20px",
    background: "#f8fafc",
    border: "1px solid rgba(148,163,184,0.14)",
  },
  timelineTitle: {
    fontSize: "20px",
    fontWeight: 800,
    color: "#0f172a",
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
  alertCard: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "center",
    padding: "16px 18px",
    borderRadius: "20px",
    background: "#fff7ed",
    border: "1px solid rgba(249,115,22,0.14)",
  },
  riskBadge: {
    padding: "10px 14px",
    borderRadius: "999px",
    background: "#fee2e2",
    color: "#b91c1c",
    fontWeight: 800,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
    marginBottom: "18px",
  },
  toggleGroup: {
    display: "grid",
    gap: "10px",
    padding: "14px 16px",
    borderRadius: "18px",
    background: "#f8fbff",
    border: "1px solid rgba(148,163,184,0.12)",
    gridColumn: "1 / -1",
  },
  toggleField: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#334155",
    fontWeight: 600,
  },
  label: {
    display: "grid",
    gap: "8px",
    color: "#334155",
    fontWeight: 700,
    fontSize: "14px",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "16px",
    border: "1px solid rgba(148,163,184,0.22)",
    background: "#f8fafc",
    boxSizing: "border-box",
    fontSize: "15px",
    color: "#0f172a",
    fontFamily: "inherit",
  },
  fileInput: {
    width: "100%",
    padding: "13px 14px",
    borderRadius: "16px",
    border: "1px dashed rgba(37,99,235,0.28)",
    background: "#eff6ff",
    boxSizing: "border-box",
    fontSize: "14px",
  },
  primaryButton: {
    border: "none",
    borderRadius: "18px",
    padding: "15px 18px",
    background: "linear-gradient(135deg, #1d4ed8, #0f766e)",
    color: "#fff",
    fontWeight: 800,
    fontSize: "15px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    boxShadow: "0 18px 34px rgba(37, 99, 235, 0.18)",
  },
  secondaryButton: {
    border: "1px solid rgba(148,163,184,0.24)",
    borderRadius: "18px",
    padding: "14px 18px",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 800,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
  },
  successButton: {
    border: "none",
    borderRadius: "18px",
    padding: "14px 18px",
    background: "#16a34a",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
  },
  warningButton: {
    border: "none",
    borderRadius: "18px",
    padding: "14px 18px",
    background: "#f59e0b",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
  },
  dangerButton: {
    border: "none",
    borderRadius: "18px",
    padding: "14px 18px",
    background: "#dc2626",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
  },
  actionRow: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "16px",
  },
  cardGrid: {
    display: "grid",
    gap: "16px",
  },
  classroomCard: {
    padding: "18px",
    borderRadius: "22px",
    background: "#f8fbff",
    border: "1px solid #dbe3ef",
    display: "grid",
    gap: "12px",
  },
  classroomMeta: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    color: "#475569",
  },
  approvalCard: {
    padding: "20px",
    borderRadius: "24px",
    background: "#fff",
    border: "1px solid rgba(148,163,184,0.16)",
    boxShadow: "0 16px 32px rgba(15, 23, 42, 0.06)",
    display: "grid",
    gap: "14px",
  },
  approvalTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  pendingBadge: {
    padding: "8px 12px",
    borderRadius: "999px",
    background: "#fff7ed",
    color: "#c2410c",
    fontWeight: 800,
  },
  approvalMetaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "10px",
  },
  infoPill: {
    padding: "14px 16px",
    borderRadius: "18px",
    background: "#f8fafc",
    border: "1px solid rgba(148,163,184,0.14)",
    display: "grid",
    gap: "8px",
  },
  infoPillValue: {
    color: "#0f172a",
    lineHeight: 1.5,
  },
  fileLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    width: "fit-content",
    padding: "10px 14px",
    borderRadius: "999px",
    textDecoration: "none",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontWeight: 700,
    fontSize: "13px",
  },
  feedbackPanel: {
    display: "grid",
    gap: "6px",
    padding: "14px 16px",
    borderRadius: "18px",
    background: "#f8fbff",
    border: "1px solid rgba(148,163,184,0.12)",
  },
  rosterGroup: {
    padding: "18px",
    borderRadius: "22px",
    background: "#f8fbff",
    border: "1px solid rgba(148,163,184,0.14)",
  },
  rosterTitle: {
    fontSize: "18px",
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: "12px",
  },
  rosterRow: {
    padding: "12px 14px",
    borderRadius: "16px",
    background: "#fff",
    border: "1px solid rgba(148,163,184,0.12)",
    display: "grid",
    gap: "4px",
    color: "#475569",
  },
  smallKicker: {
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: "#64748b",
  },
  examCard: {
    padding: "22px",
    borderRadius: "26px",
    background: "#fff",
    border: "1px solid rgba(148,163,184,0.16)",
    boxShadow: "0 18px 36px rgba(15, 23, 42, 0.06)",
  },
  examTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  statusBadge: (status) => ({
    display: "inline-flex",
    padding: "8px 12px",
    borderRadius: "999px",
    background:
      status === "live"
        ? "#dcfce7"
        : status === "closed"
        ? "#e2e8f0"
        : status === "PASSED"
        ? "#dcfce7"
        : status === "FAILED"
        ? "#fee2e2"
        : "#dbeafe",
    color:
      status === "live"
        ? "#166534"
        : status === "closed"
        ? "#475569"
        : status === "PASSED"
        ? "#166534"
        : status === "FAILED"
        ? "#b91c1c"
        : "#1d4ed8",
    fontWeight: 800,
    textTransform: "capitalize",
  }),
  assignmentCard: {
    padding: "22px",
    borderRadius: "26px",
    background: "#fff",
    border: "1px solid rgba(148,163,184,0.16)",
    boxShadow: "0 18px 36px rgba(15, 23, 42, 0.06)",
    display: "grid",
    gap: "12px",
  },
  countBadge: {
    padding: "8px 12px",
    borderRadius: "999px",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontWeight: 800,
  },
  reviewCard: {
    padding: "16px 18px",
    borderRadius: "20px",
    background: "#f8fafc",
    border: "1px solid rgba(148,163,184,0.14)",
  },
  submissionRow: {
    padding: "16px",
    borderRadius: "20px",
    background: "#f8fafc",
    border: "1px solid rgba(148,163,184,0.14)",
    display: "grid",
    gap: "12px",
  },
  submissionHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  marksGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
  },
  priorityBadge: (priority) => ({
    padding: "8px 12px",
    borderRadius: "999px",
    background: priority === "high" ? "#fee2e2" : "#ecfccb",
    color: priority === "high" ? "#b91c1c" : "#3f6212",
    fontWeight: 800,
    textTransform: "capitalize",
  }),
  feedCard: {
    padding: "20px",
    borderRadius: "22px",
    background: "#f8fbff",
    border: "1px solid rgba(148,163,184,0.14)",
    display: "grid",
    gap: "14px",
  },
  resultCard: {
    padding: "22px",
    borderRadius: "24px",
    background: "#fff",
    border: "1px solid rgba(148,163,184,0.14)",
    boxShadow: "0 18px 36px rgba(15, 23, 42, 0.06)",
    display: "grid",
    gap: "14px",
  },
  resultEvidenceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "10px",
  },
  resultEvidenceCard: {
    borderRadius: "18px",
    overflow: "hidden",
    border: "1px solid rgba(148,163,184,0.14)",
    background: "#f8fbff",
    display: "grid",
  },
  resultEvidenceImage: {
    width: "100%",
    aspectRatio: "4 / 3",
    objectFit: "cover",
    display: "block",
    background: "#0f172a",
  },
  resultEvidenceMeta: {
    display: "flex",
    justifyContent: "space-between",
    gap: "8px",
    alignItems: "center",
    padding: "10px 12px",
    fontSize: "12px",
    color: "#64748b",
  },
  answerReviewRow: (correct) => ({
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "flex-start",
    padding: "12px 14px",
    borderRadius: "16px",
    background: correct ? "#f0fdf4" : "#fff7ed",
    border: correct ? "1px solid #bbf7d0" : "1px solid #fed7aa",
  }),
  emptyState: {
    padding: "20px",
    borderRadius: "18px",
    background: "#f8fafc",
    border: "1px dashed rgba(148,163,184,0.26)",
    color: "#64748b",
  },
  emptyCompact: {
    padding: "16px",
    borderRadius: "16px",
    background: "#fff",
    border: "1px dashed rgba(148,163,184,0.22)",
    color: "#64748b",
  },
};

export default TeacherPanel;
