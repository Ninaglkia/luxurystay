import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileView } from "./profile-view";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  return (
    <ProfileView
      user={{
        id: user.id,
        email: user.email ?? "",
        fullName: user.user_metadata?.full_name ?? "",
        avatarUrl: user.user_metadata?.avatar_url ?? null,
        createdAt: user.created_at,
        provider: user.app_metadata?.provider ?? "email",
      }}
    />
  );
}
