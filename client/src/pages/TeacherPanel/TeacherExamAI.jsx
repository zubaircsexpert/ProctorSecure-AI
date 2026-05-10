import { useEffect, useState } from "react";
import {
  Plus, Edit2, Trash2, Eye, EyeOff, Lock, Unlock, Play, Pause,
  Check, X, Clock, Users, BarChart3, Save, ChevronDown, AlertCircle,
  Loader
} from "lucide-react";
import API from "../../services/api";

const TeacherExamAI = () => {
  const [view, setView] = useState("list"); // list, create, edit, manage
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [selectedExam, setSelectedExam] = useState(null);
  const [expandedExam, setExpandedExam] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    description: "",
    duration: 30,
    passingMarks: 5,
    showResults: true,
    showCorrectAnswers: true,
    maxAttempts: null,
    questions: [{ questionText: "", options: ["", "", "", ""], correctAnswer: "", explanation: "" }],
    securitySettings: {
      forceFullscreen: true,
      detectTabSwitch: true,
      detectScreenShare: true,
      detectCopyPaste: true,
      allowedViolations: 3,
    },
  });

  const loadExams = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/api/exam-ai");
      setExams(data || []);
    } catch (error) {
      showToast("Failed to load exams", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(""), 3000);
  };

  const handleCreateExam = async () => {
    if (!formData.title || formData.questions.length === 0) {
      showToast("Please fill all required fields", "error");
      return;
    }

    setLoading(true);
    try {
      const { data } = await API.post("/api/exam-ai", {
        ...formData,
        isPublished: false,
      });
      setExams([data.exam, ...exams]);
      resetForm();
      setView("list");
      showToast("Exam created successfully");
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to create exam", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePublishExam = async (examId) => {
    setLoading(true);
    try {
      const { data } = await API.put(`/api/exam-ai/${examId}/publish`, {});
      setExams(exams.map((e) => (e.id === examId ? data.exam : e)));
      showToast("Exam published successfully");
    } catch (error) {
      showToast("Failed to publish exam", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleStopExam = async (examId) => {
    if (!confirm("Are you sure you want to stop this exam? Students won't be able to access it.")) return;

    setLoading(true);
    try {
      const { data } = await API.put(`/api/exam-ai/${examId}/stop`, {});
      setExams(exams.map((e) => (e.id === examId ? data.exam : e)));
      showToast("Exam stopped");
    } catch (error) {
      showToast("Failed to stop exam", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResumeExam = async (examId) => {
    setLoading(true);
    try {
      const { data } = await API.put(`/api/exam-ai/${examId}/resume`, {});
      setExams(exams.map((e) => (e.id === examId ? data.exam : e)));
      showToast("Exam resumed");
    } catch (error) {
      showToast("Failed to resume exam", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExam = async (examId) => {
    if (!confirm("Are you sure? This action cannot be undone.")) return;

    setLoading(true);
    try {
      await API.delete(`/api/exam-ai/${examId}`);
      setExams(exams.filter((e) => e.id !== examId));
      showToast("Exam deleted");
    } catch (error) {
      showToast("Failed to delete exam", "error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      subject: "",
      description: "",
      duration: 30,
      passingMarks: 5,
      showResults: true,
      showCorrectAnswers: true,
      maxAttempts: null,
      questions: [{ questionText: "", options: ["", "", "", ""], correctAnswer: "", explanation: "" }],
      securitySettings: {
        forceFullscreen: true,
        detectTabSwitch: true,
        detectScreenShare: true,
        detectCopyPaste: true,
        allowedViolations: 3,
      },
    });
  };

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [...formData.questions, { questionText: "", options: ["", "", "", ""], correctAnswer: "", explanation: "" }],
    });
  };

  const updateQuestion = (index, field, value) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setFormData({ ...formData, questions: updatedQuestions });
  };

  const updateQuestionOption = (qIndex, oIndex, value) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[qIndex].options[oIndex] = value;
    setFormData({ ...formData, questions: updatedQuestions });
  };

  const removeQuestion = (index) => {
    setFormData({
      ...formData,
      questions: formData.questions.filter((_, i) => i !== index),
    });
  };

  const getStatusBadge = (exam) => {
    let bgColor = "bg-gray-200";
    let textColor = "text-gray-800";
    let text = exam.status || "draft";

    if (exam.status === "published" && exam.isActive) {
      bgColor = "bg-green-200";
      textColor = "text-green-800";
      text = "Published & Active";
    } else if (exam.status === "stopped") {
      bgColor = "bg-red-200";
      textColor = "text-red-800";
      text = "Stopped";
    } else if (exam.status === "draft") {
      bgColor = "bg-blue-200";
      textColor = "text-blue-800";
      text = "Draft";
    }

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${bgColor} ${textColor}`}>
        {text}
      </span>
    );
  };

  // ==================== RENDER ====================

  if (view === "create") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-slate-700 rounded-lg shadow-2xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-white">Create New Exam</h1>
              <button
                onClick={() => {
                  setView("list");
                  resetForm();
                }}
                className="text-gray-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <input
                type="text"
                placeholder="Exam Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-slate-600 text-white px-4 py-3 rounded border border-slate-500 focus:border-blue-500 outline-none"
              />
              <input
                type="text"
                placeholder="Subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="bg-slate-600 text-white px-4 py-3 rounded border border-slate-500 focus:border-blue-500 outline-none"
              />
              <input
                type="number"
                placeholder="Duration (minutes)"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                className="bg-slate-600 text-white px-4 py-3 rounded border border-slate-500 focus:border-blue-500 outline-none"
              />
              <input
                type="number"
                placeholder="Passing Marks"
                value={formData.passingMarks}
                onChange={(e) => setFormData({ ...formData, passingMarks: Number(e.target.value) })}
                className="bg-slate-600 text-white px-4 py-3 rounded border border-slate-500 focus:border-blue-500 outline-none"
              />
            </div>

            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-600 text-white px-4 py-3 rounded border border-slate-500 focus:border-blue-500 outline-none mb-6"
              rows="3"
            ></textarea>

            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">Questions ({formData.questions.length})</h2>
              {formData.questions.map((q, qIndex) => (
                <div key={qIndex} className="bg-slate-600 rounded-lg p-6 mb-4 border border-slate-500">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white">Question {qIndex + 1}</h3>
                    {formData.questions.length > 1 && (
                      <button
                        onClick={() => removeQuestion(qIndex)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="Question Text"
                    value={q.questionText}
                    onChange={(e) => updateQuestion(qIndex, "questionText", e.target.value)}
                    className="w-full bg-slate-500 text-white px-4 py-2 rounded border border-slate-400 focus:border-blue-500 outline-none mb-4"
                  />

                  <div className="space-y-2 mb-4">
                    {q.options.map((opt, oIndex) => (
                      <input
                        key={oIndex}
                        type="text"
                        placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                        value={opt}
                        onChange={(e) => updateQuestionOption(qIndex, oIndex, e.target.value)}
                        className="w-full bg-slate-500 text-white px-4 py-2 rounded border border-slate-400 focus:border-blue-500 outline-none"
                      />
                    ))}
                  </div>

                  <select
                    value={q.correctAnswer}
                    onChange={(e) => updateQuestion(qIndex, "correctAnswer", e.target.value)}
                    className="w-full bg-slate-500 text-white px-4 py-2 rounded border border-slate-400 focus:border-blue-500 outline-none mb-4"
                  >
                    <option value="">Select Correct Answer</option>
                    {q.options.map((opt, idx) => (
                      <option key={idx} value={opt}>
                        {opt || `Option ${String.fromCharCode(65 + idx)}`}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Explanation (Optional)"
                    value={q.explanation}
                    onChange={(e) => updateQuestion(qIndex, "explanation", e.target.value)}
                    className="w-full bg-slate-500 text-white px-4 py-2 rounded border border-slate-400 focus:border-blue-500 outline-none"
                  />
                </div>
              ))}

              <button
                onClick={addQuestion}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded flex items-center justify-center gap-2"
              >
                <Plus size={20} /> Add Question
              </button>
            </div>

            <button
              onClick={handleCreateExam}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader className="animate-spin" /> : <Save size={20} />} Create Exam
            </button>
          </div>
        </div>

        {toast && (
          <div
            className={`fixed bottom-4 right-4 px-6 py-3 rounded text-white ${
              toast.type === "error" ? "bg-red-600" : "bg-green-600"
            }`}
          >
            {toast.message}
          </div>
        )}
      </div>
    );
  }

  // List View
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">AI Exam Management</h1>
            <p className="text-gray-400">Create, publish, and manage your exams</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setView("create");
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2"
          >
            <Plus size={20} /> New Exam
          </button>
        </div>

        {/* Exams List */}
        {loading && !exams.length ? (
          <div className="text-center text-gray-400 py-12">
            <Loader className="animate-spin mx-auto mb-4" size={32} />
            Loading exams...
          </div>
        ) : exams.length === 0 ? (
          <div className="text-center bg-slate-700 rounded-lg p-12">
            <AlertCircle size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-400 text-lg">No exams created yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {exams.map((exam) => (
              <div key={exam.id} className="bg-slate-700 rounded-lg shadow-lg overflow-hidden">
                {/* Exam Header */}
                <div className="p-6 flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-2">{exam.title}</h3>
                    <p className="text-gray-300 mb-3">{exam.description}</p>
                    <div className="flex gap-4 text-sm text-gray-400">
                      <span>📚 {exam.subject}</span>
                      <span>⏱️ {exam.duration} minutes</span>
                      <span>❓ {exam.questionCount} questions</span>
                      <span>⭐ {exam.passingMarks} passing marks</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(exam)}
                  </div>
                </div>

                {/* Exam Actions */}
                <div className="px-6 py-4 bg-slate-600 flex gap-2 flex-wrap">
                  {exam.status === "draft" ? (
                    <>
                      <button
                        onClick={() => handlePublishExam(exam.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2"
                        disabled={loading}
                      >
                        <Eye size={16} /> Publish
                      </button>
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2">
                        <Edit2 size={16} /> Edit
                      </button>
                    </>
                  ) : exam.status === "stopped" ? (
                    <button
                      onClick={() => handleResumeExam(exam.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
                      disabled={loading}
                    >
                      <Play size={16} /> Resume
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStopExam(exam.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center gap-2"
                      disabled={loading}
                    >
                      <Pause size={16} /> Stop
                    </button>
                  )}

                  <button
                    onClick={() => setExpandedExam(expandedExam === exam.id ? null : exam.id)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded flex items-center gap-2"
                  >
                    <Users size={16} /> Manage Access
                  </button>

                  <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded flex items-center gap-2">
                    <BarChart3 size={16} /> Stats
                  </button>

                  <button
                    onClick={() => handleDeleteExam(exam.id)}
                    className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded flex items-center gap-2"
                    disabled={loading}
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>

                {/* Access Management Panel */}
                {expandedExam === exam.id && (
                  <div className="px-6 py-4 bg-slate-500 border-t border-slate-600">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-white font-semibold mb-2">Allowed Students: {exam.allowedStudents?.length || 0}</h4>
                        <p className="text-gray-300 text-sm">Manage which students can access this exam</p>
                      </div>
                      <div>
                        <h4 className="text-white font-semibold mb-2">Blocked Students: {exam.blockedStudents?.length || 0}</h4>
                        <p className="text-gray-300 text-sm">Students who cannot access this exam</p>
                      </div>
                    </div>
                    <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full">
                      Configure Access...
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <div
          className={`fixed bottom-4 right-4 px-6 py-3 rounded text-white ${
            toast.type === "error" ? "bg-red-600" : "bg-green-600"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default TeacherExamAI;
