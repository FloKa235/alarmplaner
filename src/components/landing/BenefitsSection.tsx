import { useScrollReveal } from '@/hooks/useScrollReveal'
import type { Benefit } from '@/types'

interface BenefitsSectionProps {
  title: string
  subtitle: string
  items: Benefit[]
}

function BenefitIcon({ name }: { name: string }) {
  const props = { className: 'h-5 w-5', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 1.5 }
  switch (name) {
    case 'clock': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    case 'grid': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z" /></svg>
    case 'cpu': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" /></svg>
    case 'shield': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
    case 'smartphone': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>
    case 'refresh': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>
    default: return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
  }
}

export default function BenefitsSection({ title, subtitle, items }: BenefitsSectionProps) {
  const header = useScrollReveal()
  const grid = useScrollReveal()

  return (
    <section id="vorteile" className="bg-surface-secondary py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div ref={header.ref} className={`reveal mx-auto mb-14 max-w-2xl text-center ${header.isVisible ? 'visible' : ''}`}>
          <span className="mb-4 inline-block text-sm font-semibold uppercase tracking-wider text-accent-500">
            Vorteile
          </span>
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl lg:text-5xl">
            {title}
          </h2>
          <p className="text-lg text-text-secondary">{subtitle}</p>
        </div>

        <div ref={grid.ref} className={`reveal-child grid gap-5 sm:grid-cols-2 lg:grid-cols-3 ${grid.isVisible ? 'visible' : ''}`}>
          {items.map((benefit) => (
            <div key={benefit.title} className="rounded-2xl border border-border bg-white p-6 transition-shadow hover:shadow-md">
              <div className="mb-4 flex items-start justify-between">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-surface-secondary text-primary-600">
                  <BenefitIcon name={benefit.icon} />
                </div>
                <div className="text-right">
                  <span className="text-3xl font-extrabold text-accent-500">{benefit.stat}</span>
                  {benefit.statSub && (
                    <div className="text-xs text-text-muted">{benefit.statSub}</div>
                  )}
                </div>
              </div>
              <h3 className="mb-1 text-base font-bold text-text-primary">{benefit.title}</h3>
              <p className="text-sm leading-relaxed text-text-secondary">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
