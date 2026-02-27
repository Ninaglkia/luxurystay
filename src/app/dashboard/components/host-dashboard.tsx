"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Property {
  id: string;
  title: string;
  address: string;
  price: number;
  category: string;
  photos: string[];
  status: string;
  created_at: string;
  guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
}

export function HostDashboard() {
  const supabase = createClient();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("properties")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) setProperties(data);
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-neutral-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
        <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-neutral-400" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Nessun immobile pubblicato</h3>
        <p className="text-neutral-500 text-sm mb-6 max-w-sm">
          Inizia ad aggiungere il tuo primo immobile per ricevere prenotazioni.
        </p>
        <Link
          href="/dashboard/add-property"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Aggiungi immobile
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <p className="text-2xl font-bold text-neutral-900">{properties.length}</p>
          <p className="text-xs text-neutral-500 mt-1">Immobili totali</p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <p className="text-2xl font-bold text-emerald-600">{properties.filter(p => p.status === "active").length}</p>
          <p className="text-xs text-neutral-500 mt-1">Attivi</p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <p className="text-2xl font-bold text-neutral-900">0</p>
          <p className="text-xs text-neutral-500 mt-1">Prenotazioni</p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <p className="text-2xl font-bold text-neutral-900">€ 0</p>
          <p className="text-xs text-neutral-500 mt-1">Guadagni</p>
        </div>
      </div>

      {/* Property list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-900">I tuoi immobili</h2>
          <Link
            href="/dashboard/add-property"
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            + Aggiungi
          </Link>
        </div>
        <div className="space-y-3">
          {properties.map((property) => (
            <div key={property.id} className="bg-white rounded-xl border border-neutral-200 overflow-hidden flex">
              {/* Photo */}
              <div className="w-28 h-28 lg:w-40 lg:h-32 shrink-0 bg-neutral-100">
                {property.photos[0] ? (
                  <img src={property.photos[0]} alt={property.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-neutral-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M18 12.75h.008v.008H18v-.008Zm-9-6h.008v.008H9V6.75Z" />
                    </svg>
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-neutral-900 truncate">{property.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                      property.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-500"
                    }`}>
                      {property.status === "active" ? "Attivo" : property.status === "paused" ? "In pausa" : "Bozza"}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-500 truncate mt-0.5">{property.address}</p>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm text-neutral-500">
                    {property.guests} ospiti · {property.bedrooms} camere · {property.beds} letti
                  </p>
                  <p className="text-sm font-semibold text-neutral-900">€{property.price}<span className="text-neutral-400 font-normal">/notte</span></p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
