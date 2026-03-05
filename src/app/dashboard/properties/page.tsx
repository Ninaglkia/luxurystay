"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/* =============== Types =============== */

interface Property {
  id: string;
  title: string;
  address: string;
  price: number;
  category: string;
  photos: string[];
  status: "active" | "paused";
  user_id: string;
  guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  created_at: string;
}

/* =============== Constants =============== */

const CATEGORY_LABELS: Record<string, string> = {
  casa: "Casa",
  villa: "Villa",
  appartamento: "Appartamento",
  baita: "Baita",
  bb: "B&B",
  barca: "Barca",
  camper: "Camper",
  castello: "Castello",
  loft: "Loft",
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: "easeOut" as const },
  }),
};

/* =============== Status Badge =============== */

function StatusBadge({ status }: { status: "active" | "paused" }) {
  if (status === "active") {
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-200">
        Attiva
      </span>
    );
  }
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-200">
      In pausa
    </span>
  );
}

/* =============== Loading Skeleton =============== */

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-40 bg-neutral-100 rounded-lg animate-pulse" />
        <div className="h-6 w-10 bg-neutral-100 rounded animate-pulse" />
      </div>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-neutral-100 overflow-hidden"
        >
          <div className="aspect-[16/9] w-full bg-neutral-100 animate-pulse" />
          <div className="p-4 space-y-2">
            <div className="h-5 w-3/4 bg-neutral-100 rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-neutral-100 rounded animate-pulse" />
            <div className="flex items-center justify-between mt-3">
              <div className="h-5 w-20 bg-neutral-100 rounded-md animate-pulse" />
              <div className="h-5 w-24 bg-neutral-100 rounded animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* =============== Empty State =============== */

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="py-20 text-center"
    >
      <Home className="w-16 h-16 text-neutral-300 mx-auto" strokeWidth={1.5} />
      <p className="text-lg font-semibold text-neutral-900 mt-4">
        Nessuna proprietà
      </p>
      <p className="text-sm text-neutral-500 mt-2">
        Pubblica il tuo primo immobile e inizia a guadagnare
      </p>
      <Link
        href="/dashboard/add-property"
        className="bg-neutral-900 text-white rounded-xl px-6 py-3 mt-6 inline-flex items-center gap-2 text-sm font-medium hover:bg-neutral-800 active:scale-95 transition-all"
      >
        <Plus className="w-5 h-5" />
        Pubblica immobile
      </Link>
    </motion.div>
  );
}

/* =============== Property Card =============== */

function PropertyCard({
  property,
  index,
}: {
  property: Property;
  index: number;
}) {
  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={fadeUp}
    >
      <Link href={`/dashboard/property/${property.id}`}>
        <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden hover:shadow-md transition-shadow">
          {/* Photo */}
          <div className="aspect-[16/9] w-full overflow-hidden relative">
            {property.photos && property.photos.length > 0 ? (
              <img
                src={property.photos[0]}
                alt={property.title}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                <Home
                  className="w-10 h-10 text-neutral-300"
                  strokeWidth={1.5}
                />
              </div>
            )}
            <div className="absolute top-3 right-3">
              <StatusBadge status={property.status} />
            </div>
          </div>

          {/* Info */}
          <div className="p-4">
            <p className="text-base font-semibold text-neutral-900">
              {property.title}
            </p>
            {property.address && (
              <p className="text-sm text-neutral-500 mt-0.5 truncate">
                {property.address}
              </p>
            )}
            <div className="flex items-center justify-between mt-3">
              <span className="bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-md text-xs">
                {CATEGORY_LABELS[property.category] || property.category}
              </span>
              <span className="text-base font-bold text-neutral-900">
                &euro;{Number(property.price).toLocaleString("it-IT")}/notte
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* =============== FAB =============== */

function FloatingActionButton() {
  return (
    <Link
      href="/dashboard/add-property"
      className="fixed bottom-24 right-4 lg:bottom-8 lg:right-8 z-30 w-14 h-14 rounded-full bg-neutral-900 text-white shadow-lg shadow-neutral-900/20 flex items-center justify-center hover:bg-neutral-800 active:scale-95 transition-all"
    >
      <Plus className="w-6 h-6" />
    </Link>
  );
}

/* =============== Main Export =============== */

export default function PropertiesPage() {
  const supabase = createClient();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("properties")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setProperties((data as Property[]) || []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Proprietà</h1>
        {properties.length > 0 && (
          <span className="text-sm text-neutral-500">
            ({properties.length})
          </span>
        )}
      </div>

      {/* Content */}
      {properties.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {properties.map((property, i) => (
            <PropertyCard key={property.id} property={property} index={i} />
          ))}
        </div>
      )}

      {/* FAB */}
      <FloatingActionButton />
    </div>
  );
}
