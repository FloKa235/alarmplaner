import { useScrollReveal } from '@/hooks/useScrollReveal'
import type { TargetGroup } from '@/types'

interface ContactSectionProps {
  activeTab: TargetGroup
}

export default function ContactSection({ activeTab }: ContactSectionProps) {
  const header = useScrollReveal()
  const form = useScrollReveal()

  const isPrivat = activeTab === 'privat'

  return (
    <section id="kontakt" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div ref={header.ref} className={`reveal mx-auto mb-14 max-w-2xl text-center ${header.isVisible ? 'visible' : ''}`}>
          <span className="mb-4 inline-block text-sm font-semibold uppercase tracking-wider text-accent-500">
            Kontakt
          </span>
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl">
            {isPrivat ? 'Fragen? Wir helfen gerne.' : 'Lassen Sie sich beraten'}
          </h2>
          <p className="text-lg text-text-secondary">
            {isPrivat
              ? 'Schreib uns eine Nachricht – wir melden uns schnellstmöglich.'
              : 'Erfahren Sie in einem persönlichen Gespräch, wie Alarmplaner Ihre Organisation unterstützt.'}
          </p>
        </div>

        <div ref={form.ref} className={`reveal mx-auto max-w-2xl ${form.isVisible ? 'visible' : ''}`}>
          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-name" className="mb-1.5 block text-sm font-medium text-text-primary">
                  Name *
                </label>
                <input
                  id="contact-name"
                  type="text"
                  placeholder="Ihr Name"
                  required
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium text-text-primary">
                  E-Mail *
                </label>
                <input
                  id="contact-email"
                  type="email"
                  placeholder="ihre@email.de"
                  required
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                />
              </div>
            </div>

            {!isPrivat && (
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact-org" className="mb-1.5 block text-sm font-medium text-text-primary">
                    Organisation
                  </label>
                  <input
                    id="contact-org"
                    type="text"
                    placeholder={activeTab === 'kommunen' ? 'Gemeinde / Landkreis' : 'Unternehmen'}
                    className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                  />
                </div>
                <div>
                  <label htmlFor="contact-phone" className="mb-1.5 block text-sm font-medium text-text-primary">
                    Telefon
                  </label>
                  <input
                    id="contact-phone"
                    type="tel"
                    placeholder="+49 ..."
                    className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="contact-message" className="mb-1.5 block text-sm font-medium text-text-primary">
                Nachricht *
              </label>
              <textarea
                id="contact-message"
                rows={5}
                placeholder={isPrivat ? 'Wie können wir dir helfen?' : 'Wie können wir Ihnen helfen? Erzählen Sie uns von Ihren Anforderungen.'}
                required
                className="w-full resize-none rounded-xl border border-border bg-white px-4 py-3 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
              />
            </div>

            <div className="flex items-start gap-3">
              <input
                id="contact-privacy"
                type="checkbox"
                required
                className="mt-0.5 h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-600/20"
              />
              <label htmlFor="contact-privacy" className="text-sm text-text-secondary">
                Ich stimme der Verarbeitung meiner Daten gemäß der{' '}
                <a href="/datenschutz" className="text-primary-600 hover:underline">
                  Datenschutzerklärung
                </a>{' '}
                zu. *
              </label>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-accent-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-accent-500/25 transition-all hover:bg-accent-600 hover:shadow-xl sm:w-auto"
            >
              {isPrivat ? 'Nachricht senden' : 'Anfrage absenden'}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
