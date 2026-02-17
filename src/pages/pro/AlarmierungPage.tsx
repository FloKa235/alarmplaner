import { Bell, Plus, Send, Users, Clock, CheckCircle2, Loader2, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import StatCard from '@/components/ui/StatCard'
import Modal, { FormField, inputClass, selectClass, textareaClass, ConfirmDialog } from '@/components/ui/Modal'
import { useDistrict } from '@/hooks/useDistrict'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { supabase } from '@/lib/supabase'
import type { DbAlert, DbAlertContact, DbScenario } from '@/types/database'

const statusConfig = {
  draft: { label: 'Entwurf', variant: 'default' as const },
  sent: { label: 'Gesendet', variant: 'warning' as const },
  acknowledged: { label: 'Bestätigt', variant: 'info' as const },
  resolved: { label: 'Abgeschlossen', variant: 'success' as const },
}

const levelColor = {
  1: 'bg-amber-50 text-amber-600',
  2: 'bg-orange-50 text-orange-600',
  3: 'bg-red-50 text-red-600',
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const channelOptions = ['SMS', 'E-Mail', 'App-Push']
const groupOptions = ['Feuerwehr', 'Polizei', 'THW', 'Rettungsdienst', 'Verwaltung']

export default function AlarmierungPage() {
  const { districtId, loading: districtLoading } = useDistrict()
  const [showAlarmModal, setShowAlarmModal] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [aiMsgLoading, setAiMsgLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    level: 2,
    message: '',
    target_groups: [] as string[],
    channels: ['E-Mail'] as string[],
    scenario_id: '',
  })

  // Delete + Resolve
  const [deleteTarget, setDeleteTarget] = useState<DbAlert | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { data: alerts, loading: alertsLoading, refetch } = useSupabaseQuery<DbAlert>(
    (sb) =>
      sb
        .from('alerts')
        .select('*')
        .eq('district_id', districtId!)
        .order('created_at', { ascending: false }),
    [districtId]
  )

  const { data: contacts, loading: contactsLoading } = useSupabaseQuery<DbAlertContact>(
    (sb) =>
      sb
        .from('alert_contacts')
        .select('*')
        .eq('district_id', districtId!),
    [districtId]
  )

  const { data: scenarios } = useSupabaseQuery<DbScenario>(
    (sb) =>
      sb
        .from('scenarios')
        .select('*')
        .eq('district_id', districtId!)
        .order('created_at', { ascending: false }),
    [districtId]
  )

  const toggleGroup = (g: string) => {
    setForm((f) => ({
      ...f,
      target_groups: f.target_groups.includes(g) ? f.target_groups.filter((x) => x !== g) : [...f.target_groups, g],
    }))
  }

  const toggleChannel = (c: string) => {
    setForm((f) => ({
      ...f,
      channels: f.channels.includes(c) ? f.channels.filter((x) => x !== c) : [...f.channels, c],
    }))
  }

  const handleAlarm = async () => {
    if (!form.title.trim() || !districtId) return
    setCreateLoading(true)
    try {
      const { error: insertError } = await supabase.from('alerts').insert({
        district_id: districtId,
        title: form.title.trim(),
        level: form.level,
        message: form.message.trim() || null,
        target_groups: form.target_groups,
        channels: form.channels,
        scenario_id: form.scenario_id || null,
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      if (insertError) throw insertError
      refetch()
      setShowAlarmModal(false)
      setForm({ title: '', level: 2, message: '', target_groups: [], channels: ['E-Mail'], scenario_id: '' })
    } catch (err) {
      console.error('Alarm auslösen fehlgeschlagen:', err)
    } finally {
      setCreateLoading(false)
    }
  }

  const handleAiMessage = async () => {
    if (!districtId) return
    setAiMsgLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token
      if (!accessToken) throw new Error('Nicht angemeldet.')

      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-alert-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          districtId,
          scenarioId: form.scenario_id || undefined,
          level: form.level,
          targetGroups: form.target_groups,
        }),
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.error || 'Unbekannter Fehler')

      setForm((f) => ({ ...f, message: result.nachricht }))
    } catch (err) {
      console.error('KI-Nachricht fehlgeschlagen:', err)
    } finally {
      setAiMsgLoading(false)
    }
  }

  const handleResolve = async (alert: DbAlert) => {
    if (!districtId) return
    try {
      const { error } = await supabase.from('alerts').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', alert.id).eq('district_id', districtId)
      if (error) throw error
      refetch()
    } catch (err) {
      console.error('Alarm abschließen fehlgeschlagen:', err)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget || !districtId) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('alerts').delete().eq('id', deleteTarget.id).eq('district_id', districtId)
      if (error) throw error
      refetch()
      setDeleteTarget(null)
    } catch (err) {
      console.error('Alarm löschen fehlgeschlagen:', err)
    } finally {
      setDeleting(false)
    }
  }

  if (districtLoading || alertsLoading || contactsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  // Computed stats
  const sentCount = alerts.filter((a) => a.status !== 'draft').length
  const acknowledgedCount = alerts.filter((a) => a.status === 'acknowledged' || a.status === 'resolved').length
  const pendingCount = alerts.filter((a) => a.status === 'sent').length

  return (
    <div>
      <PageHeader
        title="Alarmzentrale"
        description="Alarme auslösen, verfolgen und Einsatzkräfte koordinieren."

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
      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <StatCard icon={<Send className="h-5 w-5" />} label="Gesendete Alarme" value={sentCount} />
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Bestätigt" value={acknowledgedCount} />
        <StatCard icon={<Clock className="h-5 w-5" />} label="Ausstehend" value={pendingCount} />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Kontakte"
          value={contacts.length}
        />
      </div>

      {/* Quick links */}
      <div className="mb-8 flex gap-3">
        <Link
          to="/pro/alarmierung/kontakte"
          className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
        >
          <Users className="h-4 w-4" />
          Kontakte verwalten
        </Link>
        <button className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary">
          <Plus className="h-4 w-4" />
          Alarm-Vorlage
        </button>
      </div>

      {/* Alert list */}
      <h2 className="mb-4 text-lg font-bold text-text-primary">Letzte Alarme</h2>
      {alerts.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-12 text-center">
          <Bell className="mx-auto mb-3 h-8 w-8 text-text-muted" />
          <p className="text-sm text-text-secondary">Noch keine Alarme vorhanden.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const status = statusConfig[alert.status as keyof typeof statusConfig] || statusConfig.draft
            return (
              <div
                key={alert.id}
                className="flex items-center gap-4 rounded-2xl border border-border bg-white p-6 transition-shadow hover:shadow-md"
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${levelColor[alert.level as keyof typeof levelColor] || levelColor[1]}`}>
                  <Bell className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-text-primary">{alert.title}</h3>
                    <Badge variant={status.variant}>{status.label}</Badge>
                    <Badge>Stufe {alert.level}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-text-muted">
                    <span>Zielgruppe: {(alert.target_groups || []).join(', ') || 'Alle'}</span>
                    <span>{alert.sent_at ? new Date(alert.sent_at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : new Date(alert.created_at).toLocaleDateString('de-DE')}</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  {alert.status !== 'resolved' && (
                    <button
                      onClick={() => handleResolve(alert)}
                      className="rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-100"
                    >
                      <CheckCircle2 className="mr-1 inline h-3 w-3" />
                      Abschließen
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteTarget(alert)}
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Alarm auslösen Modal */}
      <Modal open={showAlarmModal} onClose={() => setShowAlarmModal(false)} title="Alarm auslösen" size="lg">
        <FormField label="Alarm-Titel" required>
          <input
            className={inputClass}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="z.B. Hochwasserwarnung Stufe 2 – Bode"
          />
        </FormField>

        <FormField label="Alarmstufe" required>
          <div className="flex gap-3">
            {[1, 2, 3].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setForm({ ...form, level: lvl })}
                className={`flex-1 rounded-xl border-2 px-4 py-3 text-center font-semibold transition-colors ${
                  form.level === lvl
                    ? lvl === 3
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : lvl === 2
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-border bg-white text-text-secondary hover:bg-surface-secondary'
                }`}
              >
                <div className="text-lg">Stufe {lvl}</div>
                <div className="text-xs font-normal">
                  {lvl === 1 ? 'Vorwarnung' : lvl === 2 ? 'Akut' : 'Katastrophe'}
                </div>
              </button>
            ))}
          </div>
        </FormField>

        <FormField label="Nachricht">
          <textarea
            className={textareaClass}
            rows={4}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Alarmnachricht für die Einsatzkräfte..."
          />
          <button
            type="button"
            onClick={handleAiMessage}
            disabled={aiMsgLoading}
            className="mt-2 flex items-center gap-1.5 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700 disabled:opacity-50"
          >
            {aiMsgLoading ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> KI generiert Nachricht...</>
            ) : (
              <><Sparkles className="h-3.5 w-3.5" /> KI-Nachricht generieren</>
            )}
          </button>
        </FormField>

        <FormField label="Szenario-Bezug (optional)">
          <select
            className={selectClass}
            value={form.scenario_id}
            onChange={(e) => setForm({ ...form, scenario_id: e.target.value })}
          >
            <option value="">– Kein Szenario –</option>
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Zielgruppen">
          <div className="flex flex-wrap gap-2">
            {groupOptions.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => toggleGroup(g)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  form.target_groups.includes(g)
                    ? 'bg-primary-600 text-white'
                    : 'border border-border bg-white text-text-secondary hover:bg-surface-secondary'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </FormField>

        <FormField label="Alarmierungskanäle">
          <div className="flex flex-wrap gap-2">
            {channelOptions.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggleChannel(c)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  form.channels.includes(c)
                    ? 'bg-primary-600 text-white'
                    : 'border border-border bg-white text-text-secondary hover:bg-surface-secondary'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </FormField>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setShowAlarmModal(false)}
            disabled={createLoading}
            className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary disabled:opacity-50"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleAlarm}
            disabled={createLoading || !form.title.trim()}
            className="rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createLoading ? 'Wird gesendet...' : '🚨 Alarm auslösen'}
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Alarm löschen"
        message={`Möchten Sie den Alarm "${deleteTarget?.title}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        loading={deleting}
      />
    </div>
  )
}
