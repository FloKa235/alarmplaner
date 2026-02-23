/**
 * guide-tracking — localStorage-basiertes Tracking für gelesene Guides
 *
 * Speichert Set von Guide-IDs in localStorage.
 * Wird von useVorsorgeScore und WissenssammlungPage verwendet.
 */

const STORAGE_KEY = 'alarmplaner-guides-read'

function getReadSet(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

function persistSet(ids: Set<string>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
}

export function markGuideAsRead(guideId: string): void {
  const ids = getReadSet()
  ids.add(guideId)
  persistSet(ids)
}

export function getReadGuides(): string[] {
  return [...getReadSet()]
}

export function getReadCount(): number {
  return getReadSet().size
}

export function isGuideRead(guideId: string): boolean {
  return getReadSet().has(guideId)
}
