"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/config";

interface Props {
  userRole: "student" | "club" | "admin" | null;
  userId: string | null;
}

export default function CreateEventModal({ userRole, userId }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Field States
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [capacity, setCapacity] = useState("");

  if (!userRole || userRole === "student") return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          venue,
          start_time: new Date(startTime).toISOString(),
          end_time: new Date(endTime).toISOString(),
          capacity: parseInt(capacity, 10),
        }),
      });

      if (response.ok) {
        setIsOpen(false);
        router.refresh(); // Refresh route caching architecture seamlessly
        
        // Form field reset logic
        setTitle("");
        setDescription("");
        setVenue("");
        setStartTime("");
        setEndTime("");
        setCapacity("");
      } else {
        alert("Failed to save event to local Python engine database collection.");
      }
    } catch (error) {
      console.error("Transmission breakdown:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all cursor-pointer"
      >
        + Create New Event
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Host an Event</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-900 font-bold text-xl cursor-pointer">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Event Title</label>
                <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border rounded-lg p-2 text-sm text-black" placeholder="e.g. HackFest 2026" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                <textarea required value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border rounded-lg p-2 text-sm text-black" rows={3} placeholder="What is this event about?" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Start Time</label>
                  <input required type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full border rounded-lg p-2 text-sm text-black" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">End Time</label>
                  <input required type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full border rounded-lg p-2 text-sm text-black" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Venue</label>
                  <input required type="text" value={venue} onChange={(e) => setVenue(e.target.value)} className="w-full border rounded-lg p-2 text-sm text-black" placeholder="e.g. Main Audi" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Capacity</label>
                  <input required type="number" min="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} className="w-full border rounded-lg p-2 text-sm text-black" placeholder="e.g. 150" />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-bold disabled:opacity-50 cursor-pointer">
                  {isSubmitting ? "Publishing..." : "Publish Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}