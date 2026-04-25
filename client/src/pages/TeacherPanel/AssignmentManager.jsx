import React from "react";
import { FileUp, Paperclip, ExternalLink, CheckCircle, Trash2 } from "lucide-react";

const FILE_BASE_URL = "https://proctorsecure-ai-jkc2.onrender.com/uploads";

const AssignmentManager = ({
  assignForm,
  setAssignForm,
  setSelectedFile,
  handleAssignPost,
  assignments,
  marksInput,
  setMarksInput,
  handleGiveMarks,
  handleDelete,
}) => {
  const layout = {
    display: "flex",
    flexWrap: "wrap",
    gap: "24px",
    alignItems: "flex-start",
  };
  const formColumn = {
    flex: "0 0 360px",
    minWidth: "320px",
  };
  const listColumn = {
    flex: "1 1 620px",
    minWidth: "320px",
  };
  const formBox = {
    backgroundColor: "#fff",
    padding: "24px",
    borderRadius: "20px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 14px 30px rgba(15,23,42,0.06)",
  };
  const formTitle = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: 0,
    marginBottom: "8px",
    color: "#1a2a6c",
  };
  const formSubtitle = {
    margin: "0 0 18px 0",
    color: "#64748b",
    fontSize: "14px",
    lineHeight: 1.6,
  };
  const inputStyle = {
    width: "100%",
    padding: "14px 16px",
    marginBottom: "12px",
    borderRadius: "14px",
    border: "1px solid #d6deeb",
    backgroundColor: "#f8fafc",
    boxSizing: "border-box",
  };
  const postBtn = {
    width: "100%",
    padding: "14px 18px",
    background: "#1a2a6c",
    color: "#fff",
    border: "none",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "15px",
    boxShadow: "0 10px 20px rgba(29,78,216,0.16)",
  };
  const filePicker = {
    padding: "14px 16px",
    borderRadius: "14px",
    border: "1px dashed #cbd5e1",
    backgroundColor: "#f8fafc",
    marginBottom: "16px",
  };
  const listBox = {
    backgroundColor: "#fff",
    padding: "24px",
    borderRadius: "20px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 14px 30px rgba(15,23,42,0.06)",
  };
  const cardGrid = {
    display: "grid",
    gap: "16px",
  };
  const assignmentCard = {
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "18px",
    background: "#fcfdff",
    boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
  };
  const cardTop = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "14px",
    marginBottom: "10px",
    flexWrap: "wrap",
  };
  const cardTitle = {
    margin: 0,
    fontSize: "22px",
    color: "#102a43",
  };
  const infoText = {
    margin: "6px 0 0 0",
    color: "#64748b",
    fontSize: "14px",
  };
  const iconBtn = {
    padding: "10px",
    border: "none",
    background: "#eef2ff",
    color: "#4e73df",
    cursor: "pointer",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
  const okBtn = {
    ...iconBtn,
    background: "#ecfdf5",
    color: "#10b981",
    gap: "8px",
    padding: "10px 14px",
    fontWeight: 700,
    cursor: "default",
  };
  const delBtn = { ...iconBtn, background: "#fef2f2", color: "#ef4444" };
  const linkWrap = {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "12px",
  };
  const fileLink = {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 14px",
    borderRadius: "999px",
    textDecoration: "none",
    background: "#eef2ff",
    color: "#1d4ed8",
    fontWeight: 700,
    fontSize: "13px",
  };
  const metaRow = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "10px",
    marginTop: "14px",
  };
  const metaItem = {
    padding: "12px 14px",
    backgroundColor: "#f8fafc",
    borderRadius: "14px",
    border: "1px solid #e2e8f0",
    fontSize: "13px",
    color: "#475569",
  };
  const statusBadge = (status) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 700,
    background:
      status === "Checked"
        ? "#dcfce7"
        : status === "Submitted"
        ? "#dbeafe"
        : "#fef3c7",
    color:
      status === "Checked"
        ? "#166534"
        : status === "Submitted"
        ? "#1d4ed8"
        : "#b45309",
  });
  const marksRow = {
    display: "flex",
    gap: "10px",
    marginTop: "14px",
    flexWrap: "wrap",
  };
  const saveBtn = {
    padding: "10px 16px",
    borderRadius: "12px",
    border: "none",
    background: "#1d4ed8",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  };
  const emptyState = {
    padding: "28px",
    borderRadius: "16px",
    backgroundColor: "#f8fafc",
    border: "1px dashed #cbd5e1",
    color: "#64748b",
    textAlign: "center",
  };

  return (
    <div style={layout}>
      <div style={formColumn}>
        <div style={{ position: "sticky", top: "100px" }}>
        <form onSubmit={handleAssignPost} style={formBox}>
          <h3 style={formTitle}>
            <FileUp size={20} /> Give Assignment
          </h3>
          <p style={formSubtitle}>
            Create a new assignment on the left, and monitor submissions and
            marks on the right.
          </p>
          <input
            value={assignForm.title}
            onChange={(e) =>
              setAssignForm({ ...assignForm, title: e.target.value })
            }
            placeholder="Assignment Title"
            style={inputStyle}
            required
          />
          <input
            type="date"
            value={assignForm.dueDate}
            onChange={(e) =>
              setAssignForm({ ...assignForm, dueDate: e.target.value })
            }
            style={inputStyle}
            required
          />
          <div style={{ marginBottom: "10px" }}>
            <label
              style={{
                fontSize: "12px",
                color: "#666",
                display: "block",
                marginBottom: "5px",
              }}
            >
              Attach PDF or Image (Optional)
            </label>
            <div style={filePicker}>
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                style={{ width: "100%" }}
                accept=".pdf,image/*"
              />
            </div>
          </div>
          <button type="submit" style={postBtn}>
            Assign to Class
          </button>
        </form>
      </div>
      </div>

      <div style={listColumn}>
      <div style={listBox}>
        <h3 style={{ color: "#1a2a6c" }}>Assignments Status</h3>
        <p style={{ ...formSubtitle, marginTop: 0 }}>
          View teacher files, student submissions, current status, and marks in
          one place.
        </p>

        {!assignments.length ? (
          <div style={emptyState}>No assignments found yet.</div>
        ) : (
          <div style={cardGrid}>
        {assignments.map((assignment) => (
          <div key={assignment._id} style={assignmentCard}>
            <div style={cardTop}>
              <div>
                <h4 style={cardTitle}>{assignment.title}</h4>
                {assignment.studentName && (
                  <p style={infoText}>Student: {assignment.studentName}</p>
                )}
              </div>
              <div style={statusBadge(assignment.status)}>
                <CheckCircle size={16} />
                {assignment.status}
              </div>
            </div>

            <div style={metaRow}>
              <div style={metaItem}>
                <strong>Marks:</strong> {assignment.marks}
              </div>
              <div style={metaItem}>
                <strong>Teacher File:</strong> {assignment.fileUrl ? "Attached" : "None"}
              </div>
              <div style={metaItem}>
                <strong>Student File:</strong> {assignment.submissionUrl ? "Submitted" : "Pending"}
              </div>
            </div>

            <div style={linkWrap}>
              {assignment.fileUrl && (
                <a
                  href={`${FILE_BASE_URL}/${assignment.fileUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  style={fileLink}
                >
                  <Paperclip size={14} />
                  View Assignment File
                </a>
              )}
              {assignment.submissionUrl && (
                <a
                  href={`${FILE_BASE_URL}/${assignment.submissionUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ ...fileLink, background: "#ecfdf5", color: "#15803d" }}
                >
                  <ExternalLink size={14} />
                  View Student File
                </a>
              )}
            </div>

              {assignment.submissionUrl && (
                <div style={marksRow}>
                  <input
                    type="text"
                    placeholder="Enter Marks"
                    value={marksInput[assignment._id] || ""}
                    onChange={(e) =>
                      setMarksInput({
                        ...marksInput,
                        [assignment._id]: e.target.value,
                      })
                    }
                    style={{ ...inputStyle, flex: "1 1 180px", marginBottom: 0 }}
                  />
                  <button
                    type="button"
                    onClick={() => handleGiveMarks(assignment._id)}
                    style={saveBtn}
                  >
                    Save
                  </button>
                </div>
              )}

            <div style={{ display: "flex", gap: "10px", marginTop: "16px", justifyContent: "flex-end", flexWrap: "wrap" }}>
              <div style={okBtn}>
                <CheckCircle size={16} />
                {assignment.status === "Checked" ? "Reviewed" : "Active"}
              </div>
              <button
                type="button"
                onClick={() => handleDelete("assignments", assignment._id)}
                style={delBtn}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default AssignmentManager;
