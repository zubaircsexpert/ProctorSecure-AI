import React, { useState, useRef, useEffect } from "react";
import {
  Download,
  Upload,
  Zap,
  Settings,
  ChevronDown,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import FileUploadArea from "./FileUploadArea";
import MCQPreview from "./MCQPreview";
import MCQEditor from "./MCQEditor";

const QuizGeneratorPanel = () => {
  // State management
  const [step, setStep] = useState(1); // 1: Upload, 2: Generate, 3: Preview, 4: Save
  const [extractedText, setExtractedText] = useState("");
  const [generatedMCQs, setGeneratedMCQs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [editingMCQ, setEditingMCQ] = useState(null);
  const [showEditor, setShowEditor] = useState(false);

  // Generation settings
  const [settings, setSettings] = useState({
    numberOfQuestions: 10,
    difficulty: "mixed",
    examType: "competitive",
    bloomsLevel: "mixed",
    mcqType: "mixed",
    subject: "General",
    topic: "General",
  });

  const [showSettings, setShowSettings] = useState(false);

  // File upload handler
  const handleFileSelect = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/quiz/upload-material`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setExtractedText(response.data.fullText || response.data.extractedText);
      toast.success("File processed successfully");
      setStep(2);
    } catch (error) {
      console.error("File upload error:", error);
      toast.error(
        error.response?.data?.message || "Failed to process file"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // MCQ generation handler
  const handleGenerateMCQs = async () => {
    if (!extractedText.trim()) {
      toast.error("Please upload a file first");
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      const token = localStorage.getItem("token");

      // Simulate progress
      const progressInterval = setInterval(() => {
        setGenerationProgress((prev) => Math.min(prev + 10, 90));
      }, 300);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/quiz/generate-mcqs`,
        {
          text: extractedText,
          ...settings,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      clearInterval(progressInterval);
      setGenerationProgress(100);

      setGeneratedMCQs(response.data.mcqs || []);
      toast.success(
        `Generated ${response.data.mcqs.length} MCQs in ${response.data.generationTime}s`
      );
      setStep(3);
    } catch (error) {
      console.error("Generation error:", error);
      toast.error(error.response?.data?.message || "Failed to generate MCQs");
    } finally {
      setIsGenerating(false);
    }
  };

  // Edit MCQ
  const handleEditMCQ = (index) => {
    setEditingMCQ({ ...generatedMCQs[index], index });
    setShowEditor(true);
  };

  // Save edited MCQ
  const handleSaveEditedMCQ = (updatedMCQ) => {
    const newMCQs = [...generatedMCQs];
    newMCQs[updatedMCQ.index] = updatedMCQ;
    setGeneratedMCQs(newMCQs);
  };

  // Delete MCQ
  const handleDeleteMCQ = (index) => {
    if (
      confirm(
        `Delete MCQ: ${generatedMCQs[index].question.substring(0, 50)}...?`
      )
    ) {
      const newMCQs = generatedMCQs.filter((_, i) => i !== index);
      setGeneratedMCQs(newMCQs);
      toast.success("MCQ deleted");
    }
  };

  // Save MCQs to database
  const handleSaveMCQs = async () => {
    if (generatedMCQs.length === 0) {
      toast.error("No MCQs to save");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/quiz/save-mcqs`,
        {
          mcqs: generatedMCQs,
          topic: settings.topic,
          subject: settings.subject,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(`Saved ${response.data.savedCount} MCQs`);
      // Reset form
      setStep(1);
      setExtractedText("");
      setGeneratedMCQs([]);
    } catch (error) {
      console.error("Save error:", error);
      toast.error(error.response?.data?.message || "Failed to save MCQs");
    } finally {
      setIsLoading(false);
    }
  };

  // Export to Excel
  const handleExportExcel = async () => {
    if (generatedMCQs.length === 0) {
      toast.error("No MCQs to export");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/quiz/export-excel`,
        {
          mcqIds: generatedMCQs.map((_, i) => i),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `mcqs-${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
      toast.success("MCQs exported to Excel");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export MCQs");
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg">
        <h1 className="text-3xl font-bold mb-2">AI Quiz Generator</h1>
        <p className="text-blue-100">
          Generate professional MCQs from documents using advanced AI
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border">
        {[
          { num: 1, label: "Upload" },
          { num: 2, label: "Generate" },
          { num: 3, label: "Preview" },
          { num: 4, label: "Save" },
        ].map((s, idx) => (
          <React.Fragment key={s.num}>
            <button
              onClick={() => step >= s.num && setStep(s.num)}
              className={`flex flex-col items-center gap-1 ${
                step >= s.num ? "cursor-pointer" : ""
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step === s.num
                    ? "bg-blue-600 text-white"
                    : step > s.num
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-700"
                }`}
              >
                {step > s.num ? "✓" : s.num}
              </div>
              <span className="text-xs font-medium">{s.label}</span>
            </button>

            {idx < 3 && (
              <div
                className={`flex-1 h-1 mx-2 ${
                  step > s.num ? "bg-green-500" : "bg-gray-200"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Upload Material</h2>
            <FileUploadArea onFileSelect={handleFileSelect} isLoading={isLoading} />
          </div>
        )}

        {/* Step 2: Generate */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Generation Settings</h2>

            {/* Settings */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 text-blue-600 font-medium hover:text-blue-700"
              >
                <Settings className="w-4 h-4" />
                {showSettings ? "Hide" : "Show"} Settings
                <ChevronDown
                  className={`w-4 h-4 transition ${
                    showSettings ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showSettings && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Questions</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={settings.numberOfQuestions}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          numberOfQuestions: parseInt(e.target.value),
                        }))
                      }
                      className="w-full mt-1 px-3 py-2 border rounded text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Difficulty</label>
                    <select
                      value={settings.difficulty}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          difficulty: e.target.value,
                        }))
                      }
                      className="w-full mt-1 px-3 py-2 border rounded text-sm"
                    >
                      <option value="mixed">Mixed</option>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Exam Type</label>
                    <select
                      value={settings.examType}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          examType: e.target.value,
                        }))
                      }
                      className="w-full mt-1 px-3 py-2 border rounded text-sm"
                    >
                      <option value="competitive">Competitive</option>
                      <option value="academic">Academic</option>
                      <option value="university">University</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Subject</label>
                    <input
                      type="text"
                      value={settings.subject}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          subject: e.target.value,
                        }))
                      }
                      className="w-full mt-1 px-3 py-2 border rounded text-sm"
                      placeholder="e.g., English"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Topic</label>
                    <input
                      type="text"
                      value={settings.topic}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          topic: e.target.value,
                        }))
                      }
                      className="w-full mt-1 px-3 py-2 border rounded text-sm"
                      placeholder="e.g., Grammar"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">MCQ Type</label>
                    <select
                      value={settings.mcqType}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          mcqType: e.target.value,
                        }))
                      }
                      className="w-full mt-1 px-3 py-2 border rounded text-sm"
                    >
                      <option value="mixed">Mixed</option>
                      <option value="factual">Factual</option>
                      <option value="conceptual">Conceptual</option>
                      <option value="analytical">Analytical</option>
                      <option value="tricky">Tricky</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Preview extracted text */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Extracted Text Preview</p>
              <div className="bg-white p-3 rounded border text-sm text-gray-700 max-h-24 overflow-y-auto">
                {extractedText.substring(0, 300)}...
              </div>
            </div>

            {/* Generate button */}
            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-gray-300 rounded font-medium hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleGenerateMCQs}
                disabled={isGenerating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                {isGenerating ? "Generating..." : "Generate MCQs"}
              </button>
            </div>

            {/* Progress bar */}
            {isGenerating && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">
              Review & Edit MCQs ({generatedMCQs.length})
            </h2>
            <MCQPreview
              mcqs={generatedMCQs}
              onEdit={handleEditMCQ}
              onDelete={handleDeleteMCQ}
              isLoading={isLoading}
            />

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 border border-gray-300 rounded font-medium hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleExportExcel}
                className="px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Export Excel
              </button>
              <button
                onClick={handleSaveMCQs}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? "Saving..." : "Save to Database"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MCQ Editor Modal */}
      <MCQEditor
        mcq={editingMCQ}
        isOpen={showEditor}
        onClose={() => {
          setShowEditor(false);
          setEditingMCQ(null);
        }}
        onSave={handleSaveEditedMCQ}
      />
    </div>
  );
};

export default QuizGeneratorPanel;
