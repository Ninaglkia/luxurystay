"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";

interface CitySearchProps {
  onPlaceSelect: (location: { lat: number; lng: number; name: string }) => void;
}

interface Prediction {
  place_id: string;
  description: string;
  types: string[];
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface SuggestedCity {
  name: string;
  region: string;
  description: string;
  lat: number;
  lng: number;
  color: string;
  icon: React.ReactNode;
}

const SUGGESTED_CITIES: SuggestedCity[] = [
  {
    name: "Roma", region: "Lazio",
    description: "Per la sua eccezionale cucina",
    lat: 41.9028, lng: 12.4964,
    color: "bg-red-50 text-red-500",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M4 21V10l2-1.5V5h2v2l4-3 4 3v2h2v3.5L20 10v11M9 21v-4h6v4M8 13h1m6 0h1" />
      </svg>
    ),
  },
  {
    name: "Firenze", region: "Toscana",
    description: "Per la splendida architettura",
    lat: 43.7696, lng: 11.2558,
    color: "bg-emerald-50 text-emerald-600",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3L8 10h8l-4-7ZM6 21V12h12v9M3 21h18M9 16h6" />
      </svg>
    ),
  },
  {
    name: "Milano", region: "Lombardia",
    description: "Moda, design e vita notturna",
    lat: 45.4642, lng: 9.19,
    color: "bg-purple-50 text-purple-500",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
      </svg>
    ),
  },
  {
    name: "Napoli", region: "Campania",
    description: "La vera pizza e il golfo",
    lat: 40.8518, lng: 14.2681,
    color: "bg-orange-50 text-orange-500",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3C7 3 3 7.5 3 12l9 9 9-9c0-4.5-4-9-9-9Zm0 3a3 3 0 110 6 3 3 0 010-6Z" />
      </svg>
    ),
  },
  {
    name: "Torino", region: "Piemonte",
    description: "Ideale per un weekend fuori porta",
    lat: 45.0703, lng: 7.6869,
    color: "bg-amber-50 text-amber-600",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21" />
      </svg>
    ),
  },
  {
    name: "Venezia", region: "Veneto",
    description: "I canali e la magia dell'acqua",
    lat: 45.4408, lng: 12.3155,
    color: "bg-sky-50 text-sky-500",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 17.25c2.25 1.5 4.5 1.5 6.75 0s4.5-1.5 6.75 0 4.5 1.5 6.75 0M3 20.25c2.25 1.5 4.5 1.5 6.75 0s4.5-1.5 6.75 0 4.5 1.5 6.75 0M8 14V7l4-4 4 4v7" />
      </svg>
    ),
  },
  {
    name: "Costiera Amalfitana", region: "Campania",
    description: "Panorami mozzafiato sul mare",
    lat: 40.6333, lng: 14.6029,
    color: "bg-teal-50 text-teal-500",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
      </svg>
    ),
  },
];

