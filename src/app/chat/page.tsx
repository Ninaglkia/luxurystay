import type { Metadata } from 'next'
import ChatWidget from '@/app/components/chat-widget'

export const metadata: Metadata = {
  title: 'Chat | LuxuryStay',
  description: 'Parla con il nostro concierge AI',
}

export default function ChatPage() {
  return (
    <main className="h-dvh w-full flex flex-col bg-white overflow-hidden">
      <header className="flex-none px-6 py-4 border-b border-neutral-100 bg-white">
        <h1 className="text-sm font-medium text-neutral-900">Concierge LuxuryStay</h1>
        <p className="text-xs text-neutral-400 mt-0.5">Sono qui per assisterti</p>
      </header>
      <div className="flex-1 min-h-0">
        <ChatWidget className="h-full" />
      </div>
    </main>
  )
}
