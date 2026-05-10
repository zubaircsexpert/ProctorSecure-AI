# AI-Powered Quiz Generator System - Complete Documentation

## 📋 Overview

This is a **comprehensive, production-ready Quiz Generator System** built with React.js, Node.js, Express, MongoDB, and OpenAI API. It enables teachers to:

- Upload PDF, DOCX, TXT, Images, and Excel files
- Automatically extract text using pdf-parse, mammoth, and Tesseract OCR
- Generate professional MCQs using OpenAI's GPT-4 Turbo
- Preview, edit, approve, and manage generated questions
- Import/export MCQs in Excel format
- Assemble quizzes with customizable difficulty distribution
- Track student performance with detailed analytics
- Detect plagiarism and cheating attempts
- Generate student performance reports

---

## 🗂️ Project Structure

```
server/
├── models/
│   ├── MCQBank.js              # Store all generated MCQs
│   ├── QuizTemplate.js         # Quiz configuration templates
│   ├── QuizSession.js          # Track quiz attempts
│   ├── CheatDetection.js       # Plagiarism & cheating data
│   ├── QuizAnalytics.js        # Performance analytics
│   └── ... (existing models)
│
├── routes/
│   ├── quizRoutes.js           # MCQ generation & management APIs
│   ├── quizAssemblyRoutes.js   # Quiz assembly & taking APIs
│   └── ... (existing routes)
│
├── utils/
│   ├── mcqGenerator.js         # OpenAI integration
│   ├── excelHandler.js         # Excel import/export
│   ├── cheatDetection.js       # Plagiarism detection
│   ├── analyticsCalculator.js  # Analytics computation
│   └── quizGenerator.js        # Text extraction (existing)
│
└── index.js                    # Main server file

client/
├── src/
│   └── components/
│       └── quiz/
│           ├── QuizGeneratorPanel.jsx      # Main UI component
│           ├── FileUploadArea.jsx          # Drag-and-drop upload
│           ├── MCQPreview.jsx              # MCQ preview & management
│           ├── MCQEditor.jsx               # Edit individual MCQs
│           ├── AnalyticsDashboard.jsx      # Performance dashboard
│           └── QuizTakingComponent.jsx     # Student quiz interface
```

---

## 🔧 Backend API Endpoints

### MCQ Generation & Management

#### 1. Upload and Extract Text
```
POST /api/quiz/upload-material
Authorization: Bearer <token>
Content-Type: multipart/form-data

Response:
{
  "success": true,
  "fileName": "document.pdf",
  "fileSize": 1024000,
  "extractedText": "...",
  "fullTextLength": 5000,
  "filePath": "/uploads/quiz-materials/..."
}
```

#### 2. Generate MCQs with AI
```
POST /api/quiz/generate-mcqs
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "text": "extracted text from document",
  "numberOfQuestions": 10,
  "difficulty": "mixed",        // easy, medium, hard, mixed
  "examType": "competitive",    // competitive, university, academic
  "bloomsLevel": "mixed",       // remember, understand, apply, analyze, evaluate, create
  "mcqType": "mixed",           // factual, conceptual, analytical, tricky
  "subject": "English",
  "topic": "Grammar"
}

Response:
{
  "success": true,
  "mcqs": [
    {
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "...",
      "difficulty": "medium",
      "bloomsLevel": "understand",
      "mcqType": "conceptual",
      "marks": 1,
      "topic": "Grammar"
    }
  ],
  "duplicatesDetected": 0,
  "generationTime": 12.5
}
```

#### 3. Save MCQs to Database
```
POST /api/quiz/save-mcqs
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "mcqs": [...array of MCQs...],
  "quizId": "optional-quiz-id",
  "topic": "Grammar",
  "subject": "English"
}

Response:
{
  "success": true,
  "savedCount": 10,
  "mcqIds": [...]
}
```

#### 4. Get MCQs with Pagination & Filtering
```
GET /api/quiz/mcqs?page=1&limit=20&difficulty=medium&topic=Grammar&status=draft&search=verb
Authorization: Bearer <token>

Response:
{
  "success": true,
  "mcqs": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

#### 5. Edit MCQ
```
PUT /api/quiz/mcqs/:mcqId
Authorization: Bearer <token>
Content-Type: application/json

Body: { updated MCQ data }

Response: { success: true, mcq: {...} }
```

#### 6. Delete MCQ
```
DELETE /api/quiz/mcqs/:mcqId
Authorization: Bearer <token>

Response: { success: true, message: "MCQ deleted" }
```

#### 7. Bulk Delete MCQs
```
POST /api/quiz/mcqs/bulk-delete
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "mcqIds": ["id1", "id2", "id3", ...]
}

Response:
{
  "success": true,
  "deletedCount": 3,
  "message": "Deleted 3 MCQs"
}
```

#### 8. Approve MCQs
```
POST /api/quiz/mcqs/approve
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "mcqIds": ["id1", "id2", ...]
}

