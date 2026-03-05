/**
 * VorbereitungPage — Landkreis-Vorbereitung
 *
 * ExTrass-Checklisten (18 Kategorien, Johanniter/BBK)
 */
import { useMemo } from 'react'
import {
  ShieldCheck, CheckCircle2, AlertCircle, XCircle, MinusCircle,
} from 'lucide-react'
import { useDistrict } from '@/hooks/useDistrict'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import type { DbChecklist } from '@/types/database'
import ExTrassChecklistView from '@/components/checklists/ExTrassChecklistView'

export default function VorbereitungPage() {
  const { districtId } = useDistrict()

  const { data: checklists, loading, refetch } = useSupabaseQuery<DbChecklist>(
    (sb) =>
      sb
        .from('checklists')
        .select('*')
        .eq('district_id', districtId!)
        .eq('category', 'vorbereitung')
        .is('scenario_id', null)
        .order('title'),
    [districtId],
  )

  // ─── Stats berechnen ───────────────────────────────
  const { pct, done, partial, open, skipped, total } = useMemo(() => {
    const allItems = (checklists || []).flatMap((c) => c.items || [])
    const d = allItems.filter((i) => i.status === 'done').length
    const p = allItems.filter((i) => i.status === 'partial').length
    const o = allItems.filter((i) => i.status === 'open').length
    const s = allItems.filter((i) => i.status === 'skipped').length
    const t = allItems.length
    const percent = t > 0 ? Math.round(((d + p * 0.5) / t) * 100) : 0
    return { pct: percent, done: d, partial: p, open: o, skipped: s, total: t }
  }, [checklists])

  const scoreColor =
    pct >= 75 ? 'text-green-600' : pct >= 40 ? 'text-amber-600' : 'text-red-600'
  const ringColor =
    pct >= 75 ? 'stroke-green-500' : pct >= 40 ? 'stroke-amber-500' : 'stroke-red-500'

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
            <ShieldCheck className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Vorbereitung</h1>
            <p className="text-sm text-text-secondary">
              Checklisten und Vorsorge-Status
            </p>
          </div>
        </div>
      </div>

      {/* Hero Score + Stats */}
      {total > 0 && (
        <div className="rounded-2xl border border-border bg-white p-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            {/* Radial Score */}
            <div className="flex flex-col items-center">
              <div className="relative h-28 w-28">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    strokeWidth="8"
                    className="stroke-gray-100"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${pct * 2.64} 264`}
                    className={`${ringColor} transition-all duration-700`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-extrabold ${scoreColor}`}>{pct}%</span>
                </div>
              </div>
              <p className="mt-1 text-xs font-medium text-text-secondary">Erfüllungsgrad</p>
            </div>

            {/* Summary Stats */}
            <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
                <CheckCircle2 className="mx-auto mb-1 h-5 w-5 text-green-600" />
                <p className="text-2xl font-bold text-green-700">{done}</p>
                <p className="text-xs text-green-600">Erfüllt</p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
                <AlertCircle className="mx-auto mb-1 h-5 w-5 text-amber-600" />
                <p className="text-2xl font-bold text-amber-700">{partial}</p>
                <p className="text-xs text-amber-600">Teilweise</p>
              </div>
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
                <XCircle className="mx-auto mb-1 h-5 w-5 text-red-600" />
                <p className="text-2xl font-bold text-red-700">{open}</p>
                <p className="text-xs text-red-600">Nicht erfüllt</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
                <MinusCircle className="mx-auto mb-1 h-5 w-5 text-gray-500" />
                <p className="text-2xl font-bold text-gray-600">{skipped}</p>
                <p className="text-xs text-gray-500">Kein Bedarf</p>
              </div>
            </div>
          </div>

          {/* Gesamt-Fortschrittsbalken */}
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs text-text-secondary">
              <span>{done + partial + skipped} von {total} Prüfpunkten bearbeitet</span>
              <span className="font-medium">{total - done - partial - skipped} offen</span>
            </div>
            <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div className="flex h-full">
                <div
                  className="bg-green-500 transition-all duration-500"
                  style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
                />
                <div
                  className="bg-amber-400 transition-all duration-500"
                  style={{ width: `${total > 0 ? (partial / total) * 100 : 0}%` }}
                />
                <div
                  className="bg-gray-300 transition-all duration-500"
                  style={{ width: `${total > 0 ? (skipped / total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ExTrass Checklisten-Accordion (18 Kategorien) */}
      <ExTrassChecklistView
        checklists={checklists || []}
        districtId={districtId!}
        loading={loading}
        onRefetch={refetch}
        hideStats
      />
    </div>
  )
}
