import { ExploreMap } from "./components/explore-map";

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-neutral-900">Esplora</h1>
        <p className="text-neutral-500 text-sm mt-1">
          Cerca una città e scopri le strutture disponibili
        </p>
      </div>
      <ExploreMap />
    </div>
  );
}
