'use client'

const SUGGESTION_CHIPS = [
  'Quali sono gli orari di check-in e check-out?',
  'Quali servizi sono disponibili?',
  'Raccontami delle regole della casa',
  'Quali ristoranti mi consigli nelle vicinanze?',
  'Come arrivo alla proprietà?',
]

interface ChatChipsProps {
  onSelect: (question: string) => void
}

export default function ChatChips({ onSelect }: ChatChipsProps) {
  return (
    <div className="p-4 pb-2">
      <p className="text-xs text-neutral-400 mb-3 font-medium tracking-wider uppercase">
        Come posso aiutarti?
      </p>
      <div className="flex flex-wrap gap-2">
        {SUGGESTION_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => onSelect(chip)}
            className="text-xs px-3 py-1.5 rounded-full border border-neutral-200
                       text-neutral-600 hover:border-neutral-900 hover:text-neutral-900
                       transition-colors bg-white cursor-pointer"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  )
}
