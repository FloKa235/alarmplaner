import { AlertTriangle, Bell, Radio, Droplets, Filter } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import Badge from '@/components/ui/Badge'

const mockWarnungen = [
  {
    id: '1',
    type: 'dwd' as const,
    severity: 'moderate' as const,
    title: 'Amtliche Warnung vor Sturmböen',
    description: 'Es werden Sturmböen mit Geschwindigkeiten zwischen 65 km/h und 85 km/h erwartet.',
    region: 'Berlin und Brandenburg',
    startDate: '2025-02-10T08:00:00',
  },
  {
    id: '2',
    type: 'nina' as const,
    severity: 'minor' as const,
    title: 'Verkehrsstörung A10',
    description: 'Vollsperrung der A10 zwischen Dreieck Spreeau und Schönefelder Kreuz.',
    region: 'Berlin-Brandenburg',
    startDate: '2025-02-10T06:30:00',
  },
]

const sourceIcons = {
  nina: Radio,
  dwd: AlertTriangle,
  pegel: Droplets,
}

const severityVariant = {
  minor: 'info' as const,
  moderate: 'warning' as const,
  severe: 'danger' as const,
  extreme: 'danger' as const,
}

const severityLabel = {
  minor: 'Gering',
  moderate: 'Mäßig',
  severe: 'Schwer',
  extreme: 'Extrem',
}

export default function WarnungenPage() {
  return (
    <div>
      <PageHeader
        title="Aktuelle Warnungen"
        description="NINA, DWD und Pegelstände in deiner Umgebung."
        actions={
          <button className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary">
            <Filter className="h-4 w-4" />
            Filter
          </button>
        }
      />

      {mockWarnungen.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-6 w-6" />}
          title="Keine aktiven Warnungen"
          description="Aktuell liegen keine Warnungen für deinen Standort vor. Du wirst automatisch benachrichtigt, sobald eine neue Warnung eintrifft."
        />
      ) : (
        <div className="space-y-3">
          {mockWarnungen.map((w) => {
            const Icon = sourceIcons[w.type]
            return (
              <div
                key={w.id}
                className="rounded-2xl border border-border bg-white p-5 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-text-primary">{w.title}</h3>
                      <Badge variant={severityVariant[w.severity]}>{severityLabel[w.severity]}</Badge>
                      <Badge>{w.type.toUpperCase()}</Badge>
                    </div>
                    <p className="mb-2 text-sm text-text-secondary">{w.description}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-text-muted">
                      <span>Region: {w.region}</span>
                      <span>Seit: {new Date(w.startDate).toLocaleString('de-DE')}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
