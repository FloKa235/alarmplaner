import { useEffect, useState } from 'react'
import type { TargetGroup } from '@/types'

const navLinks = [
  { label: 'Funktionen', href: '#funktionen' },
  { label: 'Vorteile', href: '#vorteile' },
  { label: 'Preise', href: '#preise' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Kontakt', href: '#kontakt' },
]

interface NavbarProps {
  activeTab: TargetGroup
  onTabChange: (tab: TargetGroup) => void
}

export default function Navbar({ activeTab: _activeTab, onTabChange: _onTabChange }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-border bg-white/95 shadow-sm backdrop-blur-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-colors duration-300 ${
              scrolled ? 'border-border bg-primary-600' : 'border-white/20 bg-white/10'
            }`}
          >
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <span
            className={`text-lg font-bold transition-colors duration-300 ${
              scrolled ? 'text-text-primary' : 'text-white'
            }`}
          >
            Alarmplaner
          </span>
        </div>

        {/* Nav Links – Desktop */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-sm transition-colors duration-300 ${
                scrolled
                  ? 'text-text-secondary hover:text-text-primary'
                  : 'text-text-on-dark-secondary hover:text-white'
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <a
            href="/login"
            className={`hidden rounded-xl border px-5 py-2 text-sm font-medium transition-all duration-300 sm:inline-flex ${
              scrolled
                ? 'border-border text-text-primary hover:bg-surface-secondary'
                : 'border-white/20 text-white hover:bg-white/10'
            }`}
          >
            Login
          </a>
          <a
            href="#kontakt"
            className="inline-flex rounded-xl bg-accent-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-600"
          >
            Demo anfragen
          </a>
        </div>
      </div>
    </nav>
  )
}
