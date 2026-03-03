'use client'

import { useEffect, useRef } from 'react'
import type { UIMessage } from 'ai'

interface ChatMessagesProps {
  messages: UIMessage[]
  isStreaming: boolean
}

export default function ChatMessages({ messages, isStreaming }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming])

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              message.role === 'user'
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-900'
            }`}
          >
            {message.parts
              .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
              .map((p, i) => (
                <span key={i}>{p.text}</span>
              ))}
          </div>
        </div>
      ))}
      {isStreaming && (
        <div className="flex justify-start">
          <div className="bg-neutral-100 text-neutral-400 rounded-2xl px-4 py-3 text-sm">
            <span className="animate-pulse">...</span>
          </div>
        </div>
      )}
      {/* Sentinel — always rendered, always at the bottom of the list */}
      <div ref={bottomRef} aria-hidden="true" />
    </div>
  )
}
