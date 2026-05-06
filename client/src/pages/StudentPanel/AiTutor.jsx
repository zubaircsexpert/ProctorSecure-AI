import { useMemo, useState } from "react";
import {
  BookOpenCheck,
  BrainCircuit,
  ClipboardCheck,
  FileText,
  GraduationCap,
  ImagePlus,
  LineChart,
  ListChecks,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import API from "../../services/api";

const tutorModes = [
  {
    id: "general",
    label: "Portal Guide",
    icon: BrainCircuit,
    prompt: "Analyze my student portal and tell me what I should focus on today.",
  },
  {
    id: "results",
    label: "Result Analysis",
    icon: LineChart,
    prompt: "Analyze my exam and quiz results. Tell me missed questions, weak areas, and proctoring faults.",
  },
  {
    id: "assignment",
    label: "Assignment Help",
    icon: FileText,
    prompt: "Help me understand my pending assignment and make a clean answer outline.",
  },
  {
    id: "quiz",
    label: "Quiz Coach",
    icon: ClipboardCheck,
    prompt: "Make quiz practice questions and explain how to improve my score.",
  },
  {
    id: "question",
    label: "Question Solver",
    icon: BookOpenCheck,
    prompt: "Explain this question step by step and show how to choose the correct answer.",
  },
  {
    id: "study",
    label: "Study Plan",
    icon: ListChecks,
    prompt: "Make a practical study plan using my exams, assignments, and study resources.",
  },
];

const starterMessages = [
  "Check my latest result and tell me where I lost marks.",
  "Help me draft this assignment in a professional structure.",
  "Create 10 MCQs from my weak topic and explain answers.",
  "Analyze my quiz mistakes and give a revision plan.",
  "Explain this uploaded question image step by step.",
  "Tell me what is pending in my portal today.",
];

function AiTutor() {
  const [question, setQuestion] = useState("");
  const [selectedMode, setSelectedMode] = useState("general");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text:
        "I can guide your student portal: results, exam faults, assignments, quizzes, questions, study vault material, and daily planning. Choose a mode or ask directly.",
      mode: "general",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [contextSummary, setContextSummary] = useState(null);

  const currentMode = tutorModes.find((mode) => mode.id === selectedMode) || tutorModes[0];
  const canSend = useMemo(
    () => (question.trim().length > 2 || file) && !loading,
    [file, loading, question]
  );

  const askTutor = async (text = question, mode = selectedMode) => {
    const cleanText = text.trim() || (file ? "Please analyze this uploaded file/image." : "");
    if (!cleanText && !file) return;

    setQuestion("");
    setLoading(true);
    const selectedFile = file;
    setFile(null);
    const modeLabel = tutorModes.find((item) => item.id === mode)?.label || "AI Tutor";

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        text: selectedFile ? `${cleanText}\n\nAttached: ${selectedFile.name}` : cleanText,
        mode,
        modeLabel,
      },
    ]);

    try {
      const payload = new FormData();
      payload.append("question", cleanText);
      payload.append("mode", mode);
      if (selectedFile) payload.append("file", selectedFile);

      const response = await API.post("/api/ai-tutor/ask", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setContextSummary(response.data?.contextSummary || null);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: response.data?.answer || "I prepared a focused student plan for you.",
          mode: response.data?.mode,
          modeLabel,
          tutorMode: response.data?.tutorMode || mode,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text:
            error.response?.data?.message ||
            "Tutor is unavailable right now. Try again in a moment.",
          mode: "error",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <section style={styles.header}>
        <div>
          <div style={styles.kicker}>
            <BrainCircuit size={16} />
            AI Tutor
          </div>
          <h1 style={styles.title}>Student AI workspace</h1>
          <p style={styles.subtitle}>
            Ask for exam analysis, assignment help, quiz practice, question explanations, or a full
            study plan from your portal context.
          </p>
        </div>

        <div style={styles.headerStats}>
          <Stat label="Mode" value={currentMode.label} />
          <Stat label="Context" value={contextSummary ? "Loaded" : "Ready"} />
          <Stat label="Attachment" value={file ? "Selected" : "Optional"} />
        </div>
      </section>

      <section style={styles.workspace}>
        <aside style={styles.sidePanel}>
          <div style={styles.panelTitle}>Tutor Modes</div>
          <div style={styles.modeList}>
            {tutorModes.map((mode) => {
              const Icon = mode.icon;
              const active = selectedMode === mode.id;

              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setSelectedMode(mode.id)}
                  style={active ? styles.modeButtonActive : styles.modeButton}
                >
                  <Icon size={18} />
                  <span>{mode.label}</span>
                </button>
              );
            })}
          </div>

          <div style={styles.panelBlock}>
            <div style={styles.panelTitle}>Quick Ask</div>
            <div style={styles.quickList}>
              {starterMessages.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  style={styles.quickButton}
                  onClick={() => askTutor(prompt, selectedMode)}
                  disabled={loading}
                >
                  <Sparkles size={14} />
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.contextBox}>
            <div style={styles.panelTitle}>Portal Context</div>
            <ContextStat label="Assignments" value={contextSummary?.assignments ?? "-"} />
            <ContextStat label="Pending" value={contextSummary?.pendingAssignments ?? "-"} />
            <ContextStat label="Results" value={contextSummary?.results ?? "-"} />
            <ContextStat label="Assessments" value={contextSummary?.assessments ?? "-"} />
            <ContextStat label="Questions" value={contextSummary?.questions ?? "-"} />
            <ContextStat label="Resources" value={contextSummary?.resources ?? "-"} />
          </div>
        </aside>

        <main style={styles.chatPanel}>
          <div style={styles.chatHeader}>
            <div>
              <div style={styles.modeEyebrow}>{currentMode.label}</div>
              <h2 style={styles.chatTitle}>{currentMode.prompt}</h2>
            </div>
            <div style={styles.statusPill}>{loading ? "Thinking" : "Ready"}</div>
          </div>

          <div style={styles.chatWindow}>
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                style={message.role === "user" ? styles.userBubble : styles.assistantBubble}
              >
                <span style={styles.modeBadge(message.mode || message.tutorMode)}>
                  {message.modeLabel ||
                    (message.mode === "ai"
                      ? "Live AI"
                      : message.mode === "error"
                      ? "System"
                      : "Context AI")}
                </span>
                {message.text.split("\n").map((line, lineIndex) => (
                  <p key={`${index}-${lineIndex}`} style={styles.messageLine}>
                    {line}
                  </p>
                ))}
              </div>
            ))}
            {loading ? (
              <div style={styles.assistantBubble}>
                <span style={styles.modeBadge("thinking")}>AI Tutor</span>
                <p style={styles.messageLine}>
                  Reading your portal context and preparing a useful answer...
                </p>
              </div>
            ) : null}
          </div>

          <form
            style={styles.inputRow}
            onSubmit={(event) => {
              event.preventDefault();
              askTutor();
            }}
          >
            <div style={styles.composer}>
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder={`Ask ${currentMode.label.toLowerCase()} anything...`}
                style={styles.input}
                rows={3}
              />
              {file ? (
                <div style={styles.fileChip}>
                  <ImagePlus size={15} />
                  {file.name}
                  <button type="button" onClick={() => setFile(null)} style={styles.clearFileButton}>
                    <X size={14} />
                  </button>
                </div>
              ) : null}
            </div>

            <div style={styles.actionColumn}>
              <label style={styles.attachButton} title="Attach question or assignment file">
                <ImagePlus size={18} />
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                  style={{ display: "none" }}
                />
              </label>
              <button type="submit" style={styles.sendButton} disabled={!canSend}>
                <Send size={18} />
                Ask
              </button>
            </div>
          </form>
        </main>
      </section>
    </div>
  );
}

