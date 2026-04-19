import React, { useState, useEffect } from "react";
import axios from "axios";
import NotificationManager from "./NotificationManager";
import ExamManager from "./ExamManager";
import AssignmentManager from "./AssignmentManager";
import ResultsList from "./ResultsList"; // Naya component

const TeacherPanel = () => {
  const [activeTab, setActiveTab] = useState("notifications");
  const [notifications, setNotifications] = useState([]);
  const [formData, setFormData] = useState({ title: "", message: "", type: "general" });
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [exams, setExams] = useState([]);
  const [examForm, setExamForm] = useState({ course: "", title: "", syllabus: "" });
  const [assignments, setAssignments] = useState([]);
  const [assignForm, setAssignForm] = useState({ title: "", dueDate: "" });
  const [selectedFile, setSelectedFile] = useState(null);
  const [marksInput, setMarksInput] = useState({});

  useEffect(() => {
    fetchNotifications(); fetchExams(); fetchAssignments();
  }, []);

  const fetchNotifications = async () => {
    try { const res = await axios.get("https://proctorsecure-ai-jkc2.onrender.com/api/notifications/all"); setNotifications(res.data); } catch (err) { console.log(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) { await axios.put(`http://localhost:5000/api/notifications/update/${currentId}`, formData); setIsEditing(false); }
      else { await axios.post("http://localhost:5000/api/notifications/add", formData); }
      setFormData({ title: "", message: "", type: "general" }); fetchNotifications();
    } catch (err) { alert("Action failed!"); }
  };

  const fetchExams = async () => {
    try { const res = await axios.get("http://localhost:5000/api/exams/all"); setExams(res.data); } catch (err) { console.log(err); }
  };

  const handleExamPost = async (e) => {
    e.preventDefault();
    try { await axios.post("http://localhost:5000/api/exams/add", examForm); setExamForm({ course: "", title: "", syllabus: "" }); fetchExams(); alert("Exam Schedule Posted!"); }
    catch (err) { alert("Post failed!"); }
  };

  const fetchAssignments = async () => {
    try { const res = await axios.get("http://localhost:5000/api/assignments/all"); setAssignments(res.data); } catch (err) { console.log(err); }
  };

  const handleAssignPost = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("title", assignForm.title);
    data.append("dueDate", assignForm.dueDate);
    if (selectedFile) { data.append("file", selectedFile); }
    try {
      await axios.post("http://localhost:5000/api/assignments/add", data, { headers: { "Content-Type": "multipart/form-data" } });
      setAssignForm({ title: "", dueDate: "" }); setSelectedFile(null); fetchAssignments(); alert("Assignment Sent!");
    } catch (err) { alert("Assignment creation failed!"); }
  };

  const handleGiveMarks = async (assignmentId) => {
    const marks = marksInput[assignmentId];
    if (!marks) { alert("Marks enter karo"); return; }
    try {
      await axios.post("http://localhost:5000/api/assignments/give-marks", { assignmentId, marks });
      alert("Marks added"); fetchAssignments();
    } catch (err) { alert("Error"); }
  };

  const handleDelete = async (type, id) => {
    if (window.confirm("Khatam kar dein?")) {
      try {
        await axios.delete(`http://localhost:5000/api/${type}/delete/${id}`);
        type === "notifications" ? fetchNotifications() : type === "exams" ? fetchExams() : fetchAssignments();
      } catch (err) { alert("Delete failed!"); }
    }
  };

  const badgeStyle = (type) => ({ fontSize: "10px", padding: "2px 8px", borderRadius: "10px", marginLeft: "10px", color: "#fff", background: type === "test" ? "#e74c3c" : "#3498db" });

  const container = { padding: "40px", backgroundColor: "#f4f7f6", minHeight: "100vh" };
  const tabContainer = { display: "flex", gap: "15px", marginBottom: "25px", borderBottom: "1px solid #ddd" };
  const tabBtn = { padding: "10px 20px", border: "none", background: "none", cursor: "pointer", fontWeight: "bold", color: "#888" };
  const activeTabBtn = { ...tabBtn, color: "#1a2a6c", borderBottom: "3px solid #1a2a6c" };

  return (
    <div style={container}>
      <div style={tabContainer}>
        <button onClick={() => setActiveTab("notifications")} style={activeTab === "notifications" ? activeTabBtn : tabBtn}>Announcements</button>
        <button onClick={() => setActiveTab("exams")} style={activeTab === "exams" ? activeTabBtn : tabBtn}>Manage Exams</button>
        <button onClick={() => setActiveTab("assignments")} style={activeTab === "assignments" ? activeTabBtn : tabBtn}>Assignments</button>
        {/* Navbar ka existing studentResult tab */}
        <button onClick={() => setActiveTab("studentResult")} style={activeTab === "studentResult" ? activeTabBtn : tabBtn}>Student Results</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: activeTab === "studentResult" ? "1fr" : "1fr 2fr", gap: "25px" }}>
        {activeTab === "notifications" && (
          <NotificationManager formData={formData} setFormData={setFormData} isEditing={isEditing} setIsEditing={setIsEditing} handleSubmit={handleSubmit} notifications={notifications} setCurrentId={setCurrentId} handleDelete={handleDelete} badgeStyle={badgeStyle} />
        )}
        
        {activeTab === "exams" && (
          <ExamManager examForm={examForm} setExamForm={setExamForm} handleExamPost={handleExamPost} exams={exams} handleDelete={handleDelete} />
        )}
        
        {activeTab === "assignments" && (
          <AssignmentManager assignForm={assignForm} setAssignForm={setAssignForm} setSelectedFile={setSelectedFile} handleAssignPost={handleAssignPost} assignments={assignments} marksInput={marksInput} setMarksInput={setMarksInput} handleGiveMarks={handleGiveMarks} handleDelete={handleDelete} />
        )}

        {/* Sirf component call kiya hai, design grid auto manage ho jayegi */}
        {activeTab === "studentResult" && (
          <ResultsList />
        )}
      </div>
    </div>
  );
};

export default TeacherPanel;
