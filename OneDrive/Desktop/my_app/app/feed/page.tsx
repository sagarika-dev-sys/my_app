"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

const INITIAL_POSTS = [
  { id: 1, author: "Google Developer Student Club (GDSC)", role: "Club Admin", content: "🚀 Get ready for the upcoming 24-Hour Hackfest! Registrations open tonight at 8 PM. Prepare your teams and ideas. Great prizes await!", tag: "Event", upvotes: 42, timestamp: "2 hours ago" },
  { id: 2, author: "Cultural Committee", role: "Club Admin", content: "Auditions for the dynamic campus rock band 'The Echoes' start this Friday at the main auditorium. Bring your own instruments!", tag: "Notice", upvotes: 19, timestamp: "5 hours ago" }
];

export default function CampusFeed() {
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [newPost, setNewPost] = useState('');
  const [selectedTag, setSelectedTag] = useState('General');

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    setPosts([{ id: posts.length + 1, author: "Anonymous Student", role: "Student", content: newPost, tag: selectedTag, upvotes: 0, timestamp: "Just now" }, ...posts]);
    setNewPost('');
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
              <Textarea placeholder="What's buzzing on campus today?..." value={newPost} onChange={(e) => setNewPost(e.target.value)} className="bg-white/80 border-slate-200 text-slate-900 rounded-xl min-h-[90px]" required />
              <div className="flex justify-between items-center gap-3 flex-wrap">
                <div className="flex gap-2">
                  {['General', 'Event', 'Notice', 'Lost & Found'].map((tag) => (
                    <button key={tag} type="button" onClick={() => setSelectedTag(tag)} className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${selectedTag === tag ? 'bg-slate-900 text-white border-slate-900' : 'bg-white/60 text-slate-600 border-slate-200 hover:bg-white'}`}>{tag}</button>
                  ))}
                </div>
                <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer">Publish Post</Button>
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
                <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 border-slate-200 text-slate-700 bg-white/40">{post.tag}</Badge>
              </CardHeader>
              <CardContent className="px-5 pb-4"><p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{post.content}</p></CardContent>
              <CardFooter className="border-t border-slate-100 p-3 px-5 flex justify-between items-center text-xs bg-slate-50/30 rounded-b-2xl">
                <Button variant="ghost" size="sm" onClick={() => setPosts(posts.map(p => p.id === post.id ? { ...p, upvotes: p.upvotes + 1 } : p))} className="text-slate-600 hover:text-slate-900 font-bold text-xs rounded-lg cursor-pointer">▲ Upvote ({post.upvotes})</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}