const Stat = ({ label, value }) => (
  <div style={styles.stat}>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const ContextStat = ({ label, value }) => (
  <div style={styles.contextStat}>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const styles = {
  page: {
    minHeight: "calc(100vh - 104px)",
    padding: "22px clamp(16px, 3vw, 32px) 32px",
    background: "linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%)",
    color: "#0f172a",
  },
  header: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
    gap: "18px",
    alignItems: "stretch",
    marginBottom: "18px",
  },
  kicker: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 11px",
    borderRadius: "8px",
    background: "#e0f2fe",
    color: "#075985",
    textTransform: "uppercase",
    fontSize: "12px",
    fontWeight: 800,
  },
  title: {
    margin: "12px 0 8px",
    fontSize: "36px",
    lineHeight: 1.05,
  },
  subtitle: {
    margin: 0,
    color: "#475569",
    lineHeight: 1.6,
    maxWidth: "820px",
  },
  headerStats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: "10px",
  },
  stat: {
    display: "grid",
    alignContent: "center",
    gap: "6px",
    padding: "14px",
    borderRadius: "8px",
    background: "#fff",
    border: "1px solid rgba(148,163,184,0.18)",
    boxShadow: "0 14px 30px rgba(15,23,42,0.06)",
  },
  workspace: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
    gap: "16px",
    alignItems: "start",
  },
  sidePanel: {
    display: "grid",
    gap: "14px",
    alignSelf: "start",
    padding: "16px",
    borderRadius: "8px",
    background: "#fff",
    border: "1px solid rgba(148,163,184,0.18)",
    boxShadow: "0 18px 38px rgba(15,23,42,0.07)",
  },
  panelTitle: {
    fontSize: "12px",
    fontWeight: 900,
    textTransform: "uppercase",
    color: "#475569",
  },
  modeList: {
    display: "grid",
    gap: "8px",
  },
  modeButton: {
    border: "1px solid rgba(148,163,184,0.22)",
    background: "#f8fafc",
    borderRadius: "8px",
    padding: "11px 12px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#0f172a",
    fontWeight: 800,
    cursor: "pointer",
    textAlign: "left",
  },
  modeButtonActive: {
    border: "1px solid rgba(37,99,235,0.34)",
    background: "#eff6ff",
    borderRadius: "8px",
    padding: "11px 12px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#1d4ed8",
    fontWeight: 900,
    cursor: "pointer",
    textAlign: "left",
  },
  panelBlock: {
    display: "grid",
    gap: "10px",
  },
  quickList: {
    display: "grid",
    gap: "8px",
  },
  quickButton: {
    border: "1px solid rgba(37,99,235,0.14)",
    background: "#f8fbff",
    borderRadius: "8px",
    padding: "10px 11px",
    display: "flex",
    gap: "8px",
    alignItems: "flex-start",
    color: "#334155",
    fontWeight: 700,
    cursor: "pointer",
    textAlign: "left",
    lineHeight: 1.35,
  },
  contextBox: {
    display: "grid",
    gap: "8px",
    padding: "12px",
    borderRadius: "8px",
    background: "#f8fafc",
    border: "1px solid rgba(148,163,184,0.16)",
  },
  contextStat: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    color: "#475569",
    fontSize: "13px",
  },
  chatPanel: {
    display: "grid",
    gap: "12px",
    minWidth: 0,
    padding: "16px",
    borderRadius: "8px",
    background: "#fff",
    border: "1px solid rgba(148,163,184,0.18)",
    boxShadow: "0 18px 38px rgba(15,23,42,0.07)",
  },
  chatHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "flex-start",
    borderBottom: "1px solid rgba(148,163,184,0.18)",
    paddingBottom: "12px",
  },
  modeEyebrow: {
    color: "#2563eb",
    fontWeight: 900,
    fontSize: "12px",
    textTransform: "uppercase",
  },
  chatTitle: {
    margin: "5px 0 0",
    fontSize: "22px",
    lineHeight: 1.25,
  },
  statusPill: {
    padding: "8px 10px",
    borderRadius: "8px",
    background: "#f1f5f9",
    color: "#334155",
    fontWeight: 900,
    fontSize: "12px",
  },
  chatWindow: {
    display: "grid",
    gap: "12px",
    height: "min(54vh, 520px)",
    minHeight: "360px",
    overflowY: "auto",
    padding: "14px",
    borderRadius: "8px",
    background: "#f8fafc",
    border: "1px solid rgba(148,163,184,0.14)",
  },
  userBubble: {
    justifySelf: "end",
    maxWidth: "780px",
    padding: "13px 15px",
    borderRadius: "8px",
    background: "#2563eb",
    color: "#fff",
    lineHeight: 1.6,
  },
  assistantBubble: {
    justifySelf: "start",
    maxWidth: "820px",
    padding: "13px 15px",
    borderRadius: "8px",
    background: "#fff",
    color: "#334155",
    border: "1px solid rgba(148,163,184,0.16)",
    lineHeight: 1.6,
  },
  messageLine: {
    margin: "0 0 8px",
    whiteSpace: "pre-wrap",
  },
  inputRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: "10px",
  },
  composer: {
    display: "grid",
    gap: "8px",
  },
  input: {
    border: "1px solid rgba(148,163,184,0.24)",
    borderRadius: "8px",
    padding: "13px 14px",
    fontSize: "15px",
    fontFamily: "inherit",
    resize: "vertical",
    minHeight: "86px",
  },
  fileChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    width: "fit-content",
    borderRadius: "8px",
    background: "#eff6ff",
    color: "#1d4ed8",
    padding: "8px 10px",
    fontWeight: 800,
    fontSize: "12px",
  },
  clearFileButton: {
    border: "none",
    background: "transparent",
    color: "#1d4ed8",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    padding: 0,
  },
  actionColumn: {
    display: "grid",
    gridTemplateColumns: "48px minmax(84px, 92px)",
    gap: "8px",
    alignItems: "stretch",
  },
  attachButton: {
    width: "48px",
    minHeight: "48px",
    borderRadius: "8px",
    background: "#f8fafc",
    border: "1px solid rgba(148,163,184,0.22)",
    color: "#1d4ed8",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
  },
  sendButton: {
    border: "none",
    borderRadius: "8px",
    padding: "0 16px",
    background: "linear-gradient(135deg, #1d4ed8, #0f766e)",
    color: "#fff",
    fontWeight: 900,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    cursor: "pointer",
  },
  modeBadge: (mode) => ({
    display: "inline-flex",
    width: "fit-content",
    marginBottom: "8px",
    borderRadius: "8px",
    padding: "5px 8px",
    background: mode === "ai" ? "#dcfce7" : mode === "error" ? "#fee2e2" : "#fef3c7",
    color: mode === "ai" ? "#166534" : mode === "error" ? "#991b1b" : "#92400e",
    fontWeight: 900,
    fontSize: "11px",
    textTransform: "uppercase",
  }),
};

export default AiTutor;
