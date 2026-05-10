import React, { useState, useRef } from "react";
import { Upload, X, Loader, CheckCircle, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

const FileUploadArea = ({ onFileSelect, isLoading = false }) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/gif",
      "image/webp",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Supported: PDF, DOCX, TXT, Images, Excel");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error("File size exceeds 50MB limit");
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`relative p-12 border-2 border-dashed rounded-lg transition-all cursor-pointer ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-gray-50 hover:border-blue-400"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleChange}
          className="hidden"
          accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.gif,.webp,.xlsx"
          disabled={isLoading}
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          {isLoading ? (
            <>
              <Loader className="w-12 h-12 text-blue-500 animate-spin" />
              <p className="text-sm font-medium text-gray-700">Processing file...</p>
            </>
          ) : selectedFile ? (
            <>
              <CheckCircle className="w-12 h-12 text-green-500" />
              <p className="text-sm font-medium text-gray-700">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-gray-400" />
              <p className="text-center">
                <span className="font-medium text-gray-700">Click to upload</span>
                <span className="text-gray-500"> or drag and drop</span>
              </p>
              <p className="text-xs text-gray-500">
                PDF, DOCX, TXT, Images (PNG, JPG), or Excel files up to 50MB
              </p>
            </>
          )}
        </div>
      </div>

      {selectedFile && !isLoading && (
        <button
          onClick={() => {
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
          className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium"
        >
          Clear Selection
        </button>
      )}
    </div>
  );
};

export default FileUploadArea;
