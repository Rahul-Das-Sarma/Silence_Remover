import React, { useState, useEffect } from "react";
import { Clock, CheckCircle, XCircle, Download, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

interface Job {
  id: string;
  filename: string;
  status: "pending" | "processing" | "completed" | "failed";
  use_premium: boolean;
  created_at: string;
  processed_file_url?: string;
  error_message?: string;
}

interface JobStatusProps {
  jobId: string;
  token: string;
  onJobComplete?: (job: Job) => void;
}

const JobStatus: React.FC<JobStatusProps> = ({
  jobId,
  token,
  onJobComplete,
}) => {
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setIsPolling] = useState(false);

  const fetchJobStatus = async () => {
    try {
      const response = await fetch(`http://localhost:8000/jobs/${jobId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const jobData = await response.json();
        setJob(jobData);

        if (jobData.status === "completed" && onJobComplete) {
          onJobComplete(jobData);
        }

        return jobData.status;
      } else {
        throw new Error("Failed to fetch job status");
      }
    } catch (error) {
      console.error("Error fetching job status:", error);
      toast.error("Failed to fetch job status");
      return null;
    }
  };

  useEffect(() => {
    const loadJob = async () => {
      setIsLoading(true);
      await fetchJobStatus();
      setIsLoading(false);
    };

    loadJob();
  }, [jobId, token]);

  useEffect(() => {
    if (!job || job.status === "completed" || job.status === "failed") {
      setIsPolling(false);
      return;
    }

    setIsPolling(true);
    const interval = setInterval(async () => {
      const status = await fetchJobStatus();
      if (status === "completed" || status === "failed") {
        setIsPolling(false);
        clearInterval(interval);
      }
    }, 2000); // Poll every 2 seconds

    return () => {
      clearInterval(interval);
      setIsPolling(false);
    };
  }, [job?.status]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "processing":
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Queued for processing";
      case "processing":
        return "Processing your video...";
      case "completed":
        return "Processing completed";
      case "failed":
        return "Processing failed";
      default:
        return "Unknown status";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 dark:text-yellow-400";
      case "processing":
        return "text-blue-600 dark:text-blue-400";
      case "completed":
        return "text-green-600 dark:text-green-400";
      case "failed":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const handleDownload = () => {
    if (job?.processed_file_url) {
      const link = document.createElement("a");
      link.href = `http://localhost:8000${job.processed_file_url}`;
      link.download = `processed_${job.filename}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Download started!");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <XCircle className="w-12 h-12 mx-auto mb-4" />
          <p>Failed to load job status</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          Processing Status
        </h3>
        <div className="flex items-center space-x-2">
          {getStatusIcon(job.status)}
          <span className={`font-medium ${getStatusColor(job.status)}`}>
            {getStatusText(job.status)}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            File:
          </span>
          <span className="text-sm font-medium text-gray-800 dark:text-white">
            {job.filename}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Processing Type:
          </span>
          <span className="text-sm font-medium text-gray-800 dark:text-white">
            {job.use_premium ? "Premium (Whisper)" : "Free (FFmpeg)"}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Started:
          </span>
          <span className="text-sm font-medium text-gray-800 dark:text-white">
            {formatDate(job.created_at)}
          </span>
        </div>

        {job.status === "processing" && (
          <div className="mt-4">
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm">Processing in progress...</span>
            </div>
            <div className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full animate-pulse"
                style={{ width: "60%" }}
              ></div>
            </div>
          </div>
        )}

        {job.status === "failed" && job.error_message && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">
              <strong>Error:</strong> {job.error_message}
            </p>
          </div>
        )}

        {job.status === "completed" && job.processed_file_url && (
          <div className="mt-4">
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            >
              <Download className="w-5 h-5" />
              <span>Download Processed Video</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobStatus;
