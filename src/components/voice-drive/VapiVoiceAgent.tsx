"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useGoogleDrive } from "@/contexts/GoogleDriveContext";
import { useSessionManager } from "@/lib/sessionManager";
import {
  createConfiguredVoiceDriveWorkflow,
  validateVapiConfig,
} from "@/lib/vapiWorkflowManager";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WifiOff, Loader2, Mic, MicOff } from "lucide-react";

export default function VapiVoiceAgent() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const workflowRef = useRef<any>(null);
  const { isConnected, isChecking } = useGoogleDrive();
  const { user, accessToken } = useSessionManager();

  // Get user ID from session manager
  const userId = user?.id;

  // Initialize Voice Drive Workflow
  const initializeWorkflow = useCallback(() => {
    if (!workflowRef.current && isConnected && userId) {
      try {
        // Validate Vapi configuration
        const configValidation = validateVapiConfig();
        if (!configValidation.isValid) {
          console.error("Vapi configuration errors:", configValidation.errors);
          setError(
            "Vapi configuration is invalid. Please check your environment variables."
          );
          return;
        }

        const voiceDriveWorkflow = createConfiguredVoiceDriveWorkflow();
        workflowRef.current = voiceDriveWorkflow;

        // Set up additional event listeners for UI updates
        const vapiInstance = voiceDriveWorkflow.vapiInstance;

        vapiInstance.on("call-start", () => {
          setIsSessionActive(true);
          setError(null);
          console.log("Voice Drive call started for user:", userId);
        });

        vapiInstance.on("call-end", () => {
          setIsSessionActive(false);
          setIsProcessing(false);
          setTranscript([]);
          setSessionId(null);
          console.log("Voice Drive call ended");
        });

        vapiInstance.on("volume-level", (vol: number) => setVolumeLevel(vol));

        vapiInstance.on("message", (msg: any) => {
          console.log("Vapi message:", msg);

          if (msg.type === "transcript" && msg.transcriptType === "final") {
            setTranscript((prev) => [...prev, `You: ${msg.transcript}`]);
          }

          if (msg.type === "function-call") {
            setIsProcessing(true);
            console.log("Function call initiated:", msg);
          }

          if (msg.type === "function-call-result") {
            setIsProcessing(false);
            console.log("Function call completed:", msg);
          }
        });

        vapiInstance.on("error", (e: Error) => {
          console.error("Vapi error:", e);
          setError(e.message);
          setIsProcessing(false);
        });
      } catch (error) {
        console.error("Error initializing Vapi workflow:", error);
        setError("Failed to initialize voice agent. Please try again.");
      }
    }
  }, [isConnected, userId]);

  useEffect(() => {
    if (isConnected && userId) {
      initializeWorkflow();
    } else {
      // Clean up workflow when disconnected
      if (workflowRef.current) {
        workflowRef.current.endCall();
        workflowRef.current = null;
      }
      setIsSessionActive(false);
      setIsProcessing(false);
      setTranscript([]);
      setError(null);
      setSessionId(null);
    }

    return () => {
      if (workflowRef.current) {
        workflowRef.current.endCall();
        workflowRef.current = null;
      }
    };
  }, [initializeWorkflow, isConnected, userId]);

  const toggleCall = async () => {
    if (!workflowRef.current || !isConnected || !userId) return;

    // Additional check for access token
    if (!accessToken) {
      console.error("❌ No access token available for Vapi call");
      setError(
        "No access token available. Please try refreshing your session."
      );
      return;
    }

    try {
      if (isSessionActive) {
        workflowRef.current.endCall();
      } else {
        setError(null);

        // Debug logging for session and access token
        console.log("🔍 VapiVoiceAgent - Session Debug:", {
          user: user ? { id: user.id, email: user.email } : null,
          accessToken: accessToken
            ? `${accessToken.substring(0, 20)}...`
            : null,
          hasAccessToken: !!accessToken,
          accessTokenLength: accessToken?.length || 0,
        });

        // Start call with user context and access token
        workflowRef.current.startVoiceDriveCall({
          userId: userId,
          name: user?.email || "User", // Use email as name
          context: "google_drive_management",
          accessToken: accessToken, // Pass access token for backend authentication
        });
      }
    } catch (err) {
      console.error("Error toggling call:", err);
      setError("Failed to start voice call. Please try again.");
    }
  };

  // Show loading state while checking connection
  if (isChecking) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            Voice Agent
          </CardTitle>
          <CardDescription>Checking Google Drive connection...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">
            Please wait while we verify your Google Drive connection.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show disconnected state
  if (!isConnected) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WifiOff className="h-6 w-6 text-gray-400" />
            Voice Agent
          </CardTitle>
          <CardDescription>Google Drive not connected</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">
            Please connect to Google Drive to use the voice agent.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show unauthenticated state
  if (!userId) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WifiOff className="h-6 w-6 text-gray-400" />
            Voice Agent
          </CardTitle>
          <CardDescription>User not authenticated</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">
            Please sign in to use the voice agent.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show no access token state
  if (!accessToken) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WifiOff className="h-6 w-6 text-gray-400" />
            Voice Agent
          </CardTitle>
          <CardDescription>No access token available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">
            Your session may have expired. Please try refreshing the page or
            signing in again.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isSessionActive ? (
            <Mic className="h-5 w-5 text-green-500" />
          ) : (
            <MicOff className="h-5 w-5 text-gray-400" />
          )}
          Voice Agent
        </CardTitle>
        <CardDescription>
          Control your Google Drive files with voice commands
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Session Info */}
        {sessionId && (
          <div className="text-xs text-gray-500">
            Session: {sessionId.substring(0, 8)}... | User:{" "}
            {userId.substring(0, 8)}...
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Volume Level Indicator */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Volume:</span>
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-100"
              style={{ width: `${volumeLevel * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">
            {Math.round(volumeLevel * 100)}%
          </span>
        </div>

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing your request...
          </div>
        )}

        {/* Call Control */}
        <button
          onClick={toggleCall}
          disabled={!isConnected || isProcessing || !userId}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
            isSessionActive
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-blue-500 text-white hover:bg-blue-600"
          } disabled:bg-gray-300 disabled:cursor-not-allowed`}
        >
          {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSessionActive ? "End Call" : "Start Voice Call"}
        </button>

        {/* Transcript */}
        {transcript.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Conversation:</h4>
            <div className="max-h-32 overflow-y-auto text-sm text-gray-600 space-y-1">
              {transcript.map((entry, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded">
                  {entry}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
