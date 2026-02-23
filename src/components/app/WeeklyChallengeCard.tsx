/**
 * WeeklyChallengeCard — Wochen-Challenge für das Dashboard
 *
 * Zeigt die aktuelle Challenge mit Erledigt-Toggle und Link zur Seite.
 */
import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, ArrowRight, Trophy } from 'lucide-react'
import { getCurrentChallenge, isChallengeCompleted, markChallengeCompleted } from '@/data/challenge-data'

export default function WeeklyChallengeCard() {
  const challenge = getCurrentChallenge()
  const [completed, setCompleted] = useState(() => isChallengeCompleted(challenge.id))

  const handleToggle = useCallback(() => {
    if (!completed) {
      markChallengeCompleted(challenge.id)
      setCompleted(true)
    }
  }, [completed, challenge.id])

  return (
    <div className={`rounded-2xl border p-5 transition-colors ${
      completed
        ? 'border-green-200 bg-green-50'
        : 'border-border bg-white'
    }`}>
      <div className="flex items-start gap-4">
        {/* Emoji / Check */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-secondary text-2xl">
          {completed ? (
            <CheckCircle2 className="h-7 w-7 text-green-500" />
          ) : (
            <span>{challenge.emoji}</span>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-xs font-semibold uppercase tracking-wide text-amber-600">
              Wochen-Challenge
            </span>
          </div>
          <h3 className={`text-sm font-bold ${completed ? 'text-green-700' : 'text-text-primary'}`}>
            {completed ? 'Geschafft! ' : ''}{challenge.title}
          </h3>
          <p className={`mt-0.5 text-xs ${completed ? 'text-green-600' : 'text-text-secondary'}`}>
            {completed ? 'Gut gemacht! Nächste Woche wartet eine neue Challenge.' : challenge.description}
          </p>
        </div>

        {/* Action */}
        {!completed ? (
          <div className="flex shrink-0 flex-col items-end gap-2">
            <Link
              to={challenge.linkTo}
              className="flex items-center gap-1 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-600 transition-colors hover:bg-primary-100"
            >
              Los geht's
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={handleToggle}
              className="text-[11px] font-medium text-text-muted hover:text-text-secondary"
            >
              Als erledigt markieren
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
