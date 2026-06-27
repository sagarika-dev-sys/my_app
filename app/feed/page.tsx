"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { API_BASE_URL } from "@/lib/config"; // Imports your live config file cleanly

export default function CampusFeed() {
  const [posts, setPosts] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchFeeds = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/feeds`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error("Feed link failure:", error);
    }
  };

  useEffect(() => {
    fetchFeeds();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    const activeStudentId = "018b31a8-9d21-729d-9c44-b0a1a5b82201";

    const feedPayload = {
      student_id: activeStudentId,
      content: content,
      media_url: null
    };

    try {
      const response = await fetch(`${API_BASE_URL}/feeds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedPayload)
      });

      if (response.ok) {
        setContent('');
        fetchFeeds();
      }
    } catch (error) {
      console.error("Post transmission error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-10 bg-transparent relative">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center border-b border-slate-200/60 pb-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Campus Feed</h1>
            <p className="text-sm text-slate-500">Live system sync across student updates.</p>
          </div>
          <Badge className="bg-slate-900 text-white px-3 py-1 text-xs">Live Stream</Badge>
        </div>

        <Card className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-md">
          <CardHeader className="pb-3"><CardTitle className="text-lg font-bold text-slate-800">Broadcast an Update</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <Textarea 
                placeholder="Share your milestones..." 
                value={content} 
                onChange={(e) => setContent(e.target.value)} // FIXED TYPO: changed from content to e
                className="bg-white/80 border-slate-200 text-slate-900 rounded-xl min-h-[90px]" 
                required 
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={loading} className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer">
                  {loading ? "Publishing..." : "Publish Post"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {posts.map((post: any, index) => (
            <Card key={post.id || index} className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm">
              <CardHeader className="p-5 pb-2">
                <CardTitle className="text-sm font-bold text-slate-900">Student Entry ({post.roll_number || "Verified Asset"})</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-4">
                <p className="text-sm text-slate-700 leading-relaxed">{post.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}