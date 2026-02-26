"use client";

import { useState, useRef, useEffect } from "react";

interface DatePickerProps {
  checkIn: Date | null;
  checkOut: Date | null;
  onDatesChange: (checkIn: Date | null, checkOut: Date | null) => void;
}

const DAYS = ["L", "M", "M", "G", "V", "S", "D"];
const MONTHS = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
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

function CalendarMonth({
  year,
  month,
  checkIn,
  checkOut,
  hoverDate,
  onDateClick,
  onDateHover,
}: {
  year: number;
  month: number;
  checkIn: Date | null;
  checkOut: Date | null;
  hoverDate: Date | null;
  onDateClick: (date: Date) => void;
  onDateHover: (date: Date | null) => void;
}) {
  const firstDay = new Date(year, month, 1);
  let startDay = firstDay.getDay() - 1;
  if (startDay < 0) startDay = 6;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startDay; i++) {
    cells.push(<div key={`empty-${i}`} className="aspect-square" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const past = isPast(date);
    const isCheckIn = checkIn && isSameDay(date, checkIn);
    const isCheckOut = checkOut && isSameDay(date, checkOut);
    const isSelected = isCheckIn || isCheckOut;

    const rangeEnd =
      checkOut || (checkIn && hoverDate && hoverDate > checkIn ? hoverDate : null);
    const inRange = isInRange(date, checkIn, rangeEnd);

    cells.push(
      <div key={day} className="aspect-square flex items-center justify-center">
        <button
          disabled={past}
          onClick={() => !past && onDateClick(date)}
          onMouseEnter={() => !past && onDateHover(date)}
          onMouseLeave={() => onDateHover(null)}
          className={`
            w-full h-full flex items-center justify-center text-[13px] transition-all
            ${past ? "text-neutral-200 cursor-default" : "cursor-pointer"}
            ${!past && !isSelected && !inRange ? "hover:bg-neutral-100 rounded-full" : ""}
            ${isSelected ? "bg-neutral-900 text-white font-semibold rounded-full" : ""}
            ${inRange ? "bg-neutral-100" : ""}
          `}
        >
          {day}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h3 className="text-sm font-semibold text-neutral-900 text-center mb-4">
        {MONTHS[month]} {year}
      </h3>
      <div className="grid grid-cols-7">
        {DAYS.map((d, i) => (
          <div
            key={`${d}-${i}`}
            className="aspect-square flex items-center justify-center text-[11px] font-semibold text-neutral-400"
          >
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
      return next > 11
        ? { year: prev.year + 1, month: 0 }
        : { year: prev.year, month: next };
    });
  }

  function prevMonth() {
    const now = new Date();
    const currentMonth = now.getFullYear() * 12 + now.getMonth();
    const viewCurrent = viewMonth.year * 12 + viewMonth.month;
    if (viewCurrent <= currentMonth) return;
    setViewMonth((prev) => {
      const next = prev.month - 1;
      return next < 0
        ? { year: prev.year - 1, month: 11 }
        : { year: prev.year, month: next };
    });
  }

  const secondMonth =
    viewMonth.month + 1 > 11
      ? { year: viewMonth.year + 1, month: 0 }
      : { year: viewMonth.year, month: viewMonth.month + 1 };

  const nights =
    checkIn && checkOut
      ? Math.ceil(
          (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
        )
      : null;

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <div className="flex border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <button
          onClick={() => {
            setIsOpen(true);
            setSelecting("checkIn");
          }}
          className={`flex-1 px-4 py-3 text-left cursor-pointer transition-colors ${
            isOpen && selecting === "checkIn"
              ? "bg-neutral-50"
              : "hover:bg-neutral-50"
          }`}
        >
          <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
            Check-in
          </p>
          <p
            className={`text-sm ${
              checkIn ? "text-neutral-900 font-medium" : "text-neutral-400"
            }`}
          >
            {checkIn ? formatDate(checkIn) : "Aggiungi"}
          </p>
        </button>
        <div className="w-px bg-neutral-200" />
        <button
          onClick={() => {
            setIsOpen(true);
            setSelecting("checkOut");
          }}
          className={`flex-1 px-4 py-3 text-left cursor-pointer transition-colors ${
            isOpen && selecting === "checkOut"
              ? "bg-neutral-50"
              : "hover:bg-neutral-50"
          }`}
        >
          <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
            Check-out
          </p>
          <p
            className={`text-sm ${
              checkOut ? "text-neutral-900 font-medium" : "text-neutral-400"
            }`}
          >
            {checkOut ? formatDate(checkOut) : "Aggiungi"}
          </p>
        </button>
      </div>

      {/* Calendar dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-neutral-200 rounded-2xl shadow-xl z-50 w-[300px] lg:w-[600px] p-5">
          {/* Header with arrows */}
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={prevMonth}
              className="p-2 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <svg
                className="w-4 h-4 text-neutral-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5 8.25 12l7.5-7.5"
                />
              </svg>
            </button>
            <p className="text-xs font-medium text-neutral-400">
              {selecting === "checkIn"
                ? "Seleziona check-in"
                : "Seleziona check-out"}
            </p>
            <button
              onClick={nextMonth}
              className="p-2 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <svg
                className="w-4 h-4 text-neutral-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m8.25 4.5 7.5 7.5-7.5 7.5"
                />
              </svg>
            </button>
          </div>

          {/* Calendars: 1 on mobile, 2 on desktop */}
          <div className="flex gap-6">
            <div className="flex-1">
              <CalendarMonth
                year={viewMonth.year}
                month={viewMonth.month}
                checkIn={checkIn}
                checkOut={checkOut}
                hoverDate={hoverDate}
                onDateClick={handleDateClick}
                onDateHover={setHoverDate}
              />
            </div>
            <div className="hidden lg:block flex-1">
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
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-100">
            <button
              onClick={handleClear}
              className="text-xs font-medium text-neutral-500 hover:text-neutral-900 underline cursor-pointer"
            >
              Cancella date
            </button>
            {nights !== null && (
              <p className="text-xs text-neutral-500 font-medium">
                {nights} {nights === 1 ? "notte" : "notti"}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
