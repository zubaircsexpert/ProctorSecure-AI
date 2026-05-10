# Quiz Generator System - Quick Start Guide

## 🚀 Quick Overview

The AI-powered Quiz Generator System is a comprehensive solution that enables teachers to:
1. **Upload** documents (PDF, DOCX, TXT, Images, Excel)
2. **Generate** professional MCQs using OpenAI GPT-4
3. **Preview & Edit** questions before saving
4. **Create Quizzes** with customizable settings
5. **Track Analytics** and detect cheating

---

## 📱 For Teachers

### Step 1: Upload Documents
1. Go to Teacher Panel → Quiz Generator
2. Click "Upload Material" section
3. Drag & drop file or click to browse
4. Supported formats: PDF, DOCX, TXT, PNG, JPG, GIF, Excel

### Step 2: Configure Generation Settings
1. Enter number of questions (1-100)
2. Select difficulty: Easy, Medium, Hard, or Mixed
3. Choose exam type: Competitive, Academic, University
4. Optionally set subject and topic
5. Click "Generate MCQs"

### Step 3: Preview & Edit
- View all generated MCQs in a list
- Search by question text or topic
- Filter by difficulty level
- Click "Edit" to modify any question
- Select multiple questions for bulk actions:
  - Approve (publish)
  - Regenerate (create new versions)
  - Delete
- Export to Excel anytime

### Step 4: Save to Database
1. Review all questions
2. Click "Save to Database"
3. Questions saved with "draft" status
4. Can approve later in bulk

### Step 5: Create Quiz
1. Go to "Create Quiz"
2. Select MCQs or use template
3. Configure quiz settings:
   - Time limit
   - Total marks
   - Passing percentage
   - Negative marking
   - Question shuffling
4. Publish quiz for students

### Step 6: Monitor Analytics
1. View quiz dashboard
2. Check performance metrics:
   - Average score
   - Pass rate
   - Student statistics
3. Identify weak questions
4. Detect cheating attempts

---

## 👨‍🎓 For Students

### Taking a Quiz
1. Navigate to available quizzes
2. Click "Start Quiz"
3. Read question and select answer
4. Use navigation: Previous/Next
5. Mark question for review if needed
6. When done, click "Submit Quiz"
7. View score and results immediately

---

## 🔧 API Quick Reference

### Generate MCQs
```bash
curl -X POST http://localhost:5000/api/quiz/generate-mcqs \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Your extracted text",
    "numberOfQuestions": 10,
    "difficulty": "mixed",
    "subject": "English"
  }'
```

### Save MCQs
```bash
curl -X POST http://localhost:5000/api/quiz/save-mcqs \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "mcqs": [...array of MCQs...],
    "topic": "Grammar"
  }'
```

### Get Analytics
```bash
curl -X GET http://localhost:5000/api/quiz-assembly/analytics/:quizId \
  -H "Authorization: Bearer <token>"
```

---

## 📊 Key Metrics Explained

### Quiz Statistics
- **Total Attempts**: Number of students who took the quiz
- **Average Score**: Mean score of all attempts
- **Pass Rate**: Percentage of passing students
- **Standard Deviation**: Spread of scores (higher = more varied)

### Question Performance
- **Correct %**: Percentage of students who answered correctly
- **Difficulty**: Easy/Medium/Hard as set during generation
- **Time Spent**: Average time students took per question

### Student Analysis
- **Weak Topics**: Topics with lower success rate
- **Common Mistakes**: Most frequently selected wrong answer
- **Improvement Trend**: Is student improving over time?

---

## ⚙️ Configuration Options

### Generation Settings
```javascript
{
  numberOfQuestions: 10,           // 1-100 questions
  difficulty: "mixed",             // easy, medium, hard, mixed
  examType: "competitive",         // competitive, academic, university
  bloomsLevel: "mixed",            // remember, understand, apply, analyze, evaluate, create
  mcqType: "mixed",                // factual, conceptual, analytical, tricky
  subject: "English",
  topic: "Grammar"
}
```

### Quiz Settings
```javascript
{
  timeLimit: 60,                   // minutes, 0 = no limit
  totalMarks: 10,
  passingMarks: 5,                 // 50% by default
  negativeMarking: false,
  negativeMarkPercentage: 0.25,    // 0.25 marks per wrong (if enabled)
  questionShuffling: true,
  optionShuffling: true,
  showCorrectAnswers: true,        // After submission
  showExplanations: true
}
```

---

## 🎯 Common Tasks

### Generate 20 Hard Questions on Physics
1. Upload physics textbook PDF
2. Set: numberOfQuestions = 20, difficulty = hard, subject = Physics
3. Click Generate
4. Review and approve
5. Save to database

### Create Template-Based Quiz
1. Go to Templates → Create Template
2. Set difficulty distribution (30% easy, 40% medium, 30% hard)
3. Save template
4. Use template when creating new quiz
5. System automatically selects MCQs with right distribution

### Export MCQs to Excel
1. Select MCQs in preview
2. Click "Export Excel"
3. File downloads in standard Excel format
4. Can import in other systems

### Find and Regenerate Weak Questions
1. View Analytics
2. See "Weak Questions" section
3. Select those questions
4. Click "Regenerate"
5. New versions are created automatically

### Detect Cheating
1. After quiz completion
2. Go to Analytics → Detect Cheating
3. Review flagged students
4. Check similarity percentages
5. Take action (warning, retest, zero-mark)

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Generation takes too long | Check API key, reduce question count |
| No text extracted from PDF | Try OCR option, check if image-based PDF |
| MCQs not saving | Check database connection, validate MCQ format |
| Analytics not updating | Wait for submissions to complete |
| Excel import failing | Verify Excel has correct column headers |

---

## 📞 Support

For issues or questions:
1. Check the full documentation: `QUIZ_GENERATOR_DOCUMENTATION.md`
2. Review API response errors
3. Check browser console for frontend errors
4. Verify JWT token is valid

---

## 🔗 Related Files

- **Backend Routes**: `server/routes/quizRoutes.js`, `server/routes/quizAssemblyRoutes.js`
- **Models**: `server/models/MCQBank.js`, `server/models/QuizSession.js`, etc.
- **Utilities**: `server/utils/mcqGenerator.js`, `server/utils/cheatDetection.js`
- **Frontend**: `client/src/components/quiz/`
- **Full Docs**: `QUIZ_GENERATOR_DOCUMENTATION.md`

---

**Last Updated**: May 2026  
**Version**: 1.0.0  
**Status**: Production Ready ✅
