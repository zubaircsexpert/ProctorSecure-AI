import { useEffect, useMemo, useState } from "react";
import API from "../../services/api";

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const computeTrustFactor = (score) => {
  if (score >= 65) return "Critical";
  if (score >= 40) return "Suspicious";
  if (score >= 20) return "Monitor";
  return "Reliable";
};

const Results = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getFinalResult = async () => {
      try {
        const localData =
          localStorage.getItem("examResult") ||
          localStorage.getItem("/api/examResult");

        if (localData) {
          setResult(JSON.parse(localData));
          setLoading(false);
          return;
        }

        try {
          const response = await API.get("/api/results/my");
          if (Array.isArray(response.data) && response.data.length > 0) {
            setResult(response.data[0]);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error("Primary result fetch failed:", err);
        }

        try {
          const response = await API.get("/my-results");
          if (Array.isArray(response.data) && response.data.length > 0) {
            setResult(response.data[0]);
          }
        } catch (err) {
          console.error("Fallback result fetch failed:", err);
        }
      } catch (err) {
        console.error("Result page error:", err);
      } finally {
        setLoading(false);
      }
    };

    getFinalResult();
  }, []);

  const derived = useMemo(() => {
    if (!result) {
      return null;
    }

    const total = Number(result.total || 0);
    const score = Number(result.score || 0);
    const answeredCount =
      result.answeredCount !== undefined
        ? Number(result.answeredCount || 0)
        : total;
    const incorrectAnswers =
      result.incorrectAnswers !== undefined
        ? Number(result.incorrectAnswers || 0)
        : Math.max(answeredCount - score, 0);
    const unansweredAnswers =
      result.unansweredAnswers !== undefined
        ? Number(result.unansweredAnswers || 0)
        : Math.max(total - answeredCount, 0);
    const academicAccuracy =
      result.academicAccuracy !== undefined
        ? Number(result.academicAccuracy || 0)
        : Number(result.percentage || 0);
    const suspiciousScore =
      result.suspiciousScore !== undefined
        ? Number(result.suspiciousScore || 0)
        : Number(result.cheatingPercent || 0);
    const integrityScore =
      result.integrityScore !== undefined
        ? Number(result.integrityScore || 0)
        : clamp(100 - suspiciousScore);
    const intelligenceScore =
      result.intelligenceScore !== undefined
        ? Number(result.intelligenceScore || 0)
        : clamp(academicAccuracy * 0.74 + integrityScore * 0.26);
    const trustFactor = result.trustFactor || computeTrustFactor(suspiciousScore);
    const warnings = Number(result.warnings || 0);
    const activityLog = Array.isArray(result.activityLog) ? result.activityLog : [];

    return {
      total,
      score,
      answeredCount,
      incorrectAnswers,
      unansweredAnswers,
      academicAccuracy,
      suspiciousScore,
      integrityScore,
      intelligenceScore,
      trustFactor,
      warnings,
      activityLog,
    };
  }, [result]);

  if (loading) {
    return (
      <div style={styles.loaderState}>
        <div style={styles.loaderOrb} />
        <h2 style={{ margin: "18px 0 8px" }}>Analyzing your performance</h2>
        <p style={{ margin: 0, color: "#64748b" }}>
          Building academic and suspicious-activity insights from your exam session.
        </p>
      </div>
    );
  }

  if (!result || !derived) {
    return (
      <div style={styles.loaderState}>
        <h2 style={{ margin: 0 }}>No result found</h2>
        <p style={{ margin: "12px 0 0", color: "#64748b" }}>
          Please attempt an exam first.
        </p>
      </div>
    );
  }

  const detectionRows = [
    ["Eye tracking", result.eyeWarnings || 0],
    ["Head movement", result.headWarnings || 0],
    ["Audio / speech", result.soundWarnings || 0],
    ["Tab / visibility", (result.tabWarnings || 0) + (result.visibilityWarnings || 0)],
    ["Fullscreen exits", result.fullscreenWarnings || 0],
    ["Copy / paste / cut", (result.copyWarnings || 0) + (result.pasteWarnings || 0) + (result.cutWarnings || 0)],
    ["Right-click / shortcuts", (result.rightClickWarnings || 0) + (result.shortcutWarnings || 0)],
    ["Screenshot attempts", result.screenshotWarnings || 0],
    ["Focus / share overlays", (result.focusWarnings || 0) + (result.screenShareWarnings || 0)],
    ["Face missing / multi-face", (result.faceMissingWarnings || 0) + (result.multipleFaceWarnings || 0)],
  ];

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <div>
          <div style={styles.heroKicker}>Final assessment report</div>
          <h1 style={styles.heroTitle}>
            {result.testName || "Exam"} · {result.status || (derived.academicAccuracy >= 50 ? "PASSED" : "FAILED")}
          </h1>
          <p style={styles.heroText}>
            Candidate <strong>{result.studentName || "Verified Student"}</strong> completed the exam
            with a professional AI-assisted evaluation of both academic performance and suspicious behavior.
          </p>
        </div>

        <div style={styles.heroStatusCard}>
          <div style={styles.heroStatusLabel}>Trust Factor</div>
          <div style={styles.heroStatusValue(derived.trustFactor)}>{derived.trustFactor}</div>
          <div style={{ color: "rgba(255,255,255,0.78)", marginTop: "10px" }}>
            Generated {result.createdAt ? new Date(result.createdAt).toLocaleString() : "now"}
          </div>
        </div>
      </div>

      <div style={styles.cardGrid}>
        <section style={styles.cardBlue}>
          <div style={styles.cardLabel}>Academic Performance</div>
          <div style={styles.cardBigNumber}>
            {derived.score}
            <span style={styles.cardBigMuted}> / {derived.total}</span>
          </div>
          <div style={styles.cardSubText}>
            Correct answers <strong>{derived.score}</strong> · Wrong answers{" "}
            <strong>{derived.incorrectAnswers}</strong> · Unanswered{" "}
            <strong>{derived.unansweredAnswers}</strong>
          </div>
          <Progress value={derived.academicAccuracy} tone="light" />
          <div style={styles.cardFooterText}>Accuracy {derived.academicAccuracy}%</div>
        </section>

        <section style={styles.cardLight}>
          <div style={styles.cardLabelRed}>Intelligence Score</div>
          <div style={styles.cardDarkNumber}>{derived.intelligenceScore}%</div>
          <div style={styles.cardSubTextDark}>
            Balanced score combining academic accuracy with exam integrity behavior.
          </div>
          <Progress value={derived.intelligenceScore} tone="blue" />
          <div style={styles.detailPillRow}>
            <Pill label="Answered" value={derived.answeredCount} />
            <Pill label="Accuracy" value={`${derived.academicAccuracy}%`} />
          </div>
        </section>

        <section style={styles.cardAlert}>
          <div style={styles.cardLabelAmber}>Suspicious Activity</div>
          <div style={styles.cardDarkNumber}>{derived.suspiciousScore}%</div>
          <div style={styles.cardSubTextDark}>
            This score rises when the system detects eye drift, head movement, focus loss,
            clipboard actions, screenshots, or other risky behavior.
          </div>
          <Progress value={derived.suspiciousScore} tone="amber" />
          <div style={styles.detailPillRow}>
            <Pill label="Total Alerts" value={derived.warnings} />
            <Pill label="Integrity" value={`${derived.integrityScore}%`} />
          </div>
        </section>
      </div>

      <div style={styles.bottomGrid}>
        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <div style={styles.panelKicker}>Detection analysis</div>
              <h3 style={styles.panelTitle}>AI proctoring breakdown</h3>
            </div>
            <div style={styles.panelBadge}>{derived.trustFactor}</div>
          </div>

          <div style={styles.detectionGrid}>
            {detectionRows.map(([label, value]) => (
              <div key={label} style={styles.detectionCard}>
                <span style={{ color: "#64748b" }}>{label}</span>
                <strong style={{ color: Number(value) > 0 ? "#dc2626" : "#0f172a", fontSize: "18px" }}>
                  {value}
                </strong>
              </div>
            ))}
          </div>
        </section>

        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <div style={styles.panelKicker}>Live audit trail</div>
              <h3 style={styles.panelTitle}>Recent suspicious detections</h3>
            </div>
            <div style={styles.panelBadgeNeutral}>{derived.activityLog.length} events</div>
          </div>

          {derived.activityLog.length === 0 ? (
            <div style={styles.emptyAudit}>
              No major suspicious event detail was saved for this attempt.
            </div>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {derived.activityLog.slice(0, 8).map((item, index) => (
                <div key={`${item.type}-${index}`} style={styles.auditRow}>
                  <div>
                    <div style={{ fontWeight: 800, color: "#0f172a", textTransform: "capitalize" }}>
                      {item.type}
                    </div>
                    <div style={{ color: "#475569", marginTop: "6px", lineHeight: 1.5 }}>
                      {item.message}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={styles.auditCount}>x{item.count || 1}</div>
                    <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "8px" }}>
                      {item.occurredAt ? new Date(item.occurredAt).toLocaleTimeString() : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div style={styles.actionRow}>
        <button onClick={() => window.print()} style={styles.ghostButton}>
          Download PDF Report
        </button>
        <button
          onClick={() => {
            localStorage.removeItem("examResult");
            window.location.href = "/dashboard";
          }}
          style={styles.primaryButton}
        >
          Back to Student Dashboard
        </button>
      </div>

      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media print {
          body {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
};

const Progress = ({ value, tone }) => (
  <div style={styles.progressTrack}>
    <div
      style={{
        ...styles.progressFill,
        width: `${clamp(value)}%`,
        background:
          tone === "amber"
            ? "linear-gradient(90deg, #f59e0b, #ef4444)"
            : tone === "blue"
            ? "linear-gradient(90deg, #2563eb, #06b6d4)"
            : "linear-gradient(90deg, rgba(255,255,255,0.92), rgba(255,255,255,0.64))",
      }}
    />
  </div>
);

const Pill = ({ label, value }) => (
  <div style={styles.pill}>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const styles = {
  page: {
    padding: "26px clamp(16px, 3vw, 34px) 40px",
    minHeight: "calc(100vh - 104px)",
  },
  loaderState: {
    minHeight: "calc(100vh - 104px)",
    display: "grid",
    placeItems: "center",
    textAlign: "center",
    padding: "24px",
  },
  loaderOrb: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background: "conic-gradient(from 180deg, #2563eb, #06b6d4, #2563eb)",
    animation: "spin 1.2s linear infinite",
  },
  hero: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
    padding: "32px",
    borderRadius: "32px",
    background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 58%, #7c3aed 100%)",
    color: "#fff",
    boxShadow: "0 28px 60px rgba(59, 130, 246, 0.22)",
    marginBottom: "24px",
  },
  heroKicker: {
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    fontSize: "12px",
    color: "rgba(255,255,255,0.72)",
  },
  heroTitle: {
    margin: "10px 0 12px",
    fontSize: "clamp(34px, 5vw, 56px)",
    lineHeight: 1.02,
  },
  heroText: {
    margin: 0,
    maxWidth: "760px",
    color: "rgba(255,255,255,0.84)",
    lineHeight: 1.7,
  },
  heroStatusCard: {
    padding: "24px",
    borderRadius: "26px",
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.1)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  heroStatusLabel: {
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    fontSize: "12px",
    color: "rgba(255,255,255,0.74)",
  },
  heroStatusValue: (label) => ({
    marginTop: "12px",
    fontSize: "34px",
    fontWeight: 900,
    color:
      label === "Reliable"
        ? "#bbf7d0"
        : label === "Monitor"
        ? "#fde68a"
        : "#fecaca",
  }),
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "18px",
    marginBottom: "22px",
  },
  cardBlue: {
    padding: "26px",
    borderRadius: "28px",
    background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
    color: "#fff",
    boxShadow: "0 24px 50px rgba(37, 99, 235, 0.2)",
  },
  cardLight: {
    padding: "26px",
    borderRadius: "28px",
    background: "rgba(255,255,255,0.96)",
    border: "1px solid rgba(148,163,184,0.14)",
    boxShadow: "0 20px 44px rgba(15, 23, 42, 0.08)",
  },
  cardAlert: {
    padding: "26px",
    borderRadius: "28px",
    background: "linear-gradient(180deg, #fff7ed 0%, #ffffff 100%)",
    border: "1px solid rgba(251, 146, 60, 0.18)",
    boxShadow: "0 20px 44px rgba(15, 23, 42, 0.08)",
  },
  cardLabel: {
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontSize: "12px",
    color: "rgba(255,255,255,0.74)",
  },
  cardLabelRed: {
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontSize: "12px",
    color: "#2563eb",
  },
  cardLabelAmber: {
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontSize: "12px",
    color: "#c2410c",
  },
  cardBigNumber: {
    marginTop: "12px",
    fontSize: "64px",
    fontWeight: 900,
    lineHeight: 1,
  },
  cardBigMuted: {
    fontSize: "24px",
    color: "rgba(255,255,255,0.72)",
  },
  cardDarkNumber: {
    marginTop: "12px",
    fontSize: "58px",
    fontWeight: 900,
    lineHeight: 1,
    color: "#0f172a",
  },
  cardSubText: {
    marginTop: "16px",
    color: "rgba(255,255,255,0.84)",
    lineHeight: 1.7,
  },
  cardSubTextDark: {
    marginTop: "16px",
    color: "#475569",
    lineHeight: 1.7,
  },
  progressTrack: {
    width: "100%",
    height: "10px",
    borderRadius: "999px",
    background: "rgba(15, 23, 42, 0.08)",
    overflow: "hidden",
    marginTop: "22px",
  },
  progressFill: {
    height: "100%",
    borderRadius: "999px",
  },
  cardFooterText: {
    marginTop: "12px",
    color: "rgba(255,255,255,0.84)",
    fontWeight: 700,
  },
  detailPillRow: {
    display: "flex",
    gap: "10px",
    marginTop: "16px",
    flexWrap: "wrap",
  },
  pill: {
    padding: "10px 12px",
    borderRadius: "16px",
    background: "#f8fbff",
    border: "1px solid rgba(148,163,184,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    minWidth: "140px",
  },
  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "18px",
    marginBottom: "22px",
  },
  panel: {
    padding: "24px",
    borderRadius: "28px",
    background: "rgba(255,255,255,0.96)",
    border: "1px solid rgba(148,163,184,0.12)",
    boxShadow: "0 20px 44px rgba(15, 23, 42, 0.08)",
  },
  panelHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "18px",
  },
  panelKicker: {
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontSize: "12px",
    color: "#94a3b8",
  },
  panelTitle: {
    margin: "6px 0 0",
    fontSize: "26px",
    color: "#0f172a",
  },
  panelBadge: {
    padding: "10px 14px",
    borderRadius: "999px",
    background: "#fff7ed",
    color: "#c2410c",
    fontWeight: 800,
  },
  panelBadgeNeutral: {
    padding: "10px 14px",
    borderRadius: "999px",
    background: "#eff6ff",
    color: "#2563eb",
    fontWeight: 800,
  },
  detectionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "12px",
  },
  detectionCard: {
    padding: "14px 16px",
    borderRadius: "18px",
    background: "#f8fbff",
    border: "1px solid rgba(148,163,184,0.12)",
    display: "grid",
    gap: "10px",
  },
  emptyAudit: {
    padding: "20px",
    borderRadius: "18px",
    background: "#f8fafc",
    color: "#64748b",
  },
  auditRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    padding: "16px",
    borderRadius: "18px",
    background: "#f8fafc",
    border: "1px solid rgba(148,163,184,0.12)",
  },
  auditCount: {
    padding: "8px 10px",
    borderRadius: "999px",
    background: "#dbeafe",
    color: "#1d4ed8",
    fontWeight: 800,
  },
  actionRow: {
    display: "flex",
    gap: "14px",
    flexWrap: "wrap",
  },
  ghostButton: {
    flex: 1,
    minWidth: "240px",
    border: "1px solid rgba(148,163,184,0.24)",
    padding: "16px 18px",
    borderRadius: "18px",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 800,
  },
  primaryButton: {
    flex: 2,
    minWidth: "280px",
    border: "none",
    padding: "16px 18px",
    borderRadius: "18px",
    background: "linear-gradient(135deg, #0f172a, #1d4ed8)",
    color: "#fff",
    fontWeight: 800,
    boxShadow: "0 18px 34px rgba(29, 78, 216, 0.2)",
  },
};

export default Results;
