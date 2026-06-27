import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Campus Buzz",
  description: "Next-Generation Campus Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-slate-100 text-slate-900 font-sans min-h-full flex flex-col relative overflow-x-hidden">
        
        {/* 1. THE CAMPUS BACKGROUND IMAGE (Vibrant, high visibility) */}
        <div 
          className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none z-0 opacity-30 scale-100"
          style={{ backgroundImage: "url('/clg.png')" }} 
        />

        {/* 2. PROTECTIVE TINT OVERLAY */}
        <div className="fixed inset-0 bg-gradient-to-tr from-slate-100/80 via-slate-50/40 to-white/70 pointer-events-none z-0" />

        {/* ======================================================== */}
        {/* 🚀 HORIZONTAL TOP NAVBAR LAYOUT */}
        {/* ======================================================== */}
        <nav className="w-full h-20 bg-gray-950 border-b border-gray-800 sticky top-0 z-50 px-6 flex items-center justify-between shadow-md">
          
          {/* LEFT BLOCK: LOGO ANCHOR */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <Image 
              src="/logo.jpeg" 
              alt="CampusBuzz Logo" 
              width={54} 
              height={54} 
              className="object-contain rounded-full"
              priority
            />
          </Link>

          {/* CENTER BLOCK: NAVIGATION LINKS RUNWAY */}
          <div className="flex items-center gap-8 font-semibold text-gray-300">
            <Link href="/events" className="hover:text-orange-500 transition-colors duration-200">
              Events
            </Link>
            <Link href="/feed" className="hover:text-orange-500 transition-colors duration-200">
              Feed
            </Link>
            <Link href="/clubs" className="hover:text-orange-500 transition-colors duration-200">
              Clubs
            </Link>
            <Link href="/complaints" className="hover:text-orange-500 transition-colors duration-200">
              Grievance
            </Link>
          </div>

          {/* RIGHT BLOCK: PROFILE SIGN IN & STATUS INDICATOR */}
          <div className="flex items-center gap-4">
            {/* Sandbox Online Status badge shifted to the top bar layout nicely */}
            <div className="hidden sm:flex bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-xl items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sandbox Online</span>
            </div>

            <Link 
              href="/login" 
              className="flex items-center gap-2 px-5 py-2 border border-gray-700 bg-gray-900 text-gray-200 rounded-full hover:bg-gray-800 font-medium text-sm shadow-sm transition-all duration-200 hover:border-orange-500"
            >
              <span>Sign In</span>
              <span className="text-base text-orange-500">👤</span>
            </Link>
          </div>

        </nav>
        {/* ======================================================== */}

        {/* CONTAINER ROUTING FRAME FOR PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto relative z-10 w-full max-w-7xl mx-auto p-6">
          {children}
        </main>

      </body>
    </html>
  );
}