"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ChatRoom({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!roomId) return;

    // Listen to messages for this specific club/room
    const channel = supabase
      .channel(`chat-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `club_id=eq.${roomId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  return (
    <div className="flex flex-col h-[520px] w-full border border-gray-200 bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
        <h3 className="text-sm font-bold text-gray-900">Club Lounge: {roomId}</h3>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg, i) => (
          <div key={i} className="text-xs mb-2">{msg.content}</div>
        ))}
      </div>
    </div>
  );
}