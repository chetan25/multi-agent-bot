"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mic, Search, FolderOpen, WifiOff, Loader2 } from "lucide-react";
import { useGoogleDrive } from "@/contexts/GoogleDriveContext";

export function VoiceActivityLog() {
  const { isConnected, isChecking } = useGoogleDrive();

  // Show loading state while checking connection
  if (isChecking) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            Recent Voice Commands
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
      <Card className="mt-6 opacity-75">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WifiOff className="h-5 w-5 text-gray-400" />
            Recent Voice Commands
          </CardTitle>
          <CardDescription>
            Connect to Google Drive to see voice activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-700 mb-3">
              Voice activity log is disabled. Please connect your Google Drive
              account first.
            </p>
            <div className="text-xs text-gray-500">
              Once connected, you&apos;ll see:
              <ul className="mt-2 space-y-1">
                <li>• Recent voice commands</li>
                <li>• Command execution status</li>
                <li>• File operations history</li>
                <li>• Voice interaction logs</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg">Recent Voice Commands</CardTitle>
        <CardDescription>
          Your latest voice interactions with Google Drive
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <Mic className="h-4 w-4 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                &quot;Upload the presentation file&quot;
              </p>
              <p className="text-xs text-gray-500">2 minutes ago • Success</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <Search className="h-4 w-4 text-blue-600" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                &quot;Search for budget documents&quot;
              </p>
              <p className="text-xs text-gray-500">
                5 minutes ago • Found 3 files
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
            <FolderOpen className="h-4 w-4 text-yellow-600" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                &quot;Create a new folder called Projects&quot;
              </p>
              <p className="text-xs text-gray-500">10 minutes ago • Success</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
