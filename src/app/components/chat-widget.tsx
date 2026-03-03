'use client'

import { useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import ChatMessages from './chat-messages'
import ChatInput from './chat-input'
import ChatChips from './chat-chips'

interface ChatWidgetProps {
  propertyId?: string
  className?: string
}

function loadFromSession(key: string): UIMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? (JSON.parse(raw) as UIMessage[]) : []
  } catch {
    return []
  }
}

export default function ChatWidget({ propertyId, className }: ChatWidgetProps) {
  const sessionKey = `luxurystay_chat_${propertyId ?? 'general'}`

  const { messages, sendMessage, status } = useChat({
    messages: loadFromSession(sessionKey),
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: () => ({ propertyId: propertyId ?? null }),
    }),
  })

  // Persist messages on every change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        sessionStorage.setItem(sessionKey, JSON.stringify(messages))
      } catch {
        // sessionStorage full or unavailable — degrade silently
      }
    }
  }, [messages, sessionKey])

  const isLoading = status === 'submitted' || status === 'streaming'
  const isEmpty = messages.length === 0

  return (
    <div className={`flex flex-col h-full bg-white ${className ?? ''}`}>
      {isEmpty && (
        <ChatChips onSelect={(q) => sendMessage({ text: q })} />
      )}
      <ChatMessages
        messages={messages}
        isStreaming={status === 'streaming'}
      />
      <ChatInput
        onSend={(text) => sendMessage({ text })}
        disabled={isLoading}
      />
    </div>
  )
}
