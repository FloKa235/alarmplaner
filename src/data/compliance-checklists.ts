/**
 * KRITIS-Dachgesetz Compliance-Checklisten
 *
 * Basierend auf dem KRITIS-Dachgesetz (KRITIS-DachG, 2024)
 * und der EU-Richtlinie ueber die Resilienz kritischer Einrichtungen (CER-RL)
 *
 * 10 Anforderungskategorien mit hierarchischen Pruefpunkten.
 * Bewertungssystem: Erfuellt | Teilweise erfuellt | Nicht erfuellt | Kein Bedarf
 */

export interface ComplianceChecklistItemTemplate {
  id: string        // Nummerierung z.B. '1.1', '1.2'
  text: string      // Pruefpunkt-Text
  level: number     // 0 = Hauptpunkt, 1 = Unterpunkt
}

export interface ComplianceChecklistTemplate {
  key: string
  nummer: number
  title: string
  beschreibung: string
  gesetzesreferenz: string   // z.B. '§ 10 KRITIS-DachG'
  frist: string | null        // z.B. 'Bis 17.10.2026'
  items: ComplianceChecklistItemTemplate[]
}

export const COMPLIANCE_CHECKLISTS: ComplianceChecklistTemplate[] = [
  // ── 1. Risikobewertungen ─────────────────────────────
  {
    key: 'risikobewertung',
    nummer: 1,
    title: 'Risikobewertungen',
    beschreibung: 'Systematische Bewertung aller Risiken fuer kritische Infrastrukturen nach dem All-Gefahren-Ansatz.',
    gesetzesreferenz: '§ 10 KRITIS-DachG',
    frist: 'Erstmalig 9 Monate nach Registrierung',
    items: [
      { id: '1.1', text: 'All-Gefahren-Ansatz fuer Risikobewertung implementiert (Natur, Mensch, technisch)', level: 0 },
      { id: '1.2', text: 'Naturgefahren identifiziert und bewertet (Hochwasser, Sturm, Erdbeben, Hitze)', level: 1 },
      { id: '1.3', text: 'Vom Menschen verursachte Gefahren bewertet (Sabotage, Terrorismus, Cyberangriff)', level: 1 },
      { id: '1.4', text: 'Sektoruebergreifende Abhaengigkeiten analysiert und dokumentiert', level: 0 },
      { id: '1.5', text: 'Risikobewertung dokumentiert und beim BSI eingereicht', level: 0 },
      { id: '1.6', text: 'Aktualisierungszyklus festgelegt (mindestens alle 4 Jahre)', level: 0 },
    ],
  },

  // ── 2. Resilienzmassnahmen ───────────────────────────
  {
    key: 'resilienzmassnahmen',
    nummer: 2,
    title: 'Resilienzmassnahmen',
    beschreibung: 'Technische und organisatorische Massnahmen zur Sicherstellung der Widerstandsfaehigkeit.',
    gesetzesreferenz: '§ 11 KRITIS-DachG',
    frist: '10 Monate nach Registrierung',
    items: [
      { id: '2.1', text: 'Massnahmen zur Verhinderung von Vorfaellen implementiert', level: 0 },
      { id: '2.2', text: 'Physische Schutzmassnahmen (Zaeune, Zutrittskontrolle, Ueberwachung) vorhanden', level: 1 },
      { id: '2.3', text: 'Massnahmen zur Schadensbegrenzung bei Vorfaellen etabliert', level: 0 },
      { id: '2.4', text: 'Redundanzen fuer kritische Systeme eingerichtet', level: 1 },
      { id: '2.5', text: 'Wiederherstellungsverfahren definiert und getestet', level: 0 },
      { id: '2.6', text: 'Resilienzplan dem BSI vorgelegt', level: 0 },
      { id: '2.7', text: 'Massnahmen verhaeltnismaessig zum Risiko und zur Groesse der Einrichtung', level: 0 },
    ],
  },

  // ── 3. Vorfallmeldungen ──────────────────────────────
  {
    key: 'vorfallmeldungen',
    nummer: 3,
    title: 'Vorfallmeldungen',
    beschreibung: 'Pflicht zur Meldung erheblicher Stoerungen an das BSI.',
    gesetzesreferenz: '§ 12 KRITIS-DachG',
    frist: 'Ab Registrierung',
    items: [
      { id: '3.1', text: 'Meldeprozess fuer erhebliche Stoerungen definiert', level: 0 },
      { id: '3.2', text: 'Fruehwarnung innerhalb 24 Stunden sichergestellt', level: 1 },
      { id: '3.3', text: 'Vorfallmeldung innerhalb 72 Stunden sichergestellt', level: 1 },
      { id: '3.4', text: 'Abschlussbericht innerhalb eines Monats vorgesehen', level: 1 },
      { id: '3.5', text: 'Verantwortliche Ansprechperson fuer BSI-Kontakt benannt', level: 0 },
    ],
  },

  // ── 4. Betriebskontinuitaetsplaene ──────────────────
  {
    key: 'betriebskontinuitaet',
    nummer: 4,
    title: 'Betriebskontinuitaetsplaene',
    beschreibung: 'Sicherstellung der Aufrechterhaltung oder schnellen Wiederherstellung kritischer Dienstleistungen.',
    gesetzesreferenz: '§ 13 KRITIS-DachG',
    frist: '10 Monate nach Registrierung',
    items: [
      { id: '4.1', text: 'Business-Continuity-Plan (BCP) fuer alle kritischen Dienste erstellt', level: 0 },
      { id: '4.2', text: 'Mindestversorgungsniveaus fuer den Krisenfall definiert', level: 0 },
      { id: '4.3', text: 'Notfall-Lieferketten und alternative Zulieferer identifiziert', level: 1 },
      { id: '4.4', text: 'Wiederanlaufplaene mit Zeitzielen (RTO/RPO) dokumentiert', level: 0 },
      { id: '4.5', text: 'BCP regelmaessig getestet (mindestens jaehrlich)', level: 0 },
      { id: '4.6', text: 'Ergebnisse der Tests dokumentiert und Verbesserungen umgesetzt', level: 1 },
    ],
  },

  // ── 5. Sicherheitskonzepte ──────────────────────────
  {
    key: 'sicherheitskonzepte',
    nummer: 5,
    title: 'Sicherheitskonzepte',
    beschreibung: 'Umfassende Sicherheitskonzepte fuer den Schutz kritischer Infrastrukturen.',
    gesetzesreferenz: '§ 14 KRITIS-DachG',
    frist: '10 Monate nach Registrierung',
    items: [
      { id: '5.1', text: 'Ganzheitliches Sicherheitskonzept fuer alle KRITIS-Anlagen erstellt', level: 0 },
      { id: '5.2', text: 'Bedrohungsszenarien definiert und Gegenmassnahmen zugeordnet', level: 0 },
      { id: '5.3', text: 'Sicherheitszonen und Schutzbereiche festgelegt', level: 1 },
      { id: '5.4', text: 'Krisenmanagement-Organisation definiert (Rollen, Verantwortlichkeiten)', level: 0 },
      { id: '5.5', text: 'Kommunikationsplan fuer Krisensituationen vorhanden', level: 1 },
      { id: '5.6', text: 'Schulungs- und Sensibilisierungsprogramm etabliert', level: 0 },
      { id: '5.7', text: 'Sicherheitskonzept dem BSI auf Anforderung vorlegbar', level: 0 },
    ],
  },

  // ── 6. Regelmaessige Ueberpruefungen ────────────────
  {
    key: 'ueberpruefungen',
    nummer: 6,
    title: 'Regelmaessige Ueberpruefungen',
    beschreibung: 'Pflicht zu Audits, Inspektionen und Nachweisen gegenueber dem BSI.',
    gesetzesreferenz: '§ 15 KRITIS-DachG',
    frist: 'Alle 3 Jahre',
    items: [
      { id: '6.1', text: 'Regelmaessige Sicherheitsaudits durchgefuehrt (alle 3 Jahre)', level: 0 },
      { id: '6.2', text: 'Audit-Ergebnisse dokumentiert und Massnahmen abgeleitet', level: 0 },
      { id: '6.3', text: 'Interne Ueberpruefungen zwischen den Audits vorgesehen', level: 1 },
      { id: '6.4', text: 'Nachweise gegenueber dem BSI vorlegbar (Audit-Berichte, Zertifikate)', level: 0 },
      { id: '6.5', text: 'Fristen und Zustaendigkeiten fuer Audits festgelegt', level: 0 },
    ],
  },

  // ── 7. Registrierung beim BSI ───────────────────────
  {
    key: 'registrierung',
    nummer: 7,
    title: 'Registrierung beim BSI',
    beschreibung: 'Pflicht zur Registrierung als Betreiber kritischer Infrastruktur beim Bundesamt fuer Sicherheit in der Informationstechnik.',
    gesetzesreferenz: '§ 16 KRITIS-DachG',
    frist: 'Innerhalb von 3 Monaten nach Identifizierung',
    items: [
      { id: '7.1', text: 'Alle KRITIS-Anlagen identifiziert und klassifiziert', level: 0 },
      { id: '7.2', text: 'Registrierung beim BSI durchgefuehrt', level: 0 },
      { id: '7.3', text: 'Kontaktstelle fuer BSI benannt und gemeldet', level: 0 },
      { id: '7.4', text: 'Aenderungen (neue Anlagen, Stilllegungen) zeitnah gemeldet', level: 0 },
    ],
  },

  // ── 8. Personelle Sicherheit ────────────────────────
  {
    key: 'personelle_sicherheit',
    nummer: 8,
    title: 'Personelle Sicherheit',
    beschreibung: 'Anforderungen an Personal mit Zugang zu kritischen Bereichen.',
    gesetzesreferenz: '§ 17 KRITIS-DachG',
    frist: '10 Monate nach Registrierung',
    items: [
      { id: '8.1', text: 'Zuverlaessigkeitsueberpruefung fuer Schluessel-Personal durchgefuehrt', level: 0 },
      { id: '8.2', text: 'Zugangsberechtigungskonzept fuer kritische Bereiche erstellt', level: 0 },
      { id: '8.3', text: 'Regelmaessige Sicherheitsschulungen fuer Mitarbeiter', level: 0 },
      { id: '8.4', text: 'Sensibilisierung fuer Insider-Bedrohungen durchgefuehrt', level: 1 },
      { id: '8.5', text: 'Verfahren fuer Personalwechsel in kritischen Positionen definiert', level: 0 },
      { id: '8.6', text: 'Notfall-Personalplanung (Vertretungsregelung, Bereitschaftsdienst)', level: 0 },
    ],
  },

  // ── 9. Physische Sicherheit ─────────────────────────
  {
    key: 'physische_sicherheit',
    nummer: 9,
    title: 'Physische Sicherheit',
    beschreibung: 'Physische Schutzmassnahmen fuer Anlagen und Einrichtungen.',
    gesetzesreferenz: '§ 18 KRITIS-DachG',
    frist: '10 Monate nach Registrierung',
    items: [
      { id: '9.1', text: 'Perimeterschutz (Zaun, Mauer, Barrieren) vorhanden und gewartet', level: 0 },
      { id: '9.2', text: 'Zutrittskontrollsystem fuer alle kritischen Bereiche installiert', level: 0 },
      { id: '9.3', text: 'Videoueberwachung an neuralgischen Punkten aktiv', level: 1 },
      { id: '9.4', text: 'Einbruchmeldeanlage installiert und regelmaessig geprueft', level: 1 },
      { id: '9.5', text: 'Brandschutzkonzept umgesetzt (Melder, Loeschanlage, Fluchtplaene)', level: 0 },
      { id: '9.6', text: 'Hochwasser- und Unwetterschutz fuer Anlagen vorhanden', level: 0 },
      { id: '9.7', text: 'Notstromversorgung (USV, Netzersatzanlage) betriebsbereit und getestet', level: 0 },
    ],
  },

  // ── 10. Cybersicherheit ─────────────────────────────
  {
    key: 'cybersicherheit',
    nummer: 10,
    title: 'Cybersicherheit',
    beschreibung: 'IT- und OT-Sicherheitsmassnahmen gemaess BSI-Vorgaben (NIS-2 / IT-SiG 2.0).',
    gesetzesreferenz: '§ 19 KRITIS-DachG i.V.m. § 8a BSIG',
    frist: '10 Monate nach Registrierung',
    items: [
      { id: '10.1', text: 'IT-Sicherheitsmanagement-System (ISMS) nach ISO 27001 oder BSI IT-Grundschutz', level: 0 },
      { id: '10.2', text: 'Netzwerksegmentierung zwischen IT und OT umgesetzt', level: 0 },
      { id: '10.3', text: 'Regelmaessige Schwachstellen-Scans und Penetrationstests', level: 1 },
      { id: '10.4', text: 'Security Operations Center (SOC) oder SIEM-System betrieben', level: 1 },
      { id: '10.5', text: 'Incident-Response-Plan fuer Cyberangriffe vorhanden und getestet', level: 0 },
      { id: '10.6', text: 'Systeme zur Angriffserkennung (SzA) gemaess § 8a (1a) BSIG implementiert', level: 0 },
    ],
  },
]
