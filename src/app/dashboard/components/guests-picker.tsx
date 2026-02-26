"use client";

import { useState, useRef, useEffect } from "react";

export interface GuestsCount {
  adults: number;
  children: number;
  infants: number;
  pets: number;
}

interface GuestsPickerProps {
  guests: GuestsCount;
  onGuestsChange: (guests: GuestsCount) => void;
}

function Counter({ label, description, value, onIncrement, onDecrement, min = 0, max = 16 }: {
  label: string; description: string; value: number;
  onIncrement: () => void; onDecrement: () => void;
  min?: number; max?: number;
}) {
  return (
    <div className="flex items-center justify-between py-5">
      <div>
        <p className="text-[15px] font-semibold text-neutral-900">{label}</p>
        <p className="text-[13px] text-neutral-500 mt-0.5">{description}</p>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={onDecrement}
          disabled={value <= min}
          className="w-9 h-9 rounded-full border-2 border-neutral-300 flex items-center justify-center text-neutral-500 hover:border-neutral-900 hover:text-neutral-900 transition-all cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:border-neutral-300 disabled:hover:text-neutral-500 active:scale-90"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
          </svg>
        </button>
        <span className="w-5 text-center text-[15px] font-semibold text-neutral-900 tabular-nums">{value}</span>
        <button
          onClick={onIncrement}
          disabled={value >= max}
          className="w-9 h-9 rounded-full border-2 border-neutral-300 flex items-center justify-center text-neutral-500 hover:border-neutral-900 hover:text-neutral-900 transition-all cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:border-neutral-300 disabled:hover:text-neutral-500 active:scale-90"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function GuestsPicker({ guests, onGuestsChange }: GuestsPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function update(key: keyof GuestsCount, delta: number) {
    onGuestsChange({ ...guests, [key]: guests[key] + delta });
  }

  const totalGuests = guests.adults + guests.children;
  const parts: string[] = [];
  if (totalGuests > 0) parts.push(`${totalGuests} ospit${totalGuests === 1 ? "e" : "i"}`);
  if (guests.infants > 0) parts.push(`${guests.infants} neonat${guests.infants === 1 ? "o" : "i"}`);
  if (guests.pets > 0) parts.push(`${guests.pets} animal${guests.pets === 1 ? "e" : "i"}`);
  const summary = parts.join(", ");

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2.5 bg-white border border-neutral-200 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer min-w-[170px]"
      >
        <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-neutral-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
        </div>
        <div className="text-left">
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Ospiti</p>
          <p className={`text-sm mt-0.5 ${summary ? "text-neutral-900 font-semibold" : "text-neutral-400"}`}>
            {summary || "Aggiungi ospiti"}
          </p>
        </div>
        <svg className={`w-4 h-4 text-neutral-400 ml-auto shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-3 w-[340px] bg-white border border-neutral-200 rounded-2xl shadow-2xl z-50 px-6 py-1">
          <Counter label="Adulti" description="Dai 13 anni in su" value={guests.adults}
            onIncrement={() => update("adults", 1)} onDecrement={() => update("adults", -1)} max={16} />
          <div className="h-px bg-neutral-100" />
          <Counter label="Bambini" description="Dai 2 ai 12 anni" value={guests.children}
            onIncrement={() => update("children", 1)} onDecrement={() => update("children", -1)} max={8} />
          <div className="h-px bg-neutral-100" />
          <Counter label="Neonati" description="Sotto i 2 anni" value={guests.infants}
            onIncrement={() => update("infants", 1)} onDecrement={() => update("infants", -1)} max={5} />
          <div className="h-px bg-neutral-100" />
          <Counter label="Animali" description="Animali domestici" value={guests.pets}
            onIncrement={() => update("pets", 1)} onDecrement={() => update("pets", -1)} max={5} />
          <div className="pb-3" />
        </div>
      )}
    </div>
  );
}
