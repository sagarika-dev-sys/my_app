"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

// TARGET DATABASE SEED ALIGNMENT
const INITIAL_COMPLAINTS = [
  { 
    id: "018b31f2-1a42-7cf2-8bf1-001122334455", 
    subject: "Water cooler breakdown in Hostel H", 
    category: "Hostel Maintenance", 
    status: "open", 
    statusColor: "bg-emerald-100 text-emerald-800 border-emerald-200", 
    is_anonymous: false, 
    date: "2026-06-25" 
  }
];

export default function ComplaintsPortal() {
  const [complaints, setComplaints] = useState(INITIAL_COMPLAINTS);
  
  // FORM VARIABLES MATCHING POSTGRES SCHEMA FIELDS COHERENTLY
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Hostel Maintenance');
  const [description, setDescription] = useState('');
  const [is_anonymous, setIsAnonymous] = useState(false);

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    // TARGET DATA REQUEST OBJECT READY FOR DATABASE STORAGE
    const complaintPayload = {
      category: category,
      subject: subject,
      description: description,
      is_anonymous: is_anonymous
    };

    console.log("Transmission vector loaded! Ready to push to backend matrix:", complaintPayload);

    setComplaints([
      { 
        id: crypto.randomUUID(), 
        subject, 
        category, 
        status: "open", 
        statusColor: "bg-emerald-100 text-emerald-800 border-emerald-200", 
        is_anonymous, 
        date: new Date().toISOString().split('T')[0] 
      }, 
      ...complaints
    ]);
    
    setSubject(''); 
    setDescription(''); 
    setIsAnonymous(false);
  };

  return (
    <div className="min-h-screen p-6 md:p-10 bg-transparent relative">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        <div className="lg:col-span-5 border-b border-slate-200 pb-4">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Grievance Deck</h1>
          <p className="text-sm text-slate-500">Lodge official campus complaints and track status parameters in real-time.</p>
        </div>

        <div className="lg:col-span-3">
          <Card className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-md p-1">
            <CardHeader><CardTitle className="text-lg font-bold text-slate-800">File New Grievance</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitComplaint} className="space-y-4">
                
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Complaint Vector Subject</label>
                  <Input 
                    placeholder="Briefly summarize the issue (e.g., Wi-Fi connectivity)..." 
                    value={subject} 
                    onChange={(e) => setSubject(e.target.value)} 
                    className="bg-white/80 border-slate-200 text-slate-900 rounded-xl" 
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Node Category Selector</label>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)} 
                    className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 h-10 cursor-pointer"
                  >
                    <option value="Hostel Maintenance">Facilities & Hostel Operations</option>
                    <option value="Infrastructure">Core Campus Infrastructure</option>
                    <option value="Academics">Academic & Department Networks</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Diagnostic Context</label>
                  <Textarea 
                    placeholder="Provide full description parameters for the database query layer..." 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    className="bg-white/80 border-slate-200 text-slate-900 rounded-xl min-h-[100px]" 
                    required 
                  />
                </div>

                <div className="flex items-center space-x-3 bg-white/40 p-3 rounded-xl border border-slate-200/40">
                  <input 
                    type="checkbox" 
                    id="is_anonymous" 
                    checked={is_anonymous} 
                    onChange={(e) => setIsAnonymous(e.target.checked)} 
                    className="h-4 w-4 rounded text-slate-900 focus:ring-slate-500 cursor-pointer" 
                  />
                  <label htmlFor="is_anonymous" className="text-sm font-medium text-slate-700 cursor-pointer">Enforce Stealth Routine (Anonymous Submission)</label>
                </div>

                <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-11 rounded-xl cursor-pointer">
                  Transmit Ticket Data
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 px-1">Live Tracking Log</h2>
          <div className="space-y-3">
            {complaints.map((item) => (
              <Card key={item.id} className="bg-white/70 backdrop-blur-md border border-white/40 rounded-xl shadow-sm">
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                  <span className="text-xs font-mono font-bold text-slate-400 truncate max-w-[120px]">{item.id}</span>
                  <Badge className="text-xs px-2 py-0.5 border bg-emerald-100 text-emerald-800 border-emerald-200">{item.status}</Badge>
                </CardHeader>
                <CardContent className="p-4 pt-1 pb-3">
                  <h3 className="text-sm font-bold text-slate-800 leading-snug">{item.subject}</h3>
                  <div className="text-[11px] text-slate-400 mt-1">{item.category}</div>
                </CardContent>
                <CardFooter className="p-3 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400 bg-slate-50/20 rounded-b-xl">
                  <span>{item.is_anonymous ? "🔒 Stealth Encrypted" : "👤 Direct Link Verified"}</span>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}