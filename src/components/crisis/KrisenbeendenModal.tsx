/**
 * KrisenbeendenModal – Krise beenden mit Zusammenfassung
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, CheckCircle } from 'lucide-react'
import { useCrisis, formatElapsed, stufeLabelMap } from '@/contexts/CrisisContext'

interface Props {
  onClose: () => void
}

export default function KrisenbeendenModal({ onClose }: Props) {
  const navigate = useNavigate()
  const { scenarioTitle, stufe, elapsedSeconds, deactivateCrisis } = useCrisis()
  const [loading, setLoading] = useState(false)

  const handleDeactivate = async () => {
    setLoading(true)
    try {
      await deactivateCrisis()
      onClose()
      navigate('/pro')
    } catch (err) {
      console.error('Krisenbeendigung fehlgeschlagen:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">Krisenfall beenden</h2>
              <p className="text-sm text-text-secondary">Krisenmodus deaktivieren</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-text-muted hover:bg-surface-secondary">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Summary */}
        <div className="mb-6 space-y-3 rounded-xl border border-border bg-surface-secondary p-4">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Szenario</span>
            <span className="font-medium text-text-primary">{scenarioTitle || 'Unbekannt'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Alarmstufe</span>
            <span className="font-medium text-text-primary">
              {stufe ? stufeLabelMap[stufe] : '—'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Laufzeit</span>
            <span className="font-mono font-medium text-text-primary">
              {formatElapsed(elapsedSeconds)}
            </span>
          </div>
        </div>

        {/* Warning */}
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs text-amber-800">
            Die Timeline und alle Ereignisse bleiben erhalten. Das Farbschema wechselt zurück in den Normalmodus.
          </p>
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
            onClick={handleDeactivate}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
          >
            <CheckCircle className="h-4 w-4" />
            {loading ? 'Wird beendet...' : 'Krise beenden'}
          </button>
        </div>
      </div>
    </div>
  )
}
