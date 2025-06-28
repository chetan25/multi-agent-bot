"use client";

import { ChatComponent } from "@/components/chat/ChatComponent";

export default function TestMultimodalPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Multi-Modal Chat Test</h1>
      <p className="text-gray-600 mb-4">
        Test the chat with image and file uploads. Make sure to configure a
        vision-enabled model like GPT-4o or Claude 3.5 Sonnet.
      </p>
      <ChatComponent />
    </div>
  );
}
