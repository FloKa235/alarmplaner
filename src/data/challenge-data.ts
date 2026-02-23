/**
 * challenge-data.ts — Wöchentliche Vorsorge-Challenges
 *
 * 12 Challenges, rotierend pro Kalenderwoche.
 * localStorage-basiertes Tracking (alarmplaner-challenges).
 */

export interface Challenge {
  id: string
  title: string
  description: string
  emoji: string
  category: 'inventar' | 'notfallplan' | 'wissen' | 'aktualitaet'
  linkTo: string // Route zur relevanten Seite
}

export const CHALLENGES: Challenge[] = [
  {
    id: 'check_water',
    title: 'Prüfe deinen Wasservorrat',
    description: 'Hast du mindestens 20 Liter Trinkwasser pro Person? Prüfe Menge und Haltbarkeit.',
    emoji: '\u{1F4A7}',
    category: 'inventar',
    linkTo: '/app/vorsorge',
  },
  {
    id: 'read_guide',
    title: 'Lies einen neuen Guide',
    description: 'Wähle einen Survival-Guide, den du noch nicht gelesen hast, und frische dein Wissen auf.',
    emoji: '\u{1F4D6}',
    category: 'wissen',
    linkTo: '/app/wissen',
  },
  {
    id: 'set_meeting_point',
    title: 'Trage deinen Treffpunkt ein',
    description: 'Lege einen Notfall-Treffpunkt für deine Familie fest, falls Telefone nicht funktionieren.',
    emoji: '\u{1F4CD}',
    category: 'notfallplan',
    linkTo: '/app/notfallplan',
  },
  {
    id: 'check_medicine',
    title: 'Prüfe deine Hausapotheke',
    description: 'Kontrolliere Medikamente auf Vollständigkeit und Haltbarkeit.',
    emoji: '\u{1F48A}',
    category: 'inventar',
    linkTo: '/app/vorsorge',
  },
  {
    id: 'add_contacts',
    title: 'Fülle deine Kontaktliste aus',
    description: 'Trage mindestens 2 Notfallkontakte ein — Familie, Nachbarn oder Freunde.',
    emoji: '\u{1F4DE}',
    category: 'notfallplan',
    linkTo: '/app/notfallplan',
  },
  {
    id: 'check_expiry',
    title: 'Prüfe 3 Haltbarkeitsdaten',
    description: 'Kontrolliere die MHD deiner Vorräte und tausche abgelaufene Artikel aus.',
    emoji: '\u{1F4C5}',
    category: 'aktualitaet',
    linkTo: '/app/vorsorge',
  },
  {
    id: 'check_flashlight',
    title: 'Teste deine Taschenlampe',
    description: 'Funktioniert sie noch? Sind Batterien voll? Hast du Ersatzbatterien?',
    emoji: '\u{1F526}',
    category: 'inventar',
    linkTo: '/app/vorsorge',
  },
  {
    id: 'read_stromausfall',
    title: 'Lerne: Stromausfall-Vorsorge',
    description: 'Lies den Guide zum Thema Stromausfall und sei vorbereitet.',
    emoji: '\u26A1',
    category: 'wissen',
    linkTo: '/app/wissen',
  },
  {
    id: 'check_documents',
    title: 'Prüfe deine Dokumente',
    description: 'Sind wichtige Dokumente (Ausweis, Versicherungen) griffbereit und kopiert?',
    emoji: '\u{1F4C4}',
    category: 'inventar',
    linkTo: '/app/vorsorge',
  },
  {
    id: 'write_notes',
    title: 'Notiere wichtige Hinweise',
    description: 'Ergänze persönliche Notizen in deinem Notfallplan (Allergien, Medikamente etc.).',
    emoji: '\u{1F4DD}',
    category: 'notfallplan',
    linkTo: '/app/notfallplan',
  },
  {
    id: 'check_food',
    title: 'Prüfe deinen Lebensmittelvorrat',
    description: 'Reichen deine Vorräte für 10 Tage? Ergänze haltbare Lebensmittel.',
    emoji: '\u{1F96B}',
    category: 'inventar',
    linkTo: '/app/vorsorge',
  },
  {
    id: 'update_location',
    title: 'Aktualisiere deinen Standort',
    description: 'Ist dein Standort noch aktuell? Aktuelle Warnungen hängen davon ab.',
    emoji: '\u{1F4CD}',
    category: 'aktualitaet',
    linkTo: '/app/einstellungen',
  },
]

// ─── Helpers ──────────────────────────────────────────────

const STORAGE_KEY = 'alarmplaner-challenges'

/** Get the current challenge based on calendar week */
export function getCurrentChallenge(): Challenge {
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24))
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7)
  const index = weekNumber % CHALLENGES.length
  return CHALLENGES[index]
}

/** Check if a challenge has been completed this week */
export function isChallengeCompleted(challengeId: string): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    const data = JSON.parse(raw) as Record<string, string>
    const completedWeek = data[challengeId]
    if (!completedWeek) return false
    return completedWeek === getCurrentWeekKey()
  } catch {
    return false
  }
}

/** Mark a challenge as completed for this week */
export function markChallengeCompleted(challengeId: string): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const data: Record<string, string> = raw ? JSON.parse(raw) : {}
    data[challengeId] = getCurrentWeekKey()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // ignore
  }
}

function getCurrentWeekKey(): string {
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24))
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7)
  return `${now.getFullYear()}-W${weekNumber}`
}
