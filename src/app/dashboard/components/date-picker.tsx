"use client";

import { useState, useRef, useEffect } from "react";

interface DatePickerProps {
  checkIn: Date | null;
  checkOut: Date | null;
  onDatesChange: (checkIn: Date | null, checkOut: Date | null) => void;
}

const DAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const MONTHS = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isInRange(date: Date, start: Date | null, end: Date | null) {
  if (!start || !end) return false;
  return date > start && date < end;
}

function isPast(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

function formatDate(date: Date | null) {
  if (!date) return "";
  return date.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
}

function CalendarMonth({ year, month, checkIn, checkOut, hoverDate, onDateClick, onDateHover }: {
  year: number;
  month: number;
  checkIn: Date | null;
  checkOut: Date | null;
  hoverDate: Date | null;
  onDateClick: (date: Date) => void;
  onDateHover: (date: Date | null) => void;
}) {
  const firstDay = new Date(year, month, 1);
  // Monday = 0, Sunday = 6
  let startDay = firstDay.getDay() - 1;
  if (startDay < 0) startDay = 6;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  // Empty cells before first day
  for (let i = 0; i < startDay; i++) {
    cells.push(<div key={`empty-${i}`} />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const past = isPast(date);
    const isCheckIn = checkIn && isSameDay(date, checkIn);
    const isCheckOut = checkOut && isSameDay(date, checkOut);
    const isSelected = isCheckIn || isCheckOut;

    // Show range: either confirmed range or hover preview
    const rangeEnd = checkOut || (checkIn && hoverDate && hoverDate > checkIn ? hoverDate : null);
    const inRange = isInRange(date, checkIn, rangeEnd);

    cells.push(
      <button
        key={day}
        disabled={past}
        onClick={() => !past && onDateClick(date)}
        onMouseEnter={() => !past && onDateHover(date)}
        onMouseLeave={() => onDateHover(null)}
        className={`
          relative h-10 w-10 text-sm rounded-full transition-all cursor-pointer
          ${past ? "text-neutral-300 cursor-not-allowed" : "hover:border hover:border-neutral-900"}
          ${isSelected ? "bg-neutral-900 text-white font-semibold" : ""}
          ${inRange ? "bg-neutral-100 rounded-none" : ""}
          ${isCheckIn && (checkOut || (hoverDate && hoverDate > checkIn)) ? "rounded-r-none" : ""}
          ${isCheckOut || (isCheckIn && !checkOut && !hoverDate) ? "" : ""}
          ${(isCheckOut || (hoverDate && checkIn && !checkOut && isSameDay(date, hoverDate))) ? "rounded-l-none" : ""}
        `}
      >
        {day}
      </button>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-neutral-900 text-center mb-3">
        {MONTHS[month]} {year}
      </h3>
      <div className="grid grid-cols-7 gap-y-1 justify-items-center">
        {DAYS.map((d) => (
          <div key={d} className="h-8 w-10 flex items-center justify-center text-xs font-medium text-neutral-400">
            {d}
          </div>
        ))}
        {cells}
      </div>
    </div>
  );
}

export function DatePicker({ checkIn, checkOut, onDatesChange }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selecting, setSelecting] = useState<"checkIn" | "checkOut">("checkIn");
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleDateClick(date: Date) {
    if (selecting === "checkIn") {
      onDatesChange(date, null);
      setSelecting("checkOut");
    } else {
      if (checkIn && date <= checkIn) {
        // If selected date is before checkIn, restart
        onDatesChange(date, null);
        setSelecting("checkOut");
      } else {
        onDatesChange(checkIn, date);
        setSelecting("checkIn");
        setIsOpen(false);
      }
    }
  }

  function handleClear() {
    onDatesChange(null, null);
    setSelecting("checkIn");
  }

  function nextMonth() {
    setViewMonth((prev) => {
      const next = prev.month + 1;
      return next > 11 ? { year: prev.year + 1, month: 0 } : { year: prev.year, month: next };
    });
  }

  function prevMonth() {
    const now = new Date();
    const currentMonth = now.getFullYear() * 12 + now.getMonth();
    const viewCurrent = viewMonth.year * 12 + viewMonth.month;
    if (viewCurrent <= currentMonth) return;
    setViewMonth((prev) => {
      const next = prev.month - 1;
      return next < 0 ? { year: prev.year - 1, month: 11 } : { year: prev.year, month: next };
    });
  }

  const secondMonth = viewMonth.month + 1 > 11
    ? { year: viewMonth.year + 1, month: 0 }
    : { year: viewMonth.year, month: viewMonth.month + 1 };

  return (
    <div ref={ref} className="relative">
      <div className="flex border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-sm">
        {/* Check-in */}
        <button
          onClick={() => { setIsOpen(true); setSelecting("checkIn"); }}
          className={`flex-1 px-4 py-3 text-left cursor-pointer transition-colors ${
            isOpen && selecting === "checkIn" ? "bg-neutral-50" : "hover:bg-neutral-50"
          }`}
        >
          <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Check-in</p>
          <p className={`text-sm ${checkIn ? "text-neutral-900 font-medium" : "text-neutral-400"}`}>
            {checkIn ? formatDate(checkIn) : "Aggiungi data"}
          </p>
        </button>

        <div className="w-px bg-neutral-200" />

        {/* Check-out */}
        <button
          onClick={() => { setIsOpen(true); setSelecting("checkOut"); }}
          className={`flex-1 px-4 py-3 text-left cursor-pointer transition-colors ${
            isOpen && selecting === "checkOut" ? "bg-neutral-50" : "hover:bg-neutral-50"
          }`}
        >
          <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Check-out</p>
          <p className={`text-sm ${checkOut ? "text-neutral-900 font-medium" : "text-neutral-400"}`}>
            {checkOut ? formatDate(checkOut) : "Aggiungi data"}
          </p>
        </button>
      </div>

      {/* Calendar dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-neutral-200 rounded-2xl shadow-xl z-50 p-6">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-1.5 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer">
              <svg className="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
            <p className="text-sm font-medium text-neutral-500">
              {selecting === "checkIn" ? "Seleziona check-in" : "Seleziona check-out"}
            </p>
            <button onClick={nextMonth} className="p-1.5 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer">
              <svg className="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>

          <div className="flex gap-8">
            <CalendarMonth
              year={viewMonth.year}
              month={viewMonth.month}
              checkIn={checkIn}
              checkOut={checkOut}
              hoverDate={hoverDate}
              onDateClick={handleDateClick}
              onDateHover={setHoverDate}
            />
            <CalendarMonth
              year={secondMonth.year}
              month={secondMonth.month}
              checkIn={checkIn}
              checkOut={checkOut}
              hoverDate={hoverDate}
              onDateClick={handleDateClick}
              onDateHover={setHoverDate}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-100">
            <button
              onClick={handleClear}
              className="text-sm font-medium text-neutral-500 hover:text-neutral-900 underline cursor-pointer"
            >
              Cancella date
            </button>
            {checkIn && checkOut && (
              <p className="text-sm text-neutral-500">
                {Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))} notti
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
