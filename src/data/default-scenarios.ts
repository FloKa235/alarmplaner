// ============================================
// Alarmplaner – 13 Standard-Krisenszenarien
// ============================================
// Diese Szenarien werden beim Onboarding automatisch
// für jeden Landkreis angelegt (is_default: true).
// Sie können bearbeitet UND gelöscht werden.
// ============================================

export interface DefaultScenarioPhase {
  name: string
  duration: string
  tasks: string[]
}

export interface DefaultScenarioInventarItem {
  kategorie: string
  /** Menge pro 10.000 Einwohner – wird im Onboarding auf die tatsächliche Bevölkerungszahl skaliert */
  pro_10k_einwohner: number
  einheit: string
  begruendung: string
  /** Bereich aus der Soll-Ist-Materialliste (z.B. "Erste Hilfe", "Kommunikation") */
  bereich: string
  /** Priorität: Kritisch, Hoch, Mittel, Niedrig */
  prioritaet: 'Kritisch' | 'Hoch' | 'Mittel' | 'Niedrig'
}

export interface DefaultAlarmkettenSchritt {
  rolle: string
  kontaktgruppen: string[]
  kanaele: ('telefon' | 'email' | 'funk' | 'nina' | 'sirene' | 'messenger')[]
  wartezeit_min: number
}

export interface DefaultScenarioTemplate {
  title: string
  type: string
  severity: number
  description: string
  phases: DefaultScenarioPhase[]
  inventar?: DefaultScenarioInventarItem[]
  alarmkette?: DefaultAlarmkettenSchritt[]
}

