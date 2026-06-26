"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rollNo, setRollNo] = useState('');

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent p-4">
      <Card className="w-full max-w-md bg-white/70 backdrop-blur-md shadow-xl border border-white/40 rounded-2xl">
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

            <TabsContent value="student">
              <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">University Roll Number</label>
                  <Input type="text" placeholder="e.g., 2026CSE1042" value={rollNo} onChange={(e) => setRollNo(e.target.value)} className="bg-white/80 border-slate-200 text-slate-900 rounded-xl" required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Institute Email Address</label>
                  <Input type="email" placeholder="you@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white/80 border-slate-200 text-slate-900 rounded-xl" required />
                </div>
                <Button type="submit" className="w-full mt-4 h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer">Enter Campus Feed</Button>
              </form>
            </TabsContent>

            <TabsContent value="admin">
              <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Official Club Email</label>
                  <Input type="email" placeholder="clubname@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white/80 border-slate-200 text-slate-900 rounded-xl" required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Password</label>
                  <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/80 border-slate-200 text-slate-900 rounded-xl" required />
                </div>
                <Button type="submit" className="w-full mt-4 h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer">Admin Dashboard Log In</Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="justify-center border-t border-slate-200/50 pt-4 text-[11px] text-slate-400">Secure roll-number verification enforced.</CardFooter>
      </Card>
    </div>
  );
}