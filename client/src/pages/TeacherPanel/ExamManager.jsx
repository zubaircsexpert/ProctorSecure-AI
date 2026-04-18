import React from "react";
import { BookOpen, Trash2 } from "lucide-react";

const ExamManager = ({ examForm, setExamForm, handleExamPost, exams, handleDelete }) => {
  const formBox = { backgroundColor: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" };
  const formTitle = { display: "flex", alignItems: "center", gap: "10px", marginTop: 0, color: "#1a2a6c" };
  const inputStyle = { width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "6px", border: "1px solid #ddd", boxSizing: "border-box" };
  const postBtn = { width: "100%", padding: "12px", background: "#1a2a6c", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" };
  const listRow = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 0", borderBottom: "1px solid #eee" };
  const delBtn = { padding: "6px", border: "none", background: "#fef2f2", color: "#ef4444", cursor: "pointer", borderRadius: "6px", display: "flex", alignItems: "center" };

  return (
    <>
      <div style={{ position: "sticky", top: "100px" }}>
        <form onSubmit={handleExamPost} style={formBox}>
          <h3 style={formTitle}><BookOpen size={20}/> Add Exam Course</h3>
          <input value={examForm.course} onChange={(e) => setExamForm({...examForm, course: e.target.value})} placeholder="Course (e.g. CS501)" style={inputStyle} required />
          <input value={examForm.title} onChange={(e) => setExamForm({...examForm, title: e.target.value})} placeholder="Exam Title" style={inputStyle} required />
          <textarea value={examForm.syllabus} onChange={(e) => setExamForm({...examForm, syllabus: e.target.value})} placeholder="Syllabus Details" style={inputStyle} required />
          <button type="submit" style={postBtn}>Post Exam Schedule</button>
        </form>
      </div>

      <div style={{ backgroundColor: "#fff", padding: "25px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
        <h3 style={{color: "#1a2a6c"}}>Exam Database</h3>
        {exams.map(ex => (
          <div key={ex._id} style={listRow}>
            <span><b>{ex.course}</b>: {ex.title} <br/> <small>{ex.syllabus}</small></span>
            <button onClick={() => handleDelete("exams", ex._id)} style={delBtn}><Trash2 size={16}/></button>
          </div>
        ))}
      </div>
    </>
  );
};

export default ExamManager;