import { useEffect, useRef, useState } from "react";
import {
  CheckCheck,
  Image,
  Lock,
  MessageCircle,
  Mic,
  Paperclip,
  Phone,
  PhoneOff,
  Send,
  Square,
  Trash2,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { io } from "socket.io-client";
import API from "../services/api";
import { getAuthToken, getAuthUser } from "../utils/authSession";

const buildMediaUrl = (fileUrl) => {
  if (!fileUrl) return "";
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
  const cleanPath = String(fileUrl).replace(/^\/+/, "");
  return `${API.defaults.baseURL}/${cleanPath}`;
};

const ICE_SERVERS = [
  { urls: ["stun:stun.l.google.com:19302", "stun:global.stun.twilio.com:3478"] },
  {
    urls: [
      "turn:openrelay.metered.ca:80",
      "turn:openrelay.metered.ca:443",
      "turn:openrelay.metered.ca:443?transport=tcp",
    ],
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

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
  const [activeCall, setActiveCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callMuted, setCallMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const callStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerRef = useRef(null);
  const socketRef = useRef(null);
  const ringtoneContextRef = useRef(null);
  const ringtoneTimerRef = useRef(null);
  const activeCallRef = useRef(null);
  const incomingCallRef = useRef(null);
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

  const fetchContactStatuses = async () => {
    try {
      const response = await API.get("/api/chat/contacts/status");
      const statuses = Array.isArray(response.data) ? response.data : [];
      const statusMap = new Map(statuses.map((status) => [String(status.id), status]));
      setContacts((current) =>
        current.map((contact) => {
          const nextStatus = statusMap.get(String(contact.id));
          return nextStatus
            ? { ...contact, online: nextStatus.online, lastSeenAt: nextStatus.lastSeenAt }
            : contact;
        })
      );
    } catch (error) {
      console.error("Chat status refresh failed", error);
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
    const markOnline = () => {
      API.post("/api/chat/heartbeat").catch(() => {});
    };

    const markOffline = () => {
      API.post("/api/chat/offline").catch(() => {});
    };

    const markOfflineWithBeacon = () => {
      const token = getAuthToken();
      const endpoint = `${API.defaults.baseURL}/api/chat/offline`;

      fetch(endpoint, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        keepalive: true,
      }).catch(() => {});
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        setUnlockedContactId("");
        setChatCode("");
        setMessages([]);
        markOfflineWithBeacon();
        return;
      }

      markOnline();
      fetchContacts({ silent: true });
    };

    const handleLeaveChatScreen = () => {
      setUnlockedContactId("");
      setChatCode("");
      setMessages([]);
      markOfflineWithBeacon();
    };

    fetchContacts();
    markOnline();
    const heartbeat = window.setInterval(() => {
      markOnline();
    }, 15000);
    const presenceRefresh = window.setInterval(fetchContactStatuses, 1000);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handleLeaveChatScreen);
    window.addEventListener("beforeunload", handleLeaveChatScreen);

    return () => {
      window.clearInterval(heartbeat);
      window.clearInterval(presenceRefresh);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handleLeaveChatScreen);
      window.removeEventListener("beforeunload", handleLeaveChatScreen);
      markOffline();
    };
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

  useEffect(() => {
    if (localVideoRef.current && activeCall?.type === "video" && callStreamRef.current) {
      localVideoRef.current.srcObject = callStreamRef.current;
    }
  }, [activeCall]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStreamRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
    }
    if (remoteAudioRef.current && remoteStreamRef.current) {
      remoteAudioRef.current.srcObject = remoteStreamRef.current;
      remoteAudioRef.current.muted = !speakerOn;
    }
  }, [activeCall, speakerOn]);

  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  useEffect(() => {
    incomingCallRef.current = incomingCall;
  }, [incomingCall]);

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

  const createPeer = (recipientId, callId) => {
    const peer = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
      iceCandidatePoolSize: 8,
    });

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit("webrtc:ice-candidate", {
          recipientId,
          callId,
          candidate: event.candidate,
        });
      }
    };

    peer.ontrack = (event) => {
      const [remoteStream] = event.streams;
      remoteStreamRef.current = remoteStream;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.muted = !speakerOn;
      }
      setActiveCall((current) => current ? { ...current, status: "connected" } : current);
    };

    peer.onconnectionstatechange = () => {
      if (["failed", "closed", "disconnected"].includes(peer.connectionState)) {
        setActiveCall((current) => current ? { ...current, status: peer.connectionState } : current);
      }
    };

    peerRef.current = peer;
    return peer;
  };

  const getCallMedia = async (type) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Media devices are not available in this browser.");
    }

    const stream = await navigator.mediaDevices.getUserMedia(
      type === "video" ? { audio: true, video: true } : { audio: true, video: false }
    );
    callStreamRef.current = stream;
    setCallMuted(false);
    setCameraOff(false);
    return stream;
  };

  const stopRingtone = () => {
    if (ringtoneTimerRef.current) {
      window.clearInterval(ringtoneTimerRef.current);
      ringtoneTimerRef.current = null;
    }
  };

  const playRingtoneBeep = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const context = ringtoneContextRef.current || new AudioContext();
    ringtoneContextRef.current = context;
    if (context.state === "suspended") context.resume().catch(() => {});

    const now = context.currentTime;
    [0, 0.22].forEach((offset) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, now + offset);
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.18, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.16);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now + offset);
      oscillator.stop(now + offset + 0.18);
    });
  };

  const startRingtone = () => {
    if (ringtoneTimerRef.current) return;
    playRingtoneBeep();
    ringtoneTimerRef.current = window.setInterval(playRingtoneBeep, 1400);
  };

  const waitForSocketConnection = () =>
    new Promise((resolve, reject) => {
      const socket = socketRef.current;
      if (!socket) {
        reject(new Error("Chat connection is not ready yet."));
        return;
      }

      if (socket.connected) {
        resolve(socket);
        return;
      }

      const timeout = window.setTimeout(() => {
        socket.off("connect", handleConnect);
        socket.off("connect_error", handleError);
        reject(new Error("Chat connection is still connecting. Please try again."));
      }, 5000);

      const handleConnect = () => {
        window.clearTimeout(timeout);
        socket.off("connect_error", handleError);
        resolve(socket);
      };

      const handleError = () => {
        window.clearTimeout(timeout);
        socket.off("connect", handleConnect);
        reject(new Error("Chat connection failed. Please refresh and try again."));
      };

      socket.once("connect", handleConnect);
      socket.once("connect_error", handleError);
      socket.connect();
    });

  const stopCallMedia = () => {
    callStreamRef.current?.getTracks().forEach((track) => track.stop());
    callStreamRef.current = null;
    remoteStreamRef.current?.getTracks().forEach((track) => track.stop());
    remoteStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
  };

  const endCall = ({ notify = true } = {}) => {
    const currentCall = activeCallRef.current;
    if (notify && currentCall?.contactId) {
      socketRef.current?.emit("call:end", {
        recipientId: currentCall.contactId,
        callId: currentCall.callId,
      });
    }
    peerRef.current?.close();
    peerRef.current = null;
    stopRingtone();
    stopCallMedia();
    setActiveCall(null);
    setIncomingCall(null);
  };

  const startCall = async (type) => {
    if (!selectedContact) {
      setNotice("Select a student or teacher first.");
      return;
    }

    if (!unlocked) {
      setNotice("Unlock this chat with the private code before starting a call.");
      return;
    }

    try {
      endCall({ notify: false });
      const socket = await waitForSocketConnection();
      const stream = await getCallMedia(type);
      const callId = `${user?.id || user?._id}-${selectedContact.id}-${Date.now()}`;
      const peer = createPeer(selectedContact.id, callId);
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      setNotice("");
      setActiveCall({
        callId,
        type,
        contactId: selectedContact.id,
        contactName: selectedContact.name,
        direction: "outgoing",
        startedAt: Date.now(),
        status: "calling",
      });
      socket.emit("call:start", {
        recipientId: selectedContact.id,
        type,
        callId,
      });
    } catch (error) {
      console.error("Call permission failed", error);
      setNotice(error.message || (type === "video" ? "Camera and microphone permission is required for video call." : "Microphone permission is required for audio call."));
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;

    try {
      endCall({ notify: false });
      const stream = await getCallMedia(incomingCall.type);
      const peer = createPeer(incomingCall.from.id, incomingCall.callId);
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      setSelectedContactId(String(incomingCall.from.id));
      setActiveCall({
        callId: incomingCall.callId,
        type: incomingCall.type,
        contactId: incomingCall.from.id,
        contactName: incomingCall.from.name,
        direction: "incoming",
        startedAt: Date.now(),
        status: "connecting",
      });
      socketRef.current?.emit("call:accept", {
        recipientId: incomingCall.from.id,
        callId: incomingCall.callId,
      });
      stopRingtone();
      setIncomingCall(null);
    } catch (error) {
      console.error("Accept call failed", error);
      setNotice(incomingCall.type === "video" ? "Camera and microphone permission is required to answer video call." : "Microphone permission is required to answer audio call.");
    }
  };

  const rejectCall = () => {
    if (!incomingCall) return;
    socketRef.current?.emit("call:reject", {
      recipientId: incomingCall.from.id,
      callId: incomingCall.callId,
    });
    stopRingtone();
    setIncomingCall(null);
  };

  const toggleMute = () => {
    const nextMuted = !callMuted;
    callStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
    setCallMuted(nextMuted);
  };

  const toggleCamera = () => {
    const nextOff = !cameraOff;
    callStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = !nextOff;
    });
    setCameraOff(nextOff);
  };

  const toggleSpeaker = () => {
    const nextSpeaker = !speakerOn;
    if (remoteAudioRef.current) remoteAudioRef.current.muted = !nextSpeaker;
    setSpeakerOn(nextSpeaker);
  };

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return undefined;

    const socket = io(API.defaults.baseURL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 700,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      fetchContacts({ silent: true });
    });

    socket.on("connect_error", () => {
      setNotice("Chat connection is reconnecting. Calls may not start until it is online.");
    });

    socket.on("presence:update", ({ userId, online, lastSeenAt }) => {
      setContacts((current) =>
        current.map((contact) =>
          String(contact.id) === String(userId) ? { ...contact, online, lastSeenAt } : contact
        )
      );
    });

    socket.on("call:incoming", (payload) => {
      setIncomingCall(payload);
      startRingtone();
    });

    socket.on("call:accepted", async ({ callId, fromId }) => {
      if (!peerRef.current || activeCallRef.current?.callId !== callId) return;
      try {
        setActiveCall((current) => current ? { ...current, status: "connecting" } : current);
        const offer = await peerRef.current.createOffer();
        await peerRef.current.setLocalDescription(offer);
        socket.emit("webrtc:offer", {
          recipientId: fromId,
          callId,
          description: offer,
        });
      } catch (error) {
        console.error("Create offer failed", error);
        setNotice("Call connection failed while creating offer.");
      }
    });

    socket.on("call:rejected", ({ callId }) => {
      if (activeCallRef.current?.callId === callId) {
        setNotice("Call was rejected.");
        endCall({ notify: false });
      }
    });

    socket.on("call:ended", ({ callId }) => {
      if (activeCallRef.current?.callId === callId || incomingCallRef.current?.callId === callId) {
        setNotice("Call ended.");
        endCall({ notify: false });
      }
    });

    socket.on("webrtc:offer", async ({ callId, fromId, description }) => {
      if (!peerRef.current || activeCallRef.current?.callId !== callId) return;
      try {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(description));
        const answer = await peerRef.current.createAnswer();
        await peerRef.current.setLocalDescription(answer);
        socket.emit("webrtc:answer", {
          recipientId: fromId,
          callId,
          description: answer,
        });
      } catch (error) {
        console.error("Handle offer failed", error);
        setNotice("Call connection failed while answering.");
      }
    });

    socket.on("webrtc:answer", async ({ callId, description }) => {
      if (!peerRef.current || activeCallRef.current?.callId !== callId) return;
      try {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(description));
      } catch (error) {
        console.error("Handle answer failed", error);
        setNotice("Call connection failed while connecting.");
      }
    });

    socket.on("webrtc:ice-candidate", async ({ callId, candidate }) => {
      if (!peerRef.current || activeCallRef.current?.callId !== callId) return;
      try {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error("ICE candidate failed", error);
      }
    });

    socket.on("call:error", ({ message }) => {
      setNotice(message || "Call failed.");
      endCall({ notify: false });
    });

    return () => {
      stopRingtone();
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    return () => {
      stopRingtone();
      ringtoneContextRef.current?.close?.().catch(() => {});
      callStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    const currentCall = activeCallRef.current;
    if (currentCall && String(currentCall.contactId) !== String(selectedContactId)) {
      endCall();
    }
  }, [selectedContactId]);

  return (
    <div className="portal-chat">
      <style>{`
        .portal-chat {
          height: calc(100dvh - 104px);
          min-height: 0;
          display: grid;
          grid-template-columns: minmax(250px, 330px) minmax(0, 1fr);
          background: #eef4ff;
          color: #0f172a;
          overflow: hidden;
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
          display: flex;
          flex-direction: column;
          background: #f8fafc;
          overflow: hidden;
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
        .call-start-button {
          background: #16a34a;
          border-color: #16a34a;
          color: #fff;
        }
        .call-start-button:hover:not(:disabled) {
          background: #15803d;
          border-color: #15803d;
        }
        .video-start-button {
          background: #2563eb;
          border-color: #2563eb;
          color: #fff;
        }
        .video-start-button:hover:not(:disabled) {
          background: #1d4ed8;
          border-color: #1d4ed8;
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
        .call-panel {
          margin: 10px 18px 0;
          border-radius: 8px;
          background: #020617;
          color: #fff;
          padding: 12px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 10px;
          align-items: center;
          box-shadow: 0 16px 36px rgba(15, 23, 42, .18);
        }
        .incoming-call {
          background: #0f172a;
          border: 1px solid rgba(96,165,250,.35);
        }
        .call-info {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .call-avatar {
          width: 42px;
          height: 42px;
          border-radius: 8px;
          display: grid;
          place-items: center;
          background: #2563eb;
          flex: 0 0 auto;
        }
        .call-info strong, .call-info span {
          display: block;
          overflow-wrap: anywhere;
        }
        .call-info span {
          margin-top: 3px;
          color: rgba(255,255,255,.72);
          font-size: 13px;
          font-weight: 800;
        }
        .call-video {
          width: min(220px, 34vw);
          aspect-ratio: 16 / 10;
          border-radius: 8px;
          background: #0f172a;
          object-fit: cover;
          border: 1px solid rgba(255,255,255,.16);
        }
        .call-stage {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(150px, 240px);
          gap: 10px;
          align-items: stretch;
        }
        .remote-video, .local-video {
          width: 100%;
          aspect-ratio: 16 / 9;
          max-height: 220px;
          border-radius: 8px;
          object-fit: cover;
          background: #0f172a;
          border: 1px solid rgba(255,255,255,.16);
        }
        .audio-call-surface {
          grid-column: 1 / -1;
          min-height: 68px;
          border-radius: 8px;
          display: grid;
          place-items: center;
          background: rgba(255,255,255,.06);
          color: rgba(255,255,255,.78);
          font-weight: 900;
        }
        .call-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          flex-wrap: wrap;
        }
        .call-control {
          width: 42px;
          height: 42px;
          border: 1px solid rgba(255,255,255,.18);
          border-radius: 8px;
          background: rgba(255,255,255,.08);
          color: #fff;
          display: grid;
          place-items: center;
          cursor: pointer;
        }
        .call-control.active {
          background: #16a34a;
          border-color: #16a34a;
        }
        .call-control.warning {
          background: #f97316;
        }
        .end-call {
          width: 46px;
          height: 46px;
          border: 0;
          border-radius: 8px;
          background: #dc2626;
          color: #fff;
          display: grid;
          place-items: center;
          cursor: pointer;
        }
        .end-call:hover {
          background: #b91c1c;
        }
        .messages {
          flex: 1 1 auto;
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
          position: sticky;
          bottom: 0;
          z-index: 2;
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
            height: calc(100dvh - 92px);
            min-height: 0;
            grid-template-columns: 1fr;
            grid-template-rows: auto minmax(0, 1fr);
            background: #e9f2ee;
          }
          .chat-sidebar {
            min-height: 0;
            max-height: 104px;
            grid-template-rows: 38px 48px;
            gap: 6px;
            padding: 7px 8px;
            overflow: hidden;
          }
          .chat-brand, .signed-in { display: none; }
          .contact-select {
            height: 38px;
            padding: 7px 9px;
            border-radius: 8px;
            font-size: 13px;
          }
          .contact-list {
            display: grid;
            grid-auto-flow: column;
            grid-auto-columns: minmax(138px, 46%);
            gap: 6px;
            overflow-x: auto;
            overflow-y: hidden;
            padding-bottom: 2px;
            scrollbar-width: none;
          }
          .contact-list::-webkit-scrollbar {
            display: none;
          }
          .contact-item {
            min-height: 44px;
            padding: 7px 9px;
          }
          .contact-name {
            font-size: 14px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .contact-meta {
            margin-top: 2px;
            font-size: 10px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .chat-header {
            min-height: 52px;
            padding: 7px 9px;
            align-items: center;
            gap: 8px;
          }
          .chat-person h2 {
            font-size: 16px;
            line-height: 1.1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .presence {
            margin-top: 2px;
            font-size: 11px;
          }
          .header-actions {
            gap: 5px;
            flex-wrap: nowrap;
          }
          .header-actions .icon-button {
            width: 34px;
            height: 34px;
          }
          .lock-panel {
            margin: 6px 8px 0;
            padding: 8px;
            grid-template-columns: 1fr;
            gap: 7px;
          }
          .lock-panel > svg, .lock-copy small {
            display: none;
          }
          .code-input {
            min-height: 38px;
            padding: 8px 10px;
          }
          .primary-button {
            min-height: 38px;
            padding: 0 11px;
          }
          .messages {
            flex: 1 1 auto;
            min-height: 0;
            padding: 10px 8px;
            background: #eef6f2;
          }
          .empty {
            min-height: 120px;
            padding: 10px;
            font-size: 13px;
          }
          .message-row {
            margin-bottom: 7px;
          }
          .message-bubble {
            max-width: 86%;
            padding: 8px 10px;
            box-shadow: 0 4px 12px rgba(15, 23, 42, .08);
          }
          .message-row.mine .message-bubble {
            background: #16a34a;
            border-color: #16a34a;
          }
          .message-meta {
            font-size: 10px;
            gap: 6px;
          }
          .message-text {
            margin-top: 5px;
            line-height: 1.4;
          }
          img.message-media, video.message-media {
            max-height: 220px;
          }
          audio.message-media {
            width: min(280px, 100%);
          }
          .notice {
            margin: 6px 8px 0;
            padding: 8px 10px;
            font-size: 12px;
          }
          .call-panel {
            margin: 6px 8px 0;
            padding: 8px;
            grid-template-columns: 1fr auto;
            gap: 8px;
          }
          .call-actions {
            justify-content: flex-start;
          }
          .call-avatar {
            width: 34px;
            height: 34px;
          }
          .call-info {
            gap: 8px;
          }
          .call-info strong {
            font-size: 13px;
          }
          .call-info span {
            font-size: 11px;
          }
          .call-control, .end-call {
            width: 36px;
            height: 36px;
          }
          .call-video {
            grid-column: 1 / -1;
            width: 100%;
          }
          .call-stage {
            grid-template-columns: 1fr;
          }
          .remote-video, .local-video {
            max-height: 160px;
          }
          .audio-call-surface {
            min-height: 48px;
            font-size: 12px;
          }
          .input-row {
            grid-template-columns: 36px 36px minmax(0, 1fr) 42px;
            gap: 6px;
            align-items: center;
          }
          .input-row .icon-button {
            width: 36px;
            height: 36px;
          }
          .textarea {
            min-height: 38px;
            max-height: 84px;
            padding: 8px 10px;
            font-size: 14px;
          }
          .primary-button.send-label span { display: none; }
          .composer {
            padding: 7px 8px calc(7px + env(safe-area-inset-bottom));
            flex: 0 0 auto;
          }
        }
        @media (max-width: 480px) {
          .portal-chat {
            height: calc(100dvh - 76px);
          }
          .chat-sidebar {
            max-height: 86px;
            grid-template-rows: 36px 38px;
            padding: 5px 7px;
          }
          .contact-list {
            grid-auto-columns: minmax(118px, 44%);
          }
          .contact-item {
            min-height: 36px;
            padding: 5px 8px;
          }
          .contact-meta {
            display: none;
          }
          .chat-header {
            min-height: 48px;
            padding: 6px 8px;
          }
          .header-actions .icon-button {
            width: 32px;
            height: 32px;
          }
          .messages {
            padding: 8px 7px;
          }
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
            <button type="button" className="icon-button call-start-button" title="Audio call" onClick={() => startCall("audio")} disabled={!unlocked}>
              <Phone size={19} />
            </button>
            <button type="button" className="icon-button video-start-button" title="Video call" onClick={() => startCall("video")} disabled={!unlocked}>
              <Video size={19} />
            </button>
            <button type="button" className="icon-button" title="Clear chat" onClick={clearChat}>
              <Trash2 size={19} />
            </button>
          </div>
        </header>

        {notice ? <div className="notice">{notice}</div> : null}

        {incomingCall ? (
          <section className="call-panel incoming-call">
            <div className="call-info">
              <div className="call-avatar">
                {incomingCall.type === "video" ? <Video size={23} /> : <Phone size={23} />}
              </div>
              <div>
                <strong>{incomingCall.from.name} is calling</strong>
                <span>{incomingCall.type === "video" ? "Incoming video call" : "Incoming audio call"}</span>
              </div>
            </div>
            <div className="call-actions">
              <button type="button" className="call-control active" title="Accept call" onClick={acceptCall}>
                <Phone size={20} />
              </button>
              <button type="button" className="end-call" title="Reject call" onClick={rejectCall}>
                <PhoneOff size={21} />
              </button>
            </div>
          </section>
        ) : null}

        {activeCall ? (
          <section className="call-panel">
            <div className="call-info">
              <div className="call-avatar">
                {activeCall.type === "video" ? <Video size={23} /> : <Phone size={23} />}
              </div>
              <div>
                <strong>{activeCall.type === "video" ? "Video call" : "Audio call"} with {activeCall.contactName || selectedContact?.name}</strong>
                <span>{activeCall.status === "connected" ? "Connected" : activeCall.direction === "incoming" ? "Connecting..." : "Calling..."}</span>
              </div>
            </div>
            <div className="call-actions">
              <button type="button" className={`call-control ${callMuted ? "warning" : ""}`} title={callMuted ? "Unmute microphone" : "Mute microphone"} onClick={toggleMute}>
                {callMuted ? <Mic size={18} /> : <Mic size={18} />}
              </button>
              <button type="button" className={`call-control ${speakerOn ? "active" : "warning"}`} title={speakerOn ? "Speaker on" : "Speaker muted"} onClick={toggleSpeaker}>
                {speakerOn ? <Volume2 size={19} /> : <VolumeX size={19} />}
              </button>
              {activeCall.type === "video" ? (
                <button type="button" className={`call-control ${cameraOff ? "warning" : ""}`} title={cameraOff ? "Turn camera on" : "Turn camera off"} onClick={toggleCamera}>
                  {cameraOff ? <VideoOff size={19} /> : <Video size={19} />}
                </button>
              ) : null}
              <button type="button" className="end-call" title="End call" onClick={() => endCall()}>
                <PhoneOff size={21} />
              </button>
            </div>
            <audio ref={remoteAudioRef} autoPlay playsInline />
            {activeCall.type === "video" ? (
              <div className="call-stage">
                <video ref={remoteVideoRef} className="remote-video" autoPlay playsInline />
                <video ref={localVideoRef} className="local-video" autoPlay muted playsInline />
              </div>
            ) : (
              <div className="audio-call-surface">
                {activeCall.status === "connected" ? "Audio connected" : "Waiting for answer..."}
              </div>
            )}
          </section>
        ) : null}

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
