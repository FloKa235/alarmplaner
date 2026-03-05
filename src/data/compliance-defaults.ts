/**
 * Default-Anforderungen fuer Compliance-Frameworks.
 * Wird vom useCompliance-Hook zum Seeden der DB bei Erstnutzung verwendet.
 */
import type { FrameworkType } from '@/types/database'

export interface DefaultRequirement {
  section: string
  title: string
  description: string
  action_href?: string
  action_label?: string
  sort_order: number
}

export interface DefaultFrameworkTemplate {
  framework_type: FrameworkType
  label: string
  shortLabel: string
  deadline: string
  description: string
  iconKey: 'shield' | 'landmark' | 'bookOpen'
  color: string
  bg: string
  border: string
  requirements: DefaultRequirement[]
}

export const DEFAULT_FRAMEWORK_TEMPLATES: DefaultFrameworkTemplate[] = [
  {
    framework_type: 'nis2',
    label: 'NIS2-Umsetzungsgesetz',
    shortLabel: 'NIS2',
    iconKey: 'shield',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    deadline: 'Seit 06.12.2025 in Kraft',
    description: 'Cybersicherheitspflichten fuer wesentliche und wichtige Einrichtungen. ~30.000 Unternehmen betroffen.',
    requirements: [
      { section: '§30 (1)', title: 'Risikomanagement-Massnahmen', description: 'Geeignete, verhaeltnismaessige technische, operative und organisatorische Massnahmen zur Beherrschung von Risiken fuer die Sicherheit der Netz- und Informationssysteme.', action_href: '/unternehmen/risikoanalyse', action_label: 'Risikoanalyse starten', sort_order: 0 },
      { section: '§30 (2)', title: 'Konzepte fuer Risikoanalyse', description: 'Konzepte in Bezug auf die Risikoanalyse und Sicherheit fuer Informationssysteme.', action_href: '/unternehmen/risikoanalyse', action_label: 'Risikoanalyse', sort_order: 1 },
      { section: '§30 (2)', title: 'Bewaeltigung von Sicherheitsvorfaellen', description: 'Massnahmen zur Erkennung, Analyse, Eindaemmung und Reaktion auf Sicherheitsvorfaelle.', action_href: '/unternehmen/szenarien', action_label: 'Szenarien definieren', sort_order: 2 },
      { section: '§30 (2)', title: 'Business Continuity & Krisenmanagement', description: 'Aufrechterhaltung des Betriebs wie Backup-Management, Wiederherstellung nach einem Notfall und Krisenmanagement.', action_href: '/unternehmen/bia', action_label: 'BIA erstellen', sort_order: 3 },
      { section: '§30 (2)', title: 'Sicherheit der Lieferkette', description: 'Sicherheit der Lieferkette einschliesslich sicherheitsbezogener Aspekte der Beziehungen zwischen den einzelnen Einrichtungen und ihren unmittelbaren Anbietern.', action_href: '/unternehmen/lieferketten', action_label: 'Lieferketten erfassen', sort_order: 4 },
      { section: '§30 (2)', title: 'Schulungen & Sensibilisierung', description: 'Schulungen im Bereich der Cybersicherheit. Grundlegende Verfahren der Cyberhygiene.', action_href: '/unternehmen/uebungen', action_label: 'Uebung planen', sort_order: 5 },
      { section: '§32', title: 'Meldepflichten', description: 'Erhebliche Sicherheitsvorfaelle binnen 24h Erstmeldung, 72h Folgemeldung, 1 Monat Abschlussbericht an BSI.', action_href: '/unternehmen/alarmierung', action_label: 'Meldewege einrichten', sort_order: 6 },
      { section: '§33', title: 'Registrierung beim BSI', description: 'Registrierung ueber das BSI-Melde- und Informationsportal (MIP). Frist: 06.03.2026.', sort_order: 7 },
      { section: '§38', title: 'Geschaeftsleitungs-Billigung', description: 'Geschaeftsleitung muss Risikomanagement-Massnahmen billigen und deren Umsetzung ueberwachen. Persoenliche Haftung.', sort_order: 8 },
      { section: '§38 (3)', title: 'Schulung der Geschaeftsleitung', description: 'Geschaeftsleitungen muessen regelmaessig an Schulungen teilnehmen.', action_href: '/unternehmen/uebungen', action_label: 'Schulung planen', sort_order: 9 },
    ],
  },
  {
    framework_type: 'kritis_dachg',
    label: 'KRITIS-Dachgesetz',
    shortLabel: 'KRITIS-DachG',
    iconKey: 'landmark',
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    deadline: 'Registrierung bis Juli 2026',
    description: 'Physische Resilienz fuer Betreiber kritischer Infrastrukturen. All-Gefahren-Ansatz.',
    requirements: [
      { section: '§10', title: 'Registrierung als KRITIS-Betreiber', description: 'Registrierung beim BBK als Betreiber kritischer Anlage. Frist: 6 Monate nach Inkrafttreten.', sort_order: 0 },
      { section: '§11', title: 'Risikoanalyse (All-Gefahren-Ansatz)', description: 'Systematische Risikoanalyse aller relevanten Risiken inkl. Naturkatastrophen, menschliches Versagen, Sabotage, Terrorismus. Alle 4 Jahre oder anlassbezogen.', action_href: '/unternehmen/risikoanalyse', action_label: 'Risikoanalyse', sort_order: 1 },
      { section: '§12', title: 'Resilienzplan erstellen', description: 'Massnahmenplan zur Vermeidung, Abmilderung und Bewaeltigung von Stoerungen. Klare Zustaendigkeiten und Kommunikationswege.', action_href: '/unternehmen/handbuch', action_label: 'BCM-Handbuch', sort_order: 2 },
      { section: '§12', title: 'Physische Sicherheitsmassnahmen', description: 'Zugangskontrollen, Ueberwachung, Notstromversorgung, bauliche Massnahmen.', action_href: '/unternehmen/kritis', action_label: 'KRITIS-Standorte', sort_order: 3 },
      { section: '§12', title: 'Personelle Massnahmen', description: 'Schulungen, Zuverlaessigkeitspruefungen, Notfallpersonal, Stellvertretungen.', action_href: '/unternehmen/alarmierung/krisenstab', action_label: 'Krisenstab', sort_order: 4 },
      { section: '§14', title: 'Meldung erheblicher Stoerungen', description: 'Meldung an BBK bei Stoerungen die erhebliche Auswirkungen auf die Erbringung wesentlicher Dienste haben.', action_href: '/unternehmen/alarmierung', action_label: 'Meldewege', sort_order: 5 },
      { section: '§12', title: 'Regelmaessige Uebungen', description: 'Regelmaessige Tests und Uebungen zur Ueberpruefung der Wirksamkeit der Resilienz-Massnahmen.', action_href: '/unternehmen/uebungen', action_label: 'Uebung planen', sort_order: 6 },
      { section: '§12', title: 'Wiederherstellungsmassnahmen', description: 'Massnahmen und Plaene fuer die Wiederherstellung nach einem Vorfall.', action_href: '/unternehmen/bia', action_label: 'BIA (RTO/RPO)', sort_order: 7 },
    ],
  },
  {
    framework_type: 'iso_22301',
    label: 'ISO 22301:2019',
    shortLabel: 'ISO 22301',
    iconKey: 'bookOpen',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    deadline: 'Zertifizierung freiwillig',
    description: 'Internationaler Standard fuer Business Continuity Management Systeme (BCMS).',
    requirements: [
      { section: '4', title: 'Kontext der Organisation', description: 'Verstehen der Organisation und ihres Kontexts, der Erfordernisse und Erwartungen interessierter Parteien.', sort_order: 0 },
      { section: '5', title: 'Fuehrung & Verpflichtung', description: 'Top-Management demonstriert Fuehrung und Verpflichtung zum BCMS. BCM-Politik festlegen.', sort_order: 1 },
      { section: '6', title: 'Planung (Risiken & Chancen)', description: 'Massnahmen zum Umgang mit Risiken und Chancen. BCM-Ziele festlegen.', action_href: '/unternehmen/risikoanalyse', action_label: 'Risikoanalyse', sort_order: 2 },
      { section: '7', title: 'Unterstuetzung (Ressourcen)', description: 'Notwendige Ressourcen, Kompetenzen, Bewusstsein, Kommunikation, dokumentierte Informationen.', sort_order: 3 },
      { section: '8.2', title: 'Business Impact Analyse', description: 'Analyse der Auswirkungen von Betriebsunterbrechungen. RTO, RPO, MTPD bestimmen.', action_href: '/unternehmen/bia', action_label: 'BIA erstellen', sort_order: 4 },
      { section: '8.3', title: 'Risikobewertung', description: 'Risiken identifizieren, analysieren und bewerten die zu Betriebsunterbrechungen fuehren koennen.', action_href: '/unternehmen/risikoanalyse', action_label: 'Risikoanalyse', sort_order: 5 },
      { section: '8.4', title: 'BC-Strategien & Loesungen', description: 'Strategien und Loesungen zur Erreichung der Wiederherstellungsziele waehlen.', action_href: '/unternehmen/handbuch', action_label: 'BCM-Handbuch', sort_order: 6 },
      { section: '8.5', title: 'BC-Plaene & -Verfahren', description: 'Business-Continuity-Plaene erstellen. Notfallverfahren dokumentieren.', action_href: '/unternehmen/szenarien', action_label: 'Szenarien', sort_order: 7 },
      { section: '8.6', title: 'Uebungen & Tests', description: 'BC-Plaene und -Verfahren ueberpruefen und validieren durch Uebungen und Tests.', action_href: '/unternehmen/uebungen', action_label: 'Uebung planen', sort_order: 8 },
      { section: '9', title: 'Bewertung der Leistung', description: 'Ueberwachung, Messung, Analyse. Interne Audits. Managementbewertung.', sort_order: 9 },
      { section: '10', title: 'Verbesserung', description: 'Nichtkonformitaeten und Korrekturmassnahmen. Fortlaufende Verbesserung des BCMS.', sort_order: 10 },
    ],
  },
]
