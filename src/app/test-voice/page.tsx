"use client";
import {
  VoiceControlPanel,
  VoiceStatusIndicator,
} from "@/components/voice-drive";
import { GoogleDriveStatus } from "@/components/voice-drive/GoogleDriveStatus";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function TestVoiceContent() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Voice Integration Test
        </h1>
        <p className="text-gray-600">
          Test the voice button integration with Vapi workflow
        </p>
      </div>

      {/* Google Drive Status */}
      <div className="mb-6">
        <GoogleDriveStatus />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Voice Control Panel */}
        <div>
          <VoiceControlPanel />
        </div>

        {/* Voice Status and Instructions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <VoiceStatusIndicator />
                Voice Status
              </CardTitle>
              <CardDescription>
                Current voice call status and controls
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">
                    How to Test:
                  </h4>
                  <ol className="text-sm text-blue-800 space-y-1">
                    <li>
                      1. Connect to Google Drive using the status panel above
                    </li>
                    <li>
                      2. Click the microphone icon in the Voice Control panel
                    </li>
                    <li>3. Speak your Google Drive commands</li>
                    <li>4. Watch the transcript and status updates</li>
                  </ol>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">
                    Try These Commands:
                  </h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• &quot;Create a new folder called Projects&quot;</li>
                    <li>• &quot;Search for documents about budget&quot;</li>
                    <li>• &quot;Upload a new file&quot;</li>
                    <li>• &quot;Share the presentation file&quot;</li>
                    <li>• &quot;Delete old files&quot;</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Integration Details</CardTitle>
              <CardDescription>
                How the voice button connects to Vapi workflow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-medium">Workflow Pattern:</h4>
                  <p className="text-gray-600">
                    Uses the new Vapi workflow pattern with workflowId instead
                    of assistantId
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">State Management:</h4>
                  <p className="text-gray-600">
                    Centralized voice state management through useVoiceControl
                    hook
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Event Handling:</h4>
                  <p className="text-gray-600">
                    Real-time updates for call status, transcripts, and function
                    calls
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Error Handling:</h4>
                  <p className="text-gray-600">
                    Comprehensive error handling with user-friendly messages
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function TestVoicePage() {
  return (
    <ProtectedRoute>
      <TestVoiceContent />
    </ProtectedRoute>
  );
}
