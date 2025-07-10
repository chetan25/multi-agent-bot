"use client";
import { useGoogleDrive } from "@/contexts/GoogleDriveContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, Loader2, RefreshCw } from "lucide-react";

export function GoogleDriveStatus() {
  const {
    isConnected,
    isChecking,
    error,
    connect,
    disconnect,
    checkConnectionStatus,
  } = useGoogleDrive();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Wifi className="h-4 w-4 text-white" />
          </div>
          Google Drive Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Display */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Connection Status:</span>
          <div className="flex items-center gap-2">
            {isChecking ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <span className="text-sm text-blue-600">Checking...</span>
              </>
            ) : isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-600">Disconnected</span>
              </>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={isConnected ? disconnect : connect}
            disabled={isChecking}
            variant={isConnected ? "destructive" : "default"}
            size="sm"
            className="flex-1"
          >
            {isConnected ? "Disconnect" : "Connect"}
          </Button>

          <Button
            onClick={() => {
              console.log("Manual check triggered");
              checkConnectionStatus();
            }}
            disabled={isChecking}
            variant="outline"
            size="sm"
          >
            <RefreshCw
              className={`h-4 w-4 ${isChecking ? "animate-spin" : ""}`}
            />
          </Button>
        </div>

        {/* Debug Info */}
        <details className="text-xs text-gray-500">
          <summary className="cursor-pointer hover:text-gray-700">
            Debug Info
          </summary>
          <div className="mt-2 space-y-1">
            <div>Checking: {isChecking ? "Yes" : "No"}</div>
            <div>Connected: {isConnected ? "Yes" : "No"}</div>
            <div>Error: {error || "None"}</div>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
