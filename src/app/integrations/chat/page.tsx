import { ChatComponent } from "@/components/chat/ChatComponent";

export default function ChatPage() {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 min-h-0">
        <ChatComponent />
      </div>
    </div>
  );
}
