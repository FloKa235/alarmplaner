/**
 * ExTrass-Checklisten für Kommunen (Johanniter/BBK)
 *
 * Basierend auf: "Checklisten für Kommunen: Hitze und Starkregen"
 * Quelle: ExTrass-Projekt (BMBF-gefördert, Johanniter-Unfall-Hilfe)
 *
 * 18 Kategorien mit hierarchischen Prüfpunkten.
 * Bewertungssystem: Erfüllt | Teilweise erfüllt | Nicht erfüllt | Kein Bedarf
 */

export interface PrepChecklistItemTemplate {
  id: string        // Nummerierung z.B. '1.1', '1.2.1'
  text: string      // Prüfpunkt-Text
  level: number     // 0 = Hauptpunkt, 1 = Unterpunkt
}

export interface PrepChecklistTemplate {
  key: string
  nummer: number
  title: string
  beschreibung: string
  items: PrepChecklistItemTemplate[]
}

export const PREPARATION_CHECKLISTS: PrepChecklistTemplate[] = [
  // ── 1. Ortsbeschreibung ──────────────────────────────
  {
    key: 'ortsbeschreibung',
    nummer: 1,
    title: 'Ortsbeschreibung',
    beschreibung: 'Detaillierte Kenntnis des Gemeindegebiets für die Gefahrenabwehr.',
    items: [
      { id: '1.1', text: 'Eine Ortsbeschreibung liegt bereits vor', level: 0 },
      { id: '1.2', text: 'Zugriff auf Informationsquellen (Einwohnermelderegister, Geoportal, Gewerberegister, Statistikämter)', level: 0 },
      { id: '1.3', text: 'Ortsbeschreibung auf Basis evidenter Quellen mit ortsspezifischen Gegebenheiten', level: 0 },
      { id: '1.4', text: 'Sitze öffentlicher Einrichtungen bekannt (Krankenhäuser, Pflegeeinrichtungen, Schulen, Gemeindewerke)', level: 0 },
      { id: '1.5', text: 'Überörtliche Zusammenhänge bekannt (Verkehrsverbindungen, Bahn, Autobahn, Ferntrassen)', level: 0 },
      { id: '1.6', text: 'Besondere Gebäude identifiziert (Seniorenwohnanlagen, Bundeswehr, Feuerwehr, THW, Polizei)', level: 0 },
      { id: '1.7', text: 'Nutztiere und Tierparks: Standorte und alternative Unterbringungsorte bekannt', level: 0 },
      { id: '1.8', text: 'Kulturgut: Schützenswertes Kulturgut (Bibliotheken, Archive, Museen, Baudenkmäler) bekannt', level: 0 },
      { id: '1.9', text: 'Natürliche Gegebenheiten: Gemeindeoberfläche, Be-/Entwässerung, Bergbau bekannt', level: 0 },
      { id: '1.10', text: 'Grundwasser: Pegelhöhe, Pumpstandorte bekannt', level: 1 },
      { id: '1.11', text: 'Hochwasserpegel: Historische Pegel, Hochwasserschutzkarten, Stauanlagen, Überschwemmungsgebiete', level: 1 },
      { id: '1.12', text: 'Klimatische Verhältnisse: Wettereinflüsse, Niederschlagswerte, Unwetterhäufigkeit bekannt', level: 1 },
      { id: '1.13', text: 'Oberflächengewässer: Stehende und fließende Gewässer bekannt', level: 1 },
      { id: '1.14', text: 'Topografische Gegebenheiten: Struktur, Höhenunterschiede bekannt', level: 1 },
      { id: '1.15', text: 'Bevölkerung: Arbeitende, Pendler, Altersstruktur, Staatsangehörigkeiten, Dolmetscher bekannt', level: 1 },
    ],
  },

  // ── 2. Gebietsgefahrenanalyse ────────────────────────
  {
    key: 'gebietsgefahrenanalyse',
    nummer: 2,
    title: 'Gebietsgefahrenanalyse',
    beschreibung: 'Identifikation besonderer Risikobereiche und spezifische Notfallpläne.',
    items: [
      { id: '2.1', text: 'Eine Gebietsgefahrenanalyse wurde bereits durchgeführt', level: 0 },
      { id: '2.2', text: 'Bauweise: Geschlossene/offene Bauweise, hohe Bauwerke, unterirdische Anlagen, Neubaugebiete bekannt', level: 0 },
      { id: '2.3', text: 'Bebauungsdichte: Gebiete mit besonders hoher Dichte identifiziert', level: 0 },
      { id: '2.4', text: 'Flächennutzung: Funktionen (Verkehr, Grün, Gewerbe), Wasserflächen, multifunktionale Flächen bekannt', level: 0 },
    ],
  },

  // ── 3. Informationsbeschaffung ───────────────────────
  {
    key: 'informationsbeschaffung',
    nummer: 3,
    title: 'Informationsbeschaffung',
    beschreibung: 'Quellen und Ansprechpartner zur schnellen Informationsbeschaffung im Krisenfall.',
    items: [
      { id: '3.1', text: 'Telefonverzeichnis aller benötigten Kontaktpersonen liegt vor und ist sofort abrufbar', level: 0 },
      { id: '3.2', text: 'Ansprechpartner für Ereignis-Informationen bekannt (DWD, Hochwasserschutz, Ordnungsbehörde, Presse)', level: 0 },
      { id: '3.3', text: 'Ansprechpersonen zur Infrastruktur bekannt (Abwasserverband, ÖPNV, Energieversorger, Wasserwerke)', level: 0 },
    ],
  },

  // ── 4. Akteure ───────────────────────────────────────
  {
    key: 'akteure',
    nummer: 4,
    title: 'Akteure',
    beschreibung: 'Alle einzubeziehenden Akteure und deren Kontaktinformationen.',
    items: [
      { id: '4.1', text: 'Alle relevanten Akteure sind bekannt und dokumentiert', level: 0 },
      { id: '4.2', text: 'Entscheidungsträger: Liste erstellt, Sitz der übergeordneten Verwaltung bekannt', level: 0 },
      { id: '4.3', text: 'BOS-Ansprechpersonen bekannt (Feuerwehr, THW, DLRG, ASB, DRK, JUH, MHD, Polizei, Bundeswehr)', level: 0 },
      { id: '4.4', text: 'Betreiber relevanter Einrichtungen bekannt (Krankenhäuser, Pflegeeinrichtungen, Schulen, Versorger)', level: 0 },
      { id: '4.5', text: 'Menschen mit Erfahrung bei vergangenen Krisenereignissen bekannt', level: 0 },
      { id: '4.6', text: 'Relevante Privatunternehmen: Ansprechpersonen für schwere Geräte und Lagerkapazitäten bekannt', level: 0 },
    ],
  },

  // ── 5. Kritische Infrastrukturen ─────────────────────
  {
    key: 'kritis',
    nummer: 5,
    title: 'Kritische Infrastrukturen',
    beschreibung: 'KRITIS-Liegenschaften identifiziert und Versorgungssicherheit geprüft.',
    items: [
      { id: '5.1', text: 'KRITIS-Liegenschaften identifiziert (Kraftwerke, Umspannwerke, Wasserwerke, Pumpwerke, Klärwerke)', level: 0 },
      { id: '5.2', text: 'Gas: Gasbedarf pro Zeiteinheit bekannt/berechenbar', level: 0 },
      { id: '5.3', text: 'Strom: Notstromeinspeisung möglich, ausreichend Aggregate, Stromverteilerkästen bekannt', level: 0 },
      { id: '5.4', text: 'Abwasser: Entsorgung bei Stromausfall sichergestellt', level: 0 },
      { id: '5.5', text: 'Trinkwasser: Versorgung sichergestellt, Trinkwassereignung geprüft', level: 0 },
      { id: '5.6', text: 'Telekommunikation: Internet-/Telefonverteilerkästen, Funkmasten, Warnsysteme bekannt und geschützt', level: 0 },
      { id: '5.7', text: 'Besondere Einrichtungen: Bundeswehr, Betreuungseinrichtungen, Rettungswachen bekannt', level: 0 },
      { id: '5.8', text: 'Private Betreiber: Empfehlungen zur Bevorratung erhalten', level: 0 },
      { id: '5.9', text: 'KRITIS in Überflutungsgebieten ermittelt und bestmöglich geschützt', level: 0 },
      { id: '5.10', text: 'Verkehrsinfrastruktur ist bekannt', level: 0 },
    ],
  },

  // ── 6. Stabskonzept ─────────────────────────────────
  {
    key: 'stabskonzept',
    nummer: 6,
    title: 'Stabskonzept',
    beschreibung: 'SAE-Konzept mit Funktionen, Personal und Räumlichkeiten gemäß VwVStArb.',
    items: [
      { id: '6.1', text: 'Stabskonzept erstellt und als Stabsdienstordnung verbreitet', level: 0 },
      { id: '6.2', text: 'Funktionen gemäß VwVStArb besetzt (LdS, KGS, BuMA, SMS, EMS)', level: 0 },
      { id: '6.3', text: 'Stabsmitglieder für Stabsarbeit geschult, regelmäßige Übungen durchgeführt', level: 1 },
      { id: '6.4', text: 'Einberufungsbefugnis klar festgeschrieben (HVB, LdS + Vertretung)', level: 1 },
      { id: '6.5', text: 'Private Erreichbarkeit aller Stabsmitglieder erfasst (Taschenalarmplan)', level: 0 },
      { id: '6.6', text: 'Geeignete Räumlichkeiten mit Ausstattung für Stabsarbeit (notstromversorgt)', level: 0 },
      { id: '6.7', text: 'Schichtbetrieb: Ausreichend Personal, Regelungen zu Mehrarbeitsstunden', level: 1 },
    ],
  },

  // ── 7. Bedarfsplanung ───────────────────────────────
  {
    key: 'bedarfsplanung',
    nummer: 7,
    title: 'Bedarfsplanung',
    beschreibung: 'Planung und Vorhaltung von Schnelleinsatzgruppen und Ressourcen.',
    items: [
      { id: '7.1', text: 'Schnelleinsatzgruppen (SEGs) geplant und vorgehalten (Wasserrettung, Betreuung, Rettung, Verpflegung)', level: 0 },
      { id: '7.2', text: 'SEGs: Taktische Organisation, ausgebildete Kräfte, Einsatzmittel, Alarmierbarkeit (<30 min), AAO-Integration', level: 0 },
      { id: '7.3', text: 'Großveranstaltungen: Extremwetter-Risiken in Planungskonzepte eingebaut', level: 0 },
      { id: '7.4', text: 'Sensibilisierung der sanitätsdienstlichen Verantwortlichen für Extremwetter', level: 0 },
      { id: '7.5', text: 'Sensibilisierung der Führungskräfte der Gefahrenabwehr für Extremwetter', level: 0 },
    ],
  },

  // ── 8. Einsatzplanung ───────────────────────────────
  {
    key: 'einsatzplanung',
    nummer: 8,
    title: 'Einsatzplanung',
    beschreibung: 'Einsatzpläne für effektive Gefahrenabwehr bei Extremwetterereignissen.',
    items: [
      { id: '8.1', text: 'Informations- und Meldewege klar geregelt', level: 0 },
      { id: '8.2', text: 'Schwellenwerte für Alarmierung dargelegt', level: 0 },
      { id: '8.3', text: 'Planung basiert auf mehreren Eskalationsstufen', level: 0 },
      { id: '8.4', text: 'Alarm- und Ausrückeordnung (AAO) vorhanden', level: 0 },
      { id: '8.5', text: 'Erkundungswagen für Kontrollfahrten eingeplant', level: 0 },
      { id: '8.6', text: 'Ortsbeschreibungs-Analyse: Ableitbare Risiken beschrieben, Kartenmaterial beigefügt', level: 0 },
      { id: '8.7', text: 'Ressourcen-Verfügbarkeit dargelegt (Sandsäcke, Spundwände, Pumpen, Folien)', level: 0 },
      { id: '8.8', text: 'Technisch-operative Vorgehensweise im Einsatzfall niedergeschrieben', level: 0 },
      { id: '8.9', text: 'Erreichbarkeit relevanter Akteure festgelegt', level: 0 },
    ],
  },

  // ── 9. Katastrophenschutzplan ───────────────────────
  {
    key: 'kats_plan',
    nummer: 9,
    title: 'Katastrophenschutzplan (KatS-Plan)',
    beschreibung: 'KatS-Plan mit Alarmierung, Maßnahmen und Einsatzkräften.',
    items: [
      { id: '9.1', text: 'Ein Katastrophenschutzplan liegt vor und wurde an relevante Akteure weitergereicht', level: 0 },
      { id: '9.2', text: 'Gemeinden werden in Erstellung und Aktualisierung einbezogen', level: 1 },
      { id: '9.3', text: 'Anforderungen an einzelne Gemeinden sind realistisch und erfüllbar', level: 1 },
      { id: '9.4', text: 'Wichtige Szenarien betrachtet: Hochwasser, Unwetter, Stromausfall, Gefahrstoff, Hitzewelle, Trockenheit', level: 0 },
    ],
  },

  // ── 10. Evakuierungsplanung ─────────────────────────
  {
    key: 'evakuierungsplanung',
    nummer: 10,
    title: 'Evakuierungsplanung',
    beschreibung: 'Allgemeine Evakuierungsplanung für alle denkbaren Szenarien.',
    items: [
      { id: '10.1', text: 'Allgemeine Evakuierungsplanungen liegen vor', level: 0 },
      { id: '10.2', text: 'Einsatzstichworte aus AAO identifiziert, die Evakuierung erfordern können', level: 0 },
      { id: '10.3', text: 'Sammelstellen für Bevölkerung festgelegt', level: 0 },
      { id: '10.4', text: 'Geeignete Notunterkünfte identifiziert (außerhalb Gefahrenbereiche, Notstrom, Nachbar-Austausch)', level: 0 },
      { id: '10.5', text: 'Ablaufpläne mit Zuständigkeiten erstellt (Verkehr, Information, Transport, Betreuung, Tiere, Rückführung)', level: 0 },
      { id: '10.6', text: 'Maßnahmenkataloge mit allen Beteiligten abgestimmt', level: 0 },
      { id: '10.7', text: 'Stabsübungen finden regelmäßig statt', level: 0 },
      { id: '10.8', text: 'Evakuierungsentscheidung: Befugnis, Reihenfolge, Dokumentation festgelegt', level: 0 },
    ],
  },

  // ── 11. Mittelbevorratung ───────────────────────────
  {
    key: 'mittelbevorratung',
    nummer: 11,
    title: 'Mittelbevorratung der Kommune',
    beschreibung: 'Material-Vorratshaltung für Notunterkünfte und Krisenbewältigung.',
    items: [
      { id: '11.1', text: 'Umfassende Analyse durchgeführt (Güter-Menge pro Zeiteinheit, in Zusammenarbeit mit HiOrgs/THW)', level: 0 },
      { id: '11.2', text: 'Im Ernstfall: Güter schnell und unbürokratisch beschaffbar (Vollmachten, Nachbargemeinden)', level: 0 },
      { id: '11.3', text: 'Güter für Notunterkünfte vorgehalten (Feldbetten, Schlafsäcke, Decken, Hygieneartikel, Lebensmittel)', level: 0 },
      { id: '11.4', text: 'Dokumentationssystem für Bestand und Verbrauch etabliert', level: 0 },
      { id: '11.5', text: 'Güter für Starkregenbewältigung vorgehalten (Sandsäcke, Spundwände, Pumpen, Treibstoff)', level: 0 },
      { id: '11.6', text: 'Güter für Trinkwasser-Notversorgung vorgehalten', level: 0 },
      { id: '11.7', text: 'Güter und Wasser für Löschwasserversorgung vorgehalten', level: 0 },
    ],
  },

  // ── 12. Eigene Betroffenheit ────────────────────────
  {
    key: 'eigene_betroffenheit',
    nummer: 12,
    title: 'Eigene Betroffenheit der Einsatzkräfte',
    beschreibung: 'Resilienz von BOS-Standorten und Einsatzkräften sicherstellen.',
    items: [
      { id: '12.1', text: 'BOS-Standorte auf Eignung geprüft (Starkregenkarte), Fahrzeuge bei Stromausfall einsatzfähig', level: 0 },
      { id: '12.2', text: 'Konzept zur Absicherung und Resilienzsteigerung liegt vor (Bevorratung, Angehörigen-Versorgung)', level: 0 },
      { id: '12.3', text: 'Psychosoziale Resilienz: Schulungsangebote für Stressbewältigung, Betreuungsangebote vorhanden', level: 0 },
    ],
  },

  // ── 13. Risikogruppenidentifikation ─────────────────
  {
    key: 'risikogruppenidentifikation',
    nummer: 13,
    title: 'Risikogruppenidentifikation',
    beschreibung: 'Risikogruppen und Menschen mit besonderen Bedürfnissen identifiziert.',
    items: [
      { id: '13.1', text: 'Risikogruppen sind bereits identifiziert', level: 0 },
      { id: '13.2', text: 'Menschen mit besonderen Bedürfnissen (Sprachbarriere, Einschränkungen) sind bekannt', level: 0 },
      { id: '13.3', text: 'Kinder: Altersgruppen (Säuglinge, Kleinkinder, Schulkinder) zahlenmäßig bekannt', level: 1 },
      { id: '13.4', text: 'Senioren: Über-60-Jährige, nicht mehr Gehfähige zahlenmäßig bekannt', level: 1 },
      { id: '13.5', text: 'Menschen mit Einschränkungen: Körperliche/geistige, Rollstuhltransporter, Heimbeatmete bekannt', level: 1 },
      { id: '13.6', text: 'Chronisch Kranke: Pflegeprodukte, Pflegegrade 3-5, Transportmittel bekannt', level: 1 },
    ],
  },

  // ── 14. Risikokommunikation ─────────────────────────
  {
    key: 'risikokommunikation',
    nummer: 14,
    title: 'Risikokommunikation',
    beschreibung: 'Kommunikation von Risiken an Akteure und Bevölkerung vor Ereigniseintritt.',
    items: [
      { id: '14.1', text: 'Kommunikation mit allen Akteuren sichergestellt (BOS, KatS, Krankenhäuser, Pflegeeinrichtungen)', level: 0 },
      { id: '14.2', text: 'Eintrittswahrscheinlichkeiten werden geschätzt und kommuniziert', level: 0 },
      { id: '14.3', text: 'Mögliche Auswirkungen werden kommuniziert (Überflutungen, Stromausfall, Versorgungsausfall)', level: 0 },
      { id: '14.4', text: 'Hinweise zu Vorbereitung und Schadensbegrenzung an relevante Akteure kommuniziert', level: 0 },
      { id: '14.5', text: 'Bevölkerungsbewusstsein: Risiken informiert, Selbsteinschätzung ermöglicht, Selbsthilfe publiziert', level: 0 },
      { id: '14.6', text: 'Infomaterialien (BBK-Hefte, kommunale Infos) ausgelegt und beworben', level: 0 },
      { id: '14.7', text: 'Regelmäßige KatS-Übungen mit Presse- und Öffentlichkeitsbeteiligung', level: 0 },
      { id: '14.8', text: 'Informationsabende/Workshops mit HiOrgs (Vorrat, Notfallrucksack, Sirenenalarm)', level: 0 },
      { id: '14.9', text: 'Selbstschutz-Konzept: Beratungsstellen, Schulungen, Merkblätter, Medienarbeit', level: 0 },
      { id: '14.10', text: 'Private Betreiber wichtiger Infrastrukturen erhalten Bevorratungs-Empfehlungen', level: 0 },
    ],
  },

  // ── 15. Autarkie im Notfall ─────────────────────────
  {
    key: 'autarkie',
    nummer: 15,
    title: 'Autarkie im Notfall',
    beschreibung: 'Notstromversorgung und Selbsthilfefähigkeit kritischer Einrichtungen.',
    items: [
      { id: '15.1', text: 'Erhebung der Notstromversorgung aller Alten- und Pflegeheime liegt vor', level: 0 },
      { id: '15.2', text: 'Pflegeeinrichtungen: Standorte, Bewohnerzahlen, Notstromkapazitäten vollständig erhoben', level: 0 },
      { id: '15.3', text: 'Landwirtschaft: Selbsthilfefähigkeit aller Betriebe erhoben', level: 0 },
      { id: '15.4', text: 'Viehwirtschaft: Betriebe, Standorte, Nutztiere, Transportmittel, Notstromversorgung erhoben', level: 0 },
    ],
  },

  // ── 16. Krisenkommunikation ─────────────────────────
  {
    key: 'krisenkommunikation',
    nummer: 16,
    title: 'Krisenkommunikation',
    beschreibung: 'Kommunikationsstrukturen und -kanäle für den Ereignisfall.',
    items: [
      { id: '16.1', text: 'Verantwortlichkeiten klar geregelt (Pressesprecher Kommune, Stab, Feuerwehr, HiOrgs, Bundeswehr)', level: 0 },
      { id: '16.2', text: 'Vielseitige Kanäle vorgesehen (Funk, Fernsehen, lokale Medien, soziale Medien)', level: 0 },
      { id: '16.3', text: 'Informationen: Kurzfristig abrufbar, sachlich richtig, aktuell, Social-Media-Monitoring gewährleistet', level: 0 },
    ],
  },

  // ── 17. Spontanhelfende ─────────────────────────────
  {
    key: 'spontanhelfende',
    nummer: 17,
    title: 'Spontanhelfende',
    beschreibung: 'Konzept zur Einbindung von Spontanhelfenden in Krisensituationen.',
    items: [
      { id: '17.1', text: 'Umfassendes Konzept zur Einbindung von Spontanhelfenden liegt vor', level: 0 },
      { id: '17.2', text: 'Führungskräfte eingebunden und im Umgang mit Spontanhelfenden ausgebildet', level: 0 },
      { id: '17.3', text: 'Arbeitssicherheit: Einweisung, Checkliste zur Arbeitssicherheit verbreitet', level: 0 },
      { id: '17.4', text: 'Ressourcen eingeplant (Handschuhe, Warnwesten, Verpflegung, Ruhebereiche)', level: 0 },
      { id: '17.5', text: 'Bevölkerung sensibilisiert (Flyer, persönliche Vorbereitung, Eigenvorsorge)', level: 0 },
    ],
  },

  // ── 18. Evaluation ──────────────────────────────────
  {
    key: 'evaluation',
    nummer: 18,
    title: 'Evaluation und Anpassung',
    beschreibung: 'Regelmäßige Überprüfung und Anpassung der Notfallpläne.',
    items: [
      { id: '18.1', text: 'Turnusmäßige Evaluation anhand der Checklisten (mind. jährlich)', level: 0 },
      { id: '18.2', text: 'Anlassbezogene Evaluation bei Änderung von Gefahrenabwehrplänen oder Gesetzeslage', level: 0 },
      { id: '18.3', text: 'Evaluation bei wesentlichen Infrastrukturänderungen (Pflegeeinrichtungen, Industriebetriebe)', level: 0 },
      { id: '18.4', text: 'Evaluation nach Ereigniseintritt mit Dokumentation von Ereignisart und Datum', level: 0 },
    ],
  },
]

/** Gesamtzahl aller Items über alle 18 Kategorien */
export const TOTAL_PREPARATION_ITEMS = PREPARATION_CHECKLISTS.reduce(
  (sum, cat) => sum + cat.items.length, 0
)
