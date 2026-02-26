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
  const atMin = value <= min;
  const atMax = value >= max;

  return (
    <div className="flex items-center justify-between py-4 lg:py-5">
      <div className="pr-4">
        <p className="text-[15px] leading-tight font-semibold text-neutral-900">{label}</p>
        <p className="text-[13px] leading-tight text-neutral-500 mt-1">{description}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0" role="group" aria-label={`${label}: ${value}`}>
        <button
          onClick={onDecrement}
          disabled={atMin}
          aria-label={`Riduci ${label}`}
          className={`
            w-11 h-11 rounded-full border-2 flex items-center justify-center
            transition-all duration-150 active:scale-90
            ${atMin
              ? "border-neutral-200 text-neutral-200 cursor-not-allowed"
              : "border-neutral-400 text-neutral-600 hover:border-neutral-900 hover:text-neutral-900 cursor-pointer"
            }
          `}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
          </svg>
        </button>

        <span
          className="w-8 text-center text-base font-semibold text-neutral-900 tabular-nums select-none"
          aria-live="polite"
        >
          {value}
        </span>

        <button
          onClick={onIncrement}
          disabled={atMax}
          aria-label={`Aggiungi ${label}`}
          className={`
            w-11 h-11 rounded-full border-2 flex items-center justify-center
            transition-all duration-150 active:scale-90
            ${atMax
              ? "border-neutral-200 text-neutral-200 cursor-not-allowed"
              : "border-neutral-400 text-neutral-600 hover:border-neutral-900 hover:text-neutral-900 cursor-pointer"
            }
          `}
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

  // Lock body scroll on mobile when panel is open
  useEffect(() => {
    if (isOpen && window.innerWidth < 1024) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [isOpen]);

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
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="flex items-center gap-2 px-3 lg:px-4 py-2.5 bg-white border border-neutral-200 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer w-full lg:min-w-[170px] min-h-[48px]"
      >
        <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-neutral-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
        </div>
        <div className="text-left min-w-0">
          <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Ospiti</p>
          <p className={`text-sm mt-0.5 truncate ${summary ? "text-neutral-900 font-semibold" : "text-neutral-400"}`}>
            {summary || "Aggiungi ospiti"}
          </p>
        </div>
        <svg className={`w-4 h-4 text-neutral-400 ml-auto shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Mobile: fullscreen bottom sheet */}
          <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => setIsOpen(false)}
            />

            {/* Sheet */}
            <div className="relative bg-white rounded-t-2xl max-h-[85vh] flex flex-col">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-neutral-300" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-3 border-b border-neutral-100">
                <h3 className="text-lg font-bold text-neutral-900">Ospiti</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 -mr-2 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
                  aria-label="Chiudi"
                >
                  <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Counters */}
              <div className="flex-1 overflow-y-auto px-5">
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
              </div>

              {/* CTA */}
              <div className="px-5 py-4 border-t border-neutral-100 safe-area-pb">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full bg-neutral-900 text-white rounded-xl py-3.5 text-[15px] font-semibold hover:bg-neutral-800 active:scale-[0.98] transition-all cursor-pointer"
                >
                  {summary ? `Conferma — ${summary}` : "Conferma"}
                </button>
              </div>
            </div>
          </div>

          {/* Desktop: dropdown */}
          <div className="hidden lg:block absolute top-full right-0 mt-3 w-[360px] bg-white border border-neutral-200 rounded-2xl shadow-2xl z-50">
            <div className="px-6 py-1">
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
            </div>
            <div className="px-6 py-4 border-t border-neutral-100">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full bg-neutral-900 text-white rounded-xl py-3 text-sm font-semibold hover:bg-neutral-800 active:scale-[0.98] transition-all cursor-pointer"
              >
                Conferma
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
