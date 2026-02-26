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
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
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
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => searchPlaces(value), 150);
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
  }

  function handleClear() {
    setQuery("");
    setPredictions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  }

  return (
    <div className="relative w-full max-w-md">
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
          onFocus={() => predictions.length > 0 && setIsOpen(true)}
          placeholder="Cerca città, vie, luoghi..."
          className="w-full pl-11 pr-10 py-3 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent shadow-sm transition-shadow"
          role="combobox"
          aria-expanded={isOpen}
          aria-activedescendant={activeIndex >= 0 ? `place-${activeIndex}` : undefined}
        />
        {query && !loading && (
          <button
            onClick={handleClear}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
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
    </div>
  );
}
