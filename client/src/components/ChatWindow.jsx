import { useState, useEffect, useRef } from "react";
import { X, Send, Clock, CheckCheck, Check, AlertCircle } from "lucide-react";
import API from "../../services/api";
import { getAuthUser } from "../../utils/authSession";

function ChatWindow({ chatId, chat, onClose, onBack }) {
  const user = getAuthUser();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingIds, setSendingIds] = useState(new Set());
  const messagesEndRef = useRef(null);

  const isMobile = window.innerWidth < 1024;
  const isStudent = user.role === "student";
  const otherUser = isStudent ? chat.teacherName : chat.studentName;

  // Format date/time
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return "Today";
    } else if (d.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return d.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  // Format last online
  const formatLastOnline = (date) => {
    if (!date) return "Never online";
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Online now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  // Load messages
  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true);
      try {
        const response = await API.get(`/api/chat/${chatId}/messages?limit=100`);
        if (response.data.success) {
          setMessages(response.data.messages);
          // Mark all as read
          const unreadIds = response.data.messages
            .filter((m) => !m.isRead && m.senderId !== user._id)
            .map((m) => m._id);
          if (unreadIds.length > 0) {
            await API.put(`/api/chat/${chatId}/read`, { messageIds: unreadIds });
          }
        }
      } catch (error) {
        console.error("Load messages error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
    // Poll for new messages every 2 seconds
    const interval = setInterval(loadMessages, 2000);
    return () => clearInterval(interval);
  }, [chatId, user._id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Update online status
  useEffect(() => {
    const updateOnline = async () => {
      try {
        await API.put(`/api/chat/${chatId}/online`);
      } catch (error) {
        console.error("Update online error:", error);
      }
    };

    updateOnline();
    const interval = setInterval(updateOnline, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, [chatId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageText = newMessage;
    setNewMessage("");

    const tempId = `temp-${Date.now()}`;
    setSendingIds((prev) => new Set([...prev, tempId]));

    // Add optimistic message
    const optimisticMessage = {
      _id: tempId,
      text: messageText,
      senderId: user._id,
      senderName: user.name,
      senderRole: user.role,
      isRead: false,
      createdAt: new Date().toISOString(),
      isSending: true,
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const response = await API.post(`/api/chat/${chatId}/send`, {
        text: messageText,
      });

      if (response.data.success) {
        // Replace optimistic with real message
        setMessages((prev) =>
          prev.map((m) => (m._id === tempId ? response.data.message : m))
        );
      }
    } catch (error) {
      console.error("Send message error:", error);
      // Remove failed message
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      // You could show a toast error here
    } finally {
      setSendingIds((prev) => {
        const next = new Set(prev);
        next.delete(tempId);
        return next;
      });
    }
  };

  let lastDate = null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: isMobile ? "#f5f7fa" : "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 3000,
        backdropFilter: isMobile ? "none" : "blur(4px)",
      }}
    >
      <div
        style={{
          width: isMobile ? "100%" : "90%",
          maxWidth: isMobile ? "100%" : "600px",
          height: isMobile ? "100%" : "80vh",
          maxHeight: isMobile ? "100%" : "700px",
          borderRadius: isMobile ? 0 : "24px",
          background: "#fff",
          display: "flex",
          flexDirection: "column",
          boxShadow: isMobile ? "none" : "0 25px 50px rgba(0,0,0,0.15)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: isMobile ? "14px 16px" : "16px 20px",
            borderBottom: "1px solid #e2e8f0",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {isMobile && onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "18px",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                >
                  ←
                </button>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: "#1a202c", fontSize: "15px" }}>
                  {otherUser}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#64748b",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Clock size={12} />
                  {formatLastOnline(
                    isStudent ? chat.teacherLastOnline : chat.studentLastOnline
                  )}
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(0,0,0,0.05)",
              border: "none",
              borderRadius: "8px",
              padding: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: isMobile ? "12px 12px" : "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            background: "#fafbfc",
          }}
        >
          {messages.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "#94a3b8",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "14px", marginBottom: "8px" }}>
                👋 Start a new conversation
              </div>
              <div style={{ fontSize: "12px" }}>
                Chat with {otherUser}
              </div>
            </div>
          ) : (
            messages.map((message, index) => {
              const isCurrentUser = message.senderId === user._id;
              const showDate =
                !lastDate ||
                formatDate(message.createdAt) !== formatDate(lastDate);
              lastDate = message.createdAt;

              return (
                <div key={message._id}>
                  {showDate && (
                    <div
                      style={{
                        textAlign: "center",
                        fontSize: "11px",
                        color: "#94a3b8",
                        margin: "12px 0 8px 0",
                        fontWeight: 600,
                      }}
                    >
                      {formatDate(message.createdAt)}
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      justifyContent: isCurrentUser ? "flex-end" : "flex-start",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "75%",
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                      }}
                    >
                      <div
                        style={{
                          padding: isMobile ? "10px 14px" : "12px 16px",
                          borderRadius: isCurrentUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                          background: isCurrentUser
                            ? "#4285f4"
                            : "#e2e8f0",
                          color: isCurrentUser ? "#fff" : "#1a202c",
                          wordBreak: "break-word",
                          fontSize: "14px",
                          lineHeight: 1.4,
                          opacity: message.isSending ? 0.7 : 1,
                        }}
                      >
                        {message.text}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "11px",
                          color: "#94a3b8",
                          paddingRight: isCurrentUser ? "4px" : "0px",
                          justifyContent: isCurrentUser ? "flex-end" : "flex-start",
                        }}
                      >
                        <span>{formatTime(message.createdAt)}</span>
                        {isCurrentUser && (
                          message.isSending ? (
                            <Clock size={12} />
                          ) : message.isRead ? (
                            <CheckCheck size={13} color="#4285f4" />
                          ) : (
                            <Check size={12} />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div
          style={{
            padding: isMobile ? "12px 12px" : "16px 20px",
            borderTop: "1px solid #e2e8f0",
            background: "#fff",
          }}
        >
          <form
            onSubmit={sendMessage}
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "flex-end",
            }}
          >
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) {
                  sendMessage(e);
                }
              }}
              placeholder="Type a message..."
              style={{
                flex: 1,
                padding: isMobile ? "10px 12px" : "12px 14px",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                fontSize: "14px",
                fontFamily: "inherit",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#4285f4")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || loading}
              style={{
                padding: isMobile ? "10px 14px" : "12px 16px",
                background: newMessage.trim() ? "#4285f4" : "#cbd5e1",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                cursor: newMessage.trim() ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s",
              }}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChatWindow;
