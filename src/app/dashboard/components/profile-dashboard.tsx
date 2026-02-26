"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface UserData {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  bio: string;
  avatarUrl: string | null;
  createdAt: string;
  provider: string;
}

function getInitials(name: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* ─── Main Dashboard ─── */
export function ProfileDashboard({ user }: { user: UserData }) {
  const router = useRouter();
  const supabase = createClient();

  // Form state — initialized with real user data
  const [fullName, setFullName] = useState(user.fullName);
  const [phone, setPhone] = useState(user.phone);
  const [bio, setBio] = useState(user.bio);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Check if form has changes
  const hasChanges =
    fullName !== user.fullName || phone !== user.phone || bio !== user.bio;

  async function handleSave() {
    if (!hasChanges) return;
    setSaving(true);
    setError(null);
    setSaved(false);

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        full_name: fullName.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
      },
    });

    setSaving(false);

    if (updateError) {
      setError("Errore nel salvataggio. Riprova.");
    } else {
      setSaved(true);
      // Refresh server data so sidebar/header update too
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="max-w-3xl mx-auto pb-8 lg:pb-12">
      {/* Page title */}
      <div className="mb-5 lg:mb-6">
        <h1 className="text-xl lg:text-2xl font-semibold text-neutral-900">Il mio profilo</h1>
        <p className="text-neutral-500 text-sm mt-1">Gestisci le informazioni del tuo account</p>
      </div>

      {/* Dark container */}
      <div className="bg-neutral-900 rounded-2xl lg:rounded-3xl overflow-hidden">
        {/* ── Profile Header ── */}
        <div className="relative">
          {/* Cover gradient */}
          <div className="h-24 lg:h-32 bg-gradient-to-br from-neutral-800 via-neutral-900 to-neutral-800 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-amber-500/30 blur-3xl" />
              <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-violet-500/20 blur-3xl" />
            </div>
          </div>

          {/* Avatar + basic info */}
          <div className="px-5 lg:px-8 -mt-10 lg:-mt-12 relative z-10">
            <div className="flex items-end gap-4">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={fullName || "Avatar"}
                  className="w-20 h-20 lg:w-24 lg:h-24 rounded-2xl border-4 border-neutral-900 object-cover shadow-xl"
                />
              ) : (
                <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-2xl border-4 border-neutral-900 bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-xl">
                  <span className="text-2xl lg:text-3xl font-bold text-white">
                    {getInitials(fullName)}
                  </span>
                </div>
              )}
              <div className="pb-1">
                <h2 className="text-lg lg:text-xl font-bold text-white leading-tight">
                  {fullName || "Completa il profilo"}
                </h2>
                <p className="text-sm text-neutral-400 mt-0.5">{user.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="px-5 lg:px-8 pt-6 lg:pt-8 pb-6 lg:pb-8 space-y-6">

          {/* ── Edit Profile Form ── */}
          <div className="bg-neutral-800/40 rounded-2xl p-5 lg:p-6 border border-neutral-700/50">
            <h3 className="text-lg font-bold text-white mb-1">Dati personali</h3>
            <p className="text-sm text-neutral-500 mb-5">
              Modifica le tue informazioni. I dati verranno salvati su Supabase.
            </p>

            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-xs font-medium text-neutral-400 uppercase tracking-wider mb-1.5">
                  Nome completo
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Es. Mario Rossi"
                  className="w-full px-4 py-3 bg-neutral-700/40 border border-neutral-600/50 rounded-xl text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all"
                />
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wider mb-1.5">
                  Email
                </label>
                <div className="w-full px-4 py-3 bg-neutral-700/20 border border-neutral-700/30 rounded-xl text-sm text-neutral-500 flex items-center justify-between">
                  <span className="truncate">{user.email}</span>
                  <svg className="w-4 h-4 text-neutral-600 shrink-0 ml-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-xs font-medium text-neutral-400 uppercase tracking-wider mb-1.5">
                  Telefono
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Es. +39 333 1234567"
                  className="w-full px-4 py-3 bg-neutral-700/40 border border-neutral-600/50 rounded-xl text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all"
                />
              </div>

              {/* Bio */}
              <div>
                <label htmlFor="bio" className="block text-xs font-medium text-neutral-400 uppercase tracking-wider mb-1.5">
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Scrivi qualcosa su di te..."
                  rows={3}
                  className="w-full px-4 py-3 bg-neutral-700/40 border border-neutral-600/50 rounded-xl text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all resize-none"
                />
              </div>

              {/* Error / Success */}
              {error && (
                <p className="text-sm text-red-400 flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                  {error}
                </p>
              )}
              {saved && (
                <p className="text-sm text-emerald-400 flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  Profilo aggiornato con successo
                </p>
              )}

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className={`w-full py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer min-h-[48px] ${
                  hasChanges && !saving
                    ? "bg-white text-neutral-900 hover:bg-neutral-100 active:scale-[0.98]"
                    : "bg-neutral-700/30 text-neutral-600 cursor-not-allowed"
                }`}
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-neutral-400 border-t-neutral-900 rounded-full animate-spin" />
                    Salvataggio...
                  </span>
                ) : hasChanges ? (
                  "Salva modifiche"
                ) : (
                  "Nessuna modifica"
                )}
              </button>
            </div>
          </div>

          {/* ── Account Info ── */}
          <div className="bg-neutral-800/40 rounded-2xl p-5 lg:p-6 border border-neutral-700/50">
            <h3 className="text-lg font-bold text-white mb-4">Informazioni account</h3>
            <div className="space-y-3.5">
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-neutral-500">ID account</span>
                <span className="text-sm text-neutral-300 font-mono">{user.id.slice(0, 8)}...{user.id.slice(-4)}</span>
              </div>
              <div className="h-px bg-neutral-700/40" />
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-neutral-500">Autenticazione</span>
                <span className="text-sm text-neutral-300">{user.provider === "google" ? "Google" : "Email / Password"}</span>
              </div>
              <div className="h-px bg-neutral-700/40" />
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-neutral-500">Membro dal</span>
                <span className="text-sm text-neutral-300">{formatDate(user.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* ── Danger Zone ── */}
          <div className="bg-neutral-800/40 rounded-2xl p-5 lg:p-6 border border-red-500/20">
            <h3 className="text-lg font-bold text-white mb-1">Zona pericolosa</h3>
            <p className="text-sm text-neutral-500 mb-4">Azioni irreversibili sul tuo account</p>

            <div className="space-y-2">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3.5 bg-neutral-700/30 hover:bg-neutral-700/50 rounded-xl text-sm font-medium text-neutral-300 transition-colors cursor-pointer min-h-[48px]"
              >
                <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
                </svg>
                Esci dall&apos;account
              </button>

              <button
                onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                className="w-full flex items-center gap-3 px-4 py-3.5 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-sm font-medium text-red-400 transition-colors cursor-pointer min-h-[48px]"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
                Elimina account
              </button>
            </div>

            {showDeleteConfirm && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-sm text-red-300 font-medium">Sei sicuro?</p>
                <p className="text-xs text-red-400/70 mt-1">
                  Questa azione e irreversibile. Tutti i tuoi dati verranno eliminati permanentemente.
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-3 py-2.5 bg-neutral-700/50 hover:bg-neutral-700/70 rounded-lg text-sm font-medium text-neutral-300 transition-colors cursor-pointer min-h-[44px]"
                  >
                    Annulla
                  </button>
                  <button className="flex-1 px-3 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium text-white transition-colors cursor-pointer min-h-[44px]">
                    Conferma eliminazione
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
