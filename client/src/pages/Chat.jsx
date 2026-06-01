import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import ChatList from "../../components/ChatList";
import ChatWindow from "../../components/ChatWindow";
import API from "../../services/api";
import { getAuthUser } from "../../utils/authSession";

function Chat() {
  const user = getAuthUser();
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [loadingChat, setLoadingChat] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch chat details when selected
  useEffect(() => {
    if (!selectedChatId) {
      setSelectedChat(null);
      return;
    }

    const fetchChat = async () => {
      setLoadingChat(true);
      try {
        const response = await API.get(`/api/chat/${selectedChatId}`);
        if (response.data.success) {
          setSelectedChat(response.data.chat);
        }
      } catch (error) {
        console.error("Fetch chat error:", error);
      } finally {
        setLoadingChat(false);
      }
    };

    fetchChat();
  }, [selectedChatId]);

  const handleSelectChat = (chatId) => {
    setSelectedChatId(chatId);
  };

  const handleCloseChat = () => {
    if (isMobile) {
      setSelectedChatId(null);
      setSelectedChat(null);
    }
  };

  const handleBackToList = () => {
    setSelectedChatId(null);
    setSelectedChat(null);
  };

  if (!user || (user.role !== "student" && user.role !== "teacher")) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "calc(100vh - 100px)",
          color: "#94a3b8",
          fontSize: "16px",
        }}
      >
        Only students and teachers can access chat.
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        height: "calc(100vh - 100px)",
        background: "#f5f7fa",
        overflow: "hidden",
      }}
    >
      {/* Sidebar - Chat List */}
      {(!isMobile || !selectedChatId) && (
        <ChatList
          onSelectChat={handleSelectChat}
          selectedChatId={selectedChatId}
        />
      )}

      {/* Main Area */}
      {selectedChatId ? (
        loadingChat ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94a3b8",
            }}
          >
            Loading chat...
          </div>
        ) : selectedChat ? (
          <ChatWindow
            chatId={selectedChatId}
            chat={selectedChat}
            onClose={handleCloseChat}
            onBack={isMobile ? handleBackToList : null}
          />
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94a3b8",
            }}
          >
            Chat not found
          </div>
        )
      ) : (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#94a3b8",
            textAlign: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "rgba(66, 133, 244, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MessageCircle size={40} color="#4285f4" />
          </div>
          <div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#1a202c", marginBottom: "4px" }}>
              No conversation selected
            </div>
            <div style={{ fontSize: "14px" }}>
              {isMobile
                ? "Select a chat from the list to start messaging"
                : "Click on a chat to start messaging"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chat;