function PlaceIcon({ types }: { types: string[] }) {
  if (types.includes("locality") || types.includes("administrative_area_level_3")) {
    return (
      <svg className="w-5 h-5 text-neutral-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
      </svg>
    );
  }
  if (types.includes("route") || types.includes("street_address")) {
    return (
      <svg className="w-5 h-5 text-neutral-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
      </svg>
    );
  }
  if (types.includes("administrative_area_level_1") || types.includes("administrative_area_level_2") || types.includes("country")) {
    return (
      <svg className="w-5 h-5 text-neutral-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 0 1-1.161.886l-.143.048a1.107 1.107 0 0 0-.57 1.664c.369.555.169 1.307-.427 1.605L9 13.125l.423 1.059a.956.956 0 0 1-1.652.928l-.679-.906a1.125 1.125 0 0 0-1.906.172L4.5 15.75l-.612.153M12.75 3.031a9 9 0 1 0-8.862 12.872M12.75 3.031a9 9 0 0 1 6.69 14.036m0 0-.177-.529A2.25 2.25 0 0 0 17.128 15H16.5l-.324-.324a1.453 1.453 0 0 0-2.328.377l-.036.073a1.586 1.586 0 0 1-.982.816l-.99.282c-.55.157-.894.702-.8 1.267l.073.438c.08.474.49.821.97.821.846 0 1.598.542 1.865 1.345l.215.643m5.276-3.67a9.012 9.012 0 0 1-5.276 3.67" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5 text-neutral-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  );
}

export function CitySearch({ onPlaceSelect }: CitySearchProps) {
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [locating, setLocating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Wait for the places library to be loaded by APIProvider
  const placesLib = useMapsLibrary("places");

  useEffect(() => {
    if (!placesLib) return;
    autocompleteService.current = new placesLib.AutocompleteService();
    const div = document.createElement("div");
    placesService.current = new placesLib.PlacesService(div);
  }, [placesLib]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchPlaces = useCallback((input: string) => {
    if (!input.trim() || !autocompleteService.current) {
      setPredictions([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    autocompleteService.current.getPlacePredictions(
      { input },
      (results, status) => {
        setLoading(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          setPredictions(results as unknown as Prediction[]);
          setIsOpen(true);
        } else {
          setPredictions([]);
        }
      }
    );
  }, []);

  function handleInputChange(value: string) {
    setQuery(value);
    setActiveIndex(-1);
    if (!value.trim()) {
      setPredictions([]);
      setIsOpen(false);
      setShowSuggestions(true);
      return;
    }
    setShowSuggestions(false);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => searchPlaces(value), 150);
  }

  function handleFocus() {
    if (query.trim() && predictions.length > 0) {
      setIsOpen(true);
    } else if (!query.trim()) {
      setShowSuggestions(true);
    }
  }

  function handleSelectSuggested(city: SuggestedCity) {
    onPlaceSelect({ lat: city.lat, lng: city.lng, name: city.name });
    setQuery(city.name);
    setShowSuggestions(false);
    setIsOpen(false);
  }

  function handleNearby() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onPlaceSelect({ lat: pos.coords.latitude, lng: pos.coords.longitude, name: "Nelle vicinanze" });
        setQuery("Nelle vicinanze");
        setShowSuggestions(false);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || predictions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < predictions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : predictions.length - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(predictions[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }

  function handleSelect(prediction: Prediction) {
    if (!placesService.current) return;

    placesService.current.getDetails(
      { placeId: prediction.place_id, fields: ["geometry", "name"] },
      (place, status) => {
        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          place?.geometry?.location
        ) {
          onPlaceSelect({
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            name: prediction.structured_formatting.main_text,
          });
        }
      }
    );

    setQuery(prediction.structured_formatting.main_text);
    setIsOpen(false);
    setShowSuggestions(false);
  }

  function handleClear() {
    setQuery("");
    setPredictions([]);
    setIsOpen(false);
    setShowSuggestions(true);
    inputRef.current?.focus();
  }

  return (
    <div className="relative w-full lg:max-w-md">
      <div className="relative">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder="Cerca città, vie, luoghi..."
          className="w-full pl-11 pr-12 py-3 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent shadow-sm transition-shadow"
          role="combobox"
          aria-expanded={isOpen}
          aria-activedescendant={activeIndex >= 0 ? `place-${activeIndex}` : undefined}
        />
        {query && !loading && (
          <button
            onClick={handleClear}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {loading && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {isOpen && predictions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutral-200 rounded-xl shadow-lg overflow-hidden z-50 max-h-80 overflow-y-auto"
        >
          {predictions.map((prediction, index) => (
            <button
              key={prediction.place_id}
              id={`place-${index}`}
              onClick={() => handleSelect(prediction)}
              onMouseEnter={() => setActiveIndex(index)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer border-b border-neutral-100 last:border-b-0 ${
                index === activeIndex ? "bg-neutral-100" : "hover:bg-neutral-50"
              }`}
              role="option"
              aria-selected={index === activeIndex}
            >
              <PlaceIcon types={prediction.types || []} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {prediction.structured_formatting.main_text}
                </p>
                <p className="text-xs text-neutral-500 truncate">
                  {prediction.structured_formatting.secondary_text}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Suggested destinations — shown when input is focused and empty */}
      {showSuggestions && !isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutral-200 rounded-2xl shadow-xl z-50 max-h-[70vh] overflow-y-auto"
        >
          <div className="px-5 pt-5 pb-2">
            <p className="text-sm font-semibold text-neutral-900">Destinazioni suggerite</p>
          </div>

          {/* Nelle vicinanze */}
          <button
            onClick={handleNearby}
            className="w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-neutral-50 active:bg-neutral-100 transition-colors cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              {locating ? (
                <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
              ) : (
                <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-neutral-900">Nelle vicinanze</p>
              <p className="text-sm text-neutral-500">Scopri le opzioni intorno a te</p>
            </div>
          </button>

          {/* Suggested cities */}
          {SUGGESTED_CITIES.map((city) => (
            <button
              key={city.name}
              onClick={() => handleSelectSuggested(city)}
              className="w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-neutral-50 active:bg-neutral-100 transition-colors cursor-pointer"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${city.color}`}>
                {city.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-neutral-900">{city.name}, {city.region}</p>
                <p className="text-sm text-neutral-500">{city.description}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
