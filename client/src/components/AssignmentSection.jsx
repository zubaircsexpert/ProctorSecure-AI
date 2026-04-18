import React, { useState, useEffect } from "react";
import axios from "axios";

const AssignmentSection = ({ user }) => {
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    // Fetch assignments from backend
    axios.get("/api/assignments/all").then(res => setAssignments(res.data));
  }, []);

  const handleFileUpload = async (e, id) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("assignmentId", id);
    formData.append("studentId", user._id);

    await axios.post("/api/assignments/submit", formData);
    alert("Assignment Uploaded!");
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Your Assignments & Sessional Marks</h2>
      <div className="grid gap-4">
        {assignments.map((asm) => (
          <div key={asm._id} className="border p-4 rounded-lg shadow bg-white">
            <h3 className="font-semibold">{asm.title}</h3>
            <p className="text-gray-600">{asm.description}</p>
            <div className="mt-2 flex justify-between items-center">
              <input type="file" onChange={(e) => handleFileUpload(e, asm._id)} />
              <div className="bg-blue-100 p-2 rounded">
                <strong>Sessional Marks: </strong> {asm.marks || "Not Graded"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssignmentSection;