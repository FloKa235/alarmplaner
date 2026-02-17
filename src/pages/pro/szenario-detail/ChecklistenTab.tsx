import {
  CheckCircle2, Circle, MinusCircle, BookOpen,
} from 'lucide-react'
import type { ScenarioHandbookV2 } from '@/types/database'

// ─── Kapitel-Farben (gleich wie KrisenhandbuchTab) ───
const KAPITEL_FARBEN: Record<number, { color: string; bg: string; accent: string }> = {
  1: { color: 'text-red-600', bg: 'bg-red-50', accent: 'bg-red-600' },
  2: { color: 'text-blue-600', bg: 'bg-blue-50', accent: 'bg-blue-600' },
  3: { color: 'text-green-600', bg: 'bg-green-50', accent: 'bg-green-600' },
  4: { color: 'text-amber-600', bg: 'bg-amber-50', accent: 'bg-amber-600' },
  5: { color: 'text-orange-600', bg: 'bg-orange-50', accent: 'bg-orange-600' },
  6: { color: 'text-purple-600', bg: 'bg-purple-50', accent: 'bg-purple-600' },
  7: { color: 'text-teal-600', bg: 'bg-teal-50', accent: 'bg-teal-600' },
}

const defaultFarbe = { color: 'text-gray-600', bg: 'bg-gray-50', accent: 'bg-gray-600' }

interface ChecklistenTabProps {
  handbook: ScenarioHandbookV2
}

export default function ChecklistenTab({ handbook }: ChecklistenTabProps) {
  const kapitel = handbook.kapitel

  // Gesamt-Statistik
  const allItems = kapitel.flatMap(k => k.checkliste)
  const totalDone = allItems.filter(i => i.status === 'done').length
  const totalSkipped = allItems.filter(i => i.status === 'skipped').length
  const totalOpen = allItems.filter(i => i.status === 'open').length
  const totalPercent = allItems.length > 0
    ? Math.round(((totalDone + totalSkipped) / allItems.length) * 100)
    : 0

  return (
    <div className="space-y-4">
      {/* ─── Gesamt-Fortschritt ─── */}
      <div className="rounded-2xl border border-border bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-text-primary">Gesamtfortschritt</h3>
            <p className="mt-1 text-sm text-text-secondary">
              {totalDone + totalSkipped} von {allItems.length} Aufgaben abgeschlossen
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Fortschrittsbalken */}
            <div className="h-3 w-48 overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full transition-all ${totalPercent === 100 ? 'bg-green-500' : totalPercent > 0 ? 'bg-primary-600' : 'bg-gray-300'}`}
                style={{ width: `${totalPercent}%` }}
              />
            </div>
            <span className={`text-xl font-black ${totalPercent === 100 ? 'text-green-600' : 'text-text-primary'}`}>
              {totalPercent}%
            </span>
          </div>
        </div>

        {/* Mini-Stats */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-surface-secondary p-3">
            <Circle className="h-4 w-4 text-text-muted" />
            <div>
              <p className="text-lg font-bold text-text-primary">{totalOpen}</p>
              <p className="text-xs text-text-muted">Offen</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-green-50 p-3">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-lg font-bold text-green-700">{totalDone}</p>
              <p className="text-xs text-green-600">Erledigt</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-gray-50 p-3">
            <MinusCircle className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-lg font-bold text-gray-600">{totalSkipped}</p>
              <p className="text-xs text-gray-500">Übersprungen</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Pro Kapitel ─── */}
      {kapitel.map(kap => {
        const farbe = KAPITEL_FARBEN[kap.nummer] || defaultFarbe
        const items = kap.checkliste
        const done = items.filter(i => i.status === 'done' || i.status === 'skipped').length
        const percent = items.length > 0 ? Math.round((done / items.length) * 100) : 0

        return (
          <div key={kap.id} className="rounded-2xl border border-border bg-white p-5">
            <div className="flex items-center gap-3">
              {/* Kapitel-Nummer */}
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${farbe.bg}`}>
                <span className={`text-sm font-bold ${farbe.color}`}>{kap.nummer}</span>
              </div>

              {/* Titel + Info */}
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-text-primary">{kap.titel}</h4>
                <p className="text-xs text-text-muted">
                  {items.length === 0 ? (
                    'Keine Checklisten-Punkte'
                  ) : (
                    <>{done}/{items.length} erledigt</>
                  )}
                </p>
              </div>

              {/* Fortschrittsbalken */}
              {items.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full transition-all ${percent === 100 ? 'bg-green-500' : percent > 0 ? farbe.accent : 'bg-gray-300'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className={`w-10 text-right text-sm font-bold ${percent === 100 ? 'text-green-600' : 'text-text-primary'}`}>
                    {percent}%
                  </span>
                </div>
              )}
            </div>

            {/* Items-Vorschau (max 3 offene) */}
            {items.length > 0 && (
              <div className="mt-3 ml-11 space-y-1">
                {items.filter(i => i.status === 'open').slice(0, 3).map(item => (
                  <div key={item.id} className="flex items-center gap-2 text-sm text-text-secondary">
                    <Circle className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                    <span className="line-clamp-1">{item.text}</span>
                  </div>
                ))}
                {items.filter(i => i.status === 'open').length > 3 && (
                  <p className="text-xs text-text-muted">
                    + {items.filter(i => i.status === 'open').length - 3} weitere offene Punkte
                  </p>
                )}
                {items.filter(i => i.status === 'open').length === 0 && percent === 100 && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Alle Punkte abgeschlossen
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Hinweis */}
      <div className="flex items-start gap-2 rounded-xl bg-surface-secondary/50 px-4 py-3">
        <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
        <p className="text-xs text-text-muted">
          Checklisten-Punkte können direkt im <strong>Krisenhandbuch</strong>-Tab abgehakt und mit Notizen versehen werden.
        </p>
      </div>
    </div>
  )
}
