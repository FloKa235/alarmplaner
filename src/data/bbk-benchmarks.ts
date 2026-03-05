/**
 * bbk-benchmarks.ts — BBK-Richtwerte + Kommunaler Benchmark
 *
 * Referenzwerte basierend auf BBK-Empfehlungen für Landkreise.
 * Minimum = absolute Untergrenze, Empfohlen = Zielwert für gute Vorbereitung.
 *
 * Landes- und Bundesdurchschnitte: Simulierte Richtwerte für den BBK-Pitch.
 * In Zukunft durch echte aggregierte Daten aus der Plattform ersetzt.
 */

// ─── BBK-Richtwerte ──────────────────────────────────

export interface BenchmarkConfig {
  key: string
  label: string
  minimum: number
  empfohlen: number
  unit?: string
  /** Beschreibung für Tooltip */
  description?: string
}

export const BBK_BENCHMARKS: BenchmarkConfig[] = [
  {
    key: 'szenarien',
    label: 'Krisenszenarien',
    minimum: 5,
    empfohlen: 10,
    description: 'Anzahl durchgeplanter Krisenszenarien im Landkreis',
  },
  {
    key: 'handbuecher',
    label: 'Krisenhandbücher',
    minimum: 5,
    empfohlen: 10,
    description: 'Szenarien mit vollständigem KI-Krisenhandbuch',
  },
  {
    key: 'inventarAbdeckung',
    label: 'Inventar-Abdeckung',
    minimum: 60,
    empfohlen: 80,
    unit: '%',
    description: 'Prozentuale Abdeckung des Soll-Inventars',
  },
  {
    key: 'alarmkontakte',
    label: 'Alarmkontakte',
    minimum: 10,
    empfohlen: 25,
    description: 'Aktive Kontakte für Krisenstab-Alarmierung',
  },
  {
    key: 'checklistenFortschritt',
    label: 'ExTrass-Fortschritt',
    minimum: 50,
    empfohlen: 80,
    unit: '%',
    description: 'Fortschritt der ExTrass-Vorbereitungs-Checklisten',
  },
]

export type BenchmarkStatus = 'kritisch' | 'ausbaufaehig' | 'erfuellt'

export function getBenchmarkStatus(value: number, benchmark: BenchmarkConfig): BenchmarkStatus {
  if (value < benchmark.minimum) return 'kritisch'
  if (value < benchmark.empfohlen) return 'ausbaufaehig'
  return 'erfuellt'
}

// ─── Kommunaler Benchmark (Landes-/Bundesdurchschnitt) ─

export interface StateBenchmark {
  /** Gesamtvorsorge-Score (0–100), gewichteter Durchschnitt */
  prepScore: number
  /** Durchschnittliche Inventar-Abdeckung (%) */
  inventarAbdeckung: number
  /** Durchschnittliche Szenario-Anzahl */
  szenarien: number
  /** Durchschnittliche Handbücher */
  handbuecher: number
  /** Durchschnittliche Alarmkontakte */
  alarmkontakte: number
  /** Durchschnittlicher ExTrass-Fortschritt (%) */
  extrassPct: number
}

/**
 * Simulierte Durchschnittswerte pro Bundesland.
 * Realistische Schätzungen basierend auf:
 * - Stadtstaaten tendieren höher (kleinere Fläche, konzentrierte Verwaltung)
 * - Große Flächenstaaten tendieren niedriger (komplexere Koordination)
 * - Östliche Bundesländer leicht unter Durchschnitt (Demografie, Budgets)
 * - Bayern/BaWü/NRW im oberen Mittelfeld (größere Budgets)
 *
 * Wird in Zukunft durch echte aggregierte Plattform-Daten ersetzt.
 */
export const STATE_AVERAGES: Record<string, StateBenchmark> = {
  'Baden-Württemberg':       { prepScore: 56, inventarAbdeckung: 62, szenarien: 8, handbuecher: 5, alarmkontakte: 18, extrassPct: 42 },
  'Bayern':                  { prepScore: 58, inventarAbdeckung: 65, szenarien: 9, handbuecher: 6, alarmkontakte: 20, extrassPct: 45 },
  'Berlin':                  { prepScore: 64, inventarAbdeckung: 70, szenarien: 11, handbuecher: 8, alarmkontakte: 28, extrassPct: 55 },
  'Brandenburg':             { prepScore: 44, inventarAbdeckung: 48, szenarien: 6, handbuecher: 3, alarmkontakte: 12, extrassPct: 32 },
  'Bremen':                  { prepScore: 62, inventarAbdeckung: 68, szenarien: 10, handbuecher: 7, alarmkontakte: 22, extrassPct: 50 },
  'Hamburg':                 { prepScore: 66, inventarAbdeckung: 72, szenarien: 12, handbuecher: 9, alarmkontakte: 30, extrassPct: 58 },
  'Hessen':                  { prepScore: 52, inventarAbdeckung: 58, szenarien: 8, handbuecher: 5, alarmkontakte: 16, extrassPct: 40 },
  'Mecklenburg-Vorpommern':  { prepScore: 40, inventarAbdeckung: 44, szenarien: 5, handbuecher: 2, alarmkontakte: 10, extrassPct: 28 },
  'Niedersachsen':           { prepScore: 50, inventarAbdeckung: 55, szenarien: 7, handbuecher: 4, alarmkontakte: 15, extrassPct: 38 },
  'Nordrhein-Westfalen':     { prepScore: 54, inventarAbdeckung: 60, szenarien: 8, handbuecher: 5, alarmkontakte: 17, extrassPct: 41 },
  'Rheinland-Pfalz':         { prepScore: 48, inventarAbdeckung: 52, szenarien: 7, handbuecher: 4, alarmkontakte: 14, extrassPct: 35 },
  'Saarland':                { prepScore: 50, inventarAbdeckung: 55, szenarien: 7, handbuecher: 4, alarmkontakte: 15, extrassPct: 38 },
  'Sachsen':                 { prepScore: 46, inventarAbdeckung: 50, szenarien: 6, handbuecher: 3, alarmkontakte: 13, extrassPct: 34 },
  'Sachsen-Anhalt':          { prepScore: 42, inventarAbdeckung: 46, szenarien: 6, handbuecher: 3, alarmkontakte: 11, extrassPct: 30 },
  'Schleswig-Holstein':      { prepScore: 48, inventarAbdeckung: 53, szenarien: 7, handbuecher: 4, alarmkontakte: 14, extrassPct: 36 },
  'Thüringen':               { prepScore: 44, inventarAbdeckung: 48, szenarien: 6, handbuecher: 3, alarmkontakte: 12, extrassPct: 32 },
}

/** Bundesdurchschnitt aller 401 Landkreise (gewichteter Mittelwert) */
export const NATIONAL_AVERAGE: StateBenchmark = {
  prepScore: 51,
  inventarAbdeckung: 56,
  szenarien: 7,
  handbuecher: 4,
  alarmkontakte: 16,
  extrassPct: 39,
}

/**
 * Gibt den Landes-Durchschnitt für ein Bundesland zurück.
 * Fallback: Bundesdurchschnitt wenn Bundesland unbekannt.
 */
export function getStateAverage(state: string): StateBenchmark {
  return STATE_AVERAGES[state] || NATIONAL_AVERAGE
}
