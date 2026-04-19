import React from "react";
import { FileUp, Paperclip, ExternalLink, CheckCircle, Trash2 } from "lucide-react";

const AssignmentManager = ({ 
  assignForm, setAssignForm, setSelectedFile, handleAssignPost, 
  assignments, marksInput, setMarksInput, handleGiveMarks, handleDelete 
}) => {
  const formBox = { backgroundColor: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" };
  const formTitle = { display: "flex", alignItems: "center", gap: "10px", marginTop: 0, color: "#1a2a6c" };
  const inputStyle = { width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "6px", border: "1px solid #ddd", boxSizing: "border-box" };
  const postBtn = { width: "100%", padding: "12px", background: "#1a2a6c", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" };
  const listRow = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 0", borderBottom: "1px solid #eee" };
  const iconBtn = { padding: "6px", border: "none", background: "#eef2ff", color: "#4e73df", cursor: "pointer", borderRadius: "6px", display: "flex", alignItems: "center" };
  const okBtn = { ...iconBtn, background: "#ecfdf5", color: "#10b981" };
  const delBtn = { ...iconBtn, background: "#fef2f2", color: "#ef4444" };

  return (
    <>
      <div style={{ position: "sticky", top: "100px" }}>
        <form onSubmit={handleAssignPost} style={formBox}>
          <h3 style={formTitle}><FileUp size={20}/> Give Assignment</h3>
          <input value={assignForm.title} onChange={(e) => setAssignForm({...assignForm, title: e.target.value})} placeholder="Assignment Title" style={inputStyle} required />
          <input type="date" value={assignForm.dueDate} onChange={(e) => setAssignForm({...assignForm, dueDate: e.target.value})} style={inputStyle} required />
          <div style={{ marginBottom: "10px" }}>
            <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "5px" }}>Attach PDF or Image (Optional)</label>
            <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} style={{...inputStyle, padding: "5px"}} accept=".pdf,image/*" />
          </div>
          <button type="submit" style={postBtn}>Assign to Class</button>
        </form>
      </div>

      <div style={{ backgroundColor: "#fff", padding: "25px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
        <h3 style={{color: "#1a2a6c"}}>Assignments Status</h3>
        {assignments.map(as => (
          <div key={as._id} style={listRow}>
            <div style={{flex: 1}}>
              <b>{as.title}</b> <br/> 
              {as.submissionUrl && (
                <div>
                  <a href={`https://proctorsecure-ai-jkc2.onrender.com/api/uploads/${as.submissionUrl}`} target="_blank" rel="noreferrer">View Student File</a>
                </div>
              )}
              <p>Marks: {as.marks}</p>
              {as.status === "Submitted" && (
                <>
                  <input type="text" placeholder="Enter Marks" value={marksInput[as._id] || ""} onChange={(e) => setMarksInput({ ...marksInput, [as._id]: e.target.value })} />
                  <button onClick={() => handleGiveMarks(as._id)}>Save</button>
                </>
              )}
              <small>Status: <span style={{color: as.status === "Submitted" ? "green" : "red"}}>{as.status}</span></small>
              {as.fileUrl && <div style={{fontSize: "11px", color: "#3b82f6"}}><Paperclip size={12} style={{display: "inline"}}/> File Attached</div>}
            </div>
            <div style={{display: "flex", gap: "10px"}}>
              {as.fileUrl && <a href={`https://proctorsecure-ai-jkc2.onrender.com/api/uploads/${as.fileUrl}`} target="_blank" rel="noreferrer" style={iconBtn}><ExternalLink size={16}/></a>}
              <button style={okBtn}><CheckCircle size={16}/></button>
              <button onClick={() => handleDelete("assignments", as._id)} style={delBtn}><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default AssignmentManager;