import { useState } from 'react'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import type { FaqItem } from '@/types'

interface FAQSectionProps {
  items: FaqItem[]
}

export default function FAQSection({ items }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const header = useScrollReveal()
  const list = useScrollReveal()

  return (
    <section id="faq" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div ref={header.ref} className={`reveal mx-auto mb-14 max-w-2xl text-center ${header.isVisible ? 'visible' : ''}`}>
          <span className="mb-4 inline-block text-sm font-semibold uppercase tracking-wider text-accent-500">
            FAQ
          </span>
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl">
            Häufige Fragen
          </h2>
        </div>

        <div ref={list.ref} className={`reveal-child mx-auto max-w-3xl space-y-3 ${list.isVisible ? 'visible' : ''}`}>
          {items.map((item, i) => {
            const isOpen = openIndex === i
            return (
              <div key={i} className="overflow-hidden rounded-2xl border border-border bg-white">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left"
                >
                  <span className="pr-4 font-semibold text-text-primary">{item.question}</span>
                  <svg
                    className={`h-5 w-5 shrink-0 text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 pb-5' : 'max-h-0'}`}>
                  <p className="px-6 leading-relaxed text-text-secondary">{item.answer}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
