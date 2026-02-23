import { useState, useMemo } from 'react'
import { AlertTriangle, Bell, Radio, Droplets, Loader2 } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import Badge from '@/components/ui/Badge'
import { useCitizenLocation } from '@/hooks/useCitizenLocation'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import type { DbExternalWarning } from '@/types/database'

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

type SeverityFilter = 'alle' | 'extreme' | 'severe' | 'moderate' | 'minor'
type SourceFilter = 'alle' | 'nina' | 'dwd' | 'pegel'

export default function WarnungenPage() {
  const { location } = useCitizenLocation()
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('alle')
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('alle')

  // District-ID über AGS-Code finden
  const { data: matchingDistricts } = useSupabaseQuery<{ id: string }>(
    (sb) => {
      if (!location?.districtAgs) return sb.from('districts').select('id').eq('id', '00000000-0000-0000-0000-000000000000')
      return sb.from('districts').select('id').eq('ags_code', location.districtAgs).limit(1)
    },
    [location?.districtAgs]
  )

  const districtId = matchingDistricts[0]?.id || null

  // Echte Warnungen laden
  const { data: warnungen, loading } = useSupabaseQuery<DbExternalWarning>(
    (sb) => {
      if (!districtId) return sb.from('external_warnings').select('*').eq('district_id', '00000000-0000-0000-0000-000000000000')
      return sb.from('external_warnings').select('*').eq('district_id', districtId).order('fetched_at', { ascending: false })
    },
    [districtId]
  )

  // Nur aktive Warnungen
  const aktiveWarnungen = useMemo(
    () => warnungen.filter(w => !w.expires_at || new Date(w.expires_at) > new Date()),
    [warnungen]
  )

  // Gefiltert
  const filtered = useMemo(() => {
    let result = aktiveWarnungen
    if (severityFilter !== 'alle') result = result.filter(w => w.severity === severityFilter)
    if (sourceFilter !== 'alle') result = result.filter(w => w.source === sourceFilter)
    return result
  }, [aktiveWarnungen, severityFilter, sourceFilter])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Aktuelle Warnungen"
        description={location ? `NINA, DWD und Pegelstände für ${location.districtName}.` : 'NINA, DWD und Pegelstände in deiner Umgebung.'}
      />

      {/* Filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {/* Severity Filter */}
        {(['alle', 'extreme', 'severe', 'moderate', 'minor'] as SeverityFilter[]).map(s => (
          <button
            key={s}
            onClick={() => setSeverityFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              severityFilter === s
                ? 'bg-primary-600 text-white'
                : 'border border-border bg-white text-text-secondary hover:bg-surface-secondary'
            }`}
          >
            {s === 'alle' ? 'Alle Stufen' : (severityLabel as Record<string, string>)[s]}
          </button>
        ))}

        <div className="mx-1 h-6 w-px bg-border self-center" />

        {/* Source Filter */}
        {(['alle', 'nina', 'dwd', 'pegel'] as SourceFilter[]).map(s => (
          <button
            key={s}
            onClick={() => setSourceFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              sourceFilter === s
                ? 'bg-primary-600 text-white'
                : 'border border-border bg-white text-text-secondary hover:bg-surface-secondary'
            }`}
          >
            {s === 'alle' ? 'Alle Quellen' : s.toUpperCase()}
          </button>
        ))}
      </div>

      {!location ? (
        <EmptyState
          icon={<Bell className="h-6 w-6" />}
          title="Kein Standort eingerichtet"
          description="Bitte wähle unter Einstellungen deinen Landkreis aus, um lokale Warnungen zu erhalten."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-6 w-6" />}
          title="Keine aktiven Warnungen"
          description={`Aktuell liegen keine Warnungen für ${location.districtName} vor. Du wirst automatisch benachrichtigt, sobald eine neue Warnung eintrifft.`}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((w) => {
            const Icon = sourceIcons[w.source as keyof typeof sourceIcons] || Radio
            return (
              <div
                key={w.id}
                className="rounded-2xl border border-border bg-white p-5 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    w.severity === 'extreme' || w.severity === 'severe' ? 'bg-red-50 text-red-500' :
                    w.severity === 'moderate' ? 'bg-amber-50 text-amber-500' :
                    'bg-blue-50 text-blue-500'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-text-primary">{w.title}</h3>
                      <Badge variant={severityVariant[w.severity as keyof typeof severityVariant] || 'info'}>
                        {(severityLabel as Record<string, string>)[w.severity] || w.severity}
                      </Badge>
                      <Badge>{w.source.toUpperCase()}</Badge>
                    </div>
                    {w.description && (
                      <p className="mb-2 text-sm text-text-secondary">{w.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-xs text-text-muted">
                      {w.affected_areas && w.affected_areas.length > 0 && <span>Region: {w.affected_areas.join(', ')}</span>}
                      <span>Seit: {new Date(w.effective_at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      {w.expires_at && (
                        <span>Bis: {new Date(w.expires_at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      )}
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
