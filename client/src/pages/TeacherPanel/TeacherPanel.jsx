import React, { useState, useEffect } from "react";
import NotificationManager from "./NotificationManager";
import AssignmentManager from "./AssignmentManager";
import ResultsList from "./ResultsList";
import API from "../../services/api";

const TeacherPanel = () => {
  const [activeTab, setActiveTab] = useState("notifications");

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

  useEffect(() => {
    fetchNotifications();
    fetchExams();
    fetchAssignments();

    const examInterval = setInterval(fetchExams, 10000);
    return () => clearInterval(examInterval);
  }, []);

  const toISODateTime = (value) => {
    return value ? new Date(value).toISOString() : null;
  };

  const fetchNotifications = async () => {
    try {
      const res = await API.get("/api/notifications/all");
      setNotifications(res.data);
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
      setAssignments(res.data);
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

      await API.post("/api/exams/add", payload);

      setExamForm({
        course: "",
        title: "",
        syllabus: "",
        duration: "",
        examKey: "",
        startTime: "",
        endTime: "",
      });

      fetchExams();
      alert("Exam Scheduled ✅");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create exam");
    }
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

  const handleDelete = async (type, id) => {
    try {
      await API.delete(`/api/${type}/delete/${id}`);
      if (type === "notifications") fetchNotifications();
      else if (type === "exams") fetchExams();
      else fetchAssignments();
    } catch {
      alert("Delete failed");
    }
  };

  const tabBtn = {
    padding: "12px 20px",
    borderRadius: "10px",
    border: "1px solid #ddd",
    background: "#fff",
    cursor: "pointer",
    fontWeight: "600",
  };

  const actionBtn = {
    padding: "10px 18px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    fontWeight: "700",
  };

  return (
    <div style={{ padding: "40px", backgroundColor: "#f4f7f6" }}>
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button style={tabBtn} onClick={() => setActiveTab("notifications")}>Announcements</button>
        <button style={tabBtn} onClick={() => setActiveTab("exams")}>Manage Exams</button>
        <button style={tabBtn} onClick={() => setActiveTab("assignments")}>Assignments</button>
        <button style={tabBtn} onClick={() => setActiveTab("studentResult")}>Results</button>
      </div>

      {activeTab === "exams" && (
        <div>
          <h2>Create / Schedule Exam</h2>
          <form onSubmit={handleExamPost} style={{ display: "grid", gap: "10px", maxWidth: "900px" }}>
            <input
              placeholder="Course"
              value={examForm.course}
              onChange={(e) => setExamForm({ ...examForm, course: e.target.value })}
            />
            <input
              placeholder="Title"
              value={examForm.title}
              onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
            />
            <input
              placeholder="Syllabus"
              value={examForm.syllabus}
              onChange={(e) => setExamForm({ ...examForm, syllabus: e.target.value })}
            />
            <input
              placeholder="Duration (min)"
              type="number"
              value={examForm.duration}
              onChange={(e) => setExamForm({ ...examForm, duration: e.target.value })}
            />
            <input
              placeholder="Exam Key (optional)"
              value={examForm.examKey}
              onChange={(e) => setExamForm({ ...examForm, examKey: e.target.value })}
            />
            <label>Start Time</label>
            <input
              type="datetime-local"
              value={examForm.startTime}
              onChange={(e) => setExamForm({ ...examForm, startTime: e.target.value })}
            />
            <label>End Time</label>
            <input
              type="datetime-local"
              value={examForm.endTime}
              onChange={(e) => setExamForm({ ...examForm, endTime: e.target.value })}
            />
            <button style={{ ...actionBtn, background: "#1a73e8", color: "#fff" }} type="submit">
              Schedule Exam
            </button>
          </form>

          <hr />
          <h2>Control Center</h2>

          {exams.map((ex) => (
            <div
              key={ex._id}
              style={{
                padding: "18px",
                border: "1px solid #ddd",
                marginBottom: "12px",
                borderRadius: "14px",
                background: "#fff",
                boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
              }}
            >
              <strong style={{ fontSize: "20px" }}>{ex.title}</strong> ({ex.course})
              <div>Status: <b>{ex.status}</b></div>
              <div>Access: <b>{ex.accessGranted ? "Enabled" : "Disabled"}</b></div>
              <div>Duration: {ex.duration} min</div>
              <div>Exam Key: {ex.examKey || "Not set"}</div>
              <div>Start: {ex.startTime ? new Date(ex.startTime).toLocaleString() : "Not set"}</div>
              <div>End: {ex.endTime ? new Date(ex.endTime).toLocaleString() : "Not set"}</div>

              <div style={{ marginTop: "12px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                  style={{ ...actionBtn, background: "#16a34a", color: "#fff" }}
                  onClick={() => goLiveExam(ex)}
                >
                  Allow / Go Live
                </button>

                <button
                  style={{ ...actionBtn, background: "#f59e0b", color: "#fff" }}
                  onClick={() => stopExamAccess(ex)}
                >
                  Stop Access
                </button>

                <button
                  style={{ ...actionBtn, background: "#6b7280", color: "#fff" }}
                  onClick={() => closeExam(ex)}
                >
                  Close Exam
                </button>

                <button
                  style={{ ...actionBtn, background: "#dc2626", color: "#fff" }}
                  onClick={() => deleteExam(ex._id)}
                >
                  Delete Exam
                </button>
              </div>
            </div>
          ))}

          <hr />
          <h2>Add MCQ</h2>
          <form onSubmit={handleQuestionSubmit} style={{ display: "grid", gap: "10px", maxWidth: "900px" }}>
            <select
              value={questionForm.examId}
              onChange={(e) => setQuestionForm({ ...questionForm, examId: e.target.value })}
            >
              <option value="">Select Exam</option>
              {exams
                .filter((ex) => ex.status !== "closed")
                .map((ex) => (
                  <option key={ex._id} value={ex._id}>
                    {ex.title}
                  </option>
                ))}
            </select>

            <input
              placeholder="Question"
              value={questionForm.questionText}
              onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
            />
            <input
              placeholder="Option A"
              value={questionForm.optionA}
              onChange={(e) => setQuestionForm({ ...questionForm, optionA: e.target.value })}
            />
            <input
              placeholder="Option B"
              value={questionForm.optionB}
              onChange={(e) => setQuestionForm({ ...questionForm, optionB: e.target.value })}
            />
            <input
              placeholder="Option C"
              value={questionForm.optionC}
              onChange={(e) => setQuestionForm({ ...questionForm, optionC: e.target.value })}
            />
            <input
              placeholder="Option D"
              value={questionForm.optionD}
              onChange={(e) => setQuestionForm({ ...questionForm, optionD: e.target.value })}
            />
            <input
              placeholder="Correct Answer"
              value={questionForm.correctAnswer}
              onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
            />
            <button style={{ ...actionBtn, background: "#1a73e8", color: "#fff" }} type="submit">
              Add MCQ
            </button>
          </form>
        </div>
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
            handleDelete,
          }}
        />
      )}

      {activeTab === "studentResult" && <ResultsList />}
    </div>
  );
};

export default TeacherPanel;
