import { useEffect, useMemo, useState } from "react";
import { Camera, Gauge, Mic, Wifi } from "lucide-react";
import API from "../../services/api";

const getStatus = (ok, warning = false) => (ok ? "pass" : warning ? "warning" : "fail");

function SystemChecks() {
  const [checks, setChecks] = useState([]);
  const [running, setRunning] = useState(false);
  const [current, setCurrent] = useState(null);

  const loadChecks = async () => {
    try {
      const response = await API.get("/api/system-checks/my");
      setChecks(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("System checks load error:", error);
    }
  };

  useEffect(() => {
    loadChecks();
  }, []);

  const runCheck = async () => {
    setRunning(true);
    let stream = null;

    try {
      const started = performance.now();
      await fetch(`${API.defaults.baseURL}/`, { cache: "no-store" });
      const latencyMs = Math.round(performance.now() - started);
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      const speedMbps = Number(connection?.downlink || (latencyMs < 200 ? 8 : latencyMs < 450 ? 3 : 1));

      let camera = "warning";
      let microphone = "warning";
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        camera = stream.getVideoTracks().length ? "pass" : "fail";
        microphone = stream.getAudioTracks().length ? "pass" : "fail";
      } catch {
        camera = "fail";
        microphone = "fail";
      }

      const payload = {
        camera,
        microphone,
        internet: getStatus(speedMbps >= 2 && latencyMs < 700, speedMbps >= 1),
        speedMbps,
        latencyMs,
        notes: "Browser readiness check before AI exam.",
      };

      const response = await API.post("/api/system-checks", payload);
      setCurrent(response.data);
      await loadChecks();
    } finally {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      setRunning(false);
    }
  };

  const latest = current || checks[0] || null;
  const summary = useMemo(() => {
    if (!latest) return "Run a check before starting your AI exam.";
    const statuses = [latest.camera, latest.microphone, latest.internet];
    if (statuses.every((status) => status === "pass")) return "Ready for AI exam";
    if (statuses.includes("fail")) return "Fix required before exam";
    return "Usable, but improve setup";
  }, [latest]);

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div>
          <div style={styles.kicker}>System Checks</div>
          <h1 style={styles.title}>Camera, microphone and internet readiness</h1>
          <p style={styles.text}>Run this before AI exams so technical issues are caught early.</p>
        </div>
        <button type="button" style={styles.runButton} onClick={runCheck} disabled={running}>
          {running ? "Checking..." : "Run check"}
        </button>
      </section>

      <section style={styles.grid}>
        <StatusCard icon={<Camera />} label="Camera" status={latest?.camera || "warning"} />
        <StatusCard icon={<Mic />} label="Microphone" status={latest?.microphone || "warning"} />
        <StatusCard icon={<Wifi />} label="Internet" status={latest?.internet || "warning"} />
        <StatusCard icon={<Gauge />} label="Speed" status={latest?.internet || "warning"} value={latest ? `${latest.speedMbps || 0} Mbps | ${latest.latencyMs || 0} ms` : "Not tested"} />
      </section>

      <section style={styles.card}>
        <div style={styles.kickerDark}>Latest analysis</div>
        <h2 style={styles.cardTitle}>{summary}</h2>
        <p style={styles.cardText}>
          Keep your face visible, allow browser permissions, close heavy apps, and use stable Wi-Fi or cable before starting.
        </p>
      </section>

      <section style={styles.history}>
        {checks.map((check) => (
          <div key={check._id} style={styles.historyRow}>
            <strong>{new Date(check.createdAt).toLocaleString()}</strong>
            <span>Camera {check.camera} | Mic {check.microphone} | Internet {check.internet} | {check.speedMbps || 0} Mbps</span>
          </div>
        ))}
      </section>
    </div>
  );
}

const StatusCard = ({ icon, label, status, value }) => (
  <div style={styles.statusCard}>
    <div style={styles.statusIcon(status)}>{icon}</div>
    <span style={styles.statusLabel}>{label}</span>
    <strong style={styles.statusText(status)}>{value || status}</strong>
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
    flexWrap: "wrap",
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
  runButton: {
    border: "none",
    borderRadius: "18px",
    background: "#fff",
    color: "#0f172a",
    padding: "15px 20px",
    fontWeight: 900,
    cursor: "pointer",
  },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "16px", marginBottom: "18px" },
  statusCard: {
    background: "#fff",
    borderRadius: "22px",
    border: "1px solid rgba(148,163,184,0.16)",
    boxShadow: "0 18px 36px rgba(15,23,42,0.06)",
    padding: "20px",
    display: "grid",
    gap: "10px",
  },
  statusIcon: (status) => ({
    width: "46px",
    height: "46px",
    borderRadius: "16px",
    display: "grid",
    placeItems: "center",
    background: status === "pass" ? "#dcfce7" : status === "fail" ? "#fee2e2" : "#fef3c7",
    color: status === "pass" ? "#166534" : status === "fail" ? "#b91c1c" : "#92400e",
  }),
  statusLabel: { color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "12px", fontWeight: 800 },
  statusText: (status) => ({
    color: status === "pass" ? "#166534" : status === "fail" ? "#b91c1c" : "#92400e",
    fontSize: "22px",
    textTransform: "capitalize",
  }),
  card: {
    background: "#fff",
    borderRadius: "24px",
    padding: "24px",
    border: "1px solid rgba(148,163,184,0.16)",
    marginBottom: "18px",
  },
  kickerDark: { color: "#2563eb", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em", fontSize: "12px" },
  cardTitle: { margin: "8px 0", color: "#0f172a", fontSize: "28px" },
  cardText: { margin: 0, color: "#475569", lineHeight: 1.7 },
  history: { display: "grid", gap: "10px" },
  historyRow: {
    display: "grid",
    gap: "4px",
    background: "#fff",
    border: "1px solid rgba(148,163,184,0.14)",
    borderRadius: "16px",
    padding: "14px 16px",
    color: "#475569",
  },
};

export default SystemChecks;
