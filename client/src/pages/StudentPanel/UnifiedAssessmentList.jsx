import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Play, Clock, BookOpen, BarChart3, Lock, AlertCircle } from "lucide-react";
import API from "../../services/api";

/**
 * UnifiedAssessmentList
 * Display all available assessments for students (both quizzes and exams)
 */
function UnifiedAssessmentList() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, upcoming, completed
  const [notice, setNotice] = useState({ type: "", text: "" });

  const loadAssessments = async () => {
    try {
      setLoading(true);
      const response = await API.get("/api/assessments");
      setAssessments(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Load assessments error:", error);
      setNotice({
        type: "error",
        text: "Failed to load assessments. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssessments();
  }, []);

  const getFilteredAssessments = () => {
    const now = new Date();
    
    return assessments.filter((assessment) => {
      if (filter === "upcoming") {
        return assessment.startTime && new Date(assessment.startTime) > now;
      } else if (filter === "completed") {
        return assessment.status === "completed" || assessment.status === "archived";
      }
      return true;
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No deadline";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAssessmentStatus = (assessment) => {
    const now = new Date();
    
    if (assessment.endTime && new Date(assessment.endTime) < now) {
      return { text: "Closed", color: "#6b7280" };
    }
    
    if (assessment.startTime && new Date(assessment.startTime) > now) {
      return { text: "Upcoming", color: "#f59e0b" };
    }
    
    if (assessment.isActive) {
      return { text: "Live", color: "#10b981" };
    }
    
    return { text: "Available", color: "#3b82f6" };
  };

  const filteredAssessments = getFilteredAssessments();

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: "bold", color: "#1e293b", marginBottom: "16px" }}>
          📚 Assessments
        </h2>
        <p style={{ color: "#64748b", marginBottom: "16px" }}>
          Attempt quizzes and exams to test your knowledge. Each assessment has a timer and specific instructions.
        </p>
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
            display: "flex",
            gap: "8px",
            alignItems: "flex-start",
          }}
        >
          <AlertCircle size={18} style={{ marginTop: "2px", flexShrink: 0 }} />
          <span>{notice.text}</span>
        </div>
      )}

      <div style={{ marginBottom: "24px", display: "flex", gap: "12px" }}>
        {["all", "upcoming", "completed"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: filter === f ? "2px solid #2563eb" : "1px solid #e2e8f0",
              background: filter === f ? "#dbeafe" : "#fff",
              color: filter === f ? "#1e40af" : "#64748b",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              textTransform: "capitalize",
            }}
          >
            {f === "all" ? "All" : f === "upcoming" ? "Upcoming" : "Completed"}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
          Loading assessments...
        </div>
      ) : filteredAssessments.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 40px",
            background: "#f8fafc",
            borderRadius: "12px",
            border: "1px dashed #cbd5e1",
          }}
        >
          <BookOpen size={48} style={{ margin: "0 auto 16px", color: "#94a3b8" }} />
          <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#64748b", marginBottom: "8px" }}>
            No assessments found
          </h3>
          <p style={{ color: "#94a3b8" }}>
            {filter === "upcoming"
              ? "No upcoming assessments. Check back later!"
              : filter === "completed"
              ? "You haven't completed any assessments yet."
              : "Your teacher hasn't created any assessments yet."}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {filteredAssessments.map((assessment) => {
            const status = getAssessmentStatus(assessment);
            const isExam = assessment.assessmentType === "exam";
            const canStart =
              (!assessment.endTime || new Date(assessment.endTime) > new Date()) &&
              (!assessment.startTime || new Date(assessment.startTime) <= new Date());

            return (
              <div
                key={assessment._id}
                style={{
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "20px",
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: "20px",
                  alignItems: "center",
                  hover: { boxShadow: "0 4px 12px rgba(0,0,0,0.08)" },
                  transition: "all 0.2s ease",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#1e293b" }}>
                      {assessment.title}
                    </h3>
                    <span
                      style={{
                        fontSize: "12px",
                        padding: "4px 10px",
                        borderRadius: "16px",
                        background: isExam ? "#fee2e2" : "#dbeafe",
                        color: isExam ? "#991b1b" : "#1e40af",
                        fontWeight: "500",
                      }}
                    >
                      {isExam ? "🔒 Proctored Exam" : "📝 Quiz"}
                    </span>
                    {isExam && (
                      <span
                        style={{
                          fontSize: "12px",
                          padding: "4px 10px",
                          borderRadius: "16px",
                          background: "#fef3c7",
                          color: "#92400e",
                          fontWeight: "500",
                        }}
                      >
                        Security Enabled
                      </span>
                    )}
                  </div>

                  <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "12px" }}>
                    {assessment.description || "No description provided"}
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#475569", fontSize: "14px" }}>
                      <Clock size={16} />
                      <span>{assessment.duration} minutes</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#475569", fontSize: "14px" }}>
                      <BarChart3 size={16} />
                      <span>{assessment.totalMarks} marks</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: status.color,
                        }}
                      />
                      <span style={{ color: status.color, fontWeight: "500" }}>{status.text}</span>
                    </div>

                    {assessment.endTime && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#475569", fontSize: "14px" }}>
                        📅 {formatDate(assessment.endTime)}
                      </div>
                    )}
                  </div>

                  {isExam && (
                    <div
                      style={{
                        marginTop: "12px",
                        padding: "10px 12px",
                        background: "#fef3c7",
                        border: "1px solid #fcd34d",
                        borderRadius: "6px",
                        fontSize: "13px",
                        color: "#92400e",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "8px",
                      }}
                    >
                      <Lock size={16} style={{ marginTop: "2px", flexShrink: 0 }} />
                      <span>
                        This exam has security features enabled. You must stay fullscreen, and your screen activity will be monitored.
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px", textAlign: "right" }}>
                  {canStart ? (
                    <Link
                      to={`/assessment/${assessment._id}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        background: "#2563eb",
                        color: "#fff",
                        padding: "10px 20px",
                        borderRadius: "6px",
                        textDecoration: "none",
                        fontSize: "14px",
                        fontWeight: "600",
                        cursor: "pointer",
                        border: "none",
                        transition: "background 0.2s ease",
                        hover: { background: "#1d4ed8" },
                      }}
                    >
                      <Play size={16} />
                      Start Assessment
                    </Link>
                  ) : (
                    <button
                      disabled
                      style={{
                        padding: "10px 20px",
                        borderRadius: "6px",
                        background: "#e2e8f0",
                        color: "#64748b",
                        border: "none",
                        fontSize: "14px",
                        fontWeight: "600",
                        cursor: "not-allowed",
                      }}
                    >
                      Not Available
                    </button>
                  )}

                  <button
                    style={{
                      padding: "8px 16px",
                      borderRadius: "6px",
                      background: "#f1f5f9",
                      color: "#475569",
                      border: "1px solid #e2e8f0",
                      fontSize: "13px",
                      fontWeight: "500",
                      cursor: "pointer",
                    }}
                  >
                    View Results
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default UnifiedAssessmentList;
