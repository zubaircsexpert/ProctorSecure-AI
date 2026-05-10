import { useEffect, useState } from "react";
import {
  Clock, CheckCircle, AlertCircle, Loader, Play, Lock,
  Calendar, Zap, TrendingUp
} from "lucide-react";
import API from "../../services/api";
import { getAuthUser } from "../../utils/authSession";

const StudentExamDashboard = ({ onStartExam }) => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("active"); // active, upcoming, completed, locked
  const [stats, setStats] = useState({ active: 0, upcoming: 0, completed: 0, locked: 0 });

  const loadExams = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/api/exam-ai");
      const now = new Date();

      // Categorize exams
      const active = [];
      const upcoming = [];
      const completed = [];
      const locked = [];

      for (const exam of data) {
        const examStatus = exam.status;
        const isActive = exam.isActive && exam.isPublished;
        const withinTime = (!exam.startTime || now >= new Date(exam.startTime)) &&
                           (!exam.endTime || now <= new Date(exam.endTime));

        // Check attempt results
        try {
          const results = await API.get(`/api/exam-ai/${exam.id}/results`);
          completed.push({ ...exam, categoryTag: "completed", results: results.data });
        } catch {
          // No results = not completed
        }

        if (!isActive) {
          locked.push({ ...exam, categoryTag: "locked", reason: "Not yet published" });
        } else if (!withinTime) {
          if (new Date(exam.startTime) > now) {
            upcoming.push({ ...exam, categoryTag: "upcoming" });
          } else {
            completed.push({ ...exam, categoryTag: "completed" });
          }
        } else {
          active.push({ ...exam, categoryTag: "active" });
        }
      }

      setExams({ active, upcoming, completed, locked });
      setStats({
        active: active.length,
        upcoming: upcoming.length,
        completed: completed.length,
        locked: locked.length,
      });
    } catch (error) {
      console.error("Failed to load exams:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const ExamCard = ({ exam, category }) => {
    const isLocked = category === "locked";
    const isCompleted = category === "completed";
    const isUpcoming = category === "upcoming";

    return (
      <div className={`rounded-lg shadow-lg overflow-hidden transition-all hover:shadow-xl ${
        isLocked ? "bg-slate-600 opacity-75" : "bg-slate-700 hover:-translate-y-1"
      }`}>
        {/* Card Header with Status */}
        <div className="relative p-6">
          <div className="absolute top-4 right-4">
            {isLocked && <Lock className="text-red-400" size={20} />}
            {category === "active" && <Zap className="text-green-400 animate-pulse" size={20} />}
            {isUpcoming && <Calendar className="text-blue-400" size={20} />}
            {isCompleted && <CheckCircle className="text-purple-400" size={20} />}
          </div>

          <h3 className="text-xl font-bold text-white mb-2 pr-8">{exam.title}</h3>
          
          {exam.description && (
            <p className="text-gray-300 text-sm mb-4 line-clamp-2">{exam.description}</p>
          )}

          {/* Status Badge */}
          <div className="flex gap-2 mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              isLocked ? "bg-red-900 text-red-200" :
              isCompleted ? "bg-purple-900 text-purple-200" :
              isUpcoming ? "bg-blue-900 text-blue-200" :
              "bg-green-900 text-green-200"
            }`}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </span>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <Clock size={16} />
              <span>{exam.duration} min</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{exam.questionCount} questions</span>
            </div>
            {exam.passingMarks && (
              <div className="flex items-center gap-2">
                <TrendingUp size={16} />
                <span>Pass: {exam.passingMarks}/{exam.totalMarks}</span>
              </div>
            )}
            {exam.subject && (
              <div className="text-blue-300">
                📚 {exam.subject}
              </div>
            )}
          </div>

          {/* Timing Info */}
          {(exam.startTime || exam.endTime) && (
            <div className="mt-4 pt-4 border-t border-slate-600 text-xs text-gray-400">
              {exam.startTime && (
                <p>📅 Starts: {new Date(exam.startTime).toLocaleString()}</p>
              )}
              {exam.endTime && (
                <p>⏰ Ends: {new Date(exam.endTime).toLocaleString()}</p>
              )}
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="px-6 py-4 bg-slate-600 border-t border-slate-500">
          {isLocked ? (
            <button disabled className="w-full bg-gray-600 text-gray-300 font-bold py-2 rounded opacity-50 cursor-not-allowed">
              <Lock className="inline mr-2" size={16} /> Access Locked
            </button>
          ) : isCompleted ? (
            <button disabled className="w-full bg-purple-600 text-white font-bold py-2 rounded opacity-75">
              <CheckCircle className="inline mr-2" size={16} /> Completed
            </button>
          ) : isUpcoming ? (
            <button disabled className="w-full bg-blue-600 text-white font-bold py-2 rounded opacity-75">
              <Calendar className="inline mr-2" size={16} /> Coming Soon
            </button>
          ) : (
            <button
              onClick={() => onStartExam?.(exam)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded flex items-center justify-center gap-2 transition-all"
            >
              <Play size={16} /> Start Exam
            </button>
          )}
        </div>
      </div>
    );
  };

  const TabContent = () => {
    const examList = exams[activeTab] || [];

    if (loading) {
      return (
        <div className="flex justify-center items-center py-20">
          <Loader className="animate-spin text-blue-400" size={40} />
        </div>
      );
    }

    if (examList.length === 0) {
      return (
        <div className="text-center py-20">
          <AlertCircle className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-gray-400 text-lg">
            {activeTab === "active" && "No active exams right now"}
            {activeTab === "upcoming" && "No upcoming exams"}
            {activeTab === "completed" && "You haven't completed any exams yet"}
            {activeTab === "locked" && "No locked exams"}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {examList.map((exam) => (
          <ExamCard
            key={exam.id}
            exam={exam}
            category={activeTab}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">📝 My Exams</h1>
          <p className="text-gray-400">Manage and take your assigned exams</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-green-900 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 text-sm">Active Now</p>
                <p className="text-3xl font-bold text-white">{stats.active}</p>
              </div>
              <Zap className="text-green-400" size={32} />
            </div>
          </div>

          <div className="bg-blue-900 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm">Upcoming</p>
                <p className="text-3xl font-bold text-white">{stats.upcoming}</p>
              </div>
              <Calendar className="text-blue-400" size={32} />
            </div>
          </div>

          <div className="bg-purple-900 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300 text-sm">Completed</p>
                <p className="text-3xl font-bold text-white">{stats.completed}</p>
              </div>
              <CheckCircle className="text-purple-400" size={32} />
            </div>
          </div>

          <div className="bg-red-900 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-300 text-sm">Locked</p>
                <p className="text-3xl font-bold text-white">{stats.locked}</p>
              </div>
              <Lock className="text-red-400" size={32} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-slate-600">
          {[
            { id: "active", label: "Active Now", icon: "⚡" },
            { id: "upcoming", label: "Upcoming", icon: "📅" },
            { id: "completed", label: "Completed", icon: "✓" },
            { id: "locked", label: "Locked", icon: "🔒" },
          ].map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-6 py-3 font-semibold transition-all ${
                activeTab === id
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <TabContent />
      </div>
    </div>
  );
};

export default StudentExamDashboard;
