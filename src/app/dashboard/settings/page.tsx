import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileDashboard } from "../components/profile-dashboard";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  return (
    <ProfileDashboard
      user={{
        id: user.id,
        email: user.email ?? "",
        fullName: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Utente",
        avatarUrl: user.user_metadata?.avatar_url ?? null,
        createdAt: user.created_at,
        provider: user.app_metadata?.provider ?? "email",
      }}
    />
  );
}
