import { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { User, LogOut, History } from "lucide-react";
import VideoUpload from "./components/VideoUpload";
import AuthModal from "./components/AuthModal";
import JobStatus from "./components/JobStatus";
import PricingCard from "./components/PricingCard";
import toast from "react-hot-toast";

interface User {
  id: number;
  email: string;
  full_name: string;
}

type AppState = "upload" | "processing" | "pricing" | "history";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentState, setCurrentState] = useState<AppState>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Check for existing auth on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleAuthSuccess = (authToken: string, userData: User) => {
    setToken(authToken);
    setUser(userData);
    localStorage.setItem("token", authToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setCurrentState("upload");
    setCurrentJobId(null);
    setSelectedFile(null);
    toast.success("Logged out successfully");
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleProcessingStart = async (usePremium: boolean) => {
    if (!selectedFile) return;

    // Check if user needs to be authenticated for premium processing
    if (usePremium && !user) {
      toast.error("Please sign in to use premium processing");
      setIsAuthModalOpen(true);
      return;
    }

    setIsProcessing(true);
    setCurrentState("processing");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("use_premium", usePremium.toString());

      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("http://localhost:8000/jobs", {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentJobId(data.id);
        toast.success("Processing started!");
      } else {
        throw new Error(data.detail || "Failed to start processing");
      }
    } catch (error) {
      console.error("Error starting processing:", error);
      toast.error("Failed to start processing. Please try again.");
      setCurrentState("upload");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleJobComplete = () => {
    toast.success("Video processing completed!");
    setCurrentState("upload");
    setCurrentJobId(null);
    setSelectedFile(null);
  };

  const showPricing = () => {
    setCurrentState("pricing");
  };

  const showHistory = () => {
    setCurrentState("history");
  };

  const backToUpload = () => {
    setCurrentState("upload");
    setCurrentJobId(null);
    setSelectedFile(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                Silence Remover
              </h1>
              <nav className="hidden md:flex space-x-6">
                <button
                  onClick={backToUpload}
                  className={`text-sm font-medium transition-colors ${
                    currentState === "upload"
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  Upload
                </button>
                {user && (
                  <button
                    onClick={showHistory}
                    className={`text-sm font-medium transition-colors ${
                      currentState === "history"
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    }`}
                  >
                    History
                  </button>
                )}
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-800 dark:text-white">
                      {user.full_name || user.email}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {currentState === "upload" && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
                Remove Silence from Your Videos
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Upload your video and let our AI remove silent sections
                automatically. Free for videos under 1 minute, premium
                processing available for longer videos.
              </p>
            </div>

            <VideoUpload
              onFileSelect={handleFileSelect}
              onProcessingStart={handleProcessingStart}
              isProcessing={isProcessing}
            />

            {/* Pricing Info */}
            <div className="mt-12">
              <h3 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-8">
                Choose Your Processing Method
              </h3>
              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <PricingCard
                  title="Free Processing"
                  price="Free"
                  description="Perfect for short videos under 1 minute"
                  features={[
                    "FFmpeg + Remsi processing",
                    "Fast processing speed",
                    "Good accuracy for most content",
                    "No account required",
                    "Instant processing",
                  ]}
                  onSelect={() => {}}
                  disabled={true}
                />
                <PricingCard
                  title="Premium Processing"
                  price="$0.006/min"
                  description="AI-powered accuracy with OpenAI Whisper"
                  features={[
                    "OpenAI Whisper integration",
                    "Superior speech detection",
                    "Works with any video length",
                    "Account required",
                    "Advanced AI processing",
                  ]}
                  isPopular={true}
                  isPremium={true}
                  onSelect={showPricing}
                />
              </div>
            </div>
          </div>
        )}

        {currentState === "processing" && currentJobId && (
          <div className="max-w-2xl mx-auto">
            <JobStatus
              jobId={currentJobId}
              token={token || ""}
              onJobComplete={handleJobComplete}
            />
          </div>
        )}

        {currentState === "pricing" && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
                Premium Processing Pricing
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Pay only for what you use. Premium processing costs $0.006 per
                minute of video.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <PricingCard
                title="5 Minutes"
                price="$0.03"
                description="Perfect for short presentations"
                features={[
                  "5 minutes of processing",
                  "OpenAI Whisper accuracy",
                  "High-quality output",
                  "Fast processing",
                ]}
                onSelect={() => {
                  // Handle payment for 5 minutes
                  toast("Payment integration coming soon!");
                }}
              />
              <PricingCard
                title="15 Minutes"
                price="$0.09"
                description="Great for longer videos"
                features={[
                  "15 minutes of processing",
                  "OpenAI Whisper accuracy",
                  "High-quality output",
                  "Batch processing support",
                ]}
                isPopular={true}
                onSelect={() => {
                  // Handle payment for 15 minutes
                  toast("Payment integration coming soon!");
                }}
              />
              <PricingCard
                title="30 Minutes"
                price="$0.18"
                description="Ideal for long-form content"
                features={[
                  "30 minutes of processing",
                  "OpenAI Whisper accuracy",
                  "High-quality output",
                  "Priority processing",
                ]}
                onSelect={() => {
                  // Handle payment for 30 minutes
                  toast("Payment integration coming soon!");
                }}
              />
            </div>

            <div className="text-center mt-8">
              <button
                onClick={backToUpload}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
              >
                Back to Upload
              </button>
            </div>
          </div>
        )}

        {currentState === "history" && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
                Processing History
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                View your previous video processing jobs.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <History className="w-12 h-12 mx-auto mb-4" />
                <p>No processing history found.</p>
                <p className="text-sm mt-2">
                  Your completed jobs will appear here.
                </p>
              </div>
            </div>

            <div className="text-center mt-8">
              <button
                onClick={backToUpload}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
              >
                Upload New Video
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}

export default App;
