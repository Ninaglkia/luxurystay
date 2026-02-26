"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { useMapsLibrary } from "@vis.gl/react-google-maps";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const TOTAL_STEPS = 5;

/* ═══════════════════════════════════════════
   Animations
   ═══════════════════════════════════════════ */
const pageVariants = {
  enter: { opacity: 0, x: 60 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -60 },
};
const pageTransition = { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const };

/* ═══════════════════════════════════════════
   Step 0 — Overview "Iniziare è facile"
   ═══════════════════════════════════════════ */
function StepOverview() {
  const phases = [
    {
      num: 1,
      title: "Parlaci del tuo alloggio",
      desc: "Condividi alcune informazioni di base, come la posizione dell'alloggio e quanti ospiti vi possono soggiornare.",
      illustration: (
        <div className="w-28 h-20 lg:w-32 lg:h-24 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
          <svg className="w-10 h-10 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
        </div>
      ),
    },
    {
      num: 2,
      title: "Fai in modo che si distingua",
      desc: "Aggiungi un titolo e una descrizione per far risaltare il tuo annuncio: ti aiutiamo noi.",
      illustration: (
        <div className="w-28 h-20 lg:w-32 lg:h-24 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
          <svg className="w-10 h-10 text-violet-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
          </svg>
        </div>
      ),
    },
    {
      num: 3,
      title: "Completa e pubblica l'annuncio",
      desc: "Scegli un prezzo di partenza, verifica alcuni dettagli e poi pubblica il tuo annuncio.",
      illustration: (
        <div className="w-28 h-20 lg:w-32 lg:h-24 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
          <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 lg:gap-20 max-w-4xl mx-auto w-full">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-3xl lg:text-5xl font-bold text-neutral-900 leading-tight lg:max-w-xs lg:sticky lg:top-1/3 text-center lg:text-left"
      >
        Iniziare su LuxuryStay è facile
      </motion.h1>

      <div className="w-full max-w-md space-y-6 lg:space-y-8">
        {phases.map((phase, i) => (
          <motion.div
            key={phase.num}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.15, duration: 0.5 }}
            className="flex items-start gap-4 lg:gap-5"
          >
            <span className="text-xl lg:text-2xl font-bold text-neutral-900 mt-1 shrink-0">{phase.num}</span>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-neutral-900">{phase.title}</h3>
              <p className="text-sm text-neutral-500 mt-1 leading-relaxed">{phase.desc}</p>
            </div>
            {phase.illustration}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Step 1 — Intro "Parlaci del tuo alloggio"
   ═══════════════════════════════════════════ */
function HouseIllustration() {
  return (
    <div className="relative w-64 h-64 lg:w-80 lg:h-80">
      <svg viewBox="0 0 320 320" className="w-full h-full">
        {/* Ground shadow */}
        <motion.ellipse
          cx="160" cy="290" rx="120" ry="15"
          fill="#f5f5f5"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        />
        {/* Main building */}
        <motion.rect
          x="70" y="120" width="180" height="160" rx="4"
          fill="#fafafa" stroke="#e5e5e5" strokeWidth="2"
          initial={{ opacity: 0, y: 40, scaleY: 0.5 }}
          animate={{ opacity: 1, y: 0, scaleY: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 120, damping: 14 }}
          style={{ transformOrigin: "160px 280px" }}
        />
        {/* Roof */}
        <motion.polygon
          points="50,125 160,50 270,125"
          fill="#292524" stroke="#292524" strokeWidth="2" strokeLinejoin="round"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 100, damping: 12 }}
        />
        {/* Door */}
        <motion.rect
          x="140" y="210" width="40" height="70" rx="3"
          fill="#d97706" stroke="#b45309" strokeWidth="1.5"
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          transition={{ delay: 0.7, type: "spring", stiffness: 150, damping: 15 }}
          style={{ transformOrigin: "160px 280px" }}
        />
        {/* Door knob */}
        <motion.circle
          cx="172" cy="248" r="3"
          fill="#92400e"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
        />
        {/* Window left */}
        <motion.rect
          x="90" y="155" width="35" height="35" rx="3"
          fill="#bfdbfe" stroke="#d4d4d4" strokeWidth="1.5"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, type: "spring", stiffness: 200, damping: 15 }}
          style={{ transformOrigin: "107px 172px" }}
        />
        <motion.line
          x1="107.5" y1="155" x2="107.5" y2="190"
          stroke="#d4d4d4" strokeWidth="1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
        />
        <motion.line
          x1="90" y1="172.5" x2="125" y2="172.5"
          stroke="#d4d4d4" strokeWidth="1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
        />
        {/* Window right */}
        <motion.rect
          x="195" y="155" width="35" height="35" rx="3"
          fill="#bfdbfe" stroke="#d4d4d4" strokeWidth="1.5"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9, type: "spring", stiffness: 200, damping: 15 }}
          style={{ transformOrigin: "212px 172px" }}
        />
        <motion.line
          x1="212.5" y1="155" x2="212.5" y2="190"
          stroke="#d4d4d4" strokeWidth="1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        />
        <motion.line
          x1="195" y1="172.5" x2="230" y2="172.5"
          stroke="#d4d4d4" strokeWidth="1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        />
        {/* Chimney */}
        <motion.rect
          x="210" y="55" width="22" height="50" rx="2"
          fill="#78716c" stroke="#57534e" strokeWidth="1.5"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, type: "spring", stiffness: 120, damping: 14 }}
        />
        {/* Tree left */}
        <motion.g
          initial={{ opacity: 0, y: 20, scale: 0.7 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 1.2, type: "spring", stiffness: 100, damping: 12 }}
        >
          <rect x="30" y="240" width="8" height="40" rx="4" fill="#a3a3a3" />
          <circle cx="34" cy="225" r="22" fill="#86efac" />
          <circle cx="26" cy="235" r="16" fill="#4ade80" />
        </motion.g>
        {/* Tree right */}
        <motion.g
          initial={{ opacity: 0, y: 20, scale: 0.7 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 1.3, type: "spring", stiffness: 100, damping: 12 }}
        >
          <rect x="278" y="245" width="8" height="35" rx="4" fill="#a3a3a3" />
          <circle cx="282" cy="230" r="20" fill="#86efac" />
          <circle cx="290" cy="238" r="14" fill="#4ade80" />
        </motion.g>
      </svg>
    </div>
  );
}

