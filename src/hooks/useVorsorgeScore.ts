/**
 * useVorsorgeScore — Gamifizierter 0-100 Vorsorge-Score
 *
 * Berechnung:
 *   Inventar (40 Pkt)   — Durchschnitt (current/target) aller Items
 *   Notfallplan (20 Pkt) — Treffpunkt (8) + ≥2 Kontakte (8) + Notizen (4)
 *   Wissen (20 Pkt)      — Gelesene Guides (bis 10)
 *   Aktualität (20 Pkt)  — Keine abgelaufenen Items (8) + Haushalt gesetzt (6) + Standort (6)
 *
 * Badges:
 *   🌱 Grundvorsorge    (≥25)
 *   🎯 Gut vorbereitet  (≥50)
 *   🛡️ BBK-Empfehlung   (≥75)
 *   ⭐ Krisenprofi       (=100)
 */
import { useMemo, useState, useCallback, useEffect } from 'react'
import { useCitizenInventory } from '@/hooks/useCitizenInventory'
import { useCitizenHousehold } from '@/hooks/useCitizenHousehold'
import { useCitizenLocation } from '@/hooks/useCitizenLocation'
import { getReadCount } from '@/utils/guide-tracking'

// ─── Badge System ────────────────────────────────────────

export interface Badge {
  id: string
  name: string
  emoji: string
  threshold: number
  color: string
  description: string
}

export const BADGES: Badge[] = [
  { id: 'grundvorsorge', name: 'Grundvorsorge', emoji: '\u{1F331}', threshold: 25, color: 'amber', description: 'Du hast die ersten Schritte gemacht!' },
  { id: 'gut_vorbereitet', name: 'Gut vorbereitet', emoji: '\u{1F3AF}', threshold: 50, color: 'blue', description: 'Die Hälfte ist geschafft \u2014 weiter so!' },
  { id: 'bbk_empfehlung', name: 'BBK-Empfehlung', emoji: '\u{1F6E1}\u{FE0F}', threshold: 75, color: 'green', description: 'Du erfüllst die BBK-Empfehlung!' },
  { id: 'krisenprofi', name: 'Krisenprofi', emoji: '\u2B50', threshold: 100, color: 'purple', description: 'Perfekt vorbereitet \u2014 Respekt!' },
]

const BADGES_STORAGE_KEY = 'alarmplaner-badges'

