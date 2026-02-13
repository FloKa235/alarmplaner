import { ShieldAlert, AlertTriangle } from 'lucide-react'
import { SECTOR_CONFIG } from '@/data/sector-config'
import type { ScenarioHandbook } from '@/types/database'

interface RisikobewertungTabProps {
  handbook: ScenarioHandbook
}

const wahrscheinlichkeitConfig: Record<string, { label: string; color: string; bg: string }> = {
  niedrig: { label: 'Niedrig', color: 'text-green-700', bg: 'bg-green-50' },
  mittel: { label: 'Mittel', color: 'text-amber-700', bg: 'bg-amber-50' },
  hoch: { label: 'Hoch', color: 'text-orange-700', bg: 'bg-orange-50' },
  sehr_hoch: { label: 'Sehr hoch', color: 'text-red-700', bg: 'bg-red-50' },
}

const schadenConfig: Record<string, { label: string; color: string; bg: string }> = {
  gering: { label: 'Gering', color: 'text-green-700', bg: 'bg-green-50' },
  mittel: { label: 'Mittel', color: 'text-amber-700', bg: 'bg-amber-50' },
  erheblich: { label: 'Erheblich', color: 'text-orange-700', bg: 'bg-orange-50' },
  katastrophal: { label: 'Katastrophal', color: 'text-red-700', bg: 'bg-red-50' },
}

export default function RisikobewertungTab({ handbook }: RisikobewertungTabProps) {
  const r = handbook.risikobewertung
  const wk = wahrscheinlichkeitConfig[r.eintrittswahrscheinlichkeit] || wahrscheinlichkeitConfig.mittel
  const sm = schadenConfig[r.schadensausmass] || schadenConfig.mittel

  return (
    <div className="space-y-6">
      {/* Zwei Bewertungs-Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className={`rounded-2xl border border-border p-5 ${wk.bg}`}>
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className={`h-5 w-5 ${wk.color}`} />
            <span className="text-sm font-medium text-text-secondary">Eintrittswahrscheinlichkeit</span>
          </div>
          <p className={`text-2xl font-bold ${wk.color}`}>{wk.label}</p>
        </div>
        <div className={`rounded-2xl border border-border p-5 ${sm.bg}`}>
          <div className="mb-2 flex items-center gap-2">
            <ShieldAlert className={`h-5 w-5 ${sm.color}`} />
            <span className="text-sm font-medium text-text-secondary">Schadensausmaß</span>
          </div>
          <p className={`text-2xl font-bold ${sm.color}`}>{sm.label}</p>
        </div>
      </div>

      {/* Bedrohungsanalyse */}
      <div className="rounded-2xl border border-border bg-white p-6">
        <h3 className="mb-3 text-lg font-bold text-text-primary">Bedrohungsanalyse</h3>
        <p className="leading-relaxed text-text-secondary">{r.bedrohungsanalyse}</p>
      </div>

      {/* Betroffene KRITIS-Sektoren */}
      {r.betroffene_sektoren && r.betroffene_sektoren.length > 0 && (
        <div className="rounded-2xl border border-border bg-white p-6">
          <h3 className="mb-4 text-lg font-bold text-text-primary">Betroffene KRITIS-Sektoren</h3>
          <div className="flex flex-wrap gap-2">
            {r.betroffene_sektoren.map((sektorKey) => {
              const cfg = SECTOR_CONFIG.find(s => s.key === sektorKey)
              if (!cfg) {
                return (
                  <span key={sektorKey} className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700">
                    {sektorKey}
                  </span>
                )
              }
              const Icon = cfg.icon
              return (
                <span key={sektorKey} className={`inline-flex items-center gap-1.5 rounded-full ${cfg.bg} px-3 py-1.5 text-sm font-medium ${cfg.color}`}>
                  <Icon className="h-4 w-4" />
                  {cfg.label}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Risikoeinschätzung */}
      <div className="rounded-2xl border border-border bg-white p-6">
        <h3 className="mb-3 text-lg font-bold text-text-primary">Risikoeinschätzung</h3>
        <p className="leading-relaxed text-text-secondary">{r.risikoeinschaetzung}</p>
      </div>
    </div>
  )
}
