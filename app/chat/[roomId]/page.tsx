"use client";

import { Suspense, use } from "react";
import ChatRoom from "@/components/ChatRoom";

interface PageProps {
  params: Promise<{ roomId: string }>;
}

export default function Page({ params }: PageProps) {
  // Next.js 15 mandatory unwrapping using React.use()
  const resolvedParams = use(params);
  const roomId = resolvedParams.roomId; 

  return (
    <Suspense fallback={<div className="text-sm p-5 text-slate-500">Loading Chat Lounge...</div>}>
      <ChatRoom roomId={roomId} />
    </Suspense>
  );
}