function getUnlockedBadgeIds(): Set<string> {
  try {
    const raw = localStorage.getItem(BADGES_STORAGE_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

function persistBadgeIds(ids: Set<string>): void {
  localStorage.setItem(BADGES_STORAGE_KEY, JSON.stringify([...ids]))
}

// ─── Notfallplan Reader ──────────────────────────────────

function readNotfallplan(): { hasMeetingPoint: boolean; contactCount: number; hasNotes: boolean } {
  try {
    const raw = localStorage.getItem('alarmplaner-notfallplan')
    if (!raw) return { hasMeetingPoint: false, contactCount: 0, hasNotes: false }
    const data = JSON.parse(raw)
    return {
      hasMeetingPoint: !!(data.meetingPoint?.primary?.trim()),
      contactCount: Array.isArray(data.contacts) ? data.contacts.filter((c: { name?: string }) => c.name?.trim()).length : 0,
      hasNotes: !!(data.notes?.trim()),
    }
  } catch {
    return { hasMeetingPoint: false, contactCount: 0, hasNotes: false }
  }
}

// ─── Percentile Calculation ───────────────────────────────

/** Simulated percentile using exponential saturation curve.
 *  No real cross-user data needed — privacy advantage + no new DB table.
 *  Score 25 → ~58%, Score 50 → ~83%, Score 75 → ~93%, Score 100 → ~97%
 */
function calculatePercentile(score: number): number {
  if (score <= 0) return 0
  return Math.round(100 * (1 - Math.exp(-0.035 * score)))
}

// ─── Score Breakdown ─────────────────────────────────────

export interface ScoreComponent {
  score: number
  max: number
  detail: string
}

export interface VorsorgeScoreResult {
  total: number
  percentile: number
  color: 'red' | 'amber' | 'green' | 'blue' | 'purple'
  breakdown: {
    inventar: ScoreComponent
    notfallplan: ScoreComponent
    wissen: ScoreComponent
    aktualitaet: ScoreComponent
  }
  badges: Badge[]
  nextBadge: Badge | null
  newBadgeUnlocked: Badge | null
  dismissNewBadge: () => void
  loading: boolean
}

// ─── Hook ────────────────────────────────────────────────

export function useVorsorgeScore(): VorsorgeScoreResult {
  const { items, stats, loading: inventoryLoading } = useCitizenInventory()
  const { hasCompletedOnboarding } = useCitizenHousehold()
  const { location } = useCitizenLocation()
  const [newBadge, setNewBadge] = useState<Badge | null>(null)

  // ─── Inventar Score (0-40) ─────────────────────────────

  const inventarScore = useMemo<ScoreComponent>(() => {
    if (items.length === 0) {
      return { score: 0, max: 40, detail: 'Noch keine Vorräte angelegt' }
    }

    // Average fulfillment across all items (capped at 100% per item)
    const totalFulfillment = items.reduce((sum, item) => {
      if (item.target_qty === 0) return sum + 1 // Item without target = counted as fulfilled
      return sum + Math.min(item.current_qty / item.target_qty, 1)
    }, 0)
    const avgFulfillment = totalFulfillment / items.length
    const score = Math.round(avgFulfillment * 40)

    const percent = Math.round(avgFulfillment * 100)
    return {
      score,
      max: 40,
      detail: `${percent}% des Vorrats aufgefüllt`,
    }
  }, [items])

  // ─── Notfallplan Score (0-20) ──────────────────────────

  const notfallplanScore = useMemo<ScoreComponent>(() => {
    const plan = readNotfallplan()
    let score = 0

    if (plan.hasMeetingPoint) score += 8
    if (plan.contactCount >= 2) score += 8
    else if (plan.contactCount === 1) score += 4
    if (plan.hasNotes) score += 4

    const parts: string[] = []
    if (plan.hasMeetingPoint) parts.push('Treffpunkt')
    if (plan.contactCount > 0) parts.push(`${plan.contactCount} Kontakt${plan.contactCount !== 1 ? 'e' : ''}`)
    if (plan.hasNotes) parts.push('Notizen')

    return {
      score,
      max: 20,
      detail: parts.length > 0 ? parts.join(', ') : 'Noch nicht angelegt',
    }
  }, [])

  // ─── Wissen Score (0-20) ───────────────────────────────

  const wissenScore = useMemo<ScoreComponent>(() => {
    const readCount = getReadCount()
    const totalGuides = 10 // Fixed: 10 survival guides
    const score = Math.round(Math.min(readCount / totalGuides, 1) * 20)

    return {
      score,
      max: 20,
      detail: `${readCount}/${totalGuides} Guides gelesen`,
    }
  }, [])

  // ─── Aktualität Score (0-20) ───────────────────────────

  const aktualitaetScore = useMemo<ScoreComponent>(() => {
    let score = 0
    const parts: string[] = []

    // No expired items (8 points)
    if (stats.expiredItems === 0) {
      score += 8
      parts.push('Nichts abgelaufen')
    } else {
      parts.push(`${stats.expiredItems} abgelaufen`)
    }

    // Household set (6 points)
    if (hasCompletedOnboarding) {
      score += 6
      parts.push('Haushalt angelegt')
    }

    // Location set (6 points)
    if (location) {
      score += 6
      parts.push('Standort gesetzt')
    }

    return {
      score,
      max: 20,
      detail: parts.length > 0 ? parts.join(', ') : 'Profil unvollständig',
    }
  }, [stats.expiredItems, hasCompletedOnboarding, location])

  // ─── Total + Color ─────────────────────────────────────

  const total = inventarScore.score + notfallplanScore.score + wissenScore.score + aktualitaetScore.score

  const color: VorsorgeScoreResult['color'] = useMemo(() => {
    if (total >= 100) return 'purple'
    if (total >= 75) return 'green'
    if (total >= 50) return 'blue'
    if (total >= 25) return 'amber'
    return 'red'
  }, [total])

  // ─── Badges ────────────────────────────────────────────

  const unlockedBadges = useMemo(
    () => BADGES.filter(b => total >= b.threshold),
    [total],
  )

  const nextBadge = useMemo(
    () => BADGES.find(b => total < b.threshold) ?? null,
    [total],
  )

  // Check for new badge unlock
  useEffect(() => {
    if (inventoryLoading) return

    const previouslyUnlocked = getUnlockedBadgeIds()
    const currentlyUnlocked = new Set(unlockedBadges.map(b => b.id))

    // Find newly unlocked badge (highest new one)
    let newest: Badge | null = null
    for (const badge of unlockedBadges) {
      if (!previouslyUnlocked.has(badge.id)) {
        newest = badge
      }
    }

    // Persist all current badges
    if (currentlyUnlocked.size > previouslyUnlocked.size) {
      persistBadgeIds(currentlyUnlocked)
      if (newest) {
        setNewBadge(newest)
      }
    }
  }, [unlockedBadges, inventoryLoading])

  const dismissNewBadge = useCallback(() => {
    setNewBadge(null)
  }, [])

  return {
    total,
    percentile: calculatePercentile(total),
    color,
    breakdown: {
      inventar: inventarScore,
      notfallplan: notfallplanScore,
      wissen: wissenScore,
      aktualitaet: aktualitaetScore,
    },
    badges: unlockedBadges,
    nextBadge,
    newBadgeUnlocked: newBadge,
    dismissNewBadge,
    loading: inventoryLoading,
  }
}
