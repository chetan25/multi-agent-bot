"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function TestAPIPage() {
  const [testResult, setTestResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const testGetAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/chat");
      const data = await response.json();
      setTestResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setTestResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testPostAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Hello" }],
          provider: "openai",
          model: "gpt-4o",
          userApiKey: "test-key",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setTestResult(
          `Error ${response.status}: ${JSON.stringify(errorData, null, 2)}`
        );
      } else {
        setTestResult("POST request successful");
      }
    } catch (error) {
      setTestResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Chat API Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={testGetAPI} disabled={loading}>
              Test GET /api/chat
            </Button>
            <Button onClick={testPostAPI} disabled={loading}>
              Test POST /api/chat
            </Button>
          </div>

          {loading && <p>Testing...</p>}

          {testResult && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Result:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {testResult}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
