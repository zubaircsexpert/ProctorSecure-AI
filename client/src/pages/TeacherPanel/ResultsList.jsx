import React, { useEffect, useState } from "react";
import { User, AlertTriangle, Calendar, FileText, Trash2 } from "lucide-react";
import API from "../../services/api";

const ResultsList = () => {
  const [allResults, setAllResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteError, setDeleteError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await API.get("/api/results");
        setAllResults(Array.isArray(res.data) ? res.data : []);
        setDeleteError("");
      } catch (err) {
        console.error("Results fetch failed:", err);
        setDeleteError("Failed to load results.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
    const interval = setInterval(fetchResults, 10000);

    return () => clearInterval(interval);
  }, []);

  const styles = {
    card: {
      backgroundColor: "#fff",
      padding: "25px",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      marginTop: "15px",
    },
    th: {
      textAlign: "left",
      padding: "12px",
      borderBottom: "2px solid #eee",
      color: "#666",
      fontSize: "14px",
    },
    td: {
      padding: "15px 12px",
      borderBottom: "1px solid #f0f0f0",
      fontSize: "14px",
      verticalAlign: "top",
    },
    badge: (pass) => ({
      padding: "4px 10px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "bold",
      background: pass ? "#ecfdf5" : "#fef2f2",
      color: pass ? "#10b981" : "#ef4444",
    }),
    subText: {
      display: "block",
      fontSize: "12px",
      color: "#888",
      marginTop: "4px",
    },
    actionBtn: (disabled) => ({
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      padding: "9px 12px",
      borderRadius: "10px",
      border: "none",
      background: disabled ? "#fca5a5" : "#ef4444",
      color: "#fff",
      cursor: disabled ? "not-allowed" : "pointer",
      fontWeight: 700,
      fontSize: "12px",
      opacity: disabled ? 0.75 : 1,
    }),
    errorBox: {
      marginTop: "16px",
      padding: "12px 14px",
      borderRadius: "10px",
      backgroundColor: "#fef2f2",
      color: "#b91c1c",
      fontSize: "13px",
    },
  };

  const handleDelete = async (resultId) => {
    const ok = window.confirm("Are you sure you want to delete this student result?");
    if (!ok) return;

    try {
      setDeletingId(resultId);
      setDeleteError("");
      await API.delete(`/api/results/delete/${resultId}`);
      setAllResults((prev) => prev.filter((result) => result._id !== resultId));
    } catch (err) {
      console.error("Result delete failed:", err);
      setDeleteError(err.response?.data?.message || "Failed to delete result.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div style={styles.card}>
        <h3 style={{ color: "#1a2a6c", display: "flex", alignItems: "center", gap: "10px" }}>
          <FileText size={22} /> Comprehensive Student Results
        </h3>
        <p>Loading results...</p>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <h3 style={{ color: "#1a2a6c", display: "flex", alignItems: "center", gap: "10px" }}>
        <FileText size={22} /> Comprehensive Student Results
      </h3>

      {deleteError && <div style={styles.errorBox}>{deleteError}</div>}

      {allResults.length === 0 ? (
        <p style={{ marginTop: "20px", color: "#666" }}>No student results found yet.</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Student</th>
              <th style={styles.th}>Exam/Test</th>
              <th style={styles.th}>Score</th>
              <th style={styles.th}>Warnings</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Submission Date</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {allResults.map((r) => (
              <tr key={r._id}>
                <td style={styles.td}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <User size={14} />
                    <span>{r.studentName || "Unknown Student"}</span>
                  </div>
                </td>

                <td style={styles.td}>
                  {r.testName || "Exam"}
                  {r.examId && (
                    <span style={styles.subText}>Exam ID: {r.examId}</span>
                  )}
                </td>

                <td style={styles.td}>
                  <b>{r.score || 0}</b>/{r.total || 0}
                  <span style={styles.subText}>({r.percentage || 0}%)</span>
                </td>

                <td
                  style={{
                    ...styles.td,
                    color: (r.warnings || 0) > 5 ? "#ef4444" : "#f59e0b",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <AlertTriangle size={14} />
                    <span>{r.warnings || 0} Violations</span>
                  </div>
                  <span style={styles.subText}>
                    Eye: {r.eyeWarnings || 0}, Head: {r.headWarnings || 0}, Tab: {r.tabWarnings || 0}
                  </span>
                </td>

                <td style={styles.td}>
                  <span style={styles.badge((r.percentage || 0) >= 50)}>
                    {r.status || ((r.percentage || 0) >= 50 ? "PASSED" : "FAILED")}
                  </span>
                </td>

                <td style={{ ...styles.td, color: "#888" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Calendar size={12} />
                    <span>
                      {r.createdAt
                        ? new Date(r.createdAt).toLocaleString()
                        : "N/A"}
                    </span>
                  </div>
                </td>

                <td style={styles.td}>
                  <button
                    type="button"
                    style={styles.actionBtn(deletingId === r._id)}
                    onClick={() => handleDelete(r._id)}
                    disabled={deletingId === r._id}
                  >
                    <Trash2 size={14} />
                    {deletingId === r._id ? "Deleting..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ResultsList;
