import { Bell, Send, Users, Clock, CheckCircle2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import StatCard from '@/components/ui/StatCard'
import Modal, { FormField, inputClass, selectClass, textareaClass } from '@/components/ui/Modal'
import { useOrganization } from '@/hooks/useOrganization'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { supabase } from '@/lib/supabase'
import type { DbAlert, DbAlertContact, DbScenario } from '@/types/database'

const statusConfig = {
  draft: { label: 'Entwurf', variant: 'default' as const },
  sent: { label: 'Gesendet', variant: 'warning' as const },
  acknowledged: { label: 'Bestaetigt', variant: 'info' as const },
  resolved: { label: 'Abgeschlossen', variant: 'success' as const },
}

const levelColor = {
  1: 'bg-amber-50 text-amber-600',
  2: 'bg-orange-50 text-orange-600',
  3: 'bg-red-50 text-red-600',
}

const channelOptions = ['SMS', 'E-Mail', 'App-Push']
const groupOptions = ['IT-Sicherheit', 'Management', 'Krisenstab', 'Betriebsrat', 'Externes CERT']

export default function EnterpriseAlarmierungPage() {
  const { organizationId, loading: orgLoading } = useOrganization()
  const [showAlarmModal, setShowAlarmModal] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    level: 2,
    message: '',
    channels: ['E-Mail'] as string[],
    groups: ['Krisenstab'] as string[],
    scenario_id: '',
  })

  const { data: alerts, loading: alertsLoading, refetch } = useSupabaseQuery<DbAlert>(
    (sb) =>
      sb
        .from('alerts')
        .select('*')
        .eq('organization_id', organizationId!)
        .order('created_at', { ascending: false })
        .limit(20),
    [organizationId]
  )

  const { data: contacts } = useSupabaseQuery<DbAlertContact>(
    (sb) =>
      sb
        .from('alert_contacts')
        .select('*')
        .eq('organization_id', organizationId!)
        .eq('is_active', true),
    [organizationId]
  )

  const { data: scenarios } = useSupabaseQuery<DbScenario>(
    (sb) =>
      sb
        .from('scenarios')
        .select('*')
        .eq('organization_id', organizationId!),
    [organizationId]
  )

  const toggleChannel = (ch: string) => {
    setForm(f => ({
      ...f,
      channels: f.channels.includes(ch) ? f.channels.filter(c => c !== ch) : [...f.channels, ch],
    }))
  }

  const toggleGroup = (g: string) => {
    setForm(f => ({
      ...f,
      groups: f.groups.includes(g) ? f.groups.filter(x => x !== g) : [...f.groups, g],
    }))
  }

  const handleCreate = async () => {
    if (!organizationId || !form.title.trim()) return
    setCreateLoading(true)
    try {
      const { error } = await supabase.from('alerts').insert({
        organization_id: organizationId,
        title: form.title.trim(),
        level: form.level,
        message: form.message || null,
        channels: form.channels,
        target_groups: form.groups,
        scenario_id: form.scenario_id || null,
        status: 'draft',
      })
      if (error) throw error
      setShowAlarmModal(false)
      setForm({ title: '', level: 2, message: '', channels: ['E-Mail'], groups: ['Krisenstab'], scenario_id: '' })
      refetch()
    } finally {
      setCreateLoading(false)
    }
  }

  if (orgLoading || alertsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  const activeContacts = contacts?.length || 0
  const recentAlerts = alerts?.length || 0

  return (
    <div>
      <PageHeader
        title="Alarmierung"
        description="Benachrichtigungen und Alarmketten verwalten"
        actions={
          <button
            onClick={() => setShowAlarmModal(true)}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            <Send className="h-4 w-4" />
            Alarm ausloesen
          </button>
        }
      />

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={<Users className="h-5 w-5" />} label="Aktive Kontakte" value={activeContacts} />
        <StatCard icon={<Bell className="h-5 w-5" />} label="Alarme gesamt" value={recentAlerts} />
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Bestaetigt" value={alerts?.filter(a => a.status === 'acknowledged').length || 0} />
        <StatCard icon={<Clock className="h-5 w-5" />} label="Offen" value={alerts?.filter(a => a.status === 'sent').length || 0} />
      </div>

      {/* Quick Links */}
      <div className="mb-6 flex gap-3">
        <Link
          to="/unternehmen/alarmierung/kontakte"
          className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
        >
          <Users className="h-4 w-4" />
          Kontakte verwalten
        </Link>
        <Link
          to="/unternehmen/alarmierung/krisenstab"
          className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
        >
          <Users className="h-4 w-4" />
          Krisenstab
        </Link>
      </div>

      {/* Recent Alerts */}
      <div className="rounded-2xl border border-border bg-white">
        <div className="border-b border-border px-5 py-4">
          <h3 className="font-semibold text-text-primary">Letzte Alarme</h3>
        </div>
        {!alerts || alerts.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-text-muted">
            Noch keine Alarme ausgeloest.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {alerts.map((alert) => {
              const status = statusConfig[alert.status as keyof typeof statusConfig] || statusConfig.draft
              const lvlColor = levelColor[alert.level as keyof typeof levelColor] || levelColor[2]
              return (
                <div key={alert.id} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${lvlColor}`}>
                      <Bell className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{alert.title}</p>
                      <p className="text-xs text-text-muted">
                        Stufe {alert.level} · {new Date(alert.created_at).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  </div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Alarm Modal */}
      <Modal open={showAlarmModal} title="Alarm ausloesen" onClose={() => setShowAlarmModal(false)}>
        <div className="space-y-4">
          <FormField label="Titel" required>
            <input
              className={inputClass}
              value={form.title}
              onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="z.B. IT-Sicherheitsvorfall erkannt"
            />
          </FormField>
          <FormField label="Alarmstufe">
            <div className="flex gap-2">
              {[1, 2, 3].map((level) => (
                <button
                  key={level}
                  onClick={() => setForm(f => ({ ...f, level }))}
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                    form.level === level
                      ? level === 3 ? 'border-red-300 bg-red-50 text-red-700' :
                        level === 2 ? 'border-orange-300 bg-orange-50 text-orange-700' :
                        'border-amber-300 bg-amber-50 text-amber-700'
                      : 'border-border text-text-muted'
                  }`}
                >
                  Stufe {level}
                </button>
              ))}
            </div>
          </FormField>
          {scenarios && scenarios.length > 0 && (
            <FormField label="Szenario (optional)">
              <select
                className={selectClass}
                value={form.scenario_id}
                onChange={(e) => setForm(f => ({ ...f, scenario_id: e.target.value }))}
              >
                <option value="">Kein Szenario</option>
                {scenarios.map(s => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </FormField>
          )}
          <FormField label="Nachricht">
            <textarea
              className={textareaClass}
              rows={3}
              value={form.message}
              onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Beschreiben Sie den Vorfall..."
            />
          </FormField>
          <FormField label="Kanaele">
            <div className="flex flex-wrap gap-2">
              {channelOptions.map((ch) => (
                <button
                  key={ch}
                  onClick={() => toggleChannel(ch)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    form.channels.includes(ch) ? 'border-primary-300 bg-primary-50 text-primary-700' : 'border-border text-text-muted'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </FormField>
          <FormField label="Zielgruppen">
            <div className="flex flex-wrap gap-2">
              {groupOptions.map((g) => (
                <button
                  key={g}
                  onClick={() => toggleGroup(g)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    form.groups.includes(g) ? 'border-primary-300 bg-primary-50 text-primary-700' : 'border-border text-text-muted'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </FormField>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => setShowAlarmModal(false)}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
          >
            Abbrechen
          </button>
          <button
            onClick={handleCreate}
            disabled={!form.title.trim() || createLoading}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {createLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Alarm senden
          </button>
        </div>
      </Modal>
    </div>
  )
}
