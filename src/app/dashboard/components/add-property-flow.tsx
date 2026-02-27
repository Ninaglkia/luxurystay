"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { TiltCard } from "./tilt-card";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const TOTAL_STEPS = 14;
const pageTransition = { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const };

/* ═══════════════════════════════════════════════
   Shared Components
   ═══════════════════════════════════════════════ */
function PhaseIntro({ phase, title, desc, children }: {
  phase: string; title: string; desc: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 max-w-4xl mx-auto w-full">
      <div className="lg:max-w-sm text-center lg:text-left">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="text-sm font-semibold text-neutral-500 mb-2">{phase}</motion.p>
        <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
          className="text-3xl lg:text-4xl font-bold text-neutral-900 leading-tight">{title}</motion.h2>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}
          className="text-neutral-500 mt-4 leading-relaxed">{desc}</motion.p>
      </div>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.6 }}>
        {children}
      </motion.div>
    </div>
  );
}

function Counter({ label, value, onInc, onDec, min = 0, max = 20 }: {
  label: string; value: number; onInc: () => void; onDec: () => void; min?: number; max?: number;
}) {
  return (
    <div className="flex items-center justify-between py-5 border-b border-neutral-100 last:border-b-0">
      <span className="text-base font-medium text-neutral-900">{label}</span>
      <div className="flex items-center gap-4">
        <button onClick={onDec} disabled={value <= min}
          className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all cursor-pointer ${value <= min ? "border-neutral-200 text-neutral-200 cursor-not-allowed" : "border-neutral-400 text-neutral-600 hover:border-neutral-900 hover:text-neutral-900"}`}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" /></svg>
        </button>
        <span className="w-8 text-center text-base font-semibold text-neutral-900 tabular-nums">{value}</span>
        <button onClick={onInc} disabled={value >= max}
          className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all cursor-pointer ${value >= max ? "border-neutral-200 text-neutral-200 cursor-not-allowed" : "border-neutral-400 text-neutral-600 hover:border-neutral-900 hover:text-neutral-900"}`}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Step 0 — Overview
   ═══════════════════════════════════════════════ */
function StepOverview() {
  const phases = [
    { num: 1, title: "Parlaci del tuo alloggio", desc: "Condividi alcune informazioni di base, come la posizione dell'alloggio e quanti ospiti vi possono soggiornare.", color: "from-amber-100 to-orange-100", iconColor: "text-amber-600",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /> },
    { num: 2, title: "Fai in modo che si distingua", desc: "Aggiungi foto, un titolo e una descrizione: ti aiutiamo noi.", color: "from-violet-100 to-purple-100", iconColor: "text-violet-600",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /> },
    { num: 3, title: "Completa e pubblica l'annuncio", desc: "Scegli un prezzo di partenza, verifica i dettagli e pubblica.", color: "from-emerald-100 to-teal-100", iconColor: "text-emerald-600",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /> },
  ];
  return (
    <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 lg:gap-20 max-w-4xl mx-auto w-full">
      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="text-3xl lg:text-5xl font-bold text-neutral-900 leading-tight lg:max-w-xs lg:sticky lg:top-1/3 text-center lg:text-left">
        Iniziare su LuxuryStay è facile
      </motion.h1>
      <div className="w-full max-w-md space-y-6 lg:space-y-8">
        {phases.map((p, i) => (
          <motion.div key={p.num} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.15, duration: 0.5 }} className="flex items-start gap-4 lg:gap-5">
            <span className="text-xl lg:text-2xl font-bold text-neutral-900 mt-1 shrink-0">{p.num}</span>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-neutral-900">{p.title}</h3>
              <p className="text-sm text-neutral-500 mt-1 leading-relaxed">{p.desc}</p>
            </div>
            <div className={`w-28 h-20 lg:w-32 lg:h-24 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center shrink-0`}>
              <svg className={`w-10 h-10 ${p.iconColor}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor">{p.icon}</svg>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Step 1 — Phase 1 Intro + House Animation
   ═══════════════════════════════════════════════ */
function HouseIllustration() {
  return (
    <div className="relative w-64 h-64 lg:w-80 lg:h-80">
      <svg viewBox="0 0 320 320" className="w-full h-full">
        <motion.ellipse cx="160" cy="290" rx="120" ry="15" fill="#f5f5f5" initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ delay: 0.2, duration: 0.6 }} />
        <motion.rect x="70" y="120" width="180" height="160" rx="4" fill="#fafafa" stroke="#e5e5e5" strokeWidth="2" initial={{ opacity: 0, y: 40, scaleY: 0.5 }} animate={{ opacity: 1, y: 0, scaleY: 1 }} transition={{ delay: 0.3, type: "spring", stiffness: 120, damping: 14 }} style={{ transformOrigin: "160px 280px" }} />
        <motion.polygon points="50,125 160,50 270,125" fill="#292524" stroke="#292524" strokeWidth="2" strokeLinejoin="round" initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, type: "spring", stiffness: 100, damping: 12 }} />
        <motion.rect x="140" y="210" width="40" height="70" rx="3" fill="#d97706" stroke="#b45309" strokeWidth="1.5" initial={{ opacity: 0, scaleY: 0 }} animate={{ opacity: 1, scaleY: 1 }} transition={{ delay: 0.7, type: "spring", stiffness: 150, damping: 15 }} style={{ transformOrigin: "160px 280px" }} />
        <motion.circle cx="172" cy="248" r="3" fill="#92400e" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }} />
        <motion.rect x="90" y="155" width="35" height="35" rx="3" fill="#bfdbfe" stroke="#d4d4d4" strokeWidth="1.5" initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8, type: "spring", stiffness: 200, damping: 15 }} style={{ transformOrigin: "107px 172px" }} />
        <motion.line x1="107.5" y1="155" x2="107.5" y2="190" stroke="#d4d4d4" strokeWidth="1.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }} />
        <motion.line x1="90" y1="172.5" x2="125" y2="172.5" stroke="#d4d4d4" strokeWidth="1.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }} />
        <motion.rect x="195" y="155" width="35" height="35" rx="3" fill="#bfdbfe" stroke="#d4d4d4" strokeWidth="1.5" initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.9, type: "spring", stiffness: 200, damping: 15 }} style={{ transformOrigin: "212px 172px" }} />
        <motion.line x1="212.5" y1="155" x2="212.5" y2="190" stroke="#d4d4d4" strokeWidth="1.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} />
        <motion.line x1="195" y1="172.5" x2="230" y2="172.5" stroke="#d4d4d4" strokeWidth="1.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} />
        <motion.rect x="210" y="55" width="22" height="50" rx="2" fill="#78716c" stroke="#57534e" strokeWidth="1.5" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, type: "spring", stiffness: 120, damping: 14 }} />
        <motion.g initial={{ opacity: 0, y: 20, scale: 0.7 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 1.2, type: "spring", stiffness: 100, damping: 12 }}>
          <rect x="30" y="240" width="8" height="40" rx="4" fill="#a3a3a3" /><circle cx="34" cy="225" r="22" fill="#86efac" /><circle cx="26" cy="235" r="16" fill="#4ade80" />
        </motion.g>
        <motion.g initial={{ opacity: 0, y: 20, scale: 0.7 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 1.3, type: "spring", stiffness: 100, damping: 12 }}>
          <rect x="278" y="245" width="8" height="35" rx="4" fill="#a3a3a3" /><circle cx="282" cy="230" r="20" fill="#86efac" /><circle cx="290" cy="238" r="14" fill="#4ade80" />
        </motion.g>
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Step 2 — Category
   ═══════════════════════════════════════════════ */
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
      <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="text-2xl lg:text-3xl font-bold text-neutral-900 text-center mb-8">Che tipo di alloggio è il tuo?</motion.h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        {categories.map((cat, i) => (
          <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <TiltCard
              onClick={() => onSelect(cat.id)}
              intensity={12}
              className={`flex flex-col items-start gap-3 p-4 lg:p-5 rounded-xl border-2 transition-all text-left min-h-[100px] ${selected === cat.id ? "border-neutral-900 bg-neutral-50 shadow-lg" : "border-neutral-200 hover:border-neutral-400 bg-white"}`}>
              <svg className="w-7 h-7 text-neutral-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">{cat.icon}</svg>
              <span className="text-sm font-medium text-neutral-900">{cat.label}</span>
            </TiltCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Step 3 — Space Type
   ═══════════════════════════════════════════════ */
const spaceTypes = [
  { id: "entire", label: "Un intero alloggio", desc: "Gli ospiti avranno a disposizione l'intero alloggio.",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /> },
  { id: "private", label: "Una stanza privata", desc: "Gli ospiti avranno una stanza privata con accesso alle aree comuni.",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" /> },
  { id: "shared", label: "Una stanza condivisa", desc: "Gli ospiti dormono in una stanza o un'area comune condivisa con altri.",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" /> },
];

function StepSpaceType({ selected, onSelect }: { selected: string | null; onSelect: (id: string) => void }) {
  return (
    <div className="max-w-xl mx-auto w-full">
      <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="text-2xl lg:text-3xl font-bold text-neutral-900 text-center mb-8">
        Di che tipo di spazio potranno usufruire gli ospiti?
      </motion.h2>
      <div className="space-y-3">
        {spaceTypes.map((st, i) => (
          <motion.div key={st.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <TiltCard
              onClick={() => onSelect(st.id)}
              intensity={8}
              className={`w-full flex items-center gap-4 p-5 rounded-xl border-2 transition-all text-left ${selected === st.id ? "border-neutral-900 bg-neutral-50 shadow-lg" : "border-neutral-200 hover:border-neutral-400 bg-white"}`}>
              <svg className="w-8 h-8 text-neutral-700 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">{st.icon}</svg>
              <div>
                <p className="text-base font-semibold text-neutral-900">{st.label}</p>
                <p className="text-sm text-neutral-500 mt-0.5">{st.desc}</p>
              </div>
            </TiltCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Step 4 — Location
   ═══════════════════════════════════════════════ */
function LocationSearch({ address, onAddressChange, onLocationSelect }: {
  address: string; onAddressChange: (v: string) => void;
  onLocationSelect: (loc: { lat: number; lng: number; address: string }) => void;
}) {
  const placesLib = useMapsLibrary("places");
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);

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
          if (status === google.maps.places.PlacesServiceStatus.OK && results) { setPredictions(results); setIsOpen(true); }
        }
      );
    }, 200);
  }

  function handleSelect(prediction: google.maps.places.AutocompletePrediction) {
    placesService.current?.getDetails(
      { placeId: prediction.place_id, fields: ["geometry", "formatted_address"] },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
          onLocationSelect({ lat: place.geometry.location.lat(), lng: place.geometry.location.lng(), address: place.formatted_address || prediction.description });
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
        <input type="text" value={address} onChange={(e) => handleInput(e.target.value)} placeholder="Inserisci il tuo indirizzo"
          className="w-full pl-12 pr-4 py-4 bg-white border border-neutral-300 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 shadow-sm" />
      </div>
      {isOpen && predictions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
          {predictions.map((p) => (
            <button key={p.place_id} onClick={() => handleSelect(p)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-50 transition-colors cursor-pointer border-b border-neutral-100 last:border-b-0">
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
  useEffect(() => { if (map && target) { map.panTo(target); map.setZoom(15); } }, [map, target]);
  return null;
}

function StepLocation({ address, onAddressChange, location, onLocationSelect }: {
  address: string; onAddressChange: (v: string) => void;
  location: { lat: number; lng: number } | null;
  onLocationSelect: (loc: { lat: number; lng: number; address: string }) => void;
}) {
  return (
    <div className="max-w-2xl mx-auto w-full">
      <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-2">Dove si trova il tuo alloggio?</motion.h2>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-neutral-500 mb-6">Il tuo indirizzo viene condiviso con gli ospiti solo dopo che hanno effettuato una prenotazione.</motion.p>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl overflow-hidden border border-neutral-200 shadow-sm">
        {GOOGLE_MAPS_API_KEY ? (
          <div className="relative">
            <div className="h-[300px] lg:h-[380px]">
              <Map defaultCenter={location || { lat: 41.9028, lng: 12.4964 }} defaultZoom={location ? 15 : 6} gestureHandling="greedy" disableDefaultUI zoomControl mapId="luxurystay-host-map" style={{ width: "100%", height: "100%" }} />
              <MapPanner target={location} />
            </div>
            <div className="absolute top-4 left-4 right-4">
              <LocationSearch address={address} onAddressChange={onAddressChange} onLocationSelect={onLocationSelect} />
            </div>
          </div>
        ) : (
          <div className="h-[300px] bg-neutral-100 flex items-center justify-center"><p className="text-neutral-400 text-sm">Mappa non disponibile</p></div>
        )}
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Step 5 — Floor Plan
   ═══════════════════════════════════════════════ */
function StepFloorPlan({ params, onChange }: {
  params: { guests: number; bedrooms: number; beds: number; bathrooms: number };
  onChange: (p: typeof params) => void;
}) {
  const u = (k: keyof typeof params, d: number) => onChange({ ...params, [k]: params[k] + d });
  return (
    <div className="max-w-lg mx-auto w-full">
      <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-2xl lg:text-3xl font-bold text-neutral-900 text-center mb-8">Condividi alcune informazioni di base sul tuo alloggio</motion.h2>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-2xl border border-neutral-200 px-6">
        <Counter label="Ospiti" value={params.guests} onInc={() => u("guests", 1)} onDec={() => u("guests", -1)} min={1} max={20} />
        <Counter label="Camere da letto" value={params.bedrooms} onInc={() => u("bedrooms", 1)} onDec={() => u("bedrooms", -1)} max={15} />
        <Counter label="Letti" value={params.beds} onInc={() => u("beds", 1)} onDec={() => u("beds", -1)} min={1} max={20} />
        <Counter label="Bagni" value={params.bathrooms} onInc={() => u("bathrooms", 1)} onDec={() => u("bathrooms", -1)} max={10} />
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Step 7 — Amenities
   ═══════════════════════════════════════════════ */
const amenitiesList = [
  { id: "wifi", label: "Wi-Fi", icon: "M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z" },
  { id: "tv", label: "TV", icon: "M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125Z" },
  { id: "cucina", label: "Cucina", icon: "M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" },
  { id: "lavatrice", label: "Lavatrice", icon: "M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" },
  { id: "aria", label: "Aria condizionata", icon: "M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" },
  { id: "piscina", label: "Piscina", icon: "M12 6v6m0 0a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm-9 5.25c1.5 1.5 3.75 1.5 5.25 0S12 9.75 13.5 11.25s3.75 1.5 5.25 0" },
  { id: "parcheggio", label: "Parcheggio", icon: "M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H21a.75.75 0 0 0 .75-.75v-3a.75.75 0 0 0-.22-.53l-3-3A.75.75 0 0 0 18 11.25H15V6.75" },
  { id: "riscaldamento", label: "Riscaldamento", icon: "M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" },
  { id: "giardino", label: "Giardino", icon: "M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636" },
  { id: "animali", label: "Animali ammessi", icon: "M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V3a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m7.97-7.252a2.25 2.25 0 0 0 0 0" },
];

function StepAmenities({ selected, onToggle }: { selected: string[]; onToggle: (id: string) => void }) {
  return (
    <div className="max-w-2xl mx-auto w-full">
      <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="text-2xl lg:text-3xl font-bold text-neutral-900 text-center mb-2">Indica agli ospiti cosa offre il tuo alloggio</motion.h2>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="text-neutral-500 text-center mb-8">Puoi aggiungere altri servizi dopo la pubblicazione.</motion.p>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {amenitiesList.map((a, i) => (
          <motion.button key={a.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            onClick={() => onToggle(a.id)}
            className={`flex flex-col items-start gap-2.5 p-4 rounded-xl border-2 transition-all cursor-pointer ${selected.includes(a.id) ? "border-neutral-900 bg-neutral-50" : "border-neutral-200 hover:border-neutral-400 bg-white"}`}>
            <svg className="w-6 h-6 text-neutral-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d={a.icon} />
            </svg>
            <span className="text-sm font-medium text-neutral-900">{a.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Step 8 — Photos
   ═══════════════════════════════════════════════ */
function StepPhotos({ photos, onAddPhotos }: { photos: File[]; onAddPhotos: (files: File[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previews = photos.map((f) => URL.createObjectURL(f));

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) onAddPhotos(Array.from(e.target.files));
  }

  return (
    <div className="max-w-2xl mx-auto w-full">
      <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="text-2xl lg:text-3xl font-bold text-neutral-900 text-center mb-2">Aggiungi alcune foto del tuo alloggio</motion.h2>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="text-neutral-500 text-center mb-8">Per iniziare ti serviranno almeno 5 foto. Potrai aggiungerne altre in seguito.</motion.p>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        {photos.length === 0 ? (
          <button onClick={() => inputRef.current?.click()}
            className="w-full h-[300px] border-2 border-dashed border-neutral-300 rounded-2xl flex flex-col items-center justify-center gap-4 hover:border-neutral-400 transition-colors cursor-pointer bg-neutral-50/50">
            <svg className="w-12 h-12 text-neutral-400" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M18 12.75h.008v.008H18v-.008Zm-9-6h.008v.008H9V6.75Z" />
            </svg>
            <div className="text-center">
              <p className="text-base font-semibold text-neutral-900">Carica le tue foto</p>
              <p className="text-sm text-neutral-500 mt-1">Trascina qui oppure clicca per selezionare</p>
            </div>
          </button>
        ) : (
          <div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {previews.map((url, i) => (
                <div key={i} className="aspect-[4/3] rounded-xl overflow-hidden bg-neutral-100">
                  <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
              <button onClick={() => inputRef.current?.click()}
                className="aspect-[4/3] rounded-xl border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center gap-2 hover:border-neutral-400 transition-colors cursor-pointer">
                <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="text-xs text-neutral-500">Aggiungi</span>
              </button>
            </div>
            <p className="text-sm text-neutral-500 mt-3 text-center">{photos.length} foto caricata{photos.length !== 1 ? "e" : ""}</p>
          </div>
        )}
      </motion.div>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Step 9 — Title
   ═══════════════════════════════════════════════ */
function StepTitle({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const maxLen = 50;
  return (
    <div className="max-w-xl mx-auto w-full">
      <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="text-2xl lg:text-3xl font-bold text-neutral-900 text-center mb-2">Dai un titolo al tuo annuncio</motion.h2>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="text-neutral-500 text-center mb-8">Titoli brevi funzionano meglio. Non preoccuparti, potrai sempre modificarlo.</motion.p>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <textarea value={value} onChange={(e) => onChange(e.target.value.slice(0, maxLen))} rows={3} placeholder="Es. Villa panoramica con piscina"
          className="w-full px-5 py-4 bg-white border-2 border-neutral-200 rounded-xl text-xl font-semibold text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:border-neutral-900 transition-colors resize-none" />
        <p className={`text-sm mt-2 text-right ${value.length >= maxLen ? "text-red-500" : "text-neutral-400"}`}>{value.length}/{maxLen}</p>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Step 10 — Description
   ═══════════════════════════════════════════════ */
function StepDescription({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const maxLen = 500;
  return (
    <div className="max-w-xl mx-auto w-full">
      <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="text-2xl lg:text-3xl font-bold text-neutral-900 text-center mb-2">Crea la tua descrizione</motion.h2>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="text-neutral-500 text-center mb-8">Descrivi cosa rende speciale il tuo alloggio.</motion.p>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <textarea value={value} onChange={(e) => onChange(e.target.value.slice(0, maxLen))} rows={6} placeholder="Descrivi gli spazi, il quartiere, cosa possono aspettarsi gli ospiti..."
          className="w-full px-5 py-4 bg-white border-2 border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors resize-none leading-relaxed" />
        <p className={`text-sm mt-2 text-right ${value.length >= maxLen ? "text-red-500" : "text-neutral-400"}`}>{value.length}/{maxLen}</p>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Step 12 — Price
   ═══════════════════════════════════════════════ */
function StepPrice({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  function handleChange(raw: string) {
    const cleaned = raw.replace(/[^\d]/g, "");
    onChange(cleaned);
  }
  return (
    <div className="max-w-md mx-auto w-full text-center">
      <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-2">Adesso, stabilisci il tuo prezzo</motion.h2>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="text-neutral-500 mb-10">Puoi modificarlo in qualsiasi momento.</motion.p>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
        className="inline-flex items-baseline gap-2">
        <span className="text-5xl lg:text-7xl font-bold text-neutral-900">€</span>
        <input type="text" inputMode="numeric" value={value} onChange={(e) => handleChange(e.target.value)}
          placeholder="0" className="text-5xl lg:text-7xl font-bold text-neutral-900 bg-transparent border-none outline-none w-48 text-left placeholder:text-neutral-300 tabular-nums" />
      </motion.div>
      <p className="text-sm text-neutral-500 mt-4">per notte</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Step 13 — Review
   ═══════════════════════════════════════════════ */
function StepReview({ data }: { data: {
  category: string | null; spaceType: string | null; address: string;
  params: { guests: number; bedrooms: number; beds: number; bathrooms: number };
  amenities: string[]; photos: File[]; title: string; description: string; price: string;
}}) {
  const catLabel = categories.find((c) => c.id === data.category)?.label ?? "—";
  const spaceLabel = spaceTypes.find((s) => s.id === data.spaceType)?.label ?? "—";
  const rows = [
    { label: "Tipo", value: `${catLabel} · ${spaceLabel}` },
    { label: "Posizione", value: data.address || "—" },
    { label: "Ospiti", value: `${data.params.guests} ospiti · ${data.params.bedrooms} camere · ${data.params.beds} letti · ${data.params.bathrooms} bagni` },
    { label: "Servizi", value: data.amenities.length > 0 ? data.amenities.map((a) => amenitiesList.find((am) => am.id === a)?.label).join(", ") : "—" },
    { label: "Foto", value: `${data.photos.length} foto` },
    { label: "Titolo", value: data.title || "—" },
    { label: "Prezzo", value: data.price ? `€${data.price} / notte` : "—" },
  ];

  return (
    <div className="max-w-xl mx-auto w-full">
      <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="text-2xl lg:text-3xl font-bold text-neutral-900 text-center mb-2">Controlla il tuo annuncio</motion.h2>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="text-neutral-500 text-center mb-8">Ecco un riepilogo di quello che hai inserito. Puoi tornare indietro per modificare qualsiasi cosa.</motion.p>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-neutral-200 divide-y divide-neutral-100">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start justify-between px-5 py-4 gap-4">
            <span className="text-sm font-medium text-neutral-500 shrink-0">{r.label}</span>
            <span className="text-sm text-neutral-900 text-right">{r.value}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Main Flow Controller
   ═══════════════════════════════════════════════ */
export function AddPropertyFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  // All form data
  const [category, setCategory] = useState<string | null>(null);
  const [spaceType, setSpaceType] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [params, setParams] = useState({ guests: 1, bedrooms: 1, beds: 1, bathrooms: 1 });
  const [amenities, setAmenities] = useState<string[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  function toggleAmenity(id: string) {
    setAmenities((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]);
  }

  function canProceed(): boolean {
    switch (step) {
      case 0: return true;  // overview
      case 1: return true;  // phase 1 intro
      case 2: return category !== null;
      case 3: return spaceType !== null;
      case 4: return address.trim().length > 0;
      case 5: return params.guests >= 1;
      case 6: return true;  // phase 2 intro
      case 7: return true;  // amenities (optional)
      case 8: return photos.length >= 1; // ideally 5, but allow 1 for testing
      case 9: return title.trim().length > 0;
      case 10: return description.trim().length > 0;
      case 11: return true; // phase 3 intro
      case 12: return price.length > 0 && parseInt(price) > 0;
      case 13: return true; // review
      default: return false;
    }
  }

  function handleNext() {
    if (step < TOTAL_STEPS - 1) { setDirection(1); setStep(step + 1); }
  }
  function handleBack() {
    if (step > 0) { setDirection(-1); setStep(step - 1); }
  }
  function handleLocationSelect(loc: { lat: number; lng: number; address: string }) {
    setLocation({ lat: loc.lat, lng: loc.lng }); setAddress(loc.address);
  }

  const progress = (step / (TOTAL_STEPS - 1)) * 100;

  // Step label for button
  const btnLabel = step === 0 ? "Inizia" : step === TOTAL_STEPS - 1 ? "Pubblica annuncio" : "Avanti";

  const content = (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-5 lg:px-10 h-16 lg:h-20 shrink-0">
        <span className="text-lg font-light tracking-tight text-neutral-900">LuxuryStay</span>
        <button onClick={() => router.push("/dashboard")}
          className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors cursor-pointer min-h-[44px] flex items-center">
          Salva ed esci
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto flex items-center justify-center px-5 lg:px-10 py-8">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div key={step} custom={direction}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: d > 0 ? 60 : -60 }),
              center: { opacity: 1, x: 0 },
              exit: (d: number) => ({ opacity: 0, x: d > 0 ? -60 : 60 }),
            }}
            initial="enter" animate="center" exit="exit" transition={pageTransition} className="w-full">

            {step === 0 && <StepOverview />}

            {step === 1 && (
              <PhaseIntro phase="Primo" title="Parlaci del tuo alloggio"
                desc="In questa fase, ti chiederemo che tipo di spazio offri e se, prenotandolo, gli ospiti avranno a disposizione l'intero alloggio o solo una stanza. Dopodiché, dovrai comunicarci la posizione e quante persone vi possono soggiornare.">
                <HouseIllustration />
              </PhaseIntro>
            )}

            {step === 2 && <StepCategory selected={category} onSelect={setCategory} />}
            {step === 3 && <StepSpaceType selected={spaceType} onSelect={setSpaceType} />}
            {step === 4 && <StepLocation address={address} onAddressChange={setAddress} location={location} onLocationSelect={handleLocationSelect} />}
            {step === 5 && <StepFloorPlan params={params} onChange={setParams} />}

            {step === 6 && (
              <PhaseIntro phase="Secondo" title="Fai in modo che si distingua"
                desc="In questa fase aggiungerai i servizi offerti dal tuo alloggio, oltre a 5 o più foto. Dovrai anche pensare a un titolo e una descrizione.">
                <div className="w-64 h-64 lg:w-80 lg:h-80 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-50 flex items-center justify-center">
                  <svg className="w-24 h-24 text-violet-400" fill="none" viewBox="0 0 24 24" strokeWidth={0.8} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M18 12.75h.008v.008H18v-.008Zm-9-6h.008v.008H9V6.75Z" />
                  </svg>
                </div>
              </PhaseIntro>
            )}

            {step === 7 && <StepAmenities selected={amenities} onToggle={toggleAmenity} />}
            {step === 8 && <StepPhotos photos={photos} onAddPhotos={(files) => setPhotos((prev) => [...prev, ...files])} />}
            {step === 9 && <StepTitle value={title} onChange={setTitle} />}
            {step === 10 && <StepDescription value={description} onChange={setDescription} />}

            {step === 11 && (
              <PhaseIntro phase="Ultimo" title="Completa e pubblica"
                desc="Infine, scegli il tuo prezzo di partenza e pubblica il tuo annuncio.">
                <div className="w-64 h-64 lg:w-80 lg:h-80 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-50 flex items-center justify-center">
                  <svg className="w-24 h-24 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={0.8} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
              </PhaseIntro>
            )}

            {step === 12 && <StepPrice value={price} onChange={setPrice} />}
            {step === 13 && <StepReview data={{ category, spaceType, address, params, amenities, photos, title, description, price }} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Bar */}
      <footer className="shrink-0 border-t border-neutral-200">
        <div className="h-1 bg-neutral-100">
          <motion.div className="h-full bg-neutral-900" initial={false} animate={{ width: `${progress}%` }} transition={{ duration: 0.4, ease: "easeInOut" }} />
        </div>
        <div className="flex items-center justify-between px-5 lg:px-10 py-4 lg:py-5">
          {step > 0 ? (
            <button onClick={handleBack}
              className="text-sm font-semibold text-neutral-900 underline underline-offset-4 hover:text-neutral-600 transition-colors cursor-pointer min-h-[44px] flex items-center">Indietro</button>
          ) : <div />}
          <button onClick={handleNext} disabled={!canProceed()}
            className={`px-6 lg:px-8 py-3 lg:py-3.5 rounded-lg text-sm font-semibold transition-all min-h-[48px] ${
              canProceed()
                ? step === TOTAL_STEPS - 1
                  ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white hover:from-rose-600 hover:to-pink-700 active:scale-[0.97] cursor-pointer"
                  : "bg-neutral-900 text-white hover:bg-neutral-800 active:scale-[0.97] cursor-pointer"
                : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
            }`}>
            {btnLabel}
          </button>
        </div>
      </footer>
    </div>
  );

  if (GOOGLE_MAPS_API_KEY) {
    return <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={["places"]}>{content}</APIProvider>;
  }
  return content;
}
