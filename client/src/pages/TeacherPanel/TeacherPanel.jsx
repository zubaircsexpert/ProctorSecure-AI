import React, { useState, useEffect } from "react";
import axios from "axios";
import NotificationManager from "./NotificationManager";
import ExamManager from "./ExamManager";
import AssignmentManager from "./AssignmentManager";
import ResultsList from "./ResultsList";

const TeacherPanel = () => {
  const [activeTab, setActiveTab] = useState("notifications");

  const [notifications, setNotifications] = useState([]);
  const [formData, setFormData] = useState({ title: "", message: "", type: "general" });
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const [exams, setExams] = useState([]);
  const [examForm, setExamForm] = useState({
    course: "",
    title: "",
    syllabus: "",
    duration: "" // ✅ NEW (timer)
  });

  const [assignments, setAssignments] = useState([]);
  const [assignForm, setAssignForm] = useState({ title: "", dueDate: "" });
  const [selectedFile, setSelectedFile] = useState(null);
  const [marksInput, setMarksInput] = useState({});

  // ✅ NEW MCQ STATE
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

  // ================= NOTIFICATIONS =================
  const fetchNotifications = async () => {
    const res = await axios.get("https://proctorsecure-ai-jkc2.onrender.com/api/notifications/all");
    setNotifications(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isEditing) {
      await axios.put(`https://proctorsecure-ai-jkc2.onrender.com/api/notifications/update/${currentId}`, formData);
      setIsEditing(false);
    } else {
      await axios.post("https://proctorsecure-ai-jkc2.onrender.com/api/notifications/add", formData);
    }
    setFormData({ title: "", message: "", type: "general" });
    fetchNotifications();
  };

  // ================= EXAMS =================
  const fetchExams = async () => {
    const res = await axios.get("https://proctorsecure-ai-jkc2.onrender.com/api/exams/all");
    setExams(res.data);
  };

  const handleExamPost = async (e) => {
    e.preventDefault();
    await axios.post("https://proctorsecure-ai-jkc2.onrender.com/api/exams/add", examForm);
    setExamForm({ course: "", title: "", syllabus: "", duration: "" });
    fetchExams();
    alert("Exam Created ✅");
  };

  // ================= MCQ ADD =================
  const handleQuestionSubmit = async (e) => {
    e.preventDefault();

    await axios.post("https://proctorsecure-ai-jkc2.onrender.com/api/questions/add", {
      examId: questionForm.examId,
      question: questionForm.question,
      options: [
        questionForm.optionA,
        questionForm.optionB,
        questionForm.optionC,
        questionForm.optionD
      ],
      correctAnswer: questionForm.correctAnswer
    });

    alert("MCQ Added ✅");

    setQuestionForm({
      examId: "",
      question: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctAnswer: ""
    });
  };

  // ================= ASSIGNMENTS =================
  const fetchAssignments = async () => {
    const res = await axios.get("https://proctorsecure-ai-jkc2.onrender.com/api/assignments/all");
    setAssignments(res.data);
  };

  const handleAssignPost = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("title", assignForm.title);
    data.append("dueDate", assignForm.dueDate);
    if (selectedFile) data.append("file", selectedFile);

    await axios.post("https://proctorsecure-ai-jkc2.onrender.com/api/assignments/add", data);

    setAssignForm({ title: "", dueDate: "" });
    setSelectedFile(null);
    fetchAssignments();
  };

  // ================= DELETE =================
  const handleDelete = async (type, id) => {
    await axios.delete(`https://proctorsecure-ai-jkc2.onrender.com/api/${type}/delete/${id}`);
    type === "notifications" ? fetchNotifications() :
    type === "exams" ? fetchExams() : fetchAssignments();
  };

  const container = { padding: "40px", backgroundColor: "#f4f7f6" };

  return (
    <div style={container}>

      {/* NAV */}
      <div>
        <button onClick={() => setActiveTab("notifications")}>Announcements</button>
        <button onClick={() => setActiveTab("exams")}>Manage Exams</button>
        <button onClick={() => setActiveTab("assignments")}>Assignments</button>
        <button onClick={() => setActiveTab("studentResult")}>Results</button>
      </div>

      {/* ================= EXAMS TAB ================= */}
      {activeTab === "exams" && (
        <div>

          <h2>Create Exam (With Timer)</h2>
          <form onSubmit={handleExamPost}>
            <input placeholder="Course"
              onChange={e => setExamForm({...examForm, course: e.target.value})} />
            <input placeholder="Title"
              onChange={e => setExamForm({...examForm, title: e.target.value})} />
            <input placeholder="Duration (minutes)" type="number"
              onChange={e => setExamForm({...examForm, duration: e.target.value})} />
            <button>Create Exam</button>
          </form>

          <hr />

          {/* ✅ MCQ ADD FORM */}
          <h2>Add MCQ</h2>

          <form onSubmit={handleQuestionSubmit}>
            <select
              value={questionForm.examId}
              onChange={e => setQuestionForm({...questionForm, examId: e.target.value})}
            >
              <option value="">Select Exam</option>
              {exams.map(ex => (
                <option key={ex._id} value={ex._id}>
                  {ex.title}
                </option>
              ))}
            </select>

            <input placeholder="Question"
              onChange={e => setQuestionForm({...questionForm, question: e.target.value})} />

            <input placeholder="Option A"
              onChange={e => setQuestionForm({...questionForm, optionA: e.target.value})} />
            <input placeholder="Option B"
              onChange={e => setQuestionForm({...questionForm, optionB: e.target.value})} />
            <input placeholder="Option C"
              onChange={e => setQuestionForm({...questionForm, optionC: e.target.value})} />
            <input placeholder="Option D"
              onChange={e => setQuestionForm({...questionForm, optionD: e.target.value})} />

            <input placeholder="Correct Answer"
              onChange={e => setQuestionForm({...questionForm, correctAnswer: e.target.value})} />

            <button>Add MCQ</button>
          </form>

        </div>
      )}

      {activeTab === "notifications" && (
        <NotificationManager {...{formData,setFormData,isEditing,setIsEditing,handleSubmit,notifications,setCurrentId,handleDelete}} />
      )}

      {activeTab === "assignments" && (
        <AssignmentManager {...{assignForm,setAssignForm,setSelectedFile,handleAssignPost,assignments,marksInput,setMarksInput,handleDelete}} />
      )}

      {activeTab === "studentResult" && <ResultsList />}
    </div>
  );
};

export default TeacherPanel;