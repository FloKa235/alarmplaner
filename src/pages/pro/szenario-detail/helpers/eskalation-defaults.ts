/**
 * eskalation-defaults.ts — Default-Stufen, Farben, Migration
 */
import type {
  EskalationsStufe, EskalationsStufeNummer,
  EskalationsKommunikation,
  SzenarioMeta, DbScenarioPhase, AlarmkettenSchritt,
} from '@/types/database'

// ─── Farben pro Eskalationsstufe ─────────────────────

export const ESKALATION_COLORS: Record<EskalationsStufeNummer, {
  bg: string; border: string; borderB: string; text: string
  badge: string; dot: string; headerBg: string
}> = {
  1: { bg: 'bg-green-50', border: 'border-green-200', borderB: 'border-b-green-500', text: 'text-green-700', badge: 'bg-green-100 text-green-800', dot: 'bg-green-500', headerBg: 'bg-green-50' },
  2: { bg: 'bg-amber-50', border: 'border-amber-200', borderB: 'border-b-amber-500', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500', headerBg: 'bg-amber-50' },
  3: { bg: 'bg-red-50', border: 'border-red-200', borderB: 'border-b-red-500', text: 'text-red-700', badge: 'bg-red-100 text-red-800', dot: 'bg-red-500', headerBg: 'bg-red-50' },
}

// ─── Szenario-spezifische Auslöse-Kriterien ────────────

type TriggerSet = [string[], string[], string[]]  // [Stufe1, Stufe2, Stufe3]

const TRIGGER_DEFAULTS: Record<string, TriggerSet> = {
  Starkregen: [
    ['DWD-Unwetterwarnung ab Stufe 2', 'Pegelstand steigend', '≥ 25 l/m² prognostiziert'],
    ['Überflutung von Straßen/Unterführungen bestätigt', 'Pegelstand ≥ Meldestufe 3', 'KRITIS-Einrichtungen bedroht'],
    ['Massenhafte Gebäudeüberflutung', 'Damm-/Deichbruch droht', 'Evakuierung erforderlich'],
  ],
  Sturm: [
    ['DWD-Unwetterwarnung Stufe 2 (Windböen ≥ 75 km/h)', 'Sturmwarnung für Region aktiv', 'Fallende Bäume/Äste gemeldet'],
    ['Windböen ≥ 100 km/h gemessen', 'Straßensperrungen durch Sturmschäden', 'Stromausfälle in Teilgebieten'],
    ['Orkanböen ≥ 120 km/h', 'Großflächiger Infrastrukturausfall', 'Gebäudeschäden mit Personengefährdung'],
  ],
  Hitzewelle: [
    ['DWD-Hitzewarnung (≥ 32°C an 3+ Tagen)', 'Erhöhte Notrufe durch Kreislaufbeschwerden', 'Kühlkapazitäten in Pflegeheimen begrenzt'],
    ['Temperatur ≥ 38°C', 'Wasserversorgung eingeschränkt', 'Waldbrandgefahr Stufe 4–5'],
    ['Temperatur ≥ 40°C über 5+ Tage', 'Trinkwassernotstand', 'Massenhafte Hitze-Notfälle'],
  ],
  'Kältewelle': [
    ['DWD-Kältewarnung (≤ −15°C)', 'Frostschäden an Wasserleitungen gemeldet', 'Obdachlose Personen in Gefahr'],
    ['Temperatur ≤ −20°C', 'Heizungsausfälle in Wohngebäuden', 'Straßen durch Glätte unpassierbar'],
    ['Temperatur ≤ −25°C über 5+ Tage', 'Großflächiger Heizungsausfall', 'Versorgungslage kritisch'],
  ],
  Waldbrand: [
    ['Waldbrand-Gefahrenindex ≥ 4', 'Rauchentwicklung/Brandgeruch gemeldet', 'Trockenperiode > 14 Tage'],
    ['Brandfläche > 1 ha bestätigt', 'Ortschaften im Gefahrenbereich', 'Löschkapazitäten gebunden'],
    ['Brandfläche > 50 ha', 'Evakuierung von Ortschaften nötig', 'Überregionale Löschhilfe angefordert'],
  ],
  Amoklauf: [
    ['Verdächtige Drohungen/Schüsse gemeldet', 'Polizei-Erstmeldung eingegangen', 'Betroffene Einrichtung identifiziert'],
    ['Aktive Gefahrenlage bestätigt', 'Verletzte Personen gemeldet', 'Sperrzone eingerichtet'],
    ['Mehrere Tatorte/Massenanfall von Verletzten', 'Geiselnahme', 'Großalarm aller Rettungskräfte'],
  ],
  CBRN: [
    ['Ungewöhnlicher Geruch/Substanz gemeldet', 'ABC-Erkunder vor Ort', 'Messwerte leicht erhöht'],
    ['Kontamination bestätigt', 'Gefahrenbereich abgesperrt', 'Dekontamination eingeleitet'],
    ['Großflächige Kontamination', 'Massenhafte Betroffene', 'Evakuierung erforderlich'],
  ],
  Cyberangriff: [
    ['Ungewöhnliche Netzwerkaktivität erkannt', 'Erste Systeme nicht erreichbar', 'IT-Sicherheitsmeldung eingegangen'],
    ['Ransomware/Datenverschlüsselung bestätigt', 'KRITIS-Systeme betroffen', 'Verwaltung handlungsunfähig'],
    ['Vollständiger IT-Ausfall', 'Kritische Infrastruktur offline', 'Kein Zugriff auf Notfallsysteme'],
  ],
  Krieg: [
    ['Erhöhte Bedrohungslage durch Bund gemeldet', 'NATO-Warnstufe erhöht', 'Schutzraum-Überprüfung angeordnet'],
    ['Konkrete Bedrohung für Bundesgebiet', 'Teilmobilisierung/Alarmierung Reservisten', 'Bevölkerungsschutz aktiviert'],
    ['Angriff auf Bundesgebiet', 'Zivilschutzsirenen ausgelöst', 'Massenevakuierung eingeleitet'],
  ],
  Pandemie: [
    ['WHO/RKI-Warnung für neuartigen Erreger', 'Erste Fälle im Landkreis bestätigt', 'R-Wert > 1,5'],
    ['Krankenhausauslastung > 80%', 'Kontaktbeschränkungen erforderlich', 'Impf-/Teststrategie aktiviert'],
    ['Überlastung des Gesundheitssystems', 'Triage erforderlich', 'Lockdown / Ausgangssperre'],
  ],
  Sabotage: [
    ['Verdächtige Manipulation an Infrastruktur gemeldet', 'Polizeiliche Erstbewertung läuft', 'Sicherheitswarnung für KRITIS'],
    ['Sabotageakt bestätigt', 'Infrastrukturausfall durch Fremdeinwirkung', 'Täter ggf. noch aktiv'],
    ['Mehrere Sabotageziele betroffen', 'Großflächiger Versorgungsausfall', 'Bundesweite Sicherheitslage angespannt'],
  ],
  Stromausfall: [
    ['Netzbetreiber meldet Instabilität', 'Teilausfall > 2 Stunden', '≥ 5.000 Haushalte betroffen'],
    ['Flächendeckender Ausfall bestätigt', 'Notstromversorgung KRITIS aktiv', 'Ausfall > 6 Stunden erwartet'],
    ['Ausfall > 24 Stunden', 'Notstrom-Kapazitäten erschöpft', 'Versorgungslage kritisch'],
  ],
  Terroranschlag: [
    ['Konkrete Terrorwarnung eingegangen', 'Verdächtiger Gegenstand/Fahrzeug gemeldet', 'Polizei-Erstmeldung mit Terrorverdacht'],
    ['Anschlag bestätigt', 'Massenanfall von Verletzten', 'Sperrzone + Fahndung aktiv'],
    ['Mehrere Anschlagsorte', 'Nationale Sicherheitslage', 'Bundeswehr-Unterstützung angefordert'],
  ],
}

const GENERIC_TRIGGERS: TriggerSet = [
  ['Warnung durch DWD, NINA oder interne Meldung', 'Auffällige Lageveränderung erkannt', 'Frühindikator überschritten'],
  ['Schadenslage bestätigt', 'Akute Gefährdung für Bevölkerung', 'KRITIS-Einrichtungen betroffen'],
  ['Großschadenslage', 'Überforderung lokaler Kräfte', 'Externe Hilfe erforderlich'],
]

// ─── Default-Kommunikation pro Stufe ────────────────

const DEFAULT_KOMMUNIKATION: EskalationsKommunikation[] = [
  {
    intern: ['Krisenstabsleiter informieren', 'Lagemeldung an Bereitschaftsdienst', 'IT-Systeme auf Funktionsfähigkeit prüfen'],
    extern: [],
    kanaele: ['Telefon', 'E-Mail'],
    sprachregelungen: [],
  },
  {
    intern: ['Krisenstab vollständig einberufen', 'Lagebericht alle 2 Stunden', 'Einsatztagebuch führen'],
    extern: ['Bevölkerung über NINA und Website warnen', 'Pressemitteilung vorbereiten', 'Nachbarkommunen informieren'],
    kanaele: ['Telefon', 'E-Mail', 'Funk', 'NINA', 'Website'],
    sprachregelungen: [],
  },
  {
    intern: ['Permanente Stabsarbeit im Schichtbetrieb', 'Lagebericht stündlich', 'Dokumentation aller Entscheidungen'],
    extern: ['Bürgertelefon einrichten', 'Regelmäßige Pressekonferenzen', 'Landesregierung und Bundesbehörden informieren', 'Social-Media-Monitoring aktivieren'],
    kanaele: ['Telefon', 'E-Mail', 'Funk', 'NINA', 'Sirene', 'Lautsprecherdurchsage', 'Social Media', 'Presse', 'Website'],
    sprachregelungen: [],
  },
]

// ─── Default-Eskalationskriterien ───────────────────

const DEFAULT_ESKALATION_KRITERIEN: [string[], string[], string[]] = [
  ['Lage verschlechtert sich trotz Maßnahmen', 'Weitere KRITIS-Einrichtungen betroffen', 'Ressourcen reichen nicht aus'],
  ['Großschadenslage bestätigt', 'Lokale Kapazitäten erschöpft', 'Katastrophenfall muss ausgerufen werden'],
  [], // Stufe 3 hat keine weitere Eskalation
]

// ─── Default-Eskalationsstufen ───────────────────────

export function createDefaultEskalationsstufen(scenarioType?: string): EskalationsStufe[] {
  const triggers = (scenarioType && TRIGGER_DEFAULTS[scenarioType]) || GENERIC_TRIGGERS

  return [
    {
      stufe: 1,
      name: 'Vorwarnung',
      beschreibung: 'Frühzeitige Warnung, präventive Maßnahmen, Krisenstab informieren',
      checkliste: [],
      alarmkette: [],
      krisenstab_rollen: ['S2', 'S5'],
      ausloeser: triggers[0],
      informierte: ['Krisenstabsleiter', 'Ordnungsamt', 'Feuerwehr', 'Technischer Dienst'],
      sofortmassnahmen: ['Lage beobachten', 'Material prüfen', 'Bereitschaft erhöhen', 'Meldekette aktivieren'],
      kommunikation: DEFAULT_KOMMUNIKATION[0],
      ressourcen: [],
      lage_zusammenfassung: '',
      eskalations_kriterien: DEFAULT_ESKALATION_KRITERIEN[0],
    },
    {
      stufe: 2,
      name: 'Akuter Vorfall',
      beschreibung: 'Sofortmaßnahmen, Alarmkette aktivieren, Bevölkerung warnen',
      checkliste: [],
      alarmkette: [],
      krisenstab_rollen: ['S1', 'S2', 'S3', 'S4'],
      ausloeser: triggers[1],
      informierte: ['Krisenstab komplett', 'Polizei', 'Rettungsdienst', 'THW', 'Energieversorger'],
      sofortmassnahmen: ['Krisenstab einberufen', 'Einsatzkräfte alarmieren', 'Bevölkerung warnen', 'Notunterkünfte vorbereiten'],
      kommunikation: DEFAULT_KOMMUNIKATION[1],
      ressourcen: [],
      lage_zusammenfassung: '',
      eskalations_kriterien: DEFAULT_ESKALATION_KRITERIEN[1],
    },
    {
      stufe: 3,
      name: 'Katastrophe',
      beschreibung: 'Vollalarm, Evakuierung, externe Hilfe anfordern (Bundeswehr, THW)',
      checkliste: [],
      alarmkette: [],
      krisenstab_rollen: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'],
      ausloeser: triggers[2],
      informierte: ['Landesregierung', 'Bundeswehr', 'Nachbarkreise', 'Katastrophenschutz', 'Alle Einsatzkräfte'],
      sofortmassnahmen: ['Evakuierung einleiten', 'Externe Hilfe anfordern', 'Notfallversorgung sicherstellen', 'Langzeitunterkünfte einrichten'],
      kommunikation: DEFAULT_KOMMUNIKATION[2],
      ressourcen: [],
      lage_zusammenfassung: '',
      eskalations_kriterien: DEFAULT_ESKALATION_KRITERIEN[2],
    },
  ]
}

// ─── Migration: Alte Phasen → Eskalationsstufen ──────

function makeItem(text: string, beschreibung?: string) {
  return {
    id: crypto.randomUUID(),
    text,
    beschreibung: beschreibung || '',
    status: 'open' as const,
    completed_at: null,
  }
}

function cloneAlarmkette(chain: AlarmkettenSchritt[]): AlarmkettenSchritt[] {
  return chain.map(s => ({ ...s, id: crypto.randomUUID() }))
}

export function migrateToEskalationsstufen(opts: {
  meta: SzenarioMeta | null
  phases: DbScenarioPhase[]
  scenarioType?: string
}): EskalationsStufe[] {
  const { meta, phases, scenarioType } = opts
  const stufen = createDefaultEskalationsstufen(scenarioType)

  // 1. Phase-Tasks → Stufen-Checklisten
  if (phases.length > 0) {
    // Erste Phase → Stufe 1 (Vorwarnung)
    if (phases[0]?.tasks) {
      stufen[0].checkliste = phases[0].tasks.map(t => makeItem(t))
    }
    // Mittlere Phasen → Stufe 2 (Akuter Vorfall)
    const middlePhases = phases.slice(1, phases.length >= 3 ? -1 : undefined)
    stufen[1].checkliste = middlePhases.flatMap(p =>
      (p.tasks || []).map(t => makeItem(t))
    )
    // Letzte Phase → Stufe 3 (Katastrophe), wenn ≥3 Phasen
    if (phases.length >= 3) {
      const lastPhase = phases[phases.length - 1]
      stufen[2].checkliste = (lastPhase.tasks || []).map(t => makeItem(t))
    }
  }

  // 2. Sofortmaßnahmen → Stufe 2 ergänzen
  if (meta?.sofortmassnahmen?.length) {
    const existing = new Set(stufen[1].checkliste.map(c => c.text))
    for (const m of meta.sofortmassnahmen) {
      if (!existing.has(m)) {
        stufen[1].checkliste.push(makeItem(m))
      }
    }
  }

  // 3. Bestehende Alarmkette → alle Stufen kopieren
  if (meta?.massnahmenplan?.alarmkette?.length) {
    for (const stufe of stufen) {
      stufe.alarmkette = cloneAlarmkette(meta.massnahmenplan.alarmkette)
    }
  }

  return stufen
}
