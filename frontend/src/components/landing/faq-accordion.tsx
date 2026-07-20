import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

export interface FaqItem {
  question: string
  answer: string
}

interface FaqAccordionProps {
  items: FaqItem[]
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx)
  }

  return (
    <div className="space-y-4">
      {items.map((item, idx) => {
        const isOpen = openIndex === idx
        return (
          <div
            key={idx}
            className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
              isOpen
                ? 'border-indigo-200 bg-white shadow-md shadow-indigo-500/5'
                : 'border-gray-200/80 bg-white/70 hover:bg-white hover:border-gray-300 shadow-sm'
            }`}
          >
            <button
              type="button"
              onClick={() => toggle(idx)}
              className="flex w-full items-center justify-between p-6 text-left"
            >
              <span className="font-display text-base font-bold text-gray-900 sm:text-lg">
                {item.question}
              </span>
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-300 ${
                  isOpen
                    ? 'bg-indigo-50 text-indigo-600 rotate-180'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                <ChevronDown className="h-4 w-4" />
              </div>
            </button>

            <AnimatePresence mode="wait">
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="border-t border-gray-100 px-6 pb-6 pt-4 text-sm leading-relaxed text-gray-600">
                    {item.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
