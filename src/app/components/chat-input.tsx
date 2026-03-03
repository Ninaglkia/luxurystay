'use client'

import { useState } from 'react'

interface ChatInputProps {
  onSend: (text: string) => void
  disabled?: boolean
}

export default function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [value, setValue] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-neutral-100">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          placeholder="Scrivi un messaggio..."
          className="flex-1 rounded-full border border-neutral-200 px-4 py-2 text-sm
                     focus:outline-none focus:border-neutral-900
                     disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="rounded-full bg-neutral-900 text-white px-4 py-2 text-sm font-medium
                     hover:bg-neutral-700 transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Invia
        </button>
      </div>
    </form>
  )
}
