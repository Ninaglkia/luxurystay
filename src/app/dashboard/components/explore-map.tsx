"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { CitySearch } from "./city-search";
import { DatePicker } from "./date-picker";
import { GuestsPicker, type GuestsCount } from "./guests-picker";
import { createClient } from "@/lib/supabase/client";

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
}

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

    // Get initial position quickly with low accuracy, then switch to watch
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
        markerRef.current?.setPosition(pos);
        accuracyCircleRef.current?.setCenter(pos);
        accuracyCircleRef.current?.setRadius(position.coords.accuracy);
        if (!initialZoomDone.current) {
          initialZoomDone.current = true;
        }
      },
      () => {},
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 3000 }
    );

    // Then watch with high accuracy
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
      className="absolute bottom-24 lg:bottom-6 right-4 lg:right-6 w-11 h-11 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-neutral-50 transition-colors cursor-pointer z-10 active:scale-95"
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

function PropertyMarkers() {
  const map = useMap();
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  useEffect(() => {
    if (!map) return;
    const supabase = createClient();

    async function loadProperties() {
      const { data } = await supabase
        .from("properties")
        .select("id, title, price, lat, lng, photos, category")
        .eq("status", "active");

      if (!data) return;

      // Clear old markers
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = [];

      if (!infoWindowRef.current) {
        infoWindowRef.current = new google.maps.InfoWindow();
      }

      data.forEach((prop: MapProperty) => {
        const marker = new google.maps.Marker({
          map,
          position: { lat: prop.lat, lng: prop.lng },
          title: prop.title,
          label: {
            text: `€${prop.price}`,
            color: "#ffffff",
            fontSize: "12px",
            fontWeight: "600",
          },
          icon: {
            path: "M-12,-6 L12,-6 L12,6 L12,6 L-12,6 Z",
            fillColor: "#171717",
            fillOpacity: 1,
            strokeColor: "#171717",
            strokeWeight: 0,
            scale: 1.3,
            labelOrigin: new google.maps.Point(0, 0),
          },
          zIndex: 100,
        });

        marker.addListener("click", () => {
          const photoHtml = prop.photos[0]
            ? `<img src="${prop.photos[0]}" style="width:200px;height:130px;object-fit:cover;border-radius:8px;margin-bottom:8px;" />`
            : "";
          infoWindowRef.current?.setContent(`
            <div style="padding:4px;min-width:200px;">
              ${photoHtml}
              <p style="font-weight:600;font-size:14px;margin:0 0 4px;">${prop.title}</p>
              <p style="font-size:13px;color:#525252;margin:0;"><strong>€${prop.price}</strong> / notte</p>
            </div>
          `);
          infoWindowRef.current?.open(map, marker);
        });

        markersRef.current.push(marker);
      });
    }

    loadProperties();

    return () => {
      markersRef.current.forEach(m => m.setMap(null));
    };
  }, [map]);

  return null;
}

// Loading skeleton while map loads
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

export function ExploreMap() {
  const [target, setTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [guests, setGuests] = useState<GuestsCount>({ adults: 0, children: 0, infants: 0, pets: 0 });
  const [mapLoaded, setMapLoaded] = useState(false);

  const handlePlaceSelect = useCallback(
    (location: { lat: number; lng: number; name: string }) => {
      setTarget({ lat: location.lat, lng: location.lng });
      setSelectedCity(location.name);
    },
    []
  );

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
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={["places"]}>
      <div className="flex-1 flex flex-col gap-3 lg:gap-4 min-h-0">
        {/* Search controls — stacked on mobile, row on desktop */}
        <div className="flex flex-col lg:flex-row lg:items-start gap-2 lg:gap-3">
          <CitySearch onPlaceSelect={handlePlaceSelect} />
          <div className="grid grid-cols-2 lg:flex gap-2 lg:gap-3">
            <DatePicker checkIn={checkIn} checkOut={checkOut} onDatesChange={handleDatesChange} />
            <GuestsPicker guests={guests} onGuestsChange={setGuests} />
          </div>
        </div>

        {/* Map — takes all remaining space */}
        <div className="flex-1 relative rounded-xl overflow-hidden shadow-sm border border-neutral-200 min-h-[280px] lg:min-h-[500px]">
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
          <PropertyMarkers />
          <MapController target={target} />
          <MyLocationButton />
        </div>
      </div>
    </APIProvider>
  );
}
