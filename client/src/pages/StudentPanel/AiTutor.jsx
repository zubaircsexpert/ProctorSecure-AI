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
      <section style={styles.workspace}>
        <aside style={styles.sidePanel}>
          <div style={styles.brandBlock}>
            <div style={styles.brandIcon}><BrainCircuit size={22} /></div>
            <div>
              <strong>AI Tutor</strong>
              <span>Chat with portal context</span>
            </div>
          </div>

          <div style={styles.newChatButton}>New study chat</div>

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
              <h1 style={styles.chatTitle}>How can I help with your study work?</h1>
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
                placeholder={`Message AI Tutor about ${currentMode.label.toLowerCase()}...`}
                style={styles.input}
                rows={2}
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
    padding: "16px clamp(12px, 2vw, 24px) 24px",
    background: "#f7f7f8",
    color: "#0f172a",
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
    gridTemplateColumns: "280px minmax(0, 1fr)",
    gap: "16px",
    alignItems: "stretch",
    minHeight: "calc(100vh - 136px)",
  },
  sidePanel: {
    display: "grid",
    gap: "12px",
    alignSelf: "stretch",
    alignContent: "start",
    padding: "16px",
    borderRadius: "14px",
    background: "#111827",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  brandBlock: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    paddingBottom: "10px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  brandIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,0.1)",
  },
  newChatButton: {
    padding: "11px 12px",
    borderRadius: "10px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    fontWeight: 900,
  },
  panelTitle: {
    fontSize: "12px",
    fontWeight: 900,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.66)",
  },
  modeList: {
    display: "grid",
    gap: "8px",
  },
  modeButton: {
    border: "1px solid transparent",
    background: "transparent",
    borderRadius: "10px",
    padding: "11px 12px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "rgba(255,255,255,0.86)",
    fontWeight: 800,
    cursor: "pointer",
    textAlign: "left",
  },
  modeButtonActive: {
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.12)",
    borderRadius: "10px",
    padding: "11px 12px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#fff",
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
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.06)",
    borderRadius: "10px",
    padding: "10px 11px",
    display: "flex",
    gap: "8px",
    alignItems: "flex-start",
    color: "rgba(255,255,255,0.84)",
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
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  contextStat: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    color: "rgba(255,255,255,0.78)",
    fontSize: "13px",
  },
  chatPanel: {
    display: "grid",
    gridTemplateRows: "auto minmax(0, 1fr) auto",
    gap: "0",
    minWidth: 0,
    padding: 0,
    borderRadius: "14px",
    background: "#fff",
    border: "1px solid rgba(148,163,184,0.18)",
    boxShadow: "0 18px 38px rgba(15,23,42,0.07)",
    overflow: "hidden",
  },
  chatHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "flex-start",
    borderBottom: "1px solid rgba(148,163,184,0.16)",
    padding: "16px 20px",
  },
  modeEyebrow: {
    color: "#2563eb",
    fontWeight: 900,
    fontSize: "12px",
    textTransform: "uppercase",
  },
  chatTitle: {
    margin: "5px 0 0",
    fontSize: "24px",
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
    alignContent: "start",
    height: "auto",
    minHeight: 0,
    overflowY: "auto",
    padding: "22px min(7vw, 78px)",
    background: "#fff",
  },
  userBubble: {
    justifySelf: "end",
    maxWidth: "780px",
    padding: "13px 15px",
    borderRadius: "14px",
    background: "#2563eb",
    color: "#fff",
    lineHeight: 1.6,
  },
  assistantBubble: {
    justifySelf: "start",
    maxWidth: "820px",
    padding: "13px 15px",
    borderRadius: "14px",
    background: "#f7f7f8",
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
    padding: "14px min(7vw, 78px) 18px",
    borderTop: "1px solid rgba(148,163,184,0.12)",
    background: "#fff",
  },
  composer: {
    display: "grid",
    gap: "8px",
  },
  input: {
    border: "1px solid rgba(148,163,184,0.24)",
    borderRadius: "16px",
    padding: "13px 14px",
    fontSize: "15px",
    fontFamily: "inherit",
    resize: "vertical",
    minHeight: "58px",
    maxHeight: "150px",
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
    borderRadius: "14px",
    background: "#f8fafc",
    border: "1px solid rgba(148,163,184,0.22)",
    color: "#1d4ed8",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
  },
  sendButton: {
    border: "none",
    borderRadius: "14px",
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
