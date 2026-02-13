import type { HeroContent, TargetGroup } from '@/types'

const tabs: { key: TargetGroup; label: string }[] = [
  { key: 'kommunen', label: 'Kommunen' },
  { key: 'unternehmen', label: 'Unternehmen' },
  { key: 'privat', label: 'Privat' },
]

interface HeroSectionProps {
  content: HeroContent
  activeTab: TargetGroup
  onTabChange: (tab: TargetGroup) => void
}

export default function HeroSection({ content, activeTab, onTabChange }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#111d35] via-[#1e3154] to-[#243a5e]">
      {/* Warm radial glows for lighter feel */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-600/15 blur-[150px]" />
        <div className="absolute right-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-accent-500/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[600px] rounded-full bg-primary-400/8 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-32 lg:px-8 lg:pb-24 lg:pt-36">
        <div className="hero-animate mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm text-text-on-dark-secondary backdrop-blur-sm">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {content.badge}
          </div>

          {/* Headline with colored words */}
          <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
            {content.headlineParts.map((part, i) => {
              if (part.text.includes('\n')) {
                const segments = part.text.split('\n')
                return (
                  <span key={i}>
                    {segments.map((seg, j) => (
                      <span key={j}>
                        {seg && <span className={getColorClass(part.color)}>{seg}</span>}
                        {j < segments.length - 1 && <br />}
                      </span>
                    ))}
                  </span>
                )
              }
              return (
                <span key={i} className={getColorClass(part.color)}>
                  {part.text}
                </span>
              )
            })}
          </h1>

          {/* Subline */}
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-text-on-dark-secondary sm:text-xl">
            {content.subline}
          </p>

          {/* Tab selector */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <span className="text-sm text-text-on-dark-secondary">Wählen Sie Ihre Zielgruppe:</span>
            <div className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 p-1 backdrop-blur-sm">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => onTabChange(tab.key)}
                  className={`rounded-full px-6 py-2.5 text-sm font-medium transition-all ${
                    activeTab === tab.key
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                      : 'text-text-on-dark-secondary hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href={activeTab === 'privat' ? '/signup' : '#kontakt'}
              className="inline-flex items-center rounded-2xl bg-accent-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-accent-500/25 transition-all hover:bg-accent-600 hover:shadow-xl"
            >
              {content.primaryCta}
            </a>
            {content.secondaryCta && (
              <a
                href="#kontakt"
                className="inline-flex items-center rounded-2xl border border-white/20 bg-white/5 px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-white/10"
              >
                {content.secondaryCta}
              </a>
            )}
          </div>

          {/* Trust badges */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {content.trustBadges.map((badge) => (
              <span
                key={badge}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-text-on-dark-secondary"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom gradient line */}
      <div className="h-1 bg-gradient-to-r from-primary-600 via-accent-500 to-primary-600" />
    </section>
  )
}

function getColorClass(color?: 'orange' | 'blue' | 'white') {
  switch (color) {
    case 'orange':
      return 'text-accent-500'
    case 'blue':
      return 'text-primary-400'
    default:
      return ''
  }
}
