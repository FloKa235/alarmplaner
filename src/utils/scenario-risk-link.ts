/**
 * Scenario-Risk-Link — Verknüpft Szenarien mit der Risikoanalyse
 *
 * Berechnet dynamische Severity-Anpassungen basierend auf:
 * 1. Aktuelle Risiko-Einträge (KI-Analyse)
 * 2. Aktive externe Warnungen
 *
 * Szenario-Typen werden auf KI-Risikokategorien gemappt.
 * Bei erhöhtem Risiko steigt die effektive Severity des Szenarios.
 */

import type { DbRiskEntry, DbExternalWarning, DbScenario } from '@/types/database'

// ─── Typen ────────────────────────────────────────────

export interface ScenarioRiskLink {
  scenarioId: string
  scenarioType: string
  baseSeverity: number
  /** Angepasste Severity unter Berücksichtigung aktueller Lage */
  effectiveSeverity: number
  /** Boost durch aktuelle Risikolage */
  severityBoost: number
  /** Gematchte Risiko-Einträge */
  linkedRiskEntries: DbRiskEntry[]
  /** Gematchte aktive Warnungen */
  linkedWarnings: DbExternalWarning[]
  /** Hat aktive Beeinflussung? */
  isElevated: boolean
  /** Zusammenfassung der Lage */
  lageText: string | null
}

export interface ScenarioRiskSummary {
  links: ScenarioRiskLink[]
  elevatedCount: number
  highestBoost: number
}

// ─── Mapping: Szenario-Typ → Risiko-Typ Patterns ─────

const SCENARIO_TO_RISK_PATTERNS: Record<string, RegExp[]> = {
  'Starkregen':     [/hochwasser|überschwemmung|starkregen/i],
  'Hochwasser':     [/hochwasser|überschwemmung|sturmflut/i],
  'Sturm/Orkan':    [/sturm|orkan|wind/i],
  'Waldbrand':      [/waldbrand|brand|feuer/i],
  'Erdbeben':       [/erdbeben|seismisch/i],
  'Erdrutsch':      [/erdrutsch|lawine|hang/i],
  'Stromausfall':   [/strom|blackout|energieversorg/i],
  'Wasserversorgung': [/wasser|trinkwasser|versorgung/i, /hochwasser/i],
  'Cyberangriff':   [/cyber|hacker|it.?sicherheit|ransomware/i],
  'CBRN':           [/cbrn|chemisch|biologisch|radio|nuklear/i],
  'Pandemie':       [/pandemie|epidemie|seuche|gesundheit/i],
  'Extremhitze':    [/hitze|hitzewelle|dürre|trocken/i],
  'Evakuierung':    [/hochwasser|brand|cbrn|erdbeben/i], // breit — alle die Evakuierung auslösen
}

// Warnung-Source/Title → Szenario-Typ Patterns
const WARNING_TO_SCENARIO_PATTERNS: [RegExp, string[]][] = [
  [/hochwasser|pegel|überflut|überschwem/i, ['Hochwasser', 'Starkregen', 'Evakuierung']],
  [/starkregen|unwetter|gewitter/i, ['Starkregen', 'Hochwasser']],
  [/sturm|orkan|wind|böen/i, ['Sturm/Orkan']],
  [/waldbrand|brand|feuer/i, ['Waldbrand', 'Evakuierung']],
  [/hitze|heiß|temperatur/i, ['Extremhitze']],
  [/glätte|frost|schnee|eis/i, ['Sturm/Orkan']],
  [/flut|tsunami|sturmflut/i, ['Hochwasser', 'Evakuierung']],
]

// ─── Hauptfunktion ────────────────────────────────────

export function linkScenariosToRisks(
  scenarios: DbScenario[],
  riskEntries: DbRiskEntry[],
  warnings: DbExternalWarning[]
): ScenarioRiskSummary {
  const links: ScenarioRiskLink[] = scenarios.map(scenario => {
    const patterns = SCENARIO_TO_RISK_PATTERNS[scenario.type] || []

    // 1. Finde passende Risiko-Einträge
    const linkedRisks = riskEntries.filter(entry =>
      patterns.some(p => p.test(entry.type))
    )

    // 2. Finde passende Warnungen
    const linkedWarns = warnings.filter(w => {
      const text = `${w.title || ''} ${w.description || ''}`.toLowerCase()
      return WARNING_TO_SCENARIO_PATTERNS.some(([pattern, types]) =>
        types.includes(scenario.type) && pattern.test(text)
      )
    })

    // 3. Severity-Boost berechnen
    let boost = 0

    // Boost durch hohe Risiko-Scores
    if (linkedRisks.length > 0) {
      const maxRiskScore = Math.max(...linkedRisks.map(r => r.score))
      // Bei Risiko-Score > 50: linear +5 bis +20
      if (maxRiskScore >= 50) {
        boost += Math.min(20, Math.round((maxRiskScore - 50) * 0.4))
      }
    }

    // Boost durch aktive Warnungen
    linkedWarns.forEach(w => {
      const sev = (w.severity || '').toLowerCase()
      if (sev === 'extreme') boost += 15
      else if (sev === 'severe') boost += 10
      else if (sev === 'moderate') boost += 5
    })

    // Cap bei +30
    boost = Math.min(30, boost)

    const effectiveSeverity = Math.min(100, scenario.severity + boost)

    // Lage-Text
    let lageText: string | null = null
    if (boost > 0) {
      const parts: string[] = []
      if (linkedRisks.length > 0) {
        const top = linkedRisks.sort((a, b) => b.score - a.score)[0]
        parts.push(`Risiko-Score ${top.type}: ${top.score}%`)
      }
      if (linkedWarns.length > 0) {
        parts.push(`${linkedWarns.length} aktive ${linkedWarns.length === 1 ? 'Warnung' : 'Warnungen'}`)
      }
      lageText = parts.join(' · ')
    }

    return {
      scenarioId: scenario.id,
      scenarioType: scenario.type,
      baseSeverity: scenario.severity,
      effectiveSeverity,
      severityBoost: boost,
      linkedRiskEntries: linkedRisks,
      linkedWarnings: linkedWarns,
      isElevated: boost > 0,
      lageText,
    }
  })

  return {
    links,
    elevatedCount: links.filter(l => l.isElevated).length,
    highestBoost: Math.max(0, ...links.map(l => l.severityBoost)),
  }
}

/**
 * Einzelnes Szenario verknüpfen (für DetailPage)
 */
export function linkSingleScenarioToRisks(
  scenario: DbScenario,
  riskEntries: DbRiskEntry[],
  warnings: DbExternalWarning[]
): ScenarioRiskLink {
  const result = linkScenariosToRisks([scenario], riskEntries, warnings)
  return result.links[0]
}
