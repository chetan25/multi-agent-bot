import { useState, useEffect, useRef, useCallback } from "react";
import {
  createConfiguredVoiceDriveWorkflow,
  validateVapiConfig,
} from "@/lib/vapiWorkflowManager";

interface VoiceControlState {
  isActive: boolean;
  isProcessing: boolean;
  error: string | null;
  transcript: string[];
  volumeLevel: number;
  userId: string | null;
}

interface VoiceControlActions {
  startVoiceCall: () => Promise<void>;
  stopVoiceCall: () => Promise<void>;
  toggleVoiceCall: () => Promise<void>;
  clearError: () => void;
  clearTranscript: () => void;
}

export function useVoiceControl(
  isConnected: boolean,
  isChecking: boolean
): VoiceControlState & VoiceControlActions {
  const [state, setState] = useState<VoiceControlState>({
    isActive: false,
    isProcessing: false,
    error: null,
    transcript: [],
    volumeLevel: 0,
    userId: null,
  });

  const workflowRef = useRef<any>(null);

  // Get user ID from Supabase auth
  useEffect(() => {
    const getUser = async () => {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setState((prev) => ({ ...prev, userId: user.id }));
        }
      } catch (error) {
        console.error("Error getting user:", error);
      }
    };

    getUser();
  }, []);

  // Initialize Voice Drive Workflow
  const initializeWorkflow = useCallback(() => {
    if (!workflowRef.current && isConnected && state.userId) {
      try {
        // Validate Vapi configuration
        const configValidation = validateVapiConfig();
        if (!configValidation.isValid) {
          console.error("Vapi configuration errors:", configValidation.errors);
          setState((prev) => ({
            ...prev,
            error:
              "Vapi configuration is invalid. Please check your environment variables.",
          }));
          return;
        }

        const voiceDriveWorkflow = createConfiguredVoiceDriveWorkflow();
        workflowRef.current = voiceDriveWorkflow;

        // Set up event listeners for UI updates
        const vapiInstance = voiceDriveWorkflow.vapiInstance;

        vapiInstance.on("call-start", () => {
          setState((prev) => ({
            ...prev,
            isActive: true,
            error: null,
          }));
          console.log("Voice Drive call started for user:", state.userId);
        });

        vapiInstance.on("call-end", () => {
          setState((prev) => ({
            ...prev,
            isActive: false,
            isProcessing: false,
            transcript: [],
          }));
          console.log("Voice Drive call ended");
        });

        vapiInstance.on("volume-level", (vol: number) => {
          setState((prev) => ({ ...prev, volumeLevel: vol }));
        });

        vapiInstance.on("message", (msg: any) => {
          console.log("Vapi message:", msg);

          if (msg.type === "transcript" && msg.transcriptType === "final") {
            setState((prev) => ({
              ...prev,
              transcript: [...prev.transcript, `You: ${msg.transcript}`],
            }));
          }

          if (msg.type === "function-call") {
            setState((prev) => ({ ...prev, isProcessing: true }));
            console.log("Function call initiated:", msg);
          }

          if (msg.type === "function-call-result") {
            setState((prev) => ({ ...prev, isProcessing: false }));
            console.log("Function call completed:", msg);
          }
        });

        vapiInstance.on("error", (e: Error) => {
          console.error("Vapi error:", e);
          setState((prev) => ({
            ...prev,
            error: e.message,
            isProcessing: false,
          }));
        });
      } catch (error) {
        console.error("Error initializing Vapi workflow:", error);
        setState((prev) => ({
          ...prev,
          error: "Failed to initialize voice agent. Please try again.",
        }));
      }
    }
  }, [isConnected, state.userId]);

  useEffect(() => {
    if (isConnected && state.userId) {
      initializeWorkflow();
    } else {
      // Clean up workflow when disconnected
      if (workflowRef.current) {
        workflowRef.current.endCall();
        workflowRef.current = null;
      }
      setState((prev) => ({
        ...prev,
        isActive: false,
        isProcessing: false,
        transcript: [],
        error: null,
      }));
    }

    return () => {
      if (workflowRef.current) {
        workflowRef.current.endCall();
        workflowRef.current = null;
      }
    };
  }, [initializeWorkflow, isConnected, state.userId]);

  const startVoiceCall = async () => {
    if (!isConnected || !state.userId || !workflowRef.current) {
      throw new Error(
        "Voice call cannot be started. Please check your connection and authentication."
      );
    }

    try {
      setState((prev) => ({ ...prev, error: null }));
      workflowRef.current.startVoiceDriveCall({
        userId: state.userId,
        name: `User-${state.userId.substring(0, 8)}`, // Create a readable name from user ID
        context: "google_drive_management",
      });
    } catch (err) {
      console.error("Error starting voice call:", err);
      setState((prev) => ({
        ...prev,
        error: "Failed to start voice call. Please try again.",
      }));
      throw err;
    }
  };

  const stopVoiceCall = async () => {
    if (!workflowRef.current) {
      throw new Error("No active voice call to stop.");
    }

    try {
      workflowRef.current.endCall();
    } catch (err) {
      console.error("Error stopping voice call:", err);
      setState((prev) => ({
        ...prev,
        error: "Failed to stop voice call. Please try again.",
      }));
      throw err;
    }
  };

  const toggleVoiceCall = async () => {
    if (state.isActive) {
      await stopVoiceCall();
    } else {
      await startVoiceCall();
    }
  };

  const clearError = () => {
    setState((prev) => ({ ...prev, error: null }));
  };

  const clearTranscript = () => {
    setState((prev) => ({ ...prev, transcript: [] }));
  };

  return {
    ...state,
    startVoiceCall,
    stopVoiceCall,
    toggleVoiceCall,
    clearError,
    clearTranscript,
  };
}
