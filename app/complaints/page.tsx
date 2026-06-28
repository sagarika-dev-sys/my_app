"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

// Fallback directly to localhost if env isn't registering yet
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export default function ComplaintsPortal() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Hostel Maintenance');
  const [description, setDescription] = useState('');
  const [is_anonymous, setIsAnonymous] = useState(false);

  const fetchComplaints = async () => {
    try {
      // Updated to use the secure BASE_URL variable
      const response = await fetch(`${BASE_URL}/complaints`);
      if (response.ok) {
        const data = await response.json();
        setComplaints(data);
      }
    } catch (error) {
      console.error("Complaint retrieval stream broken:", error);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    const activeStudentId = "018b31a8-9d21-729d-9c44-b0a1a5b82201";

    const complaintPayload = {
      student_id: activeStudentId,
      category: category,
      subject: subject,
      description: description,
      is_anonymous: is_anonymous
    };

    try {
      // Updated to use the secure BASE_URL variable
      const response = await fetch(`${BASE_URL}/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(complaintPayload),
      });

      if (response.ok) {
        setSubject(''); 
        setDescription(''); 
        setIsAnonymous(false);
        alert("Grievance ticket submitted successfully!");
        fetchComplaints();
      }
    } catch (error) {
      console.error("Data tracking error:", error);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-10 bg-transparent relative">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-5 border-b border-slate-200 pb-4">
          <h1 className="text-3xl font-extrabold text-slate-900">Grievance Deck</h1>
        </div>

        <div className="lg:col-span-3">
          <Card className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-md p-1">
            <CardHeader><CardTitle className="text-lg font-bold text-slate-800">File New Ticket</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitComplaint} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-600">Subject</label>
                  <Input placeholder="Summary..." value={subject} onChange={(e) => setSubject(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-600">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm h-10">
                    <option value="Hostel Maintenance">Facilities & Hostel Operations</option>
                    <option value="Infrastructure">Core Campus Infrastructure</option>
                    <option value="Academics">Academic Networks</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-600">Description</label>
                  <Textarea placeholder="Details..." value={description} onChange={(e) => setDescription(e.target.value)} required />
                </div>
                <div className="flex items-center space-x-3 bg-white/40 p-3 rounded-xl border">
                  <input type="checkbox" id="is_anonymous" checked={is_anonymous} onChange={(e) => setIsAnonymous(e.target.checked)} />
                  <label htmlFor="is_anonymous" className="text-sm font-medium text-slate-700">Anonymous Submission</label>
                </div>
                <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-11 rounded-xl">
                  Transmit Ticket Data
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Live Tracking Log</h2>
          <div className="space-y-3">
            {complaints && complaints.map((item: any, index) => (
              <Card key={item.id || index} className="bg-white/70 backdrop-blur-md border border-white/40 rounded-xl shadow-sm">
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                  <Badge className="text-xs bg-emerald-100 text-emerald-800 border-emerald-200">{item.status || "open"}</Badge>
                </CardHeader>
                <CardContent className="p-4 pt-1 pb-3">
                  <h3 className="text-sm font-bold text-slate-800">{item.subject}</h3>
                  <div className="text-[11px] text-slate-400 mt-1">{item.category}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}