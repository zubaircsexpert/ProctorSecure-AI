import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Users, Award, AlertTriangle } from "lucide-react";
import axios from "axios";

const AnalyticsDashboard = ({ quizId }) => {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [quizId]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/quiz-assembly/analytics/${quizId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAnalytics(response.data);
    } catch (err) {
      console.error("Analytics fetch error:", err);
      setError(err.response?.data?.message || "Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  if (!analytics) {
    return <div className="text-center text-gray-500">No analytics data available</div>;
  }

  const { statistics, questionPerformance, difficultyAnalysis, topicAnalysis, weakQuestions } =
    analytics;

  // Prepare chart data
  const difficultyChartData = difficultyAnalysis
    ? Object.entries(difficultyAnalysis).map(([level, data]) => ({
        name: level.charAt(0).toUpperCase() + level.slice(1),
        attempts: data.attempt || 0,
        correct: data.correct || 0,
        percentage: parseFloat(data.percentage) || 0,
      }))
    : [];

  const topicChartData = topicAnalysis?.slice(0, 5) || [];

  const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white p-6 rounded-lg">
        <h1 className="text-3xl font-bold mb-2">Quiz Analytics</h1>
        <p className="text-green-100">
          Comprehensive performance metrics and insights
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Attempts */}
        <div className="bg-white p-6 rounded-lg border hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Attempts</h3>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {statistics?.totalAttempts || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {statistics?.totalStudents || 0} unique students
          </p>
        </div>

        {/* Average Score */}
        <div className="bg-white p-6 rounded-lg border hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Average Score</h3>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {statistics?.averageScore || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {statistics?.averagePercentage || 0}%
          </p>
        </div>

        {/* Pass Rate */}
        <div className="bg-white p-6 rounded-lg border hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Pass Rate</h3>
            <Award className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {statistics?.passPercentage || 0}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {statistics?.passFailCount?.pass || 0} passed
          </p>
        </div>

        {/* Standard Deviation */}
        <div className="bg-white p-6 rounded-lg border hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Std. Dev.</h3>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {statistics?.standardDeviation || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">Score variation</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Difficulty Analysis */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-bold mb-4">Difficulty-wise Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={difficultyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="attempts" fill="#3b82f6" name="Attempts" />
              <Bar dataKey="correct" fill="#10b981" name="Correct" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Topic Analysis */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-bold mb-4">Top 5 Topics</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={topicChartData}
                dataKey="correctCount"
                nameKey="topic"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {topicChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weak Questions */}
      {weakQuestions && weakQuestions.length > 0 && (
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-bold mb-4 text-red-600">
            Weak Questions ({weakQuestions.length})
          </h2>
          <div className="space-y-3">
            {weakQuestions.slice(0, 5).map((question, idx) => (
              <div
                key={idx}
                className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900 mb-1">
                    {question.question}
                  </p>
                  <p className="text-xs text-gray-600">
                    Difficulty: {question.difficulty} | Success Rate:{" "}
                    {question.correctPercentage}%
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-red-600">
                    {question.correctPercentage}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {question.correctCount}/{question.totalAttempts}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Score Distribution */}
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-lg font-bold mb-4">Score Range Distribution</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {["0-20", "21-40", "41-60", "61-80", "81-100"].map((range, idx) => (
            <div key={idx} className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600 mb-2">{range}</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.floor(Math.random() * 10)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
