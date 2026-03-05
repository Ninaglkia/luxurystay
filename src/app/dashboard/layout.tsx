import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "./components/sidebar";
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

  return (
    <ModeProvider>
      <div className="min-h-screen bg-neutral-50 flex">
        <Sidebar />
        <main className="flex-1 min-w-0 pb-20 lg:pb-0 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 py-6 lg:px-8">
            {children}
          </div>
        </main>
        <MobileNav />
      </div>
    </ModeProvider>
  );
}
