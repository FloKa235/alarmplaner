import { useScrollReveal } from '@/hooks/useScrollReveal'
import type { CtaBannerContent, TargetGroup } from '@/types'

interface CTABannerProps {
  content: CtaBannerContent
  activeTab: TargetGroup
}

export default function CTABanner({ content, activeTab }: CTABannerProps) {
  const banner = useScrollReveal()

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#111d35] via-[#1e3154] to-[#243a5e] py-24 sm:py-32">
      {/* Radial glows matching hero */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-600/15 blur-[150px]" />
        <div className="absolute right-1/4 top-1/3 h-[400px] w-[400px] rounded-full bg-accent-500/10 blur-[120px]" />
      </div>

      <div
        ref={banner.ref}
        className={`reveal relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8 ${banner.isVisible ? 'visible' : ''}`}
      >
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm text-text-on-dark-secondary backdrop-blur-sm">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          Starten Sie noch heute
        </div>

        <h2 className="mb-5 text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
          {content.headline}
        </h2>
        <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-text-on-dark-secondary">
          {content.subline}
        </p>
        <a
          href={activeTab === 'privat' ? '/signup' : '#kontakt'}
          className="inline-flex items-center rounded-2xl bg-accent-500 px-10 py-4 text-base font-semibold text-white shadow-lg shadow-accent-500/25 transition-all hover:bg-accent-600 hover:shadow-xl"
        >
          {content.cta}
        </a>
      </div>
    </section>
  )
}
