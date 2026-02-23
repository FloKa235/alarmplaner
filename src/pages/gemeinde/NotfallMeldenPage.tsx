import { useState } from 'react'
import {
  AlertTriangle, Send, Loader2, CheckCircle2, Clock, MapPin, Bell,
  ArrowUpRight, Users, Sparkles,
} from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import StatCard from '@/components/ui/StatCard'
import Modal, { FormField, inputClass, selectClass, textareaClass } from '@/components/ui/Modal'
import { useMembership } from '@/hooks/useMembership'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { useAuth } from '@/contexts/AuthContext'
import { useGeocode } from '@/hooks/useGeocode'
import { supabase } from '@/lib/supabase'
import type { DbIncidentReport, DbAlert, DbScenario, DbAlertContact, IncidentSeverity } from '@/types/database'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const severityConfig: Record<IncidentSeverity, { label: string; bg: string; color: string; ring: string }> = {
  niedrig: { label: 'Niedrig', bg: 'bg-green-50', color: 'text-green-700', ring: 'ring-green-200' },
  mittel: { label: 'Mittel', bg: 'bg-amber-50', color: 'text-amber-700', ring: 'ring-amber-200' },
  hoch: { label: 'Hoch', bg: 'bg-orange-50', color: 'text-orange-700', ring: 'ring-orange-200' },
  kritisch: { label: 'Kritisch', bg: 'bg-red-50', color: 'text-red-700', ring: 'ring-red-200' },
}

const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
  offen: { label: 'Offen', bg: 'bg-red-100', color: 'text-red-700' },
  in_bearbeitung: { label: 'In Bearbeitung', bg: 'bg-amber-100', color: 'text-amber-700' },
  erledigt: { label: 'Erledigt', bg: 'bg-green-100', color: 'text-green-700' },
  abgelehnt: { label: 'Abgelehnt', bg: 'bg-gray-100', color: 'text-gray-700' },
}

const alertStatusConfig: Record<string, { label: string; variant: 'default' | 'warning' | 'info' | 'success' }> = {
  draft: { label: 'Entwurf', variant: 'default' },
  sent: { label: 'Gesendet', variant: 'warning' },
  acknowledged: { label: 'Bestätigt', variant: 'info' },
  resolved: { label: 'Abgeschlossen', variant: 'success' },
}

const levelColor = {
  1: 'bg-amber-50 text-amber-600 border-amber-200',
  2: 'bg-orange-50 text-orange-600 border-orange-200',
  3: 'bg-red-50 text-red-600 border-red-200',
}

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'naturereignis', label: 'Naturereignis (Hochwasser, Sturm, Brand)' },
  { value: 'infrastruktur', label: 'Infrastruktur (Straßen, Gebäude, Brücken)' },
  { value: 'versorgung', label: 'Versorgung (Strom, Wasser, Gas)' },
  { value: 'sicherheit', label: 'Sicherheit (Evakuierung, Gefahrstoff)' },
  { value: 'gesundheit', label: 'Gesundheit (Pandemie, Trinkwasser)' },
  { value: 'sonstiges', label: 'Sonstiges' },
]

const channelOptions = ['SMS', 'E-Mail', 'App-Push']
const groupOptions = ['Feuerwehr', 'Polizei', 'THW', 'Rettungsdienst', 'Verwaltung']

type ActiveTab = 'meldung' | 'alarm'

