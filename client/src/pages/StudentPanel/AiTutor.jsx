import { useMemo, useState, useRef, useEffect } from "react";
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
  Plus,
  Menu,
  ChevronDown,
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
  const [showModeMenu, setShowModeMenu] = useState(false);
  const chatEndRef = useRef(null);

  const currentMode = tutorModes.find((mode) => mode.id === selectedMode) || tutorModes[0];
  const canSend = useMemo(
    () => (question.trim().length > 2 || file) && !loading,
    [file, loading, question]
  );

  // Auto-scroll to latest message
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

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        text:
          "I can guide your student portal: results, exam faults, assignments, quizzes, questions, study vault material, and daily planning. Choose a mode or ask directly.",
        mode: "general",
      },
    ]);
    setQuestion("");
    setFile(null);
  };

  const isEmptyChat = messages.length === 1 && !messages[0].text.includes("What");

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.topBar}>
        <div style={styles.topBarContent}>
          <div style={styles.appLogo}>
            <BrainCircuit size={20} />
            <span>AI Tutor</span>
          </div>
          <button style={styles.newChatButton} onClick={clearChat} title="New conversation">
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={styles.mainContainer}>
        {/* Chat Messages */}
        <div style={styles.chatContainer}>
          {isEmptyChat ? (
            <div style={styles.welcomeSection}>
              <div style={styles.welcomeLogo}>
                <BrainCircuit size={48} />
              </div>
              <h1 style={styles.welcomeTitle}>AI Tutor</h1>
              <p style={styles.welcomeSubtitle}>
                Your personal learning assistant for exam prep, assignments, and more
              </p>

              {/* Mode Selector */}
              <div style={styles.modeGrid}>
                {tutorModes.map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.id}
                      style={styles.modeCard}
                      onClick={() => {
                        setSelectedMode(mode.id);
                        setTimeout(() => {
                          askTutor(mode.prompt, mode.id);
                        }, 0);
                      }}
                    >
                      <Icon size={24} />
                      <span>{mode.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Quick Starter Messages */}
              <div style={styles.starterSection}>
                <p style={styles.starterLabel}>Or try:</p>
                <div style={styles.starterGrid}>
                  {starterMessages.slice(0, 3).map((prompt) => (
                    <button
                      key={prompt}
                      style={styles.starterCard}
                      onClick={() => askTutor(prompt, selectedMode)}
                    >
                      <Sparkles size={16} />
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Mode Indicator */}
              <div style={styles.modeIndicator}>
                <div style={styles.modeBadgeTop}>{currentMode.label}</div>
              </div>

              {/* Messages */}
              <div style={styles.messagesArea}>
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    style={message.role === "user" ? styles.userMessageRow : styles.assistantMessageRow}
                  >
                    {message.role === "assistant" && (
                      <div style={styles.avatarBox}>
                        <BrainCircuit size={20} />
                      </div>
                    )}
                    <div
                      style={
                        message.role === "user"
                          ? styles.userMessageBubble
                          : styles.assistantMessageBubble
                      }
                    >
                      {message.text.split("\n").map((line, lineIndex) => (
                        <p key={`${index}-${lineIndex}`} style={styles.messageText}>
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div style={styles.assistantMessageRow}>
                    <div style={styles.avatarBox}>
                      <BrainCircuit size={20} />
                    </div>
                    <div style={styles.assistantMessageBubble}>
                      <div style={styles.thinkingAnimation}>
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>
            </>
          )}
        </div>

        {/* Input Area */}
        <div style={styles.inputContainer}>
          <form
            style={styles.inputForm}
            onSubmit={(event) => {
              event.preventDefault();
              askTutor();
            }}
          >
            {/* Mode Selector Compact */}
            <div style={styles.compactModeSelector}>
              <div style={styles.modeDropdownWrapper}>
                <button
                  type="button"
                  style={styles.modeDropdownButton}
                  onClick={() => setShowModeMenu(!showModeMenu)}
                >
                  <span style={styles.modeDropdownLabel}>{currentMode.label}</span>
                  <ChevronDown size={16} />
                </button>
                {showModeMenu && (
                  <div style={styles.modeDropdownMenu}>
                    {tutorModes.map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        style={
                          selectedMode === mode.id
                            ? styles.modeDropdownItemActive
                            : styles.modeDropdownItem
                        }
                        onClick={() => {
                          setSelectedMode(mode.id);
                          setShowModeMenu(false);
                        }}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Input Field */}
            <div style={styles.inputBox}>
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && event.ctrlKey && canSend) {
                    event.preventDefault();
                    askTutor();
                  }
                }}
                placeholder={`Ask ${currentMode.label.toLowerCase()}...`}
                style={styles.textarea}
                rows={1}
              />
              <div style={styles.inputActions}>
                <label style={styles.attachBtn} title="Attach file">
                  <ImagePlus size={18} />
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    onChange={(event) => setFile(event.target.files?.[0] || null)}
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

            {/* File Preview */}
            {file && (
              <div style={styles.filePreview}>
                <ImagePlus size={14} />
                <span>{file.name}</span>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  style={styles.fileRemoveBtn}
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

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
  container: {
    display: "flex",
    flexDirection: "column",
    height: "calc(100vh - 64px)",
    background: "#fff",
    overflow: "hidden",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    borderBottom: "1px solid #e5e5e5",
    background: "#fff",
    height: "56px",
  },
  topBarContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  appLogo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "18px",
    fontWeight: "bold",
    color: "#0f172a",
  },
  newChatButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    background: "#f9fafb",
    cursor: "pointer",
    color: "#6b7280",
    transition: "all 0.2s ease",
  },
  mainContainer: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    overflow: "hidden",
  },
  chatContainer: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    padding: "20px",
  },
  welcomeSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    textAlign: "center",
    gap: "32px",
    paddingBottom: "60px",
  },
  welcomeLogo: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #1d4ed8, #0f766e)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
  },
  welcomeTitle: {
    fontSize: "32px",
    fontWeight: "bold",
    margin: 0,
    color: "#0f172a",
  },
  welcomeSubtitle: {
    fontSize: "16px",
    color: "#6b7280",
    margin: 0,
    maxWidth: "400px",
  },
  modeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "12px",
    width: "100%",
    maxWidth: "800px",
  },
  modeCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    padding: "20px 16px",
    borderRadius: "8px",
    border: "1px solid #e5e5e5",
    background: "#f9fafb",
    cursor: "pointer",
    transition: "all 0.2s ease",
    color: "#374151",
    fontWeight: "600",
    fontSize: "14px",
  },
  starterSection: {
    display: "grid",
    gap: "16px",
    width: "100%",
    maxWidth: "800px",
  },
  starterLabel: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#6b7280",
    margin: 0,
  },
  starterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "12px",
  },
  starterCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    padding: "14px 16px",
    borderRadius: "8px",
    border: "1px solid #e5e5e5",
    background: "#f9fafb",
    cursor: "pointer",
    color: "#374151",
    fontSize: "14px",
    textAlign: "left",
    transition: "all 0.2s ease",
    flexWrap: "wrap",
  },
  modeIndicator: {
    textAlign: "center",
    marginBottom: "20px",
    paddingBottom: "16px",
    borderBottom: "1px solid #e5e5e5",
  },
  modeBadgeTop: {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: "16px",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontSize: "12px",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  messagesArea: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    flex: 1,
  },
  userMessageRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px",
  },
  assistantMessageRow: {
    display: "flex",
    justifyContent: "flex-start",
    gap: "8px",
  },
  avatarBox: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #1d4ed8, #0f766e)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    flexShrink: 0,
    marginTop: "2px",
  },
  userMessageBubble: {
    maxWidth: "70%",
    padding: "12px 16px",
    borderRadius: "12px",
    background: "#1d4ed8",
    color: "#fff",
    lineHeight: "1.5",
    wordBreak: "break-word",
  },
  assistantMessageBubble: {
    maxWidth: "70%",
    padding: "12px 16px",
    borderRadius: "12px",
    background: "#f1f5f9",
    color: "#0f172a",
    lineHeight: "1.5",
    wordBreak: "break-word",
    border: "1px solid #e2e8f0",
  },
  messageText: {
    margin: "0 0 8px 0",
    whiteSpace: "pre-wrap",
    fontSize: "15px",
  },
  thinkingAnimation: {
    display: "flex",
    gap: "4px",
    alignItems: "center",
    height: "20px",
  },
  inputContainer: {
    padding: "16px 20px 24px",
    background: "#fff",
    borderTop: "1px solid #e5e5e5",
  },
  inputForm: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    maxWidth: "900px",
    margin: "0 auto",
    width: "100%",
  },
  compactModeSelector: {
    display: "flex",
    gap: "8px",
  },
  modeDropdownWrapper: {
    position: "relative",
    width: "fit-content",
  },
  modeDropdownButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    background: "#f9fafb",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    color: "#374151",
    transition: "all 0.2s ease",
  },
  modeDropdownLabel: {
    fontSize: "13px",
  },
  modeDropdownMenu: {
    position: "absolute",
    top: "100%",
    left: 0,
    marginTop: "4px",
    background: "#fff",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    boxShadow: "0 10px 15px rgba(0, 0, 0, 0.1)",
    zIndex: 10,
    minWidth: "200px",
  },
  modeDropdownItem: {
    display: "block",
    width: "100%",
    padding: "10px 14px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    textAlign: "left",
    fontSize: "14px",
    color: "#374151",
    transition: "background 0.15s ease",
  },
  modeDropdownItemActive: {
    display: "block",
    width: "100%",
    padding: "10px 14px",
    border: "none",
    background: "#eff6ff",
    cursor: "pointer",
    textAlign: "left",
    fontSize: "14px",
    color: "#1d4ed8",
    fontWeight: "600",
  },
  inputBox: {
    display: "flex",
    gap: "8px",
    alignItems: "flex-end",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    background: "#fff",
    padding: "8px",
    transition: "border-color 0.2s ease",
  },
  textarea: {
    flex: 1,
    border: "none",
    outline: "none",
    padding: "10px 12px",
    fontSize: "15px",
    fontFamily: "inherit",
    resize: "none",
    maxHeight: "150px",
    minHeight: "44px",
    background: "transparent",
  },
  inputActions: {
    display: "flex",
    gap: "4px",
    alignItems: "center",
  },
  attachBtn: {
    width: "36px",
    height: "36px",
    borderRadius: "6px",
    background: "#f9fafb",
    border: "1px solid #e5e5e5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#6b7280",
    transition: "all 0.2s ease",
  },
  sendBtn: {
    width: "36px",
    height: "36px",
    borderRadius: "6px",
    background: "#1d4ed8",
    border: "none",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "background 0.2s ease",
  },
  sendBtnDisabled: {
    width: "36px",
    height: "36px",
    borderRadius: "6px",
    background: "#e5e7eb",
    border: "none",
    color: "#9ca3af",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "not-allowed",
  },
  filePreview: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    borderRadius: "6px",
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    fontSize: "13px",
    color: "#1d4ed8",
    fontWeight: "600",
  },
  fileRemoveBtn: {
    marginLeft: "auto",
    border: "none",
    background: "transparent",
    color: "#1d4ed8",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0",
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
  contextStat: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    color: "#475569",
    fontSize: "13px",
  },
};

export default AiTutor;
