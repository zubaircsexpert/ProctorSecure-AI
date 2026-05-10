import React, { useState } from "react";
import { Edit2, Trash2, Check, X, Eye, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

const MCQPreview = ({
  mcqs,
  onEdit,
  onDelete,
  onApprove,
  onRegenerate,
  isLoading = false,
}) => {
  const [selectedMCQs, setSelectedMCQs] = useState(new Set());
  const [expandedMCQ, setExpandedMCQ] = useState(null);
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSelectAll = () => {
    if (selectedMCQs.size === filteredMCQs.length) {
      setSelectedMCQs(new Set());
    } else {
      setSelectedMCQs(new Set(filteredMCQs.map((_, i) => i)));
    }
  };

  const handleSelectMCQ = (index) => {
    const newSelected = new Set(selectedMCQs);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedMCQs(newSelected);
  };

  const filteredMCQs = mcqs.filter((mcq) => {
    const matchesDifficulty =
      filterDifficulty === "all" || mcq.difficulty === filterDifficulty;
    const matchesSearch =
      mcq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mcq.topic.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDifficulty && matchesSearch;
  });

  const handleBulkDelete = async () => {
    if (selectedMCQs.size === 0) {
      toast.error("No MCQs selected");
      return;
    }

    if (confirm(`Delete ${selectedMCQs.size} MCQs?`)) {
      const indicesToDelete = Array.from(selectedMCQs).sort((a, b) => b - a);
      for (const index of indicesToDelete) {
        onDelete(index);
      }
      setSelectedMCQs(new Set());
      toast.success("MCQs deleted");
    }
  };

  const handleBulkApprove = async () => {
    if (selectedMCQs.size === 0) {
      toast.error("No MCQs selected");
      return;
    }

    const indicesToApprove = Array.from(selectedMCQs);
    for (const index of indicesToApprove) {
      if (onApprove) {
        onApprove(index);
      }
    }
    setSelectedMCQs(new Set());
    toast.success("MCQs approved");
  };

  const handleBulkRegenerate = async () => {
    if (selectedMCQs.size === 0) {
      toast.error("No MCQs selected");
      return;
    }

    const indicesToRegenerate = Array.from(selectedMCQs);
    for (const index of indicesToRegenerate) {
      if (onRegenerate) {
        onRegenerate(index);
      }
    }
    setSelectedMCQs(new Set());
    toast.success("Starting regeneration...");
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-lg border">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            placeholder="Search MCQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
          />
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded text-sm"
          >
            <option value="all">All Levels</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedMCQs.size > 0 && (
        <div className="flex flex-wrap gap-2 bg-blue-50 p-4 rounded-lg border border-blue-200">
          <span className="text-sm font-medium text-blue-900">
            {selectedMCQs.size} selected
          </span>
          <button
            onClick={handleBulkApprove}
            disabled={isLoading}
            className="text-sm px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            <Check className="w-4 h-4 inline mr-1" /> Approve
          </button>
          <button
            onClick={handleBulkRegenerate}
            disabled={isLoading}
            className="text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4 inline mr-1" /> Regenerate
          </button>
          <button
            onClick={handleBulkDelete}
            disabled={isLoading}
            className="text-sm px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4 inline mr-1" /> Delete
          </button>
          <button
            onClick={() => setSelectedMCQs(new Set())}
            className="text-sm px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Clear
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={
              filteredMCQs.length > 0 &&
              selectedMCQs.size === filteredMCQs.length
            }
            onChange={handleSelectAll}
            className="w-4 h-4 rounded border-gray-300"
          />
          <h3 className="font-semibold">
            MCQs ({filteredMCQs.length} of {mcqs.length})
          </h3>
        </div>
      </div>

      {/* MCQs List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredMCQs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No MCQs found. Generate or import some first.
          </div>
        ) : (
          filteredMCQs.map((mcq, index) => (
            <div
              key={index}
              className="bg-white border rounded-lg p-4 hover:shadow-md transition"
            >
              {/* MCQ Header */}
              <div className="flex gap-3">
                <input
                  type="checkbox"
                  checked={selectedMCQs.has(index)}
                  onChange={() => handleSelectMCQ(index)}
                  className="w-4 h-4 mt-1 rounded border-gray-300"
                />

                <div className="flex-1">
                  <div className="flex gap-2 mb-2 flex-wrap">
                    <span
                      className={`text-xs px-2 py-1 rounded font-medium ${getDifficultyColor(
                        mcq.difficulty
                      )}`}
                    >
                      {mcq.difficulty}
                    </span>
                    {mcq.bloomsLevel && (
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">
                        {mcq.bloomsLevel}
                      </span>
                    )}
                    {mcq.mcqType && (
                      <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-800 rounded">
                        {mcq.mcqType}
                      </span>
                    )}
                    {mcq.topic && (
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                        {mcq.topic}
                      </span>
                    )}
                  </div>

                  <p className="font-medium text-gray-900 mb-2">
                    {mcq.question}
                  </p>

                  {/* Show/Hide Options */}
                  {expandedMCQ !== index && (
                    <button
                      onClick={() => setExpandedMCQ(index)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Show options
                    </button>
                  )}

                  {expandedMCQ === index && (
                    <div className="mt-3 space-y-2">
                      {mcq.options.map((option, optIndex) => {
                        const isCorrect = option === mcq.correctAnswer;
                        return (
                          <div
                            key={optIndex}
                            className={`p-2 rounded text-sm ${
                              isCorrect
                                ? "bg-green-100 border border-green-300"
                                : "bg-gray-100 border border-gray-200"
                            }`}
                          >
                            <span className="font-medium">
                              {String.fromCharCode(65 + optIndex)}.
                            </span>{" "}
                            {option}
                            {isCorrect && (
                              <Check className="w-4 h-4 inline ml-2 text-green-600" />
                            )}
                          </div>
                        );
                      })}

                      {mcq.explanation && (
                        <div className="mt-3 p-2 bg-blue-50 rounded text-sm text-gray-700 border border-blue-200">
                          <span className="font-medium">Explanation: </span>
                          {mcq.explanation}
                        </div>
                      )}

                      <button
                        onClick={() => setExpandedMCQ(null)}
                        className="text-xs text-gray-600 hover:text-gray-700 font-medium mt-2"
                      >
                        Hide options
                      </button>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(index)}
                    title="Edit"
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(index)}
                    title="Delete"
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MCQPreview;
