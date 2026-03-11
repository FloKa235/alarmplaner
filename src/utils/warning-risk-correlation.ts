/**
 * warning-risk-correlation.ts — Live-Korrelation zwischen Warnungen und Risiko-Scores
 *
 * Matcht aktive Warnungen (NINA, DWD, Pegel) gegen die 8 KI-Risikokategorien.
 * Berechnet einen Score-Boost basierend auf Warnung-Severity.
 * Liefert "adjustedScore" für Live-Anzeige auf der Risikoanalyse-Seite.
 */
import type { DbExternalWarning, DbRiskEntry } from '@/types/database'

// ─── Warnung-Keyword → Risikokategorie Mapping ──────

interface WarningRiskPattern {
  regex: RegExp
  /** Risiko-Typen die von dieser Warnung beeinflusst werden (case-insensitive match gegen risk_entry.type) */
  riskTypes: string[]
}

const WARNING_RISK_PATTERNS: WarningRiskPattern[] = [
  {
    regex: /hochwasser|überschwemmung|überflutung|pegel|flut|sturzflut|starkregen|unwetter|niederschlag/i,
    riskTypes: ['hochwasser', 'überschwemmung', 'starkregen', 'überschwemmungsgebiet', 'gewässer', 'staudamm'],
  },
  {
    regex: /sturm|orkan|wind|böen|tornado|gewitter|hagel/i,
    riskTypes: ['sturm', 'orkan', 'sturm/orkan'],
  },
  {
    regex: /hitze|hitzewelle|temperatur.*extrem|tropennacht|uv/i,
    riskTypes: ['extremhitze', 'hitze', 'hitzewelle', 'dürre'],
  },
  {
    regex: /kälte|frost|schnee|eis|glätte|blitzeis|schneesturm/i,
    riskTypes: ['kältewelle', 'kälte', 'extremwetter'],
  },
  {
    regex: /waldbrand|brand|feuer|flächenbrand/i,
    riskTypes: ['waldbrand', 'waldbedeckung'],
  },
  {
    regex: /stromausfall|blackout|energieversorgung|netzausfall/i,
    riskTypes: ['stromausfall'],
  },
  {
    regex: /cyber|hacker|it-sicherheit|ransomware|ddos/i,
    riskTypes: ['cyberangriff', 'cyber'],
  },
  {
    regex: /epidemie|pandemie|virus|erreger|seuche|infektion/i,
    riskTypes: ['pandemie'],
  },
  {
    regex: /chemie|gefahrstoff|giftig|kontamination|nuklear|radioaktiv|biologisch/i,
    riskTypes: ['cbrn'],
  },
  {
    regex: /erdbeben|seismisch/i,
    riskTypes: ['erdbeben', 'erdbebenzone'],
  },
  {
    regex: /erdrutsch|lawine|hangrutsch|mure/i,
    riskTypes: ['erdrutsch', 'lawine'],
  },
]

// ─── Severity → Score-Boost ─────────────────────────

const SEVERITY_BOOST: Record<string, number> = {
  minor: 0,
  moderate: 8,
  severe: 18,
  extreme: 30,
}

// ─── Typen ──────────────────────────────────────────

export interface RiskWarningCorrelation {
  /** Die betroffene Risiko-Entry */
  riskEntry: DbRiskEntry
  /** Passende aktive Warnungen */
  matchedWarnings: DbExternalWarning[]
  /** Höchste Severity der Warnungen */
  highestSeverity: 'minor' | 'moderate' | 'severe' | 'extreme'
  /** Score-Boost durch aktive Warnungen */
  scoreBoost: number
  /** Angepasster Score (base + boost, max 100) */
  adjustedScore: number
  /** Hat aktive Warnungen? */
  hasActiveWarnings: boolean
}

export interface CorrelationSummary {
  /** Korrelation pro Risiko-Entry */
  correlations: RiskWarningCorrelation[]
  /** Gesamt-Score-Boost für das Profil */
  totalBoost: number
  /** Angepasster Gesamt-Score (max 100) */
  adjustedTotalScore: number
  /** Anzahl Risiken mit aktiven Warnungen */
  risksWithWarnings: number
  /** Höchste aktive Severity über alle Warnungen */
  highestActiveSeverity: 'minor' | 'moderate' | 'severe' | 'extreme' | null
}

// ─── Haupt-Funktion ─────────────────────────────────

