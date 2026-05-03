import { useMemo, useState } from "react";
import { BrainCircuit, Send, Sparkles } from "lucide-react";
import API from "../../services/api";

const quickPrompts = [
  "Help me understand my assignment requirements.",
  "Make a revision plan for my next AI exam.",
  "How can I improve my quiz score?",
  "What should I check before starting an online exam?",
];

function AiTutor() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Ask me about assignments, quizzes, AI exams, results, or study planning. I will give you a short action plan.",
    },
  ]);
  const [loading, setLoading] = useState(false);

  const canSend = useMemo(() => question.trim().length > 2 && !loading, [loading, question]);

  const askTutor = async (text = question) => {
    const cleanText = text.trim();
    if (!cleanText) return;

    setQuestion("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", text: cleanText }]);

    try {
      const response = await API.post("/api/ai-tutor/ask", { question: cleanText });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: response.data?.answer || "I prepared a study plan for you." },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: error.response?.data?.message || "Tutor is unavailable right now. Try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div>
          <div style={styles.kicker}>AI Tutor</div>
          <h1 style={styles.title}>Personal study support</h1>
          <p style={styles.text}>
            Get quick help for assignments, quiz preparation, AI exam readiness, and result improvement.
          </p>
        </div>
        <div style={styles.heroIcon}><BrainCircuit size={42} /></div>
      </section>

      <section style={styles.layout}>
        <div style={styles.card}>
          <div style={styles.promptGrid}>
            {quickPrompts.map((prompt) => (
              <button key={prompt} type="button" style={styles.promptButton} onClick={() => askTutor(prompt)}>
                <Sparkles size={15} />
                {prompt}
              </button>
            ))}
          </div>

          <div style={styles.chatWindow}>
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                style={message.role === "user" ? styles.userBubble : styles.assistantBubble}
              >
                {message.text.split("\n").map((line) => (
                  <p key={line} style={{ margin: "0 0 8px" }}>{line}</p>
                ))}
              </div>
            ))}
            {loading ? <div style={styles.assistantBubble}>Preparing a focused answer...</div> : null}
          </div>

          <form
            style={styles.inputRow}
            onSubmit={(event) => {
              event.preventDefault();
              askTutor();
            }}
          >
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Type your study question..."
              style={styles.input}
            />
            <button type="submit" style={styles.sendButton} disabled={!canSend}>
              <Send size={18} />
              Ask
            </button>
          </form>
        </div>
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
  title: { margin: "14px 0 10px", fontSize: "clamp(34px, 5vw, 56px)", lineHeight: 1.02 },
  text: { margin: 0, color: "rgba(255,255,255,0.82)", lineHeight: 1.7 },
  heroIcon: {
    width: "86px",
    height: "86px",
    borderRadius: "24px",
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,0.12)",
    flexShrink: 0,
  },
  layout: { maxWidth: "1040px", margin: "0 auto" },
  card: {
    background: "#fff",
    borderRadius: "26px",
    border: "1px solid rgba(148,163,184,0.16)",
    boxShadow: "0 22px 44px rgba(15,23,42,0.08)",
    padding: "22px",
  },
  promptGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "10px",
    marginBottom: "16px",
  },
  promptButton: {
    border: "1px solid rgba(37,99,235,0.16)",
    background: "#f8fbff",
    borderRadius: "16px",
    padding: "12px 14px",
    color: "#0f172a",
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    textAlign: "left",
  },
  chatWindow: {
    display: "grid",
    gap: "12px",
    maxHeight: "440px",
    overflowY: "auto",
    padding: "16px",
    borderRadius: "20px",
    background: "#f8fafc",
    border: "1px solid rgba(148,163,184,0.14)",
  },
  userBubble: {
    justifySelf: "end",
    maxWidth: "760px",
    padding: "14px 16px",
    borderRadius: "18px",
    background: "#2563eb",
    color: "#fff",
    lineHeight: 1.6,
  },
  assistantBubble: {
    justifySelf: "start",
    maxWidth: "760px",
    padding: "14px 16px",
    borderRadius: "18px",
    background: "#fff",
    color: "#334155",
    border: "1px solid rgba(148,163,184,0.16)",
    lineHeight: 1.6,
  },
  inputRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "10px",
    marginTop: "14px",
  },
  input: {
    border: "1px solid rgba(148,163,184,0.22)",
    borderRadius: "16px",
    padding: "14px 16px",
    fontSize: "15px",
    fontFamily: "inherit",
  },
  sendButton: {
    border: "none",
    borderRadius: "16px",
    padding: "0 18px",
    background: "linear-gradient(135deg, #1d4ed8, #0f766e)",
    color: "#fff",
    fontWeight: 900,
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
  },
};

export default AiTutor;
