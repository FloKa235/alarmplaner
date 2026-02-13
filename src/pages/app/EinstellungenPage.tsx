import { MapPin, Bell, User, Shield } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'

export default function EinstellungenPage() {
  return (
    <div>
      <PageHeader title="Einstellungen" description="Verwalte deinen Standort, Benachrichtigungen und dein Profil." />

      <div className="space-y-6">
        {/* Standort */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-text-primary">Standort</h2>
              <p className="text-sm text-text-secondary">Dein Standort für lokale Warnungen</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">Standort-Name</label>
              <input
                type="text"
                value="Berlin"
                readOnly
                className="w-full rounded-xl border border-border bg-surface-secondary px-4 py-2.5 text-sm text-text-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">Radius (km)</label>
              <input
                type="number"
                value={50}
                readOnly
                className="w-full rounded-xl border border-border bg-surface-secondary px-4 py-2.5 text-sm text-text-primary"
              />
            </div>
          </div>
          <button className="mt-4 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700">
            Standort ändern
          </button>
        </div>

        {/* Benachrichtigungen */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-text-primary">Benachrichtigungen</h2>
              <p className="text-sm text-text-secondary">Wähle, wie du informiert werden möchtest</p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Push-Benachrichtigungen', desc: 'Warnungen direkt auf dein Gerät', checked: true },
              { label: 'E-Mail-Benachrichtigungen', desc: 'Zusammenfassung per E-Mail', checked: false },
              { label: 'Nur schwere Warnungen', desc: 'Nur bei Warnstufe "Schwer" oder höher', checked: false },
            ].map((opt) => (
              <div key={opt.label} className="flex items-center justify-between rounded-xl bg-surface-secondary p-4">
                <div>
                  <p className="text-sm font-medium text-text-primary">{opt.label}</p>
                  <p className="text-xs text-text-muted">{opt.desc}</p>
                </div>
                <div
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    opt.checked ? 'bg-primary-600' : 'bg-border'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      opt.checked ? 'left-[22px]' : 'left-0.5'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Profil */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-text-primary">Profil</h2>
              <p className="text-sm text-text-secondary">Deine persönlichen Daten</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">Name</label>
              <input
                type="text"
                value="Max Mustermann"
                readOnly
                className="w-full rounded-xl border border-border bg-surface-secondary px-4 py-2.5 text-sm text-text-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">E-Mail</label>
              <input
                type="email"
                value="max@example.de"
                readOnly
                className="w-full rounded-xl border border-border bg-surface-secondary px-4 py-2.5 text-sm text-text-primary"
              />
            </div>
          </div>
        </div>

        {/* Datenschutz */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-text-primary">Datenschutz & Konto</h2>
              <p className="text-sm text-text-secondary">Daten exportieren oder Konto löschen</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary">
              Daten exportieren
            </button>
            <button className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50">
              Konto löschen
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
