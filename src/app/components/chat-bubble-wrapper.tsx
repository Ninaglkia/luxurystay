'use client'

import dynamic from 'next/dynamic'

const ChatBubble = dynamic(() => import('./chat-bubble'), {
  ssr: false,
  loading: () => null,
})

export default function ChatBubbleWrapper() {
  return <ChatBubble />
}
