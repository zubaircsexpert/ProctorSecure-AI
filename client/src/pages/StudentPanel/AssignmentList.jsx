import React, { useState, useEffect } from "react";
import axios from "axios";

const AssignmentList = () => {
  const [assignments, setAssignments] = useState([]);
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/assignments/all");
      setAssignments(res.data);
    } catch (err) {
      console.error("Data fetch nahi ho raha", err);
    }
  };

  // ✅ Upload Function
  const handleUpload = async (assignmentId) => {
    if (!file) {
      alert("Please select a file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("assignmentId", assignmentId);
    formData.append("studentName", "Student"); // baad me login se dynamic kar lena

    try {
      await axios.post("http://localhost:5000/api/assignments/upload", formData);
      alert("Assignment Submitted ✅");
      fetchAssignments(); // refresh data
    } catch (err) {
      console.error(err);
      alert("Upload Failed ❌");
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
            <p>Status: <b>{asm.status || "Pending"}</b></p>
            <p>Marks: <b>{asm.marks}</b></p>

            {/* Teacher PDF */}
            {asm.fileUrl && (
              <div style={{ marginTop: "10px" }}>
                <a
                  href={`http://localhost:5000/uploads/${asm.fileUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  📄 View Assignment PDF
                </a>
              </div>
            )}

            {/* ✅ Student Upload */}
            <div style={{ marginTop: "10px" }}>
              <input type="file" onChange={(e) => setFile(e.target.files[0])} />

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

            {/* ✅ Student Submitted File */}
            {asm.submissionUrl && (
              <div style={{ marginTop: "10px" }}>
                <a
                  href={`http://localhost:5000/uploads/${asm.submissionUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "green" }}
                >
                  ✅ View Submitted File
                </a>
              </div>
            )}
          </div>
        ))
      ) : (
        <p>Filhaal koi assignment nahi hai.</p>
      )}
    </div>
  );
};

export default AssignmentList;