Response:
{
  "success": true,
  "modifiedCount": 2,
  "message": "Approved 2 MCQs"
}
```

#### 9. Regenerate Weak Questions
```
POST /api/quiz/mcqs/regenerate-weak
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "mcqIds": ["id1", "id2", ...]
}

Response:
{
  "success": true,
  "regeneratedCount": 2,
  "newMCQIds": ["new-id1", "new-id2"],
  "message": "Regenerated 2 MCQs"
}
```

#### 10. Export to Excel
```
POST /api/quiz/export-excel
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "mcqIds": ["id1", "id2", ...]  // Optional, exports all if not provided
}

Response: Excel file (.xlsx)
```

#### 11. Import from Excel
```
POST /api/quiz/import-excel
Authorization: Bearer <token>
Content-Type: multipart/form-data

File: Excel file with MCQ structure

Response:
{
  "success": true,
  "importedCount": 10,
  "mcqIds": [...]
}
```

### Quiz Assembly & Taking

#### 1. Create Quiz Template
```
POST /api/quiz-assembly/templates
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "name": "Template Name",
  "totalQuestions": 10,
  "timeLimit": 60,
  "totalMarks": 10,
  "passingMarks": 5,
  "negativeMarking": true,
  "difficultyDistribution": {
    "easy": 30,
    "medium": 40,
    "hard": 30
  },
  "selectedTopics": ["Topic1", "Topic2"]
}
```

#### 2. Create Quiz from MCQs
```
POST /api/quiz-assembly/create-quiz
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "quizName": "Quiz Name",
  "description": "Quiz description",
  "mcqIds": [...] or "templateId": "...",
  "totalMarks": 10
}

Response:
{
  "success": true,
  "quiz": {...},
  "quizId": "...",
  "questionsCount": 10
}
```

#### 3. Get Quiz to Take
```
GET /api/quiz-assembly/take-quiz/:quizId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "sessionId": "...",
  "quizTitle": "Quiz Name",
  "totalQuestions": 10,
  "questions": [
    {
      "_id": "...",
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "difficulty": "medium"
    }
  ],
  "timeLimit": 60
}
```

#### 4. Submit Quiz Answers
```
POST /api/quiz-assembly/submit-quiz/:sessionId
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "answers": [
    {
      "questionId": "...",
      "selectedOption": "Option A",
      "isCorrect": false
    }
  ],
  "timeSpent": 1800  // seconds
}

Response:
{
  "success": true,
  "score": 8,
  "percentage": 80,
  "passed": true
}
```

#### 5. Get Quiz Results
```
GET /api/quiz-assembly/results/:sessionId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "session": {...},
  "results": {
    "score": 8,
    "percentage": 80,
    "passed": true,
    "totalQuestions": 10,
    "answeredQuestions": 10,
    "skippedQuestions": 0
  }
}
```

#### 6. Get Analytics Dashboard
```
GET /api/quiz-assembly/analytics/:quizId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "statistics": {
    "totalAttempts": 15,
    "totalStudents": 12,
    "averageScore": 7.5,
    "passPercentage": 73.33,
    "passFailCount": { "pass": 11, "fail": 4 }
  },
  "questionPerformance": [...],
  "difficultyAnalysis": {...},
  "topicAnalysis": [...],
  "timeAnalysis": {...},
  "weakQuestions": [...]
}
```

#### 7. Detect Cheating
```
POST /api/quiz-assembly/detect-cheating/:quizId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "results": {
    "similarAnswers": [
      {
        "student1Id": "...",
        "student2Id": "...",
        "matchPercentage": 85,
        "riskScore": 92
      }
    ],
    "suspiciousStudents": [...],
    "report": {...}
  }
}
```

---

## 🎨 Frontend Components

### 1. QuizGeneratorPanel
Main component that orchestrates the entire MCQ generation workflow.

**Features:**
- Step-by-step process (Upload → Generate → Preview → Save)
- Real-time generation progress
- File upload with drag-and-drop
- Customizable generation settings
- Preview and bulk actions

**Usage:**
```jsx
import QuizGeneratorPanel from './components/quiz/QuizGeneratorPanel';

