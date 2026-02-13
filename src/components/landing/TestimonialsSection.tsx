import { useScrollReveal } from '@/hooks/useScrollReveal'
import type { Testimonial } from '@/types'

interface TestimonialsSectionProps {
  title: string
  items: Testimonial[]
}

export default function TestimonialsSection({ title, items }: TestimonialsSectionProps) {
  const header = useScrollReveal()
  const grid = useScrollReveal()

  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div ref={header.ref} className={`reveal mx-auto mb-14 max-w-2xl text-center ${header.isVisible ? 'visible' : ''}`}>
          <span className="mb-4 inline-block text-sm font-semibold uppercase tracking-wider text-accent-500">
            Referenzen
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl lg:text-5xl">
            {title}
          </h2>
        </div>

        <div ref={grid.ref} className={`reveal-child grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${grid.isVisible ? 'visible' : ''}`}>
          {items.map((testimonial) => (
            <div key={testimonial.name} className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
              {/* Quote icon */}
              <div className="mb-4 text-4xl font-serif text-primary-200">&ldquo;</div>

              {/* Quote text */}
              <p className="mb-6 leading-relaxed text-text-secondary">
                &ldquo;{testimonial.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-slate text-sm font-bold text-white">
                  {testimonial.initials}
                </div>
                <div>
                  <div className="text-sm font-bold text-text-primary">{testimonial.name}</div>
                  <div className="text-xs text-text-secondary">{testimonial.role}</div>
                  <div className="text-xs text-text-muted">{testimonial.org}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
