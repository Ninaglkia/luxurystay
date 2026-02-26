"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";

export function Header({ user }: { user: User }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Utente";
  const avatarUrl = user.user_metadata?.avatar_url ?? null;

  function getInitials(name: string) {
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  }

  return (
    <header className="h-14 lg:h-12 flex items-center justify-between px-4 lg:px-8 border-b border-neutral-200 bg-white shrink-0">
      {/* Mobile: logo left */}
      <div className="lg:hidden text-lg font-light tracking-tight text-neutral-900">
        LuxuryStay
      </div>

      {/* Mobile: user + esci right */}
      <div className="flex lg:hidden items-center gap-2 ml-auto">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg active:bg-neutral-100 min-h-[44px]"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">{getInitials(displayName)}</span>
            </div>
          )}
          <span className="text-sm text-neutral-600 truncate max-w-[100px]">
            {displayName}
          </span>
        </Link>
        <button
          onClick={handleSignOut}
          className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer px-2 py-2 -mr-2 rounded-lg active:bg-neutral-100 min-h-[44px] flex items-center"
        >
          Esci
        </button>
      </div>

      {/* Desktop: minimal — just a thin line, content is in sidebar */}
      <div className="hidden lg:block" />
    </header>
  );
}
