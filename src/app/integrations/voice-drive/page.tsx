"use client";
import {
  VoiceDriveHeader,
  VoiceControlPanel,
  QuickActions,
  FileBrowser,
  VoiceActivityLog,
} from "@/components/voice-drive";
import { GoogleDriveStatus } from "@/components/voice-drive/GoogleDriveStatus";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useSessionManager } from "@/lib/sessionManager";

function VoiceDriveContent() {
  return (
    <div className="container mx-auto py-8 px-4">
      <VoiceDriveHeader />

      {/* Google Drive Status Component */}
      <div className="mb-6">
        <GoogleDriveStatus />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Voice Control and Quick Actions */}
        <div className="lg:col-span-1">
          <VoiceControlPanel />
          <QuickActions />
        </div>

        {/* Right Column - File Browser and Activity Log */}
        <div className="lg:col-span-2">
          <FileBrowser />
          <VoiceActivityLog />
        </div>
      </div>
    </div>
  );
}

export default function VoiceDrivePage() {
  return (
    <ProtectedRoute>
      <VoiceDriveContent />
    </ProtectedRoute>
  );
}
