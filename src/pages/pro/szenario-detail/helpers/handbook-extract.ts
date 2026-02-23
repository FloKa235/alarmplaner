/**
 * handbook-extract.ts — Zentralisierte Extraction-Logik
 *
 * Konsolidiert alle duplizierten Handbook-Parsing-Funktionen
 * aus UebersichtSection, AlarmierungSection, KommunikationSection.
 */
import type {
  ScenarioHandbookV2, ScenarioHandbookV3,
  KrisenhandbuchKapitelV3,
} from '@/types/database'

// ─── Kapitel-Suche ────────────────────────────────────

export function findKapitelByKey(
  handbook: ScenarioHandbookV2 | ScenarioHandbookV3,
  key: string,
  fallbackNummer?: number,
): KrisenhandbuchKapitelV3 | undefined {
  const v3kap = handbook.kapitel as KrisenhandbuchKapitelV3[]
  const byKey = v3kap.find(k => 'key' in k && k.key === key)
  if (byKey) return byKey
  if (fallbackNummer !== undefined) return handbook.kapitel.find(k => k.nummer === fallbackNummer) as KrisenhandbuchKapitelV3 | undefined
  return undefined
}

// ─── Risiko-Daten extrahieren ─────────────────────────

export interface RisikoData {
  bedrohungsanalyse: string
  eintrittswahrscheinlichkeit: string
  schadensausmass: string
  risikoeinschaetzung: string
  betroffene_sektoren: string[]
}

export function extractRisiko(handbook: ScenarioHandbookV2 | ScenarioHandbookV3): RisikoData | null {
  const kap = findKapitelByKey(handbook, 'lagefuehrung', 1)
  if (!kap) return null

  const lines = kap.inhalt.split('\n')
  let bedrohungsanalyse = ''
  let eintrittswahrscheinlichkeit = 'mittel'
  let schadensausmass = 'mittel'
  let risikoeinschaetzung = ''
  const betroffene_sektoren: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('Eintrittswahrscheinlichkeit:')) {
      const val = trimmed.replace('Eintrittswahrscheinlichkeit:', '').trim().toLowerCase()
      if (val.includes('niedrig')) eintrittswahrscheinlichkeit = 'niedrig'
      else if (val.includes('sehr hoch')) eintrittswahrscheinlichkeit = 'sehr_hoch'
      else if (val.includes('hoch')) eintrittswahrscheinlichkeit = 'hoch'
      else if (val.includes('mittel')) eintrittswahrscheinlichkeit = 'mittel'
    } else if (trimmed.startsWith('Schadensausma\u00DF:')) {
      const val = trimmed.replace('Schadensausma\u00DF:', '').trim().toLowerCase()
      if (val.includes('gering')) schadensausmass = 'gering'
      else if (val.includes('katastrophal')) schadensausmass = 'katastrophal'
      else if (val.includes('erheblich')) schadensausmass = 'erheblich'
      else if (val.includes('mittel')) schadensausmass = 'mittel'
    } else if (trimmed.startsWith('Betroffene KRITIS-Sektoren:')) {
      const sektoren = trimmed.replace('Betroffene KRITIS-Sektoren:', '').trim()
      betroffene_sektoren.push(...sektoren.split(',').map(s => s.trim()).filter(Boolean))
    } else if (!bedrohungsanalyse && trimmed.length > 20 && !trimmed.startsWith('Eintritts') && !trimmed.startsWith('Schadens') && !trimmed.startsWith('Betroffene')) {
      bedrohungsanalyse = trimmed
    }
  }

  const textBlocks = kap.inhalt.split('\n\n').filter(b => b.trim().length > 30)
  if (textBlocks.length > 1) {
    risikoeinschaetzung = textBlocks[textBlocks.length - 1].trim()
  } else if (textBlocks.length === 1 && !bedrohungsanalyse) {
    bedrohungsanalyse = textBlocks[0].trim()
  }

  // Warn if only defaults were returned (Regex probably didn't match)
  if (!bedrohungsanalyse && eintrittswahrscheinlichkeit === 'mittel' && schadensausmass === 'mittel') {
    console.warn('[handbook-extract] extractRisiko: Nur Defaults extrahiert — Kapitel-Format weicht möglicherweise ab')
  }

  return { bedrohungsanalyse, eintrittswahrscheinlichkeit, schadensausmass, risikoeinschaetzung, betroffene_sektoren }
}

// ─── Krisenstab S1-S6 Rollen extrahieren ──────────────

export interface StabsRolle {
  rolle: string     // "S1", "S2", etc.
  funktion: string  // "Personal", "Lage", etc.
  aufgabenCount: number
  aufgaben: string[]
}

