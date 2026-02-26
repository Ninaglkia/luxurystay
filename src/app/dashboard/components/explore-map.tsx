"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { CitySearch } from "./city-search";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

// Default center: Rome
const DEFAULT_CENTER = { lat: 41.9028, lng: 12.4964 };
const DEFAULT_ZOOM = 6;

// Blue dot overlay for user's live position
function UserLocationDot() {
  const map = useMap();
  const markerRef = useRef<google.maps.Marker | null>(null);
  const accuracyCircleRef = useRef<google.maps.Circle | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!map || !navigator.geolocation) return;

    // Create blue dot marker
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

    // Create accuracy circle
    accuracyCircleRef.current = new google.maps.Circle({
      map,
      fillColor: "#4285F4",
      fillOpacity: 0.1,
      strokeColor: "#4285F4",
      strokeOpacity: 0.3,
      strokeWeight: 1,
      zIndex: 998,
    });

    // Watch position for live updates
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        markerRef.current?.setPosition(pos);
        accuracyCircleRef.current?.setCenter(pos);
        accuracyCircleRef.current?.setRadius(position.coords.accuracy);
      },
      () => {
        // Geolocation error — silently ignore, user just won't see the dot
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 5000,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      markerRef.current?.setMap(null);
      accuracyCircleRef.current?.setMap(null);
    };
  }, [map]);

  return null;
}

// Component to fly to a location
function MapController({ target }: { target: { lat: number; lng: number } | null }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !target) return;
    map.panTo(target);
    map.setZoom(13);
  }, [map, target]);

  return null;
}

// Button to re-center on user's position
function MyLocationButton() {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  function handleClick() {
    if (!map || !navigator.geolocation) return;
    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        map.panTo(pos);
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
      className="absolute bottom-6 right-6 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-neutral-50 transition-colors cursor-pointer z-10"
      title="La mia posizione"
    >
      {locating ? (
        <div className="w-5 h-5 border-2 border-neutral-300 border-t-blue-500 rounded-full animate-spin" />
      ) : (
        <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 16v2M2 12h2m16 0h2" />
        </svg>
      )}
    </button>
  );
}

export function ExploreMap() {
  const [target, setTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  const handlePlaceSelect = useCallback(
    (location: { lat: number; lng: number; name: string }) => {
      setTarget({ lat: location.lat, lng: location.lng });
      setSelectedCity(location.name);
    },
    []
  );

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="flex-1 flex items-center justify-center bg-neutral-100 rounded-xl">
        <div className="text-center p-8">
          <p className="text-neutral-500 text-sm">
            Google Maps API key mancante. Aggiungi{" "}
            <code className="bg-neutral-200 px-1.5 py-0.5 rounded text-xs">
              NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
            </code>{" "}
            al file <code className="bg-neutral-200 px-1.5 py-0.5 rounded text-xs">.env.local</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={["places"]}>
      <div className="flex-1 flex flex-col gap-4">
        {/* Search bar */}
        <div className="flex items-center gap-4">
          <CitySearch onPlaceSelect={handlePlaceSelect} />
          {selectedCity && (
            <span className="text-sm text-neutral-500">
              📍 {selectedCity}
            </span>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 relative rounded-xl overflow-hidden shadow-sm border border-neutral-200" style={{ minHeight: "500px" }}>
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
          />
          <UserLocationDot />
          <MapController target={target} />
          <MyLocationButton />
        </div>
      </div>
    </APIProvider>
  );
}
