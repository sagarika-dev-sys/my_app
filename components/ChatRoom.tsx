"use client";

import { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "@/lib/config";

export default function ChatRoom({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Helper logic to sync current chat records from your Python server memory array
  const fetchMessages = async () => {
    if (!roomId) return;
    try {
      const response = await fetch(`${API_BASE_URL}/chat/${roomId}`, { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Failed syncing live lounge updates:", error);
    }
  };

  // High-speed intervals pipeline to check for incoming messages every 2 seconds
  useEffect(() => {
    fetchMessages(); // Execute instantly on load

    const pollLoop = setInterval(() => {
      fetchMessages();
    }, 2000);

    return () => clearInterval(pollLoop); // Tear down interval stream when routing away
  }, [roomId]);

  // Smooth auto-scroll behavior to snap to the latest messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle text transmission over to FastAPI
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isSubmitting) return;

    const currentText = text;
    setText(""); // Instant UI clearance for a crisp, native app experience
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat/${roomId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: currentText }),
      });

      if (response.ok) {
        await fetchMessages(); // Instantly pull backend data state
      }
    } catch (error) {
      console.error("Message transmission failure:", error);
      setText(currentText); // Restore text line string if engine drop occurs
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-[560px] w-full border border-gray-200/60 bg-white/70 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden font-sans">
      
      {/* Header Bar Panel Section */}
      <div className="px-6 py-4 bg-slate-900 text-white border-b border-gray-200 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold tracking-tight">Club Lounge: <span className="text-indigo-400 font-mono">#{roomId}</span></h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Local encrypted sandbox feed engine</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Sync Active</span>
        </div>
      </div>

      {/* Primary Message Log Feed Dock */}
      <div className="flex-1 p-5 overflow-y-auto bg-slate-50/50 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-xs text-slate-400 pt-16 border border-dashed border-slate-200 rounded-xl p-6 bg-white/50">
            No dynamic traces streamed yet. Start the campus talk below!
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className="flex flex-col bg-white border border-slate-100 rounded-xl p-3 max-w-[85%] shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
              <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wide mb-0.5">Anonymous Peer</span>
              <p className="text-sm text-slate-800 leading-relaxed font-medium">{msg.content}</p>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Form Submission Input Section */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex gap-2 items-center">
        <input
          type="text"
          placeholder="Broadcast a string to the lounge room..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-slate-900 rounded-xl text-sm h-11 px-4 outline-none transition-all"
          required
        />
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-11 px-6 rounded-xl transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
        >
          {isSubmitting ? "Sending..." : "Send String"}
        </button>
      </form>

    </div>
  );
}