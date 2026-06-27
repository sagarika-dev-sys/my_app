"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/config";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate domain before making network call
    if (!email.toLowerCase().endsWith("@nitrr.ac.in")) {
      alert("Access Denied: Only official NITRR emails (@nitrr.ac.in) are authorized.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase(), password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store session state parameters cleanly
        localStorage.setItem("token", data.access_token);
        
        // Temporarily seed Aarav's UUID from main.py if backend doesn't pass a clear ID yet
        localStorage.setItem("student_id", "018b31a8-9d21-729d-9c44-b0a1a5b82201");
        
        alert("Authentication successful! Redirecting to live feed tracker...");
        window.location.href = '/feed';
      } else {
        alert(`Authentication Failure: ${data.detail || 'Invalid Credentials'}`);
      }
    } catch (error) {
      console.error("Auth bridge disruption:", error);
      alert("Unable to establish communication link with FastAPI backend on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent p-4">
      <div className="w-full max-w-md relative">
        <Card className="w-full bg-white/70 backdrop-blur-md shadow-xl border border-white/40 rounded-2xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-extrabold tracking-tight text-slate-900">Campus Buzz</CardTitle>
            <CardDescription className="text-slate-500">NIT Raipur Student Connection Portal</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStudentLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Institute Email Address</label>
                <Input 
                  type="email" 
                  placeholder="student@nitrr.ac.in" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="bg-white/80 border-slate-200 text-slate-900 rounded-xl" 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Password</label>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="bg-white/80 border-slate-200 text-slate-900 rounded-xl" 
                  required 
                />
              </div>
              
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full mt-4 h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer disabled:bg-slate-400"
              >
                {loading ? "Verifying Matrix Credentials..." : "Sign In to Portal"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center border-t border-slate-200/50 pt-4 text-[11px] text-slate-400">
            Authorized access point restricted to NITRR domain keys.
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}