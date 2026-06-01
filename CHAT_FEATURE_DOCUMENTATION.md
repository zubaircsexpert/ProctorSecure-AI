# Direct Messaging Feature - Complete Documentation

## 📋 Overview

A secure, responsive student-teacher messaging system with verification codes, message status tracking, and online presence detection.

## ✨ Features Implemented

### 1. **Responsive Design**
- ✅ **Mobile-First**: Full-screen chat on mobile devices
- ✅ **Tablet Optimized**: Split-view with sidebar
- ✅ **Desktop**: Single-screen layout with chat list (340px sidebar) + chat window
- ✅ Auto-adapts layout based on screen size (breakpoint: 1024px)

### 2. **Security - Verification Code System**
**First-Time Chat:**
- When a student initiates chat with teacher (or vice versa), a unique 6-digit code is generated
- Both parties receive this code
- Student/teacher must share this code for verification
- Code is displayed in golden alert box

**Subsequent Chats:**
- Chat remains verified after first exchange
- Lock icon (🔒) shows unverified chats in list
- Cannot send messages until chat is verified

### 3. **Message Status Indicators**
- ⏱️ **Clock icon**: Message sending
- ✓ **Single tick**: Message sent
- ✔️ **Double blue tick**: Message read/seen

### 4. **Online Status & Last Seen**
- Real-time last online tracking
- Format: "Online now" / "5m ago" / "2h ago" / "3d ago"
- Updates every 10 seconds
- Shows in chat header

### 5. **User-Specific Communication**
- Student can only chat with their specific teacher(s)
- Teacher can only chat with their student(s)
- Each chat is unique pair (Student ID + Teacher ID)

## 📁 Project Structure

### Backend Files
```
server/
├── models/
│   ├── Chat.js          # Chat session model
│   └── Message.js       # Message model
├── routes/
│   └── chatRoutes.js    # All chat endpoints
└── index.js             # Server (updated with routes)
```

### Frontend Files
```
client/src/
├── pages/
│   └── Chat.jsx         # Main chat page
├── components/
│   ├── ChatList.jsx     # Chat list sidebar
│   ├── ChatWindow.jsx   # Chat message window
│   └── Navbar.jsx       # Updated with chat icon
└── App.jsx              # Updated with chat route
```

## 🔌 API Endpoints

### 1. **Start/Create Chat**
```
POST /api/chat/start
Body: { teacherId, studentId, verificationCode (optional) }
Response: { chat, isNew, verificationCode }
```

### 2. **Send Message**
```
POST /api/chat/:chatId/send
Body: { text }
Response: { message }
```

### 3. **Get Messages**
```
GET /api/chat/:chatId/messages?limit=50&skip=0
Response: { messages }
```

### 4. **Mark as Read**
```
PUT /api/chat/:chatId/read
Body: { messageIds: [...] }
Response: { success }
```

### 5. **Get All Chats**
```
GET /api/chat/list
Response: { chats }
```

### 6. **Get Single Chat**
```
GET /api/chat/:chatId
Response: { chat }
```

### 7. **Update Online Status**
```
PUT /api/chat/:chatId/online
Response: { chat }
```

## 🎯 User Flows

### Student Starting Chat
1. Student clicks 💬 icon in navbar
2. Clicks "New" button
3. Enters teacher ID/Email
4. **First time**: Receives verification code
5. Shares code with teacher
6. Teacher enters same code
7. Chat is now verified and ready

### Teacher Responding to Chat
1. Student initiates chat first (gets code)
2. Teacher clicks 💬 icon
3. See student's chat with 🔒 icon
4. Click on it, enter student's verification code
5. Chat is now verified

### Sending Messages
1. Open chat (if verified)
2. Type message at bottom
3. Press Enter or click Send
4. Message shows with clock icon (sending)
5. Changes to single tick (sent)
6. Recipient sees message, clock changes to double blue tick (read)

## 💾 Database Models

