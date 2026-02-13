import { useScrollReveal } from '@/hooks/useScrollReveal'
import type { PricingSection as PricingSectionType, TargetGroup } from '@/types'

interface PricingSectionProps {
  pricing: PricingSectionType
  activeTab: TargetGroup
}

export default function PricingSection({ pricing, activeTab }: PricingSectionProps) {
  const isSinglePlan = pricing.plans.length === 1
  const header = useScrollReveal()
  const grid = useScrollReveal()

  return (
    <section id="preise" className="bg-surface-secondary py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div ref={header.ref} className={`reveal mx-auto mb-14 max-w-2xl text-center ${header.isVisible ? 'visible' : ''}`}>
          <span className="mb-4 inline-block text-sm font-semibold uppercase tracking-wider text-accent-500">
            Preise
          </span>
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl">
            {pricing.title}
          </h2>
          <p className="text-lg text-text-secondary">{pricing.subtitle}</p>
        </div>

        <div
          ref={grid.ref}
          className={`reveal-child mx-auto grid gap-6 ${grid.isVisible ? 'visible' : ''} ${
            isSinglePlan
              ? 'max-w-lg grid-cols-1'
              : 'max-w-5xl sm:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {pricing.plans.map((plan) => (
            <div
              key={plan.label}
              className={`relative rounded-2xl border p-8 shadow-sm transition-shadow hover:shadow-lg sm:p-10 ${
                plan.highlighted
                  ? 'border-accent-500 bg-white ring-2 ring-accent-500/20'
                  : 'border-border bg-white'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-accent-500 px-4 py-1 text-xs font-bold text-white shadow-lg shadow-accent-500/25">
                    Empfohlen
                  </span>
                </div>
              )}

              <div className="mb-2 text-sm font-semibold uppercase tracking-wider text-accent-500">
                {plan.label}
              </div>
              <div className="mb-2 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-text-primary sm:text-5xl">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-lg text-text-muted">/ {plan.period}</span>
                )}
              </div>

              <div className="my-6 h-px bg-border" />

              <ul className="mb-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-text-secondary">
                    <svg
                      className="mt-0.5 h-5 w-5 shrink-0 text-primary-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <a
                href={activeTab === 'privat' && !plan.highlighted ? '/signup' : '#kontakt'}
                className={`flex w-full items-center justify-center rounded-xl px-6 py-3.5 text-base font-semibold transition-all ${
                  plan.highlighted
                    ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/25 hover:bg-accent-600'
                    : 'border border-border bg-white text-text-primary hover:border-accent-500 hover:text-accent-500'
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
