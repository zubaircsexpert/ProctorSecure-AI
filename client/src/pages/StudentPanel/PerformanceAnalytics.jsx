import { useEffect, useMemo, useState } from "react";
import { Activity, TrendingUp } from "lucide-react";
import API from "../../services/api";

function PerformanceAnalytics() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadResults = async () => {
      try {
        const response = await API.get("/api/results/my");
        setResults(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Performance analytics load error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, []);

  const analytics = useMemo(() => {
    const ordered = [...results].sort((left, right) => new Date(left.createdAt || 0) - new Date(right.createdAt || 0));
    const scores = ordered.map((result) => Number(result.percentage || 0));
    const latest = scores[scores.length - 1] || 0;
    const previous = scores[scores.length - 2] || 0;
    const average = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
    const trend = latest - previous;
    const suspiciousAverage = results.length
      ? Math.round(results.reduce((sum, result) => sum + Number(result.suspiciousScore || result.cheatingPercent || 0), 0) / results.length)
      : 0;

    const best = Math.max(...scores, 0);
    const attempts = scores.length;
    const weakAttempts = ordered.filter((result) => Number(result.percentage || 0) < average || Number(result.percentage || 0) < 50);

    return { ordered, latest, average, trend, suspiciousAverage, best, attempts, weakAttempts };
  }, [results]);

  const advice = useMemo(() => {
    if (!results.length) return "Attempt an AI exam or quiz first, then your trend report will appear here.";
    if (analytics.trend > 5) return "Your performance is improving. Keep the same revision rhythm and review mistakes after every attempt.";
    if (analytics.trend < -5) return "Your latest score dropped. Revisit weak topics, reduce multitasking, and attempt a short quiz before the next exam.";
    if (analytics.suspiciousAverage > 30) return "Integrity score needs attention. Keep camera centered, avoid tab switching, and run System Checks before exams.";
    return "Your trend is stable. Push improvement by practicing the lowest scoring topic first.";
  }, [analytics.suspiciousAverage, analytics.trend, results.length]);

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div>
          <div style={styles.kicker}>Performance Analytics</div>
          <h1 style={styles.title}>AI performance command center</h1>
          <p style={styles.text}>Score trend, integrity risk, best attempt, weak attempts and next-study action in one clean report.</p>
        </div>
        <div style={styles.heroIcon}><TrendingUp size={42} /></div>
      </section>

      {loading ? <div style={styles.empty}>Loading performance analytics...</div> : null}

      <section style={styles.grid}>
        <Metric label="Latest Score" value={`${analytics.latest}%`} />
        <Metric label="Average Score" value={`${analytics.average}%`} />
        <Metric label="Best Score" value={`${analytics.best}%`} />
        <Metric label="Trend" value={`${analytics.trend >= 0 ? "+" : ""}${analytics.trend}%`} />
        <Metric label="Integrity Risk Avg" value={`${analytics.suspiciousAverage}%`} />
        <Metric label="Attempts" value={analytics.attempts} />
      </section>

      <section style={styles.card}>
        <div style={styles.cardHead}>
          <Activity size={20} />
          <strong>AI improvement suggestion</strong>
        </div>
        <p style={styles.cardText}>{advice}</p>
        <div style={styles.progressWrap}>
          <Progress label="Latest score" value={analytics.latest} tone="#2563eb" />
          <Progress label="Average score" value={analytics.average} tone="#0f766e" />
          <Progress label="Integrity safety" value={Math.max(0, 100 - analytics.suspiciousAverage)} tone="#16a34a" />
        </div>
      </section>

      <section style={styles.card}>
        <div style={styles.cardHead}>
          <Activity size={20} />
          <strong>Weak attempt review</strong>
        </div>
        {!analytics.weakAttempts.length ? (
          <p style={styles.cardText}>No weak attempt detected yet. Keep taking short practice checks before major exams.</p>
        ) : (
          <div style={styles.weakGrid}>
            {analytics.weakAttempts.slice(-3).map((result) => (
              <div key={result._id || result.createdAt} style={styles.weakCard}>
                <strong>{result.testName || "Assessment"}</strong>
                <span>{result.percentage || 0}% score</span>
                <small>Revise answers and run System Checks before retry.</small>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={styles.history}>
        {analytics.ordered.map((result, index) => (
          <div key={result._id} style={styles.row}>
            <div>
              <strong>{result.testName || "Assessment"}</strong>
              <span>{new Date(result.createdAt).toLocaleString()} | {result.assessmentType || "exam"}</span>
            </div>
            <div style={styles.scoreBlock}>
              <strong>{result.percentage || 0}%</strong>
              <span>Attempt {index + 1}</span>
            </div>
          </div>
        ))}
        {!loading && !results.length ? <div style={styles.empty}>No result history yet.</div> : null}
      </section>
    </div>
  );
}

const Metric = ({ label, value }) => (
  <div style={styles.metric}>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const Progress = ({ label, value, tone }) => (
  <div style={styles.progressItem}>
    <div style={styles.progressTop}>
      <span>{label}</span>
      <strong>{value}%</strong>
    </div>
    <div style={styles.progressTrack}>
      <div style={{ ...styles.progressBar, width: `${Math.min(100, Math.max(0, value))}%`, background: tone }} />
    </div>
  </div>
);

const styles = {
  page: {
    minHeight: "calc(100vh - 104px)",
    padding: "26px clamp(16px, 3vw, 34px) 40px",
    background: "linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%)",
  },
  hero: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    alignItems: "center",
    padding: "30px",
    borderRadius: "28px",
    background: "linear-gradient(135deg, #0f172a, #155e75 52%, #2563eb)",
    color: "#fff",
    marginBottom: "20px",
  },
  kicker: {
    display: "inline-flex",
    padding: "8px 12px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.12)",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontSize: "12px",
    fontWeight: 800,
  },
  title: { margin: "14px 0 10px", fontSize: "clamp(32px, 5vw, 54px)", lineHeight: 1.04 },
  text: { margin: 0, color: "rgba(255,255,255,0.82)", lineHeight: 1.7 },
  heroIcon: {
    width: "84px",
    height: "84px",
    borderRadius: "24px",
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,0.12)",
    flexShrink: 0,
  },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "16px", marginBottom: "18px" },
  metric: {
    display: "grid",
    gap: "8px",
    background: "#fff",
    border: "1px solid rgba(148,163,184,0.16)",
    borderRadius: "22px",
    padding: "20px",
    boxShadow: "0 18px 36px rgba(15,23,42,0.06)",
  },
  card: {
    background: "#fff",
    borderRadius: "24px",
    padding: "22px",
    border: "1px solid rgba(148,163,184,0.16)",
    marginBottom: "18px",
  },
  cardHead: { display: "flex", gap: "10px", alignItems: "center", color: "#0f172a", fontSize: "18px" },
  cardText: { margin: "12px 0 0", color: "#475569", lineHeight: 1.7 },
  progressWrap: { display: "grid", gap: "12px", marginTop: "18px" },
  progressItem: { display: "grid", gap: "8px" },
  progressTop: { display: "flex", justifyContent: "space-between", color: "#334155", fontWeight: 800 },
  progressTrack: { height: "10px", borderRadius: "999px", background: "#e2e8f0", overflow: "hidden" },
  progressBar: { height: "100%", borderRadius: "999px" },
  weakGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", marginTop: "14px" },
  weakCard: { display: "grid", gap: "7px", padding: "14px 16px", borderRadius: "16px", background: "#f8fafc", border: "1px solid rgba(148,163,184,0.16)", color: "#475569" },
  history: { display: "grid", gap: "10px" },
  row: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    flexWrap: "wrap",
    background: "#fff",
    border: "1px solid rgba(148,163,184,0.14)",
    borderRadius: "18px",
    padding: "16px 18px",
    color: "#475569",
  },
  scoreBlock: { display: "grid", gap: "4px", textAlign: "right", color: "#0f172a" },
  empty: {
    padding: "20px",
    borderRadius: "18px",
    background: "#fff",
    border: "1px dashed rgba(148,163,184,0.26)",
    color: "#64748b",
    marginBottom: "18px",
  },
};

export default PerformanceAnalytics;
