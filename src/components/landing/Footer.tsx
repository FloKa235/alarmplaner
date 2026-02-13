export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-gradient-to-br from-[#111d35] via-[#1e3154] to-[#243a5e]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-white/10">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <span className="font-bold text-white">Alarmplaner</span>
            </div>
            <p className="text-sm leading-relaxed text-text-on-dark-secondary">
              KI-gestütztes Krisenmanagement für Familien, Kommunen und Unternehmen. Made in Germany.
            </p>
          </div>

          {/* Produkt */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Produkt</h4>
            <ul className="space-y-2 text-sm text-text-on-dark-secondary">
              <li><a href="#funktionen" className="transition-colors hover:text-white">Funktionen</a></li>
              <li><a href="#preise" className="transition-colors hover:text-white">Preise</a></li>
              <li><a href="#" className="transition-colors hover:text-white">Für Kommunen</a></li>
              <li><a href="#" className="transition-colors hover:text-white">Für Unternehmen</a></li>
            </ul>
          </div>

          {/* Unternehmen */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Unternehmen</h4>
            <ul className="space-y-2 text-sm text-text-on-dark-secondary">
              <li><a href="#" className="transition-colors hover:text-white">Über uns</a></li>
              <li><a href="#kontakt" className="transition-colors hover:text-white">Kontakt</a></li>
              <li><a href="#" className="transition-colors hover:text-white">Blog</a></li>
            </ul>
          </div>

          {/* Rechtliches */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Rechtliches</h4>
            <ul className="space-y-2 text-sm text-text-on-dark-secondary">
              <li><a href="/impressum" className="transition-colors hover:text-white">Impressum</a></li>
              <li><a href="/datenschutz" className="transition-colors hover:text-white">Datenschutz</a></li>
              <li><a href="/agb" className="transition-colors hover:text-white">AGB</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-sm text-text-on-dark-secondary">
          &copy; {new Date().getFullYear()} Alarmplaner. Alle Rechte vorbehalten.
        </div>
      </div>
    </footer>
  )
}
