import { KAPITEL_CONFIG } from '@/data/kapitel-config'
import type { KrisenhandbuchKapitelV3, KapitelChecklistItem } from '@/types/database'

function cl(items: string[]): KapitelChecklistItem[] {
  return items.map((text, i) => ({
    id: `cl-${i + 1}`,
    text,
    status: 'open' as const,
    notiz: '',
    completed_at: null,
  }))
}

/**
 * BSI/BBK-konforme Template-Inhalte fuer die 12 Kapitel.
 * Jedes Kapitel bekommt eine Struktur-Vorlage mit Platzhaltern,
 * die der Landkreis individuell ausfuellen kann.
 */
const KAPITEL_TEMPLATES: Record<string, { inhalt: string; checkliste: string[] }> = {
  einleitung: {
    inhalt: `<h2>Zweck und Geltungsbereich</h2>
<p>Dieses Krisenhandbuch regelt die Organisation und die Ablaeufe der Krisenbewaeltigung im Landkreis. Es dient als verbindliche Handlungsgrundlage fuer alle beteiligten Stellen.</p>
<h3>Geltungsbereich</h3>
<p>Das Handbuch gilt fuer alle Organisationseinheiten des Landkreises sowie fuer die im Katastrophenschutz mitwirkenden Organisationen.</p>
<h3>Rechtsgrundlagen</h3>
<ul><li>Katastrophenschutzgesetz des Landes</li><li>Zivilschutz- und Katastrophenhilfegesetz (ZSKG)</li><li>BSI-Standard 100-4 / 200-4</li></ul>
<h3>Verteilerliste</h3>
<p><em>Hier die Empfaenger des Handbuchs eintragen (Krisenstab, Feuerwehr, THW, DRK, etc.)</em></p>`,
    checkliste: [
      'Geltungsbereich definiert',
      'Rechtsgrundlagen geprueft',
      'Verteilerliste erstellt',
      'Freigabe durch Landrat eingeholt',
    ],
  },
  dokumentenmanagement: {
    inhalt: `<h2>Versionierung und Pflege</h2>
<p>Das Krisenhandbuch wird mindestens jaehrlich aktualisiert. Aenderungen werden dokumentiert und allen Empfaengern mitgeteilt.</p>
<h3>Aenderungshistorie</h3>
<p><em>Hier werden alle Aenderungen mit Datum, Autor und Beschreibung dokumentiert.</em></p>
<h3>Dokumentenablage</h3>
<p>Alle krisenbezogenen Dokumente werden zentral abgelegt und sind fuer berechtigte Personen jederzeit zugaenglich.</p>`,
    checkliste: [
      'Versionsnummer aktuell',
      'Aenderungshistorie gefuehrt',
      'Jaehrliche Ueberpruefung terminiert',
      'Digitale und analoge Ablage gesichert',
    ],
  },
  krisenorganisation: {
    inhalt: `<h2>Krisenstab</h2>
<p>Der Krisenstab ist das zentrale Fuehrungs- und Koordinierungsgremium. Er wird bei Eintritt eines Krisenereignisses aktiviert.</p>
<h3>Zusammensetzung</h3>
<ul><li>Leitung: Landrat / Stellvertreter</li><li>S1 – Personal/Innerer Dienst</li><li>S2 – Lage</li><li>S3 – Einsatz</li><li>S4 – Versorgung</li><li>S5 – Presse/Medien</li><li>S6 – IT/Kommunikation</li></ul>
<h3>Geschaeftsordnung</h3>
<p><em>Regeln fuer Sitzungen, Entscheidungsfindung und Protokollierung hier ergaenzen.</em></p>`,
    checkliste: [
      'Krisenstab-Mitglieder benannt',
      'Stellvertreter fuer alle Funktionen',
      'Kontaktdaten aktuell (24/7)',
      'Geschaeftsordnung verabschiedet',
    ],
  },
  aktivierung: {
    inhalt: `<h2>Alarmierungsstufen</h2>
<h3>Stufe 1 – Vorwarnung</h3>
<p>Erhoehte Aufmerksamkeit, Lagebeobachtung, Erreichbarkeit sicherstellen.</p>
<h3>Stufe 2 – Teilaktivierung</h3>
<p>Krisenstab wird teilweise aktiviert, erste Massnahmen eingeleitet.</p>
<h3>Stufe 3 – Vollaktivierung</h3>
<p>Vollstaendige Aktivierung des Krisenstabs, Katastrophenalarm.</p>
<h3>Aktivierungskriterien</h3>
<p><em>Hier definieren, welche Ereignisse welche Stufe ausloesen (z.B. Pegelstaende, Windgeschwindigkeiten, NINA-Warnungen).</em></p>`,
    checkliste: [
      'Alarmierungsstufen definiert',
      'Aktivierungskriterien festgelegt',
      'Alarmierungswege getestet',
      'Erreichbarkeit 24/7 sichergestellt',
    ],
  },
  lagefuehrung: {
    inhalt: `<h2>Lagebild und Lagedarstellung</h2>
<p>Ein aktuelles Lagebild ist die Grundlage jeder Krisenstab-Entscheidung.</p>
<h3>Lageerfassung</h3>
<ul><li>Meldungen aus dem Einsatzgebiet</li><li>Wetterdienst (DWD)</li><li>Warnsysteme (NINA, KATWARN)</li><li>Pegelstaende und Messwerte</li></ul>
<h3>Lagebericht</h3>
<p>Regelmaessige Lageberichte (mind. alle 2 Stunden) mit: Lage, Entwicklung, Massnahmen, Bedarf.</p>`,
    checkliste: [
      'Lageerfassung eingerichtet',
      'Lagebericht-Rhythmus festgelegt',
      'Lagekarte vorbereitet',
      'Meldewege definiert',
    ],
  },
  alarmierung_kommunikation: {
    inhalt: `<h2>Warn- und Informationsketten</h2>
<h3>Interne Alarmierung</h3>
<p>Alarmierung des Krisenstabs ueber definierte Kanaele (Telefon, E-Mail, Funk, Messenger).</p>
<h3>Bevoelkerungswarnung</h3>
<ul><li>NINA-App / MoWaS</li><li>Sirenen (wenn vorhanden)</li><li>Lautsprecherdurchsagen</li><li>Social Media und Website</li></ul>
<h3>Pressemitteilungen</h3>
<p><em>Vorlagen fuer Pressemitteilungen und Social-Media-Posts hier hinterlegen.</em></p>`,
    checkliste: [
      'Alarmierungsketten dokumentiert',
      'NINA/MoWaS Zugang geprueft',
      'Sirenennetz funktionstuechtich',
      'Pressevorlagen vorbereitet',
      'Social-Media-Strategie definiert',
    ],
  },
  ressourcenmanagement: {
    inhalt: `<h2>Material und Personal</h2>
<h3>Materialbestaende</h3>
<p>Uebersicht der vorhandenen Einsatzmittel und Materialreserven. Regelmaessige Inventur durchfuehren.</p>
<h3>Personalplanung</h3>
<p>Schichtplanung fuer Dauereinsaetze, Abloesung und Ruhezeiten beruecksichtigen.</p>
<h3>Externe Ressourcen</h3>
<p><em>Vereinbarungen mit Nachbarlandkreisen, THW, Bundeswehr, privaten Dienstleistern hier dokumentieren.</em></p>`,
    checkliste: [
      'Materialliste aktuell (Inventar)',
      'Lagerstandorte dokumentiert',
      'Schichtplan-Vorlage erstellt',
      'Amtshilfe-Vereinbarungen aktuell',
    ],
  },
  schutz_kritischer_funktionen: {
    inhalt: `<h2>Kritische Infrastrukturen (KRITIS)</h2>
<p>Identifikation und Schutz der kritischen Infrastrukturen im Landkreis.</p>
<h3>KRITIS-Sektoren</h3>
<ul><li>Energie (Strom, Gas, Fernwaerme)</li><li>Wasser (Trinkwasser, Abwasser)</li><li>Gesundheit (Krankenhaeuser, Pflegeheime)</li><li>IT/Telekommunikation</li><li>Transport/Verkehr</li><li>Ernaehrung</li></ul>
<h3>Schutzmassnahmen</h3>
<p><em>Fuer jede KRITIS-Einrichtung: Kontaktdaten, Notfallplaene, Notstromversorgung dokumentieren.</em></p>`,
    checkliste: [
      'KRITIS-Objekte erfasst',
      'Kontaktdaten der Betreiber aktuell',
      'Notfallplaene der Betreiber eingeholt',
      'Notstromversorgung geprueft',
    ],
  },
  notfallarbeitsplaetze: {
    inhalt: `<h2>Ausweichstandorte</h2>
<p>Fuer den Fall, dass das Rathaus/Landratsamt nicht nutzbar ist, sind Ausweichstandorte definiert.</p>
<h3>Primaerer Ausweichstandort</h3>
<p><em>Adresse, Ausstattung, Zugangsregelung hier eintragen.</em></p>
<h3>Sekundaerer Ausweichstandort</h3>
<p><em>Adresse, Ausstattung, Zugangsregelung hier eintragen.</em></p>
<h3>Technische Ausstattung</h3>
<p>Jeder Ausweichstandort muss mindestens verfuegen ueber: Internetanschluss, Telefon, Notstrom, Beamer/Bildschirm fuer Lagebild.</p>`,
    checkliste: [
      'Ausweichstandorte definiert',
      'Schluessel/Zugang geregelt',
      'IT-Ausstattung vorhanden',
      'Notstromversorgung sichergestellt',
    ],
  },
  wiederherstellung: {
    inhalt: `<h2>Rueckkehr zum Normalbetrieb</h2>
<p>Nach Bewaeltigung der akuten Krise wird der Normalbetrieb schrittweise wiederhergestellt.</p>
<h3>Priorisierung</h3>
<ol><li>Lebensrettung und Gefahrenabwehr (abgeschlossen)</li><li>Versorgung der Bevoelkerung</li><li>Wiederherstellung der Infrastruktur</li><li>Normalbetrieb der Verwaltung</li></ol>
<h3>Deaktivierung des Krisenstabs</h3>
<p>Der Krisenstab wird deaktiviert, wenn die akute Gefahr beseitigt ist. Die Entscheidung trifft die Leitung.</p>`,
    checkliste: [
      'Priorisierung der Wiederherstellung',
      'Infrastruktur-Schaeden erfasst',
      'Deaktivierungskriterien definiert',
      'Uebergabe an Regelbetrieb geplant',
    ],
  },
  dokumentation: {
    inhalt: `<h2>Einsatzdokumentation</h2>
<p>Alle Massnahmen, Entscheidungen und Lageentwicklungen werden lueckenlos dokumentiert.</p>
<h3>Einsatztagebuch</h3>
<p>Chronologische Erfassung aller relevanten Ereignisse mit Zeitstempel.</p>
<h3>Entscheidungsdokumentation</h3>
<p>Jede Entscheidung des Krisenstabs wird mit Begruendung und Abstimmungsergebnis festgehalten.</p>
<h3>Medienberichterstattung</h3>
<p>Relevante Medienberichte werden gesammelt und archiviert.</p>`,
    checkliste: [
      'Einsatztagebuch gefuehrt',
      'Entscheidungen dokumentiert',
      'Fotos/Videos gesichert',
      'Medienberichte gesammelt',
    ],
  },
  nachbereitung: {
    inhalt: `<h2>Lessons Learned</h2>
<p>Nach jeder Krise und nach jeder Uebung wird eine strukturierte Nachbereitung durchgefuehrt.</p>
<h3>Nachbesprechung (Hot Wash-Up)</h3>
<p>Unmittelbar nach dem Einsatz: Was lief gut? Was muss verbessert werden?</p>
<h3>Detailauswertung</h3>
<p>Innerhalb von 4 Wochen: Systematische Analyse aller Aspekte, Massnahmenplan erstellen.</p>
<h3>Umsetzung</h3>
<p>Erkenntnisse in das Handbuch einarbeiten, Schulungen anpassen, Material nachbeschaffen.</p>`,
    checkliste: [
      'Hot Wash-Up durchgefuehrt',
      'Detailauswertung erstellt',
      'Massnahmenplan abgeleitet',
      'Handbuch aktualisiert',
      'Naechste Uebung geplant',
    ],
  },
}

/**
 * Erzeugt 12 BSI/BBK-Kapitel mit Template-Inhalten fuer ein neues Landkreis-Krisenhandbuch.
 * Nutzt KAPITEL_CONFIG als Single Source of Truth.
 */
export function createEmptyHandbuchKapitel(): KrisenhandbuchKapitelV3[] {
  return KAPITEL_CONFIG.map(cfg => {
    const template = KAPITEL_TEMPLATES[cfg.key]
    return {
      id: `kap-${cfg.nummer}`,
      nummer: cfg.nummer,
      key: cfg.key,
      titel: cfg.titel,
      inhalt: template?.inhalt ?? '',
      checkliste: template ? cl(template.checkliste) : [],
    }
  })
}
