import React from "react";
import { createClient } from "@supabase/supabase-js";
import EventCalendar from "@/components/EventCalendar";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface PageProps {
  searchParams: Promise<{ day?: string; month?: string; year?: string }>;
}

export default async function EventsPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  
  // Read parameters or default to today's timestamp layout (June 26, 2026)
  const targetDay = resolvedParams.day || "26";
  const targetMonthIndex = parseInt(resolvedParams.month || "5", 10);
  const targetYear = resolvedParams.year || "2026";

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Construct standard calendar filter string format: YYYY-MM-DD
  const formattedTargetDate = `${targetYear}-${String(targetMonthIndex + 1).padStart(2, "0")}-${targetDay.padStart(2, "0")}`;

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

  // Fetch live events joining profiles to fetch the real club name
  const { data: databaseEvents } = await supabase
    .from("events")
    .select(`
      id,
      title,
      description,
      venue,
      date,
      time_start,
      club_id,
      profiles:club_id ( full_name )
    `)
    .order("date", { ascending: true });

  const localFallbackEvents = [
    {
      id: "evt-101",
      title: "HackFest 2026 Briefing Session",
      date: "2026-06-28",
      time_start: "16:30:00",
      venue: "Main Audi Hall 2",
      description: "Mandatory structural orientation and team sync-up rules for all registered internal campus hackathon participants.",
      profiles: { full_name: "Computer Science Society" }
    }
  ];

  const allEvents = (databaseEvents && databaseEvents.length > 0) ? databaseEvents : localFallbackEvents;

  // Filter events matching our computed dynamic date string
  const filteredEvents = allEvents.filter(event => event.date === formattedTargetDate);

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#111827] px-8 py-10 font-sans">
      <div className="max-w-6xl mx-auto mb-8 border-b border-gray-100 pb-5">
        <h1 className="text-3xl font-bold tracking-tight text-[#0f172a]">Campus Events Calendar</h1>
        <p className="text-sm text-gray-500 mt-1">Track official club notices, developmental workshops, and scheduled events.</p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column Feed Container */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">
            Schedules for {monthNames[targetMonthIndex]} {targetDay}, {targetYear}
          </h2>
          
          {filteredEvents.length === 0 ? (
            <div className="border border-dashed border-gray-200 rounded-2xl p-12 text-center text-sm text-gray-400 bg-white shadow-sm">
              No official events scheduled for this specific date. Use the Event Explorer to check surrounding timelines!
            </div>
          ) : (
            filteredEvents.map((event) => (
              <div key={event.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:border-gray-300 transition-all">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                      {/* Access Joined User/Club profile structure */}
                      {event.profiles && !Array.isArray(event.profiles) ? event.profiles.full_name : "Campus Club"}
                    </span>
                    <h3 className="text-base font-bold text-gray-900 mt-2">{event.title}</h3>
                    <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{event.description}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 mt-4 pt-3 border-t border-gray-50 text-xs text-gray-500 font-medium">
                  <div>📅 {event.date}</div>
                  {/* Fixed column data parameter from event.time to event.time_start */}
                  <div>⏰ {event.time_start}</div> 
                  <div>📍 {event.venue}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Sidebar Column */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm sticky top-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-1.5">📅 Event Explorer</h2>
            <div className="border border-gray-100 rounded-xl p-2 bg-white">
              <EventCalendar />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}