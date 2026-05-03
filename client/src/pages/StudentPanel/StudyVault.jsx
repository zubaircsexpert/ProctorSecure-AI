import { useEffect, useState } from "react";
import { ExternalLink, FileStack } from "lucide-react";
import API from "../../services/api";

const FILE_BASE_URL = `${API.defaults.baseURL}/uploads`;

const buildUploadUrl = (relativePath) =>
  relativePath ? `${FILE_BASE_URL}/${String(relativePath).replace(/^\/+/, "")}` : "";

function StudyVault() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadResources = async () => {
      try {
        const response = await API.get("/api/study-vault");
        setResources(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Study vault load error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadResources();
  }, []);

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div>
          <div style={styles.kicker}>Study Vault</div>
          <h1 style={styles.title}>Notes, slides, PDFs and lectures</h1>
          <p style={styles.text}>Teacher resources for your classroom stay in one clean library.</p>
        </div>
        <div style={styles.heroIcon}><FileStack size={40} /></div>
      </section>

      {loading ? <div style={styles.empty}>Loading study vault...</div> : null}

      {!loading && resources.length === 0 ? (
        <div style={styles.empty}>No study resources have been uploaded for your classroom yet.</div>
      ) : null}

      <section style={styles.grid}>
        {resources.map((resource) => {
          const fileUrl = buildUploadUrl(resource.fileUrl);
          return (
            <article key={resource._id} style={styles.card}>
              <span style={styles.badge}>{resource.resourceType || "notes"}</span>
              <h2 style={styles.cardTitle}>{resource.title}</h2>
              <p style={styles.cardText}>{resource.description || "Classroom study material"}</p>
              <div style={styles.meta}>{resource.classroomName || "Classroom"} | {new Date(resource.createdAt).toLocaleString()}</div>
              <div style={styles.actions}>
                {fileUrl ? (
                  <a href={fileUrl} target="_blank" rel="noreferrer" style={styles.primaryLink}>
                    <ExternalLink size={15} />
                    Open file
                  </a>
                ) : null}
                {resource.externalUrl ? (
                  <a href={resource.externalUrl} target="_blank" rel="noreferrer" style={styles.secondaryLink}>
                    <ExternalLink size={15} />
                    Open link
                  </a>
                ) : null}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}

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
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "18px" },
  card: {
    background: "#fff",
    borderRadius: "24px",
    border: "1px solid rgba(148,163,184,0.16)",
    boxShadow: "0 18px 36px rgba(15,23,42,0.06)",
    padding: "22px",
    display: "grid",
    gap: "12px",
  },
  badge: {
    width: "fit-content",
    padding: "7px 11px",
    borderRadius: "999px",
    background: "#e0f2fe",
    color: "#0369a1",
    fontWeight: 900,
    textTransform: "capitalize",
    fontSize: "12px",
  },
  cardTitle: { margin: 0, color: "#0f172a", fontSize: "22px" },
  cardText: { margin: 0, color: "#475569", lineHeight: 1.65 },
  meta: { color: "#64748b", fontSize: "13px", lineHeight: 1.5 },
  actions: { display: "flex", gap: "10px", flexWrap: "wrap" },
  primaryLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    textDecoration: "none",
    borderRadius: "14px",
    background: "#2563eb",
    color: "#fff",
    padding: "11px 14px",
    fontWeight: 800,
  },
  secondaryLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    textDecoration: "none",
    borderRadius: "14px",
    background: "#f8fafc",
    color: "#0f172a",
    border: "1px solid rgba(148,163,184,0.18)",
    padding: "11px 14px",
    fontWeight: 800,
  },
  empty: {
    padding: "20px",
    borderRadius: "18px",
    background: "#fff",
    border: "1px dashed rgba(148,163,184,0.26)",
    color: "#64748b",
    marginBottom: "18px",
  },
};

export default StudyVault;
