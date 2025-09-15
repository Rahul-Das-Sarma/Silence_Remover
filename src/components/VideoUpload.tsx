import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileVideo, AlertCircle, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

interface VideoUploadProps {
  onFileSelect: (file: File) => void;
  onProcessingStart: (usePremium: boolean) => void;
  isProcessing: boolean;
  maxSize?: number; // in MB
}

const VideoUpload: React.FC<VideoUploadProps> = ({
  onFileSelect,
  onProcessingStart,
  isProcessing,
  maxSize = 500,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [usePremium, setUsePremium] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setFileError(null);

      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0]?.code === "file-too-large") {
          setFileError(`File is too large. Maximum size is ${maxSize}MB.`);
        } else if (rejection.errors[0]?.code === "file-invalid-type") {
          setFileError(
            "Please select a valid video file (MP4, AVI, MOV, etc.)."
          );
        } else {
          setFileError("Invalid file. Please try again.");
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setSelectedFile(file);
        onFileSelect(file);
        toast.success("Video file selected successfully!");
      }
    },
    [maxSize, onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "video/*": [".mp4", ".avi", ".mov", ".mkv", ".webm", ".flv", ".wmv"],
    },
    maxSize: maxSize * 1024 * 1024, // Convert MB to bytes
    multiple: false,
    disabled: isProcessing,
  });

  const handleProcess = () => {
    if (!selectedFile) return;

    onProcessingStart(usePremium);
  };

  const getFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const [videoDuration, setVideoDuration] = useState<number | null>(null);

  React.useEffect(() => {
    if (selectedFile) {
      getVideoDuration(selectedFile).then(setVideoDuration);
    }
  }, [selectedFile]);

  const isFreeEligible = videoDuration && videoDuration <= 60; // 1 minute
  const requiresPremium = videoDuration && videoDuration > 60;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${
            isDragActive
              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
              : "border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500"
          }
          ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center space-y-4">
          {isDragActive ? (
            <Upload className="w-16 h-16 text-indigo-500" />
          ) : (
            <FileVideo className="w-16 h-16 text-gray-400 dark:text-gray-500" />
          )}

          <div>
            <p className="text-lg font-medium text-gray-800 dark:text-white mb-2">
              {isDragActive ? "Drop your video here" : "Choose video file"}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Drag and drop your video file here, or click to browse
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Supports MP4, AVI, MOV, MKV, WebM, FLV, WMV (max {maxSize}MB)
            </p>
          </div>
        </div>
      </div>

      {/* File Error */}
      {fileError && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700 dark:text-red-300">{fileError}</p>
          </div>
        </div>
      )}

      {/* Selected File Info */}
      {selectedFile && (
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <p className="text-green-700 dark:text-green-300 font-medium">
              File Selected
            </p>
          </div>

          <div className="text-sm text-green-600 dark:text-green-400 space-y-1">
            <p>
              <strong>Name:</strong> {selectedFile.name}
            </p>
            <p>
              <strong>Size:</strong> {getFileSize(selectedFile.size)}
            </p>
            {videoDuration && (
              <p>
                <strong>Duration:</strong> {Math.round(videoDuration)} seconds
              </p>
            )}
          </div>

          {/* Processing Options */}
          <div className="mt-4 space-y-3">
            {isFreeEligible && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                  <p className="text-blue-700 dark:text-blue-300 font-medium">
                    Free Processing Available
                  </p>
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  Your video is under 1 minute and qualifies for free processing
                  using open-source tools.
                </p>
              </div>
            )}

            {requiresPremium && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  <p className="text-amber-700 dark:text-amber-300 font-medium">
                    Premium Processing Required
                  </p>
                </div>
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                  Videos over 1 minute require premium processing with
                  AI-powered accuracy.
                </p>
              </div>
            )}

            {/* Processing Method Selection */}
            <div className="space-y-2">
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="processing"
                  value="free"
                  checked={!usePremium}
                  onChange={() => setUsePremium(false)}
                  disabled={requiresPremium || isProcessing}
                  className="w-4 h-4 text-indigo-600"
                />
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">
                    Free Processing (FFmpeg + Remsi)
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Fast processing using open-source tools
                  </p>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="processing"
                  value="premium"
                  checked={usePremium}
                  onChange={() => setUsePremium(true)}
                  disabled={isProcessing}
                  className="w-4 h-4 text-indigo-600"
                />
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">
                    Premium Processing (OpenAI Whisper)
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    AI-powered accuracy with advanced speech detection
                  </p>
                </div>
              </label>
            </div>

            {/* Process Button */}
            <button
              onClick={handleProcess}
              disabled={isProcessing}
              className={`
                w-full py-3 px-4 rounded-lg font-medium transition-colors
                ${
                  isProcessing
                    ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }
              `}
            >
              {isProcessing ? "Processing..." : "Start Processing"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoUpload;
