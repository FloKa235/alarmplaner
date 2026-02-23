/**
 * StandortAuswahl — Landkreis-Auswahl für Bürger
 *
 * Wird als Overlay angezeigt wenn der Bürger noch keinen Standort hat.
 * Einfache Suche + Auswahl aus 401 Landkreisen.
 */
import { useState, useMemo } from 'react'
import { MapPin, Search, Loader2, CheckCircle2 } from 'lucide-react'
import { germanDistricts, type GermanDistrict } from '@/data/german-districts'
import { useCitizenLocation, type CitizenLocation } from '@/hooks/useCitizenLocation'

export default function StandortAuswahl() {
  const { saveLocation } = useCitizenLocation()
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<GermanDistrict | null>(null)

  const filtered = useMemo(() => {
    if (!query.trim()) return germanDistricts.slice(0, 20)
    const q = query.toLowerCase()
    return germanDistricts
      .filter(d => d.name.toLowerCase().includes(q) || d.state.toLowerCase().includes(q))
      .slice(0, 20)
  }, [query])

  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    const loc: CitizenLocation = {
      districtName: selected.name,
      districtAgs: selected.agsCode,
      warncellId: selected.warncellId,
      lat: selected.lat,
      lng: selected.lng,
    }
    const success = await saveLocation(loc)
    if (!success) {
      setSaving(false)
    }
    // Bei Erfolg wird die Page durch den Hook automatisch aktualisiert
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">Willkommen beim Alarmplaner</h2>
              <p className="text-sm text-text-secondary">
                Wähle deinen Landkreis, um lokale Warnungen zu erhalten.
              </p>
            </div>
          </div>
        </div>

        {/* Suche */}
        <div className="px-6 pt-5">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Landkreis oder Stadt suchen..."
              autoFocus
              className="w-full rounded-xl border border-border bg-white py-3 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
            />
          </div>
        </div>

        {/* Liste */}
        <div className="max-h-[320px] overflow-y-auto px-6 py-3">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-muted">Kein Landkreis gefunden.</p>
          ) : (
            <div className="space-y-1">
              {filtered.map((d) => (
                <button
                  key={d.agsCode}
                  onClick={() => setSelected(d)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                    selected?.agsCode === d.agsCode
                      ? 'bg-primary-50 text-primary-700'
                      : 'hover:bg-surface-secondary'
                  }`}
                >
                  <MapPin className={`h-4 w-4 shrink-0 ${
                    selected?.agsCode === d.agsCode ? 'text-primary-600' : 'text-text-muted'
                  }`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary">{d.name}</p>
                    <p className="text-xs text-text-muted">{d.state} · {d.population.toLocaleString('de-DE')} Einwohner</p>
                  </div>
                  {selected?.agsCode === d.agsCode && (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary-600" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4">
          <button
            onClick={handleSave}
            disabled={!selected || saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Wird gespeichert...</>
            ) : selected ? (
              <><MapPin className="h-4 w-4" /> {selected.name} als Standort speichern</>
            ) : (
              'Bitte Landkreis auswählen'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
