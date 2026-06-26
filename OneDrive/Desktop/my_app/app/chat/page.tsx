import ChatRoom from "@/components/ChatRoom";

export default function ChatTestPage() {
  // We're hardcoding 'test-room-123' just to verify it renders and connects
  return (
    // <>
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <h1 className="text-2xl font-bold mb-4">Campus Buzz Test Chat</h1>
      <ChatRoom roomId="test-room-123" />
    </div>
    // </>
  );
}