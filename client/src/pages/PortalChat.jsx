import { useEffect, useRef, useState } from "react";
import {
  CheckCheck,
  Image,
  Lock,
  MessageCircle,
  Mic,
  Paperclip,
  Phone,
  Send,
  Square,
  Trash2,
  Video,
} from "lucide-react";
import API from "../services/api";
import { getAuthUser } from "../utils/authSession";

const buildMediaUrl = (fileUrl) => {
  if (!fileUrl) return "";
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
  const cleanPath = String(fileUrl).replace(/^\/+/, "");
  return `${API.defaults.baseURL}/${cleanPath}`;
};

const formatLastSeen = (lastSeenAt) => {
  if (!lastSeenAt) return "Last seen not available";
  const seen = new Date(lastSeenAt);
  const diffMs = Date.now() - seen.getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  if (minutes < 2) return "Last seen just now";
  if (minutes < 60) return `Last seen ${minutes} min ago`;
  return `Last seen ${seen.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}`;
};

const PortalChat = () => {
  const user = getAuthUser();
  const [contacts, setContacts] = useState([]);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [unlockedContactId, setUnlockedContactId] = useState("");
  const [chatCode, setChatCode] = useState("");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const selectedContact = contacts.find((contact) => String(contact.id) === String(selectedContactId));
  const unlocked = selectedContactId && String(unlockedContactId) === String(selectedContactId);

  const fetchContacts = async ({ silent = false } = {}) => {
    try {
      const response = await API.get("/api/chat/contacts");
      const list = Array.isArray(response.data) ? response.data : [];
      setContacts(list);
      setSelectedContactId((previous) => previous || String(list[0]?.id || ""));
      if (!silent) setNotice("");
    } catch (error) {
      console.error("Chat contacts failed", error);
      if (!silent) setNotice(error.response?.data?.message || "Contacts could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async ({ silent = false } = {}) => {
    if (!selectedContactId || !unlocked) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      const response = await API.get("/api/chat/messages", {
        params: { recipientId: selectedContactId, chatCode },
      });
      setMessages(Array.isArray(response.data) ? response.data : []);
      if (!silent) setNotice("");
    } catch (error) {
      console.error("Chat fetch failed", error);
      if (!silent) setNotice(error.response?.data?.message || "Chat could not be loaded.");
      if (error.response?.status === 403) setUnlockedContactId("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
    const heartbeat = window.setInterval(() => {
      API.post("/api/chat/heartbeat").catch(() => {});
      fetchContacts({ silent: true });
    }, 30000);
    return () => window.clearInterval(heartbeat);
  }, []);

  useEffect(() => {
    setUnlockedContactId("");
    setChatCode("");
    setMessages([]);
  }, [selectedContactId]);

  useEffect(() => {
    fetchMessages();
    const timer = window.setInterval(() => fetchMessages({ silent: true }), 5000);
    return () => window.clearInterval(timer);
  }, [selectedContactId, unlocked, chatCode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const unlockChat = async () => {
    if (!selectedContactId) {
      setNotice("Select a student or teacher first.");
      return;
    }

    if (chatCode.trim().length < 4) {
      setNotice("Enter the private code. Both users must type the same code.");
      return;
    }

    try {
      setLoading(true);
      await API.post("/api/chat/session", { recipientId: selectedContactId, chatCode: chatCode.trim() });
      setUnlockedContactId(selectedContactId);
      setNotice("");
    } catch (error) {
      console.error("Chat unlock failed", error);
      setNotice(error.response?.data?.message || "Chat code could not be verified.");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (overrideFile = null) => {
    const selectedFile = overrideFile || file;
    if (!text.trim() && !selectedFile) {
      setNotice("Type a message or attach a picture/video/voice note.");
      return;
    }

    if (!unlocked) {
      setNotice("Unlock this chat with the private code first.");
      return;
    }

    try {
      setSending(true);
      const formData = new FormData();
      formData.append("text", text.trim());
      formData.append("recipientId", selectedContactId);
      formData.append("chatCode", chatCode.trim());
      if (selectedFile) formData.append("file", selectedFile);

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
    if (!unlocked) {
      setNotice("Unlock this chat with the private code before clearing it.");
      return;
    }

    if (!window.confirm("Clear this secure chat for both users? A new code will be required next time.")) return;

    try {
      await API.delete("/api/chat/messages", { params: { recipientId: selectedContactId, chatCode } });
      setMessages([]);
      setUnlockedContactId("");
      setChatCode("");
      setNotice("Chat cleared for both users. Set a new code to chat again.");
    } catch (error) {
      console.error("Chat clear failed", error);
      setNotice(error.response?.data?.message || "Chat could not be cleared.");
    }
  };

  const startRecording = async () => {
    if (!unlocked) {
      setNotice("Unlock this chat with the private code before recording a voice note.");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setNotice("Voice recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const voiceFile = new File([blob], `voice-note-${Date.now()}.webm`, { type: "audio/webm" });
        setRecording(false);
        await sendMessage(voiceFile);
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (error) {
      console.error("Voice recording failed", error);
      setNotice("Microphone permission is required for voice notes.");
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const callNotice = (type) => {
    setNotice(`${type} call option is ready for this contact. Connect a real calling service/WebRTC to start live calls.`);
  };

  return (
    <div className="portal-chat">
      <style>{`
        .portal-chat {
          height: calc(100dvh - 104px);
          min-height: 620px;
          display: grid;
          grid-template-columns: minmax(250px, 330px) minmax(0, 1fr);
          background: #eef4ff;
          color: #0f172a;
        }
        .chat-sidebar {
          min-height: 0;
          background: #0f172a;
          color: #fff;
          display: grid;
          grid-template-rows: auto auto minmax(0, 1fr) auto;
          gap: 14px;
          padding: 18px;
        }
        .chat-brand { display: flex; align-items: center; gap: 12px; }
        .chat-brand-icon {
          width: 46px;
          height: 46px;
          border-radius: 8px;
          display: grid;
          place-items: center;
          background: #2563eb;
        }
        .chat-title { margin: 0; font-size: 24px; line-height: 1.1; }
        .chat-subtitle { margin: 3px 0 0; color: rgba(255,255,255,.68); font-size: 13px; }
        .contact-select {
          width: 100%;
          border: 1px solid rgba(255,255,255,.18);
          border-radius: 8px;
          background: #fff;
          color: #0f172a;
          padding: 12px;
          font-weight: 800;
          outline: none;
        }
        .contact-list {
          min-height: 0;
          overflow: auto;
          display: grid;
          align-content: start;
          gap: 8px;
        }
        .contact-item {
          width: 100%;
          border: 1px solid rgba(255,255,255,.1);
          background: rgba(255,255,255,.07);
          color: #fff;
          border-radius: 8px;
          padding: 11px;
          text-align: left;
          cursor: pointer;
        }
        .contact-item.active { background: #1d4ed8; border-color: #60a5fa; }
        .contact-main { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .contact-name { font-weight: 900; overflow-wrap: anywhere; }
        .contact-meta { margin-top: 4px; color: rgba(255,255,255,.68); font-size: 12px; text-transform: capitalize; }
        .status-dot { width: 9px; height: 9px; border-radius: 999px; background: #94a3b8; flex: 0 0 auto; }
        .status-dot.online { background: #22c55e; box-shadow: 0 0 0 4px rgba(34,197,94,.18); }
        .signed-in {
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 8px;
          padding: 12px;
          background: rgba(255,255,255,.07);
          font-size: 13px;
        }
        .chat-main {
          min-width: 0;
          min-height: 0;
          display: grid;
          grid-template-rows: auto auto minmax(0, 1fr) auto;
          background: #f8fafc;
        }
        .chat-header {
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 18px;
          background: #fff;
          border-bottom: 1px solid #e2e8f0;
        }
        .chat-person { min-width: 0; }
        .chat-person h2 { margin: 0; font-size: 22px; overflow-wrap: anywhere; }
        .presence { margin-top: 4px; color: #64748b; font-size: 13px; font-weight: 800; }
        .presence.online { color: #15803d; }
        .header-actions { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
        .icon-button {
          width: 42px;
          height: 42px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          background: #fff;
          color: #334155;
          display: grid;
          place-items: center;
          cursor: pointer;
        }
        .icon-button:disabled, .primary-button:disabled {
          cursor: not-allowed;
          opacity: .55;
        }
        .notice {
          margin: 10px 18px 0;
          padding: 11px 12px;
          border-radius: 8px;
          background: #eff6ff;
          color: #1d4ed8;
          font-weight: 800;
        }
        .lock-panel {
          margin: 12px 18px 0;
          padding: 12px;
          border-radius: 8px;
          background: #fff;
          border: 1px solid #dbeafe;
          display: grid;
          grid-template-columns: auto minmax(180px, 1fr) minmax(140px, 220px) auto;
          gap: 10px;
          align-items: center;
        }
        .lock-copy strong { display: block; }
        .lock-copy small { color: #64748b; font-weight: 700; }
        .code-input {
          min-width: 0;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 12px;
          font: inherit;
          font-weight: 900;
          outline: none;
        }
        .primary-button {
          min-height: 42px;
          border: 0;
          border-radius: 8px;
          background: #2563eb;
          color: #fff;
          padding: 0 15px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 900;
          cursor: pointer;
          white-space: nowrap;
        }
        .danger-button {
          background: #991b1b;
        }
        .messages {
          min-height: 0;
          overflow-y: auto;
          padding: 18px;
          display: flex;
          flex-direction: column;
        }
        .empty {
          flex: 1;
          min-height: 220px;
          display: grid;
          place-items: center;
          color: #64748b;
          font-weight: 900;
          text-align: center;
        }
        .message-row { display: flex; margin-bottom: 10px; }
        .message-row.mine { justify-content: flex-end; }
        .message-bubble {
          max-width: min(680px, 76%);
          border-radius: 8px;
          padding: 10px 12px;
          border: 1px solid #e2e8f0;
          background: #fff;
          box-shadow: 0 8px 20px rgba(15, 23, 42, .07);
        }
        .message-row.mine .message-bubble {
          background: #2563eb;
          color: #fff;
          border-color: #2563eb;
        }
        .message-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          font-size: 11px;
          opacity: .78;
          text-transform: capitalize;
        }
        .message-text { margin: 7px 0 0; white-space: pre-wrap; line-height: 1.5; overflow-wrap: anywhere; }
        .message-media {
          display: block;
          margin-top: 9px;
          max-width: 100%;
          border-radius: 8px;
          background: #020617;
        }
        img.message-media { max-height: 320px; object-fit: contain; background: transparent; }
        video.message-media { width: min(520px, 100%); max-height: 320px; }
        audio.message-media { width: min(360px, 100%); background: transparent; }
        .read-tick { display: inline-flex; align-items: center; gap: 4px; font-weight: 900; }
        .read-tick.seen { color: #38bdf8; }
        .read-tick.sent { color: rgba(255,255,255,.68); }
        .composer {
          border-top: 1px solid #e2e8f0;
          background: #fff;
          padding: 12px;
        }
        .file-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          max-width: 100%;
          margin-bottom: 8px;
          padding: 7px 9px;
          border-radius: 8px;
          background: #ecfeff;
          color: #0f766e;
          font-weight: 800;
        }
        .file-pill span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .file-pill button {
          border: 0;
          border-radius: 7px;
          background: #ccfbf1;
          color: #0f766e;
          width: 24px;
          height: 24px;
          cursor: pointer;
          font-weight: 900;
        }
        .input-row {
          display: grid;
          grid-template-columns: 42px 42px minmax(0, 1fr) auto;
          gap: 8px;
          align-items: end;
        }
        .textarea {
          min-width: 0;
          resize: none;
          min-height: 42px;
          max-height: 120px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          padding: 10px 12px;
          font: inherit;
          outline: none;
        }
        @media (max-width: 820px) {
          .portal-chat {
            height: calc(100dvh - 104px);
            min-height: 0;
            grid-template-columns: 1fr;
            grid-template-rows: auto minmax(0, 1fr);
          }
          .chat-sidebar {
            grid-template-rows: auto auto;
            padding: 12px;
          }
          .chat-brand, .signed-in { display: none; }
          .contact-list {
            grid-auto-flow: column;
            grid-auto-columns: minmax(190px, 72%);
            overflow-x: auto;
            overflow-y: hidden;
          }
          .chat-header {
            padding: 10px 12px;
            align-items: flex-start;
          }
          .chat-person h2 { font-size: 18px; }
          .header-actions .icon-button { width: 38px; height: 38px; }
          .lock-panel {
            margin: 8px 12px 0;
            grid-template-columns: 1fr;
          }
          .messages { padding: 12px; }
          .message-bubble { max-width: 88%; }
          .notice { margin: 8px 12px 0; }
          .input-row { grid-template-columns: 40px 40px minmax(0, 1fr) 44px; }
          .primary-button.send-label span { display: none; }
          .composer { padding: 10px; }
        }
      `}</style>

      <aside className="chat-sidebar">
        <div className="chat-brand">
          <div className="chat-brand-icon"><MessageCircle size={24} /></div>
          <div>
            <h1 className="chat-title">Portal Chat</h1>
            <p className="chat-subtitle">Private teacher-student messages</p>
          </div>
        </div>

        <select
          className="contact-select"
          value={selectedContactId}
          onChange={(event) => setSelectedContactId(event.target.value)}
        >
          {contacts.length === 0 ? <option value="">No contacts found</option> : null}
          {contacts.map((contact) => (
            <option key={contact.id} value={contact.id}>
              {contact.name} ({contact.role})
            </option>
          ))}
        </select>

        <div className="contact-list">
          {contacts.map((contact) => (
            <button
              type="button"
              key={contact.id}
              className={`contact-item ${String(contact.id) === String(selectedContactId) ? "active" : ""}`}
              onClick={() => setSelectedContactId(String(contact.id))}
            >
              <div className="contact-main">
                <span className="contact-name">{contact.name}</span>
                <span className={`status-dot ${contact.online ? "online" : ""}`} />
              </div>
              <div className="contact-meta">
                {contact.role} {contact.rollNumber ? `- ${contact.rollNumber}` : ""} -{" "}
                {contact.online ? "Online" : formatLastSeen(contact.lastSeenAt)}
              </div>
            </button>
          ))}
        </div>

        <div className="signed-in">
          Signed in as <strong>{user?.name || user?.email || "Portal user"}</strong>
          <div>{user?.role || "user"}</div>
        </div>
      </aside>

      <main className="chat-main">
        <header className="chat-header">
          <div className="chat-person">
            <h2>{selectedContact ? selectedContact.name : "Select a contact"}</h2>
            <div className={`presence ${selectedContact?.online ? "online" : ""}`}>
              {selectedContact?.online ? "Online" : formatLastSeen(selectedContact?.lastSeenAt)}
            </div>
          </div>
          <div className="header-actions">
            <button type="button" className="icon-button" title="Audio call" onClick={() => callNotice("Audio")}>
              <Phone size={19} />
            </button>
            <button type="button" className="icon-button" title="Video call" onClick={() => callNotice("Video")}>
              <Video size={19} />
            </button>
            <button type="button" className="icon-button" title="Clear chat" onClick={clearChat}>
              <Trash2 size={19} />
            </button>
          </div>
        </header>

        {notice ? <div className="notice">{notice}</div> : null}

        {!unlocked ? (
          <section className="lock-panel">
            <Lock size={22} color="#2563eb" />
            <div className="lock-copy">
              <strong>Secure code required</strong>
              <small>First time both users type the same code. Next time this chat asks for that code again.</small>
            </div>
            <input
              className="code-input"
              value={chatCode}
              onChange={(event) => setChatCode(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") unlockChat();
              }}
              type="password"
              placeholder="Private code"
            />
            <button type="button" className="primary-button" onClick={unlockChat}>
              <Lock size={17} /> Open
            </button>
          </section>
        ) : null}

        <section className="messages">
          {loading ? <div className="empty">Loading chat...</div> : null}
          {!loading && !selectedContactId ? <div className="empty">Select a student or teacher.</div> : null}
          {!loading && selectedContactId && !unlocked ? (
            <div className="empty">Enter the private code to open this secure chat.</div>
          ) : null}
          {!loading && selectedContactId && unlocked && messages.length === 0 ? (
            <div className="empty">No messages yet with this user.</div>
          ) : null}

          {messages.map((message) => {
            const mine = String(message.senderId) === String(user?.id || user?._id);
            return (
              <article key={message._id} className={`message-row ${mine ? "mine" : ""}`}>
                <div className="message-bubble">
                  <div className="message-meta">
                    <span>{message.senderName || "Portal User"} - {message.senderRole}</span>
                    {mine ? (
                      <span className={`read-tick ${message.readAt ? "seen" : "sent"}`}>
                        <CheckCheck size={15} /> {message.readAt ? "Seen" : "Sent"}
                      </span>
                    ) : null}
                  </div>
                  {message.text ? <p className="message-text">{message.text}</p> : null}
                  {message.fileUrl && message.fileType === "image" ? (
                    <img src={buildMediaUrl(message.fileUrl)} alt="Chat attachment" className="message-media" />
                  ) : null}
                  {message.fileUrl && message.fileType === "video" ? (
                    <video src={buildMediaUrl(message.fileUrl)} controls className="message-media" />
                  ) : null}
                  {message.fileUrl && message.fileType === "audio" ? (
                    <audio src={buildMediaUrl(message.fileUrl)} controls className="message-media" />
                  ) : null}
                </div>
              </article>
            );
          })}
          <div ref={bottomRef} />
        </section>

        <footer className="composer">
          {file ? (
            <div className="file-pill">
              {file.type.startsWith("video/") ? <Video size={15} /> : file.type.startsWith("audio/") ? <Mic size={15} /> : <Image size={15} />}
              <span>{file.name}</span>
              <button type="button" onClick={() => setFile(null)}>x</button>
            </div>
          ) : null}

          <div className="input-row">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,audio/*"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              style={{ display: "none" }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="icon-button"
              title="Attach file"
              disabled={!unlocked}
            >
              <Paperclip size={19} />
            </button>
            <button
              type="button"
              onClick={recording ? stopRecording : startRecording}
              className="icon-button"
              title={recording ? "Stop voice recording" : "Record voice message"}
              disabled={!unlocked && !recording}
            >
              {recording ? <Square size={18} /> : <Mic size={19} />}
            </button>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedContact ? `Message ${selectedContact.name}...` : "Select contact first..."}
              rows={1}
              className="textarea"
              disabled={!unlocked}
            />
            <button type="button" onClick={() => sendMessage()} disabled={sending || !unlocked} className="primary-button send-label">
              <Send size={17} />
              <span>{sending ? "Sending" : "Send"}</span>
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default PortalChat;
