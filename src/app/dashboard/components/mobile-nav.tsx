"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    label: "Esplora",
    href: "/dashboard",
    icon: (active: boolean) => (
      <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={active ? 0 : 1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
    ),
  },
  {
    label: "Preferiti",
    href: "/dashboard/favorites",
    icon: (active: boolean) => (
      <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={active ? 0 : 1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
      </svg>
    ),
  },
  {
    label: "Aggiungi",
    href: "/dashboard/add-property",
    isCenter: true,
    icon: (_active: boolean) => (
      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    ),
  },
  {
    label: "Messaggi",
    href: "/dashboard/messages",
    icon: (active: boolean) => (
      <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={active ? 0 : 1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
      </svg>
    ),
  },
  {
    label: "Profilo",
    href: "/dashboard/settings",
    icon: (active: boolean) => (
      <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={active ? 0 : 1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
  },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200 safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = tab.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(tab.href);

          if (tab.isCenter) {
            return (
              <Link key={tab.href} href={tab.href}
                className="flex flex-col items-center justify-center -mt-4">
                <div className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center shadow-lg active:scale-90 transition-transform">
                  {tab.icon(false)}
                </div>
                <span className="text-[10px] text-neutral-500 mt-0.5">{tab.label}</span>
              </Link>
            );
          }

          return (
            <Link key={tab.href} href={tab.href}
              className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-0.5">
              <span className={isActive ? "text-neutral-900" : "text-neutral-400"}>
                {tab.icon(isActive)}
              </span>
              <span className={`text-[10px] ${isActive ? "text-neutral-900 font-medium" : "text-neutral-400"}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
