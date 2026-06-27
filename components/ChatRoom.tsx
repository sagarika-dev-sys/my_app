"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function ChatRoom({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // 1. Define our async setup routine
    const initChat = async () => {
      // Get the current user session safely
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);
      
      // Load initial messages from 'chat_messages' table (matching main.py)
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('club_id', roomId)
        .order('created_at', { ascending: true });
        
      if (!error) {
        setMessages(data || []);
      } else {
        console.error("Error loading chat table:", error.message);
      }

      // 2. Setup direct Realtime websockets subscription channel
      const channel = supabase
        .channel(`room-${roomId}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `club_id=eq.${roomId}` 
        }, (payload) => {
          // Instantly inject new broadcast into the state array
          setMessages(prev => [...prev, payload.new]);
        })
        .subscribe();

      // Return the clean up function to React directly
      return channel;
    };

    let activeChannel: any;
    initChat().then((channel) => {
      activeChannel = channel;
    });

    // Cleanup subscription when room changes or unmounts
    return () => { 
      if (activeChannel) supabase.removeChannel(activeChannel); 
    };
  }, [roomId]);

  // 3. Post Message through real-time channel insert row
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    const { error } = await supabase.from('chat_messages').insert([{
      club_id: roomId,
      content: newMessage
    }]);

    if (!error) {
      setNewMessage('');
    } else {
      console.error("Transmission blocked:", error.message);
    }
  };

  return (
    <div className="flex flex-col h-[500px] border border-slate-200 rounded-2xl bg-white/70 backdrop-blur-md overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-200/60 font-bold bg-slate-50 text-slate-800">
        #{roomId.replace('club-', '')} Lounge Chat
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white/40">
        {messages.map((m, i) => (
          <div key={m.id || i} className="text-sm p-3 bg-white border border-slate-100 rounded-xl w-fit max-w-[85%] shadow-xs">
            <p className="text-slate-800 leading-relaxed">{m.content}</p>
          </div>
        ))}
      </div>
      
      <div className="p-3 border-t border-slate-200/60 flex gap-2 bg-slate-50/50">
        <Textarea 
          value={newMessage} 
          onChange={(e) => setNewMessage(e.target.value)}
          className="text-xs bg-white rounded-xl resize-none"
          placeholder="Type a group broadcast..."
          rows={1}
        />
        <Button onClick={sendMessage} className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-4 cursor-pointer self-end">
          Send
        </Button>
      </div>
    </div>
  );
}