export const DEFAULT_SCENARIOS: DefaultScenarioTemplate[] = [
  // ═══════════════════════════════════════════════
  //  NATURKATASTROPHEN (5)
  // ═══════════════════════════════════════════════

  // ─── 1. Starkregen / Sturzflut ──────────────────
  {
    title: 'Starkregen / Sturzflut',
    type: 'Starkregen',
    severity: 65,
    description:
      'Extremes Niederschlagsereignis mit über 40 l/m² in kurzer Zeit. Überflutung von Straßen, Unterführungen und Kellern. Überlastung der Kanalisation, Hangrutschungen möglich. Besonders gefährdet: Siedlungen in Senken und an Gewässern.',
    phases: [
      {
        name: 'Vorwarnung & Vorbereitung (12–2 Stunden vorher)',
        duration: '12–2 Stunden',
        tasks: [
          'DWD-Unwetterwarnungen auswerten und Krisenstab vorinformieren',
          'Bevölkerungswarnung über NINA, Sirenen und Social Media herausgeben',
          'Sandsack-Ausgabestellen aktivieren und Befüllung starten',
          'Feuerwehr und THW in erhöhte Bereitschaft versetzen',
          'Bekannte Überflutungspunkte (Unterführungen, Senken) sichern und absperren',
        ],
      },
      {
        name: 'Akutphase (während des Ereignisses)',
        duration: '2–12 Stunden',
        tasks: [
          'Leitstelle personell verstärken – Einsatzkoordination priorisieren',
          'Personenrettung aus überfluteten Fahrzeugen und Gebäuden',
          'Pumparbeiten in kritischen Bereichen koordinieren (Krankenhäuser, Pflegeheime, KRITIS)',
          'Straßensperrungen einrichten und Umleitungen kommunizieren',
          'Pegelstände kontinuierlich überwachen und Lagemeldungen erstellen',
        ],
      },
      {
        name: 'Schadensbewältigung (1–7 Tage)',
        duration: '1–7 Tage',
        tasks: [
          'Systematische Schadenserfassung in betroffenen Gebieten',
          'Kellerauspumpung und Trocknungsmaßnahmen koordinieren',
          'Trinkwasserversorgung prüfen (Kontamination durch Rückstau)',
          'Soforthilfe für betroffene Bürger organisieren',
          'Schäden dokumentieren und Versicherungsmeldungen unterstützen',
        ],
      },
    ],
    inventar: [
      { kategorie: 'Sandsäcke (gefüllt)', pro_10k_einwohner: 2000, einheit: 'Stück', begruendung: 'Abdichtung Gebäude und Errichtung von Dämmen', bereich: 'Mobile Schutzsysteme', prioritaet: 'Kritisch' },
      { kategorie: 'Sandsäcke (leer, Reserve)', pro_10k_einwohner: 1000, einheit: 'Stück', begruendung: 'Schnelles Befüllen bei akuter Lage', bereich: 'Mobile Schutzsysteme', prioritaet: 'Kritisch' },
      { kategorie: 'Hochwasserschutz-Dammsystem (mobil)', pro_10k_einwohner: 200, einheit: 'Laufmeter', begruendung: 'Schneller Aufbau von Schutzdämmen', bereich: 'Mobile Schutzsysteme', prioritaet: 'Hoch' },
      { kategorie: 'Tauchpumpe Schmutzwasser', pro_10k_einwohner: 10, einheit: 'Stück', begruendung: 'Auspumpen überfluteter Keller und Gebäude', bereich: 'Pumpen & Entwässerung', prioritaet: 'Hoch' },
      { kategorie: 'Hochleistungspumpe', pro_10k_einwohner: 4, einheit: 'Stück', begruendung: 'Großflächige Entwässerung', bereich: 'Pumpen & Entwässerung', prioritaet: 'Mittel' },
      { kategorie: 'Druckschläuche C-52 (20m)', pro_10k_einwohner: 40, einheit: 'Stück', begruendung: 'Wasserableitung von Pumpen', bereich: 'Pumpen & Entwässerung', prioritaet: 'Hoch' },
      { kategorie: 'Schlauchboot (4-6 Personen)', pro_10k_einwohner: 6, einheit: 'Stück', begruendung: 'Rettung aus überfluteten Gebieten', bereich: 'Wasserrettung', prioritaet: 'Hoch' },
      { kategorie: 'Schwimmwesten (Erwachsene)', pro_10k_einwohner: 150, einheit: 'Stück', begruendung: 'Sicherheit bei Rettungsaktionen im Wasser', bereich: 'Wasserrettung', prioritaet: 'Hoch' },
      { kategorie: 'Notstromaggregat 5-10 kVA', pro_10k_einwohner: 2, einheit: 'Stück', begruendung: 'Notstromversorgung für Pumpen und Beleuchtung', bereich: 'Stromerzeugung', prioritaet: 'Hoch' },
      { kategorie: 'Absperrmaterial (Verkehrsleitkegel)', pro_10k_einwohner: 500, einheit: 'Stück', begruendung: 'Absperrung überfluteter Straßen', bereich: 'Verkehrslenkung', prioritaet: 'Hoch' },
      { kategorie: 'LED-Flutlichtstrahler 50W', pro_10k_einwohner: 10, einheit: 'Stück', begruendung: 'Ausleuchtung der Einsatzstellen bei Nacht', bereich: 'Beleuchtung', prioritaet: 'Kritisch' },
      { kategorie: 'Feldbetten (klappbar)', pro_10k_einwohner: 350, einheit: 'Stück', begruendung: 'Notunterkünfte für evakuierte Personen', bereich: 'Unterkunft und Betreuung', prioritaet: 'Kritisch' },
    ],
    alarmkette: [
      { rolle: 'S3 – Einsatz', kontaktgruppen: ['Krisenstab', 'Feuerwehr'], kanaele: ['telefon', 'funk'], wartezeit_min: 0 },
      { rolle: 'S4 – Versorgung', kontaktgruppen: ['THW', 'Bauhof'], kanaele: ['telefon', 'email'], wartezeit_min: 5 },
      { rolle: 'S2 – Lage', kontaktgruppen: ['Krisenstab'], kanaele: ['telefon'], wartezeit_min: 5 },
      { rolle: 'S1 – Personal', kontaktgruppen: ['Krisenstab'], kanaele: ['telefon', 'email'], wartezeit_min: 10 },
      { rolle: 'S6 – IT/Kommunikation', kontaktgruppen: ['Krisenstab'], kanaele: ['telefon'], wartezeit_min: 10 },
      { rolle: 'S5 – Presse', kontaktgruppen: ['Medien'], kanaele: ['email', 'nina'], wartezeit_min: 30 },
    ],
  },

  // ─── 2. Schwerer Sturm / Orkan ──────────────────
  {
    title: 'Schwerer Sturm / Orkan',
    type: 'Sturm',
    severity: 65,
    description:
      'Schwerer Sturm mit Windgeschwindigkeiten über 100 km/h. Umgestürzte Bäume, beschädigte Dächer, Straßensperrungen und mögliche Stromausfälle. Hohe Gefahr für Menschenleben im Freien.',
    phases: [
      {
        name: 'Vorwarnphase (24–6 Stunden vor Eintreffen)',
        duration: '24–6 Stunden',
        tasks: [
          'DWD-Warnungen auswerten und Krisenstab vorinformieren',
          'Bevölkerungswarnung herausgeben (NINA, Sirenen, Social Media)',
          'Sicherung von Baustellen, Marktständen und mobilen Objekten veranlassen',
          'Einsatzbereitschaft der Feuerwehr und des THW erhöhen',
          'Notstromaggregate vorsorglich positionieren',
        ],
      },
      {
        name: 'Akutphase (während des Sturms)',
        duration: '6–24 Stunden',
        tasks: [
          'Leitstelle personell verstärken – Einsatzkoordination',
          'Freihaltung von Rettungswegen priorisieren',
          'Personenrettung hat Vorrang vor Sachschutz',
          'Gefahrenbereiche absperren (Parks, Waldgebiete, Hochhäuser)',
          'Lagemeldungen an Landesbehörden übermitteln',
        ],
      },
      {
        name: 'Aufräumphase (1–7 Tage)',
        duration: '1–7 Tage',
        tasks: [
          'Systematische Schadenserfassung und Priorisierung',
          'Straßen und Schienenwege räumen',
          'Statik beschädigter Gebäude prüfen lassen',
          'Soforthilfe für betroffene Bürger koordinieren',
          'Versicherungsmeldungen unterstützen',
        ],
      },
    ],
    inventar: [
      { kategorie: 'Motorsäge', pro_10k_einwohner: 2, einheit: 'Stück', begruendung: 'Räumung umgestürzter Bäume', bereich: 'Werkzeug', prioritaet: 'Hoch' },
      { kategorie: 'Schnittschutzhosen', pro_10k_einwohner: 30, einheit: 'Stück', begruendung: 'Schutzausrüstung für Motorsägenarbeiten', bereich: 'Schutzausrüstung', prioritaet: 'Kritisch' },
      { kategorie: 'Notstromaggregat 5-10 kVA', pro_10k_einwohner: 2, einheit: 'Stück', begruendung: 'Stromversorgung bei Leitungsschäden', bereich: 'Stromerzeugung', prioritaet: 'Hoch' },
      { kategorie: 'Plane wasserdicht (4x6m)', pro_10k_einwohner: 20, einheit: 'Stück', begruendung: 'Provisorische Dachabdeckung bei Sturmschäden', bereich: 'Brandschutz Ausrüstung', prioritaet: 'Mittel' },
      { kategorie: 'Verlängerungskabel 25m', pro_10k_einwohner: 10, einheit: 'Stück', begruendung: 'Anschluss von Notstromaggregaten', bereich: 'Kabel & Verteilung', prioritaet: 'Hoch' },
      { kategorie: 'Warnwesten', pro_10k_einwohner: 200, einheit: 'Stück', begruendung: 'Sichtbarkeit der Einsatzkräfte', bereich: 'Schutzausrüstung', prioritaet: 'Hoch' },
      { kategorie: 'LED-Taschenlampe', pro_10k_einwohner: 50, einheit: 'Stück', begruendung: 'Beleuchtung bei Stromausfällen', bereich: 'Beleuchtung', prioritaet: 'Hoch' },
      { kategorie: 'Verkehrsleitkegel', pro_10k_einwohner: 500, einheit: 'Stück', begruendung: 'Absperrung gefährdeter Straßen', bereich: 'Verkehrslenkung', prioritaet: 'Hoch' },
      { kategorie: 'Brechstange', pro_10k_einwohner: 20, einheit: 'Stück', begruendung: 'Zugang zu beschädigten Gebäuden', bereich: 'Werkzeug', prioritaet: 'Hoch' },
      { kategorie: 'Greifzüge & Seilwinden', pro_10k_einwohner: 10, einheit: 'Stück', begruendung: 'Räumung schwerer Hindernisse', bereich: 'Werkzeug', prioritaet: 'Hoch' },
      { kategorie: 'Feldbetten (klappbar)', pro_10k_einwohner: 350, einheit: 'Stück', begruendung: 'Notunterkünfte bei unbewohnbaren Gebäuden', bereich: 'Unterkunft und Betreuung', prioritaet: 'Kritisch' },
    ],
    alarmkette: [
      { rolle: 'S3 – Einsatz', kontaktgruppen: ['Krisenstab', 'Feuerwehr'], kanaele: ['telefon', 'funk'], wartezeit_min: 0 },
      { rolle: 'S4 – Versorgung', kontaktgruppen: ['THW', 'Bauhof'], kanaele: ['telefon'], wartezeit_min: 5 },
      { rolle: 'S2 – Lage', kontaktgruppen: ['Krisenstab'], kanaele: ['telefon'], wartezeit_min: 5 },
      { rolle: 'S1 – Personal', kontaktgruppen: ['Krisenstab'], kanaele: ['telefon', 'email'], wartezeit_min: 10 },
      { rolle: 'S5 – Presse', kontaktgruppen: ['Medien'], kanaele: ['email', 'nina'], wartezeit_min: 30 },
    ],
  },

  // ─── 3. Extreme Hitzewelle ──────────────────────
  {
    title: 'Extreme Hitzewelle',
    type: 'Hitzewelle',
    severity: 55,
    description:
      'Langanhaltende Hitzeperiode mit Temperaturen über 38°C an mehreren aufeinanderfolgenden Tagen. Besondere Gefährdung vulnerabler Gruppen (Ältere, Kleinkinder, chronisch Kranke). Belastung von Gesundheitssystem, Wasserversorgung und Infrastruktur.',
    phases: [
      {
        name: 'Vorwarnung & Prävention (3–1 Tage vorher)',
        duration: '3–1 Tage',
        tasks: [
          'DWD-Hitzewarnungen auswerten und Hitzeaktionsplan aktivieren',
          'Bevölkerung über Verhaltensregeln informieren (Trinken, Schatten, Mittagshitze meiden)',
          'Kühle Aufenthaltsräume in öffentlichen Gebäuden einrichten',
          'Pflegeeinrichtungen und Krankenhäuser über erhöhte Belastung informieren',
          'Trinkwasserversorgung prüfen und Notvorräte sicherstellen',
        ],
      },
      {
        name: 'Akutphase (während der Hitzewelle)',
        duration: 'Tage bis Wochen',
        tasks: [
          'Tägliche Lagebewertung: Hitzetote, Krankenhauseinweisungen, Wasserverbrauch',
          'Mobile Trinkwasserausgabe an besonders betroffenen Standorten',
          'Kontrolle vulnerabler Personen organisieren (Nachbarschaftshilfe, Sozialamt)',
          'Waldbrandgefahr monitoren – Grillverbote und Waldsperrungen prüfen',
          'Arbeitszeitregelungen für Einsatzkräfte anpassen (Hitzeschutz)',
        ],
      },
      {
        name: 'Nachsorge',
        duration: '1–2 Wochen',
        tasks: [
          'Gesundheitliche Auswirkungen erfassen und dokumentieren',
          'Wasserversorgung normalisieren und Schäden an Infrastruktur bewerten',
          'Hitzeaktionsplan evaluieren und Verbesserungen dokumentieren',
          'Kommunikation: Entwarnung und Hinweise zur Erholung',
        ],
      },
    ],
    inventar: [
      { kategorie: 'Trinkwasser Flaschen', pro_10k_einwohner: 1000, einheit: 'Flaschen', begruendung: 'Mobile Trinkwasserausgabe an Hitze-Hotspots', bereich: 'Wasser und Trinkwasser', prioritaet: 'Kritisch' },
      { kategorie: 'Wasserkanister', pro_10k_einwohner: 50, einheit: 'Stück', begruendung: 'Transport und Lagerung Trinkwasser', bereich: 'Wasser und Trinkwasser', prioritaet: 'Kritisch' },
      { kategorie: 'Ventilatoren (mobil)', pro_10k_einwohner: 100, einheit: 'Stück', begruendung: 'Kühlung in Betreuungsstellen und Pflegeheimen', bereich: 'Unterkunft und Betreuung', prioritaet: 'Mittel' },
      { kategorie: 'Erste-Hilfe-Koffer', pro_10k_einwohner: 5, einheit: 'Stück', begruendung: 'Erstversorgung bei Hitzeschlag', bereich: 'Erste Hilfe', prioritaet: 'Kritisch' },
      { kategorie: 'Elektrolytpulver', pro_10k_einwohner: 2000, einheit: 'Stück', begruendung: 'Prävention von Elektrolytverlust', bereich: 'Erste Hilfe', prioritaet: 'Hoch' },
      { kategorie: 'Pavillons (3x3m, faltbar)', pro_10k_einwohner: 100, einheit: 'Stück', begruendung: 'Sonnenschutz an Ausgabestellen', bereich: 'Unterkunft und Betreuung', prioritaet: 'Mittel' },
      { kategorie: 'Informationsplakate', pro_10k_einwohner: 5000, einheit: 'Stück', begruendung: 'Verhaltenshinweise für Bevölkerung', bereich: 'Information', prioritaet: 'Hoch' },
    ],
    alarmkette: [
      { rolle: 'S2 – Lage', kontaktgruppen: ['Krisenstab', 'Gesundheitsamt'], kanaele: ['telefon', 'email'], wartezeit_min: 0 },
      { rolle: 'S4 – Versorgung', kontaktgruppen: ['Pflegeheime', 'Krankenhäuser'], kanaele: ['telefon', 'email'], wartezeit_min: 5 },
      { rolle: 'S5 – Presse', kontaktgruppen: ['Medien'], kanaele: ['email', 'nina'], wartezeit_min: 10 },
      { rolle: 'S1 – Personal', kontaktgruppen: ['Krisenstab'], kanaele: ['telefon'], wartezeit_min: 15 },
    ],
  },

  // ─── 4. Extreme Kältewelle ──────────────────────
  {
    title: 'Extreme Kältewelle',
    type: 'Kältewelle',
    severity: 55,
    description:
      'Anhaltende extreme Kälteperiode mit Temperaturen unter –15°C über mehrere Tage. Gefahr von Erfrierungen, eingefrorenen Wasserleitungen, Heizungsausfällen und Glatteis. Besondere Gefährdung obdachloser Menschen und älterer Alleinstehender.',
    phases: [
      {
        name: 'Vorwarnung & Vorbereitung (3–1 Tage vorher)',
        duration: '3–1 Tage',
        tasks: [
          'DWD-Kältewarnungen auswerten und Winterdienst verstärken',
          'Kältehilfe aktivieren: Notunterkünfte für Obdachlose öffnen',
          'Bevölkerung warnen: Frostschutz für Wasserleitungen, Heizung sichern',
          'Streusalz- und Räumkapazitäten prüfen und aufstocken',
          'KRITIS-Einrichtungen über mögliche Heizungs-/Wasserprobleme informieren',
        ],
      },
      {
        name: 'Akutphase (während der Kältewelle)',
        duration: 'Tage bis Wochen',
        tasks: [
          'Kältebusseinsätze koordinieren – Obdachlose aktiv aufsuchen',
          'Rohrbrüche und Heizungsausfälle melden und priorisiert beheben',
          'Notversorgung bei Heizungsausfall in Mehrfamilienhäusern und Pflegeheimen',
          'Straßen- und Gehwegräumung sicherstellen (Sturzprävention)',
          'Lagemeldungen: Kältetote, Infrastrukturschäden, Versorgungslage',
        ],
      },
      {
        name: 'Nachsorge',
        duration: '1–2 Wochen',
        tasks: [
          'Frostschäden an Infrastruktur (Straßen, Wasserleitungen) erfassen',
          'Gesundheitliche Folgen dokumentieren',
          'Kältehilfe-Maßnahmen evaluieren und verbessern',
          'Streusalzvorräte wieder auffüllen',
        ],
      },
    ],
    inventar: [
      { kategorie: 'Heizgeräte (mobil, Diesel/Gas)', pro_10k_einwohner: 100, einheit: 'Stück', begruendung: 'Notbeheizung von Unterkünften', bereich: 'Unterkunft und Betreuung', prioritaet: 'Hoch' },
      { kategorie: 'Heizstrahler (Gas, Katalytofen)', pro_10k_einwohner: 5, einheit: 'Stück', begruendung: 'Punktuelle Wärmeversorgung', bereich: 'Wärmeerzeugung', prioritaet: 'Hoch' },
      { kategorie: 'Decken (Wolldecke/Fleece)', pro_10k_einwohner: 7000, einheit: 'Stück', begruendung: 'Wärmeschutz für Obdachlose und Evakuierte (2 pro Person)', bereich: 'Unterkunft und Betreuung', prioritaet: 'Kritisch' },
      { kategorie: 'Feldbetten (klappbar)', pro_10k_einwohner: 350, einheit: 'Stück', begruendung: 'Notunterkünfte bei Heizungsausfällen', bereich: 'Unterkunft und Betreuung', prioritaet: 'Kritisch' },
      { kategorie: 'Schlafsäcke', pro_10k_einwohner: 350, einheit: 'Stück', begruendung: 'Übernachtung in Notunterkünften', bereich: 'Unterkunft und Betreuung', prioritaet: 'Kritisch' },
      { kategorie: 'Notstromaggregat 5-10 kVA', pro_10k_einwohner: 2, einheit: 'Stück', begruendung: 'Notstrom für Heizungsanlagen', bereich: 'Stromerzeugung', prioritaet: 'Hoch' },
      { kategorie: 'Diesel', pro_10k_einwohner: 3000, einheit: 'Liter', begruendung: 'Betrieb Notstromaggregate und Heizgeräte', bereich: 'Kraftstoff & Betriebsstoffe', prioritaet: 'Kritisch' },
      { kategorie: 'Notverpflegung (Langzeitlebensmittel)', pro_10k_einwohner: 2500, einheit: 'Stück', begruendung: 'Warme Mahlzeiten bei Versorgungsausfällen', bereich: 'Lebensmittel und Verpflegung', prioritaet: 'Kritisch' },
    ],
    alarmkette: [
      { rolle: 'S2 – Lage', kontaktgruppen: ['Krisenstab', 'Winterdienst'], kanaele: ['telefon'], wartezeit_min: 0 },
      { rolle: 'S4 – Versorgung', kontaktgruppen: ['Krisenstab', 'Pflegeheime'], kanaele: ['telefon', 'email'], wartezeit_min: 5 },
      { rolle: 'S3 – Einsatz', kontaktgruppen: ['Krisenstab', 'THW'], kanaele: ['telefon', 'funk'], wartezeit_min: 5 },
      { rolle: 'S5 – Presse', kontaktgruppen: ['Medien'], kanaele: ['email', 'nina'], wartezeit_min: 15 },
      { rolle: 'S1 – Personal', kontaktgruppen: ['Krisenstab'], kanaele: ['telefon'], wartezeit_min: 15 },
    ],
  },

  // ─── 5. Großflächiger Waldbrand ─────────────────
  {
    title: 'Großflächiger Waldbrand',
    type: 'Waldbrand',
    severity: 70,
    description:
      'Ausgedehnter Waldbrand durch Trockenheit und Wind. Bedrohung von Siedlungen am Waldrand, starke Rauchentwicklung, mögliche Evakuierungen. Erfordert massive Einsatzkräfte und Luftunterstützung.',
    phases: [
      {
        name: 'Erkennung & Erstbekämpfung (0–4 Stunden)',
        duration: '0–4 Stunden',
        tasks: [
          'Feuerwehr alarmieren und Brandausbreitung einschätzen',
          'Krisenstab einberufen – Lagebild mit Waldbrandindex und Windprognose',
          'Bevölkerung in Brandnähe warnen – Fenster schließen, Evakuierung vorbereiten',
          'Löschwasserversorgung sicherstellen (Hydranten, Zisternen, offene Gewässer)',
          'Unterstützung anfordern: Nachbar-Feuerwehren, THW, ggf. Bundeswehr-Hubschrauber',
        ],
      },
      {
        name: 'Großeinsatz & Evakuierung',
        duration: '4 Stunden – mehrere Tage',
        tasks: [
          'Evakuierung bedrohter Ortschaften und Gehöfte durchführen',
          'Betreuungsstellen für Evakuierte einrichten',
          'Brandschneisen und Riegelstellungen anlegen',
          'Rauchbelastung in umliegenden Siedlungen überwachen – Gesundheitswarnung',
          'Einsatzkräfte-Rotation organisieren (Regeneration, Verpflegung)',
        ],
      },
      {
        name: 'Nachlöscharbeiten & Wiederaufbau',
        duration: '1–4 Wochen',
        tasks: [
          'Glutnester systematisch ablöschen und Brandwache einrichten',
          'Gesperrte Gebiete schrittweise freigeben nach Gefahrenbewertung',
          'Umweltschäden erfassen (Bodenerosion, Gewässerbelastung)',
          'Wiederaufforstungsplanung mit Forstbehörden koordinieren',
          'Evaluation: Frühwarnsysteme und Waldbrandprävention verbessern',
        ],
      },
    ],
    inventar: [
      { kategorie: 'Schlauchleitung C-Schlauch (15m)', pro_10k_einwohner: 300, einheit: 'Meter', begruendung: 'Löschwasserversorgung im Gelände', bereich: 'Löschtechnik', prioritaet: 'Kritisch' },
      { kategorie: 'Löschwassertank mobil (5.000 L)', pro_10k_einwohner: 20, einheit: 'Stück', begruendung: 'Mobile Löschwasserversorgung', bereich: 'Löschtechnik', prioritaet: 'Kritisch' },
      { kategorie: 'Waldbrand-Rucksack', pro_10k_einwohner: 30, einheit: 'Stück', begruendung: 'Mobile Nachlöscharbeiten', bereich: 'Brandschutz Ausrüstung', prioritaet: 'Kritisch' },
      { kategorie: 'Waldbrand-Patsche verstärkt', pro_10k_einwohner: 75, einheit: 'Stück', begruendung: 'Manuelle Bekämpfung von Bodenbränden', bereich: 'Brandschutz Ausrüstung', prioritaet: 'Kritisch' },
      { kategorie: 'Wärmebildkamera', pro_10k_einwohner: 5, einheit: 'Stück', begruendung: 'Erkennung von Glutnestern', bereich: 'Brandschutz Ausrüstung', prioritaet: 'Kritisch' },
      { kategorie: 'Atemschutzgerät (Pressluftatmer)', pro_10k_einwohner: 50, einheit: 'Stück', begruendung: 'Atemschutz in Rauchzonen', bereich: 'Brandschutz Ausrüstung', prioritaet: 'Hoch' },
      { kategorie: 'Feuerwehrschutzanzug', pro_10k_einwohner: 150, einheit: 'Stück', begruendung: 'Schutzausrüstung für Einsatzkräfte', bereich: 'Löschtechnik', prioritaet: 'Kritisch' },
      { kategorie: 'Diesel', pro_10k_einwohner: 3000, einheit: 'Liter', begruendung: 'Betrieb von Löschfahrzeugen und Aggregaten', bereich: 'Kraftstoff & Betriebsstoffe', prioritaet: 'Kritisch' },
      { kategorie: 'Trinkwasserkanister', pro_10k_einwohner: 50, einheit: 'Stück', begruendung: 'Versorgung der Einsatzkräfte', bereich: 'Wasser und Trinkwasser', prioritaet: 'Kritisch' },
      { kategorie: 'Drohne mit Wärmebildkamera', pro_10k_einwohner: 2, einheit: 'Stück', begruendung: 'Großräumige Brandbeobachtung', bereich: 'Brandschutz Ausrüstung', prioritaet: 'Hoch' },
      { kategorie: 'Feldbetten (klappbar)', pro_10k_einwohner: 350, einheit: 'Stück', begruendung: 'Notunterkünfte für Evakuierte', bereich: 'Unterkunft und Betreuung', prioritaet: 'Kritisch' },
    ],
    alarmkette: [
      { rolle: 'S3 – Einsatz', kontaktgruppen: ['Feuerwehr', 'Krisenstab'], kanaele: ['telefon', 'funk'], wartezeit_min: 0 },
      { rolle: 'S2 – Lage', kontaktgruppen: ['Krisenstab', 'Forstamt'], kanaele: ['telefon'], wartezeit_min: 5 },
      { rolle: 'S4 – Versorgung', kontaktgruppen: ['THW', 'Bundeswehr'], kanaele: ['telefon', 'funk'], wartezeit_min: 10 },
      { rolle: 'S1 – Personal', kontaktgruppen: ['Krisenstab'], kanaele: ['telefon', 'email'], wartezeit_min: 10 },
      { rolle: 'S5 – Presse', kontaktgruppen: ['Medien'], kanaele: ['email', 'nina', 'sirene'], wartezeit_min: 15 },
      { rolle: 'S6 – IT/Kommunikation', kontaktgruppen: ['Krisenstab'], kanaele: ['telefon'], wartezeit_min: 10 },
    ],
  },

  // ═══════════════════════════════════════════════
  //  BEDROHUNGEN (8)
  // ═══════════════════════════════════════════════

  // ─── 6. Amoklauf / Bedrohungslage ──────────────
  {
    title: 'Amoklauf / Bedrohungslage',
    type: 'Amoklauf',
    severity: 85,
    description:
      'Amoklauf oder bewaffnete Bedrohungslage an einer Schule, öffentlichen Einrichtung oder im öffentlichen Raum. Erfordert sofortige polizeiliche Intervention und parallele Rettungsdienstkoordination. Massenanfall von Verletzten möglich.',
    phases: [
      {
        name: 'Sofortlage (0–2 Stunden)',
        duration: '0–2 Stunden',
        tasks: [
          'Polizeiliche Sofortmaßnahmen unterstützen – Gefahrenbereich weiträumig absperren',
          'MANV-Alarm (Massenanfall von Verletzten) auslösen',
          'Krisenstab einberufen – Lagebeurteilung mit Polizei abstimmen',
          'Bevölkerung warnen: Gefahrenbereich meiden, in Gebäuden bleiben',
          'Krankenhäuser alarmieren und Kapazitäten freischalten',
        ],
      },
      {
        name: 'Akutversorgung (2–24 Stunden)',
        duration: '2–24 Stunden',
        tasks: [
          'Verletztentransport und medizinische Versorgung koordinieren',
          'Betreuungsstelle für Unverletzte und Angehörige einrichten',
          'Psychosoziale Notfallversorgung (PSNV) aktivieren',
          'Bürgertelefon einrichten',
          'Medienarbeit koordinieren – eine Stimme sprechen',
        ],
      },
      {
        name: 'Nachsorge (Tage bis Monate)',
        duration: 'Tage bis Monate',
        tasks: [
          'Langfristige psychosoziale Betreuung für Betroffene und Angehörige',
          'Unterstützung der polizeilichen Ermittlungen',
          'Sicherheitskonzepte für betroffene Einrichtung überprüfen',
          'Gedenkveranstaltung organisieren',
          'Evaluation und Anpassung der Notfallpläne (Amok-Alarm)',
        ],
      },
    ],
    inventar: [
      { kategorie: 'MANV-Sets (Erstversorgung)', pro_10k_einwohner: 20, einheit: 'Satz', begruendung: 'Sofortversorgung bei Massenanfall von Verletzten', bereich: 'Erste Hilfe', prioritaet: 'Kritisch' },
      { kategorie: 'Tourniquets', pro_10k_einwohner: 100, einheit: 'Stück', begruendung: 'Stillung lebensbedrohlicher Blutungen', bereich: 'Erste Hilfe', prioritaet: 'Kritisch' },
      { kategorie: 'Erste-Hilfe-Koffer', pro_10k_einwohner: 5, einheit: 'Stück', begruendung: 'Erstversorgung am Einsatzort', bereich: 'Erste Hilfe', prioritaet: 'Kritisch' },
      { kategorie: 'Krankentrage', pro_10k_einwohner: 15, einheit: 'Stück', begruendung: 'Patiententransport aus dem Gefahrenbereich', bereich: 'Medizinische Hilfsmittel', prioritaet: 'Mittel' },
      { kategorie: 'Rettungsdecken', pro_10k_einwohner: 500, einheit: 'Stück', begruendung: 'Wärme- und Sichtschutz für Verletzte', bereich: 'Erste Hilfe', prioritaet: 'Hoch' },
      { kategorie: 'Megaphone', pro_10k_einwohner: 5, einheit: 'Stück', begruendung: 'Durchsagen zur Evakuierung', bereich: 'Kommunikation', prioritaet: 'Hoch' },
      { kategorie: 'Absperrband', pro_10k_einwohner: 50, einheit: 'Rollen', begruendung: 'Absperrung des Tatorts', bereich: 'Kennzeichnung', prioritaet: 'Hoch' },
      { kategorie: 'Warnwesten', pro_10k_einwohner: 200, einheit: 'Stück', begruendung: 'Kennzeichnung von Einsatzkräften', bereich: 'Schutzausrüstung', prioritaet: 'Hoch' },
    ],
    alarmkette: [
      { rolle: 'S3 – Einsatz', kontaktgruppen: ['Polizei', 'Rettungsdienst', 'Krisenstab'], kanaele: ['telefon', 'funk'], wartezeit_min: 0 },
      { rolle: 'S2 – Lage', kontaktgruppen: ['Krisenstab'], kanaele: ['telefon'], wartezeit_min: 0 },
      { rolle: 'S4 – Versorgung', kontaktgruppen: ['Krankenhäuser', 'PSNV'], kanaele: ['telefon'], wartezeit_min: 5 },
      { rolle: 'S1 – Personal', kontaktgruppen: ['Krisenstab'], kanaele: ['telefon'], wartezeit_min: 10 },
      { rolle: 'S5 – Presse', kontaktgruppen: ['Medien'], kanaele: ['telefon', 'email'], wartezeit_min: 15 },
      { rolle: 'S6 – IT/Kommunikation', kontaktgruppen: ['Krisenstab'], kanaele: ['telefon'], wartezeit_min: 5 },
    ],
  },

  // ─── 7. CBRN-Lage ──────────────────────────────
  {
    title: 'CBRN-Lage (Gefahrstofffreisetzung)',
    type: 'CBRN',
    severity: 80,
    description:
      'Freisetzung chemischer (C), biologischer (B), radiologischer (R) oder nuklearer (N) Gefahrstoffe durch Industrieunfall, Transportereignis oder vorsätzliche Handlung. Kontamination von Luft, Wasser und Boden möglich. Erfordert spezialisierte ABC-Einsatzkräfte.',
    phases: [
      {
        name: 'Erkennung & Erstmaßnahmen (0–2 Stunden)',
        duration: '0–2 Stunden',
        tasks: [
          'ABC-Erkundung durchführen – Gefahrstoff identifizieren und Ausbreitung einschätzen',
          'Gefahrenbereich (Absperrbereich, Warnzone) einrichten',
          'Bevölkerung warnen: Fenster und Türen schließen, im Gebäude bleiben',
          'Krisenstab einberufen – Zusammenarbeit mit Werkfeuerwehr/Betreiber',
          'Spezialkräfte anfordern (ABC-Zug, analytische Taskforce)',
        ],
      },
      {
        name: 'Schadensbegrenzung & Dekontamination',
        duration: '2–48 Stunden',
        tasks: [
          'Freisetzung stoppen oder eindämmen (Abriegelung, Neutralisation)',
          'Dekontaminationsstellen für Betroffene und Einsatzkräfte einrichten',
          'Evakuierung betroffener Gebiete bei Bedarf durchführen',
          'Umweltproben nehmen (Luft, Wasser, Boden) – Analyseergebnisse abwarten',
          'Gesundheitsamt einbinden: Expositionserfassung und medizinische Überwachung',
        ],
      },
      {
        name: 'Sanierung & Nachsorge',
        duration: 'Wochen bis Monate',
        tasks: [
          'Kontaminierte Flächen sanieren und Freimessungen durchführen',
          'Langzeitüberwachung betroffener Personen organisieren',
          'Trinkwasser- und Lebensmittelüberwachung verstärken',
          'Abfallentsorgung kontaminierter Materialien koordinieren',
          'Lessons Learned: CBRN-Schutzkonzept überprüfen und aktualisieren',
        ],
      },
    ],
    inventar: [
      { kategorie: 'Schutzanzüge (Einweg, Kategorie III)', pro_10k_einwohner: 5, einheit: 'Stück', begruendung: 'Schutz in kontaminierten Bereichen', bereich: 'Infektionsschutz', prioritaet: 'Kritisch' },
      { kategorie: 'Gaswarngeräte', pro_10k_einwohner: 100, einheit: 'Stück', begruendung: 'Detektion gefährlicher Gase', bereich: 'Messgeräte & Überwachung', prioritaet: 'Kritisch' },
      { kategorie: 'Strahlenmessgeräte', pro_10k_einwohner: 50, einheit: 'Stück', begruendung: 'Detektion radioaktiver Strahlung', bereich: 'Messgeräte & Überwachung', prioritaet: 'Kritisch' },
      { kategorie: 'Chemikalien-Testsets', pro_10k_einwohner: 50, einheit: 'Sets', begruendung: 'Identifikation von Gefahrstoffen', bereich: 'Messgeräte & Überwachung', prioritaet: 'Hoch' },
      { kategorie: 'FFP2-Masken', pro_10k_einwohner: 250, einheit: 'Stück', begruendung: 'Atemschutz für Bevölkerung', bereich: 'Infektionsschutz', prioritaet: 'Mittel' },
      { kategorie: 'Händedesinfektionsmittel', pro_10k_einwohner: 10, einheit: 'Flaschen', begruendung: 'Dekontamination von Personen', bereich: 'Desinfektion', prioritaet: 'Mittel' },
      { kategorie: 'Absperrband', pro_10k_einwohner: 50, einheit: 'Rollen', begruendung: 'Einrichtung von Sperrzonen', bereich: 'Kennzeichnung', prioritaet: 'Hoch' },
      { kategorie: 'Verkehrsleitkegel', pro_10k_einwohner: 500, einheit: 'Stück', begruendung: 'Absperrung kontaminierter Bereiche', bereich: 'Verkehrslenkung', prioritaet: 'Hoch' },
    ],
    alarmkette: [
      { rolle: 'S3 – Einsatz', kontaktgruppen: ['Feuerwehr', 'Krisenstab'], kanaele: ['telefon', 'funk'], wartezeit_min: 0 },
      { rolle: 'S2 – Lage', kontaktgruppen: ['Krisenstab', 'Gesundheitsamt'], kanaele: ['telefon'], wartezeit_min: 0 },
      { rolle: 'S4 – Versorgung', kontaktgruppen: ['THW', 'Krankenhäuser'], kanaele: ['telefon', 'funk'], wartezeit_min: 5 },
      { rolle: 'S5 – Presse', kontaktgruppen: ['Medien'], kanaele: ['email', 'nina', 'sirene'], wartezeit_min: 10 },
      { rolle: 'S1 – Personal', kontaktgruppen: ['Krisenstab'], kanaele: ['telefon'], wartezeit_min: 10 },
      { rolle: 'S6 – IT/Kommunikation', kontaktgruppen: ['Krisenstab'], kanaele: ['telefon'], wartezeit_min: 5 },
    ],
  },

  // ─── 8. Cyberangriff ────────────────────────────
  {
    title: 'Cyberangriff auf kommunale IT-Infrastruktur',
    type: 'Cyberangriff',
    severity: 70,
    description:
      'Ransomware-Angriff oder gezielte Cyber-Attacke auf die IT-Systeme der Kreisverwaltung und/oder kommunaler Betriebe. Ausfall von E-Government-Diensten, Kommunikationssystemen und möglicherweise KRITIS-Steuerungssystemen.',
    phases: [
      {
        name: 'Erkennung & Eindämmung (0–4 Stunden)',
        duration: '0–4 Stunden',
        tasks: [
          'Betroffene Systeme identifizieren und vom Netz isolieren',
          'IT-Notfallteam und BSI-Lagezentrum benachrichtigen',
          'Krisenstab einberufen – Entscheidung über Systemabschaltung',
          'Manuelle Notfallprozesse für kritische Verwaltungsaufgaben aktivieren',
          'Strafanzeige bei Polizei / LKA erstatten',
        ],
      },
      {
        name: 'Analyse & Schadensbegrenzung (4–48 Stunden)',
        duration: '4–48 Stunden',
        tasks: [
          'Forensische Analyse des Angriffsvektors (extern beauftragen)',
          'Backup-Integrität prüfen und Wiederherstellungsoptionen bewerten',
          'Alternative Kommunikationswege für Bürger einrichten (Telefon, Vor-Ort)',
          'Mitarbeiter über Verhaltensregeln informieren (keine privaten Geräte nutzen)',
          'Datenschutzbehörde informieren bei personenbezogenen Daten',
        ],
      },
      {
        name: 'Wiederherstellung (2–14 Tage)',
        duration: '2–14 Tage',
        tasks: [
          'Schrittweise Wiederherstellung der Systeme aus sauberen Backups',
          'Sicherheitsupdates und Patches einspielen',
          'Monitoring verstärken – Anomalieerkennung aktivieren',
          'Mitarbeiterschulungen zu IT-Sicherheit durchführen',
          'Incident-Report erstellen und Sicherheitskonzept überarbeiten',
        ],
      },
    ],
    inventar: [
      { kategorie: 'Offline-Backup-System (Air-Gap)', pro_10k_einwohner: 5, einheit: 'Stück', begruendung: 'Sichere Datensicherung ohne Netzwerkzugang', bereich: 'IT-Infrastruktur', prioritaet: 'Kritisch' },
      { kategorie: 'Externe Festplatten (offline)', pro_10k_einwohner: 10, einheit: 'TB', begruendung: 'Offline-Backups kritischer Daten', bereich: 'IT-Infrastruktur', prioritaet: 'Kritisch' },
      { kategorie: 'Notfall-Recovery-Kit', pro_10k_einwohner: 1, einheit: 'Set', begruendung: 'Wiederherstellung nach Cyberangriff', bereich: 'IT-Infrastruktur', prioritaet: 'Kritisch' },
      { kategorie: 'Forensik-Toolkit', pro_10k_einwohner: 3, einheit: 'Set', begruendung: 'Analyse des Angriffsvektors', bereich: 'IT-Infrastruktur', prioritaet: 'Kritisch' },
      { kategorie: 'Hardware-Firewall (Isolation)', pro_10k_einwohner: 5, einheit: 'Stück', begruendung: 'Isolation kompromittierter Netzwerksegmente', bereich: 'IT-Infrastruktur', prioritaet: 'Kritisch' },
      { kategorie: 'Notfall-Laptops (offline)', pro_10k_einwohner: 10, einheit: 'Stück', begruendung: 'Weiterarbeit bei IT-Ausfall', bereich: 'IT-Infrastruktur', prioritaet: 'Kritisch' },
      { kategorie: 'Verwaltungsformulare (Vordrucke)', pro_10k_einwohner: 10000, einheit: 'Stück', begruendung: 'Papierbasierte Verwaltung als Notfallbetrieb', bereich: 'Papierbasierte Systeme', prioritaet: 'Kritisch' },
      { kategorie: 'Kontaktlisten (Papier)', pro_10k_einwohner: 50, einheit: 'Stück', begruendung: 'Offline-Erreichbarkeit aller Kontakte', bereich: 'Papierbasierte Systeme', prioritaet: 'Kritisch' },
      { kategorie: 'BOS-Funkgeräte', pro_10k_einwohner: 5, einheit: 'Stück', begruendung: 'Kommunikation bei IT-Totalausfall', bereich: 'Kommunikation', prioritaet: 'Kritisch' },
      { kategorie: 'Satellitentelefone', pro_10k_einwohner: 3, einheit: 'Stück', begruendung: 'Kommunikation bei Netzwerkausfall', bereich: 'Kommunikation', prioritaet: 'Kritisch' },
    ],
    alarmkette: [
      { rolle: 'S6 – IT/Kommunikation', kontaktgruppen: ['Krisenstab', 'IT-Abteilung'], kanaele: ['telefon'], wartezeit_min: 0 },
      { rolle: 'S3 – Einsatz', kontaktgruppen: ['Krisenstab'], kanaele: ['telefon'], wartezeit_min: 5 },
      { rolle: 'S2 – Lage', kontaktgruppen: ['Krisenstab', 'BSI'], kanaele: ['telefon', 'email'], wartezeit_min: 5 },
      { rolle: 'S1 – Personal', kontaktgruppen: ['Krisenstab'], kanaele: ['telefon'], wartezeit_min: 15 },
      { rolle: 'S5 – Presse', kontaktgruppen: ['Medien'], kanaele: ['email'], wartezeit_min: 30 },
    ],
  },

  // ─── 9. Krieg ───────────────────────────────────
  {
    title: 'Spannungs- / Verteidigungsfall',
    type: 'Krieg',
    severity: 90,
    description:
      'Eskalation eines bewaffneten Konflikts mit direkten oder indirekten Auswirkungen auf den Landkreis. Mögliche Szenarien: Raketenangriffe, Flüchtlingsströme, Versorgungsengpässe, Mobilmachung. Erfordert Umsetzung der Zivilschutzplanung gemäß ZSKG.',
    phases: [
      {
        name: 'Alarmierung & Grundschutz (0–24 Stunden)',
        duration: '0–24 Stunden',
        tasks: [
          'Zivilschutzsirenen auslösen – Bevölkerung warnen',
          'Krisenstab in Vollfunktion aktivieren',
          'Schutzräume und Kellerräume für Bevölkerung identifizieren und öffnen',
          'KRITIS-Einrichtungen in erhöhte Sicherheitsstufe versetzen',
          'Abstimmung mit Bundeswehr und Katastrophenschutzbehörden',
        ],
      },
      {
        name: 'Versorgung & Evakuierung',
        duration: 'Tage bis Wochen',
        tasks: [
          'Lebensmittel- und Trinkwasserversorgung sicherstellen',
          'Evakuierungspläne bei Bedarf umsetzen',
          'Aufnahme und Versorgung von Binnenflüchtlingen/Vertriebenen',
          'Medizinische Notversorgung dezentral organisieren',
          'Kommunikation über Notfunkkanäle aufrechterhalten',
        ],
      },
      {
        name: 'Durchhaltevermögen (langfristig)',
        duration: 'Langfristig',
        tasks: [
          'Rationierung von Versorgungsgütern koordinieren',
          'Psychosoziale Betreuung für Bevölkerung und Einsatzkräfte',
          'Zusammenarbeit mit militärischen Stellen verstetigen',
          'Kontinuierliche Lagebeurteilung und Anpassung der Maßnahmen',
          'Dokumentation für spätere Aufarbeitung',
        ],
      },
    ],
    inventar: [
      { kategorie: 'Feldbetten (klappbar)', pro_10k_einwohner: 3500, einheit: 'Stück', begruendung: 'Notunterkünfte für Binnenflüchtlinge (10% der Bevölkerung)', bereich: 'Unterkunft und Betreuung', prioritaet: 'Kritisch' },
      { kategorie: 'Schlafsäcke', pro_10k_einwohner: 3500, einheit: 'Stück', begruendung: 'Übernachtung Evakuierte', bereich: 'Unterkunft und Betreuung', prioritaet: 'Kritisch' },
      { kategorie: 'Decken (Wolldecke/Fleece)', pro_10k_einwohner: 7000, einheit: 'Stück', begruendung: 'Wärmeschutz (2 pro Person)', bereich: 'Unterkunft und Betreuung', prioritaet: 'Kritisch' },
      { kategorie: 'Notverpflegung (Langzeitlebensmittel)', pro_10k_einwohner: 2500, einheit: 'Stück', begruendung: 'Grundversorgung bei Zusammenbruch der Lieferketten', bereich: 'Lebensmittel und Verpflegung', prioritaet: 'Kritisch' },
      { kategorie: 'Trinkwasser Flaschen', pro_10k_einwohner: 1000, einheit: 'Flaschen', begruendung: 'Trinkwasserversorgung 3 Tage', bereich: 'Wasser und Trinkwasser', prioritaet: 'Kritisch' },
      { kategorie: 'Notstromaggregat 5-10 kVA', pro_10k_einwohner: 2, einheit: 'Stück', begruendung: 'Aufrechterhaltung kritischer Infrastruktur', bereich: 'Stromerzeugung', prioritaet: 'Hoch' },
      { kategorie: 'Diesel', pro_10k_einwohner: 3000, einheit: 'Liter', begruendung: 'Betrieb Notstromaggregate (72h)', bereich: 'Kraftstoff & Betriebsstoffe', prioritaet: 'Kritisch' },
      { kategorie: 'Erste-Hilfe-Koffer', pro_10k_einwohner: 5, einheit: 'Stück', begruendung: 'Dezentrale medizinische Erstversorgung', bereich: 'Erste Hilfe', prioritaet: 'Kritisch' },
      { kategorie: 'BOS-Funkgeräte', pro_10k_einwohner: 5, einheit: 'Stück', begruendung: 'Kommunikation bei Ausfall ziviler Netze', bereich: 'Kommunikation', prioritaet: 'Kritisch' },
      { kategorie: 'Sirenenanlagen', pro_10k_einwohner: 5, einheit: 'Stück', begruendung: 'Zivilschutzwarnung der Bevölkerung', bereich: 'Kommunikation', prioritaet: 'Kritisch' },
      { kategorie: 'Zelte (Großraumzelt 50 Personen)', pro_10k_einwohner: 70, einheit: 'Stück', begruendung: 'Notunterkünfte und Versammlungsräume', bereich: 'Unterkunft und Betreuung', prioritaet: 'Hoch' },
    ],
    alarmkette: [
      { rolle: 'S3 – Einsatz', kontaktgruppen: ['Krisenstab', 'Bundeswehr'], kanaele: ['telefon', 'funk', 'sirene'], wartezeit_min: 0 },
      { rolle: 'S2 – Lage', kontaktgruppen: ['Krisenstab'], kanaele: ['telefon', 'funk'], wartezeit_min: 0 },
      { rolle: 'S4 – Versorgung', kontaktgruppen: ['THW', 'Bundeswehr'], kanaele: ['telefon', 'funk'], wartezeit_min: 5 },
      { rolle: 'S1 – Personal', kontaktgruppen: ['Krisenstab'], kanaele: ['telefon', 'funk'], wartezeit_min: 5 },
      { rolle: 'S6 – IT/Kommunikation', kontaktgruppen: ['Krisenstab'], kanaele: ['telefon', 'funk'], wartezeit_min: 5 },
      { rolle: 'S5 – Presse', kontaktgruppen: ['Medien'], kanaele: ['nina', 'sirene', 'email'], wartezeit_min: 10 },
    ],
  },

  // ─── 10. Pandemie ───────────────────────────────
  {
    title: 'Pandemie / Massenerkrankung',
    type: 'Pandemie',
    severity: 70,
    description:
      'Ausbreitung einer hochansteckenden Infektionskrankheit mit erheblichen Auswirkungen auf die Gesundheitsversorgung, öffentliches Leben und Wirtschaft. Erfordert langfristige Koordination zwischen Gesundheitsamt, Krankenhäusern und Landesbehörden.',
    phases: [
      {
        name: 'Frühwarnung & Vorbereitung',
        duration: '1–2 Wochen',
        tasks: [
          'Gesundheitsamt verstärken – Surveillance und Kontaktverfolgung aufbauen',
          'Pandemiepläne aktivieren und Material prüfen (PSA, Tests, Medikamente)',
          'Kommunikationsstrategie für Bevölkerung entwickeln',
          'Abstimmung mit Krankenhäusern zur Kapazitätsplanung',
          'Koordination mit RKI und Landesgesundheitsbehörde',
        ],
      },
      {
        name: 'Ausbreitungsphase',
        duration: 'Wochen bis Monate',
        tasks: [
          'Kontaktverfolgung und Quarantänemaßnahmen koordinieren',
          'Impf- und Testzentren einrichten und betreiben',
          'Sicherstellung der Versorgung vulnerabler Gruppen',
          'Personalausfälle in kritischen Bereichen kompensieren',
          'Regelmäßige Bevölkerungsinformation und Aufklärung',
        ],
      },
      {
        name: 'Stabilisierung & Rückkehr',
        duration: 'Monate',
        tasks: [
          'Schrittweise Lockerung von Schutzmaßnahmen nach Lagebewertung',
          'Psychosoziale Nachsorge für Bevölkerung und Einsatzkräfte',
          'Evaluation der Maßnahmen und Aktualisierung des Pandemieplans',
          'Bevorratung von PSA und Medikamenten für zukünftige Ereignisse',
        ],
      },
    ],
    inventar: [
      { kategorie: 'FFP2-Masken', pro_10k_einwohner: 250, einheit: 'Stück', begruendung: 'Atemschutz für Bevölkerung und Einsatzkräfte', bereich: 'Infektionsschutz', prioritaet: 'Mittel' },
      { kategorie: 'Mund-Nasen-Schutz', pro_10k_einwohner: 250, einheit: 'Stück', begruendung: 'Basisschutz in öffentlichen Einrichtungen', bereich: 'Infektionsschutz', prioritaet: 'Mittel' },
      { kategorie: 'Schutzhandschuhe Nitril', pro_10k_einwohner: 50, einheit: 'Packungen', begruendung: 'Hygieneschutz für medizinisches Personal', bereich: 'Infektionsschutz', prioritaet: 'Mittel' },
      { kategorie: 'Schutzkittel', pro_10k_einwohner: 100, einheit: 'Stück', begruendung: 'Körperschutz in Behandlungszentren', bereich: 'Infektionsschutz', prioritaet: 'Mittel' },
      { kategorie: 'Händedesinfektionsmittel', pro_10k_einwohner: 10, einheit: 'Flaschen', begruendung: 'Händehygiene in öffentlichen Einrichtungen', bereich: 'Desinfektion', prioritaet: 'Mittel' },
      { kategorie: 'Händedesinfektionsmittel (5L Kanister)', pro_10k_einwohner: 5, einheit: 'Kanister', begruendung: 'Großmengen für Impf- und Testzentren', bereich: 'Desinfektion', prioritaet: 'Mittel' },
      { kategorie: 'Flächendesinfektionsmittel (1L)', pro_10k_einwohner: 15, einheit: 'Flaschen', begruendung: 'Reinigung von Oberflächen', bereich: 'Desinfektion', prioritaet: 'Mittel' },
      { kategorie: 'Fieberthermometer', pro_10k_einwohner: 10, einheit: 'Stück', begruendung: 'Screening an Eingängen von Einrichtungen', bereich: 'Medizinische Instrumente', prioritaet: 'Mittel' },
      { kategorie: 'Schutzanzüge (Einweg, Kategorie III)', pro_10k_einwohner: 5, einheit: 'Stück', begruendung: 'Vollständiger Körperschutz', bereich: 'Infektionsschutz', prioritaet: 'Mittel' },
      { kategorie: 'Infektiöse Abfallsäcke', pro_10k_einwohner: 50, einheit: 'Stück', begruendung: 'Sichere Entsorgung kontaminierter Materialien', bereich: 'Infektionsschutz', prioritaet: 'Mittel' },
      { kategorie: 'Abwurfbehälter für Kanülen/Spritzen', pro_10k_einwohner: 10, einheit: 'Stück', begruendung: 'Sichere Entsorgung medizinischer Abfälle', bereich: 'Infektionsschutz', prioritaet: 'Mittel' },
    ],
    alarmkette: [
      { rolle: 'S2 – Lage', kontaktgruppen: ['Gesundheitsamt', 'Krisenstab'], kanaele: ['telefon', 'email'], wartezeit_min: 0 },
      { rolle: 'S4 – Versorgung', kontaktgruppen: ['Krankenhäuser', 'Krisenstab'], kanaele: ['telefon', 'email'], wartezeit_min: 10 },
      { rolle: 'S3 – Einsatz', kontaktgruppen: ['Krisenstab'], kanaele: ['telefon'], wartezeit_min: 15 },
      { rolle: 'S5 – Presse', kontaktgruppen: ['Medien', 'RKI'], kanaele: ['email', 'nina'], wartezeit_min: 30 },
      { rolle: 'S1 – Personal', kontaktgruppen: ['Krisenstab'], kanaele: ['telefon', 'email'], wartezeit_min: 30 },
    ],
  },

  // ─── 11. Sabotage ───────────────────────────────
  {
    title: 'Sabotage kritischer Infrastruktur',
    type: 'Sabotage',
    severity: 80,
    description:
      'Gezielte physische Sabotage an kritischer Infrastruktur (Stromversorgung, Wasserversorgung, Telekommunikation, Verkehrswege). Erfordert enge Zusammenarbeit mit Polizei und Verfassungsschutz.',
    phases: [
      {
        name: 'Sofortreaktion (0–2 Stunden)',
        duration: '0–2 Stunden',
        tasks: [
          'Polizei und Verfassungsschutz informieren – Tatort sichern',
          'Krisenstab einberufen – Sicherheitslage bewerten',
          'Betroffene Infrastruktur identifizieren und Ausfallwirkung analysieren',
          'Bevölkerungswarnung herausgeben wenn öffentliche Gefährdung besteht',
          'Objektschutz für weitere KRITIS-Standorte verstärken',
        ],
      },
      {
        name: 'Schadensbewältigung (2–48 Stunden)',
        duration: '2–48 Stunden',
        tasks: [
          'Ersatzversorgung für betroffene Infrastruktur einrichten',
          'Koordination mit Betreibern der beschädigten Anlagen',
          'Regelmäßige Lagebesprechungen mit Sicherheitsbehörden',
          'Weitere Gefährdungsanalyse – Folgesabotage ausschließen',
          'Bevölkerung über Versorgungslage informieren',
        ],
      },
      {
        name: 'Wiederaufbau & Prävention',
        duration: '1–4 Wochen',
        tasks: [
          'Reparatur und Wiederherstellung der beschädigten Infrastruktur',
          'Sicherheitskonzepte für KRITIS-Objekte überprüfen und verschärfen',
          'Zugangskontrollsysteme und Überwachung verbessern',
          'Zusammenarbeit mit Sicherheitsbehörden verstetigen',
          'Notfallpläne um Sabotage-Szenarien ergänzen',
        ],
      },
    ],
    inventar: [
      { kategorie: 'Notstromaggregat 5-10 kVA', pro_10k_einwohner: 2, einheit: 'Stück', begruendung: 'Notversorgung bei Ausfall sabotierter Infrastruktur', bereich: 'Stromerzeugung', prioritaet: 'Hoch' },
      { kategorie: 'Notstromaggregat 20-50 kVA', pro_10k_einwohner: 1, einheit: 'Stück', begruendung: 'Großverbraucher-Notstrom', bereich: 'Stromerzeugung', prioritaet: 'Hoch' },
      { kategorie: 'BOS-Funkgeräte', pro_10k_einwohner: 5, einheit: 'Stück', begruendung: 'Sichere Kommunikation bei Telekommunikationsausfall', bereich: 'Kommunikation', prioritaet: 'Kritisch' },
      { kategorie: 'Absperrband', pro_10k_einwohner: 50, einheit: 'Rollen', begruendung: 'Absperrung sabotierter Standorte', bereich: 'Kennzeichnung', prioritaet: 'Hoch' },
      { kategorie: 'Warnwesten', pro_10k_einwohner: 200, einheit: 'Stück', begruendung: 'Kennzeichnung von Sicherheitskräften', bereich: 'Schutzausrüstung', prioritaet: 'Hoch' },
      { kategorie: 'LED-Flutlichtstrahler 50W', pro_10k_einwohner: 10, einheit: 'Stück', begruendung: 'Ausleuchtung bei Stromausfällen an KRITIS', bereich: 'Beleuchtung', prioritaet: 'Kritisch' },
      { kategorie: 'Diesel', pro_10k_einwohner: 3000, einheit: 'Liter', begruendung: 'Treibstoff für Notstromaggregate', bereich: 'Kraftstoff & Betriebsstoffe', prioritaet: 'Kritisch' },
      { kategorie: 'Kraftstoffkanister (20L)', pro_10k_einwohner: 200, einheit: 'Stück', begruendung: 'Transport und Lagerung Kraftstoff', bereich: 'Kraftstoff & Betriebsstoffe', prioritaet: 'Mittel' },
    ],
    alarmkette: [
      { rolle: 'S3 – Einsatz', kontaktgruppen: ['Polizei', 'Krisenstab'], kanaele: ['telefon', 'funk'], wartezeit_min: 0 },
      { rolle: 'S2 – Lage', kontaktgruppen: ['Krisenstab', 'Verfassungsschutz'], kanaele: ['telefon'], wartezeit_min: 0 },
      { rolle: 'S4 – Versorgung', kontaktgruppen: ['Netzbetreiber', 'THW'], kanaele: ['telefon'], wartezeit_min: 5 },
      { rolle: 'S6 – IT/Kommunikation', kontaktgruppen: ['Krisenstab'], kanaele: ['telefon', 'funk'], wartezeit_min: 5 },
      { rolle: 'S1 – Personal', kontaktgruppen: ['Krisenstab'], kanaele: ['telefon'], wartezeit_min: 10 },
      { rolle: 'S5 – Presse', kontaktgruppen: ['Medien'], kanaele: ['email', 'nina'], wartezeit_min: 20 },
    ],
  },

  // ─── 12. Stromausfall ───────────────────────────
  {
    title: 'Großflächiger Stromausfall (Blackout)',
    type: 'Stromausfall',
    severity: 75,
    description:
      'Langanhaltender, großflächiger Stromausfall über mehrere Stunden bis Tage. Betrifft alle KRITIS-Sektoren, insbesondere Gesundheitsversorgung, Wasserversorgung und Kommunikation. Erfordert sofortige Aktivierung des Krisenstabes und Koordination mit Netzbetreibern.',
    phases: [
      {
        name: 'Sofortmaßnahmen (0–2 Stunden)',
        duration: '0–2 Stunden',
        tasks: [
          'Krisenstab einberufen und Lagebeurteilung durchführen',
          'Notstromversorgung für KRITIS-Einrichtungen prüfen (Krankenhäuser, Wasserwerke, Leitstellen)',
          'Kontakt zu Netzbetreiber aufnehmen – Ursache und voraussichtliche Dauer klären',
          'Bevölkerung über Sirenen, Lautsprecherdurchsagen und Social Media informieren',
          'Tankstellen und Lebensmittelversorgung koordinieren',
        ],
      },
      {
        name: 'Stabilisierungsphase (2–12 Stunden)',
        duration: '2–12 Stunden',
        tasks: [
          'Mobile Notstromaggregate an kritische Standorte verteilen',
          'Wärmehallen / Betreuungsstellen für vulnerable Gruppen einrichten',
          'Trinkwasserversorgung sicherstellen (mobile Ausgabestellen)',
          'Einsatzkräfte (THW, Feuerwehr) für Türöffnungen koordinieren (Aufzüge, Pflegeheime)',
          'Lageberichte im 2-Stunden-Takt erstellen',
        ],
      },
      {
        name: 'Durchhaltephase (12–72 Stunden)',
        duration: '12–72 Stunden',
        tasks: [
          'Versorgungslage kontinuierlich bewerten (Treibstoff, Lebensmittel, Medikamente)',
          'Evakuierung von Pflegeeinrichtungen bei Bedarf vorbereiten',
          'Sicherheitslage überwachen (Plünderungen, Verkehrsunfälle)',
          'Koordination mit Nachbarkreisen und Landesbehörden',
          'Regelmäßige Bürgerinformation über alle verfügbaren Kanäle',
        ],
      },
      {
        name: 'Wiederherstellung',
        duration: 'Ab Stromrückkehr',
        tasks: [
          'Schrittweise Rückführung in den Normalbetrieb',
          'Schäden erfassen und dokumentieren',
          'Nachbesprechung mit allen beteiligten Organisationen',
          'Maßnahmenplan aktualisieren und Lessons Learned dokumentieren',
        ],
      },
    ],
    inventar: [
      { kategorie: 'Notstromaggregat 5-10 kVA', pro_10k_einwohner: 2, einheit: 'Stück', begruendung: 'Grundversorgung kritischer Einrichtungen', bereich: 'Stromerzeugung', prioritaet: 'Hoch' },
      { kategorie: 'Notstromaggregat 20-50 kVA', pro_10k_einwohner: 1, einheit: 'Stück', begruendung: 'Versorgung Krankenhäuser und Wasserwerke', bereich: 'Stromerzeugung', prioritaet: 'Hoch' },
      { kategorie: 'Diesel', pro_10k_einwohner: 3000, einheit: 'Liter', begruendung: 'Betrieb Notstromaggregate (72h)', bereich: 'Kraftstoff & Betriebsstoffe', prioritaet: 'Kritisch' },
      { kategorie: 'Kraftstoffkanister (20L)', pro_10k_einwohner: 200, einheit: 'Stück', begruendung: 'Transport Kraftstoff zu dezentralen Standorten', bereich: 'Kraftstoff & Betriebsstoffe', prioritaet: 'Mittel' },
      { kategorie: 'LED-Taschenlampe', pro_10k_einwohner: 50, einheit: 'Stück', begruendung: 'Beleuchtung für Einsatzkräfte', bereich: 'Beleuchtung', prioritaet: 'Hoch' },
      { kategorie: 'LED-Flutlichtstrahler 50W', pro_10k_einwohner: 10, einheit: 'Stück', begruendung: 'Ausleuchtung Betreuungsstellen', bereich: 'Beleuchtung', prioritaet: 'Kritisch' },
      { kategorie: 'Batterien Mignon AA', pro_10k_einwohner: 500, einheit: 'Stück', begruendung: 'Betrieb von Radios und Taschenlampen', bereich: 'Batterien & Akkus', prioritaet: 'Hoch' },
      { kategorie: 'Powerbank 20.000 mAh', pro_10k_einwohner: 20, einheit: 'Stück', begruendung: 'Laden von Smartphones und Funkgeräten', bereich: 'Batterien & Akkus', prioritaet: 'Hoch' },
      { kategorie: 'Kurbelradios', pro_10k_einwohner: 1, einheit: 'Stück', begruendung: 'Empfang von Behördeninformationen', bereich: 'Kommunikation', prioritaet: 'Hoch' },
      { kategorie: 'Satellitentelefone', pro_10k_einwohner: 3, einheit: 'Stück', begruendung: 'Kommunikation bei Totalausfall', bereich: 'Kommunikation', prioritaet: 'Kritisch' },
      { kategorie: 'Trinkwasser Flaschen', pro_10k_einwohner: 1000, einheit: 'Flaschen', begruendung: 'Trinkwasserversorgung bei Ausfall der Wasserwerke', bereich: 'Wasser und Trinkwasser', prioritaet: 'Kritisch' },
      { kategorie: 'Feldbetten (klappbar)', pro_10k_einwohner: 350, einheit: 'Stück', begruendung: 'Wärmehallen und Betreuungsstellen', bereich: 'Unterkunft und Betreuung', prioritaet: 'Kritisch' },
    ],
    alarmkette: [
      { rolle: 'S3 – Einsatz', kontaktgruppen: ['Krisenstab', 'Feuerwehr'], kanaele: ['telefon', 'funk'], wartezeit_min: 0 },
      { rolle: 'S4 – Versorgung', kontaktgruppen: ['THW', 'Netzbetreiber'], kanaele: ['telefon', 'email'], wartezeit_min: 5 },
      { rolle: 'S2 – Lage', kontaktgruppen: ['Krisenstab'], kanaele: ['telefon'], wartezeit_min: 5 },
      { rolle: 'S6 – IT/Kommunikation', kontaktgruppen: ['Krisenstab'], kanaele: ['telefon', 'funk'], wartezeit_min: 5 },
      { rolle: 'S1 – Personal', kontaktgruppen: ['Krisenstab'], kanaele: ['telefon', 'email'], wartezeit_min: 10 },
      { rolle: 'S5 – Presse', kontaktgruppen: ['Medien'], kanaele: ['email', 'nina', 'sirene'], wartezeit_min: 15 },
    ],
  },

  // ─── 13. Terroranschlag ─────────────────────────
  {
    title: 'Terroranschlag',
    type: 'Terroranschlag',
    severity: 85,
    description:
      'Terroristischer Anschlag im Landkreis. Kann verschiedene Angriffsformen umfassen: Fahrzeug, Waffen, Sprengstoff, CBRN-Stoffe. Erfordert sofortige polizeiliche Maßnahmen und parallele Rettungsdienstkoordination.',
    phases: [
      {
        name: 'Sofortlage (0–2 Stunden)',
        duration: '0–2 Stunden',
        tasks: [
          'Polizeiliche Sofortmaßnahmen unterstützen – Gefahrenbereich absperren',
          'MANV-Alarm (Massenanfall von Verletzten) auslösen',
          'Krisenstab einberufen – Lagebeurteilung mit Polizei',
          'Bevölkerung warnen – Gefahrenbereich meiden',
          'Krankenhäuser alarmieren und Kapazitäten freischalten',
        ],
      },
      {
        name: 'Akutversorgung (2–24 Stunden)',
        duration: '2–24 Stunden',
        tasks: [
          'Verletztentransport und medizinische Versorgung koordinieren',
          'Betreuungsstelle für Unverletzte und Angehörige einrichten',
          'Psychosoziale Notfallversorgung (PSNV) aktivieren',
          'Bürgertelefon einrichten',
          'Medienarbeit koordinieren – eine Stimme sprechen',
        ],
      },
      {
        name: 'Nachsorge (Tage bis Monate)',
        duration: 'Tage bis Monate',
        tasks: [
          'Langfristige psychosoziale Betreuung für Betroffene sicherstellen',
          'Unterstützung der polizeilichen Ermittlungen',
          'Sicherheitskonzepte für öffentliche Veranstaltungen überprüfen',
          'Gedenkveranstaltung organisieren',
          'Evaluation und Anpassung der Notfallpläne',
        ],
      },
    ],
    inventar: [
      { kategorie: 'MANV-Sets (Erstversorgung)', pro_10k_einwohner: 25, einheit: 'Satz', begruendung: 'Sofortversorgung bei Massenanfall von Verletzten', bereich: 'Erste Hilfe', prioritaet: 'Kritisch' },
      { kategorie: 'Tourniquets', pro_10k_einwohner: 150, einheit: 'Stück', begruendung: 'Stillung lebensbedrohlicher Blutungen', bereich: 'Erste Hilfe', prioritaet: 'Kritisch' },
      { kategorie: 'Erste-Hilfe-Koffer', pro_10k_einwohner: 5, einheit: 'Stück', begruendung: 'Erstversorgung am Einsatzort', bereich: 'Erste Hilfe', prioritaet: 'Kritisch' },
      { kategorie: 'Beatmungsmasken', pro_10k_einwohner: 250, einheit: 'Stück', begruendung: 'Atemwegsmanagement bei Verletzten', bereich: 'Erste Hilfe', prioritaet: 'Hoch' },
      { kategorie: 'Krankentrage', pro_10k_einwohner: 15, einheit: 'Stück', begruendung: 'Patiententransport aus der Gefahrenzone', bereich: 'Medizinische Hilfsmittel', prioritaet: 'Mittel' },
      { kategorie: 'Rettungsdecken', pro_10k_einwohner: 500, einheit: 'Stück', begruendung: 'Wärme- und Sichtschutz', bereich: 'Erste Hilfe', prioritaet: 'Hoch' },
      { kategorie: 'Megaphone', pro_10k_einwohner: 5, einheit: 'Stück', begruendung: 'Lautsprecherdurchsagen zur Evakuierung', bereich: 'Kommunikation', prioritaet: 'Hoch' },
      { kategorie: 'Absperrband', pro_10k_einwohner: 100, einheit: 'Rollen', begruendung: 'Weiträumige Absperrung des Gefahrenbereichs', bereich: 'Kennzeichnung', prioritaet: 'Hoch' },
      { kategorie: 'Warnwesten', pro_10k_einwohner: 200, einheit: 'Stück', begruendung: 'Kennzeichnung aller Einsatzkräfte', bereich: 'Schutzausrüstung', prioritaet: 'Hoch' },
    ],
    alarmkette: [
      { rolle: 'S3 – Einsatz', kontaktgruppen: ['Polizei', 'Rettungsdienst', 'Krisenstab'], kanaele: ['telefon', 'funk'], wartezeit_min: 0 },
      { rolle: 'S2 – Lage', kontaktgruppen: ['Krisenstab'], kanaele: ['telefon'], wartezeit_min: 0 },
      { rolle: 'S4 – Versorgung', kontaktgruppen: ['Krankenhäuser', 'PSNV'], kanaele: ['telefon'], wartezeit_min: 5 },
      { rolle: 'S6 – IT/Kommunikation', kontaktgruppen: ['Krisenstab'], kanaele: ['telefon'], wartezeit_min: 5 },
      { rolle: 'S1 – Personal', kontaktgruppen: ['Krisenstab'], kanaele: ['telefon'], wartezeit_min: 10 },
      { rolle: 'S5 – Presse', kontaktgruppen: ['Medien'], kanaele: ['telefon', 'email'], wartezeit_min: 15 },
    ],
  },

  // ═══════════════════════════════════════════════
  //  BUSINESS SZENARIEN (7) – fuer Unternehmen/BCM
  // ═══════════════════════════════════════════════

  // ─── 14. Ransomware-Angriff ──────────────────
  {
    title: 'Ransomware-Angriff',
    type: 'Ransomware',
    severity: 80,
    description: 'Verschluesselung kritischer IT-Systeme durch Schadsoftware. Erpressung, Datenverlust, Betriebsunterbrechung. Meldepflicht nach NIS2 §32 (24h Erstmeldung).',
    phases: [
      { name: 'Erkennung & Eindaemmung', duration: '0–4 Stunden', tasks: ['Betroffene Systeme identifizieren', 'Netzwerksegmente isolieren', 'CERT/BSI informieren (24h-Meldepflicht)', 'Forensische Sicherung starten'] },
      { name: 'Analyse & Bewertung', duration: '4–24 Stunden', tasks: ['Angriffsvektor ermitteln', 'Schadensausmass bewerten', 'Backup-Integritaet pruefen', 'Rechtliche Bewertung (Datenschutz, Meldepflichten)'] },
      { name: 'Wiederherstellung', duration: '1–14 Tage', tasks: ['Systeme aus Backups wiederherstellen', 'Sicherheitsluecken schliessen', 'Schrittweise Inbetriebnahme', 'Monitoring verstaerken'] },
      { name: 'Nachbereitung', duration: 'Ab Tag 14', tasks: ['72h-Folgemeldung an BSI', 'Lessons Learned dokumentieren', 'Abschlussbericht (1 Monat)', 'Sicherheitsmassnahmen anpassen'] },
    ],
  },

  // ─── 15. Kritischer Lieferkettenausfall ──────────────────
  {
    title: 'Kritischer Lieferkettenausfall',
    type: 'Lieferkettenausfall',
    severity: 65,
    description: 'Ausfall eines kritischen Zulieferers oder Dienstleisters. Betriebsunterbrechung durch fehlende Vorprodukte, IT-Services oder Energieversorgung.',
    phases: [
      { name: 'Sofortreaktion', duration: '0–4 Stunden', tasks: ['Betroffene Lieferketten identifizieren', 'Auswirkungen auf eigene Produktion bewerten', 'Krisenstab einberufen', 'Alternative Lieferanten kontaktieren'] },
      { name: 'Ueberbrueckung', duration: '1–7 Tage', tasks: ['Lagerbestaende pruefen und rationieren', 'Notfall-Lieferanten aktivieren', 'Produktion priorisieren (kritische Produkte zuerst)', 'Kunden informieren'] },
      { name: 'Stabilisierung', duration: '1–4 Wochen', tasks: ['Ersatzlieferanten vertraglich sichern', 'Produktionsplanung anpassen', 'Finanzielle Auswirkungen bewerten', 'Versicherung kontaktieren'] },
      { name: 'Nachbereitung', duration: 'Ab Woche 4', tasks: ['Lieferanten-Risikobewertung aktualisieren', 'Dual-Sourcing-Strategie pruefen', 'Sicherheitsbestaende anpassen', 'Vertraege ueberarbeiten'] },
    ],
  },

  // ─── 16. Rechenzentrumsausfall ──────────────────
  {
    title: 'Rechenzentrumsausfall',
    type: 'Rechenzentrumsausfall',
    severity: 75,
    description: 'Totalausfall des primaeren Rechenzentrums durch technisches Versagen, Feuer, Wasser oder Sabotage. Alle gehosteten Dienste betroffen.',
    phases: [
      { name: 'Sofortreaktion', duration: '0–1 Stunde', tasks: ['Ausmass des Ausfalls feststellen', 'DR-Plan aktivieren', 'Failover auf Backup-Standort einleiten', 'Stakeholder informieren'] },
      { name: 'Failover & Notbetrieb', duration: '1–24 Stunden', tasks: ['Kritische Systeme am DR-Standort hochfahren', 'Datenintegritaet pruefen', 'Reduzierter Betrieb sicherstellen', 'Kommunikation an Kunden'] },
      { name: 'Wiederherstellung', duration: '1–7 Tage', tasks: ['Primaer-Standort reparieren/ersetzen', 'Daten synchronisieren', 'Schrittweise Rueckmigration', 'Performance-Tests'] },
      { name: 'Nachbereitung', duration: 'Ab Woche 2', tasks: ['Root-Cause-Analyse', 'DR-Plan aktualisieren', 'RTO/RPO-Ziele ueberpruefen', 'Redundanzkonzept verbessern'] },
    ],
  },

  // ─── 17. Datenschutzvorfall ──────────────────
  {
    title: 'Datenschutzvorfall / Datenleck',
    type: 'Datenschutzvorfall',
    severity: 70,
    description: 'Unbefugter Zugriff auf personenbezogene Daten oder Geschaeftsgeheimnisse. Meldepflicht an Aufsichtsbehoerde binnen 72 Stunden (Art. 33 DSGVO).',
    phases: [
      { name: 'Erkennung & Meldung', duration: '0–24 Stunden', tasks: ['Art und Umfang des Datenlecks feststellen', 'Datenschutzbeauftragten informieren', 'Betroffene Systeme sichern', 'Forensische Sicherung einleiten'] },
      { name: 'Behoerdenmeldung', duration: '24–72 Stunden', tasks: ['Meldung an Aufsichtsbehoerde (Art. 33 DSGVO)', 'Risikobewertung fuer Betroffene', 'Benachrichtigung der Betroffenen pruefen (Art. 34)', 'Rechtsanwalt einschalten'] },
      { name: 'Eindaemmung', duration: '1–7 Tage', tasks: ['Sicherheitsluecke schliessen', 'Zugriffsrechte ueberpruefen und einschraenken', 'Monitoring verstaerken', 'Betroffene benachrichtigen (falls erforderlich)'] },
      { name: 'Nachbereitung', duration: 'Ab Woche 2', tasks: ['DSGVO-Dokumentation vervollstaendigen', 'Technische Schutzmassnahmen verbessern', 'Schulungen durchfuehren', 'Datenschutz-Folgenabschaetzung aktualisieren'] },
    ],
  },

  // ─── 18. Massiver Personalausfall ──────────────────
  {
    title: 'Massiver Personalausfall',
    type: 'Personalausfall',
    severity: 55,
    description: 'Gleichzeitiger Ausfall eines grossen Teils der Belegschaft durch Pandemie, Streik oder andere Ursachen. Kritische Funktionen koennen nicht besetzt werden.',
    phases: [
      { name: 'Sofortreaktion', duration: '0–24 Stunden', tasks: ['Verfuegbare Mitarbeiter erfassen', 'Kritische Funktionen identifizieren', 'Notbesetzungsplan aktivieren', 'Remote-Arbeit ermoeglichen'] },
      { name: 'Notbetrieb', duration: '1–14 Tage', tasks: ['Nicht-kritische Aufgaben pausieren', 'Schichtplaene anpassen', 'Externe Unterstuetzung anfragen', 'Mitarbeiterkommunikation verstaerken'] },
      { name: 'Stabilisierung', duration: '2–6 Wochen', tasks: ['Zeitarbeitskraefte einsetzen', 'Cross-Training fuer Schluesselrollen', 'Prozesse vereinfachen/automatisieren', 'Arbeitsrechtliche Massnahmen pruefen'] },
      { name: 'Nachbereitung', duration: 'Ab Woche 6', tasks: ['Stellvertretungsregelungen ueberarbeiten', 'Know-how-Dokumentation verbessern', 'Pandemieplan aktualisieren', 'Schulungsprogramm anpassen'] },
    ],
  },

  // ─── 19. Betriebsstoerung / Produktionsausfall ──────────────────
  {
    title: 'Betriebsstoerung / Produktionsausfall',
    type: 'Betriebsstoerung',
    severity: 60,
    description: 'Unerwarteter Stillstand der Produktion oder wesentlicher Geschaeftsprozesse durch technisches Versagen, Unfall oder externe Stoerung.',
    phases: [
      { name: 'Sofortreaktion', duration: '0–4 Stunden', tasks: ['Ursache der Stoerung ermitteln', 'Sicherheit fuer Mitarbeiter gewaehrleisten', 'Krisenstab informieren', 'Kunden und Partner benachrichtigen'] },
      { name: 'Notbetrieb', duration: '4–48 Stunden', tasks: ['Provisorische Loesung einrichten', 'Alternative Produktionswege pruefen', 'Versicherung informieren', 'Lieferzusagen ueberpruefen'] },
      { name: 'Wiederherstellung', duration: '2–14 Tage', tasks: ['Reparatur/Ersatz defekter Anlagen', 'Produktion schrittweise hochfahren', 'Qualitaetssicherung verstaerken', 'Rueckstaende aufarbeiten'] },
      { name: 'Nachbereitung', duration: 'Ab Woche 3', tasks: ['Ursachenanalyse dokumentieren', 'Wartungsplaene anpassen', 'Redundanzen einrichten', 'Versicherungsschutz pruefen'] },
    ],
  },

  // ─── 20. Reputationskrise ──────────────────
  {
    title: 'Reputationskrise',
    type: 'Reputationskrise',
    severity: 50,
    description: 'Schwere Schaedigung des Unternehmensrufs durch Medienbericht, Social-Media-Shitstorm, Produktrueckruf oder Fehlverhalten. Vertrauensverlust bei Kunden und Partnern.',
    phases: [
      { name: 'Sofortreaktion', duration: '0–4 Stunden', tasks: ['Medienberichterstattung erfassen und bewerten', 'Krisenkommunikationsteam aktivieren', 'Fakten sammeln und verifizieren', 'Erste Stellungnahme vorbereiten'] },
      { name: 'Aktive Krisenkommunikation', duration: '4–48 Stunden', tasks: ['Offizielle Stellungnahme veroeffentlichen', 'Social-Media-Monitoring intensivieren', 'Medienanfragen zentral beantworten', 'Interne Kommunikation sicherstellen'] },
      { name: 'Schadensbegrenzung', duration: '2–14 Tage', tasks: ['Ursache transparent kommunizieren', 'Korrekturmassnahmen einleiten', 'Dialog mit Stakeholdern suchen', 'Rechtliche Optionen pruefen'] },
      { name: 'Wiederaufbau', duration: 'Ab Woche 3', tasks: ['Vertrauensbildende Massnahmen umsetzen', 'Kommunikationsstrategie langfristig anpassen', 'Monitoring fortfuehren', 'Lessons Learned dokumentieren'] },
    ],
  },
]
