/**
 * warning-scenario-mapping.ts — Warnung → Szenario-Empfehlung + Gemeinde-Zuordnung
 *
 * Regelbasiertes Mapping: Warnungs-Keywords → passende Szenarien.
 * Matcht Warnungs-title + description gegen Keyword-Patterns.
 * Ordnet Warnungen betroffenen Gemeinden zu via affected_areas ↔ municipality.name.
 */
import type { DbExternalWarning, DbScenario, DbMunicipality } from '@/types/database'

// ─── Keyword → Szenario-Type Mapping ──────────────────

const WARNING_PATTERNS: { regex: RegExp; scenarioTypes: string[] }[] = [
  { regex: /starkregen|unwetter|gewitter|hagel|niederschlag/i, scenarioTypes: ['Starkregen', 'Sturm'] },
  { regex: /hochwasser|überschwemmung|überflutung|pegel|flut|sturzflut/i, scenarioTypes: ['Starkregen'] },
  { regex: /sturm|orkan|wind|böen|tornado/i, scenarioTypes: ['Sturm'] },
  { regex: /hitze|hitzewelle|temperatur.*extrem|tropennacht/i, scenarioTypes: ['Hitzewelle'] },
  { regex: /kälte|frost|schnee|eis|glätte|blitzeis|schneesturm/i, scenarioTypes: ['Extremwetter'] },
  { regex: /waldbrand|brand|feuer/i, scenarioTypes: ['Waldbrand'] },
  { regex: /erdbeben|seismisch/i, scenarioTypes: ['Erdbeben'] },
  { regex: /stromausfall|blackout|energieversorgung/i, scenarioTypes: ['Stromausfall'] },
  { regex: /cyber|hacker|it-sicherheit|ransomware/i, scenarioTypes: ['Cyberangriff'] },
  { regex: /epidemie|pandemie|virus|erreger|seuche|infektion/i, scenarioTypes: ['Pandemie'] },
  { regex: /sabotage|terrorismus|anschlag|bomben/i, scenarioTypes: ['Terroranschlag', 'Sabotage'] },
  { regex: /chemie|gefahrstoff|giftig|kontamination/i, scenarioTypes: ['Chemieunfall'] },
]

export interface WarningScenarioMatch {
  warning: DbExternalWarning
  matchedScenarios: DbScenario[]
  confidence: 'hoch' | 'mittel'
  /** Betroffene Gemeinden (aus affected_areas ↔ municipality.name Match) */
  affectedMunicipalities: string[]
}

// ─── Gemeinde-Zuordnung ───────────────────────────────

/**
 * Matcht warning.affected_areas gegen Gemeinde-Namen.
 * Case-insensitive substring-Match (NINA/DWD liefern Ortsnamen in affected_areas).
 * Fallback: affected_areas direkt verwenden wenn keine Gemeinde matcht.
 */
function matchAffectedMunicipalities(
  warning: DbExternalWarning,
  municipalities: DbMunicipality[]
): string[] {
  const areas = warning.affected_areas || []
  if (areas.length === 0 || municipalities.length === 0) return []

  const matched = new Set<string>()
  const areasLower = areas.map(a => a.toLowerCase())

  for (const mun of municipalities) {
    const munLower = mun.name.toLowerCase()
    // Prüfe ob ein affected_area den Gemeindenamen enthält oder umgekehrt
    for (const area of areasLower) {
      if (area.includes(munLower) || munLower.includes(area)) {
        matched.add(mun.name)
        break
      }
    }
  }

  // Fallback: affected_areas als Gebiets-Labels nehmen
  if (matched.size === 0 && areas.length > 0) {
    return areas.slice(0, 3)
  }

  return [...matched]
}

// ─── Haupt-Matching-Funktion ──────────────────────────

/**
 * Matcht aktive Warnungen gegen vorhandene Szenarien des Landkreises.
 * Nur moderate+ Warnungen werden berücksichtigt (nicht minor).
 * Optional: Gemeinde-Zuordnung über affected_areas.
 */
export function matchWarningsToScenarios(
  warnings: DbExternalWarning[],
  scenarios: DbScenario[],
  municipalities?: DbMunicipality[]
): WarningScenarioMatch[] {
  const results: WarningScenarioMatch[] = []
  const seenScenarioIds = new Set<string>()

  // Nur relevante Warnungen (moderate, severe, extreme)
  const relevantWarnings = warnings.filter(w =>
    w.severity === 'moderate' || w.severity === 'severe' || w.severity === 'extreme'
  )

  for (const warning of relevantWarnings) {
    const searchText = `${warning.title || ''} ${warning.description || ''}`.toLowerCase()

    // Alle passenden Szenario-Types sammeln
    const matchedTypes = new Set<string>()
    let isHighConfidence = false

    for (const pattern of WARNING_PATTERNS) {
      if (pattern.regex.test(searchText)) {
        for (const type of pattern.scenarioTypes) {
          matchedTypes.add(type.toLowerCase())
        }
        // Hohe Konfidenz wenn severe/extreme oder mehrere Pattern matchen
        if (warning.severity === 'severe' || warning.severity === 'extreme') {
          isHighConfidence = true
        }
      }
    }

    if (matchedTypes.size === 0) continue

    // Szenarien finden die zu den Types passen
    const matched = scenarios.filter(s => {
      if (seenScenarioIds.has(s.id)) return false
      const scenarioType = (s.type || '').toLowerCase()
      const scenarioTitle = (s.title || '').toLowerCase()
      return matchedTypes.has(scenarioType) ||
        [...matchedTypes].some(t => scenarioTitle.includes(t))
    })

    if (matched.length === 0) continue

    // Deduplizieren
    matched.forEach(s => seenScenarioIds.add(s.id))

    // Betroffene Gemeinden zuordnen
    const affectedMunicipalities = municipalities
      ? matchAffectedMunicipalities(warning, municipalities)
      : []

    results.push({
      warning,
      matchedScenarios: matched,
      confidence: isHighConfidence ? 'hoch' : 'mittel',
      affectedMunicipalities,
    })
  }

  // Sortieren: hohe Konfidenz zuerst
  return results.sort((a, b) => {
    if (a.confidence !== b.confidence) return a.confidence === 'hoch' ? -1 : 1
    return 0
  })
}
