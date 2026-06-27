import React from "react";
import EventCalendar from "@/components/EventCalendar";
import CreateEventModal from "@/components/CreateEventModal";
import { API_BASE_URL } from "@/lib/config";

interface PageProps {
  searchParams: { day?: string; month?: string; year?: string };
}

export default async function EventsPage({ searchParams }: PageProps) {
  const targetDay = searchParams?.day || "26";
  const targetMonthIndex = parseInt(searchParams?.month || "5", 10);
  const targetYear = searchParams?.year || "2026";
  const formattedTargetDate = `${targetYear}-${String(targetMonthIndex + 1).padStart(2, "0")}-${targetDay.padStart(2, "0")}`;

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // SIMULATED AUTH LAYER: Set role to "club" so you can test creating events instantly!
  const currentUserRole = "club"; 
  const currentUserId = "sandbox-club-id";

  let allEvents = [];

  try {
    const response = await fetch(`${API_BASE_URL}/events`, { cache: 'no-store' });
    if (response.ok) {
      allEvents = await response.json();
    }
  } catch (error) {
    console.error("Local backend events stream offline:", error);
  }

  // Filter events matching our computed dynamic date string
  const filteredEvents = allEvents.filter(event => {
    if (!event.start_time) return false;
    const eventDateStr = event.start_time.split('T')[0];
    return eventDateStr === formattedTargetDate;
  });

  return (
    <div className="min-h-screen bg-transparent text-[#111827] px-8 py-10 font-sans">
      <div className="max-w-6xl mx-auto mb-8 border-b border-gray-200/60 pb-5 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0f172a]">Campus Events Calendar</h1>
          <p className="text-sm text-gray-500 mt-1">Track official club notices, developmental workshops, and scheduled events.</p>
        </div>
        <CreateEventModal userRole={currentUserRole} userId={currentUserId} />
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">
            Schedules for {monthNames[targetMonthIndex]} {targetDay}, {targetYear}
          </h2>
          
          {filteredEvents.length === 0 ? (
            <div className="border border-dashed border-gray-200 rounded-2xl p-12 text-center text-sm text-gray-400 bg-white/70 backdrop-blur-md shadow-sm">
              No official events scheduled for this specific date. Use the Event Explorer to check surrounding timelines!
            </div>
          ) : (
            filteredEvents.map((event) => {
              const startTimeFormatted = new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              return (
                <div key={event.id} className="bg-white/70 backdrop-blur-md border border-gray-200 rounded-2xl p-5 shadow-sm hover:border-gray-300 transition-all">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                        {event.profiles && !Array.isArray(event.profiles) ? event.profiles.full_name : "Campus Club"}
                      </span>
                      <h3 className="text-base font-bold text-gray-900 mt-2">{event.title}</h3>
                      <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{event.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500 font-medium">
                    <div>⏰ {startTimeFormatted}</div> 
                    <div>📍 {event.venue}</div>
                    <div>👥 Cap: {event.capacity}</div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white/70 backdrop-blur-md border border-gray-200 rounded-2xl p-5 shadow-sm sticky top-6">
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