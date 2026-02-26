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

  return (
    <header className="h-16 flex items-center justify-between px-6 lg:px-8 border-b border-neutral-200 bg-white">
      <div className="lg:hidden text-lg font-light tracking-tight text-neutral-900">
        LuxuryStay
      </div>
      <div className="flex items-center gap-4 ml-auto">
        <span className="text-sm text-neutral-600 hidden sm:block">
          {user.email}
        </span>
        <button
          onClick={handleSignOut}
          className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