export default function NotfallMeldenPage() {
  const { municipalityId, districtId, municipality } = useMembership()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<ActiveTab>('alarm')

  // --- Meldung State ---
  const [meldSaving, setMeldSaving] = useState(false)
  const [meldSuccess, setMeldSuccess] = useState(false)
  const [meldForm, setMeldForm] = useState({
    title: '', description: '', severity: 'mittel' as IncidentSeverity,
    category: '', address: '', latitude: '', longitude: '',
  })

  // --- Alarm State ---
  const [showAlarmModal, setShowAlarmModal] = useState(false)
  const [alarmSaving, setAlarmSaving] = useState(false)
  const [aiMsgLoading, setAiMsgLoading] = useState(false)
  const [alarmForm, setAlarmForm] = useState({
    title: '', level: 2, message: '', scenario_id: '',
    target_groups: [] as string[], channels: ['E-Mail'] as string[],
  })

  // --- Geocode ---
  const { suggestions: geoSuggestions, search: geoSearch, clear: geoClear, loading: geoLoading } = useGeocode(5)
  const [showGeoSuggestions, setShowGeoSuggestions] = useState(false)

  // --- Queries ---
  const { data: meldungen, refetch: refetchMeldungen } = useSupabaseQuery<DbIncidentReport>(
    (sb) => sb.from('incident_reports').select('*').eq('municipality_id', municipalityId!).order('created_at', { ascending: false }),
    [municipalityId]
  )

  const { data: gemeindeAlerts, refetch: refetchAlerts } = useSupabaseQuery<DbAlert>(
    (sb) => sb.from('alerts').select('*').eq('source_municipality_id', municipalityId!).order('created_at', { ascending: false }),
    [municipalityId]
  )

  const { data: scenarios } = useSupabaseQuery<DbScenario>(
    (sb) => sb.from('scenarios').select('*').eq('district_id', districtId!).order('title'),
    [districtId]
  )

  const { data: contacts } = useSupabaseQuery<DbAlertContact>(
    (sb) => sb.from('alert_contacts').select('*').eq('district_id', districtId!).eq('is_active', true),
    [districtId]
  )

  // --- Meldung Submit ---
  const handleMeldung = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!meldForm.title.trim() || !districtId || !municipalityId || !user) return
    setMeldSaving(true); setMeldSuccess(false)
    try {
      const { error } = await supabase.from('incident_reports').insert({
        district_id: districtId, municipality_id: municipalityId, reported_by: user.id,
        title: meldForm.title.trim(), description: meldForm.description.trim() || null,
        severity: meldForm.severity, category: meldForm.category || null,
        latitude: meldForm.latitude ? Number(meldForm.latitude) : null,
        longitude: meldForm.longitude ? Number(meldForm.longitude) : null,
      })
      if (error) throw error
      setMeldSuccess(true)
      setMeldForm({ title: '', description: '', severity: 'mittel', category: '', address: '', latitude: '', longitude: '' })
      refetchMeldungen()
      setTimeout(() => setMeldSuccess(false), 5000)
    } catch (err) {
      console.error('Meldung fehlgeschlagen:', err)
    } finally {
      setMeldSaving(false)
    }
  }

  // --- Alarm auslösen ---
  const handleAlarm = async () => {
    if (!alarmForm.title.trim() || !districtId || !municipalityId) return
    setAlarmSaving(true)
    try {
      const { error } = await supabase.from('alerts').insert({
        district_id: districtId,
        title: alarmForm.title.trim(),
        level: alarmForm.level,
        message: alarmForm.message.trim() || null,
        target_groups: alarmForm.target_groups,
        channels: alarmForm.channels,
        scenario_id: alarmForm.scenario_id || null,
        scope: 'gemeinden',
        municipality_ids: [municipalityId],
        municipality_names: [municipality?.name || ''],
        status: 'sent',
        sent_at: new Date().toISOString(),
        // Gemeinde-spezifisch
        source: 'gemeinde',
        source_municipality_id: municipalityId,
        is_escalated: true, // Automatisch an Landkreis eskaliert
      })
      if (error) throw error
      refetchAlerts()
      setShowAlarmModal(false)
      setAlarmForm({ title: '', level: 2, message: '', scenario_id: '', target_groups: [], channels: ['E-Mail'] })
    } catch (err) {
      console.error('Alarm auslösen fehlgeschlagen:', err)
    } finally {
      setAlarmSaving(false)
    }
  }

  // --- KI-Nachricht ---
  const handleAiMessage = async () => {
    if (!districtId) return
    setAiMsgLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token
      if (!accessToken) throw new Error('Nicht angemeldet.')
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-alert-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}`, apikey: SUPABASE_ANON_KEY },
        body: JSON.stringify({
          districtId, scenarioId: alarmForm.scenario_id || undefined,
          level: alarmForm.level, targetGroups: alarmForm.target_groups,
          scope: 'gemeinden', municipalityNames: [municipality?.name || ''],
        }),
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.error || 'Unbekannter Fehler')
      setAlarmForm((f) => ({ ...f, message: result.nachricht }))
    } catch (err) {
      console.error('KI-Nachricht fehlgeschlagen:', err)
    } finally {
      setAiMsgLoading(false)
    }
  }

  const handleResolveAlert = async (alert: DbAlert) => {
    try {
      const { error } = await supabase.from('alerts').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', alert.id)
      if (error) throw error
      refetchAlerts()
    } catch (err) {
      console.error('Alarm abschließen fehlgeschlagen:', err)
    }
  }

  const toggleGroup = (g: string) => setAlarmForm((f) => ({
    ...f, target_groups: f.target_groups.includes(g) ? f.target_groups.filter((x) => x !== g) : [...f.target_groups, g],
  }))
  const toggleChannel = (c: string) => setAlarmForm((f) => ({
    ...f, channels: f.channels.includes(c) ? f.channels.filter((x) => x !== c) : [...f.channels, c],
  }))

  // Stats
  const activeAlerts = gemeindeAlerts.filter((a) => a.status !== 'resolved').length
  const openMeldungen = meldungen.filter((m) => m.status === 'offen').length
  const contactCount = contacts.length

  return (
    <div>
      <PageHeader
        title={`Alarmierung – ${municipality?.name || 'Gemeinde'}`}
        description="Notfälle melden und Alarme für Ihre Gemeinde auslösen."
        actions={
          <button
            onClick={() => setShowAlarmModal(true)}
            className="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600"
          >
            <Bell className="h-4 w-4" />
            Alarm auslösen
          </button>
        }
      />

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatCard icon={<Bell className="h-5 w-5" />} label="Aktive Alarme" value={activeAlerts} />
        <StatCard icon={<AlertTriangle className="h-5 w-5" />} label="Offene Meldungen" value={openMeldungen} />
        <StatCard icon={<Send className="h-5 w-5" />} label="Gesamt Alarme" value={gemeindeAlerts.length} />
        <StatCard icon={<Users className="h-5 w-5" />} label="Landkreis-Kontakte" value={contactCount} />
      </div>

      {/* Eskalations-Info */}
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">
        <ArrowUpRight className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
        <div>
          <p className="text-sm font-semibold text-blue-900">Automatische Eskalation</p>
          <p className="text-xs text-blue-700">
            Wenn Sie einen Alarm auslösen, wird der Landkreis-Krisenstab automatisch benachrichtigt.
            Der Landkreis kann den Alarm dann an übergeordnete Behörden weiterleiten.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl bg-surface-secondary p-1">
        <button
          onClick={() => setActiveTab('alarm')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'alarm' ? 'bg-white text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Bell className="mr-1.5 inline h-4 w-4" />
          Alarme ({gemeindeAlerts.length})
        </button>
        <button
          onClick={() => setActiveTab('meldung')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'meldung' ? 'bg-white text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <AlertTriangle className="mr-1.5 inline h-4 w-4" />
          Meldungen ({meldungen.length})
        </button>
      </div>

      {/* ==================== ALARM TAB ==================== */}
      {activeTab === 'alarm' && (
        <div>
          <h2 className="mb-4 text-lg font-bold text-text-primary">Ausgelöste Alarme</h2>

          {gemeindeAlerts.length === 0 ? (
            <div className="rounded-2xl border border-border bg-white p-12 text-center">
              <Bell className="mx-auto mb-3 h-8 w-8 text-text-muted" />
              <p className="text-sm text-text-secondary">Noch keine Alarme ausgelöst.</p>
              <button
                onClick={() => setShowAlarmModal(true)}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600"
              >
                <Bell className="h-4 w-4" /> Ersten Alarm auslösen
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {gemeindeAlerts.map((alert) => {
                const status = alertStatusConfig[alert.status] || alertStatusConfig.draft
                return (
                  <div key={alert.id} className="rounded-2xl border border-border bg-white p-5 transition-shadow hover:shadow-md">
                    <div className="flex items-start gap-4">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${levelColor[alert.level as keyof typeof levelColor] || levelColor[1]}`}>
                        <Bell className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-text-primary">{alert.title}</h3>
                          <Badge variant={status.variant}>{status.label}</Badge>
                          <Badge>Stufe {alert.level}</Badge>
                          {alert.is_escalated && (
                            <Badge variant="info">
                              <ArrowUpRight className="mr-0.5 h-3 w-3" />An Landkreis eskaliert
                            </Badge>
                          )}
                        </div>
                        {alert.message && (
                          <p className="mb-2 text-sm text-text-secondary line-clamp-2">{alert.message}</p>
                        )}
                        <div className="flex flex-wrap gap-3 text-xs text-text-muted">
                          {(alert.target_groups || []).length > 0 && (
                            <span>Zielgruppe: {alert.target_groups.join(', ')}</span>
                          )}
                          <span>
                            {alert.sent_at
                              ? new Date(alert.sent_at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                              : new Date(alert.created_at).toLocaleDateString('de-DE')}
                          </span>
                        </div>
                      </div>
                      {alert.status !== 'resolved' && (
                        <button
                          onClick={() => handleResolveAlert(alert)}
                          className="shrink-0 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-100"
                        >
                          <CheckCircle2 className="mr-1 inline h-3 w-3" />
                          Abschließen
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================== MELDUNG TAB ==================== */}
      {activeTab === 'meldung' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: Form */}
          <div className="rounded-2xl border border-border bg-white p-6">
            <h2 className="mb-4 text-lg font-bold text-text-primary">Neue Meldung an Landkreis</h2>
            <p className="mb-4 text-xs text-text-muted">
              Meldungen informieren den Landkreis-Krisenstab über die Lage vor Ort. Für eine aktive Alarmierung nutzen Sie den "Alarm auslösen" Button.
            </p>

            {meldSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Meldung erfolgreich an den Landkreis gesendet!
              </div>
            )}

            <form onSubmit={handleMeldung} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">Titel der Meldung *</label>
                <input type="text" value={meldForm.title} onChange={(e) => setMeldForm({ ...meldForm, title: e.target.value })}
                  className={inputClass} placeholder="z.B. Überflutung Hauptstraße" required />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">Beschreibung</label>
                <textarea value={meldForm.description} onChange={(e) => setMeldForm({ ...meldForm, description: e.target.value })}
                  className={`${inputClass} min-h-[100px] resize-y`} rows={4} placeholder="Beschreiben Sie die Situation möglichst genau..." />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">Dringlichkeit *</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(Object.entries(severityConfig) as [IncidentSeverity, typeof severityConfig[IncidentSeverity]][]).map(([key, conf]) => (
                    <button key={key} type="button" onClick={() => setMeldForm({ ...meldForm, severity: key })}
                      className={`rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
                        meldForm.severity === key ? `${conf.bg} ${conf.color} border-transparent ring-2 ${conf.ring}` : 'border-border bg-white text-text-secondary hover:bg-surface-secondary'
                      }`}>{conf.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">Kategorie</label>
                <select value={meldForm.category} onChange={(e) => setMeldForm({ ...meldForm, category: e.target.value })} className={inputClass}>
                  <option value="">Keine Kategorie</option>
                  {CATEGORIES.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">Ort (optional)</label>
                <div className="relative">
                  <input type="text" value={meldForm.address}
                    onChange={(e) => { setMeldForm({ ...meldForm, address: e.target.value }); geoSearch(e.target.value); setShowGeoSuggestions(true) }}
                    onFocus={() => geoSuggestions.length > 0 && setShowGeoSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowGeoSuggestions(false), 200)}
                    className={inputClass} placeholder="Adresse oder Ort eingeben..." />
                  {geoLoading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-text-muted" />}
                  {showGeoSuggestions && geoSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-white shadow-lg">
                      {geoSuggestions.map((s, idx) => (
                        <button key={`${s.osmType}-${s.osmId}-${idx}`} type="button"
                          className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-surface-secondary"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => { setMeldForm({ ...meldForm, address: s.displayName, latitude: String(s.lat), longitude: String(s.lng) }); setShowGeoSuggestions(false); geoClear() }}>
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-500" />
                          <span className="line-clamp-2">{s.displayName}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <button type="submit" disabled={meldSaving || !meldForm.title.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed">
                {meldSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Wird gesendet...</> : <><Send className="h-4 w-4" /> Meldung senden</>}
              </button>
            </form>
          </div>

          {/* Right: Previous Reports */}
          <div>
            <h2 className="mb-4 text-lg font-bold text-text-primary">Ihre Meldungen</h2>
            {meldungen.length === 0 ? (
              <div className="rounded-2xl border border-border bg-white p-8 text-center">
                <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-text-muted" />
                <p className="text-sm text-text-secondary">Noch keine Meldungen abgesetzt.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {meldungen.map(m => {
                  const sev = severityConfig[m.severity]
                  const stat = statusConfig[m.status]
                  return (
                    <div key={m.id} className="rounded-2xl border border-border bg-white p-4">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-text-primary">{m.title}</h3>
                        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${stat.bg} ${stat.color}`}>{stat.label}</span>
                      </div>
                      {m.description && <p className="mb-2 text-sm text-text-secondary line-clamp-2">{m.description}</p>}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                        <span className={`rounded-full px-2 py-0.5 ${sev.bg} ${sev.color}`}>{sev.label}</span>
                        {m.category && <span className="rounded-full bg-surface-secondary px-2 py-0.5">{CATEGORIES.find(c => c.value === m.category)?.label?.split(' (')[0] || m.category}</span>}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(m.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {m.admin_notes && (
                        <div className="mt-2 rounded-lg bg-blue-50 p-2 text-xs text-blue-700">
                          <strong>Antwort vom Landkreis:</strong> {m.admin_notes}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== ALARM MODAL ==================== */}
      <Modal open={showAlarmModal} onClose={() => setShowAlarmModal(false)} title="Alarm auslösen" size="lg">

        {/* Eskalations-Hinweis */}
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3">
          <ArrowUpRight className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div>
            <p className="text-sm font-semibold text-red-900">Dieser Alarm wird automatisch an den Landkreis-Krisenstab eskaliert.</p>
            <p className="text-xs text-red-700">Der Landkreis wird sofort über den Alarm informiert und kann weitere Maßnahmen einleiten.</p>
          </div>
        </div>

        <FormField label="Alarm-Titel" required>
          <input className={inputClass} value={alarmForm.title} onChange={(e) => setAlarmForm({ ...alarmForm, title: e.target.value })}
            placeholder="z.B. Hochwasser Stufe 2 – Hauptstraße überflutet" />
        </FormField>

        <FormField label="Alarmstufe" required>
          <div className="flex gap-3">
            {[1, 2, 3].map((lvl) => (
              <button key={lvl} type="button" onClick={() => setAlarmForm({ ...alarmForm, level: lvl })}
                className={`flex-1 rounded-xl border-2 px-4 py-3 text-center font-semibold transition-colors ${
                  alarmForm.level === lvl
                    ? lvl === 3 ? 'border-red-500 bg-red-50 text-red-700'
                      : lvl === 2 ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-border bg-white text-text-secondary hover:bg-surface-secondary'
                }`}>
                <div className="text-lg">Stufe {lvl}</div>
                <div className="text-xs font-normal">{lvl === 1 ? 'Vorwarnung' : lvl === 2 ? 'Akut' : 'Katastrophe'}</div>
              </button>
            ))}
          </div>
        </FormField>

        <FormField label="Nachricht">
          <textarea className={textareaClass} rows={4} value={alarmForm.message}
            onChange={(e) => setAlarmForm({ ...alarmForm, message: e.target.value })}
            placeholder="Beschreiben Sie die Lage für den Landkreis-Krisenstab..." />
          <button type="button" onClick={handleAiMessage} disabled={aiMsgLoading}
            className="mt-2 flex items-center gap-1.5 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700 disabled:opacity-50">
            {aiMsgLoading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> KI generiert Nachricht...</>
              : <><Sparkles className="h-3.5 w-3.5" /> KI-Nachricht generieren</>}
          </button>
        </FormField>

        <FormField label="Szenario-Bezug (optional)">
          <select className={selectClass} value={alarmForm.scenario_id} onChange={(e) => setAlarmForm({ ...alarmForm, scenario_id: e.target.value })}>
            <option value="">– Kein Szenario –</option>
            {scenarios.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </FormField>

        <FormField label="Zielgruppen (wer soll alarmiert werden?)">
          <div className="flex flex-wrap gap-2">
            {groupOptions.map((g) => (
              <button key={g} type="button" onClick={() => toggleGroup(g)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  alarmForm.target_groups.includes(g) ? 'bg-primary-600 text-white' : 'border border-border bg-white text-text-secondary hover:bg-surface-secondary'
                }`}>{g}</button>
            ))}
          </div>
        </FormField>

        <FormField label="Alarmierungskanäle">
          <div className="flex flex-wrap gap-2">
            {channelOptions.map((c) => (
              <button key={c} type="button" onClick={() => toggleChannel(c)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  alarmForm.channels.includes(c) ? 'bg-primary-600 text-white' : 'border border-border bg-white text-text-secondary hover:bg-surface-secondary'
                }`}>{c}</button>
            ))}
          </div>
        </FormField>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => setShowAlarmModal(false)} disabled={alarmSaving}
            className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary disabled:opacity-50">
            Abbrechen
          </button>
          <button type="button" onClick={handleAlarm} disabled={alarmSaving || !alarmForm.title.trim()}
            className="rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed">
            {alarmSaving ? 'Wird gesendet...' : '🚨 Alarm auslösen & Landkreis benachrichtigen'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
