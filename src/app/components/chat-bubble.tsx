'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import ChatWidget from './chat-widget'

export default function ChatBubble() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  if (pathname === '/chat') return null

  return (
    <>
      <button
        className="fixed z-50 w-14 h-14 rounded-full
                   bg-neutral-900 text-white shadow-lg
                   flex items-center justify-center
                   hover:bg-neutral-700 transition-colors
                   focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-900"
        style={{
          bottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))',
          right: '1.5rem',
        }}
        aria-label={isOpen ? 'Chiudi chat' : 'Apri chat'}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {isOpen ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
          >
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z" />
            <path d="M7 9h10v2H7zm0-3h10v2H7z" />
          </svg>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-overlay"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-6 z-40
                       w-[calc(100vw-3rem)] max-w-sm
                       h-[min(600px,80dvh)]
                       rounded-2xl shadow-2xl overflow-hidden
                       border border-neutral-200"
            style={{
              bottom:
                'max(5.5rem, calc(env(safe-area-inset-bottom, 0px) + 5.5rem))',
            }}
          >
            <ChatWidget />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
