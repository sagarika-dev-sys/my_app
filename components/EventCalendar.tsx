"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function CalendarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse params safely
  const initialYear = parseInt(searchParams.get("year") || "2026", 10);
  const initialMonth = parseInt(searchParams.get("month") || "5", 10);
  const currentSelectedDay = searchParams.get("day") || "26";
  
  const [currentDate, setCurrentDate] = useState(new Date(initialYear, initialMonth, 1));
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const handleDateClick = (day: number) => {
    router.push(`/events?day=${day}&month=${month}&year=${year}`);
  };

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="w-full bg-white p-2">
      <div className="flex justify-between mb-4 px-1 text-sm font-bold">
        <span>{monthNames[month]} {year}</span>
        <div className="flex gap-2">
          <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>◀</button>
          <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>▶</button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 text-center text-[10px] text-gray-400">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => <div key={d}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1 mt-2">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const isSelected = currentSelectedDay === String(day) && month === initialMonth;
          return (
            <button
              key={day}
              onClick={() => handleDateClick(day)}
              className={`h-8 w-8 rounded-lg text-xs ${isSelected ? "bg-indigo-600 text-white" : "hover:bg-gray-100"}`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function EventCalendar() {
  return (
    <Suspense fallback={<div>Loading Calendar...</div>}>
      <CalendarContent />
    </Suspense>
  );
}