### Chat Schema
```javascript
{
  studentId: ObjectId,
  studentName: String,
  teacherId: ObjectId,
  teacherName: String,
  verificationCode: String (unique),
  isVerified: Boolean,
  studentLastSeen: Date,
  teacherLastSeen: Date,
  studentLastOnline: Date,
  teacherLastOnline: Date,
  lastMessage: String,
  lastMessageTime: Date,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Message Schema
```javascript
{
  chatId: ObjectId,
  senderId: ObjectId,
  senderName: String,
  senderRole: String,
  text: String,
  isRead: Boolean,
  readAt: Date,
  isDeleted: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## 🚀 How to Test

### 1. **Create Test Accounts**
- Create student account
- Create teacher account
- Note their IDs (visible in profile)

### 2. **Start Chat**
- Login as student
- Go to /chat or click 💬 icon
- Click "New" and enter teacher ID
- Copy verification code displayed

### 3. **Verify Chat**
- Login as teacher
- Go to /chat
- Click 💬 icon on student chat (shows 🔒)
- Paste verification code
- Chat unlocked!

### 4. **Send Messages**
- Send message from either end
- See ticks update in real-time
- Check "Last online" status

### 5. **Test Responsive**
- Open on mobile (should be full-screen)
- Open on tablet (should be side-by-side)
- Open on desktop (modal style)
- Resize browser to test breakpoints

## 🎨 UI Components

### ChatList (Sidebar)
- Shows all conversations
- "New" button to start chat
- Last message preview
- Last message time
- Verification status (🔒 icon)
- User avatar (initials)

### ChatWindow (Main)
- Header: User name + last online time
- Messages: With timestamps and read status
- Date separators between messages
- Input field: Type message + send button
- Auto-scroll to latest message
- Responsive padding/sizing

### Navbar Addition
- New 💬 icon added to navbar
- Works on mobile and desktop
- Links to /chat page

## ⚙️ Configuration

### Message Polling
- Default: 2 seconds (updates messages)
- Location: ChatWindow.jsx useEffect

### Online Status Update
- Default: 10 seconds
- Location: ChatWindow.jsx useEffect

To change these intervals, modify in `ChatWindow.jsx`:
```javascript
const interval = setInterval(loadMessages, 2000);  // Messages
const interval = setInterval(updateOnline, 10000); // Online status
```

## 🔐 Security Notes

1. **Token-based Auth**: All endpoints require JWT token
2. **User Verification**: Endpoints verify user is part of chat
3. **Code Verification**: 6-digit alphanumeric code prevents unauthorized access
4. **Message Ownership**: Only sender/recipient can access chat
5. **CORS**: Enabled for cross-origin requests

## 📱 Mobile Behavior

- Full-screen chat interface
- Back button (← ) returns to chat list
- Optimized keyboard handling
- Touch-friendly buttons (44px minimum)
- Responsive text sizes

## 🖥️ Desktop Behavior

- Modal style (centered, 600px max width)
- Semi-transparent backdrop blur
- Sidebar + chat list visible
- Can close modal to return to list

## 🐛 Common Issues & Solutions

### Chat showing "Not verified"
- Make sure both parties entered the same code
- Code is case-insensitive (automatically uppercase)
- Each chat has unique code

### Messages not appearing
- Refresh page
- Check internet connection
- Ensure both users are logged in
- Verify chat is marked as verified

### Last online not updating
- Online status updates every 10 seconds
- Check system clock on server/client
- May show "5m ago" instead of "now" due to polling interval

### Code not generated
- New chats automatically generate code
- Code displays in golden alert box
- Share with the other party

## 📝 Next Steps (Optional Enhancements)

1. **Real-time Socket.io**: Replace polling with WebSocket
2. **Typing Indicators**: Show "user is typing..."
3. **File Sharing**: Support image/document uploads
4. **Message Search**: Search across messages
5. **Message Reactions**: Emoji reactions to messages
6. **Group Chat**: Multiple students + teacher
7. **Chat History Export**: Download conversation
8. **Message Pinning**: Pin important messages
9. **Read Receipts**: Timestamp of when read
10. **Chat Archiving**: Hide inactive chats

## 📞 Support

For issues or questions, check:
1. Browser console for JavaScript errors
2. Network tab for API responses
3. MongoDB logs for database errors
4. Server logs for backend issues
