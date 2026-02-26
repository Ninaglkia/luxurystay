"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface UserData {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  createdAt: string;
  provider: string;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("it-IT", {
    month: "long",
    year: "numeric",
  });
}

/* ─── Stat Card ─── */
function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="bg-neutral-800/60 rounded-2xl p-5 lg:p-6 flex items-center gap-4 border border-neutral-700/50">
      <div className="w-12 h-12 rounded-xl bg-neutral-700/50 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
        <p className="text-sm text-neutral-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

/* ─── Activity Item ─── */
function ActivityItem({
  icon,
  iconBg,
  title,
  subtitle,
  time,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  time: string;
}) {
  return (
    <div className="flex items-start gap-3.5 py-4 border-b border-neutral-700/40 last:border-b-0">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-200 leading-snug">{title}</p>
        <p className="text-xs text-neutral-500 mt-0.5 truncate">{subtitle}</p>
      </div>
      <span className="text-xs text-neutral-600 shrink-0 mt-0.5">{time}</span>
    </div>
  );
}

/* ─── Section Header ─── */
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-bold text-white">{title}</h2>
      {subtitle && <p className="text-sm text-neutral-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}

/* ─── Toggle Switch ─── */
function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer shrink-0 ${
        enabled ? "bg-emerald-500" : "bg-neutral-600"
      }`}
      role="switch"
      aria-checked={enabled}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
          enabled ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}

/* ─── Main Dashboard ─── */
export function ProfileDashboard({ user }: { user: UserData }) {
  const router = useRouter();
  const supabase = createClient();
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [marketingNotif, setMarketingNotif] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="max-w-5xl mx-auto pb-8 lg:pb-12">
      {/* Page title — hidden on mobile, shown on desktop */}
      <div className="hidden lg:block mb-6">
        <h1 className="text-2xl font-semibold text-neutral-900">Il mio profilo</h1>
        <p className="text-neutral-500 text-sm mt-1">Gestisci il tuo account e le impostazioni</p>
      </div>

      {/* Dark container */}
      <div className="bg-neutral-900 rounded-2xl lg:rounded-3xl overflow-hidden">
        {/* ── Profile Header ── */}
        <div className="relative">
          {/* Cover gradient */}
          <div className="h-28 lg:h-36 bg-gradient-to-br from-neutral-800 via-neutral-900 to-neutral-800 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-amber-500/30 blur-3xl" />
              <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-violet-500/20 blur-3xl" />
            </div>
          </div>

          {/* Avatar + Info */}
          <div className="px-5 lg:px-8 -mt-12 lg:-mt-14 relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              <div className="flex items-end gap-4 lg:gap-5">
                {/* Avatar */}
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName}
                    className="w-24 h-24 lg:w-28 lg:h-28 rounded-2xl border-4 border-neutral-900 object-cover shadow-xl"
                  />
                ) : (
                  <div className="w-24 h-24 lg:w-28 lg:h-28 rounded-2xl border-4 border-neutral-900 bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-xl">
                    <span className="text-3xl lg:text-4xl font-bold text-white">
                      {getInitials(user.fullName)}
                    </span>
                  </div>
                )}
                <div className="pb-1">
                  <h2 className="text-xl lg:text-2xl font-bold text-white leading-tight">
                    {user.fullName}
                  </h2>
                  <p className="text-sm text-neutral-400 mt-0.5">{user.email}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="inline-flex items-center gap-1.5 text-xs text-neutral-500">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                      </svg>
                      Membro da {formatDate(user.createdAt)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-neutral-500 capitalize">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                      </svg>
                      {user.provider === "google" ? "Google" : "Email"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Desktop: Edit button */}
              <button className="hidden lg:flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer mb-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
                Modifica profilo
              </button>
            </div>
          </div>
        </div>

        {/* ── Content Grid ── */}
        <div className="px-5 lg:px-8 pt-6 lg:pt-8 pb-6 lg:pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
            {/* Left Column (2/3) */}
            <div className="lg:col-span-2 space-y-5 lg:space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 lg:gap-4">
                <StatCard
                  icon={
                    <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                    </svg>
                  }
                  value="0"
                  label="Prenotazioni"
                />
                <StatCard
                  icon={
                    <svg className="w-6 h-6 text-rose-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                    </svg>
                  }
                  value="0"
                  label="Preferiti"
                />
                <StatCard
                  icon={
                    <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                    </svg>
                  }
                  value="0"
                  label="Recensioni"
                />
              </div>

              {/* Recent Activity */}
              <div className="bg-neutral-800/40 rounded-2xl p-5 lg:p-6 border border-neutral-700/50">
                <SectionHeader title="Attivita recente" subtitle="Le tue ultime azioni sulla piattaforma" />
                <div className="mt-2">
                  <ActivityItem
                    icon={
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                      </svg>
                    }
                    iconBg="bg-emerald-500/20"
                    title="Account creato"
                    subtitle="Hai creato il tuo account LuxuryStay"
                    time={formatDate(user.createdAt)}
                  />
                  <ActivityItem
                    icon={
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                      </svg>
                    }
                    iconBg="bg-blue-500/20"
                    title="Inizia ad esplorare"
                    subtitle="Cerca la tua prossima destinazione sulla mappa"
                    time="Ora"
                  />
                </div>
              </div>

              {/* Booking Placeholder */}
              <div className="bg-neutral-800/40 rounded-2xl overflow-hidden border border-neutral-700/50">
                <div className="relative h-44 lg:h-52 bg-gradient-to-br from-neutral-700 to-neutral-800 flex items-center justify-center">
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-amber-400 blur-[80px]" />
                  </div>
                  <div className="text-center relative z-10">
                    <svg className="w-12 h-12 text-neutral-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                    </svg>
                    <h3 className="text-white font-semibold text-lg">Nessuna prenotazione</h3>
                    <p className="text-neutral-500 text-sm mt-1 max-w-xs mx-auto">
                      Esplora le strutture disponibili e prenota il tuo prossimo soggiorno di lusso
                    </p>
                    <a
                      href="/dashboard"
                      className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-white text-neutral-900 text-sm font-semibold rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                      </svg>
                      Esplora ora
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (1/3) */}
            <div className="space-y-5 lg:space-y-6">
              {/* Notifications */}
              <div className="bg-neutral-800/40 rounded-2xl p-5 lg:p-6 border border-neutral-700/50">
                <SectionHeader title="Notifiche" />
                <div className="space-y-4 mt-2">
                  <div className="flex items-center justify-between min-h-[44px]">
                    <div>
                      <p className="text-sm font-medium text-neutral-200">Email</p>
                      <p className="text-xs text-neutral-500 mt-0.5">Aggiornamenti e conferme</p>
                    </div>
                    <Toggle enabled={emailNotif} onToggle={() => setEmailNotif(!emailNotif)} />
                  </div>
                  <div className="h-px bg-neutral-700/40" />
                  <div className="flex items-center justify-between min-h-[44px]">
                    <div>
                      <p className="text-sm font-medium text-neutral-200">Push</p>
                      <p className="text-xs text-neutral-500 mt-0.5">Notifiche in tempo reale</p>
                    </div>
                    <Toggle enabled={pushNotif} onToggle={() => setPushNotif(!pushNotif)} />
                  </div>
                  <div className="h-px bg-neutral-700/40" />
                  <div className="flex items-center justify-between min-h-[44px]">
                    <div>
                      <p className="text-sm font-medium text-neutral-200">Marketing</p>
                      <p className="text-xs text-neutral-500 mt-0.5">Offerte e promozioni</p>
                    </div>
                    <Toggle enabled={marketingNotif} onToggle={() => setMarketingNotif(!marketingNotif)} />
                  </div>
                </div>
              </div>

              {/* Account Info */}
              <div className="bg-neutral-800/40 rounded-2xl p-5 lg:p-6 border border-neutral-700/50">
                <SectionHeader title="Informazioni account" />
                <div className="space-y-3.5 mt-2">
                  <div>
                    <p className="text-xs text-neutral-500 uppercase tracking-wider font-medium">ID</p>
                    <p className="text-sm text-neutral-300 mt-1 font-mono truncate">{user.id.slice(0, 8)}...{user.id.slice(-4)}</p>
                  </div>
                  <div className="h-px bg-neutral-700/40" />
                  <div>
                    <p className="text-xs text-neutral-500 uppercase tracking-wider font-medium">Email</p>
                    <p className="text-sm text-neutral-300 mt-1 truncate">{user.email}</p>
                  </div>
                  <div className="h-px bg-neutral-700/40" />
                  <div>
                    <p className="text-xs text-neutral-500 uppercase tracking-wider font-medium">Autenticazione</p>
                    <p className="text-sm text-neutral-300 mt-1 capitalize">{user.provider === "google" ? "Google OAuth" : "Email / Password"}</p>
                  </div>
                  <div className="h-px bg-neutral-700/40" />
                  <div>
                    <p className="text-xs text-neutral-500 uppercase tracking-wider font-medium">Membro dal</p>
                    <p className="text-sm text-neutral-300 mt-1">{formatDate(user.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-neutral-800/40 rounded-2xl p-5 lg:p-6 border border-neutral-700/50">
                <SectionHeader title="Azioni rapide" />
                <div className="space-y-2 mt-2">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-neutral-700/30 hover:bg-neutral-700/50 rounded-xl text-sm font-medium text-neutral-300 transition-colors cursor-pointer min-h-[44px]"
                  >
                    <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
                    </svg>
                    Esci dall&apos;account
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-sm font-medium text-red-400 transition-colors cursor-pointer min-h-[44px]"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                    Elimina account
                  </button>
                </div>

                {/* Delete confirmation */}
                {showDeleteConfirm && (
                  <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-sm text-red-300 font-medium">Sei sicuro?</p>
                    <p className="text-xs text-red-400/70 mt-1">
                      Questa azione e irreversibile. Tutti i tuoi dati verranno eliminati permanentemente.
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 px-3 py-2 bg-neutral-700/50 hover:bg-neutral-700/70 rounded-lg text-xs font-medium text-neutral-300 transition-colors cursor-pointer min-h-[44px]"
                      >
                        Annulla
                      </button>
                      <button className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-medium text-white transition-colors cursor-pointer min-h-[44px]">
                        Conferma eliminazione
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Edit profile button (fixed bottom) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-neutral-50 via-neutral-50 to-transparent z-20 safe-area-pb">
        <button className="w-full bg-neutral-900 text-white rounded-xl py-3.5 text-[15px] font-semibold hover:bg-neutral-800 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2">
          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
          </svg>
          Modifica profilo
        </button>
      </div>
    </div>
  );
}
