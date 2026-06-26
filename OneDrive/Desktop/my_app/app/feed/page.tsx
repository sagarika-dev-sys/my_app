"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

// DATABASE INITIAL SEEDS SYNC
const SEED_POSTS = [
  { id: "018b31c2-cbb3-789a-bf71-ef671239ab01", author: "Aarav Sharma", role: "Student", content: "Cracked the summer internship interview process! Super excited for what is next! #placement #coding", upvotes: 42, timestamp: "2 hours ago" },
  { id: "018b31c2-cbb3-789a-bf71-ef671239ab02", author: "Ananya Verma", role: "Student", content: "Does anyone know if the central library stays open past 8 PM during end-sem exams? #help", upvotes: 19, timestamp: "5 hours ago" }
];

export default function CampusFeed() {
  const [posts, setPosts] = useState(SEED_POSTS);
  const [content, setContent] = useState('');

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    // TARGET DATA INTERCEPT ENGINE
    const postPayload = { content: content };
    console.log("Packaging post vector for database injection:", postPayload);

    setPosts([
      { 
        id: crypto.randomUUID(), 
        author: "Current User", 
        role: "Student", 
        content: content, 
        upvotes: 0, 
        timestamp: "Just now" 
      }, 
      ...posts
    ]);
    setContent('');
  };

  return (
    <div className="min-h-screen p-6 md:p-10 bg-transparent relative">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center border-b border-slate-200/60 pb-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Campus Feed</h1>
            <p className="text-sm text-slate-500">Stay synchronized with announcements and community buzz.</p>
          </div>
          <Badge className="bg-slate-900 text-white px-3 py-1 text-xs">Live Stream</Badge>
        </div>

        <Card className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-md">
          <CardHeader className="pb-3"><CardTitle className="text-lg font-bold text-slate-800">Broadcast an Update</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <Textarea 
                placeholder="What's buzzing on campus today? (Include #tags)..." 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                className="bg-white/80 border-slate-200 text-slate-900 rounded-xl min-h-[90px]" 
                required 
              />
              <div className="flex justify-end">
                <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer">
                  Publish Post
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 p-5">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900">{post.author}</CardTitle>
                  <span className="text-[11px] font-medium text-slate-400">{post.role} • {post.timestamp}</span>
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-4">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
              </CardContent>
              <CardFooter className="border-t border-slate-100 p-3 px-5 flex justify-between items-center text-xs bg-slate-50/30 rounded-b-2xl">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setPosts(posts.map(p => p.id === post.id ? { ...p, upvotes: p.upvotes + 1 } : p))} 
                  className="text-slate-600 hover:text-slate-900 font-bold text-xs rounded-lg cursor-pointer"
                >
                  ▲ Upvote ({post.upvotes})
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}