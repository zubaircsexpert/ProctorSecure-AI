import { useEffect, useState } from "react";
import { ExternalLink, FileStack, Trash2, Upload } from "lucide-react";
import API from "../../services/api";

const FILE_BASE_URL = `${API.defaults.baseURL}/uploads`;
const initialForm = {
  classroomId: "",
  title: "",
  description: "",
  resourceType: "notes",
  externalUrl: "",
};

const buildUploadUrl = (relativePath) =>
  relativePath ? `${FILE_BASE_URL}/${String(relativePath).replace(/^\/+/, "")}` : "";

function StudyVaultManager({ embedded = false }) {
  const [classrooms, setClassrooms] = useState([]);
  const [resources, setResources] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const loadData = async () => {
    const [classroomRes, resourceRes] = await Promise.all([
      API.get("/api/classrooms/my"),
      API.get("/api/study-vault"),
    ]);
    const nextClassrooms = Array.isArray(classroomRes.data) ? classroomRes.data : [];
    setClassrooms(nextClassrooms);
    setResources(Array.isArray(resourceRes.data) ? resourceRes.data : []);
    setForm((prev) => ({ ...prev, classroomId: prev.classroomId || nextClassrooms[0]?.id || "" }));
  };

  useEffect(() => {
    loadData().catch((error) => console.error("Study vault manager load error:", error));
  }, []);

  const submitResource = async (event) => {
    event.preventDefault();
    setBusy(true);
    setNotice("");

    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      if (file) payload.append("file", file);
      await API.post("/api/study-vault", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm((prev) => ({ ...initialForm, classroomId: prev.classroomId }));
      setFile(null);
      await loadData();
      setNotice("Study resource published successfully.");
    } catch (error) {
      setNotice(error.response?.data?.message || "Failed to publish resource.");
    } finally {
      setBusy(false);
    }
  };

  const deleteResource = async (resourceId) => {
    if (!window.confirm("Delete this study resource?")) return;
    await API.delete(`/api/study-vault/${resourceId}`);
    await loadData();
  };

  return (
    <div style={embedded ? styles.embeddedPage : styles.page}>
      {!embedded ? (
        <section style={styles.hero}>
          <div>
            <div style={styles.kicker}>Teacher Study Vault</div>
            <h1 style={styles.title}>Upload notes, PDFs, slides and lectures</h1>
            <p style={styles.text}>Students see resources from their classroom vault instantly.</p>
          </div>
          <div style={styles.heroIcon}><FileStack size={40} /></div>
        </section>
      ) : (
        <section style={styles.embeddedHeader}>
          <div>
            <div style={styles.kickerDark}>Teacher Study Vault</div>
            <h2 style={styles.embeddedTitle}>Upload notes, PDFs, slides and lectures</h2>
            <p style={styles.embeddedText}>Students see resources from their classroom vault instantly.</p>
          </div>
          <div style={styles.smallIcon}><FileStack size={24} /></div>
        </section>
      )}

      {notice ? <div style={styles.notice}>{notice}</div> : null}

      <section style={styles.gridTwo}>
        <form style={styles.card} onSubmit={submitResource}>
          <h2 style={styles.cardTitle}>Publish resource</h2>
          <div style={styles.formGrid}>
            <label style={styles.label}>
              Classroom
              <select value={form.classroomId} onChange={(event) => setForm({ ...form, classroomId: event.target.value })} style={styles.input}>
                {classrooms.map((classroom) => (
                  <option key={classroom.id} value={classroom.id}>{classroom.label}</option>
                ))}
              </select>
            </label>
            <label style={styles.label}>
              Type
              <select value={form.resourceType} onChange={(event) => setForm({ ...form, resourceType: event.target.value })} style={styles.input}>
                <option value="notes">Notes</option>
                <option value="pdf">PDF</option>
                <option value="slides">Slides</option>
                <option value="lecture">Recorded lecture</option>
                <option value="link">Link</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label style={styles.label}>
              Title
              <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} style={styles.input} />
            </label>
            <label style={styles.label}>
              External link
              <input value={form.externalUrl} onChange={(event) => setForm({ ...form, externalUrl: event.target.value })} style={styles.input} />
            </label>
            <label style={{ ...styles.label, gridColumn: "1 / -1" }}>
              Description
              <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} style={{ ...styles.input, minHeight: "110px" }} />
            </label>
            <label style={{ ...styles.label, gridColumn: "1 / -1" }}>
              Upload file
              <input type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} style={styles.input} />
            </label>
          </div>
          <button type="submit" style={styles.primaryButton} disabled={busy}>
            <Upload size={17} />
            {busy ? "Publishing..." : "Publish to vault"}
          </button>
        </form>

        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Uploaded resources</h2>
          <div style={styles.list}>
            {resources.map((resource) => (
              <div key={resource._id} style={styles.resourceRow}>
                <div>
                  <strong>{resource.title}</strong>
                  <span>{resource.classroomName || "Classroom"} | {resource.resourceType}</span>
                </div>
                <div style={styles.actions}>
                  {resource.fileUrl ? <a href={buildUploadUrl(resource.fileUrl)} target="_blank" rel="noreferrer" style={styles.iconButton}><ExternalLink size={15} /></a> : null}
                  <button type="button" style={styles.deleteButton} onClick={() => deleteResource(resource._id)}><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
            {!resources.length ? <div style={styles.empty}>No resources uploaded yet.</div> : null}
          </div>
        </section>
      </section>
    </div>
  );
}

const styles = {
  page: { minHeight: "calc(100vh - 104px)", padding: "26px clamp(16px, 3vw, 34px) 40px", background: "linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%)" },
  embeddedPage: { display: "grid", gap: "18px" },
  hero: { display: "flex", justifyContent: "space-between", gap: "20px", alignItems: "center", padding: "30px", borderRadius: "28px", background: "linear-gradient(135deg, #0f172a, #155e75 52%, #2563eb)", color: "#fff", marginBottom: "20px" },
  kicker: { display: "inline-flex", padding: "8px 12px", borderRadius: "999px", background: "rgba(255,255,255,0.12)", textTransform: "uppercase", letterSpacing: "0.12em", fontSize: "12px", fontWeight: 800 },
  kickerDark: { color: "#2563eb", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em", fontSize: "12px" },
  title: { margin: "14px 0 10px", fontSize: "clamp(32px, 5vw, 54px)", lineHeight: 1.04 },
  text: { margin: 0, color: "rgba(255,255,255,0.82)", lineHeight: 1.7 },
  heroIcon: { width: "84px", height: "84px", borderRadius: "24px", display: "grid", placeItems: "center", background: "rgba(255,255,255,0.12)", flexShrink: 0 },
  embeddedHeader: { display: "flex", justifyContent: "space-between", gap: "18px", alignItems: "center", background: "#fff", border: "1px solid rgba(148,163,184,0.16)", borderRadius: "24px", padding: "22px", boxShadow: "0 18px 36px rgba(15,23,42,0.06)" },
  embeddedTitle: { margin: "8px 0", color: "#0f172a", fontSize: "28px" },
  embeddedText: { margin: 0, color: "#475569", lineHeight: 1.7 },
  smallIcon: { width: "52px", height: "52px", borderRadius: "16px", display: "grid", placeItems: "center", background: "#dbeafe", color: "#1d4ed8", flexShrink: 0 },
  gridTwo: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "18px" },
  card: { background: "#fff", borderRadius: "24px", padding: "22px", border: "1px solid rgba(148,163,184,0.16)", boxShadow: "0 18px 36px rgba(15,23,42,0.06)" },
  cardTitle: { margin: "0 0 16px", color: "#0f172a", fontSize: "26px" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", marginBottom: "16px" },
  label: { display: "grid", gap: "8px", color: "#334155", fontWeight: 800 },
  input: { width: "100%", border: "1px solid rgba(148,163,184,0.22)", borderRadius: "16px", padding: "13px 15px", fontFamily: "inherit", boxSizing: "border-box" },
  primaryButton: { border: "none", borderRadius: "16px", padding: "14px 18px", background: "linear-gradient(135deg, #1d4ed8, #0f766e)", color: "#fff", fontWeight: 900, display: "inline-flex", gap: "8px", alignItems: "center", cursor: "pointer" },
  notice: { padding: "14px 16px", borderRadius: "18px", background: "#ecfdf5", color: "#166534", marginBottom: "18px", border: "1px solid #bbf7d0" },
  list: { display: "grid", gap: "12px" },
  resourceRow: { display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", padding: "15px", borderRadius: "18px", background: "#f8fafc", border: "1px solid rgba(148,163,184,0.14)" },
  actions: { display: "flex", gap: "8px" },
  iconButton: { width: "38px", height: "38px", borderRadius: "13px", display: "grid", placeItems: "center", background: "#dbeafe", color: "#1d4ed8" },
  deleteButton: { width: "38px", height: "38px", borderRadius: "13px", border: "none", display: "grid", placeItems: "center", background: "#fee2e2", color: "#b91c1c", cursor: "pointer" },
  empty: { padding: "18px", borderRadius: "18px", background: "#fff", border: "1px dashed rgba(148,163,184,0.26)", color: "#64748b" },
};

export default StudyVaultManager;