const SEVERITY_ORDER = ['minor', 'moderate', 'severe', 'extreme'] as const

/**
 * Korreliert aktive Warnungen mit Risiko-Entries.
 * Berechnet Score-Boosts und gibt adjustierte Scores zurück.
 */
export function correlateWarningsWithRisks(
  warnings: DbExternalWarning[],
  riskEntries: DbRiskEntry[],
  baseScore: number
): CorrelationSummary {
  // Nur relevante Warnungen (moderate+)
  const activeWarnings = warnings.filter(
    (w) => w.severity === 'moderate' || w.severity === 'severe' || w.severity === 'extreme'
  )

  const correlations: RiskWarningCorrelation[] = riskEntries.map((entry) => {
    const entryTypeLower = (entry.type || '').toLowerCase()

    // Finde passende Warnungen für diesen Risiko-Typ
    const matchedWarnings: DbExternalWarning[] = []

    for (const warning of activeWarnings) {
      const searchText = `${warning.title || ''} ${warning.description || ''}`.toLowerCase()

      for (const pattern of WARNING_RISK_PATTERNS) {
        if (!pattern.regex.test(searchText)) continue

        // Prüfe ob einer der Risiko-Typen zum Entry passt
        const matches = pattern.riskTypes.some(
          (rt) => entryTypeLower.includes(rt) || rt.includes(entryTypeLower)
        )

        if (matches && !matchedWarnings.includes(warning)) {
          matchedWarnings.push(warning)
        }
      }
    }

    // Höchste Severity bestimmen
    let highestSeverity: 'minor' | 'moderate' | 'severe' | 'extreme' = 'minor'
    for (const w of matchedWarnings) {
      const idx = SEVERITY_ORDER.indexOf(w.severity as typeof SEVERITY_ORDER[number])
      if (idx > SEVERITY_ORDER.indexOf(highestSeverity)) {
        highestSeverity = w.severity as typeof SEVERITY_ORDER[number]
      }
    }

    // Boost berechnen (höchste Severity zählt + kleiner Bonus pro Extra-Warnung)
    let scoreBoost = 0
    if (matchedWarnings.length > 0) {
      scoreBoost = SEVERITY_BOOST[highestSeverity] || 0
      // +3 pro zusätzliche Warnung (max +12 extra)
      scoreBoost += Math.min(12, (matchedWarnings.length - 1) * 3)
    }

    const adjustedScore = Math.min(100, entry.score + scoreBoost)

    return {
      riskEntry: entry,
      matchedWarnings,
      highestSeverity,
      scoreBoost,
      adjustedScore,
      hasActiveWarnings: matchedWarnings.length > 0,
    }
  })

  // Gesamt-Boost berechnen (gewichteter Durchschnitt der Boosts)
  const risksWithWarnings = correlations.filter((c) => c.hasActiveWarnings).length
  const avgBoost =
    risksWithWarnings > 0
      ? Math.round(
          correlations.reduce((sum, c) => sum + c.scoreBoost, 0) / correlations.length
        )
      : 0

  // Höchste aktive Severity insgesamt
  let highestActiveSeverity: typeof SEVERITY_ORDER[number] | null = null
  for (const w of activeWarnings) {
    const idx = SEVERITY_ORDER.indexOf(w.severity as typeof SEVERITY_ORDER[number])
    if (highestActiveSeverity === null || idx > SEVERITY_ORDER.indexOf(highestActiveSeverity)) {
      highestActiveSeverity = w.severity as typeof SEVERITY_ORDER[number]
    }
  }

  return {
    correlations,
    totalBoost: avgBoost,
    adjustedTotalScore: Math.min(100, baseScore + avgBoost),
    risksWithWarnings,
    highestActiveSeverity,
  }
}

// ─── Helfer für Severity-Labels ─────────────────────

export const severityLabel: Record<string, string> = {
  minor: 'Gering',
  moderate: 'Mäßig',
  severe: 'Schwer',
  extreme: 'Extrem',
}

export const severityColor: Record<string, string> = {
  minor: 'text-blue-600 bg-blue-50 border-blue-200',
  moderate: 'text-amber-600 bg-amber-50 border-amber-200',
  severe: 'text-orange-600 bg-orange-50 border-orange-200',
  extreme: 'text-red-600 bg-red-50 border-red-200',
}
