"use client";

import { useMode } from "./components/mode-context";
import { ExploreMap } from "./components/explore-map";
import { HostDashboard } from "./components/host-dashboard";

export default function DashboardPage() {
  const { mode } = useMode();

  if (mode === "host") {
    return (
      <div className="flex flex-col h-full">
        <div className="mb-3 hidden lg:block">
          <h1 className="text-2xl font-semibold text-neutral-900">I tuoi immobili</h1>
          <p className="text-neutral-500 text-sm mt-1">
            Gestisci le tue proprietà e monitora le prenotazioni
          </p>
        </div>
        <HostDashboard />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-3 hidden lg:block">
        <h1 className="text-2xl font-semibold text-neutral-900">Esplora</h1>
        <p className="text-neutral-500 text-sm mt-1">
          Cerca una città e scopri le strutture disponibili
        </p>
      </div>
      <ExploreMap />
    </div>
  );
}
