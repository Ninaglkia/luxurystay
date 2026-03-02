"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { CitySearch } from "./city-search";
import { DatePicker } from "./date-picker";
import { GuestsPicker, type GuestsCount } from "./guests-picker";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const DEFAULT_CENTER = { lat: 41.9028, lng: 12.4964 };
const DEFAULT_ZOOM = 6;

interface MapProperty {
  id: string;
  title: string;
  price: number;
  lat: number;
  lng: number;
  photos: string[];
  category: string;
  address: string;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  guests: number;
  amenities: string[];
}

/* ═══════════════ Filter types ═══════════════ */

interface Filters {
  priceMin: number;
  priceMax: number;
  category: string;
  bedroomsMin: number;
  guestsMin: number;
  amenities: string[];
}

const DEFAULT_FILTERS: Filters = {
  priceMin: 0,
  priceMax: 10000,
  category: "",
  bedroomsMin: 0,
  guestsMin: 0,
  amenities: [],
};

const CATEGORIES = [
  { value: "", label: "Tutte" },
  { value: "villa", label: "Villa" },
  { value: "appartamento", label: "Appartamento" },
  { value: "casa", label: "Casa" },
  { value: "loft", label: "Loft" },
  { value: "baita", label: "Baita" },
  { value: "bb", label: "B&B" },
  { value: "castello", label: "Castello" },
  { value: "barca", label: "Barca" },
  { value: "camper", label: "Camper" },
];

const FILTER_AMENITIES = [
  { value: "piscina", label: "Piscina" },
  { value: "wifi", label: "Wi-Fi" },
  { value: "aria", label: "Aria condiz." },
  { value: "parcheggio", label: "Parcheggio" },
  { value: "giardino", label: "Giardino" },
  { value: "animali", label: "Animali" },
  { value: "cucina", label: "Cucina" },
  { value: "lavatrice", label: "Lavatrice" },
];

/* ═══════════════ FiltersPanel ═══════════════ */

