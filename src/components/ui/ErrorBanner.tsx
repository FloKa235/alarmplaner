/**
 * ErrorBanner — Wiederverwendbare Fehlermeldung
 *
 * Rote Border + AlertTriangle Icon + Dismiss-Button.
 * Ersetzt alert() und stille console.error-only Stellen.
 */
import { AlertTriangle, X } from 'lucide-react'

interface ErrorBannerProps {
  message: string
  details?: string
  onDismiss?: () => void
}

export default function ErrorBanner({ message, details, onDismiss }: ErrorBannerProps) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-red-800">{message}</p>
        {details && (
          <p className="mt-0.5 text-xs text-red-700">{details}</p>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 rounded-lg p-1 text-red-400 transition-colors hover:bg-red-100 hover:text-red-600"
          title="Schließen"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
