import React, { useEffect, useState } from "react";
import { User, AlertTriangle, Calendar, FileText } from "lucide-react";
import API from "../../services/api";

const ResultsList = () => {
  const [allResults, setAllResults] = useState([]);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await API.get("/api/results");
        setAllResults(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Results fetch failed:", err);
      }
    };

    fetchResults();
  }, []);

  const styles = {
    card: { backgroundColor: "#fff", padding: "25px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" },
    table: { width: "100%", borderCollapse: "collapse", marginTop: "15px" },
    th: { textAlign: "left", padding: "12px", borderBottom: "2px solid #eee", color: "#666", fontSize: "14px" },
    td: { padding: "15px 12px", borderBottom: "1px solid #f0f0f0", fontSize: "14px" },
    badge: (pass) => ({
      padding: "4px 10px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "bold",
      background: pass ? "#ecfdf5" : "#fef2f2",
      color: pass ? "#10b981" : "#ef4444"
    })
  };

  return (
    <div style={styles.card}>
      <h3 style={{ color: "#1a2a6c", display: "flex", alignItems: "center", gap: "10px" }}>
        <FileText size={22} /> Comprehensive Student Results
      </h3>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Student</th>
            <th style={styles.th}>Exam/Test</th>
            <th style={styles.th}>Score</th>
            <th style={styles.th}>Proctor Warnings</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Submission Date</th>
          </tr>
        </thead>

        <tbody>
          {allResults.map((r) => (
            <tr key={r._id}>
              <td style={styles.td}><User size={14} style={{ marginRight: "5px" }} /> {r.studentName}</td>
              <td style={styles.td}>{r.testName}</td>
              <td style={styles.td}><b>{r.score}</b>/{r.total} <small>({r.percentage}%)</small></td>
              <td style={{ ...styles.td, color: r.warnings > 5 ? "#ef4444" : "#f59e0b" }}>
                <AlertTriangle size={14} /> {r.warnings || 0} Violations
              </td>
              <td style={styles.td}>
                <span style={styles.badge((r.percentage || 0) >= 50)}>
                  {(r.percentage || 0) >= 50 ? "PASSED" : "FAILED"}
                </span>
              </td>
              <td style={{ ...styles.td, color: "#888" }}>
                <Calendar size={12} /> {new Date(r.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResultsList;
