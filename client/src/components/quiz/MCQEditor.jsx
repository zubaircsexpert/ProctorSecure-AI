import React, { useState } from "react";
import { X, Save } from "lucide-react";
import toast from "react-hot-toast";

const MCQEditor = ({ mcq, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState(mcq || {});
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...(formData.options || [])];
    newOptions[index] = value;
    setFormData((prev) => ({
      ...prev,
      options: newOptions,
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.question || formData.question.trim().length === 0) {
      newErrors.question = "Question is required";
    }

    if (!Array.isArray(formData.options) || formData.options.length !== 4) {
      newErrors.options = "Exactly 4 options are required";
    } else {
      const allFilled = formData.options.every((opt) =>
        opt.trim().length > 0
      );
      if (!allFilled) {
        newErrors.options = "All options must be filled";
      }
    }

    if (!formData.correctAnswer || formData.correctAnswer.trim().length === 0) {
      newErrors.correctAnswer = "Correct answer is required";
    } else if (!formData.options.includes(formData.correctAnswer)) {
      newErrors.correctAnswer = "Correct answer must be one of the options";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
      toast.success("MCQ saved successfully");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-bold">Edit MCQ</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Question */}
          <div>
            <label className="block text-sm font-medium mb-2">Question</label>
            <textarea
              name="question"
              value={formData.question || ""}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm resize-none"
              placeholder="Enter question text"
            />
            {errors.question && (
              <p className="text-red-600 text-xs mt-1">{errors.question}</p>
            )}
          </div>

          {/* Options */}
          <div>
            <label className="block text-sm font-medium mb-2">Options</label>
            <div className="space-y-2">
              {[0, 1, 2, 3].map((idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="text-sm font-medium pt-2 min-w-6">
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  <input
                    type="text"
                    value={formData.options?.[idx] || ""}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                    placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                  />
                </div>
              ))}
            </div>
            {errors.options && (
              <p className="text-red-600 text-xs mt-1">{errors.options}</p>
            )}
          </div>

          {/* Correct Answer */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Correct Answer
            </label>
            <select
              name="correctAnswer"
              value={formData.correctAnswer || ""}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            >
              <option value="">Select correct answer</option>
              {formData.options?.map((option, idx) => (
                <option key={idx} value={option}>
                  {String.fromCharCode(65 + idx)}. {option}
                </option>
              ))}
            </select>
            {errors.correctAnswer && (
              <p className="text-red-600 text-xs mt-1">
                {errors.correctAnswer}
              </p>
            )}
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium mb-2">Difficulty</label>
            <select
              name="difficulty"
              value={formData.difficulty || "medium"}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          {/* Topic */}
          <div>
            <label className="block text-sm font-medium mb-2">Topic</label>
            <input
              type="text"
              name="topic"
              value={formData.topic || "General"}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              placeholder="e.g., English, Mathematics"
            />
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Explanation (Optional)
            </label>
            <textarea
              name="explanation"
              value={formData.explanation || ""}
              onChange={handleInputChange}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm resize-none"
              placeholder="Why is this the correct answer?"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex gap-2 justify-end sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save MCQ
          </button>
        </div>
      </div>
    </div>
  );
};

export default MCQEditor;
