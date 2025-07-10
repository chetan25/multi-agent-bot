"use client";
import { Button } from "@/components/ui/button";
import { Mic, HardDrive, Wifi, WifiOff, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useGoogleDrive } from "@/contexts/GoogleDriveContext";
import { VoiceStatusIndicator } from "./VoiceStatusIndicator";

export function VoiceDriveHeader() {
  const searchParams = useSearchParams();
  const {
    isConnected,
    isChecking,
    error,
    connect,
    disconnect,
    checkConnectionStatus,
  } = useGoogleDrive();

  // Handle OAuth callback results
  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");
    const details = searchParams.get("details");

    if (connected === "true") {
      // Refresh connection status after successful OAuth
      // checkConnectionStatus();
      // Clean up URL parameters
      window.history.replaceState({}, "", "/integrations/voice-drive");
    } else if (error) {
      // Show specific error messages
      let errorMessage = "Connection failed";

      switch (error) {
        case "configuration_error":
          errorMessage = "Configuration error: Check environment variables";
          break;
        case "missing_parameters":
          errorMessage = "Missing OAuth parameters";
          break;
        case "token_exchange_failed":
          errorMessage = "Token exchange failed: Check OAuth credentials";
          break;
        case "no_refresh_token":
          errorMessage = "No refresh token received: Try connecting again";
          break;
        case "database_error":
          errorMessage = "Database error: Check Supabase configuration";
          break;
        case "callback_error":
          errorMessage = "Callback error: Check server logs";
          break;
        case "not_authenticated":
          errorMessage = "User not authenticated: Please sign in again";
          break;
        case "user_mismatch":
          errorMessage = "User mismatch: Please try connecting again";
          break;
        default:
          errorMessage = `Connection failed: ${error}`;
      }

      if (details) {
        errorMessage += ` (${decodeURIComponent(details)})`;
      }

      alert(errorMessage);
      // Clean up URL parameters
      window.history.replaceState({}, "", "/integrations/voice-drive");
    }
  }, [searchParams, checkConnectionStatus]);

  // Show error alerts
  useEffect(() => {
    if (error) {
      alert(error);
    }
  }, [error]);

  const handleToggleConnection = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  };

  // Show loading state while checking connection
  if (isChecking) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
            <div className="flex items-center gap-1">
              <Mic className="h-4 w-4 text-white" />
              <HardDrive className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">
              Voice Assistant for Google Drive
            </h1>
            <p className="text-gray-600">
              Control your files with voice commands
            </p>
          </div>
          <VoiceStatusIndicator showText={true} />
        </div>

        {/* Loading State */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-700">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">Checking connection...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
          <div className="flex items-center gap-1">
            <Mic className="h-4 w-4 text-white" />
            <HardDrive className="h-4 w-4 text-white" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Voice Assistant for Google Drive
          </h1>
          <p className="text-gray-600">
            Control your files with voice commands
          </p>
        </div>
      </div>
    </div>
  );
}
