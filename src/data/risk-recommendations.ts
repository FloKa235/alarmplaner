/**
 * Handlungsempfehlungen pro Risikotyp und Risiko-Level
 *
 * Jeder Risikotyp (Hochwasser, Sturm, Waldbrand, …) hat
 * gestaffelte Maßnahmen nach Level (niedrig → extrem).
 * Höhere Level beinhalten alle Maßnahmen der niedrigeren Level plus eigene.
 */

export type RecommendationPriority = 'sofort' | 'kurzfristig' | 'mittelfristig' | 'langfristig'

export interface Recommendation {
  text: string
  priority: RecommendationPriority
  /** Wann greift diese Empfehlung mindestens? */
  minLevel: 'niedrig' | 'mittel' | 'erhöht' | 'hoch' | 'extrem'
}

// Level → numerischer Wert für Vergleich
const LEVEL_ORDER: Record<string, number> = {
  niedrig: 0,
  mittel: 1,
  erhöht: 2,
  hoch: 3,
  extrem: 4,
}

// Normalisierung: Score → Level
export function scoreToLevel(score: number): string {
  if (score >= 70) return 'extrem'
  if (score >= 50) return 'hoch'
  if (score >= 35) return 'erhöht'
  if (score >= 15) return 'mittel'
  return 'niedrig'
}

/**
 * Liefert die relevanten Empfehlungen für einen Risikotyp + Level/Score
 */
export function getRecommendations(
  riskType: string,
  levelOrScore: string | number
): Recommendation[] {
  const level = typeof levelOrScore === 'number'
    ? scoreToLevel(levelOrScore)
    : levelOrScore.toLowerCase()

  const currentLevelNum = LEVEL_ORDER[level] ?? 1

  // Finde den passenden Schlüssel in der Datenbank
  const key = findRiskKey(riskType)
  const allRecs = RECOMMENDATIONS[key] || RECOMMENDATIONS['default']

  return allRecs
    .filter(r => LEVEL_ORDER[r.minLevel] <= currentLevelNum)
    .sort((a, b) => {
      const prioOrder: Record<RecommendationPriority, number> = {
        sofort: 0, kurzfristig: 1, mittelfristig: 2, langfristig: 3,
      }
      return prioOrder[a.priority] - prioOrder[b.priority]
    })
}

// Fuzzy-Match des Risikotyps gegen die Schlüssel
function findRiskKey(riskType: string): string {
  const lower = riskType.toLowerCase()
  const patterns: [RegExp, string][] = [
    [/hochwasser|überschwemmung|überflut|starkregen|sturmflut/, 'hochwasser'],
    [/sturm|orkan|tornado|wind/, 'sturm'],
    [/waldbrand|brand|feuer|flächenbrand/, 'waldbrand'],
    [/strom|blackout|energieversorg/, 'stromausfall'],
    [/hitze|hitzewelle|dürre|trocken/, 'extremhitze'],
    [/pandemie|epidemie|seuche|gesundheit/, 'pandemie'],
    [/cbrn|chemisch|biologisch|radio|nuklear/, 'cbrn'],
    [/cyber|hacker|it.?sicherheit|ransomware/, 'cyberangriff'],
    [/erdbeben|seismisch/, 'erdbeben'],
    [/erdrutsch|lawine|hang/, 'erdrutsch'],
  ]

  for (const [pattern, key] of patterns) {
    if (pattern.test(lower)) return key
  }
  return 'default'
}

