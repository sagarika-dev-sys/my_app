"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Routing Student Auth Payload...", { email, password });
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Routing Admin Auth Payload...", { email: adminEmail, password: adminPassword });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent p-4">
      <div className="w-full max-w-md relative">
        <Card className="w-full bg-white/70 backdrop-blur-md shadow-xl border border-white/40 rounded-2xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-extrabold tracking-tight text-slate-900">Campus Buzz</CardTitle>
            <CardDescription className="text-slate-500">Get connected with your campus community</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="student" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-200/50 p-1 rounded-xl border border-slate-200/30">
                <TabsTrigger value="student" className="rounded-lg py-2 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">Student Portal</TabsTrigger>
                <TabsTrigger value="admin" className="rounded-lg py-2 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">Club / Admin</TabsTrigger>
              </TabsList>

              {/* STUDENT LOGIN FORM */}
              <TabsContent value="student">
                <form onSubmit={handleStudentLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Institute Email Address</label>
                    <Input 
                      type="email" 
                      placeholder="you@university.edu" 
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
                  
                  <Button type="submit" className="w-full mt-4 h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer">
                    Sign In
                  </Button>
                </form>

                <div className="mt-4 text-center text-xs text-slate-500">
                  First time visiting?{" "}
                  <button 
                    onClick={() => alert("Redirecting to registration portal stream...")}
                    className="text-slate-900 font-bold hover:underline bg-transparent border-none p-0 cursor-pointer"
                  >
                    Create Account / Sign Up
                  </button>
                </div>
              </TabsContent>

              {/* CLUB / ADMIN LOGIN FORM */}
              <TabsContent value="admin">
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Official Club Email</label>
                    <Input 
                      type="email" 
                      placeholder="clubname@university.edu" 
                      value={adminEmail} 
                      onChange={(e) => setAdminEmail(e.target.value)} 
                      className="bg-white/80 border-slate-200 text-slate-900 rounded-xl" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Password</label>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      value={adminPassword} 
                      onChange={(e) => setAdminPassword(e.target.value)} 
                      className="bg-white/80 border-slate-200 text-slate-900 rounded-xl" 
                      required 
                    />
                  </div>
                  <Button type="submit" className="w-full mt-4 h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer">
                    Admin Dashboard Log In
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="justify-center border-t border-slate-200/50 pt-4 text-[11px] text-slate-400">
            Secure token-based authorization enforced.
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}