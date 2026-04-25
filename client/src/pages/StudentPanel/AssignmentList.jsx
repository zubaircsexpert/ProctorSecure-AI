import React, { useEffect, useState } from "react";
import API from "../../services/api";

const FILE_BASE_URL = "https://proctorsecure-ai-jkc2.onrender.com/uploads";

const AssignmentList = () => {
  const [assignments, setAssignments] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState({});

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const res = await API.get("/api/assignments/all");
      setAssignments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Data fetch nahi ho raha", err);
    }
  };

  const getStudentName = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user.name || "Student";
    } catch {
      return "Student";
    }
  };

  const handleUpload = async (assignmentId) => {
    const file = selectedFiles[assignmentId];

    if (!file) {
      alert("Please select a file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("assignmentId", assignmentId);
    formData.append("studentName", getStudentName());

    try {
      await API.post("/api/assignments/upload", formData);
      alert("Assignment Submitted");
      setSelectedFiles((prev) => ({
        ...prev,
        [assignmentId]: null,
      }));
      fetchAssignments();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Upload Failed");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Available Assignments</h2>

      {assignments.length > 0 ? (
        assignments.map((asm) => (
          <div
            key={asm._id}
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              margin: "10px 0",
              borderRadius: "8px",
              backgroundColor: "#fff",
            }}
          >
            <h3>{asm.title}</h3>
            <p>Due Date: {new Date(asm.dueDate).toLocaleDateString()}</p>
            <p>
              Status: <b>{asm.status || "Pending"}</b>
            </p>
            <p>
              Marks: <b>{asm.marks}</b>
            </p>

            {asm.fileUrl && (
              <div style={{ marginTop: "10px" }}>
                <a
                  href={`${FILE_BASE_URL}/${asm.fileUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Assignment PDF
                </a>
              </div>
            )}

            <div style={{ marginTop: "10px" }}>
              <input
                type="file"
                onChange={(e) =>
                  setSelectedFiles((prev) => ({
                    ...prev,
                    [asm._id]: e.target.files?.[0] || null,
                  }))
                }
              />

              <button
                onClick={() => handleUpload(asm._id)}
                style={{
                  marginLeft: "10px",
                  padding: "5px 10px",
                  backgroundColor: "#28a745",
                  color: "#fff",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Upload Assignment
              </button>
            </div>

            {asm.submissionUrl && (
              <div style={{ marginTop: "10px" }}>
                <a
                  href={`${FILE_BASE_URL}/${asm.submissionUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "green" }}
                >
                  View Submitted File
                </a>
              </div>
            )}
          </div>
        ))
      ) : (
        <p>Loading....</p>
      )}
    </div>
  );
};

export default AssignmentList;
