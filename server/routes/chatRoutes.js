import express from "express";
import jwt from "jsonwebtoken";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

const router = express.Router();

// Verify token middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// Generate random verification code
const generateVerificationCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

/**
 * Start chat or get existing chat
 * POST /api/chat/start
 * Body: { teacherId, studentId (optional for teacher), verificationCode (optional) }
 */
router.post("/start", verifyToken, async (req, res) => {
  try {
    const { teacherId, studentId, verificationCode } = req.body;

    // Determine which user is student/teacher
    let chatStudentId, chatTeacherId;
    let isNewChat = false;

    if (req.userRole === "student") {
      chatStudentId = req.userId;
      chatTeacherId = teacherId;
    } else if (req.userRole === "teacher") {
      chatStudentId = studentId;
      chatTeacherId = req.userId;
    } else {
      return res.status(403).json({ message: "Only students and teachers can chat" });
    }

    // Check if chat exists
    let chat = await Chat.findOne({
      studentId: chatStudentId,
      teacherId: chatTeacherId,
    });

    if (chat) {
      // Chat exists - verify code if not already verified
      if (!chat.isVerified && verificationCode) {
        if (chat.verificationCode === verificationCode) {
          chat.isVerified = true;
          await chat.save();
        } else {
          return res.status(401).json({ message: "Invalid verification code" });
        }
      }

      // Update last online
      if (req.userRole === "student") {
        chat.studentLastOnline = new Date();
      } else {
        chat.teacherLastOnline = new Date();
      }
      await chat.save();

      return res.status(200).json({
        success: true,
        chat,
        isNew: false,
      });
    }

    // Create new chat with verification code
    const newCode = generateVerificationCode();

    const studentUser = await User.findById(chatStudentId);
    const teacherUser = await User.findById(chatTeacherId);

    if (!studentUser || !teacherUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const newChat = new Chat({
      studentId: chatStudentId,
      studentName: studentUser.name,
      teacherId: chatTeacherId,
      teacherName: teacherUser.name,
      verificationCode: newCode,
      studentLastOnline: req.userRole === "student" ? new Date() : null,
      teacherLastOnline: req.userRole === "teacher" ? new Date() : null,
    });

    await newChat.save();

    res.status(201).json({
      success: true,
      chat: newChat,
      isNew: true,
      verificationCode: newCode, // Send to initiator only
    });
  } catch (error) {
    console.error("Start chat error:", error);
    res.status(500).json({ message: "Failed to start chat", error: error.message });
  }
});

/**
 * Send message
 * POST /api/chat/:chatId/send
 * Body: { text }
 */
router.post("/:chatId/send", verifyToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Verify user is part of this chat
    if (
      req.userId !== String(chat.studentId) &&
      req.userId !== String(chat.teacherId)
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Check if chat is verified
    if (!chat.isVerified) {
      return res
        .status(403)
        .json({ message: "Chat not verified. Please verify with code first." });
    }

    const user = await User.findById(req.userId);

    const message = new Message({
      chatId,
      senderId: req.userId,
      senderName: user.name,
      senderRole: req.userRole,
      text: text.trim(),
    });

    await message.save();

    // Update chat's last message
    chat.lastMessage = text.trim();
    chat.lastMessageTime = new Date();
    if (req.userRole === "student") {
      chat.studentLastOnline = new Date();
    } else {
      chat.teacherLastOnline = new Date();
    }
    await chat.save();

    res.status(201).json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ message: "Failed to send message", error: error.message });
  }
});

/**
 * Get messages for a chat
 * GET /api/chat/:chatId/messages?limit=50&skip=0
 */
router.get("/:chatId/messages", verifyToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Verify user is part of this chat
    if (
      req.userId !== String(chat.studentId) &&
      req.userId !== String(chat.teacherId)
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const messages = await Message.find({ chatId, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    res.status(200).json({
      success: true,
      messages: messages.reverse(),
    });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ message: "Failed to get messages", error: error.message });
  }
});

/**
 * Mark message as read
 * PUT /api/chat/:chatId/read
 * Body: { messageIds: [...] }
 */
router.put("/:chatId/read", verifyToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { messageIds } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Verify user is part of this chat
    if (
      req.userId !== String(chat.studentId) &&
      req.userId !== String(chat.teacherId)
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (messageIds && Array.isArray(messageIds)) {
      await Message.updateMany(
        { _id: { $in: messageIds } },
        { isRead: true, readAt: new Date() }
      );
    }

    // Update last seen
    if (req.userRole === "student") {
      chat.studentLastSeen = new Date();
    } else {
      chat.teacherLastSeen = new Date();
    }
    await chat.save();

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Mark read error:", error);
    res.status(500).json({ message: "Failed to mark as read", error: error.message });
  }
});

/**
 * Get all chats for current user
 * GET /api/chat/list
 */
router.get("/list", verifyToken, async (req, res) => {
  try {
    let chats;

    if (req.userRole === "student") {
      chats = await Chat.find({ studentId: req.userId, isActive: true }).sort({
        lastMessageTime: -1,
      });
    } else if (req.userRole === "teacher") {
      chats = await Chat.find({ teacherId: req.userId, isActive: true }).sort({
        lastMessageTime: -1,
      });
    } else {
      return res.status(403).json({ message: "Only students and teachers can view chats" });
    }

    res.status(200).json({
      success: true,
      chats,
    });
  } catch (error) {
    console.error("Get chats error:", error);
    res.status(500).json({ message: "Failed to get chats", error: error.message });
  }
});

/**
 * Get single chat details
 * GET /api/chat/:chatId
 */
router.get("/:chatId", verifyToken, async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Verify user is part of this chat
    if (
      req.userId !== String(chat.studentId) &&
      req.userId !== String(chat.teacherId)
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.status(200).json({
      success: true,
      chat,
    });
  } catch (error) {
    console.error("Get chat error:", error);
    res.status(500).json({ message: "Failed to get chat", error: error.message });
  }
});

/**
 * Update last online status
 * PUT /api/chat/:chatId/online
 */
router.put("/:chatId/online", verifyToken, async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (req.userRole === "student") {
      chat.studentLastOnline = new Date();
    } else if (req.userRole === "teacher") {
      chat.teacherLastOnline = new Date();
    }

    await chat.save();

    res.status(200).json({ success: true, chat });
  } catch (error) {
    console.error("Update online error:", error);
    res.status(500).json({ message: "Failed to update status", error: error.message });
  }
});

export default router;