function FiltersPanel({ filters, onChange, onClose, resultCount }: {
  filters: Filters;
  onChange: (f: Filters) => void;
  onClose: () => void;
  resultCount: number;
}) {
  const [local, setLocal] = useState<Filters>(filters);

  function toggleAmenity(a: string) {
    setLocal(prev => ({
      ...prev,
      amenities: prev.amenities.includes(a)
        ? prev.amenities.filter(x => x !== a)
        : [...prev.amenities, a],
    }));
  }

  function handleApply() {
    onChange(local);
    onClose();
  }

  function handleReset() {
    setLocal(DEFAULT_FILTERS);
    onChange(DEFAULT_FILTERS);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="relative bg-white rounded-t-2xl lg:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-neutral-200 flex items-center justify-between px-5 py-4 z-10">
          <button onClick={onClose} className="text-sm font-medium text-neutral-500 hover:text-neutral-900 cursor-pointer">Chiudi</button>
          <h3 className="text-base font-semibold text-neutral-900">Filtri</h3>
          <button onClick={handleReset} className="text-sm font-medium text-neutral-500 hover:text-neutral-900 cursor-pointer">Resetta</button>
        </div>

        <div className="p-5 space-y-6">
          {/* Price range */}
          <div>
            <h4 className="text-sm font-semibold text-neutral-900 mb-3">Fascia di prezzo (a notte)</h4>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs text-neutral-500 mb-1 block">Min</label>
                <input type="number" min={0} step={10} value={local.priceMin || ""}
                  onChange={e => setLocal(p => ({ ...p, priceMin: Number(e.target.value) || 0 }))}
                  placeholder="0"
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-900 focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 outline-none" />
              </div>
              <span className="text-neutral-400 mt-5">&mdash;</span>
              <div className="flex-1">
                <label className="text-xs text-neutral-500 mb-1 block">Max</label>
                <input type="number" min={0} step={10} value={local.priceMax >= 10000 ? "" : local.priceMax}
                  onChange={e => setLocal(p => ({ ...p, priceMax: Number(e.target.value) || 10000 }))}
                  placeholder="Qualsiasi"
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-900 focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 outline-none" />
              </div>
            </div>
            {/* Quick price buttons */}
            <div className="flex gap-2 mt-2">
              {[100, 200, 500, 1000].map(v => (
                <button key={v} onClick={() => setLocal(p => ({ ...p, priceMax: v }))}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                    local.priceMax === v ? "bg-neutral-900 text-white border-neutral-900" : "bg-white text-neutral-600 border-neutral-300 hover:border-neutral-400"
                  }`}>
                  &le; &euro;{v}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <h4 className="text-sm font-semibold text-neutral-900 mb-3">Tipologia</h4>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button key={c.value} onClick={() => setLocal(p => ({ ...p, category: c.value }))}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
                    local.category === c.value ? "bg-neutral-900 text-white border-neutral-900" : "bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400"
                  }`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bedrooms & Guests */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-neutral-900 mb-3">Camere min.</h4>
              <div className="flex items-center gap-2">
                {[0, 1, 2, 3, 4].map(n => (
                  <button key={n} onClick={() => setLocal(p => ({ ...p, bedroomsMin: n }))}
                    className={`w-10 h-10 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
                      local.bedroomsMin === n ? "bg-neutral-900 text-white border-neutral-900" : "bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400"
                    }`}>
                    {n === 0 ? "–" : n + "+"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-neutral-900 mb-3">Ospiti min.</h4>
              <div className="flex items-center gap-2">
                {[0, 2, 4, 6, 8].map(n => (
                  <button key={n} onClick={() => setLocal(p => ({ ...p, guestsMin: n }))}
                    className={`w-10 h-10 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
                      local.guestsMin === n ? "bg-neutral-900 text-white border-neutral-900" : "bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400"
                    }`}>
                    {n === 0 ? "–" : n + "+"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div>
            <h4 className="text-sm font-semibold text-neutral-900 mb-3">Servizi</h4>
            <div className="grid grid-cols-2 gap-2">
              {FILTER_AMENITIES.map(a => (
                <button key={a.value} onClick={() => toggleAmenity(a.value)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-colors cursor-pointer ${
                    local.amenities.includes(a.value) ? "bg-neutral-900 text-white border-neutral-900" : "bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400"
                  }`}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-neutral-200 px-5 py-4 flex items-center justify-between">
          <button onClick={handleReset} className="text-sm font-medium text-neutral-700 underline cursor-pointer">
            Cancella tutto
          </button>
          <button onClick={handleApply}
            className="px-6 py-3 bg-neutral-900 text-white rounded-lg text-sm font-semibold hover:bg-neutral-800 transition-colors cursor-pointer">
            Mostra {resultCount} alloggi
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ Map sub-components ═══════════════ */

function UserLocationDot() {
  const map = useMap();
  const markerRef = useRef<google.maps.Marker | null>(null);
  const accuracyCircleRef = useRef<google.maps.Circle | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const initialZoomDone = useRef(false);

  useEffect(() => {
    if (!map || !navigator.geolocation) return;

    markerRef.current = new google.maps.Marker({
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#4285F4",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 3,
      },
      zIndex: 999,
      title: "La tua posizione",
    });

    accuracyCircleRef.current = new google.maps.Circle({
      map,
      fillColor: "#4285F4",
      fillOpacity: 0.08,
      strokeColor: "#4285F4",
      strokeOpacity: 0.2,
      strokeWeight: 1,
      zIndex: 998,
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
        markerRef.current?.setPosition(pos);
        accuracyCircleRef.current?.setCenter(pos);
        accuracyCircleRef.current?.setRadius(position.coords.accuracy);
        if (!initialZoomDone.current) initialZoomDone.current = true;
      },
      () => {},
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 3000 }
    );

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
        markerRef.current?.setPosition(pos);
        accuracyCircleRef.current?.setCenter(pos);
        accuracyCircleRef.current?.setRadius(position.coords.accuracy);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
    );

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      markerRef.current?.setMap(null);
      accuracyCircleRef.current?.setMap(null);
    };
  }, [map]);

  return null;
}

function MapController({ target }: { target: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !target) return;
    map.panTo(target);
    map.setZoom(13);
  }, [map, target]);
  return null;
}

function MyLocationButton() {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  function handleClick() {
    if (!map || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        map.panTo({ lat: position.coords.latitude, lng: position.coords.longitude });
        map.setZoom(15);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }

  return (
    <button
      onClick={handleClick}
      className="absolute bottom-4 right-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-neutral-50 transition-colors cursor-pointer z-10 active:scale-95"
      title="La mia posizione"
    >
      {locating ? (
        <div className="w-4 h-4 border-2 border-neutral-300 border-t-blue-500 rounded-full animate-spin" />
      ) : (
        <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 16v2M2 12h2m16 0h2" />
        </svg>
      )}
    </button>
  );
}

/* ═══════════════ 3D Markers ═══════════════ */

function PropertyMarkers({ properties }: { properties: MapProperty[] }) {
  const map = useMap();
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!map) return;

    if (!overlayRef.current) {
      const el = document.createElement("div");
      el.style.cssText = "position:fixed;z-index:9999;pointer-events:none;opacity:0;transition:opacity .2s;";
      document.body.appendChild(el);
      overlayRef.current = el;
    }

    async function renderMarkers() {
      await google.maps.importLibrary("marker");

      markersRef.current.forEach(m => (m.map = null));
      markersRef.current = [];

      properties.forEach((prop) => {
        const el = document.createElement("div");
        el.style.cssText = "cursor:pointer;transition:transform .2s;";
        el.innerHTML = `
          <div style="perspective:60px;">
            <div style="width:42px;height:42px;background:#171717;border-radius:10px;display:flex;align-items:center;justify-content:center;transform:rotateX(12deg);box-shadow:0 6px 16px rgba(0,0,0,.35),0 2px 4px rgba(0,0,0,.2);border:2px solid #fff;transition:transform .2s,box-shadow .2s;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <div style="width:10px;height:10px;background:#171717;border-radius:50%;margin:-4px auto 0;box-shadow:0 2px 6px rgba(0,0,0,.3);"></div>
          </div>
        `;

        const marker = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: { lat: prop.lat, lng: prop.lng },
          content: el,
          title: prop.title,
          zIndex: 100,
        });

        el.addEventListener("mouseenter", (e) => {
          const inner = el.querySelector("div > div") as HTMLElement;
          if (inner) {
            inner.style.transform = "rotateX(0deg) scale(1.15)";
            inner.style.boxShadow = "0 10px 24px rgba(0,0,0,.4),0 4px 8px rgba(0,0,0,.25)";
          }
          el.style.zIndex = "200";
          const overlay = overlayRef.current;
          if (!overlay) return;
          const photoHtml = prop.photos[0]
            ? `<img src="${prop.photos[0]}" style="width:100%;height:120px;object-fit:cover;border-radius:8px 8px 0 0;" />`
            : `<div style="width:100%;height:120px;background:#f5f5f5;border-radius:8px 8px 0 0;display:flex;align-items:center;justify-content:center;"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d4d4d4" stroke-width="1"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg></div>`;
          overlay.innerHTML = `
            <div style="width:220px;background:#fff;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.18);overflow:hidden;">
              ${photoHtml}
              <div style="padding:10px 12px;">
                <p style="font-weight:600;font-size:13px;color:#171717;margin:0 0 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${prop.title}</p>
                <p style="font-size:13px;color:#525252;margin:0;"><strong style="color:#171717;">€${prop.price}</strong> / notte</p>
              </div>
            </div>
          `;
          overlay.style.left = `${(e as MouseEvent).clientX + 16}px`;
          overlay.style.top = `${(e as MouseEvent).clientY - 20}px`;
          overlay.style.opacity = "1";
        });

        el.addEventListener("mousemove", (e) => {
          const overlay = overlayRef.current;
          if (overlay) {
            overlay.style.left = `${(e as MouseEvent).clientX + 16}px`;
            overlay.style.top = `${(e as MouseEvent).clientY - 20}px`;
          }
        });

        el.addEventListener("mouseleave", () => {
          const inner = el.querySelector("div > div") as HTMLElement;
          if (inner) {
            inner.style.transform = "rotateX(12deg)";
            inner.style.boxShadow = "0 6px 16px rgba(0,0,0,.35),0 2px 4px rgba(0,0,0,.2)";
          }
          el.style.zIndex = "100";
          const overlay = overlayRef.current;
          if (overlay) overlay.style.opacity = "0";
        });

        el.addEventListener("click", () => {
          window.location.href = `/property/${prop.id}`;
        });

        markersRef.current.push(marker);
      });
    }

    renderMarkers();

    return () => {
      markersRef.current.forEach(m => (m.map = null));
    };
  }, [map, properties]);

  useEffect(() => {
    return () => {
      overlayRef.current?.remove();
      overlayRef.current = null;
    };
  }, []);

  return null;
}

/* ═══════════════ Bounds watcher ═══════════════ */

interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

function BoundsWatcher({ onBoundsChange }: { onBoundsChange: (b: Bounds) => void }) {
  const map = useMap();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!map) return;

    function handleIdle() {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const b = map!.getBounds();
        if (!b) return;
        const ne = b.getNorthEast();
        const sw = b.getSouthWest();
        onBoundsChange({
          north: ne.lat(),
          south: sw.lat(),
          east: ne.lng(),
          west: sw.lng(),
        });
      }, 300);
    }

    const listener = map.addListener("idle", handleIdle);
    // Trigger initial bounds
    handleIdle();

    return () => {
      google.maps.event.removeListener(listener);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [map, onBoundsChange]);

  return null;
}

/* ═══════════════ Property card for list ═══════════════ */

function PropertyCard({ property, isFav, onToggleFav }: {
  property: MapProperty;
  isFav: boolean;
  onToggleFav: (id: string) => void;
}) {
  return (
    <Link href={`/property/${property.id}`} className="group block">
      {/* Photo */}
      <div className="aspect-[4/3] rounded-xl overflow-hidden bg-neutral-100 mb-2.5 relative">
        {property.photos[0] ? (
          <img src={property.photos[0]} alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-10 h-10 text-neutral-300" fill="none" viewBox="0 0 24 24" strokeWidth={0.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M18 12.75h.008v.008H18v-.008Zm-9-6h.008v.008H9V6.75Z" />
            </svg>
          </div>
        )}
        {/* Favorite heart */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFav(property.id); }}
          className="absolute top-2.5 right-2.5 w-8 h-8 flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
        >
          <svg className={`w-6 h-6 drop-shadow-md transition-colors ${isFav ? "text-red-500 fill-red-500" : "text-white"}`}
            fill={isFav ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
          </svg>
        </button>
      </div>
      {/* Info */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-[15px] text-neutral-900 truncate">{property.title}</p>
        </div>
        <p className="text-sm text-neutral-500 mt-0.5 truncate">{property.address}</p>
        <p className="text-sm text-neutral-500 mt-0.5">
          {property.bedrooms} camere · {property.beds} letti · {property.bathrooms} bagni
        </p>
        <p className="mt-1.5">
          <span className="font-semibold text-[15px] text-neutral-900">€{property.price}</span>
          <span className="text-sm text-neutral-500"> notte</span>
        </p>
      </div>
    </Link>
  );
}

/* ═══════════════ Card skeleton ═══════════════ */

function CardSkeleton() {
  return (
    <div>
      <div className="aspect-[4/3] rounded-xl bg-neutral-100 animate-pulse mb-2.5" />
      <div className="h-4 w-3/4 bg-neutral-100 rounded animate-pulse mb-1.5" />
      <div className="h-3.5 w-1/2 bg-neutral-100 rounded animate-pulse mb-1.5" />
      <div className="h-4 w-1/3 bg-neutral-100 rounded animate-pulse" />
    </div>
  );
}

/* ═══════════════ Map skeleton ═══════════════ */

function MapSkeleton() {
  return (
    <div className="absolute inset-0 bg-neutral-100 animate-pulse flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-3 border-neutral-300 border-t-neutral-600 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-neutral-400">Caricamento mappa...</p>
      </div>
    </div>
  );
}

/* ═══════════════ Main ExploreMap ═══════════════ */

export function ExploreMap() {
  const [target, setTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [guests, setGuests] = useState<GuestsCount>({ adults: 0, children: 0, infants: 0, pets: 0 });
  const [mapLoaded, setMapLoaded] = useState(false);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  // Wishlist
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());

  // All properties loaded once
  const [allProperties, setAllProperties] = useState<MapProperty[]>([]);
  const [loadingProps, setLoadingProps] = useState(true);
  // Current map bounds
  const [bounds, setBounds] = useState<Bounds | null>(null);

  // Load all properties + wishlist once
  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("properties")
        .select("id, title, price, lat, lng, photos, category, address, bedrooms, beds, bathrooms, guests, amenities")
        .eq("status", "active");
      if (data) setAllProperties(data);

      // Load user wishlist
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: favs } = await supabase
          .from("wishlists")
          .select("property_id")
          .eq("user_id", user.id);
        if (favs) setWishlist(new Set(favs.map(f => f.property_id)));
      }

      setLoadingProps(false);
    }
    load();
  }, []);

  const toggleWishlist = useCallback(async (propertyId: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/login";
      return;
    }

    const isFav = wishlist.has(propertyId);
    if (isFav) {
      await supabase.from("wishlists").delete()
        .eq("user_id", user.id).eq("property_id", propertyId);
      setWishlist(prev => { const next = new Set(prev); next.delete(propertyId); return next; });
    } else {
      await supabase.from("wishlists").insert({ user_id: user.id, property_id: propertyId });
      setWishlist(prev => new Set(prev).add(propertyId));
    }
  }, [wishlist]);

  // Filter properties within current bounds + user filters
  const visibleProperties = (() => {
    let result = bounds
      ? allProperties.filter(
          (p) => p.lat >= bounds.south && p.lat <= bounds.north && p.lng >= bounds.west && p.lng <= bounds.east
        )
      : allProperties;

    // Apply price filter
    if (filters.priceMin > 0) result = result.filter(p => p.price >= filters.priceMin);
    if (filters.priceMax < 10000) result = result.filter(p => p.price <= filters.priceMax);
    // Category
    if (filters.category) result = result.filter(p => p.category?.toLowerCase() === filters.category);
    // Bedrooms
    if (filters.bedroomsMin > 0) result = result.filter(p => p.bedrooms >= filters.bedroomsMin);
    // Guests
    if (filters.guestsMin > 0) result = result.filter(p => (p.guests || 0) >= filters.guestsMin);
    // Amenities
    if (filters.amenities.length > 0) {
      result = result.filter(p => {
        const propAmenities = (p.amenities || []).map(a => a.toLowerCase());
        return filters.amenities.every(a => propAmenities.some(pa => pa.includes(a)));
      });
    }

    return result;
  })();

  const handlePlaceSelect = useCallback(
    (location: { lat: number; lng: number; name: string }) => {
      setTarget({ lat: location.lat, lng: location.lng });
    },
    []
  );

  const handleBoundsChange = useCallback((b: Bounds) => {
    setBounds(b);
  }, []);

  function handleDatesChange(newCheckIn: Date | null, newCheckOut: Date | null) {
    setCheckIn(newCheckIn);
    setCheckOut(newCheckOut);
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="flex-1 flex items-center justify-center bg-neutral-100 rounded-xl">
        <div className="text-center p-8">
          <p className="text-neutral-500 text-sm">
            Google Maps API key mancante. Aggiungi{" "}
            <code className="bg-neutral-200 px-1.5 py-0.5 rounded text-xs">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>{" "}
            al file <code className="bg-neutral-200 px-1.5 py-0.5 rounded text-xs">.env.local</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={["places", "marker"]}>
      <div className="flex-1 flex flex-col min-h-0">
        {/* Search controls */}
        <div className="flex flex-col lg:flex-row lg:items-start gap-2 lg:gap-3 mb-3 lg:mb-4">
          <CitySearch onPlaceSelect={handlePlaceSelect} />
          <div className="grid grid-cols-3 lg:flex gap-2 lg:gap-3">
            <DatePicker checkIn={checkIn} checkOut={checkOut} onDatesChange={handleDatesChange} />
            <GuestsPicker guests={guests} onGuestsChange={setGuests} />
            <button
              onClick={() => setShowFilters(true)}
              className="relative flex items-center justify-center gap-2 h-11 px-4 bg-white border border-neutral-300 rounded-xl text-sm font-medium text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
              </svg>
              <span className="hidden sm:inline">Filtri</span>
              {(() => {
                const count = (filters.priceMin > 0 ? 1 : 0) + (filters.priceMax < 10000 ? 1 : 0) + (filters.category ? 1 : 0) + (filters.bedroomsMin > 0 ? 1 : 0) + (filters.guestsMin > 0 ? 1 : 0) + filters.amenities.length;
                return count > 0 ? (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 bg-neutral-900 text-white text-[11px] font-bold rounded-full flex items-center justify-center px-1">
                    {count}
                  </span>
                ) : null;
              })()}
            </button>
          </div>
        </div>

        {/* Split layout: list left + map right */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
          {/* Left — Property list */}
          <div className="lg:w-[55%] xl:w-[50%] shrink-0 overflow-y-auto lg:pr-2 order-2 lg:order-1">
            {/* Header */}
            <div className="mb-4">
              {loadingProps ? (
                <div className="h-5 w-64 bg-neutral-100 rounded animate-pulse" />
              ) : visibleProperties.length > 0 ? (
                <p className="text-sm font-medium text-neutral-700">
                  {visibleProperties.length > 100
                    ? "Oltre 100 alloggi nell'area selezionata della mappa"
                    : `${visibleProperties.length} alloggi${visibleProperties.length === 1 ? "o" : ""} nell'area selezionata della mappa`}
                </p>
              ) : bounds ? (
                <p className="text-sm text-neutral-500">Nessun alloggio in quest'area. Prova a spostarti o a zoomare.</p>
              ) : null}
            </div>

            {/* Cards grid */}
            {loadingProps ? (
              <div className="grid grid-cols-2 gap-x-5 gap-y-8">
                {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
              </div>
            ) : visibleProperties.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-5 gap-y-8">
                {visibleProperties.map((prop) => (
                  <PropertyCard key={prop.id} property={prop} isFav={wishlist.has(prop.id)} onToggleFav={toggleWishlist} />
                ))}
              </div>
            ) : bounds ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <svg className="w-16 h-16 text-neutral-200 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={0.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
                <p className="text-neutral-500 text-sm">Nessun alloggio disponibile in quest&apos;area</p>
                <p className="text-neutral-400 text-xs mt-1">Prova a cercare in un&apos;altra zona o a zoomare</p>
              </div>
            ) : null}
          </div>

          {/* Right — Map */}
          <div className="flex-1 relative rounded-xl overflow-hidden shadow-sm border border-neutral-200 min-h-[280px] lg:min-h-0 order-1 lg:order-2">
            {!mapLoaded && <MapSkeleton />}
            <Map
              defaultCenter={DEFAULT_CENTER}
              defaultZoom={DEFAULT_ZOOM}
              gestureHandling="greedy"
              disableDefaultUI={false}
              mapTypeControl={false}
              streetViewControl={false}
              fullscreenControl={false}
              zoomControl={true}
              mapId="luxurystay-map"
              style={{ width: "100%", height: "100%" }}
              onTilesLoaded={() => setMapLoaded(true)}
            />
            <UserLocationDot />
            <PropertyMarkers properties={visibleProperties} />
            <BoundsWatcher onBoundsChange={handleBoundsChange} />
            <MapController target={target} />
            <MyLocationButton />
          </div>
        </div>
      </div>

      {/* Filters modal */}
      {showFilters && (
        <FiltersPanel
          filters={filters}
          onChange={setFilters}
          onClose={() => setShowFilters(false)}
          resultCount={visibleProperties.length}
        />
      )}
    </APIProvider>
  );
}
