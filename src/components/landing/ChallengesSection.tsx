import { useScrollReveal } from '@/hooks/useScrollReveal'
import type { Challenge } from '@/types'

interface ChallengesSectionProps {
  title: string
  subtitle: string
  items: Challenge[]
}

function ChallengeIcon({ name }: { name: string }) {
  const props = { className: 'h-6 w-6', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 1.5 }
  switch (name) {
    case 'flame':
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" /></svg>
    case 'layers':
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" /></svg>
    case 'clock':
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    case 'eye':
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    default:
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
  }
}

export default function ChallengesSection({ title, subtitle, items }: ChallengesSectionProps) {
  const header = useScrollReveal()
  const grid = useScrollReveal()

  return (
    <section className="bg-surface-secondary py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div ref={header.ref} className={`reveal mx-auto mb-14 max-w-2xl text-center ${header.isVisible ? 'visible' : ''}`}>
          <span className="mb-4 inline-block text-sm font-semibold uppercase tracking-wider text-accent-500">
            Die Herausforderung
          </span>
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl lg:text-5xl">
            {title}
          </h2>
          <p className="text-lg text-text-secondary">{subtitle}</p>
        </div>

        <div ref={grid.ref} className={`reveal-child grid gap-6 sm:grid-cols-2 ${grid.isVisible ? 'visible' : ''}`}>
          {items.map((item) => (
            <div key={item.title} className="rounded-2xl border border-border bg-white p-6 transition-shadow hover:shadow-md sm:p-8">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-tint-red text-red-500">
                <ChallengeIcon name={item.icon} />
              </div>
              <h3 className="mb-2 text-lg font-bold text-text-primary">{item.title}</h3>
              <p className="leading-relaxed text-text-secondary">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
