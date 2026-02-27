import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "./components/sidebar";
import { Header } from "./components/header";
import { MobileNav } from "./components/mobile-nav";
import { ModeProvider } from "./components/mode-context";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const displayName =
    user.user_metadata?.full_name || user.email?.split("@")[0] || "Utente";
  const avatarUrl = user.user_metadata?.avatar_url ?? null;

  return (
    <ModeProvider>
      <div className="min-h-screen bg-neutral-50 flex">
        <Sidebar userName={displayName} avatarUrl={avatarUrl} />
        <div className="flex-1 flex flex-col min-w-0">
          <Header user={user} />
          <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8 overflow-y-auto">
            {children}
          </main>
        </div>
        <MobileNav />
      </div>
    </ModeProvider>
  );
}
