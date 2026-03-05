"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMode } from "../components/mode-context";
import { createClient } from "@/lib/supabase/client";

interface ProfileUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  createdAt: string;
  provider: string;
}

function getInitials(name: string, email: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email[0]?.toUpperCase() ?? "?";
}

const menuItems = [
  {
    label: "Modifica profilo",
    href: "/dashboard/settings",
    icon: (
      <svg
        className="w-5 h-5 text-neutral-400"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
        />
      </svg>
    ),
  },
  {
    label: "Account",
    href: "/dashboard/settings",
    icon: (
      <svg
        className="w-5 h-5 text-neutral-400"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        />
      </svg>
    ),
  },
  {
    label: "I miei documenti",
    href: "#",
    icon: (
      <svg
        className="w-5 h-5 text-neutral-400"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"
        />
      </svg>
    ),
  },
  {
    label: "Feedback",
    href: "#",
    icon: (
      <svg
        className="w-5 h-5 text-neutral-400"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
        />
      </svg>
    ),
  },
  {
    label: "Aiuto",
    href: "#",
    icon: (
      <svg
        className="w-5 h-5 text-neutral-400"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
        />
      </svg>
    ),
  },
  {
    label: "Legale",
    href: "/termini",
    icon: (
      <svg
        className="w-5 h-5 text-neutral-400"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
        />
      </svg>
    ),
  },
  {
    label: "Informativa sulla privacy",
    href: "/privacy",
    icon: (
      <svg
        className="w-5 h-5 text-neutral-400"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
        />
      </svg>
    ),
  },
];

const chevronIcon = (
  <svg
    className="w-4 h-4 text-neutral-300"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m8.25 4.5 7.5 7.5-7.5 7.5"
    />
  </svg>
);

export function ProfileView({ user }: { user: ProfileUser }) {
  const { mode, setMode } = useMode();
  const router = useRouter();
  const supabase = createClient();

  const isHost = mode === "host";

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  function toggleMode() {
    setMode(isHost ? "travel" : "host");
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Profile header */}
      <div className="py-6">
        <div className="mx-auto w-20 h-20 rounded-full overflow-hidden">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.fullName || user.email}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {getInitials(user.fullName, user.email)}
              </span>
            </div>
          )}
        </div>
        {user.fullName && (
          <p className="text-xl font-semibold text-center mt-4">
            {user.fullName}
          </p>
        )}
        <p className="text-sm text-neutral-400 text-center mt-1">
          {user.email}
        </p>
      </div>

      {/* Menu list */}
      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        {menuItems.map((item, i) => {
          const content = (
            <div
              key={item.label}
              className={`flex items-center gap-4 px-5 py-4 ${
                i < menuItems.length - 1 ? "border-b border-neutral-50" : ""
              }`}
            >
              {item.icon}
              <span className="text-sm text-neutral-900 flex-1">
                {item.label}
              </span>
              {chevronIcon}
            </div>
          );

          if (item.href === "#") {
            return (
              <button
                key={item.label}
                className="w-full text-left"
                type="button"
              >
                {content}
              </button>
            );
          }

          return (
            <Link key={item.label} href={item.href} className="block">
              {content}
            </Link>
          );
        })}
      </div>

      {/* Divider */}
      <div className="h-px bg-neutral-200 my-6" />

      {/* Mode switch card */}
      <div className="rounded-2xl border-2 border-neutral-900 p-5">
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-neutral-900">
            {isHost ? "Modalita Host" : "Modalita Ospite"}
          </span>
          <button
            type="button"
            onClick={toggleMode}
            className={`w-12 h-7 rounded-full cursor-pointer transition-colors ${
              isHost ? "bg-neutral-900" : "bg-neutral-300"
            }`}
            aria-label="Cambia modalita"
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                isHost ? "translate-x-[22px]" : "translate-x-[2px]"
              }`}
            />
          </button>
        </div>
        <p className="text-sm text-neutral-500 mt-3">
          {isHost
            ? "Passa alla modalita Ospite per prenotare soggiorni."
            : "Passa alla modalita Host per gestire le tue proprieta e guadagnare."}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-8 px-1">
        <span className="text-xs text-neutral-400">Versione app 1.0.0</span>
        <button
          type="button"
          onClick={handleSignOut}
          className="text-sm font-medium text-red-500 hover:text-red-600"
        >
          Esci
        </button>
      </div>
    </div>
  );
}
