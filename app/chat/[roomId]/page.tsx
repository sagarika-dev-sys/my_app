"use client";

import { Suspense, useEffect, useState } from "react";
import ChatRoom from "@/components/ChatRoom";
import { supabase } from "@/lib/supabase";

// Handles the param unwrapping for different Next.js/React versions
export default function Page({ params }: { params: Promise<{ roomId: string }> | { roomId: string } }) {
  const [roomId, setRoomId] = useState<string | null>(null);

  useEffect(() => {
    // Unwrapping promise to support Next.js 15+
    Promise.resolve(params).then((p) => setRoomId(p.roomId));
  }, [params]);

  if (!roomId) return <div>Loading...</div>;

  return (
    <Suspense fallback={<div className="text-sm p-5 text-slate-500">Connecting to secure stream...</div>}>
      <ChatMemberWrapper roomId={roomId} />
    </Suspense>
  );
}

// Sub-component to ensure user is in chat_room_members table
function ChatMemberWrapper({ roomId }: { roomId: string }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const ensureMembership = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Upsert into members table to satisfy RLS policy
      await supabase
        .from('chat_room_members')
        .upsert({ room_id: roomId, user_id: user.id }, { onConflict: 'room_id,user_id' });
      
      setIsReady(true);
    };
    ensureMembership();
  }, [roomId]);

  return isReady ? <ChatRoom roomId={roomId} /> : <div>Joining room...</div>;
}