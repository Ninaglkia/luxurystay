"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export function Header({ user }: { user: User }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  // Show name if available, otherwise email truncated
  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Utente";

  return (
    <header className="h-14 lg:h-16 flex items-center justify-between px-4 lg:px-8 border-b border-neutral-200 bg-white shrink-0">
      <div className="lg:hidden text-lg font-light tracking-tight text-neutral-900">
        LuxuryStay
      </div>
      <div className="flex items-center gap-3 ml-auto">
        <span className="text-sm text-neutral-600 truncate max-w-[150px]">
          {displayName}
        </span>
        <button
          onClick={handleSignOut}
          className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer px-3 py-2 -mr-3 rounded-lg active:bg-neutral-100 min-h-[44px] flex items-center"
        >
          Esci
        </button>
      </div>
    </header>
  );
}
