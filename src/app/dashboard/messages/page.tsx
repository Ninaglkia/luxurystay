"use client";

import ChatWidget from "@/app/components/chat-widget";

export default function MessagesPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="px-6 py-4 border-b border-neutral-100 shrink-0">
        <h1 className="text-lg font-semibold text-neutral-900">Messaggi</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Parla con il concierge LuxuryStay
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <ChatWidget className="h-full" />
      </div>
    </div>
  );
}
