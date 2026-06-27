import React from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default async function ClubsPage() {
  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

  // 1. Fetch live club profiles from the profiles table based on the ENUM role
  const { data: dbClubs } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role")
    .eq("role", "club");

  // 2. Fetch live events from your event console table
  const { data: dbEvents } = await supabase
    .from("events")
    .select("id, title, description, venue, date, club_id")
    .order("date", { ascending: true });

  // 3. Presentation Fallbacks aligned with schema data models
  const fallbackClubs = [
    { 
      id: "018b31a8-9d21-729d-9c44-b0a1a5b82202", // Explicit mock UUID format matching seed profiles
      full_name: "Computer Science Society", 
      avatar_url: null,
      tagline: "Building core developmental pipelines and tracking algorithmic events.", 
      category: "Technical" 
    },
    { 
      id: "018b31a8-9d21-729d-9c44-b0a1a5b82203", 
      full_name: "Music & Drama Club", 
      avatar_url: null,
      tagline: "The heartbeat of campus culture, expressions, and major main-stage events.", 
      category: "Cultural" 
    }
  ];

  const fallbackEvents = [
    { id: "evt-101", club_id: "018b31a8-9d21-729d-9c44-b0a1a5b82202", title: "HackFest 2026 Briefing Session", date: "2026-06-28", venue: "Main Audi Hall 2" },
    { id: "evt-103", club_id: "018b31a8-9d21-729d-9c44-b0a1a5b82202", title: "DSA Speedrun Challenge", date: "2026-06-30", venue: "Lab 3" },
    { id: "evt-102", club_id: "018b31a8-9d21-729d-9c44-b0a1a5b82203", title: "Cultural Fest Auditions", date: "2026-07-02", venue: "OAT" }
  ];

  const clubs = (dbClubs && dbClubs.length > 0) ? dbClubs : fallbackClubs;
  const events = (dbEvents && dbEvents.length > 0) ? dbEvents : fallbackEvents;

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#111827] px-8 py-10 font-sans">
      
      {/* Upper Hub Header */}
      <div className="max-w-6xl mx-auto mb-8 border-b border-gray-100 pb-5">
        <h1 className="text-3xl font-bold tracking-tight text-[#0f172a]">
          Campus Societies & Clubs
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Explore active student-run organizations, view their targeted live timelines, and enter chats.
        </p>
      </div>

      {/* Grid Canvas */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {clubs.map((club) => {
          // RELATION PIPELINE: Filters events matching this club's profile ID
          const clubEvents = events.filter((evt) => evt.club_id === club.id);
          
          // Safe defaults for presentation items not explicitly stored in the basic profiles schema
          const clubAny = club as any;
          const displayCategory = clubAny.category || "Official Club";
          const displayTagline = clubAny.tagline || "Official student organization.";

          return (
            <div key={club.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              
              {/* Content Body */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[11px] font-bold tracking-wider uppercase text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md">
                    {displayCategory}
                  </span>
                  
                  {/* Highlighted Event Count Badge */}
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    clubEvents.length > 0 
                      ? "bg-amber-50 text-amber-700 border border-amber-200" 
                      : "bg-gray-50 text-gray-400 border border-gray-100"
                  }`}>
                    {clubEvents.length} Active {clubEvents.length === 1 ? "Event" : "Events"}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-gray-900 tracking-tight mb-2">
                  {club.full_name} {/* Aligned with schema parameter 'full_name' */}
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">{displayTagline}</p>

                {/* HIGHLIGHTED PARTICULAR EVENTS SECTION */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Scheduled Actions</h3>
                  
                  {clubEvents.length === 0 ? (
                    <p className="text-xs text-gray-400 border border-dashed border-gray-100 rounded-xl p-3 text-center">
                      No events currently scheduled.
                    </p>
                  ) : (
                    clubEvents.map((event) => {
                      const eventDay = event.date ? event.date.split("-")[2] : "26";
                      return (
                        <div key={event.id} className="bg-indigo-50/40 border border-indigo-100/70 rounded-xl p-3">
                          <h4 className="text-xs font-bold text-indigo-950">{event.title}</h4>
                          <div className="flex gap-2 mt-3">
                            <Link 
                              href={`/events?day=${eventDay}`} 
                              className="flex-1 text-center bg-white border border-indigo-200 text-indigo-700 text-[10px] font-bold py-1.5 rounded-lg block"
                            >
                              View Date
                            </Link>
                            {/* Pass room ID down to your room view if applicable */}
                            <Link 
                              href={`/chat?roomId=${club.id}`} 
                              className="flex-1 text-center bg-[#0f172a] hover:bg-slate-800 text-white text-[10px] font-bold py-1.5 rounded-lg block"
                            >
                              Club Chat
                            </Link>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Action Footer Buttons */}
              <div className="px-6 py-4 bg-gray-50/70 border-t border-gray-100 grid grid-cols-2 gap-3">
                <Link 
                  href={clubEvents.length > 0 ? `/events?day=${parseInt(clubEvents[0].date.split("-")[2], 10)}` : `/events`} 
                  className="text-center bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold py-2.5 rounded-xl transition-all"
                >
                  Jump to Calendar
                </Link>
                
                <Link 
                  href={`/chat?roomId=${club.id}`} 
                  className="text-center bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl shadow-sm transition-all"
                >
                  Enter Live Lounge
                </Link>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}