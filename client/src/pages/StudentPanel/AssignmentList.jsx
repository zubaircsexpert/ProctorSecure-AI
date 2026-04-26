import { useEffect, useState } from "react";
import { ExternalLink, FileUp, FolderKanban, Sparkles } from "lucide-react";
import API from "../../services/api";

const FILE_BASE_URL = `${API.defaults.baseURL}/uploads`;

const AssignmentList = () => {
  const [assignments, setAssignments] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState({});
  const [submittingId, setSubmittingId] = useState("");

  const fetchAssignments = async () => {
    try {
      const response = await API.get("/api/assignments/all");
      setAssignments(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Assignment fetch failed", error);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleUpload = async (assignmentId) => {
    const file = selectedFiles[assignmentId];

    if (!file) {
      window.alert("Please select a file before uploading.");
      return;
    }

    try {
      setSubmittingId(assignmentId);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("assignmentId", assignmentId);
      await API.post("/api/assignments/upload", formData);
      setSelectedFiles((previous) => ({
        ...previous,
        [assignmentId]: null,
      }));
      await fetchAssignments();
    } catch (error) {
      console.error("Assignment upload failed", error);
      window.alert(error.response?.data?.message || "Upload failed.");
    } finally {
      setSubmittingId("");
    }
  };

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div>
          <div style={styles.heroBadge}>Student Task Space</div>
          <h1 style={styles.heroTitle}>Assignments and submission flow</h1>
          <p style={styles.heroText}>
            Review teacher files, upload your own work, and track marks or feedback from one clean
            classroom view.
          </p>
        </div>

        <div style={styles.heroPanel}>
          <div style={styles.heroMetric}>
            <span>Total Assignments</span>
            <strong>{assignments.length}</strong>
          </div>
          <div style={styles.heroMetric}>
            <span>Awaiting Review</span>
            <strong>{assignments.filter((item) => item.status !== "Checked").length}</strong>
          </div>
        </div>
      </section>

      <section style={styles.card}>
        <div style={styles.sectionHead}>
          <div>
            <div style={styles.sectionKicker}>Classroom workload</div>
            <h2 style={styles.sectionTitle}>Available assignments</h2>
          </div>
          <div style={styles.iconBadge}>
            <FolderKanban size={20} />
          </div>
        </div>

        {assignments.length === 0 ? (
          <div style={styles.emptyState}>No assignment has been posted for your class yet.</div>
        ) : (
          <div style={styles.list}>
            {assignments.map((assignment) => {
              const mySubmission = assignment.mySubmission;
              return (
                <article key={assignment._id} style={styles.assignmentCard}>
                  <div style={styles.assignmentTop}>
                    <div>
                      <div style={styles.assignmentTitle}>{assignment.title}</div>
                      <div style={styles.assignmentMeta}>
                        Due {assignment.dueDate} | {assignment.classroomName || "Your classroom"}
                      </div>
                    </div>

                    <div style={styles.statusBadge(assignment.status)}>
                      {assignment.status || "Pending"}
                    </div>
                  </div>

                  {assignment.description ? (
                    <p style={styles.assignmentText}>{assignment.description}</p>
                  ) : null}

                  <div style={styles.metaGrid}>
                    <div style={styles.metaItem}>
                      <span>Marks</span>
                      <strong>
                        {mySubmission?.status === "Checked"
                          ? mySubmission.marks
                          : assignment.marks || "-"}
                      </strong>
                    </div>
                    <div style={styles.metaItem}>
                      <span>Submission State</span>
                      <strong>{mySubmission?.status || "Not uploaded"}</strong>
                    </div>
                  </div>

                  <div style={styles.linkRow}>
                    {assignment.fileUrl ? (
                      <a
                        href={`${FILE_BASE_URL}/${assignment.fileUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        style={styles.linkChip}
                      >
                        <ExternalLink size={14} />
                        View Teacher File
                      </a>
                    ) : null}

                    {mySubmission?.fileUrl ? (
                      <a
                        href={`${FILE_BASE_URL}/${mySubmission.fileUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ ...styles.linkChip, background: "#ecfdf5", color: "#15803d" }}
                      >
                        <ExternalLink size={14} />
                        View My Submission
                      </a>
                    ) : null}
                  </div>

                  <div style={styles.uploadBox}>
                    <div style={styles.uploadHelp}>
                      <Sparkles size={16} />
                      Upload once, or re-submit before review if the teacher allows changes.
                    </div>

                    <div style={styles.uploadRow}>
                      <input
                        type="file"
                        onChange={(event) =>
                          setSelectedFiles((previous) => ({
                            ...previous,
                            [assignment._id]: event.target.files?.[0] || null,
                          }))
                        }
                        style={styles.fileInput}
                      />
                      <button
                        type="button"
                        onClick={() => handleUpload(assignment._id)}
                        style={styles.uploadButton}
                        disabled={submittingId === assignment._id}
                      >
                        <FileUp size={16} />
                        {submittingId === assignment._id ? "Uploading..." : "Upload Work"}
                      </button>
                    </div>
                  </div>

                  {mySubmission?.feedback ? (
                    <div style={styles.feedbackBox}>
                      <strong>Teacher feedback</strong>
                      <div style={{ marginTop: "6px", color: "#475569", lineHeight: 1.65 }}>
                        {mySubmission.feedback}
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "calc(100vh - 104px)",
    padding: "26px clamp(16px, 3vw, 34px) 40px",
    background:
      "radial-gradient(circle at top right, rgba(15,118,110,0.08), transparent 28%), linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%)",
  },
  hero: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
    padding: "32px",
    borderRadius: "32px",
    background: "linear-gradient(135deg, #0f172a 0%, #123c6b 50%, #0f766e 100%)",
    color: "#fff",
    boxShadow: "0 28px 60px rgba(15, 23, 42, 0.18)",
    marginBottom: "24px",
  },
  heroBadge: {
    display: "inline-flex",
    padding: "8px 12px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.12)",
    fontSize: "12px",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    fontWeight: 800,
  },
  heroTitle: {
    margin: "14px 0 12px 0",
    fontSize: "clamp(34px, 5vw, 56px)",
    lineHeight: 1.02,
  },
  heroText: {
    margin: 0,
    color: "rgba(255,255,255,0.82)",
    lineHeight: 1.75,
    fontSize: "15px",
  },
  heroPanel: {
    display: "grid",
    gap: "12px",
    alignContent: "start",
  },
  heroMetric: {
    padding: "18px 20px",
    borderRadius: "20px",
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.12)",
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
  },
  card: {
    background: "rgba(255,255,255,0.96)",
    borderRadius: "28px",
    padding: "24px",
    border: "1px solid rgba(148,163,184,0.14)",
    boxShadow: "0 22px 44px rgba(15, 23, 42, 0.08)",
  },
  sectionHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "18px",
  },
  sectionKicker: {
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: "#2563eb",
    fontWeight: 800,
    marginBottom: "6px",
  },
  sectionTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "28px",
  },
  iconBadge: {
    width: "44px",
    height: "44px",
    borderRadius: "14px",
    display: "grid",
    placeItems: "center",
    background: "#eff6ff",
    color: "#1d4ed8",
  },
  list: {
    display: "grid",
    gap: "16px",
  },
  assignmentCard: {
    padding: "20px",
    borderRadius: "22px",
    background: "#f8fbff",
    border: "1px solid rgba(148,163,184,0.14)",
    display: "grid",
    gap: "14px",
  },
  assignmentTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "14px",
    flexWrap: "wrap",
  },
  assignmentTitle: {
    fontSize: "24px",
    fontWeight: 800,
    color: "#0f172a",
  },
  assignmentMeta: {
    color: "#64748b",
    marginTop: "6px",
    lineHeight: 1.6,
  },
  assignmentText: {
    margin: 0,
    color: "#475569",
    lineHeight: 1.7,
  },
  statusBadge: (status) => ({
    display: "inline-flex",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 800,
    background:
      status === "Checked"
        ? "#dcfce7"
        : status === "Submitted" || status === "Re-submitted"
        ? "#dbeafe"
        : "#fef3c7",
    color:
      status === "Checked"
        ? "#166534"
        : status === "Submitted" || status === "Re-submitted"
        ? "#1d4ed8"
        : "#b45309",
  }),
  metaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "12px",
  },
  metaItem: {
    padding: "14px 16px",
    borderRadius: "18px",
    background: "#fff",
    border: "1px solid rgba(148,163,184,0.14)",
    display: "grid",
    gap: "8px",
    color: "#64748b",
  },
  linkRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  linkChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 14px",
    borderRadius: "999px",
    textDecoration: "none",
    background: "#eef2ff",
    color: "#1d4ed8",
    fontWeight: 700,
    fontSize: "13px",
  },
  uploadBox: {
    display: "grid",
    gap: "12px",
    padding: "16px",
    borderRadius: "18px",
    background: "#fff",
    border: "1px dashed rgba(37,99,235,0.22)",
  },
  uploadHelp: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#1d4ed8",
    fontSize: "13px",
  },
  uploadRow: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  fileInput: {
    flex: "1 1 240px",
    minWidth: "220px",
  },
  uploadButton: {
    border: "none",
    borderRadius: "16px",
    padding: "13px 16px",
    background: "linear-gradient(135deg, #0f766e, #2563eb)",
    color: "#fff",
    fontWeight: 800,
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
  },
  feedbackBox: {
    padding: "16px",
    borderRadius: "18px",
    background: "#ecfdf5",
    border: "1px solid #bbf7d0",
    color: "#166534",
  },
  emptyState: {
    padding: "20px",
    borderRadius: "18px",
    background: "#f8fafc",
    border: "1px dashed rgba(148,163,184,0.26)",
    color: "#64748b",
  },
};

export default AssignmentList;