function TeacherDashboard() {
  return <QuizGeneratorPanel />;
}
```

### 2. FileUploadArea
Reusable component for file uploads with drag-and-drop support.

**Props:**
- `onFileSelect(file)` - Callback when file is selected
- `isLoading` - Show loading state

### 3. MCQPreview
Displays list of MCQs with filtering, searching, and bulk actions.

**Features:**
- Search MCQs by question or topic
- Filter by difficulty level
- Select multiple MCQs for bulk operations
- Inline preview of options
- Edit, delete, approve, regenerate

### 4. MCQEditor
Modal component for editing individual MCQs.

**Features:**
- Edit question text
- Modify options
- Change correct answer
- Update difficulty, topic, explanation
- Form validation

### 5. AnalyticsDashboard
Displays comprehensive analytics with charts and metrics.

**Metrics:**
- Total attempts and unique students
- Average score and pass rate
- Score distribution
- Difficulty-wise performance
- Topic-wise performance
- Weak questions identification

### 6. QuizTakingComponent
Full-featured quiz interface for students.

**Features:**
- Timer countdown
- Question navigation
- Mark for review
- Answer tracking
- Real-time progress

---

## 🔐 Authentication

All endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

**Role-based access:**
- `teacher` or `admin` - Can generate, edit, manage MCQs
- `student` - Can take quizzes
- `admin` - Full access

---

## 📊 Database Schemas

### MCQBank
Stores all generated MCQs with metadata
- question, options, correctAnswer
- difficulty, bloomsLevel, mcqType
- topic, explanation, marks
- status (draft/approved/rejected)
- sourceType (generated/imported/manual)
- usageCount, averageScore
- metadata, similarQuestions

### QuizTemplate
Configuration templates for quiz generation
- difficulty distribution
- Bloom's taxonomy distribution
- MCQ type distribution
- topic selection
- timer and grading settings

### QuizSession
Tracks individual quiz attempts
- studentId, quizId, teacherId
- answers with correctness and time spent
- score, percentage, passed status
- device and IP information

### CheatDetection
Records of flagged suspicious attempts
- detection type and severity
- risk score
- matched students/answers
- review status and notes
- action taken

### QuizAnalytics
Aggregated performance data
- overall statistics
- question-wise performance
- difficulty/topic/Bloom's analysis
- weak questions
- student performance metrics
- cheating alerts

---

## 🚀 Implementation Features

### 1. Text Extraction
- **PDF**: Uses pdf-parse for text extraction
- **DOCX**: Uses mammoth for .docx parsing
- **TXT**: Direct file reading
- **Images**: Tesseract OCR for scanned PDFs
- **Multilingual**: Supports English and Urdu

### 2. MCQ Generation
- **AI-Powered**: OpenAI GPT-4 Turbo
- **Configurable**: Difficulty, Bloom's level, MCQ type
- **Smart Distribution**: Automatic difficulty balancing
- **Duplicate Detection**: Jaro-Winkler similarity checking
- **Professional Quality**: Avoids ambiguous questions

### 3. Analytics
- **Real-time**: Updates after each quiz submission
- **Comprehensive**: Question, difficulty, topic, student analysis
- **Weak Question Detection**: Identifies struggling areas
- **Trend Analysis**: Student improvement tracking
- **Time Analytics**: Average time per question

### 4. Cheating Detection
- **Answer Similarity**: Compares student responses
- **Timing Analysis**: Detects impossible timing patterns
- **Pattern Matching**: Identifies suspicious answer patterns
- **AI Detection**: Flags AI-generated responses
- **Risk Scoring**: Quantifies cheating probability

---

## ⚙️ Environment Variables

```bash
# Server
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
OPENAI_API_KEY=sk-...
CLIENT_URL=http://localhost:5173

# Optional
SMTP_HOST=smtp.gmail.com
SMTP_USER=email@gmail.com
SMTP_PASS=password
SMTP_PORT=587
SMTP_SECURE=true
```

---

## 📦 Installation & Setup

### Server Setup
```bash
cd server
npm install
# Ensure environment variables are set
npm run dev
```

### Client Setup
```bash
cd client
npm install
# Set VITE_API_URL in .env.local
npm run dev
```

---

## 🎯 Key Features Summary

✅ **AI MCQ Generation** - Generate 10-100+ questions from documents  
✅ **Multiple File Formats** - PDF, DOCX, TXT, Images, Excel  
✅ **Text Extraction** - Advanced extraction with OCR  
✅ **Professional Quality** - Competitive exam-level questions  
✅ **Smart Editing** - Edit, approve, regenerate weak questions  
✅ **Excel Support** - Import/export MCQs in Excel format  
✅ **Quiz Assembly** - Create quizzes with distribution control  
✅ **Student Quizzes** - Timer, navigation, mark for review  
✅ **Analytics Dashboard** - Comprehensive performance metrics  
✅ **Cheating Detection** - Plagiarism & suspicious answer detection  
✅ **Responsive UI** - Modern design with Tailwind CSS  
✅ **Production Ready** - Error handling, validation, optimization  

---

## 🔍 Troubleshooting

### MCQs not generating
1. Check OpenAI API key is valid
2. Ensure extracted text is not empty
3. Check token usage and API limits

### File upload fails
1. Verify file format is supported
2. Check file size < 50MB
3. Ensure disk space available

### Analytics not updating
1. Wait for quiz submissions to complete
2. Check database connection
3. Verify quiz ID is correct

---

## 📄 License

This project is proprietary and confidential.

---

**Built with ❤️ for ProctorSecure AI**
