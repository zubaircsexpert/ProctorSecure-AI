import React from "react";
import { PlusCircle, Edit, Trash2 } from "lucide-react";

const NotificationManager = ({ 
  formData, setFormData, isEditing, setIsEditing, 
  handleSubmit, notifications, setCurrentId, handleDelete, badgeStyle 
}) => {
  // Styles (Derived from your main code)
  const formBox = { backgroundColor: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" };
  const formTitle = { display: "flex", alignItems: "center", gap: "10px", marginTop: 0, color: "#1a2a6c" };
  const inputStyle = { width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "6px", border: "1px solid #ddd", boxSizing: "border-box" };
  const postBtn = { width: "100%", padding: "12px", background: "#1a2a6c", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" };
  const listRow = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 0", borderBottom: "1px solid #eee" };
  const iconBtn = { padding: "6px", border: "none", background: "#eef2ff", color: "#4e73df", cursor: "pointer", borderRadius: "6px", display: "flex", alignItems: "center" };
  const delBtn = { ...iconBtn, background: "#fef2f2", color: "#ef4444" };

  return (
    <>
      <div style={{ position: "sticky", top: "100px" }}>
        <form onSubmit={handleSubmit} style={formBox}>
          <h3 style={formTitle}>{isEditing ? <Edit size={20}/> : <PlusCircle size={20}/>} {isEditing ? "Edit" : "New"} Notification</h3>
          <input name="title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Title" style={inputStyle} required />
          <textarea name="message" value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} placeholder="Details..." style={{ ...inputStyle, minHeight: "100px" }} required />
          <select name="type" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} style={inputStyle}>
            <option value="general">General</option>
            <option value="test">Exam Alert</option>
            <option value="vacation">Vacation</option>
          </select>
          <button type="submit" style={postBtn}>{isEditing ? "Update Now" : "Publish to Students"}</button>
        </form>
      </div>

      <div style={{ backgroundColor: "#fff", padding: "25px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
        <h3 style={{color: "#1a2a6c"}}>Active Notifications</h3>
        {notifications.map((n) => (
          <div key={n._id} style={listRow}>
            <div style={{flex: 1}}>
              <div style={{fontWeight: "bold"}}>{n.title} <span style={badgeStyle(n.type)}>{n.type}</span></div>
              <div style={{fontSize: "13px", color: "#666"}}>{n.message}</div>
            </div>
            <div style={{display: "flex", gap: "10px"}}>
              <button onClick={() => {setIsEditing(true); setCurrentId(n._id); setFormData(n);}} style={iconBtn}><Edit size={16}/></button>
              <button onClick={() => handleDelete("notifications", n._id)} style={delBtn}><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default NotificationManager;