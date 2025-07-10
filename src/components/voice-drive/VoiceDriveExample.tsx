"use client";
import { useEffect, useRef, useState } from "react";
import { createConfiguredVoiceDriveWorkflow } from "@/lib/vapiWorkflowManager";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mic, MicOff } from "lucide-react";

export function VoiceDriveExample() {
  const workflowRef = useRef<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize the voice drive workflow
    const voiceDriveWorkflow = createConfiguredVoiceDriveWorkflow();
    workflowRef.current = voiceDriveWorkflow;

    // Set up event listeners
    const vapiInstance = voiceDriveWorkflow.vapiInstance;

    vapiInstance.on("call-start", () => {
      setIsConnected(true);
      console.log("Voice Drive call started");
    });

    vapiInstance.on("call-end", () => {
      setIsConnected(false);
      console.log("Voice Drive call ended");
    });

    vapiInstance.on("message", (message) => {
      if (message.type === "transcript") {
        console.log(`${message.role}: ${message.transcript}`);
      } else if (message.type === "function-call") {
        console.log("Function call:", message.functionCall);
      } else if (message.type === "workflow-step") {
        console.log("Workflow step:", message.step);
      }
    });

    vapiInstance.on("error", (error) => {
      console.error("Voice Drive workflow error:", error);
    });

    return () => {
      if (workflowRef.current) {
        workflowRef.current.endCall();
      }
    };
  }, []);

  const handleStartCall = () => {
    if (workflowRef.current && !isConnected) {
      workflowRef.current.startVoiceDriveCall({
        userId: "example_user",
        name: "Example User",
        context: "google_drive_management",
      });
    }
  };

  const handleEndCall = () => {
    if (workflowRef.current && isConnected) {
      workflowRef.current.endCall();
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isConnected ? (
            <Mic className="h-5 w-5 text-green-500" />
          ) : (
            <MicOff className="h-5 w-5 text-gray-400" />
          )}
          Voice Drive Example
        </CardTitle>
        <CardDescription>
          Example implementation using the new workflow pattern
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={handleStartCall}
            disabled={isConnected}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            Start Voice Call
          </Button>
          <Button
            onClick={handleEndCall}
            disabled={!isConnected}
            variant="destructive"
          >
            End Call
          </Button>
        </div>

        <div className="text-sm text-gray-600">
          <p>Status: {isConnected ? "Connected" : "Disconnected"}</p>
          <p>
            This example demonstrates the new workflow pattern using workflowId.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