// Prioritäts-Label + Farben (für UI)
export const PRIORITY_CONFIG: Record<RecommendationPriority, {
  label: string
  bg: string
  text: string
  border: string
}> = {
  sofort: {
    label: 'Sofort',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
  kurzfristig: {
    label: 'Kurzfristig',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
  },
  mittelfristig: {
    label: 'Mittelfristig',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  langfristig: {
    label: 'Langfristig',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
}

// ─── Empfehlungs-Datenbank ────────────────────────────

const RECOMMENDATIONS: Record<string, Recommendation[]> = {

  hochwasser: [
    // niedrig
    { text: 'Hochwasser-Alarmpläne auf Aktualität prüfen', priority: 'langfristig', minLevel: 'niedrig' },
    { text: 'Sandsackbestände und Lagerpunkte dokumentieren', priority: 'langfristig', minLevel: 'niedrig' },
    // mittel
    { text: 'Pegelstände regelmäßig kontrollieren', priority: 'mittelfristig', minLevel: 'mittel' },
    { text: 'Bevölkerung über Hochwasservorsorge informieren', priority: 'mittelfristig', minLevel: 'mittel' },
    { text: 'Evakuierungsrouten überprüfen und kommunizieren', priority: 'mittelfristig', minLevel: 'mittel' },
    // erhöht
    { text: 'Einsatzkräfte und THW voralarmieren', priority: 'kurzfristig', minLevel: 'erhöht' },
    { text: 'Sandsäcke und Pumpen an Hotspots positionieren', priority: 'kurzfristig', minLevel: 'erhöht' },
    { text: 'KRITIS-Objekte in Überflutungsgebieten warnen', priority: 'kurzfristig', minLevel: 'erhöht' },
    // hoch
    { text: 'Stab aktivieren und Führungsstruktur besetzen', priority: 'sofort', minLevel: 'hoch' },
    { text: 'Evakuierung gefährdeter Bereiche vorbereiten', priority: 'sofort', minLevel: 'hoch' },
    { text: 'Mobile Hochwasserschutzsysteme aufbauen', priority: 'sofort', minLevel: 'hoch' },
    // extrem
    { text: 'Evakuierung einleiten und Notunterkünfte öffnen', priority: 'sofort', minLevel: 'extrem' },
    { text: 'Überörtliche Hilfe und Katastrophenschutz anfordern', priority: 'sofort', minLevel: 'extrem' },
    { text: 'Trinkwasserversorgung sicherstellen', priority: 'sofort', minLevel: 'extrem' },
  ],

  sturm: [
    { text: 'Sturmschadens-Alarmpläne aktualisieren', priority: 'langfristig', minLevel: 'niedrig' },
    { text: 'Baumbestand entlang wichtiger Straßen kontrollieren', priority: 'langfristig', minLevel: 'niedrig' },
    { text: 'Wetterwarnungen engmaschig überwachen', priority: 'mittelfristig', minLevel: 'mittel' },
    { text: 'Feuerwehr-Bereitschaftsstärke überprüfen', priority: 'mittelfristig', minLevel: 'mittel' },
    { text: 'Bevölkerung vor Sturmgefahren warnen (NINA)', priority: 'kurzfristig', minLevel: 'erhöht' },
    { text: 'Straßenmeistereien in Bereitschaft versetzen', priority: 'kurzfristig', minLevel: 'erhöht' },
    { text: 'Außengastronomie und lose Gegenstände sichern lassen', priority: 'kurzfristig', minLevel: 'erhöht' },
    { text: 'Freiwillige Feuerwehren voralarmieren', priority: 'sofort', minLevel: 'hoch' },
    { text: 'Öffentliche Veranstaltungen prüfen/absagen', priority: 'sofort', minLevel: 'hoch' },
    { text: 'Schulen und KiTas ggf. schließen', priority: 'sofort', minLevel: 'extrem' },
    { text: 'Technisches Hilfswerk anfordern', priority: 'sofort', minLevel: 'extrem' },
  ],

  waldbrand: [
    { text: 'Waldbrand-Gefahrenindex regelmäßig auswerten', priority: 'langfristig', minLevel: 'niedrig' },
    { text: 'Löschwasser-Entnahmestellen im Wald dokumentieren', priority: 'langfristig', minLevel: 'niedrig' },
    { text: 'Bodenfeuchte und Vegetationsindex überwachen', priority: 'mittelfristig', minLevel: 'mittel' },
    { text: 'Grillverbote und Betretungsverbote vorbereiten', priority: 'mittelfristig', minLevel: 'mittel' },
    { text: 'Luftbeobachtung und Drohnenüberwachung planen', priority: 'kurzfristig', minLevel: 'erhöht' },
    { text: 'Feuerwehr mit Waldbrandausrüstung ausrüsten', priority: 'kurzfristig', minLevel: 'erhöht' },
    { text: 'Waldgebiete für Publikum sperren', priority: 'sofort', minLevel: 'hoch' },
    { text: 'Brandschneisen und Evakuierungsrouten aktivieren', priority: 'sofort', minLevel: 'hoch' },
    { text: 'Löschflugzeuge/Hubschrauber anfordern', priority: 'sofort', minLevel: 'extrem' },
    { text: 'Siedlungen im Waldrandbereich evakuieren', priority: 'sofort', minLevel: 'extrem' },
  ],

  stromausfall: [
    { text: 'Notstromversorgung kritischer Einrichtungen prüfen', priority: 'langfristig', minLevel: 'niedrig' },
    { text: 'Tankvorräte für Notstromaggregate aktualisieren', priority: 'langfristig', minLevel: 'niedrig' },
    { text: 'Kommunikationswege ohne Strom testen (BOS-Funk)', priority: 'mittelfristig', minLevel: 'mittel' },
    { text: 'Leuchttürme/Anlaufstellen für Bürger vorbereiten', priority: 'mittelfristig', minLevel: 'mittel' },
    { text: 'Notstromaggregate einsatzbereit machen', priority: 'kurzfristig', minLevel: 'erhöht' },
    { text: 'Krankenhäuser und Pflegeheime vorinformieren', priority: 'kurzfristig', minLevel: 'erhöht' },
    { text: 'Stab für Stromausfallszenario aktivieren', priority: 'sofort', minLevel: 'hoch' },
    { text: 'Bevölkerungswarnung über Lautsprecherfahrzeuge', priority: 'sofort', minLevel: 'hoch' },
    { text: 'Trinkwasserversorgung manuell sicherstellen', priority: 'sofort', minLevel: 'extrem' },
    { text: 'Mobile Wärmestellen bei Winterlage einrichten', priority: 'sofort', minLevel: 'extrem' },
  ],

  extremhitze: [
    { text: 'Hitzeaktionsplan aktualisieren', priority: 'langfristig', minLevel: 'niedrig' },
    { text: 'Kühle Räume und Trinkwasserstationen identifizieren', priority: 'langfristig', minLevel: 'niedrig' },
    { text: 'Vulnerable Gruppen erfassen (Senioren, Kranke)', priority: 'mittelfristig', minLevel: 'mittel' },
    { text: 'Hitzewarnungen an Pflegeeinrichtungen kommunizieren', priority: 'mittelfristig', minLevel: 'mittel' },
    { text: 'Öffentliche Kühlräume und Trinkbrunnen aktivieren', priority: 'kurzfristig', minLevel: 'erhöht' },
    { text: 'Rettungsdienst-Kapazitäten erhöhen', priority: 'kurzfristig', minLevel: 'erhöht' },
    { text: 'Waldbrandgefahr-Überwachung intensivieren', priority: 'kurzfristig', minLevel: 'erhöht' },
    { text: 'Großveranstaltungen im Freien einschränken', priority: 'sofort', minLevel: 'hoch' },
    { text: 'Badegewässer-Sicherheit verstärken', priority: 'sofort', minLevel: 'hoch' },
    { text: 'Hitzeschutz-Notfall: Mobile Kühlung für Krankenhäuser', priority: 'sofort', minLevel: 'extrem' },
  ],

  pandemie: [
    { text: 'Pandemiepläne und Hygiene-Konzepte überprüfen', priority: 'langfristig', minLevel: 'niedrig' },
    { text: 'Schutzausrüstungsbestände inventarisieren', priority: 'langfristig', minLevel: 'niedrig' },
    { text: 'Kontaktnachverfolgung vorbereiten', priority: 'mittelfristig', minLevel: 'mittel' },
    { text: 'Impf-/Test-Infrastruktur prüfen', priority: 'mittelfristig', minLevel: 'mittel' },
    { text: 'Infektionsschutz in Pflegeeinrichtungen verstärken', priority: 'kurzfristig', minLevel: 'erhöht' },
    { text: 'Krankenhauskapazitäten überprüfen', priority: 'kurzfristig', minLevel: 'erhöht' },
    { text: 'Großveranstaltungen einschränken', priority: 'sofort', minLevel: 'hoch' },
    { text: 'Isolations- und Quarantänestationen vorbereiten', priority: 'sofort', minLevel: 'hoch' },
    { text: 'Notfall-Triage und Priorisierung aktivieren', priority: 'sofort', minLevel: 'extrem' },
    { text: 'Ausgangsbeschränkungen prüfen', priority: 'sofort', minLevel: 'extrem' },
  ],

  cbrn: [
    { text: 'CBRN-Messtechnik und Dekont-Ausstattung prüfen', priority: 'langfristig', minLevel: 'niedrig' },
    { text: 'Zusammenarbeit mit ABC-Zug der Feuerwehr sicherstellen', priority: 'langfristig', minLevel: 'niedrig' },
    { text: 'Messprogramm für Störfall-Betriebe auffrischen', priority: 'mittelfristig', minLevel: 'mittel' },
    { text: 'Jodtabletten-Verteilung prüfen (bei KKW-Nähe)', priority: 'mittelfristig', minLevel: 'mittel' },
    { text: 'Warnsysteme für Gefahrstoff-Freisetzung testen', priority: 'kurzfristig', minLevel: 'erhöht' },
    { text: 'Einsatzkräfte mit CBRN-Schutz ausrüsten', priority: 'kurzfristig', minLevel: 'erhöht' },
    { text: 'Evakuierungszonen festlegen und kommunizieren', priority: 'sofort', minLevel: 'hoch' },
    { text: 'Bevölkerung zum Aufenthalt in Gebäuden auffordern', priority: 'sofort', minLevel: 'hoch' },
    { text: 'Großräumige Evakuierung und Dekontamination', priority: 'sofort', minLevel: 'extrem' },
    { text: 'Bundeswehr-Unterstützung anfordern', priority: 'sofort', minLevel: 'extrem' },
  ],

  cyberangriff: [
    { text: 'IT-Notfallpläne und Backup-Strategie überprüfen', priority: 'langfristig', minLevel: 'niedrig' },
    { text: 'BSI-Warnungen regelmäßig auswerten', priority: 'langfristig', minLevel: 'niedrig' },
    { text: 'Mitarbeiter-Sensibilisierung für Phishing durchführen', priority: 'mittelfristig', minLevel: 'mittel' },
    { text: 'Patch-Management für kritische Systeme prüfen', priority: 'mittelfristig', minLevel: 'mittel' },
    { text: 'IT-Systeme auf ungewöhnliche Aktivitäten überwachen', priority: 'kurzfristig', minLevel: 'erhöht' },
    { text: 'Offline-Kommunikationswege bereithalten', priority: 'kurzfristig', minLevel: 'erhöht' },
    { text: 'IT-Forensik-Team und BSI kontaktieren', priority: 'sofort', minLevel: 'hoch' },
    { text: 'Betroffene Systeme isolieren, Backups aktivieren', priority: 'sofort', minLevel: 'hoch' },
    { text: 'Alle kritischen IT-Systeme offline nehmen', priority: 'sofort', minLevel: 'extrem' },
    { text: 'Manuelle Betriebsführung in KRITIS aktivieren', priority: 'sofort', minLevel: 'extrem' },
  ],

  erdbeben: [
    { text: 'Erdbeben-Bereitschaftspläne aktualisieren', priority: 'langfristig', minLevel: 'niedrig' },
    { text: 'Gebäudestatik kritischer Infrastruktur prüfen', priority: 'mittelfristig', minLevel: 'mittel' },
    { text: 'USAR-Teams und Rettungshunde-Verfügbarkeit prüfen', priority: 'kurzfristig', minLevel: 'erhöht' },
    { text: 'Gasversorgung zur Schnellabschaltung vorbereiten', priority: 'sofort', minLevel: 'hoch' },
    { text: 'Such- und Rettungsteams sofort einsetzen', priority: 'sofort', minLevel: 'extrem' },
  ],

  erdrutsch: [
    { text: 'Gefährdete Hanglagen kartieren', priority: 'langfristig', minLevel: 'niedrig' },
    { text: 'Bodenfeuchte und Niederschlag in Risikogebieten überwachen', priority: 'mittelfristig', minLevel: 'mittel' },
    { text: 'Betroffene Straßen und Gebäude vorsorglich sperren', priority: 'kurzfristig', minLevel: 'erhöht' },
    { text: 'Evakuierung bedrohter Gebäude', priority: 'sofort', minLevel: 'hoch' },
    { text: 'Geotechnische Soforthilfe anfordern', priority: 'sofort', minLevel: 'extrem' },
  ],

  default: [
    { text: 'Einsatzpläne auf Vollständigkeit prüfen', priority: 'langfristig', minLevel: 'niedrig' },
    { text: 'Kommunikationswege und Alarmierungsketten testen', priority: 'mittelfristig', minLevel: 'mittel' },
    { text: 'Einsatzkräfte voralarmieren', priority: 'kurzfristig', minLevel: 'erhöht' },
    { text: 'Führungsstab aktivieren', priority: 'sofort', minLevel: 'hoch' },
    { text: 'Überörtliche Hilfe anfordern', priority: 'sofort', minLevel: 'extrem' },
  ],
}
