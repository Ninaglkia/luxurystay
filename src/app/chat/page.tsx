import ChatWidget from '@/app/components/chat-widget'

export default function ChatPage() {
  return (
    <main className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl h-[600px] rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="h-full flex flex-col">
          <div className="px-6 py-4 border-b border-neutral-100">
            <h1 className="text-sm font-medium text-neutral-900">Concierge LuxuryStay</h1>
            <p className="text-xs text-neutral-400 mt-0.5">Sono qui per assisterti</p>
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatWidget className="h-full" />
          </div>
        </div>
      </div>
    </main>
  )
}
