/**
 * KrisenaktivierungsModal – Szenario + Stufe wählen → Krise aktivieren
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, AlertTriangle, Zap, ShieldAlert, Shield } from 'lucide-react'
import clsx from 'clsx'
import { supabase } from '@/lib/supabase'
import { useDistrict } from '@/hooks/useDistrict'
import { useCrisis, type CrisisStufe } from '@/contexts/CrisisContext'
import type { DbScenario } from '@/types/database'

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

interface Props {
  onClose: () => void
  preselectedScenarioId?: string
}

export default function KrisenaktivierungsModal({ onClose, preselectedScenarioId }: Props) {
  const navigate = useNavigate()
  const { districtId } = useDistrict()
  const { activateCrisis } = useCrisis()

  const [scenarios, setScenarios] = useState<Pick<DbScenario, 'id' | 'title' | 'type'>[]>([])
  const [selectedScenarioId, setSelectedScenarioId] = useState(preselectedScenarioId || '')
  const [selectedStufe, setSelectedStufe] = useState<CrisisStufe>('teilaktivierung')
  const [loading, setLoading] = useState(false)

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

  const handleActivate = async () => {
    if (!selectedScenarioId || !selectedScenario) return
    setLoading(true)

    try {
      await activateCrisis(selectedScenarioId, selectedScenario.title, selectedStufe)
      onClose()
      navigate('/pro/lagezentrum')
    } catch (err) {
      console.error('Krisenaktivierung fehlgeschlagen:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
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
      </div>
    </div>
  )
}
