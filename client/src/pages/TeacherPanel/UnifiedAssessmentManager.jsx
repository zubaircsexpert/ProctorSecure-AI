import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Eye, EyeOff, Calendar, Users, FileText } from "lucide-react";
import API from "../../services/api";

/**
 * UnifiedAssessmentManager
 * Single component for teachers to manage both quizzes and exams
 */
function UnifiedAssessmentManager() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [notice, setNotice] = useState({ type: "", text: "" });
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    category: "",
    assessmentType: "exam", // "quiz" | "exam"
    difficulty: "medium",
    duration: 30,
    totalMarks: 100,
    passingMarks: 50,
    description: "",
    startTime: "",
    endTime: "",
    // Exam-specific
    securitySettings: {
      forceFullscreen: true,
      detectTabSwitch: true,
      detectScreenShare: true,
      detectCopyPaste: true,
      detectInspectElement: true,
      requireWebcam: true,
      requireMicrophone: false,
      allowedViolations: 3,
    },
    // Quiz-specific
    randomize: true,
    showResults: true,
  });

  const loadAssessments = async () => {
    try {
      setLoading(true);
      const response = await API.get("/api/assessments");
      setAssessments(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Load assessments error:", error);
      setNotice({
        type: "error",
        text: "Failed to load assessments.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssessments();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSecuritySettingChange = (setting, value) => {
    setFormData((prev) => ({
      ...prev,
      securitySettings: {
        ...prev.securitySettings,
        [setting]: value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.subject || !formData.duration) {
      setNotice({
        type: "error",
        text: "Please fill all required fields.",
      });
      return;
    }

    try {
      setLoading(true);

      if (editingId) {
        await API.put(`/api/assessments/${editingId}`, formData);
        setNotice({
          type: "success",
          text: "Assessment updated successfully!",
        });
      } else {
        await API.post("/api/assessments/create", formData);
        setNotice({
          type: "success",
          text: `${formData.assessmentType === "exam" ? "Exam" : "Quiz"} created successfully!`,
        });
      }

      setFormData({
        title: "",
        subject: "",
        category: "",
        assessmentType: "exam",
        difficulty: "medium",
        duration: 30,
        totalMarks: 100,
        passingMarks: 50,
        description: "",
        startTime: "",
        endTime: "",
        securitySettings: {
          forceFullscreen: true,
          detectTabSwitch: true,
          detectScreenShare: true,
          detectCopyPaste: true,
          detectInspectElement: true,
          requireWebcam: true,
          requireMicrophone: false,
          allowedViolations: 3,
        },
        randomize: true,
        showResults: true,
      });
      setEditingId(null);
      setShowForm(false);
      await loadAssessments();
    } catch (error) {
      console.error("Save assessment error:", error);
      setNotice({
        type: "error",
        text: error.response?.data?.message || "Failed to save assessment.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (assessment) => {
    setFormData({
      title: assessment.title,
      subject: assessment.subject,
      category: assessment.category,
      assessmentType: assessment.assessmentType,
      difficulty: assessment.difficulty,
      duration: assessment.duration,
      totalMarks: assessment.totalMarks,
      passingMarks: assessment.passingMarks,
      description: assessment.description || "",
      startTime: assessment.startTime?.slice(0, 16) || "",
      endTime: assessment.endTime?.slice(0, 16) || "",
      securitySettings: assessment.securitySettings || formData.securitySettings,
      randomize: assessment.randomize !== false,
      showResults: assessment.showResults !== false,
    });
    setEditingId(assessment._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this assessment?")) return;

    try {
      await API.delete(`/api/assessments/${id}`);
      setNotice({
        type: "success",
        text: "Assessment deleted successfully!",
      });
      await loadAssessments();
    } catch (error) {
      console.error("Delete assessment error:", error);
      setNotice({
        type: "error",
        text: "Failed to delete assessment.",
      });
    }
  };

  const handleToggleVisibility = async (assessment) => {
    try {
      await API.put(`/api/assessments/${assessment._id}`, {
        isVisible: !assessment.isVisible,
      });
      await loadAssessments();
    } catch (error) {
      console.error("Toggle visibility error:", error);
      setNotice({
        type: "error",
        text: "Failed to update visibility.",
      });
    }
  };

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "#1e293b" }}>
          Assessment Manager
        </h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({
              title: "",
              subject: "",
              category: "",
              assessmentType: "exam",
              difficulty: "medium",
              duration: 30,
              totalMarks: 100,
              passingMarks: 50,
              description: "",
              startTime: "",
              endTime: "",
              securitySettings: {
                forceFullscreen: true,
                detectTabSwitch: true,
                detectScreenShare: true,
                detectCopyPaste: true,
                detectInspectElement: true,
                requireWebcam: true,
                requireMicrophone: false,
                allowedViolations: 3,
              },
              randomize: true,
              showResults: true,
            });
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            padding: "10px 16px",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "600",
          }}
        >
          <Plus size={20} /> Create Assessment
        </button>
      </div>

      {notice.text && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "16px",
            backgroundColor: notice.type === "error" ? "#fee2e2" : "#dcfce7",
            color: notice.type === "error" ? "#991b1b" : "#15803d",
            border: `1px solid ${notice.type === "error" ? "#fecaca" : "#86efac"}`,
          }}
        >
          {notice.text}
        </div>
      )}

      {showForm && (
        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "24px",
          }}
        >
          <h3 style={{ marginBottom: "16px", fontSize: "18px", fontWeight: "600" }}>
            {editingId ? "Edit Assessment" : "Create New Assessment"}
          </h3>

          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500" }}>
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500" }}>
                  Assessment Type *
                </label>
                <select
                  name="assessmentType"
                  value={formData.assessmentType}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                >
                  <option value="exam">Exam (Proctored)</option>
                  <option value="quiz">Quiz (Unproctored)</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500" }}>
                  Subject *
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500" }}>
                  Difficulty
                </label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500" }}>
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  min="5"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500" }}>
                  Total Marks *
                </label>
                <input
                  type="number"
                  name="totalMarks"
                  value={formData.totalMarks}
                  onChange={handleInputChange}
                  min="1"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500" }}>
                  Passing Marks *
                </label>
                <input
                  type="number"
                  name="passingMarks"
                  value={formData.passingMarks}
                  onChange={handleInputChange}
                  min="1"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500" }}>
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500" }}>
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  fontSize: "14px",
                  minHeight: "80px",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500" }}>
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500" }}>
                  End Time
                </label>
                <input
                  type="datetime-local"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                />
              </div>
            </div>

            {formData.assessmentType === "exam" && (
              <div style={{ background: "#fff", padding: "16px", borderRadius: "8px", marginBottom: "16px", border: "1px solid #e2e8f0" }}>
                <h4 style={{ marginBottom: "12px", fontSize: "14px", fontWeight: "600" }}>Security Settings</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  {[
                    { key: "forceFullscreen", label: "Force Fullscreen" },
                    { key: "detectTabSwitch", label: "Detect Tab Switch" },
                    { key: "detectScreenShare", label: "Detect Screen Share" },
                    { key: "detectCopyPaste", label: "Detect Copy/Paste" },
                    { key: "detectInspectElement", label: "Detect Inspect Element" },
                    { key: "requireWebcam", label: "Require Webcam" },
                    { key: "requireMicrophone", label: "Require Microphone" },
                  ].map((setting) => (
                    <label key={setting.key} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px" }}>
                      <input
                        type="checkbox"
                        checked={formData.securitySettings[setting.key]}
                        onChange={(e) =>
                          handleSecuritySettingChange(setting.key, e.target.checked)
                        }
                        style={{ cursor: "pointer" }}
                      />
                      {setting.label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "6px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {editingId ? "Update Assessment" : "Create Assessment"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                style={{
                  background: "#e2e8f0",
                  color: "#475569",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && !showForm ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
          Loading assessments...
        </div>
      ) : assessments.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            background: "#f8fafc",
            borderRadius: "12px",
            color: "#64748b",
            border: "1px dashed #cbd5e1",
          }}
        >
          <FileText size={32} style={{ marginBottom: "12px", color: "#94a3b8" }} />
          <p>No assessments yet. Create one to get started!</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {assessments.map((assessment) => (
            <div
              key={assessment._id}
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b" }}>
                    {assessment.title}
                  </h3>
                  <span
                    style={{
                      fontSize: "12px",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      background: assessment.assessmentType === "exam" ? "#dbeafe" : "#fef3c7",
                      color: assessment.assessmentType === "exam" ? "#1e40af" : "#92400e",
                    }}
                  >
                    {assessment.assessmentType === "exam" ? "Exam" : "Quiz"}
                  </span>
                </div>
                <div style={{ fontSize: "13px", color: "#64748b", display: "flex", gap: "16px" }}>
                  <span>{assessment.subject}</span>
                  <span>
                    <Calendar size={14} style={{ display: "inline", marginRight: "4px" }} />
                    {assessment.duration} min
                  </span>
                  <span>
                    <Users size={14} style={{ display: "inline", marginRight: "4px" }} />
                    {assessment.questionCount || 0} Questions
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => handleToggleVisibility(assessment)}
                  title={assessment.isVisible ? "Hide" : "Show"}
                  style={{
                    background: "none",
                    border: "1px solid #e2e8f0",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    color: "#64748b",
                  }}
                >
                  {assessment.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>

                <button
                  onClick={() => handleEdit(assessment)}
                  style={{
                    background: "none",
                    border: "1px solid #e2e8f0",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    color: "#64748b",
                  }}
                >
                  <Edit2 size={16} />
                </button>

                <button
                  onClick={() => handleDelete(assessment._id)}
                  style={{
                    background: "#fee2e2",
                    border: "1px solid #fecaca",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    color: "#991b1b",
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UnifiedAssessmentManager;
