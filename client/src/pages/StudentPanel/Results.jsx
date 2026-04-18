import { useEffect, useState } from "react";
import API from "../../services/api";

const Results = () => {
  const [result, setResult] = useState(null);

  useEffect(() => {
    const getFinalResult = async () => {
      try {
        // 1. Sabse pehle LocalStorage check karein (Instant Result)
        const localData = localStorage.getItem("examResult");
        if (localData) {
          setResult(JSON.parse(localData));
        } else {
          // 2. Agar local nahi hai to API se fetch karein
          const res = await API.get("/my-results");
          if (res.data && res.data.length > 0) {
            // Latest result uthayein
            setResult(res.data[res.data.length - 1]);
          }
        }
      } catch (err) {
        console.error("Error fetching results:", err);
        // Fallback to local if API fails
        const local = localStorage.getItem("examResult");
        if (local) setResult(JSON.parse(local));
      }
    };
    getFinalResult();
  }, []);

  if (!result) {
    return (
      <div style={{ textAlign: "center", marginTop: "100px", fontFamily: "sans-serif" }}>
        <div className="loader">🔄</div>
        <h2>Analyzing Your Performance...</h2>
        <p>Please wait while we generate your proctoring report.</p>
      </div>
    );
  }

  // Efficiency calculation logic
  const efficiency = result.total > 0
    ? ((result.score / (result.score + (result.warnings || 0) + 1)) * 100).toFixed(1)
    : 0;

  // Integrity Score Calculation (Deducting 5% per warning, minimum 0)
  const integrityScore = Math.max(0, 100 - (result.warnings * 5));

  return (
    <div style={{ padding: "40px 20px", maxWidth: "900px", margin: "auto", fontFamily: "'Segoe UI', Roboto, Helvetica, sans-serif", color: "#333" }}>

      {/* HEADER SECTION */}
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1 style={{ fontSize: "36px", marginBottom: "10px", color: "#1a2a6c" }}>🎓 Final Assessment Report</h1>
        <p style={{ color: "#666", marginBottom: "20px" }}>Candidate: <strong>{result.studentName || "Verified Student"}</strong></p>

        <div style={{
          display: "inline-block",
          padding: "10px 40px",
          borderRadius: "50px",
          backgroundColor: result.percentage >= 50 ? "#d4edda" : "#f8d7da",
          color: result.percentage >= 50 ? "#155724" : "#721c24",
          fontWeight: "bold",
          fontSize: "22px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.05)"
        }}>
          Status: {result.status || (result.percentage >= 50 ? "PASSED" : "FAILED")}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px", marginBottom: "30px" }}>

        {/* SCORE CARD */}
        <div style={{ background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)", color: "white", padding: "35px", borderRadius: "24px", boxShadow: "0 12px 24px rgba(30,60,114,0.2)" }}>
          <h3 style={{ marginTop: 0, opacity: 0.8, fontSize: "16px", letterSpacing: "1px" }}>ACADEMIC PERFORMANCE</h3>
          <h2 style={{ fontSize: "56px", margin: "10px 0" }}>{result.score} <span style={{ fontSize: "22px", opacity: 0.6 }}>/ {result.total}</span></h2>
          <p style={{ margin: 0, fontSize: "18px" }}>Overall Accuracy: <strong>{result.percentage}%</strong></p>
          <div style={{ width: "100%", height: "10px", background: "rgba(255,255,255,0.15)", borderRadius: "10px", marginTop: "20px", overflow: "hidden" }}>
            <div style={{ width: `${result.percentage}%`, height: "100%", background: "#fff", borderRadius: "10px", transition: "width 1s ease-in-out" }}></div>
          </div>
        </div>

        {/* INTEGRITY CARD */}
        <div style={{ background: "white", padding: "35px", borderRadius: "24px", border: "1px solid #edf2f7", boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }}>
          <h3 style={{ marginTop: 0, color: "#e53e3e", fontSize: "16px", letterSpacing: "1px" }}>INTEGRITY SCORE</h3>
          <h2 style={{ fontSize: "56px", margin: "10px 0", color: "#2d3748" }}>{integrityScore}<span style={{ fontSize: "22px", color: "#a0aec0" }}>%</span></h2>
          <p style={{ margin: 0, color: "#4a5568" }}>Trust Factor: <strong style={{ color: integrityScore > 70 ? "#38a169" : "#e53e3e" }}>{result.warnings > 7 ? "Suspicious" : "Reliable"}</strong></p>
          <p style={{ fontSize: "13px", color: "#718096", marginTop: "15px" }}>Efficiency Index: {efficiency}%</p>
        </div>

      </div>

      {/* DETAILED VIOLATIONS BREAKDOWN */}
      <div style={{ background: "#fff", padding: "35px", borderRadius: "24px", border: "1px solid #edf2f7", marginBottom: "30px", boxShadow: "0 4px 15px rgba(0,0,0,0.02)" }}>
        <h3 style={{ marginTop: 0, marginBottom: "25px", borderBottom: "2px solid #f7fafc", paddingBottom: "15px", color: "#1a202c" }}>🛡 AI Proctoring Detailed Analysis</h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
          <div style={violationStyle}><span>👁 Eye Tracking:</span> <strong>{result.eyeWarnings || 0}</strong></div>
          <div style={violationStyle}><span>🧠 Head Posture:</span> <strong>{result.headWarnings || 0}</strong></div>
          <div style={violationStyle}><span>🔊 Audio/Speech:</span> <strong>{result.soundWarnings || 0}</strong></div>
          <div style={violationStyle}><span>🖥 Tab Switching:</span> <strong>{result.tabWarnings || 0}</strong></div>
          <div style={violationStyle}><span>⛶ Fullscreen Exit:</span> <strong>{result.fullscreenWarnings || 0}</strong></div>
          <div style={violationStyle}><span>📋 Clipboard (Copy):</span> <strong>{result.copyWarnings || 0}</strong></div>
          <div style={violationStyle}><span>🖱 Context Menu:</span> <strong>{result.rightClickWarnings || 0}</strong></div>
          <div style={{ ...violationStyle, backgroundColor: "#fff5f5", border: "1px solid #feb2b2" }}>
            <span style={{ color: "#c53030", fontWeight: "bold" }}>Total Violations:</span> <strong style={{ color: "#c53030", fontSize: "16px" }}>{result.warnings || 0}</strong>
          </div>
        </div>
      </div>

      {/* FOOTER BUTTONS */}
      <div style={{ display: "flex", gap: "20px", marginTop: "40px" }} className="no-print">
        <button
          onClick={() => window.print()}
          style={{ flex: 1, padding: "18px", borderRadius: "12px", border: "2px solid #e2e8f0", background: "white", cursor: "pointer", fontWeight: "bold", fontSize: "16px", transition: "all 0.2s" }}
        >
          🖨 Download PDF Report
        </button>
        <button
          onClick={() => window.location.href = "/dashboard"}
          style={{ flex: 2, padding: "18px", borderRadius: "12px", border: "none", background: "#1a202c", color: "white", cursor: "pointer", fontWeight: "bold", fontSize: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
        >
          Back to Student Dashboard
        </button>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; padding: 0 !important; }
        }
        .loader { font-size: 40px; animation: spin 2s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>

    </div>
  );
};

const violationStyle = {
  display: "flex",
  justifyContent: "space-between",
  padding: "15px 20px",
  backgroundColor: "#f7fafc",
  borderRadius: "12px",
  fontSize: "14px",
  border: "1px solid #edf2f7"
};

export default Results;