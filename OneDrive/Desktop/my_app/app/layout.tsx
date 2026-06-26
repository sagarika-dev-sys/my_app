import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
      <body className="bg-slate-100 text-slate-900 font-sans min-h-full flex flex-col md:flex-row relative overflow-x-hidden">
        
        {/* 1. THE CAMPUS BACKGROUND IMAGE (Vibrant, high visibility) */}
        <div 
          className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none z-0 opacity-40 scale-100"
          style={{ backgroundImage: "url('/clg.png')" }} 
        />

        {/* 2. PROTECTIVE TINT OVERLAY */}
        <div className="fixed inset-0 bg-gradient-to-tr from-slate-100/80 via-slate-50/40 to-white/70 pointer-events-none z-0" />

        {/* ======================================================== */}
        {/* INTERFACE STRUCTURAL FRAMEWORK */}
        {/* ======================================================== */}
        
        {/* GLASSMORPHIC SIDEBAR */}
        <aside className="w-full md:w-64 bg-white/60 backdrop-blur-xl border-b md:border-b-0 md:border-r border-slate-200/60 p-6 flex flex-col justify-between md:sticky md:top-0 md:h-screen z-50 shrink-0 shadow-sm">
          <div className="space-y-8">
            <div className="flex items-center space-x-3 group">
              <div className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <span className="text-white font-black text-lg">Ω</span>
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">CampusBuzz</h1>
                <span className="text-[10px] text-slate-500 tracking-widest font-bold uppercase">v2.0 Active</span>
              </div>
            </div>

            <nav className="space-y-1">
              {[
                { name: 'Sign In Portal', path: '/login', icon: '👤' },
                { name: 'Live Campus Feed', path: '/feed', icon: '🔥' },
                { name: 'Grievance Deck', path: '/complaints', icon: '⚖️' },
              ].map((item) => (
                <a
                  key={item.name}
                  href={item.path}
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/80 border border-transparent hover:border-slate-200/50 transition-all group"
                >
                  <span className="text-base group-hover:scale-110 transition-transform">{item.icon}</span>
                  <span>{item.name}</span>
                </a>
              ))}
            </nav>
          </div>

          <div className="hidden md:block pt-4 border-t border-slate-200/60">
            <div className="bg-white/40 border border-slate-200/60 p-3 rounded-xl text-center">
              <span className="text-[11px] text-slate-400 font-medium block">Team Workspace</span>
              <span className="text-xs font-bold text-emerald-600 flex items-center justify-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Sandbox Online
              </span>
            </div>
          </div>
        </aside>

        {/* CONTAINER ROUTING FRAME */}
        <main className="flex-1 overflow-y-auto relative z-10 w-full">
          {children}
        </main>

      </body>
    </html>
  );
}