export function extractKrisenstabRollen(handbook: ScenarioHandbookV2 | ScenarioHandbookV3): StabsRolle[] {
  const kap = findKapitelByKey(handbook, 'krisenorganisation', 3)
  if (!kap) return []

  const text = kap.inhalt.replace(/<[^>]+>/g, '\n')
  const rollen: StabsRolle[] = []
  const sMatches = text.matchAll(/\b(S[1-6])\s*[–\-]\s*([^\n]+)/g)

  for (const m of sMatches) {
    const rolle = m[1]
    const funktion = m[2].trim()
    const idx = text.indexOf(m[0])
    const nextS = text.slice(idx + m[0].length).search(/\bS[1-6]\s*[–\-]/)
    const block = nextS >= 0
      ? text.slice(idx + m[0].length, idx + m[0].length + nextS)
      : text.slice(idx + m[0].length, idx + m[0].length + 500)

    const aufgaben: string[] = []
    for (const line of block.split('\n')) {
      const trimmed = line.trim()
      if (trimmed.startsWith('-') || trimmed.startsWith('\u2022')) {
        aufgaben.push(trimmed.replace(/^[-\u2022]\s*/, ''))
      }
    }

    rollen.push({ rolle, funktion, aufgabenCount: aufgaben.length, aufgaben })
  }

  // Warn if no roles were found (Regex probably didn't match the KI output format)
  if (rollen.length === 0 && kap.inhalt.length > 50) {
    console.warn('[handbook-extract] extractKrisenstabRollen: Keine S1-S6 Rollen gefunden — Kapitel-Format weicht möglicherweise ab')
  }

  return rollen
}

// ─── Lookup-Tabellen ──────────────────────────────────

export const wkConfig: Record<string, { label: string; color: string; bg: string; bar: string; pct: number }> = {
  niedrig:   { label: 'Niedrig',   color: 'text-green-700',  bg: 'bg-green-50',  bar: 'bg-green-500',  pct: 25 },
  mittel:    { label: 'Mittel',    color: 'text-amber-700',  bg: 'bg-amber-50',  bar: 'bg-amber-500',  pct: 50 },
  hoch:      { label: 'Hoch',      color: 'text-orange-700', bg: 'bg-orange-50', bar: 'bg-orange-500', pct: 75 },
  sehr_hoch: { label: 'Sehr hoch', color: 'text-red-700',    bg: 'bg-red-50',    bar: 'bg-red-500',    pct: 100 },
}

export const smConfig: Record<string, { label: string; color: string; bg: string; bar: string; pct: number }> = {
  gering:       { label: 'Gering',       color: 'text-green-700',  bg: 'bg-green-50',  bar: 'bg-green-500',  pct: 25 },
  mittel:       { label: 'Mittel',       color: 'text-amber-700',  bg: 'bg-amber-50',  bar: 'bg-amber-500',  pct: 50 },
  erheblich:    { label: 'Erheblich',    color: 'text-orange-700', bg: 'bg-orange-50', bar: 'bg-orange-500', pct: 75 },
  katastrophal: { label: 'Katastrophal', color: 'text-red-700',    bg: 'bg-red-50',    bar: 'bg-red-500',    pct: 100 },
}

export interface SeverityStufe {
  stufe: 1 | 2 | 3
  label: string
  farbe: string
  bg: string
  border: string
}

export function getSeverityStufe(severity: number): SeverityStufe {
  if (severity >= 71) return { stufe: 3, label: 'Katastrophe', farbe: 'text-red-700', bg: 'bg-red-50', border: 'border-red-300' }
  if (severity >= 41) return { stufe: 2, label: 'Sehr schwere Lage', farbe: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-300' }
  return { stufe: 1, label: 'Schwere Lage', farbe: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-300' }
}

// ─── S-Rolle Farben ──────────────────────────────────

export const ROLLE_COLORS: Record<string, string> = {
  S1: 'bg-blue-600',
  S2: 'bg-green-600',
  S3: 'bg-red-600',
  S4: 'bg-purple-600',
  S5: 'bg-amber-600',
  S6: 'bg-cyan-600',
}

// ─── Beteiligte Organisationen ───────────────────────

export const STANDARD_ORGANISATIONEN = [
  'Feuerwehr', 'Polizei', 'THW', 'Rettungsdienst', 'DRK',
  'Bundeswehr', 'Verwaltung', 'Gesundheitsamt',
  'Energieversorger', 'Wasserversorger', 'Katastrophenschutz',
] as const

