"use client";

import { useState, useRef, useEffect } from "react";

interface DatePickerProps {
  checkIn: Date | null;
  checkOut: Date | null;
  onDatesChange: (checkIn: Date | null, checkOut: Date | null) => void;
}

const DAYS_SHORT = ["Lu", "Ma", "Me", "Gi", "Ve", "Sa", "Do"];
const MONTHS = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isInRange(date: Date, start: Date | null, end: Date | null) {
  if (!start || !end) return false;
  const d = date.getTime();
  return d > start.getTime() && d < end.getTime();
}

function isPast(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

function isToday(date: Date) {
  const today = new Date();
  return isSameDay(date, today);
}

function formatDate(date: Date | null) {
  if (!date) return "";
  return date.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
}

function CalendarMonth({
  year, month, checkIn, checkOut, hoverDate, onDateClick, onDateHover,
}: {
  year: number; month: number;
  checkIn: Date | null; checkOut: Date | null; hoverDate: Date | null;
  onDateClick: (date: Date) => void; onDateHover: (date: Date | null) => void;
}) {
  const firstDay = new Date(year, month, 1);
  let startDay = firstDay.getDay() - 1;
  if (startDay < 0) startDay = 6;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const rows: React.ReactNode[][] = [];
  let currentRow: React.ReactNode[] = [];

  // Empty leading cells
  for (let i = 0; i < startDay; i++) {
    currentRow.push(<td key={`e-${i}`} className="p-0" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const past = isPast(date);
    const today = isToday(date);
    const isCheckIn = checkIn ? isSameDay(date, checkIn) : false;
    const isCheckOut = checkOut ? isSameDay(date, checkOut) : false;
    const isSelected = isCheckIn || isCheckOut;
    const rangeEnd = checkOut || (checkIn && hoverDate && hoverDate > checkIn ? hoverDate : null);
    const inRange = isInRange(date, checkIn, rangeEnd);

    // Range edge styling for connecting cells
    const isRangeStart = isCheckIn && (checkOut || (hoverDate && hoverDate > checkIn!));
    const isRangeEnd = isCheckOut || (!checkOut && checkIn && hoverDate && hoverDate > checkIn && isSameDay(date, hoverDate));

    currentRow.push(
      <td key={day} className="p-0 relative">
        {/* Range background strip */}
        {(inRange || isRangeStart || isRangeEnd) && (
          <div
            className={`absolute inset-y-1 bg-neutral-900/[0.06] ${
              isRangeStart ? "left-1/2 right-0 rounded-l-none" :
              isRangeEnd ? "left-0 right-1/2 rounded-r-none" :
              "left-0 right-0"
            }`}
          />
        )}
        <button
          disabled={past}
          onClick={() => !past && onDateClick(date)}
          onMouseEnter={() => !past && onDateHover(date)}
          onMouseLeave={() => onDateHover(null)}
          className={`
            relative z-10 w-10 h-10 mx-auto flex items-center justify-center text-[13px] rounded-full transition-all
            ${past ? "text-neutral-200" : ""}
            ${!past && !isSelected ? "cursor-pointer" : ""}
            ${!past && !isSelected && !inRange ? "hover:bg-neutral-200" : ""}
            ${isSelected ? "bg-neutral-900 text-white font-bold" : ""}
            ${today && !isSelected ? "font-bold text-neutral-900" : ""}
            ${!past && !isSelected && !today ? "text-neutral-700" : ""}
          `}
        >
          {day}
        </button>
      </td>
    );

    if (currentRow.length === 7) {
      rows.push(currentRow);
      currentRow = [];
    }
  }

  // Fill trailing cells
  if (currentRow.length > 0) {
    while (currentRow.length < 7) {
      currentRow.push(<td key={`t-${currentRow.length}`} className="p-0" />);
    }
    rows.push(currentRow);
  }

  return (
    <div className="select-none">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {DAYS_SHORT.map((d, i) => (
              <th key={i} className="pb-2 text-[11px] font-medium text-neutral-400 text-center w-10">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>{row}</tr>
          ))}
        </tbody>
      </table>
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
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lock body scroll on mobile when calendar is open
  useEffect(() => {
    if (isOpen && window.innerWidth < 1024) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [isOpen]);

  function handleDateClick(date: Date) {
    if (selecting === "checkIn") {
      onDatesChange(date, null);
      setSelecting("checkOut");
    } else {
      if (checkIn && date <= checkIn) {
        onDatesChange(date, null);
        setSelecting("checkOut");
      } else {
        onDatesChange(checkIn, date);
        setSelecting("checkIn");
        // Keep open briefly so user sees the selection
        setTimeout(() => setIsOpen(false), 300);
      }
    }
  }

  function handleClear() {
    onDatesChange(null, null);
    setSelecting("checkIn");
  }

  function nextMonth() {
    setViewMonth((prev) => prev.month + 1 > 11 ? { year: prev.year + 1, month: 0 } : { year: prev.year, month: prev.month + 1 });
  }

  function prevMonth() {
    const now = new Date();
    if (viewMonth.year * 12 + viewMonth.month <= now.getFullYear() * 12 + now.getMonth()) return;
    setViewMonth((prev) => prev.month - 1 < 0 ? { year: prev.year - 1, month: 11 } : { year: prev.year, month: prev.month - 1 });
  }

  const secondMonth = viewMonth.month + 1 > 11
    ? { year: viewMonth.year + 1, month: 0 }
    : { year: viewMonth.year, month: viewMonth.month + 1 };

  const nights = checkIn && checkOut
    ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <div className="flex border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
        <button
          onClick={() => { setIsOpen(true); setSelecting("checkIn"); }}
          className={`px-4 py-2.5 text-left cursor-pointer transition-colors min-w-[120px] ${isOpen && selecting === "checkIn" ? "bg-neutral-50 ring-2 ring-inset ring-neutral-900 rounded-l-xl" : "hover:bg-neutral-50"}`}
        >
          <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Check-in</p>
          <p className={`text-sm mt-0.5 ${checkIn ? "text-neutral-900 font-semibold" : "text-neutral-400"}`}>
            {checkIn ? formatDate(checkIn) : "Aggiungi data"}
          </p>
        </button>
        <div className="w-px bg-neutral-200 my-2" />
        <button
          onClick={() => { setIsOpen(true); setSelecting("checkOut"); }}
          className={`px-4 py-2.5 text-left cursor-pointer transition-colors min-w-[120px] ${isOpen && selecting === "checkOut" ? "bg-neutral-50 ring-2 ring-inset ring-neutral-900 rounded-r-xl" : "hover:bg-neutral-50"}`}
        >
          <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Check-out</p>
          <p className={`text-sm mt-0.5 ${checkOut ? "text-neutral-900 font-semibold" : "text-neutral-400"}`}>
            {checkOut ? formatDate(checkOut) : "Aggiungi data"}
          </p>
        </button>
      </div>

      {/* Calendar — fullscreen on mobile, dropdown on desktop */}
      {isOpen && (
        <>
          {/* Mobile: fullscreen overlay */}
          <div className="lg:hidden fixed inset-0 bg-white z-50 flex flex-col">
            {/* Mobile header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
              <button onClick={() => setIsOpen(false)} className="p-3 -ml-3 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center">
                <svg className="w-5 h-5 text-neutral-700" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="text-center">
                <p className="text-sm font-semibold text-neutral-900">
                  {selecting === "checkIn" ? "Seleziona check-in" : "Seleziona check-out"}
                </p>
                {nights !== null && (
                  <p className="text-xs text-neutral-500">{nights} {nights === 1 ? "notte" : "notti"}</p>
                )}
              </div>
              <button onClick={handleClear} className="text-xs font-semibold text-neutral-500 p-3 -mr-3 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center">
                Cancella
              </button>
            </div>

            {/* Mobile date summary */}
            <div className="flex border-b border-neutral-100">
              <div className={`flex-1 px-4 py-3 text-center border-r border-neutral-100 ${selecting === "checkIn" ? "bg-neutral-50" : ""}`}>
                <p className="text-[10px] font-bold text-neutral-400 uppercase">Check-in</p>
                <p className={`text-sm mt-0.5 ${checkIn ? "font-semibold text-neutral-900" : "text-neutral-400"}`}>
                  {checkIn ? formatDate(checkIn) : "—"}
                </p>
              </div>
              <div className={`flex-1 px-4 py-3 text-center ${selecting === "checkOut" ? "bg-neutral-50" : ""}`}>
                <p className="text-[10px] font-bold text-neutral-400 uppercase">Check-out</p>
                <p className={`text-sm mt-0.5 ${checkOut ? "font-semibold text-neutral-900" : "text-neutral-400"}`}>
                  {checkOut ? formatDate(checkOut) : "—"}
                </p>
              </div>
            </div>

            {/* Mobile calendar — nav + single month */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="p-3 rounded-full hover:bg-neutral-100 cursor-pointer active:bg-neutral-200 min-w-[44px] min-h-[44px] flex items-center justify-center">
                  <svg className="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <h2 className="text-base font-bold text-neutral-900">
                  {MONTHS[viewMonth.month]} {viewMonth.year}
                </h2>
                <button onClick={nextMonth} className="p-3 rounded-full hover:bg-neutral-100 cursor-pointer active:bg-neutral-200 min-w-[44px] min-h-[44px] flex items-center justify-center">
                  <svg className="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
              <CalendarMonth
                year={viewMonth.year} month={viewMonth.month}
                checkIn={checkIn} checkOut={checkOut} hoverDate={hoverDate}
                onDateClick={handleDateClick} onDateHover={setHoverDate}
              />
            </div>
          </div>

          {/* Desktop: dropdown */}
          <div className="hidden lg:block absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-white border border-neutral-200 rounded-2xl shadow-2xl z-50 p-6 w-[620px]">
            {/* Navigation */}
            <div className="flex items-center justify-between mb-1">
              <button onClick={prevMonth} className="p-2 rounded-full hover:bg-neutral-100 cursor-pointer transition-colors">
                <svg className="w-4 h-4 text-neutral-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
              <div className="flex-1" />
              <button onClick={nextMonth} className="p-2 rounded-full hover:bg-neutral-100 cursor-pointer transition-colors">
                <svg className="w-4 h-4 text-neutral-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>

            {/* Two months */}
            <div className="grid grid-cols-2 gap-10">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 text-center mb-3">
                  {MONTHS[viewMonth.month]} {viewMonth.year}
                </h3>
                <CalendarMonth
                  year={viewMonth.year} month={viewMonth.month}
                  checkIn={checkIn} checkOut={checkOut} hoverDate={hoverDate}
                  onDateClick={handleDateClick} onDateHover={setHoverDate}
                />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 text-center mb-3">
                  {MONTHS[secondMonth.month]} {secondMonth.year}
                </h3>
                <CalendarMonth
                  year={secondMonth.year} month={secondMonth.month}
                  checkIn={checkIn} checkOut={checkOut} hoverDate={hoverDate}
                  onDateClick={handleDateClick} onDateHover={setHoverDate}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-neutral-100">
              <button onClick={handleClear} className="text-sm font-semibold text-neutral-600 hover:text-neutral-900 underline underline-offset-4 cursor-pointer transition-colors">
                Cancella date
              </button>
              {nights !== null && (
                <div className="bg-neutral-900 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                  {nights} {nights === 1 ? "notte" : "notti"}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
