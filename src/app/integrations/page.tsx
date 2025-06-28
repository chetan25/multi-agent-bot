import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, MessageSquare } from "lucide-react";
import Link from "next/link";

function IntegrationsContent() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Integrations</h1>
        <p className="text-gray-600">
          Explore our available integrations and tools
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* AI Chat Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>Multi-Provider AI Chat</CardTitle>
                <CardDescription>
                  OpenAI, Anthropic, Mistral & more
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Chat with multiple AI providers. Configure your own API keys and
              choose from various models including GPT-4, Claude, and Mistral.
            </p>
            <Link href="/integrations/chat">
              <Button className="w-full bg-blue-500 hover:bg-blue-600">
                <MessageSquare className="h-4 w-4 mr-2" />
                Start Chatting
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Coming Soon Card */}
        <Card className="hover:shadow-lg transition-shadow opacity-60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gray-400 rounded-lg flex items-center justify-center">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>More Integrations</CardTitle>
                <CardDescription>Coming Soon</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              We're working on more exciting integrations. Stay tuned for
              updates!
            </p>
            <Button className="w-full" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <ProtectedRoute>
      <IntegrationsContent />
    </ProtectedRoute>
  );
}
