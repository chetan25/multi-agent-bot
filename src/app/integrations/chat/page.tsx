import { ChatComponent } from "@/components/chat/ChatComponent";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <div className="w-full h-full flex flex-col">
        <div className="flex-1 min-h-0">
          <ChatComponent />
        </div>
      </div>
    </ProtectedRoute>
  );
}
