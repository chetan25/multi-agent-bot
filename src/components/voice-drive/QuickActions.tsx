"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Search,
  FolderOpen,
  Settings,
  WifiOff,
  Loader2,
} from "lucide-react";
import { useGoogleDrive } from "@/contexts/GoogleDriveContext";

export function QuickActions() {
  const { isConnected, isChecking } = useGoogleDrive();

  // Show loading state while checking connection
  if (isChecking) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            Quick Actions
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
            Quick Actions
          </CardTitle>
          <CardDescription>
            Connect to Google Drive to enable actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-700">
              Actions are disabled. Please connect your Google Drive account
              first.
            </p>
          </div>

          {/* Disabled buttons */}
          <Button variant="outline" className="w-full justify-start" disabled>
            <Upload className="h-4 w-4 mr-2 text-gray-400" />
            Upload File
          </Button>
          <Button variant="outline" className="w-full justify-start" disabled>
            <Search className="h-4 w-4 mr-2 text-gray-400" />
            Search Files
          </Button>
          <Button variant="outline" className="w-full justify-start" disabled>
            <FolderOpen className="h-4 w-4 mr-2 text-gray-400" />
            Create Folder
          </Button>
          <Button variant="outline" className="w-full justify-start" disabled>
            <Settings className="h-4 w-4 mr-2 text-gray-400" />
            Settings
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
        <CardDescription>Common Google Drive operations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button variant="outline" className="w-full justify-start">
          <Upload className="h-4 w-4 mr-2" />
          Upload File
        </Button>
        <Button variant="outline" className="w-full justify-start">
          <Search className="h-4 w-4 mr-2" />
          Search Files
        </Button>
        <Button variant="outline" className="w-full justify-start">
          <FolderOpen className="h-4 w-4 mr-2" />
          Create Folder
        </Button>
        <Button variant="outline" className="w-full justify-start">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </CardContent>
    </Card>
  );
}
