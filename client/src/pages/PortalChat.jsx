import { useEffect, useRef, useState } from "react";
import { Image, MessageCircle, Paperclip, Send, Trash2, Video } from "lucide-react";
import API from "../services/api";
import { getAuthUser } from "../utils/authSession";

const buildMediaUrl = (fileUrl) => {
  if (!fileUrl) return "";
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
  const cleanPath = String(fileUrl).replace(/^\/+/, "");
  return `${API.defaults.baseURL}/${cleanPath}`;
};

const PortalChat = () => {
  const user = getAuthUser();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  const fetchMessages = async ({ silent = false } = {}) => {
    try {
      const response = await API.get("/api/chat/messages");
      setMessages(Array.isArray(response.data) ? response.data : []);
      if (!silent) setNotice("");
    } catch (error) {
      console.error("Chat fetch failed", error);
      if (!silent) setNotice(error.response?.data?.message || "Chat could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const timer = window.setInterval(() => fetchMessages({ silent: true }), 5000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const sendMessage = async () => {
    if (!text.trim() && !file) {
      setNotice("Type a message or attach a picture/video.");
      return;
    }

    try {
      setSending(true);
      const formData = new FormData();
      formData.append("text", text.trim());
      if (file) formData.append("file", file);

      await API.post("/api/chat/messages", formData);
      setText("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await fetchMessages({ silent: true });
    } catch (error) {
      console.error("Chat send failed", error);
      setNotice(error.response?.data?.message || "Message could not be sent.");
    } finally {
      setSending(false);
    }
  };

  const clearChat = async () => {
    if (!window.confirm("Clear chat from everyone? This will remove all messages and media.")) return;

    try {
      await API.delete("/api/chat/messages");
      setMessages([]);
      setNotice("Chat cleared from everyone.");
    } catch (error) {
      console.error("Chat clear failed", error);
      setNotice(error.response?.data?.message || "Chat could not be cleared.");
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <div style={styles.brandIcon}>
          <MessageCircle size={28} />
        </div>
        <div style={styles.kicker}>Portal Chat</div>
        <h1 style={styles.title}>Class messages in one place</h1>
        <p style={styles.copy}>
          Send text, pictures, and videos between teachers and students. Use clear chat when the
          room needs a fresh start.
        </p>

        <div style={styles.statusBox}>
          <span>Signed in as</span>
          <strong>{user?.name || user?.email || "Portal user"}</strong>
          <small>{user?.role || "user"}</small>
        </div>

        <button type="button" onClick={clearChat} style={styles.clearButton}>
          <Trash2 size={18} />
          Clear chat from everyone
        </button>
      </aside>

      <main style={styles.chatPanel}>
        <header style={styles.chatHeader}>
          <div>
            <div style={styles.kicker}>Shared room</div>
            <h2 style={styles.chatTitle}>Messages</h2>
          </div>
          <div style={styles.mediaHint}>
            <Image size={17} />
            <Video size={17} />
            <span>Pictures & videos allowed</span>
          </div>
        </header>

        {notice ? <div style={styles.notice}>{notice}</div> : null}

        <section style={styles.messages}>
          {loading ? <div style={styles.empty}>Loading chat...</div> : null}
          {!loading && messages.length === 0 ? (
            <div style={styles.empty}>No messages yet. Start the conversation.</div>
          ) : null}

          {messages.map((message) => {
            const mine = String(message.senderId) === String(user?.id || user?._id);
            return (
              <article key={message._id} style={styles.messageRow(mine)}>
                <div style={styles.messageBubble(mine)}>
                  <div style={styles.messageMeta}>
                    <strong>{message.senderName || "Portal User"}</strong>
                    <span>{message.senderRole}</span>
                  </div>
                  {message.text ? <p style={styles.messageText}>{message.text}</p> : null}
                  {message.fileUrl && message.fileType === "image" ? (
                    <img src={buildMediaUrl(message.fileUrl)} alt="Chat attachment" style={styles.imagePreview} />
                  ) : null}
                  {message.fileUrl && message.fileType === "video" ? (
                    <video src={buildMediaUrl(message.fileUrl)} controls style={styles.videoPreview} />
                  ) : null}
                </div>
              </article>
            );
          })}
          <div ref={bottomRef} />
        </section>

        <footer style={styles.composer}>
          {file ? (
            <div style={styles.filePill}>
              {file.type.startsWith("video/") ? <Video size={15} /> : <Image size={15} />}
              <span>{file.name}</span>
              <button type="button" onClick={() => setFile(null)} style={styles.removeFile}>
                x
              </button>
            </div>
          ) : null}

          <div style={styles.inputRow}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              style={{ display: "none" }}
            />
            <button type="button" onClick={() => fileInputRef.current?.click()} style={styles.attachButton}>
              <Paperclip size={20} />
            </button>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={2}
              style={styles.textarea}
            />
            <button type="button" onClick={sendMessage} disabled={sending} style={styles.sendButton}>
              <Send size={18} />
              {sending ? "Sending" : "Send"}
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "calc(100vh - 104px)",
    display: "grid",
    gridTemplateColumns: "minmax(260px, 320px) minmax(0, 1fr)",
    gap: 18,
    padding: "24px",
    background: "linear-gradient(180deg, #eef4ff 0%, #f8fbff 100%)",
  },
  sidebar: {
    background: "#0f172a",
    color: "#fff",
    borderRadius: 24,
    padding: 24,
    minHeight: 620,
    display: "flex",
    flexDirection: "column",
    gap: 18,
    boxShadow: "0 24px 70px rgba(15, 23, 42, .18)",
  },
  brandIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(135deg, #2563eb, #14b8a6)",
  },
  kicker: {
    color: "#2563eb",
    fontSize: 13,
    fontWeight: 900,
    letterSpacing: ".16em",
    textTransform: "uppercase",
  },
  title: { margin: 0, fontSize: 34, lineHeight: 1.05 },
  copy: { margin: 0, color: "rgba(255,255,255,.72)", lineHeight: 1.7, fontSize: 16 },
  statusBox: {
    marginTop: "auto",
    padding: 16,
    borderRadius: 18,
    background: "rgba(255,255,255,.08)",
    border: "1px solid rgba(255,255,255,.12)",
    display: "grid",
    gap: 6,
  },
  clearButton: {
    border: "1px solid rgba(248,113,113,.3)",
    background: "rgba(127, 29, 29, .55)",
    color: "#fff",
    borderRadius: 16,
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    fontWeight: 900,
    cursor: "pointer",
  },
  chatPanel: {
    background: "#fff",
    borderRadius: 24,
    minHeight: 620,
    display: "grid",
    gridTemplateRows: "auto auto minmax(0, 1fr) auto",
    overflow: "hidden",
    boxShadow: "0 24px 70px rgba(15, 23, 42, .12)",
  },
  chatHeader: {
    padding: "22px 24px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  chatTitle: { margin: "4px 0 0", fontSize: 30 },
  mediaHint: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#475569",
    fontWeight: 800,
  },
  notice: {
    margin: "14px 24px 0",
    padding: "12px 14px",
    borderRadius: 14,
    background: "#eff6ff",
    color: "#1d4ed8",
    fontWeight: 800,
  },
  messages: {
    padding: 24,
    overflowY: "auto",
    background: "#f8fafc",
  },
  empty: {
    minHeight: 260,
    display: "grid",
    placeItems: "center",
    color: "#64748b",
    fontWeight: 800,
  },
  messageRow: (mine) => ({
    display: "flex",
    justifyContent: mine ? "flex-end" : "flex-start",
    marginBottom: 14,
  }),
  messageBubble: (mine) => ({
    maxWidth: "min(680px, 78%)",
    background: mine ? "#2563eb" : "#fff",
    color: mine ? "#fff" : "#0f172a",
    borderRadius: mine ? "22px 22px 6px 22px" : "22px 22px 22px 6px",
    padding: 14,
    border: mine ? "1px solid #2563eb" : "1px solid #e2e8f0",
    boxShadow: "0 12px 30px rgba(15, 23, 42, .08)",
  }),
  messageMeta: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    fontSize: 12,
    opacity: 0.78,
    textTransform: "capitalize",
  },
  messageText: { margin: "8px 0 0", whiteSpace: "pre-wrap", lineHeight: 1.55 },
  imagePreview: {
    display: "block",
    marginTop: 10,
    maxWidth: "100%",
    maxHeight: 360,
    borderRadius: 14,
    objectFit: "contain",
  },
  videoPreview: {
    display: "block",
    marginTop: 10,
    width: "min(520px, 100%)",
    maxHeight: 360,
    borderRadius: 14,
    background: "#020617",
  },
  composer: {
    padding: 18,
    borderTop: "1px solid #e2e8f0",
    background: "#fff",
  },
  filePill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    padding: "8px 10px",
    borderRadius: 999,
    background: "#ecfeff",
    color: "#0f766e",
    fontWeight: 800,
  },
  removeFile: {
    border: "none",
    background: "#ccfbf1",
    color: "#0f766e",
    borderRadius: 999,
    width: 22,
    height: 22,
    cursor: "pointer",
    fontWeight: 900,
  },
  inputRow: {
    display: "grid",
    gridTemplateColumns: "48px minmax(0, 1fr) auto",
    gap: 10,
    alignItems: "end",
  },
  attachButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    color: "#334155",
  },
  textarea: {
    resize: "none",
    minHeight: 48,
    maxHeight: 130,
    borderRadius: 16,
    border: "1px solid #cbd5e1",
    padding: "12px 14px",
    font: "inherit",
    outline: "none",
  },
  sendButton: {
    minHeight: 48,
    border: "none",
    borderRadius: 16,
    background: "linear-gradient(135deg, #2563eb, #14b8a6)",
    color: "#fff",
    padding: "0 18px",
    cursor: "pointer",
    fontWeight: 900,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  },
};

export default PortalChat;
