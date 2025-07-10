"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, WifiOff, Loader2 } from "lucide-react";
import { useGoogleDrive } from "@/contexts/GoogleDriveContext";
import { useVoiceControl } from "@/hooks/useVoiceControl";

export function VoiceControlPanel({ onMicClick }: { onMicClick?: () => void }) {
  const { isConnected, isChecking } = useGoogleDrive();
  const {
    isActive,
    isProcessing,
    error,
    transcript,
    volumeLevel,
    userId,
    toggleVoiceCall,
  } = useVoiceControl(isConnected, isChecking);

  const handleMicClick = async () => {
    try {
      await toggleVoiceCall();
      onMicClick?.();
    } catch (err) {
      console.error("Error toggling voice call:", err);
    }
  };

  // Show loading state while checking connection
  if (isChecking) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            Voice Control
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

  // Show disabled state when not connected
  if (!isConnected) {
    return (
      <Card className="opacity-75">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WifiOff className="h-8 w-8 text-gray-400" />
            Voice Control
          </CardTitle>
          <CardDescription>
            Connect to Google Drive to enable voice commands
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-700">
              Voice functionality is disabled. Please connect your Google Drive
              account first.
            </p>
          </div>

          {/* Voice Commands Help - Disabled */}
          <div className="space-y-2 opacity-50">
            <h4 className="font-medium text-sm">Voice commands (disabled):</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• "Upload a new file"</li>
              <li>• "Search for documents"</li>
              <li>• "Create a new folder"</li>
              <li>• "Share the budget file"</li>
              <li>• "Delete old files"</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show unauthenticated state
  if (!userId) {
    return (
      <Card className="opacity-75">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WifiOff className="h-8 w-8 text-gray-400" />
            Voice Control
          </CardTitle>
          <CardDescription>User not authenticated</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-700">
              Please sign in to use voice commands.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span
            className={`cursor-pointer transition-colors ${
              isActive ? "text-green-500 animate-pulse" : "hover:text-green-600"
            }`}
            onClick={handleMicClick}
            title={isActive ? "Stop Voice Assistant" : "Start Voice Assistant"}
            tabIndex={0}
            role="button"
            aria-label={
              isActive ? "Stop Voice Assistant" : "Start Voice Assistant"
            }
          >
            {isActive ? (
              <MicOff className="h-8 w-8" />
            ) : (
              <Mic className="h-8 w-8" />
            )}
          </span>
          Voice Control
        </CardTitle>
        <CardDescription>
          Use voice commands to manage your Google Drive files
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Volume Level Indicator */}
        {isActive && (
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
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing your request...
          </div>
        )}

        {isActive && (
          <div className="flex justify-center">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleMicClick}
              className="bg-red-500 hover:bg-red-600"
            >
              Stop Voice
            </Button>
          </div>
        )}

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

        {/* Voice Commands Help */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Try saying:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• "Upload a new file"</li>
            <li>• "Search for documents"</li>
            <li>• "Create a new folder"</li>
            <li>• "Share the budget file"</li>
            <li>• "Delete old files"</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
