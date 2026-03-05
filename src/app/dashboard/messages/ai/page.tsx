"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ChatWidget from "@/app/components/chat-widget";

export default function AIChatPage() {
  return (
    <div className="-mx-4 -my-6 lg:-mx-8 flex flex-col h-[100dvh] lg:h-screen">
      {/* Header */}
      <div className="px-4 py-4 lg:px-8">
        <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
          <Link
            href="/dashboard/messages"
            className="flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </Link>
          <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center">
            <span className="text-white font-bold text-xs">LS</span>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">
              Assistenza LuxuryStay
            </span>
            <span className="text-xs text-emerald-500">Online</span>
          </div>
        </div>
      </div>

      {/* Chat Widget */}
      <div className="flex-1 overflow-hidden px-4 lg:px-8 pb-20 lg:pb-4">
        <ChatWidget className="h-full" />
      </div>
    </div>
  );
}
