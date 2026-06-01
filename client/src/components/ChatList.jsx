import { useState, useEffect } from "react";
import { MessageCircle, Plus, Lock, Eye } from "lucide-react";
import API from "../../services/api";
import { getAuthUser } from "../../utils/authSession";

function ChatList({ onSelectChat, selectedChatId, onStartNew }) {
  const user = getAuthUser();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [otherUserId, setOtherUserId] = useState("");
  const [otherUserName, setOtherUserName] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isMobile = window.innerWidth < 1024;

  // Load chats
  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    setLoading(true);
    try {
      const response = await API.get("/api/chat/list");
      if (response.data.success) {
        setChats(response.data.chats);
      }
    } catch (error) {
      console.error("Load chats error:", error);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = async (e) => {
    e.preventDefault();
    setError("");

    if (!otherUserId.trim()) {
      setError("Please enter the ID of the person you want to chat with");
      return;
    }

    setSubmitting(true);

    try {
      const payload = user.role === "student"
        ? { teacherId: otherUserId }
        : { studentId: otherUserId };

      const response = await API.post("/api/chat/start", payload);

      if (response.data.success) {
        if (response.data.isNew) {
          // New chat created - show code
          setShowCode(true);
          setVerificationCode(response.data.verificationCode);
          setShowNewChat(false);
        } else if (!response.data.chat.isVerified) {
          // Chat exists but not verified - show code input
          setShowCode(true);
          setVerificationCode("");
          setOtherUserId(otherUserId);
        } else {
          // Chat exists and verified - open it
          setChats((prev) => {
            const exists = prev.find((c) => c._id === response.data.chat._id);
            if (exists) {
              return prev.map((c) => (c._id === response.data.chat._id ? response.data.chat : c));
            }
            return [response.data.chat, ...prev];
          });
          onSelectChat(response.data.chat._id);
          setShowNewChat(false);
          setOtherUserId("");
        }
      }
    } catch (error) {
      console.error("Start chat error:", error);
      setError(error.response?.data?.message || "Failed to start chat");
    } finally {
      setSubmitting(false);
    }
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    setError("");

    if (!verificationCode.trim()) {
      setError("Please enter the verification code");
      return;
    }

    setSubmitting(true);

    try {
      const payload = user.role === "student"
        ? { teacherId: otherUserId, verificationCode }
        : { studentId: otherUserId, verificationCode };

      const response = await API.post("/api/chat/start", payload);

      if (response.data.success) {
        setChats((prev) => {
          const exists = prev.find((c) => c._id === response.data.chat._id);
          if (exists) {
            return prev.map((c) => (c._id === response.data.chat._id ? response.data.chat : c));
          }
          return [response.data.chat, ...prev];
        });
        onSelectChat(response.data.chat._id);
        setShowCode(false);
        setShowNewChat(false);
        setOtherUserId("");
        setVerificationCode("");
      }
    } catch (error) {
      console.error("Verify code error:", error);
      setError(error.response?.data?.message || "Invalid verification code");
    } finally {
      setSubmitting(false);
    }
  };

  const formatPreview = (text) => {
    if (!text) return "No messages yet";
    return text.length > 40 ? text.substring(0, 40) + "..." : text;
  };

  const formatTime = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div
      style={{
        width: isMobile ? "100%" : "340px",
        height: isMobile ? "auto" : "calc(100vh - 100px)",
        background: "#fff",
        borderRight: isMobile ? "none" : "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px",
          borderBottom: "1px solid #e2e8f0",
          background: "#fafbfc",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <MessageCircle size={20} color="#4285f4" />
          <div style={{ fontWeight: 700, fontSize: "16px", color: "#1a202c" }}>
            Messages
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowNewChat(true);
            setOtherUserId("");
            setVerificationCode("");
            setError("");
          }}
          style={{
            background: "#4285f4",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "8px 12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
            fontWeight: 600,
          }}
        >
          <Plus size={16} /> New
        </button>
      </div>

      {/* New Chat Form */}
      {showNewChat && (
        <div style={{ padding: "14px", borderBottom: "1px solid #e2e8f0", background: "#f0f4f8" }}>
          <form
            onSubmit={startNewChat}
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <input
              type="text"
              placeholder={user.role === "student" ? "Teacher ID or Email" : "Student ID or Email"}
              value={otherUserId}
              onChange={(e) => setOtherUserId(e.target.value)}
              style={{
                padding: "10px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                fontSize: "13px",
                fontFamily: "inherit",
                outline: "none",
              }}
              disabled={submitting}
            />

            {error && (
              <div
                style={{
                  padding: "8px 12px",
                  background: "#fee2e2",
                  color: "#991b1b",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !otherUserId.trim()}
              style={{
                padding: "10px",
                background: "#4285f4",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              {submitting ? "Loading..." : "Continue"}
            </button>

            <button
              type="button"
              onClick={() => setShowNewChat(false)}
              style={{
                padding: "10px",
                background: "transparent",
                color: "#64748b",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Code Verification Form */}
      {showCode && (
        <div style={{ padding: "14px", borderBottom: "1px solid #e2e8f0", background: "#fef3c7" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "10px",
              color: "#92400e",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            <Lock size={14} />
            {verificationCode && !error ? "Share this code" : "Enter verification code"}
          </div>

          {verificationCode && !error ? (
            <div
              style={{
                padding: "12px",
                background: "#fff",
                border: "2px solid #4285f4",
                borderRadius: "8px",
                textAlign: "center",
                fontSize: "20px",
                fontWeight: 800,
                letterSpacing: "2px",
                marginBottom: "10px",
                color: "#4285f4",
                fontFamily: "monospace",
              }}
            >
              {verificationCode}
            </div>
          ) : (
            <form onSubmit={verifyCode} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <input
                type="text"
                placeholder="6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                maxLength="6"
                style={{
                  padding: "10px 12px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontFamily: "monospace",
                  fontWeight: 600,
                  outline: "none",
                }}
                disabled={submitting}
              />

              {error && (
                <div
                  style={{
                    padding: "8px 12px",
                    background: "#fee2e2",
                    color: "#991b1b",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || verificationCode.length !== 6}
                style={{
                  padding: "10px",
                  background: "#4285f4",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 600,
                  opacity: verificationCode.length === 6 ? 1 : 0.6,
                }}
              >
                {submitting ? "Verifying..." : "Verify"}
              </button>
            </form>
          )}

          <button
            type="button"
            onClick={() => {
              setShowCode(false);
              setVerificationCode("");
              setError("");
            }}
            style={{
              marginTop: "10px",
              width: "100%",
              padding: "10px",
              background: "transparent",
              color: "#64748b",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Chats List */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>
            Loading...
          </div>
        ) : chats.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>
            <div style={{ fontSize: "14px", marginBottom: "8px" }}>No conversations yet</div>
            <div style={{ fontSize: "12px" }}>Start a new chat to begin</div>
          </div>
        ) : (
          chats.map((chat) => {
            const isSelected = chat._id === selectedChatId;
            const otherName = user.role === "student" ? chat.teacherName : chat.studentName;
            const isUnverified = !chat.isVerified;

            return (
              <div
                key={chat._id}
                onClick={() => !isUnverified && onSelectChat(chat._id)}
                style={{
                  padding: "12px 14px",
                  borderBottom: "1px solid #e2e8f0",
                  background: isSelected ? "#f0f4f8" : "#fff",
                  cursor: isUnverified ? "default" : "pointer",
                  transition: "background 0.2s",
                  opacity: isUnverified ? 0.6 : 1,
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      background: "#e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: "20px",
                      fontWeight: 700,
                      color: "#4285f4",
                    }}
                  >
                    {otherName.charAt(0).toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginBottom: "4px",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "14px",
                          color: "#1a202c",
                          flex: 1,
                          minWidth: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {otherName}
                      </div>

                      {isUnverified && (
                        <Lock size={13} color="#f59e0b" title="Not verified" />
                      )}

                      <div style={{ fontSize: "12px", color: "#94a3b8", flexShrink: 0 }}>
                        {formatTime(chat.lastMessageTime)}
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: "13px",
                        color: "#64748b",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {isUnverified ? (
                        <span style={{ color: "#f59e0b", fontWeight: 600 }}>
                          ⚠️ Verification required
                        </span>
                      ) : (
                        formatPreview(chat.lastMessage)
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ChatList;
