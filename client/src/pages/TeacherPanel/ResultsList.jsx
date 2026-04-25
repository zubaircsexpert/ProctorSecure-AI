import React, { useEffect, useState } from "react";
import { User, AlertTriangle, Calendar, FileText } from "lucide-react";
import API from "../../services/api";

const ResultsList = () => {
  const [allResults, setAllResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await API.get("/api/results");
        setAllResults(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Results fetch failed:", err);
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
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ResultsList;
