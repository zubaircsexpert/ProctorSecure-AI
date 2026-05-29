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
<<<<<<< HEAD
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
=======
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
>>>>>>> 8c8e10086dccce67ae63b729b88e186aeb63b115

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

<<<<<<< HEAD
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
=======
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
>>>>>>> 8c8e10086dccce67ae63b729b88e186aeb63b115
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
<<<<<<< HEAD
                onKeyDown={(event) => {
                  if (event.key === "Enter" && event.ctrlKey && canSend) {
                    event.preventDefault();
                    askTutor();
                  }
                }}
                placeholder={`Ask ${currentMode.label.toLowerCase()}...`}
                style={styles.textarea}
                rows={1}
=======
                placeholder={`Message AI Tutor about ${currentMode.label.toLowerCase()}...`}
                style={styles.input}
                rows={2}
>>>>>>> 8c8e10086dccce67ae63b729b88e186aeb63b115
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
<<<<<<< HEAD
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
=======
  page: {
    minHeight: "calc(100vh - 104px)",
    padding: "16px clamp(12px, 2vw, 24px) 24px",
    background: "#f7f7f8",
    color: "#0f172a",
  },
>>>>>>> 8c8e10086dccce67ae63b729b88e186aeb63b115
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
<<<<<<< HEAD
=======
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
>>>>>>> 8c8e10086dccce67ae63b729b88e186aeb63b115
  contextStat: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    color: "rgba(255,255,255,0.78)",
    fontSize: "13px",
  },
<<<<<<< HEAD
=======
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
>>>>>>> 8c8e10086dccce67ae63b729b88e186aeb63b115
};

export default AiTutor;
