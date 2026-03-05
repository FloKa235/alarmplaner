/**
 * KrisenaktivierungsModal – 2-Schritt-Flow:
 *   1. Szenario + Stufe wählen → Krise aktivieren
 *   2. KI-Alarm-Nachricht → Alarmierung senden oder später
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, AlertTriangle, Zap, ShieldAlert, Shield, Bell, CheckCircle2, Loader2, Send, Clock } from 'lucide-react'
import clsx from 'clsx'
import { supabase } from '@/lib/supabase'
import { useDistrict } from '@/hooks/useDistrict'
import { useCrisis, type CrisisStufe } from '@/contexts/CrisisContext'
import type { DbScenario, DbAlertContact } from '@/types/database'

const stufen: { value: CrisisStufe; label: string; desc: string; icon: typeof Shield; color: string }[] = [
  {
    value: 'vorwarnung',
    label: 'Vorwarnung',
    desc: 'Erhöhte Aufmerksamkeit, Krisenstab informiert',
    icon: Shield,
    color: 'border-yellow-300 bg-yellow-50 text-yellow-800 hover:border-yellow-400',
  },
  {
    value: 'teilaktivierung',
    label: 'Teilaktivierung',
    desc: 'Krisenstab teilweise einberufen, erste Maßnahmen',
    icon: ShieldAlert,
    color: 'border-orange-300 bg-orange-50 text-orange-800 hover:border-orange-400',
  },
  {
    value: 'vollaktivierung',
    label: 'Vollaktivierung',
    desc: 'Voller Krisenstab, alle Ressourcen mobilisiert',
    icon: AlertTriangle,
    color: 'border-red-300 bg-red-50 text-red-800 hover:border-red-400',
  },
]

type ModalStep = 'select' | 'alerting'

interface Props {
  onClose: () => void
  preselectedScenarioId?: string
}

export default function KrisenaktivierungsModal({ onClose, preselectedScenarioId }: Props) {
  const navigate = useNavigate()
  const { districtId, district } = useDistrict()
  const { activateCrisis } = useCrisis()

  // ─── Step State ─────────────────────────────────
  const [step, setStep] = useState<ModalStep>('select')

  // ─── Step 1: Szenario + Stufe ───────────────────
  const [scenarios, setScenarios] = useState<Pick<DbScenario, 'id' | 'title' | 'type'>[]>([])
  const [selectedScenarioId, setSelectedScenarioId] = useState(preselectedScenarioId || '')
  const [selectedStufe, setSelectedStufe] = useState<CrisisStufe>('teilaktivierung')
  const [loading, setLoading] = useState(false)

  // ─── Step 2: Alarmierung ────────────────────────
  const [alertMessage, setAlertMessage] = useState('')
  const [alertLoading, setAlertLoading] = useState(false)
  const [alertSending, setAlertSending] = useState(false)
  const [contactGroups, setContactGroups] = useState<string[]>([])
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set())

  // Szenarien laden
  useEffect(() => {
    if (!districtId) return
    const loadScenarios = async () => {
      const { data } = await supabase
        .from('scenarios')
        .select('id, title, type')
        .eq('district_id', districtId)
        .order('title')
      if (data) {
        setScenarios(data)
        if (!preselectedScenarioId && data.length > 0) {
          setSelectedScenarioId(data[0].id)
        }
      }
    }
    loadScenarios()
  }, [districtId, preselectedScenarioId])

  const selectedScenario = scenarios.find(s => s.id === selectedScenarioId)

  // ─── Step 1 Handler: Krise aktivieren ───────────
  const handleActivate = async () => {
    if (!selectedScenarioId || !selectedScenario) return
    setLoading(true)

    try {
      await activateCrisis(selectedScenarioId, selectedScenario.title, selectedStufe)

      // → Schritt 2: Alarmierung vorbereiten
      setStep('alerting')

      // Kontaktgruppen laden
      const { data: contacts } = await supabase
        .from('alert_contacts')
        .select('groups')
        .eq('district_id', districtId!)
        .eq('is_active', true)

      if (contacts) {
        const groups = new Set<string>()
        contacts.forEach((c: Pick<DbAlertContact, 'groups'>) =>
          (c.groups || []).forEach((g: string) => groups.add(g))
        )
        const groupList = [...groups].sort()
        setContactGroups(groupList)
        setSelectedGroups(new Set(groupList)) // Alle vorausgewählt
      }

      // KI-Alarm-Nachricht generieren
      setAlertLoading(true)
      try {
        const { data: fnData, error: fnError } = await supabase.functions.invoke('ai-alert-message', {
          body: {
            district_id: districtId,
            scenario_id: selectedScenarioId,
            scenario_title: selectedScenario.title,
            scenario_type: selectedScenario.type,
            stufe: selectedStufe,
            district_name: district?.name || '',
          },
        })
        if (fnError) throw fnError
        setAlertMessage(fnData?.message || `KRISENALARM: ${selectedScenario.title}\n\nAlarmstufe: ${stufen.find(s => s.value === selectedStufe)?.label}\n\nBitte beachten Sie die Anweisungen Ihres Krisenstabs.`)
      } catch (err) {
        console.warn('KI-Alarm-Nachricht fehlgeschlagen, verwende Fallback:', err)
        setAlertMessage(`KRISENALARM: ${selectedScenario.title}\n\nAlarmstufe: ${stufen.find(s => s.value === selectedStufe)?.label}\nLandkreis: ${district?.name || ''}\n\nBitte beachten Sie die Anweisungen Ihres Krisenstabs und begeben Sie sich umgehend an Ihren Einsatzort.`)
      } finally {
        setAlertLoading(false)
      }
    } catch (err) {
      console.error('Krisenaktivierung fehlgeschlagen:', err)
    } finally {
      setLoading(false)
    }
  }

  // ─── Step 2 Handler: Alarmierung senden ─────────
  const handleSendAlert = async () => {
    if (!selectedScenario || selectedGroups.size === 0) return
    setAlertSending(true)

    try {
      // Alert in DB speichern
      const { error: alertError } = await supabase.from('alerts').insert({
        district_id: districtId,
        scenario_id: selectedScenarioId,
        level: selectedStufe === 'vollaktivierung' ? 3 : selectedStufe === 'teilaktivierung' ? 2 : 1,
        title: `Krisenalarm: ${selectedScenario.title}`,
        message: alertMessage,
        target_groups: [...selectedGroups],
        channels: ['app', 'email'],
        scope: 'landkreis',
        municipality_ids: [],
        municipality_names: [],
        status: 'sent',
        sent_at: new Date().toISOString(),
        source: 'landkreis',
        is_escalated: false,
      })
      if (alertError) throw alertError

      // Timeline-Event
      await supabase.from('crisis_events').insert({
        district_id: districtId,
        scenario_id: selectedScenarioId,
        type: 'alarm_gesendet',
        beschreibung: `Alarmierung gesendet an ${selectedGroups.size} Gruppe${selectedGroups.size > 1 ? 'n' : ''}: ${[...selectedGroups].join(', ')}`,
        details: { groups: [...selectedGroups], stufe: selectedStufe },
      })

      onClose()
      navigate('/pro/lagezentrum')
    } catch (err) {
      console.error('Alarmierung fehlgeschlagen:', err)
    } finally {
      setAlertSending(false)
    }
  }

  // ─── Step 2 Handler: Später alarmieren ──────────
  const handleSkipAlert = () => {
    onClose()
    navigate('/pro/lagezentrum')
  }

  const toggleGroup = (group: string) => {
    setSelectedGroups(prev => {
      const next = new Set(prev)
      next.has(group) ? next.delete(group) : next.add(group)
      return next
    })
  }

  // ─── Render ─────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">

        {step === 'select' ? (
          <>
            {/* ═══ SCHRITT 1: Szenario + Stufe ═══ */}

            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                  <Zap className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-primary">Krisenfall aktivieren</h2>
                  <p className="text-sm text-text-secondary">Krisenmodus für den Landkreis starten</p>
                </div>
              </div>
              <button onClick={onClose} className="rounded-lg p-1 text-text-muted hover:bg-surface-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Szenario auswählen */}
            <div className="mb-5">
              <label className="mb-1.5 block text-sm font-medium text-text-primary">
                Szenario auswählen
              </label>
              <select
                value={selectedScenarioId}
                onChange={(e) => setSelectedScenarioId(e.target.value)}
                className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-text-primary focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="">Bitte wählen...</option>
                {scenarios.map(s => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>

            {/* Stufe auswählen */}
            <div className="mb-5">
              <label className="mb-2 block text-sm font-medium text-text-primary">
                Alarmstufe
              </label>
              <div className="grid grid-cols-3 gap-3">
                {stufen.map(s => (
                  <button
                    key={s.value}
                    onClick={() => setSelectedStufe(s.value)}
                    className={clsx(
                      'flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-center transition-all',
                      selectedStufe === s.value
                        ? s.color + ' ring-2 ring-offset-1 ring-current'
                        : 'border-border bg-white text-text-secondary hover:border-border'
                    )}
                  >
                    <s.icon className="h-5 w-5" />
                    <span className="text-xs font-semibold">{s.label}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-text-muted">
                {stufen.find(s => s.value === selectedStufe)?.desc}
              </p>
            </div>

            {/* Info-Box */}
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-medium text-amber-800">Bei Aktivierung passiert automatisch:</p>
              <ul className="mt-1 space-y-0.5 text-xs text-amber-700">
                <li>• Farbschema wechselt in den Krisenmodus (dunkel/rot)</li>
                <li>• Lagezentrum und Timeline werden freigeschaltet</li>
                <li>• Laufzeit-Timer startet</li>
                <li>• Ereignis wird in der Timeline protokolliert</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
              >
                Abbrechen
              </button>
              <button
                onClick={handleActivate}
                disabled={!selectedScenarioId || loading}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                <Zap className="h-4 w-4" />
                {loading ? 'Wird aktiviert...' : 'Krise aktivieren'}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* ═══ SCHRITT 2: Alarmierung ═══ */}

            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-primary">Krise aktiviert</h2>
                  <p className="text-sm text-text-secondary">{selectedScenario?.title} — {stufen.find(s => s.value === selectedStufe)?.label}</p>
                </div>
              </div>
              <button onClick={handleSkipAlert} className="rounded-lg p-1 text-text-muted hover:bg-surface-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Bestätigung */}
            <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3">
              <p className="text-sm font-medium text-green-800">
                ✅ Krisenfall wurde erfolgreich aktiviert. Lagezentrum ist bereit.
              </p>
            </div>

            {/* KI-Alarm-Nachricht */}
            <div className="mb-4">
              <div className="mb-1.5 flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary-600" />
                <label className="text-sm font-medium text-text-primary">KI-generierte Alarm-Nachricht</label>
              </div>
              {alertLoading ? (
                <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-secondary p-4">
                  <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
                  <span className="text-sm text-text-secondary">KI generiert Alarm-Nachricht...</span>
                </div>
              ) : (
                <textarea
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-text-primary focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              )}
            </div>

            {/* Zielgruppen */}
            <div className="mb-5">
              <label className="mb-1.5 block text-sm font-medium text-text-primary">
                Zielgruppen alarmieren
              </label>
              {contactGroups.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {contactGroups.map(group => (
                    <button
                      key={group}
                      onClick={() => toggleGroup(group)}
                      className={clsx(
                        'rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
                        selectedGroups.has(group)
                          ? 'border-primary-300 bg-primary-50 text-primary-700'
                          : 'border-border bg-white text-text-muted hover:border-border'
                      )}
                    >
                      {group}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl bg-surface-secondary p-3 text-xs text-text-muted">
                  Keine Kontaktgruppen angelegt. Alarmkontakte können unter Alarmierung → Kontakte erstellt werden.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={handleSkipAlert}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
              >
                <Clock className="h-4 w-4" />
                Später alarmieren
              </button>
              <button
                onClick={handleSendAlert}
                disabled={alertLoading || alertSending || selectedGroups.size === 0}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {alertSending ? 'Wird gesendet...' : `Alarmierung senden${selectedGroups.size > 0 ? ` (${selectedGroups.size})` : ''}`}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
