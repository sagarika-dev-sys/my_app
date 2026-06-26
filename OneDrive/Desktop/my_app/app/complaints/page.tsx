"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const INITIAL_COMPLAINTS = [
  { id: "CMP-4012", title: "Main Library Wi-Fi disconnected frequently", category: "Infrastructure", status: "In Progress", statusColor: "bg-amber-100 text-amber-800 border-amber-200", isAnonymous: false, date: "2026-06-24" },
  { id: "CMP-3981", title: "Water cooler on Hostel Block B 3rd floor not cooling", category: "Facilities", status: "Pending", statusColor: "bg-rose-100 text-rose-800 border-rose-200", isAnonymous: true, date: "2026-06-25" }
];

export default function ComplaintsPortal() {
  const [complaints, setComplaints] = useState(INITIAL_COMPLAINTS);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Facilities');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const handleSubmitComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    
    setComplaints([
      { 
        id: `CMP-${Math.floor(1000 + Math.random() * 9000)}`, 
        title, 
        category, 
        status: "Pending", 
        statusColor: "bg-rose-100 text-rose-800 border-rose-200", 
        isAnonymous, 
        date: "Just now" 
      }, 
      ...complaints
    ]);
    
    setTitle(''); 
    setDescription(''); 
    setIsAnonymous(false);
  };

  return (
    <div className="min-h-screen p-6 md:p-10 bg-transparent relative">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* HEADER SECTION */}
        <div className="lg:col-span-5 border-b border-slate-200 pb-4">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Grievance Deck</h1>
          <p className="text-sm text-slate-500">Lodge official campus complaints and track status parameters in real-time.</p>
        </div>

        {/* COMPLAINT FORM */}
        <div className="lg:col-span-3">
          <Card className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-md p-1">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-800">File New Grievance</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitComplaint} className="space-y-4">
                
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Complaint Title</label>
                  <Input 
                    placeholder="Briefly summarize the issue..." 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    className="bg-white/80 border-slate-200 text-slate-900 rounded-xl" 
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Category</label>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)} 
                    className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 h-10 cursor-pointer"
                  >
                    <option value="Facilities">Facilities & Hostel</option>
                    <option value="Infrastructure">Campus Infrastructure</option>
                    <option value="Academics">Academic & Departmental</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Detailed Description</label>
                  <Textarea 
                    placeholder="Describe the issue..." 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    className="bg-white/80 border-slate-200 text-slate-900 rounded-xl min-h-[100px]" 
                    required 
                  />
                </div>

                <div className="flex items-center space-x-3 bg-white/40 p-3 rounded-xl border border-slate-200/40">
                  <input 
                    type="checkbox" 
                    id="anonymous" 
                    checked={isAnonymous} 
                    onChange={(e) => setIsAnonymous(e.target.checked)} 
                    className="h-4 w-4 rounded text-slate-900 focus:ring-slate-500 cursor-pointer" 
                  />
                  <label htmlFor="anonymous" className="text-sm font-medium text-slate-700 cursor-pointer">Submit Anonymously</label>
                </div>

                <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-11 rounded-xl cursor-pointer">
                  Submit Official Complaint
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* TRACKING TIMELINE LOG */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 px-1">Live Tracking Log</h2>
          <div className="space-y-3">
            {complaints.map((item) => (
              <Card key={item.id} className="bg-white/70 backdrop-blur-md border border-white/40 rounded-xl shadow-sm">
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                  <span className="text-xs font-mono font-bold text-slate-400">{item.id}</span>
                  <Badge className={`text-xs px-2 py-0.5 border ${item.statusColor}`}>{item.status}</Badge>
                </CardHeader>
                <CardContent className="p-4 pt-1 pb-3">
                  <h3 className="text-sm font-bold text-slate-800 leading-snug">{item.title}</h3>
                </CardContent>
                <CardFooter className="p-3 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400 bg-slate-50/20 rounded-b-xl">
                  <span>{item.isAnonymous ? "🔒 Anonymous" : "👤 Student User"}</span>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}