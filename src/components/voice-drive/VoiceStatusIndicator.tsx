"use client";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { useGoogleDrive } from "@/contexts/GoogleDriveContext";
import { useVoiceControl } from "@/hooks/useVoiceControl";

interface VoiceStatusIndicatorProps {
  showText?: boolean;
  className?: string;
}

export function VoiceStatusIndicator({
  showText = false,
  className = "",
}: VoiceStatusIndicatorProps) {
  const { isConnected } = useGoogleDrive();
  const { isActive, isProcessing } = useVoiceControl(isConnected, false);

  if (!isConnected) {
    return null; // Don't show indicator if not connected
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {isProcessing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          {showText && (
            <span className="text-sm text-blue-600">Processing...</span>
          )}
        </>
      ) : isActive ? (
        <>
          <Mic className="h-4 w-4 text-green-500 animate-pulse" />
          {showText && (
            <span className="text-sm text-green-600">Voice Active</span>
          )}
        </>
      ) : (
        <>
          <MicOff className="h-4 w-4 text-gray-400" />
          {showText && (
            <span className="text-sm text-gray-500">Voice Ready</span>
          )}
        </>
      )}
    </div>
  );
}
