// ============================================
// Alarmplaner – 7 Pflicht-Krisenszenarien
// ============================================
// Diese Szenarien werden beim Onboarding automatisch
// für jeden Landkreis angelegt (is_default: true).
// Sie können bearbeitet, aber nicht gelöscht werden.
// ============================================

export interface DefaultScenarioPhase {
  name: string
  duration: string
  tasks: string[]
}

export interface DefaultScenarioTemplate {
  title: string
  type: string
  severity: number
  description: string
  phases: DefaultScenarioPhase[]
}

export const DEFAULT_SCENARIOS: DefaultScenarioTemplate[] = [
  // ─── 1. Stromausfall ──────────────────────────────────
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
  },

  // ─── 2. Sturm ─────────────────────────────────────────
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
        name: 'Aufräumphase',
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
  },

  // ─── 3. Cyberangriff ──────────────────────────────────
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
          'Alternative Kommunikationswege für Bürger einrichten (Telefon, Vor-Ort-Termine)',
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
  },

  // ─── 4. Sabotage ──────────────────────────────────────
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
  },

  // ─── 5. Pandemie ──────────────────────────────────────
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
  },

  // ─── 6. Krieg ─────────────────────────────────────────
  {
    title: 'Spannungs-/Verteidigungsfall (Krieg)',
    type: 'Krieg',
    severity: 90,
    description:
      'Eskalation eines bewaffneten Konflikts mit direkten oder indirekten Auswirkungen auf den Landkreis. Mögliche Szenarien: Raketenangriffe, Flüchtlingsströme, Versorgungsengpässe, Mobilmachung. Erfordert Umsetzung der Zivilschutzplanung gemäß ZSKG.',
    phases: [
      {
        name: 'Alarmierung & Grundschutz',
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
        name: 'Durchhaltevermögen',
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
  },

  // ─── 7. Terroranschlag ────────────────────────────────
  {
    title: 'Terroranschlag / Amoklage',
    type: 'Terroranschlag',
    severity: 85,
    description:
      'Terroristischer Anschlag oder Amoklage im Landkreis. Kann verschiedene Angriffsformen umfassen: Fahrzeug, Waffen, Sprengstoff, CBRN-Stoffe. Erfordert sofortige polizeiliche Maßnahmen und parallele Rettungsdienstkoordination.',
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
        name: 'Nachsorge',
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
  },
]
