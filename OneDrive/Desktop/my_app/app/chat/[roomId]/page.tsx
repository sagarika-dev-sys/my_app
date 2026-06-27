"use client";

import { Suspense } from "react";
import ChatRoom from "@/components/ChatRoom";

// We do NOT use the 'use' hook here to avoid ReferenceErrors
export default function Page({ params }: { params: { roomId: string } }) {
  // Access params directly. This works for Next.js 13 and 14.
  const roomId = params.roomId; 

  return (
    <Suspense fallback={<div>Loading Chat...</div>}>
      <ChatRoom roomId={roomId} />
    </Suspense>
  );
}