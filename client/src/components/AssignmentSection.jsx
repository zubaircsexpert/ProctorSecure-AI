import React, { useState, useEffect } from "react";
import { Download, AlertCircle } from "lucide-react";
import API from "../services/api";
import { openFileFromClick } from "../utils/fileViewer";

const FILE_BASE_URL = `${API.defaults.baseURL}/uploads`;

const buildFileUrl = (item, fallbackPath = "") => {
  const target = item?.downloadUrl || item?.fileUrl || fallbackPath || "";
  if (!target) return "";
  
  const cleanPath = String(target).replace(/^\/+/, "");
  
  // If it's already a full URL, return as is
  if (/^https?:\/\//i.test(target)) return target;
  
  // If it's an API endpoint, use baseURL + path
  if (target.startsWith("/api/")) return `${API.defaults.baseURL}${target}`;
  
  // If it's an uploads path (either assignment-files/, assignment-submissions/, etc.)
  // Build proper URL
  if (cleanPath.startsWith("assignment-files/") || 
      cleanPath.startsWith("assignment-submissions/") ||
      cleanPath.startsWith("uploads/")) {
    return `${API.defaults.baseURL}/uploads/${cleanPath}`;
  }
  
  // Default fallback
  return `${API.defaults.baseURL}/uploads/${cleanPath}`;
};

const AssignmentSection = ({ user }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadingId, setUploadingId] = useState(null);

  useEffect(() => {
    // Fetch assignments from backend
    API.get("/api/assignments/all").then((res) => setAssignments(res.data))
      .catch((err) => setError("Failed to load assignments"));
  }, []);

  const handleFileUpload = async (e, id) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("assignmentId", id);
    formData.append("studentName", user.name || user.email);

    setUploadingId(id);
    try {
      await API.post("/api/assignments/upload", formData);
      alert("Assignment Uploaded Successfully!");
      // Refresh the assignments list
      const res = await API.get("/api/assignments/all");
      setAssignments(res.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload assignment");
    } finally {
      setUploadingId(null);
    }
  };

  const handleOpenFile = async (fileUrl) => {
    if (!fileUrl) return;
    try {
      await openFileFromClick(new Event("click"), buildFileUrl(null, fileUrl));
    } catch (err) {
      console.error("File open error:", err);
      setError("Failed to open file");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Your Assignments & Sessional Marks</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="grid gap-4">
        {assignments.length === 0 ? (
          <p className="text-gray-500">No assignments available</p>
        ) : (
          assignments.map((asm) => (
            <div key={asm._id} className="border p-4 rounded-lg shadow bg-white">
              <h3 className="font-semibold text-lg mb-2">{asm.title}</h3>
              <p className="text-gray-600 mb-3">{asm.description}</p>
              
              {/* Teacher's Assignment File */}
              {asm.fileUrl && (
                <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-2">📎 Assignment File:</p>
                  <button
                    onClick={() => handleOpenFile(asm.fileUrl)}
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 underline"
                  >
                    <Download size={16} />
                    {asm.fileUrl}
                  </button>
                </div>
              )}

              {/* Due Date */}
              <p className="text-sm text-gray-600 mb-3">
                <strong>Due Date:</strong> {asm.dueDate || "Not specified"}
              </p>

              {/* Student Submission Section */}
              {asm.status !== "Submitted" && asm.status !== "Checked" ? (
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Submit Your Assignment:
                  </label>
                  <input 
                    type="file" 
                    onChange={(e) => handleFileUpload(e, asm._id)}
                    disabled={uploadingId === asm._id}
                    className="text-sm text-gray-600 cursor-pointer"
                  />
                  {uploadingId === asm._id && <p className="text-sm text-blue-600 mt-1">Uploading...</p>}
                </div>
              ) : (
                <div className="mb-3 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-900">✓ Submitted</p>
                  {asm.submissionUrl && (
                    <button
                      onClick={() => handleOpenFile(asm.submissionUrl)}
                      className="inline-flex items-center gap-2 text-green-600 hover:text-green-800 underline text-sm mt-1"
                    >
                      <Download size={14} />
                      View Your Submission
                    </button>
                  )}
                </div>
              )}

              {/* Marks Display */}
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-sm text-gray-600">
                  <strong>Status:</strong> {asm.status || "Pending"}
                </span>
                <div className="bg-blue-100 px-3 py-2 rounded">
                  <strong className="text-sm">Sessional Marks: </strong> 
                  <span className="text-lg font-bold text-blue-700">{asm.marks === "-" ? "Not Graded" : asm.marks}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AssignmentSection;
