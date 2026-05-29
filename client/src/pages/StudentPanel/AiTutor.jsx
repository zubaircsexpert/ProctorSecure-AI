import { useMemo, useState, useRef, useEffect } from "react";
import {
  BookOpenCheck,
  BrainCircuit,
  ClipboardCheck,
  FileText,
  LineChart,
  ListChecks,
  Send,
  Sparkles,
  X,
  Plus,
  ChevronDown,
  TrendingUp,
  AlertCircle,
  CheckCircle,
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
      text: "Hi! I'm your AI tutor. I can help you analyze results, understand assignments, solve questions, create study plans, and provide daily guidance. What would you like help with?",
      mode: "general",
      isWelcome: true,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [contextSummary, setContextSummary] = useState(null);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const chatEndRef = useRef(null);

  const currentMode = tutorModes.find((mode) => mode.id === selectedMode) || tutorModes[0];
  const canSend = useMemo(
    () => (question.trim().length > 2 || file) && !loading,
    [file, loading, question]
  );

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const askTutor = async (text = question, mode = selectedMode) => {
    const cleanText = text.trim() || (file ? "Please analyze this uploaded file/image." : "");
    if (!cleanText && !file) return;

    setQuestion("");
    setLoading(true);
    const selectedFile = file;
    setFile(null);
    const modeLabel = tutorModes.find((item) => item.id === mode)?.label || "AI Tutor";

    setMessages((prev) =>
      prev.filter((m) => !m.isWelcome).length === 0 ? prev.slice(1) : prev
    );

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
          modeLabel: "System",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        text: "Hi! I'm your AI tutor. I can help you analyze results, understand assignments, solve questions, create study plans, and provide daily guidance. What would you like help with?",
        mode: "general",
        isWelcome: true,
      },
    ]);
    setQuestion("");
    setFile(null);
  };

  const isEmptyChat = messages.length === 1 && messages[0].isWelcome;

  return (
    <div style={styles.page}>
      <section style={styles.workspace}>
        {/* Side Panel */}
        <aside style={styles.sidePanel}>
          <div style={styles.brandBlock}>
            <div style={styles.brandIcon}>
              <BrainCircuit size={22} />
            </div>
            <div>
              <strong style={{ fontSize: "15px" }}>AI Tutor</strong>
              <span style={{ fontSize: "12px", opacity: 0.7 }}>Smart learning assistant</span>
            </div>
          </div>

          <button style={styles.newChatButton} onClick={clearChat}>
            <Plus size={16} style={{ marginRight: "4px" }} /> New Chat
          </button>

          {!isEmptyChat && contextSummary && (
            <div style={styles.contextBox}>
              <div style={styles.panelTitle}>📊 Portal Snapshot</div>
              <ContextStat label="📌 Pending" value={contextSummary?.pendingAssignments ?? 0} />
              <ContextStat label="📝 Assignments" value={contextSummary?.assignments ?? 0} />
              <ContextStat label="📈 Results" value={contextSummary?.results ?? 0} />
              <ContextStat label="📖 Resources" value={contextSummary?.resources ?? 0} />
            </div>
          )}

          <div style={styles.panelTitle}>🎯 Tutor Modes</div>
          <div style={styles.modeList}>
            {tutorModes.map((mode) => {
              const Icon = mode.icon;
              const active = selectedMode === mode.id;
              return (
                <button
                  key={mode.id}
                  style={active ? styles.modeButtonActive : styles.modeButton}
                  onClick={() => {
                    setSelectedMode(mode.id);
                    setShowModeMenu(false);
                  }}
                >
                  <Icon size={16} />
                  <span style={{ fontSize: "13px" }}>{mode.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main Chat Area */}
        <main style={styles.chatPanel}>
          <div style={styles.chatHeader}>
            <div>
              <div style={styles.modeEyebrow}>{currentMode.label}</div>
              <h1 style={styles.chatTitle}>
                {isEmptyChat ? "Welcome to AI Tutor" : "How can I help?"}
              </h1>
            </div>
            <div style={styles.statusPill}>{loading ? "💭 Thinking..." : "✨ Ready"}</div>
          </div>

          <div style={styles.chatWindow}>
            {messages.map((message, index) => (
              <MessageBubble key={`${message.role}-${index}`} message={message} />
            ))}

            {loading && (
              <div style={styles.assistantBubble}>
                <span style={styles.thinkingDots}>
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div style={styles.inputArea}>
            <form
              style={styles.inputForm}
              onSubmit={(e) => {
                e.preventDefault();
                if (canSend) askTutor();
              }}
            >
              <div style={styles.inputRow}>
                <div style={styles.inputBox}>
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.ctrlKey && canSend) {
                        e.preventDefault();
                        askTutor();
                      }
                    }}
                    placeholder={`Ask about ${currentMode.label.toLowerCase()}... (Ctrl+Enter to send)`}
                    style={styles.textarea}
                    rows={2}
                  />
                  <div style={styles.inputActions}>
                    <label style={styles.attachBtn} title="Attach file/image">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                        <path d="M12 3v6m3-3h-6" />
                      </svg>
                      <input
                        type="file"
                        accept="image/*,.pdf,.doc,.docx,.txt"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        style={{ display: "none" }}
                      />
                    </label>
                    <button
                      type="submit"
                      style={canSend ? styles.sendBtn : styles.sendBtnDisabled}
                      disabled={!canSend}
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {file && (
                <div style={styles.fileChip}>
                  <span>📎 {file.name}</span>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    style={styles.fileRemoveBtn}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {isEmptyChat && (
                <div style={styles.starterSection}>
                  <div style={styles.starterLabel}>Quick prompts:</div>
                  <div style={styles.starterGrid}>
                    {starterMessages.map((msg) => (
                      <button
                        key={msg}
                        type="button"
                        style={styles.starterCard}
                        onClick={() => askTutor(msg, selectedMode)}
                      >
                        <Sparkles size={14} />
                        {msg}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          </div>
        </main>
      </section>
    </div>
  );
}

const MessageBubble = ({ message }) => {
  const isUser = message.role === "user";
  const styles_msg = isUser ? messageStyles.userBubble : messageStyles.assistantBubble;

  return (
    <div style={styles_msg}>
      {!isUser && message.modeLabel && (
        <span style={messageStyles.badge}>{message.modeLabel}</span>
      )}
      <div style={messageStyles.content}>
        {message.text.split("\n").map((line, idx) => (
          <p key={idx} style={messageStyles.line}>
            {line}
          </p>
        ))}
      </div>
    </div>
  );
};

const ContextStat = ({ label, value }) => (
  <div style={styles.contextStat}>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const styles = {
  page: {
    minHeight: "calc(100vh - 64px)",
    background: "#f5f7fa",
    color: "#1a202c",
  },
  workspace: {
    display: "grid",
    gridTemplateColumns: "280px 1fr",
    gap: "12px",
    height: "calc(100vh - 64px)",
    padding: "12px",
  },
  sidePanel: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: "16px",
    borderRadius: "12px",
    background: "#1f2937",
    color: "#fff",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    overflowY: "auto",
  },
  brandBlock: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    paddingBottom: "12px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
  },
  brandIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "8px",
    background: "rgba(66, 133, 244, 0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#4285f4",
  },
  newChatButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px",
    borderRadius: "8px",
    background: "rgba(66, 133, 244, 0.3)",
    border: "1px solid rgba(66, 133, 244, 0.5)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
    transition: "all 0.2s ease",
  },
  panelTitle: {
    fontSize: "11px",
    fontWeight: "900",
    textTransform: "uppercase",
    color: "rgba(255, 255, 255, 0.5)",
    marginTop: "4px",
    marginBottom: "8px",
  },
  modeList: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  modeButton: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 12px",
    borderRadius: "8px",
    background: "transparent",
    border: "1px solid transparent",
    color: "rgba(255, 255, 255, 0.7)",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
    transition: "all 0.15s ease",
  },
  modeButtonActive: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 12px",
    borderRadius: "8px",
    background: "rgba(66, 133, 244, 0.2)",
    border: "1px solid rgba(66, 133, 244, 0.4)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "13px",
  },
  contextBox: {
    padding: "12px",
    borderRadius: "8px",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    marginTop: "8px",
  },
  contextStat: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 0",
    fontSize: "13px",
    color: "rgba(255, 255, 255, 0.8)",
  },
  chatPanel: {
    display: "grid",
    gridTemplateRows: "auto 1fr auto",
    gap: "0",
    borderRadius: "12px",
    background: "#fff",
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
    overflow: "hidden",
  },
  chatHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    padding: "16px 20px",
    borderBottom: "1px solid #e2e8f0",
    background: "#f9fafb",
  },
  modeEyebrow: {
    color: "#4285f4",
    fontWeight: "700",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  chatTitle: {
    fontSize: "20px",
    fontWeight: "700",
    margin: "4px 0 0 0",
    color: "#1a202c",
  },
  statusPill: {
    padding: "6px 12px",
    borderRadius: "6px",
    background: "#f0f4f8",
    color: "#4a5568",
    fontWeight: "700",
    fontSize: "12px",
  },
  chatWindow: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    overflowY: "auto",
    padding: "20px",
    background: "#fff",
    alignContent: "flex-start",
  },
  inputArea: {
    borderTop: "1px solid #e2e8f0",
    background: "#f9fafb",
    padding: "16px 20px",
  },
  inputForm: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  inputRow: {
    display: "flex",
    gap: "10px",
  },
  inputBox: {
    display: "flex",
    gap: "8px",
    alignItems: "flex-end",
    borderRadius: "10px",
    border: "1.5px solid #cbd5e1",
    background: "#fff",
    padding: "8px",
    transition: "all 0.2s ease",
    flex: 1,
  },
  textarea: {
    flex: 1,
    border: "none",
    outline: "none",
    padding: "10px 12px",
    fontSize: "14px",
    fontFamily: "inherit",
    resize: "none",
    maxHeight: "120px",
    background: "transparent",
  },
  inputActions: {
    display: "flex",
    gap: "6px",
    alignItems: "center",
  },
  attachBtn: {
    width: "34px",
    height: "34px",
    borderRadius: "6px",
    background: "#f0f4f8",
    border: "1px solid #cbd5e1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#4a5568",
    transition: "all 0.2s ease",
  },
  sendBtn: {
    width: "34px",
    height: "34px",
    borderRadius: "6px",
    background: "#4285f4",
    border: "none",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  sendBtnDisabled: {
    width: "34px",
    height: "34px",
    borderRadius: "6px",
    background: "#e2e8f0",
    border: "none",
    color: "#a0aec0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "not-allowed",
  },
  fileChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    borderRadius: "6px",
    background: "#dbeafe",
    color: "#1e40af",
    fontSize: "13px",
    fontWeight: "600",
  },
  fileRemoveBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "0",
    display: "flex",
    alignItems: "center",
    color: "inherit",
  },
  starterSection: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  starterLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#4a5568",
  },
  starterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "8px",
  },
  starterCard: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    background: "#fff",
    cursor: "pointer",
    color: "#4a5568",
    fontSize: "13px",
    fontWeight: "500",
    transition: "all 0.2s ease",
    textAlign: "left",
  },
  thinkingDots: {
    display: "flex",
    gap: "4px",
    alignItems: "center",
  },
};

const messageStyles = {
  userBubble: {
    alignSelf: "flex-end",
    maxWidth: "75%",
    padding: "12px 16px",
    borderRadius: "12px",
    background: "#4285f4",
    color: "#fff",
    wordWrap: "break-word",
  },
  assistantBubble: {
    alignSelf: "flex-start",
    maxWidth: "85%",
    padding: "12px 16px",
    borderRadius: "12px",
    background: "#f0f4f8",
    color: "#1a202c",
    border: "1px solid #cbd5e1",
    wordWrap: "break-word",
  },
  badge: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "4px",
    background: "rgba(66, 133, 244, 0.15)",
    color: "#2563eb",
    fontSize: "11px",
    fontWeight: "700",
    marginBottom: "6px",
    textTransform: "uppercase",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  line: {
    margin: "0",
    lineHeight: "1.5",
    whiteSpace: "pre-wrap",
  },
};

export default AiTutor;
