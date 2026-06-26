"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL as string) || "";
const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string) || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function ChatRoom({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `room_id=eq.${roomId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    await fetch(`/api/chat/${roomId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newMessage }),
    });
    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-[550px] w-full max-w-md border border-slate-800 rounded-2xl bg-slate-950 shadow-2xl overflow-hidden">
      {/* Chat Header */}
      <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-sm font-semibold text-slate-200 tracking-wide">Live Room: {roomId}</span>
        </div>
        <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-medium border border-indigo-500/20">
          Realtime
        </span>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-slate-950 to-slate-900/50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm space-y-1">
            <p>No messages yet.</p>
            <p className="text-xs text-slate-600">Be the first to buzz this room!</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className="flex flex-col items-start max-w-[85%] bg-slate-800 border border-slate-700/50 rounded-2xl rounded-tl-none p-3 shadow-sm transition-all duration-200 hover:border-slate-600">
              <p className="text-sm text-slate-100 leading-relaxed break-words w-full">{msg.content}</p>
              <span className="text-[10px] text-slate-400 mt-1 self-end">Just now</span>
            </div>
          ))
        )}
      </div>
      
      {/* Input Area */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2 items-center">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message to the campus..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button 
          onClick={sendMessage}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/10 transition-all active:scale-95"
        >
          Send
        </button>
      </div>
    </div>
  );
}