function StepIntro() {
  return (
    <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 max-w-4xl mx-auto w-full">
      <div className="lg:max-w-sm text-center lg:text-left">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-sm font-semibold text-neutral-500 mb-2"
        >
          Primo
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-3xl lg:text-4xl font-bold text-neutral-900 leading-tight"
        >
          Parlaci del tuo alloggio
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-neutral-500 mt-4 leading-relaxed"
        >
          In questa fase, ti chiederemo che tipo di spazio offri e se, prenotandolo,
          gli ospiti avranno a disposizione l&apos;intero alloggio o solo una stanza.
          Dopodiché, dovrai comunicarci la posizione e quante persone vi possono soggiornare.
        </motion.p>
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <HouseIllustration />
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Step 2 — Category Selection
   ═══════════════════════════════════════════ */
const categories = [
  { id: "casa", label: "Casa", icon: <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /> },
  { id: "appartamento", label: "Appartamento", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" /> },
  { id: "villa", label: "Villa", icon: <><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m1.5.5-1.5-.5M6.75 7.364V3h-3v18m3-13.636 10.5-3.819" /></> },
  { id: "baita", label: "Baita", icon: <><path strokeLinecap="round" strokeLinejoin="round" d="M12 3L2 12h3v8h14v-8h3L12 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 21v-6h6v6" /></> },
  { id: "bb", label: "B&B", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" /> },
  { id: "barca", label: "Barca", icon: <><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v9m0 0l-4 4m4-4l4 4" /><path strokeLinecap="round" strokeLinejoin="round" d="M3.5 18.5S6 21 12 21s8.5-2.5 8.5-2.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M4 15l8 3 8-3" /></> },
  { id: "camper", label: "Camper", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H21a.75.75 0 0 0 .75-.75v-3a.75.75 0 0 0-.22-.53l-3-3A.75.75 0 0 0 18 11.25H15V6.75A2.25 2.25 0 0 0 12.75 4.5H3.375c-.621 0-1.125.504-1.125 1.125v9.75" /> },
  { id: "castello", label: "Castello", icon: <><path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l2-2V3h2v2l2-2 2 2V3h2v2l2 2v14" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 21v-4h6v4" /></> },
  { id: "loft", label: "Loft", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /> },
];

function StepCategory({ selected, onSelect }: { selected: string | null; onSelect: (id: string) => void }) {
  return (
    <div className="max-w-2xl mx-auto w-full">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl lg:text-3xl font-bold text-neutral-900 text-center mb-8"
      >
        Che tipo di alloggio è il tuo?
      </motion.h2>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        {categories.map((cat, i) => (
          <motion.button
            key={cat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => onSelect(cat.id)}
            className={`flex flex-col items-start gap-3 p-4 lg:p-5 rounded-xl border-2 transition-all cursor-pointer text-left min-h-[100px] ${
              selected === cat.id
                ? "border-neutral-900 bg-neutral-50"
                : "border-neutral-200 hover:border-neutral-400 bg-white"
            }`}
          >
            <svg className="w-7 h-7 text-neutral-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              {cat.icon}
            </svg>
            <span className="text-sm font-medium text-neutral-900">{cat.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Step 3 — Location with Google Maps
   ═══════════════════════════════════════════ */
function LocationSearch({ address, onAddressChange, onLocationSelect }: {
  address: string;
  onAddressChange: (v: string) => void;
  onLocationSelect: (loc: { lat: number; lng: number; address: string }) => void;
}) {
  const placesLib = useMapsLibrary("places");
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!placesLib) return;
    autocompleteService.current = new placesLib.AutocompleteService();
    const div = document.createElement("div");
    placesService.current = new placesLib.PlacesService(div);
  }, [placesLib]);

  function handleInput(value: string) {
    onAddressChange(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (!value.trim()) { setPredictions([]); setIsOpen(false); return; }
    debounceTimer.current = setTimeout(() => {
      autocompleteService.current?.getPlacePredictions(
        { input: value, componentRestrictions: { country: "it" } },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            setPredictions(results);
            setIsOpen(true);
          }
        }
      );
    }, 200);
  }

  function handleSelect(prediction: google.maps.places.AutocompletePrediction) {
    placesService.current?.getDetails(
      { placeId: prediction.place_id, fields: ["geometry", "formatted_address"] },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
          onLocationSelect({
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            address: place.formatted_address || prediction.description,
          });
        }
      }
    );
    onAddressChange(prediction.description);
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={address}
          onChange={(e) => handleInput(e.target.value)}
          placeholder="Inserisci il tuo indirizzo"
          className="w-full pl-12 pr-4 py-4 bg-white border border-neutral-300 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 shadow-sm"
        />
      </div>
      {isOpen && predictions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
          {predictions.map((p) => (
            <button
              key={p.place_id}
              onClick={() => handleSelect(p)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-50 transition-colors cursor-pointer border-b border-neutral-100 last:border-b-0"
            >
              <svg className="w-5 h-5 text-neutral-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
              <span className="text-sm text-neutral-700 truncate">{p.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MapPanner({ target }: { target: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !target) return;
    map.panTo(target);
    map.setZoom(15);
  }, [map, target]);
  return null;
}

function StepLocation({ address, onAddressChange, location, onLocationSelect }: {
  address: string;
  onAddressChange: (v: string) => void;
  location: { lat: number; lng: number } | null;
  onLocationSelect: (loc: { lat: number; lng: number; address: string }) => void;
}) {
  return (
    <div className="max-w-2xl mx-auto w-full">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-2"
      >
        Dove si trova il tuo alloggio?
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-neutral-500 mb-6"
      >
        Il tuo indirizzo viene condiviso con gli ospiti solo dopo che hanno effettuato una prenotazione.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl overflow-hidden border border-neutral-200 shadow-sm"
      >
        {GOOGLE_MAPS_API_KEY ? (
          <div className="relative">
            <div className="h-[300px] lg:h-[380px]">
              <Map
                defaultCenter={location || { lat: 41.9028, lng: 12.4964 }}
                defaultZoom={location ? 15 : 6}
                gestureHandling="greedy"
                disableDefaultUI
                zoomControl
                mapId="luxurystay-host-map"
                style={{ width: "100%", height: "100%" }}
              />
              <MapPanner target={location} />
            </div>
            <div className="absolute top-4 left-4 right-4">
              <LocationSearch
                address={address}
                onAddressChange={onAddressChange}
                onLocationSelect={onLocationSelect}
              />
            </div>
          </div>
        ) : (
          <div className="h-[300px] bg-neutral-100 flex items-center justify-center">
            <p className="text-neutral-400 text-sm">Mappa non disponibile</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Step 4 — Parameters (guests, bedrooms, baths)
   ═══════════════════════════════════════════ */
function ParamCounter({ label, value, onIncrement, onDecrement, min = 0, max = 20 }: {
  label: string; value: number;
  onIncrement: () => void; onDecrement: () => void;
  min?: number; max?: number;
}) {
  return (
    <div className="flex items-center justify-between py-5 border-b border-neutral-100 last:border-b-0">
      <span className="text-base font-medium text-neutral-900">{label}</span>
      <div className="flex items-center gap-4">
        <button
          onClick={onDecrement}
          disabled={value <= min}
          className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
            value <= min
              ? "border-neutral-200 text-neutral-200 cursor-not-allowed"
              : "border-neutral-400 text-neutral-600 hover:border-neutral-900 hover:text-neutral-900"
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
          </svg>
        </button>
        <span className="w-8 text-center text-base font-semibold text-neutral-900 tabular-nums">{value}</span>
        <button
          onClick={onIncrement}
          disabled={value >= max}
          className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
            value >= max
              ? "border-neutral-200 text-neutral-200 cursor-not-allowed"
              : "border-neutral-400 text-neutral-600 hover:border-neutral-900 hover:text-neutral-900"
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function StepParameters({ params, onParamsChange }: {
  params: { guests: number; bedrooms: number; bathrooms: number };
  onParamsChange: (p: { guests: number; bedrooms: number; bathrooms: number }) => void;
}) {
  function update(key: keyof typeof params, delta: number) {
    onParamsChange({ ...params, [key]: params[key] + delta });
  }

  return (
    <div className="max-w-lg mx-auto w-full">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl lg:text-3xl font-bold text-neutral-900 text-center mb-8"
      >
        Quanti ospiti puo accogliere?
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-2xl border border-neutral-200 px-6"
      >
        <ParamCounter
          label="Ospiti"
          value={params.guests}
          onIncrement={() => update("guests", 1)}
          onDecrement={() => update("guests", -1)}
          min={1}
          max={20}
        />
        <ParamCounter
          label="Camere da letto"
          value={params.bedrooms}
          onIncrement={() => update("bedrooms", 1)}
          onDecrement={() => update("bedrooms", -1)}
          max={15}
        />
        <ParamCounter
          label="Bagni"
          value={params.bathrooms}
          onIncrement={() => update("bathrooms", 1)}
          onDecrement={() => update("bathrooms", -1)}
          max={10}
        />
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Main Flow Controller
   ═══════════════════════════════════════════ */
export function AddPropertyFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  // Form data
  const [category, setCategory] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [params, setParams] = useState({ guests: 1, bedrooms: 1, bathrooms: 1 });

  function canProceed(): boolean {
    switch (step) {
      case 0: return true; // overview
      case 1: return true; // intro
      case 2: return category !== null;
      case 3: return address.trim().length > 0;
      case 4: return params.guests >= 1;
      default: return false;
    }
  }

  function handleNext() {
    if (step < TOTAL_STEPS - 1) {
      setDirection(1);
      setStep(step + 1);
    }
  }

  function handleBack() {
    if (step > 0) {
      setDirection(-1);
      setStep(step - 1);
    }
  }

  function handleLocationSelect(loc: { lat: number; lng: number; address: string }) {
    setLocation({ lat: loc.lat, lng: loc.lng });
    setAddress(loc.address);
  }

  const progress = ((step) / (TOTAL_STEPS - 1)) * 100;

  const content = (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* ── Top Bar ── */}
      <header className="flex items-center justify-between px-5 lg:px-10 h-16 lg:h-20 shrink-0">
        <span className="text-lg font-light tracking-tight text-neutral-900">LuxuryStay</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors cursor-pointer min-h-[44px] flex items-center"
          >
            Salva ed esci
          </button>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="flex-1 overflow-y-auto flex items-center justify-center px-5 lg:px-10 py-8">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: d > 0 ? 60 : -60 }),
              center: { opacity: 1, x: 0 },
              exit: (d: number) => ({ opacity: 0, x: d > 0 ? -60 : 60 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={pageTransition}
            className="w-full"
          >
            {step === 0 && <StepOverview />}
            {step === 1 && <StepIntro />}
            {step === 2 && <StepCategory selected={category} onSelect={setCategory} />}
            {step === 3 && (
              <StepLocation
                address={address}
                onAddressChange={setAddress}
                location={location}
                onLocationSelect={handleLocationSelect}
              />
            )}
            {step === 4 && (
              <StepParameters params={params} onParamsChange={setParams} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Bottom Bar ── */}
      <footer className="shrink-0 border-t border-neutral-200">
        {/* Progress bar */}
        <div className="h-1 bg-neutral-100">
          <motion.div
            className="h-full bg-neutral-900"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          />
        </div>
        <div className="flex items-center justify-between px-5 lg:px-10 py-4 lg:py-5">
          {step > 0 ? (
            <button
              onClick={handleBack}
              className="text-sm font-semibold text-neutral-900 underline underline-offset-4 hover:text-neutral-600 transition-colors cursor-pointer min-h-[44px] flex items-center"
            >
              Indietro
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className={`px-6 lg:px-8 py-3 lg:py-3.5 rounded-lg text-sm font-semibold transition-all min-h-[48px] ${
              canProceed()
                ? "bg-neutral-900 text-white hover:bg-neutral-800 active:scale-[0.97] cursor-pointer"
                : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
            }`}
          >
            {step === 0 ? "Inizia" : step === TOTAL_STEPS - 1 ? "Continua" : "Avanti"}
          </button>
        </div>
      </footer>
    </div>
  );

  // Wrap in APIProvider only if Google Maps key exists (for step 3)
  if (GOOGLE_MAPS_API_KEY) {
    return (
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={["places"]}>
        {content}
      </APIProvider>
    );
  }

  return content;
}
