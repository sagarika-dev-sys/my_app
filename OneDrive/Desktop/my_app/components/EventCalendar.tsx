"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function EventCalendar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get current date context or default to June 2026
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 1)); // Month index 5 is June

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Read active day from URL, default to 26 if matches current view
  const currentSelectedDay = searchParams.get("day");
  const urlMonth = searchParams.get("month");
  const urlYear = searchParams.get("year");

  const isCurrentViewSelected = 
    urlMonth === String(month) && urlYear === String(year);

  // Compute calendar parameters dynamically
  const firstDayOfMonth = new Date(year, month, 1).getDay(); 
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDateClick = (day: number) => {
    // Push day, month, and year to URL parameters so the backend filters precisely
    router.push(`/events?day=${day}&month=${month}&year=${year}`);
  };

  return (
    <div className="w-full bg-white p-2">
      {/* Dynamic Month Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <span className="text-sm font-bold text-gray-900">{monthNames[month]} {year}</span>
        <div className="flex gap-1">
          <button onClick={handlePrevMonth} className="text-gray-400 hover:text-gray-900 text-sm p-1.5 rounded-lg hover:bg-gray-50 transition-colors">◀</button>
          <button onClick={handleNextMonth} className="text-gray-400 hover:text-gray-900 text-sm p-1.5 rounded-lg hover:bg-gray-50 transition-colors">▶</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
        <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {/* Render empty grids for offset */}
        {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
          <div key={`empty-${idx}`} />
        ))}

        {/* Dynamic Days Rendering */}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const isSelected = isCurrentViewSelected && currentSelectedDay === String(day);
          
          // Let's place a small event marker on June 28, 2026 for testing presentation lines
          const hasEvent = month === 5 && year === 2026 && day === 28;

          return (
            <button
              key={day}
              onClick={() => handleDateClick(day)}
              className={`
                h-8 w-8 mx-auto text-xs font-medium rounded-xl flex items-center justify-center relative transition-all duration-150
                ${isSelected 
                  ? "bg-indigo-600 text-white font-bold ring-2 ring-indigo-600 ring-offset-2 shadow-md shadow-indigo-600/20" 
                  : "text-gray-700 hover:bg-gray-100"
                }
              `}
            >
              {day}
              {hasEvent && !isSelected && (
                <span className="absolute bottom-1 w-1 h-1 bg-indigo-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}