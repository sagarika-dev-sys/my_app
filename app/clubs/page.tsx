import React from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/config";

export default async function ClubsPage() {
  let clubs = [];
  let events = [];

  // Parallel fetch strategy hitting your unified Python engine backend
  try {
    const [clubsRes, eventsRes] = await Promise.all([
      fetch(`${API_BASE_URL}/clubs`, { cache: 'no-store' }),
      fetch(`${API_BASE_URL}/events`, { cache: 'no-store' })
    ]);

    if (clubsRes.ok) clubs = await clubsRes.json();
    if (eventsRes.ok) events = await eventsRes.json();
  } catch (error) {
    console.error("Local engine data synchronization breakdown:", error);
    // Secure hardcoded backup layer so your dashboard view never crashes
    clubs = [
      { id: "club-turing", full_name: "Computer Science Society", category: "Technical", tagline: "Building core developmental pipelines and tracking algorithmic events." },
      { id: "club-physics", full_name: "Physics Core Research Wing", category: "Research", tagline: "The epicenter of structural crystallography, solid-state models, and campus research." }
    ];
  }

  return (
    <div className="min-h-screen bg-transparent text-[#111827] px-8 py-10 font-sans">
      
      {/* Upper Hub Header Banner */}
      <div className="max-w-6xl mx-auto mb-8 border-b border-gray-200/60 pb-5">
        <h1 className="text-3xl font-bold tracking-tight text-[#0f172a]">
          Campus Societies & Clubs
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Explore active student-run organizations, view their targeted live timelines, and enter chats.
        </p>
      </div>

      {/* Grid Layout Canvas */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {clubs.map((club) => {
          // Filter events matching this club's structural ID
          const clubEvents = events.filter((evt) => evt.club_id === club.id);
          
          const displayCategory = club.category || "Official Club";
          const displayTagline = club.tagline || "Official student organization.";

          return (
            <div key={club.id} className="bg-white/70 backdrop-blur-md border border-gray-200 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all flex flex-col justify-between">
              
              {/* Content Card Body */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[11px] font-bold tracking-wider uppercase text-indigo-600 bg-indigo-50 border border-indigo-100/60 px-2 py-0.5 rounded-md">
                    {displayCategory}
                  </span>
                  
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    clubEvents.length > 0 
                      ? "bg-amber-50 text-amber-700 border border-amber-200" 
                      : "bg-slate-50 text-slate-400 border border-slate-200/60"
                  }`}>
                    {clubEvents.length} Active {clubEvents.length === 1 ? "Event" : "Events"}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-2">
                  {club.full_name}
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed mb-6">{displayTagline}</p>

                {/* Scheduled Actions Feed Stack */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Scheduled Actions</h3>
                  
                  {clubEvents.length === 0 ? (
                    <p className="text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl p-3 text-center bg-white/40">
                      No events currently scheduled.
                    </p>
                  ) : (
                    clubEvents.map((event) => {
                      // Extract day parameters cleanly from ISO string split layers
                      const eventDayStr = event.start_time ? event.start_time.split("T")[0].split("-")[2] : "26";
                      const eventMonthStr = event.start_time ? String(parseInt(event.start_time.split("T")[0].split("-")[1], 10) - 1) : "5";
                      const eventYearStr = event.start_time ? event.start_time.split("T")[0].split("-")[0] : "2026";
                      
                      return (
                        <div key={event.id} className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
                          <h4 className="text-xs font-bold text-slate-900">{event.title}</h4>
                          <div className="flex gap-2 mt-3">
                            <Link 
                              href={`/events?day=${eventDayStr}&month=${eventMonthStr}&year=${eventYearStr}`} 
                              className="flex-1 text-center bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 text-[10px] font-bold py-1.5 rounded-lg block transition-colors"
                            >
                              View Date
                            </Link>
                            <Link 
                              href={`/chat/${club.id}`} 
                              className="flex-1 text-center bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold py-1.5 rounded-lg block shadow-sm transition-colors"
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

              {/* Action Footer Button Bar Section */}
              <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 grid grid-cols-2 gap-3">
                <Link 
                  href={`/events`} 
                  className="text-center bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition-all"
                >
                  Jump to Calendar
                </Link>
                
                <Link 
                  href={`/chat/${club.id}`} 
                  className="text-center bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl shadow-md transition-all"
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