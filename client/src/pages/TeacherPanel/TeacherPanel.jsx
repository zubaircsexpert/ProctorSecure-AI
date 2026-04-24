import React, { useState, useEffect } from "react";
import NotificationManager from "./NotificationManager";
import ExamManager from "./ExamManager";
import AssignmentManager from "./AssignmentManager";
import ResultsList from "./ResultsList";
import API from "../../services/api";

const TeacherPanel = () => {
  const [activeTab, setActiveTab] = useState("notifications");

  // State Management
  const [notifications, setNotifications] = useState([]);
  const [formData, setFormData] = useState({ title: "", message: "", type: "general" });
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const [exams, setExams] = useState([]);
  const [examForm, setExamForm] = useState({ course: "", title: "", syllabus: "", duration: "" });

  const [assignments, setAssignments] = useState([]);
  const [assignForm, setAssignForm] = useState({ title: "", dueDate: "" });
  const [selectedFile, setSelectedFile] = useState(null);
  const [marksInput, setMarksInput] = useState({});

  const [questionForm, setQuestionForm] = useState({
    examId: "",
    question: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: ""
  });

  useEffect(() => {
    fetchNotifications();
    fetchExams();
    fetchAssignments();
  }, []);

  // ================= API CALLS =================

  const fetchNotifications = async () => {
    try {
      const res = await API.get("/api/notifications/all");
      setNotifications(res.data);
    } catch (err) { console.error("Error fetching notifications:", err); }
  };

  const fetchExams = async () => {
    try {
      const res = await API.get("/api/exams/all");
      setExams(res.data);
    } catch (err) { console.error("Error fetching exams:", err); }
  };

  const fetchAssignments = async () => {
    try {
      const res = await API.get("/api/assignments/all");
      setAssignments(res.data);
    } catch (err) { console.error("Error fetching assignments:", err); }
  };

  // ================= NOTIFICATIONS LOGIC =================
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
    } catch (err) { alert("Failed to save notification"); }
  };

  // ================= EXAM LOGIC =================
  const handleExamPost = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...examForm, duration: Number(examForm.duration), status: "pending" };
      await API.post("/api/exams/add", payload);
      setExamForm({ course: "", title: "", syllabus: "", duration: "" });
      fetchExams();
      alert("Exam Created ✅");
    } catch (err) { alert("Failed to create exam"); }
  };

  const toggleExamStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'live' ? 'pending' : 'live';
    try {
      await API.put(`/api/exams/update-status/${id}`, { status: newStatus });
      fetchExams();
    } catch (err) { alert("Failed to update status"); }
  };

  // ================= MCQ LOGIC =================
  const handleQuestionSubmit = async (e) => {
    e.preventDefault();
    if (!questionForm.examId) return alert("Select an exam first!");

    try {
      const payload = {
        examId: questionForm.examId,
        question: questionForm.question,
        options: [questionForm.optionA, questionForm.optionB, questionForm.optionC, questionForm.optionD],
        correctAnswer: questionForm.correctAnswer
      };
      await API.post("/api/questions/add", payload);
      alert("MCQ Added Successfully! ✅");
      setQuestionForm({ examId: "", question: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "" });
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || "Failed to add MCQ"));
    }
  };

  // ================= ASSIGNMENT LOGIC =================
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
    } catch (err) { alert("Failed to upload assignment"); }
  };

  // ================= DELETE LOGIC =================
  const handleDelete = async (type, id) => {
    try {
      await API.delete(`/api/${type}/delete/${id}`);
      if (type === "notifications") fetchNotifications();
      else if (type === "exams") fetchExams();
      else fetchAssignments();
    } catch (err) { alert("Delete failed"); }
  };

  const container = { padding: "40px", backgroundColor: "#f4f7f6" };

  return (
    <div style={container}>
      {/* NAVIGATION TABS */}
      <div style={{ marginBottom: "20px" }}>
        <button onClick={() => setActiveTab("notifications")}>Announcements</button>
        <button onClick={() => setActiveTab("exams")}>Manage Exams</button>
        <button onClick={() => setActiveTab("assignments")}>Assignments</button>
        <button onClick={() => setActiveTab("studentResult")}>Results</button>
      </div>

      {/* ================= EXAMS TAB CONTENT ================= */}
      {activeTab === "exams" && (
        <div>
          <h2>Create Exam (With Timer)</h2>
          <form onSubmit={handleExamPost}>
            <input placeholder="Course" value={examForm.course} onChange={e => setExamForm({...examForm, course: e.target.value})} />
            <input placeholder="Title" value={examForm.title} onChange={e => setExamForm({...examForm, title: e.target.value})} />
            <input placeholder="Duration (min)" type="number" value={examForm.duration} onChange={e => setExamForm({...examForm, duration: e.target.value})} />
            <button type="submit">Create Exam</button>
          </form>

          <hr />
          <h2>Control Center</h2>
          {exams.map(ex => (
            <div key={ex._id} style={{ padding: '10px', border: '1px solid #ddd', margin: '5px', borderRadius: '5px', background: '#fff' }}>
              <strong>{ex.title}</strong> - Status: <b>{ex.status || "pending"}</b>
              <button style={{ marginLeft: '20px' }} onClick={() => toggleExamStatus(ex._id, ex.status)}>
                {ex.status === 'live' ? 'Stop Exam' : 'Start/Allow Exam'}
              </button>
            </div>
          ))}

          <hr />
          <h2>Add MCQ</h2>
          <form onSubmit={handleQuestionSubmit}>
            <select value={questionForm.examId} onChange={e => setQuestionForm({...questionForm, examId: e.target.value})}>
              <option value="">Select Exam</option>
              {exams.map(ex => <option key={ex._id} value={ex._id}>{ex.title}</option>)}
            </select>
            <input placeholder="Question" value={questionForm.question} onChange={e => setQuestionForm({...questionForm, question: e.target.value})} />
            <input placeholder="Option A" value={questionForm.optionA} onChange={e => setQuestionForm({...questionForm, optionA: e.target.value})} />
            <input placeholder="Option B" value={questionForm.optionB} onChange={e => setQuestionForm({...questionForm, optionB: e.target.value})} />
            <input placeholder="Option C" value={questionForm.optionC} onChange={e => setQuestionForm({...questionForm, optionC: e.target.value})} />
            <input placeholder="Option D" value={questionForm.optionD} onChange={e => setQuestionForm({...questionForm, optionD: e.target.value})} />
            <input placeholder="Correct Answer" value={questionForm.correctAnswer} onChange={e => setQuestionForm({...questionForm, correctAnswer: e.target.value})} />
            <button type="submit">Add MCQ</button>
          </form>
        </div>
      )}

      {/* ================= OTHER TABS ================= */}
      {activeTab === "notifications" && (
        <NotificationManager 
            {...{formData, setFormData, isEditing, setIsEditing, handleSubmit, notifications, setCurrentId, handleDelete}} 
        />
      )}
      
      {activeTab === "assignments" && (
        <AssignmentManager 
            {...{assignForm, setAssignForm, setSelectedFile, handleAssignPost, assignments, marksInput, setMarksInput, handleDelete}} 
        />
      )}

      {activeTab === "studentResult" && <ResultsList />}
    </div>
  );
};

export default TeacherPanel;