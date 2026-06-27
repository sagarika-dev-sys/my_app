"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";

// Helper to map hashtag strings to your database room IDs
// Note: Ensure these room IDs match the IDs in your chat_rooms table
const getRoomId = (post: any) => {
  // A. Check for hashtags
  const content = post.content.toLowerCase();
  if (content.includes("#ordersplit")) return "room-ordersplit";
  if (content.includes("#cabsplit")) return "room-cabsplit";
  if (content.includes("#resell")) return "room-resell";

  // B. Check for Club-specific chat rooms
  // If your database 'posts' table has a 'club_id' column, use it!
  if (post.club_id) return `room-club-${post.club_id}`;

  return null;
};

export default function CampusFeed() {
  const [posts, setPosts] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  const fetchData = async () => {
    // 1. Get Auth session
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);

    // 2. Fetch Posts using Supabase
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setPosts(data || []);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;

    setLoading(true);
    const { error } = await supabase
      .from('posts')
      .insert([{ student_id: user.id, content: content }]);

    if (!error) {
      setContent('');
      fetchData();
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      
      {/* 1. Conditional Publish Form */}
      {user ? (
        <Card className="bg-white/90 rounded-2xl shadow-sm border border-slate-100">
          <CardHeader>
            <CardTitle className="text-lg">Publish Update</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <Textarea 
                placeholder="Use #ordersplit, #cabsplit, or #resell to auto-create a discussion room." 
                value={content} 
                onChange={(e) => setContent(e.target.value)}
                className="bg-white border-slate-200 rounded-xl min-h-[90px]" 
                required 
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={loading} className="bg-slate-900 text-white text-xs px-5 py-2.5 rounded-xl">
                  {loading ? "Publishing..." : "Publish Post"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center p-6 border border-dashed rounded-2xl text-slate-400 text-sm">
          Please log in to share updates and join discussions.
        </div>
      )}

      {/* 2. Feed Rendering with Empty State */}
      <div className="space-y-4">
        {posts.length > 0 ? (
          posts.map((post: any) => {
            const roomId = getRoomId(post);
            if (!roomId) return null;

            const label = roomId.startsWith('room-club-') ? "Visit Club Chat" : `Join ${roomId.replace('room-', '#')} Discussion`;

            return (
              <Button 
                variant="outline"
                onClick={() => window.location.href = `/chat/${roomId}`}
                className="w-full text-indigo-700 border-indigo-200 hover:bg-indigo-50 text-[10px] font-bold py-1.5 rounded-lg"
              >
                {label}
              </Button>
            );
          })
        ) : (
          <div className="text-center py-10 text-slate-400">
            No posts found. Be the first to share something!
          </div>
        )}
      </div>
    </div>
  );
}