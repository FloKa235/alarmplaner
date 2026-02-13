import type { TabContent } from '@/types'

export const landingContent: Record<string, TabContent> = {
  kommunen: {
    hero: {
      badge: 'Kommunales Krisenmanagement neu gedacht',
      headlineParts: [
        { text: 'Krisenmanagement.\n' },
        { text: 'Einfach.', color: 'orange' },
        { text: ' ' },
        { text: 'Sicher.', color: 'blue' },
        { text: ' Digital.' },
      ],
      subline:
        'Die All-in-One Plattform für kommunales Krisenmanagement – von der Risikoanalyse bis zur Alarmierung',
      primaryCta: 'Kostenlos testen →',
      secondaryCta: 'Demo anfragen',
      trustBadges: ['🇩🇪 Made in Germany', '🔒 DSGVO-konform'],
    },
    challenges: {
      title: 'Kommunen stehen vor großen Herausforderungen',
      subtitle:
        'In einer Welt mit zunehmenden Krisen brauchen Gemeinden moderne Werkzeuge, um ihre Bürger zu schützen.',
      items: [
        { icon: 'flame', title: 'Klimawandel erhöht Risiken', description: 'Extremwetterereignisse nehmen zu und stellen Kommunen vor nie dagewesene Herausforderungen.' },
        { icon: 'layers', title: 'Fragmentierte Systeme', description: 'Verschiedene Abteilungen nutzen unterschiedliche Tools – Koordination wird zum Alptraum.' },
        { icon: 'clock', title: 'Langsame Reaktionszeiten', description: 'Manuelle Prozesse kosten wertvolle Zeit, wenn jede Minute zählt.' },
        { icon: 'eye', title: 'Fehlende Übersicht', description: 'Ohne zentrale Plattform fehlt der Gesamtüberblick über Risiken und Ressourcen.' },
      ],
    },
    features: {
      title: 'Alles, was Ihre Kommune braucht',
      subtitle: 'Von der Prävention bis zur Nachbereitung – Alarmplaner deckt den gesamten Krisenzyklus ab.',
      items: [
        { icon: 'chart-network', title: 'KI-gestützte Risikoanalyse', description: 'Automatische Bewertung von Krisenszenarien mit Integration von DWD-Wetterdaten, Pegelständen und NINA-Warnungen.' },
        { icon: 'file-chart', title: 'Krisenszenarien-Management', description: 'Vordefinierte Szenarien für Hochwasser, Stromausfall, Cyberangriff und mehr – individuell anpassbar.' },
        { icon: 'package-check', title: 'Inventar & Ressourcen', description: 'Echtzeit-Bestandsübersicht mit automatischen Warnungen bei niedrigen Beständen und Ablaufdatum-Tracking.' },
        { icon: 'bell-ring', title: 'Alarmierungssystem', description: 'Multi-Kanal-Alarmierung über Push, SMS und E-Mail mit Eskalationsstufen und Vorlagen.' },
        { icon: 'map-pin', title: 'Interaktive Standortkarte', description: 'Visualisierung aller Risiken, Ressourcen und kritischen Infrastrukturen auf einer Karte.' },
        { icon: 'users', title: 'Personalverwaltung', description: 'Einsatzkräfte, Kontakte und Zuständigkeiten zentral verwalten mit Verfügbarkeitsstatus.' },
        { icon: 'coins', title: 'Fördermittel-Matching', description: 'Automatischer Abgleich mit verfügbaren Förderprogrammen für Katastrophenschutz.' },
        { icon: 'wifi-off', title: 'Offline-Modus (PWA)', description: 'Voller Zugriff auf kritische Daten auch ohne Internetverbindung – als installierbare Web-App.' },
      ],
    },
    benefits: {
      title: 'Warum Alarmplaner?',
      subtitle: 'Entdecken Sie die Vorteile, die Ihre Kommune auf ein neues Level heben.',
      items: [
        { icon: 'clock', stat: '70%', title: 'Zeitersparnis', description: 'Bis zu 70% schnellere Reaktionszeiten im Krisenfall' },
        { icon: 'grid', stat: '1', statSub: 'Plattform', title: 'Übersicht', description: 'Alle Daten und Ressourcen an einem zentralen Ort' },
        { icon: 'cpu', stat: '24/7', title: 'KI-Power', description: 'Intelligente Analysen und automatische Empfehlungen' },
        { icon: 'shield', stat: '100%', title: 'Sicherheit', description: 'DSGVO-konform mit Hosting in Deutschland' },
        { icon: 'smartphone', stat: '3', statSub: 'Plattformen', title: 'Überall verfügbar', description: 'Web, Mobile und Offline-Modus' },
        { icon: 'refresh', stat: '∞', title: 'Immer aktuell', description: 'Automatische Updates ohne Unterbrechung' },
      ],
    },
    testimonials: {
      title: 'Das sagen unsere Pilotkommunen',
      items: [
        { quote: 'Mit Alarmplaner haben wir unsere Reaktionszeit bei Hochwasserwarnungen um 60% verkürzt. Das Dashboard gibt uns endlich den Überblick, den wir brauchen.', name: 'Dr. Thomas Bergmann', role: 'Bürgermeister', org: 'Gemeinde Waldkirchen (8.500 Einwohner)', initials: 'TB' },
        { quote: 'Die Integration mit DWD-Wetterdaten und NINA ist ein Gamechanger. Wir werden automatisch gewarnt und können sofort handeln.', name: 'Maria Schuster', role: 'Leiterin Katastrophenschutz', org: 'Kreisstadt Oberland (42.000 Einwohner)', initials: 'MS' },
        { quote: 'Endlich eine Software, die auch offline funktioniert. Im Einsatz ist das unbezahlbar. Die DSGVO-Konformität war für unsere IT-Abteilung entscheidend.', name: 'Stefan Huber', role: 'IT-Leiter', org: 'Stadt Neuburg (95.000 Einwohner)', initials: 'SH' },
      ],
    },
    pricing: {
      title: 'Individuelle Lösung für Ihre Kommune',
      subtitle: 'Maßgeschneiderte Lizenzierung inklusive Onboarding, Schulung und Support.',
      plans: [
        {
          label: 'Kommunen',
          price: 'Auf Anfrage',
          features: ['KI-Risikoanalyse in Echtzeit', 'Automatische Krisenszenarien', 'Inventar Soll/Ist-Vergleich', 'Mehrstufige Alarmierung', 'Interaktive Risikokarte', 'KRITIS-Infrastruktur-Übersicht', 'Dokument-Upload & KI-Analyse', 'Dedizierter Support'],
          cta: 'Demo anfragen',
          highlighted: true,
        },
      ],
    },
    faq: [
      { question: 'Ist die Plattform DSGVO-konform?', answer: 'Ja. Alle Daten liegen auf deutschen Servern (Hetzner). Wir nutzen Self-hosted Supabase und EU-basierte KI (Langdock). Keine Daten verlassen die EU.' },
      { question: 'Welche Datenquellen werden genutzt?', answer: 'DWD (Wetterwarnungen), NINA (Bevölkerungswarnungen), Pegelonline (Wasserstände), OpenStreetMap (KRITIS-Infrastruktur) und weitere offizielle Quellen.' },
      { question: 'Kann ich die KI-generierten Pläne bearbeiten?', answer: 'Ja. Alle Szenarien und Handlungspläne sind vollständig editierbar. Die KI liefert den Entwurf, Sie behalten die Kontrolle.' },
      { question: 'Wie lange dauert die Einrichtung?', answer: 'Die Grundeinrichtung dauert ca. 1-2 Stunden. Gemeinden und KRITIS werden automatisch importiert. Volle Funktionalität ab Tag 1.' },
      { question: 'Gibt es eine BSI-Zertifizierung?', answer: 'Wir orientieren uns am BSI-Grundschutz und arbeiten aktiv an einer Zertifizierung. Die Plattform erfüllt bereits hohe Sicherheitsstandards.' },
    ],
    ctaBanner: {
      headline: 'Bevölkerungsschutz. Neu gedacht.',
      subline: 'Erfahren Sie in einer persönlichen Demo, wie Alarmplaner PRO Ihren Landkreis unterstützt.',
      cta: 'Demo anfragen',
    },
  },

  unternehmen: {
    hero: {
      badge: 'Betriebliches Krisenmanagement',
      headlineParts: [
        { text: 'Krisenmanagement.\n' },
        { text: 'Professionell.', color: 'orange' },
        { text: ' ' },
        { text: 'Sicher.', color: 'blue' },
        { text: ' Skalierbar.' },
      ],
      subline: 'KI-gestütztes Business Continuity Management: Risikoanalyse, Notfallpläne, Ressourcen-Check und Alarmierung.',
      primaryCta: 'Kostenlos testen →',
      secondaryCta: 'Demo anfragen',
      trustBadges: ['🇩🇪 Made in Germany', '🔒 DSGVO-konform', '📋 ISO 22301'],
    },
    challenges: {
      title: 'Unternehmen unterschätzen Krisenrisiken',
      subtitle: 'Ohne professionelles BCM riskieren Sie Betriebsausfälle, Reputationsschäden und Compliance-Verstöße.',
      items: [
        { icon: 'flame', title: 'Steigende Bedrohungslage', description: 'Cyberangriffe, Lieferkettenprobleme und Extremwetter bedrohen die Betriebskontinuität.' },
        { icon: 'layers', title: 'Regulatorischer Druck', description: 'KRITIS-Verordnung, NIS2 und ISO 22301 erfordern dokumentierte Notfallplanung.' },
        { icon: 'clock', title: 'Manuelle Prozesse', description: 'Excel-Listen und Papier-Pläne sind im Ernstfall zu langsam und fehleranfällig.' },
        { icon: 'eye', title: 'Fehlende Transparenz', description: 'Ohne zentrale Übersicht bleiben Risiken und Ressourcenlücken unentdeckt.' },
      ],
    },
    features: {
      title: 'Alles für Ihr BCM',
      subtitle: 'Von der Risikoanalyse bis zur Krisennachbereitung – eine Plattform für alle Anforderungen.',
      items: [
        { icon: 'chart-network', title: 'Risikoanalyse', description: 'Automatische Risikobewertung für alle Standorte mit Wetter-, Infrastruktur- und Lieferkettendaten.' },
        { icon: 'file-chart', title: 'Notfallpläne', description: 'KI-generierte Notfall- und Evakuierungspläne für verschiedene Szenarien. ISO 22301 konform.' },
        { icon: 'package-check', title: 'Ressourcen-Check', description: 'Soll/Ist-Vergleich für Notfallausrüstung, Ersthelfer und Krisenteams. Lücken sofort erkennen.' },
        { icon: 'bell-ring', title: 'Alarmierung', description: 'Mehrstufige Alarmketten für Krisenteams per E-Mail, SMS und Push mit Eskalation.' },
        { icon: 'map-pin', title: 'Standort-Management', description: 'Alle Standorte auf einer Karte mit individueller Risikoanalyse und Notfallplänen.' },
        { icon: 'users', title: 'Krisenteam-Verwaltung', description: 'Rollen, Zuständigkeiten und Erreichbarkeit aller Krisenteam-Mitglieder zentral verwalten.' },
        { icon: 'file-text', title: 'BCM-Dokumentation', description: 'Automatische Generierung von Compliance-Dokumenten, Audit-Trails und Reports.' },
        { icon: 'wifi-off', title: 'Offline-Modus (PWA)', description: 'Kritische Notfallpläne auch ohne Internet verfügbar – als installierbare Web-App.' },
      ],
    },
    benefits: {
      title: 'Warum Alarmplaner?',
      subtitle: 'Entdecken Sie die Vorteile für Ihr Unternehmen.',
      items: [
        { icon: 'clock', stat: '70%', title: 'Zeitersparnis', description: 'Schnellere Krisenreaktion durch automatisierte Prozesse' },
        { icon: 'grid', stat: '1', statSub: 'Plattform', title: 'Alles zentral', description: 'BCM, Notfallpläne und Alarmierung in einer Lösung' },
        { icon: 'cpu', stat: '24/7', title: 'KI-Power', description: 'Automatische Risikoanalysen und Handlungsempfehlungen' },
        { icon: 'shield', stat: '100%', title: 'Compliance', description: 'DSGVO, ISO 22301 und KRITIS-konform' },
        { icon: 'smartphone', stat: '∞', statSub: 'Standorte', title: 'Skalierbar', description: 'Von einem Standort bis zum globalen Konzern' },
        { icon: 'refresh', stat: '30', statSub: 'Tage', title: 'Kostenlos testen', description: 'Voller Funktionsumfang ohne Risiko' },
      ],
    },
    testimonials: {
      title: 'Das sagen unsere Kunden',
      items: [
        { quote: 'Alarmplaner hat unser BCM auf ein neues Level gehoben. Die KI-generierten Notfallpläne sparen uns Wochen an Arbeit.', name: 'Dr. Lisa Weber', role: 'Head of Risk Management', org: 'TechCorp GmbH (2.500 MA)', initials: 'LW' },
        { quote: 'Endlich eine Lösung die ISO 22301 und DSGVO unter einen Hut bringt. Das Audit lief damit problemlos.', name: 'Michael Kraft', role: 'CISO', org: 'IndustrieWerke AG (8.000 MA)', initials: 'MK' },
        { quote: 'Die Multi-Standort-Verwaltung ist genau das, was wir gebraucht haben. Jeder Standort hat eigene Risikoprofile und Pläne.', name: 'Sandra Müller', role: 'Leiterin Facility Management', org: 'LogistikPlus GmbH (1.200 MA)', initials: 'SM' },
      ],
    },
    pricing: {
      title: 'Transparent & fair',
      subtitle: 'Professionelles Krisenmanagement für Ihr Unternehmen. Skalierbar nach Standorten und Mitarbeitern.',
      plans: [
        {
          label: 'Starter',
          price: '99 €',
          period: 'Monat',
          features: ['1 Standort', 'KI-Risikoanalyse', 'Basis-Notfallpläne', 'E-Mail-Alarmierung', 'Community-Support'],
          cta: 'Kostenlos testen',
        },
        {
          label: 'Business',
          price: '299 €',
          period: 'Monat',
          features: ['Alle Starter-Features', 'Bis zu 10 Standorte', 'Erweiterte Notfallpläne', 'Multi-Kanal-Alarmierung', 'BCM-Dokumentation (ISO 22301)', 'API-Zugang', 'Prioritäts-Support'],
          cta: 'Kostenlos testen',
          highlighted: true,
        },
        {
          label: 'Enterprise',
          price: 'Individuell',
          features: ['Alle Business-Features', 'Unbegrenzte Standorte', 'Dedizierter Account Manager', 'Custom Integrationen', 'SLA-Garantie', 'On-Premise Option', 'Schulung & Onboarding'],
          cta: 'Demo anfragen',
        },
      ],
    },
    faq: [
      { question: 'Ist Alarmplaner ISO 22301 konform?', answer: 'Die Plattform unterstützt Sie bei der Umsetzung von ISO 22301. Generierte Pläne und Dokumentation orientieren sich am Standard.' },
      { question: 'Können mehrere Standorte verwaltet werden?', answer: 'Ja. Sie können beliebig viele Standorte anlegen, jeweils mit eigener Risikoanalyse und eigenen Notfallplänen.' },
      { question: 'Wie funktioniert die Integration?', answer: 'Über unsere API können Sie Alarmplaner in bestehende IT-Landschaften integrieren. CSV/Excel-Import für Bestandsdaten ist ebenfalls möglich.' },
      { question: 'Gibt es eine Testphase?', answer: 'Ja, wir bieten eine 30-tägige kostenlose Testphase mit vollem Funktionsumfang. Keine Kreditkarte nötig.' },
      { question: 'Wo werden die Daten gespeichert?', answer: 'Alle Daten liegen auf deutschen Servern (Hetzner). DSGVO-konform, verschlüsselt und mit regelmäßigen Backups.' },
    ],
    ctaBanner: {
      headline: 'Bereit für den Ernstfall?',
      subline: 'Testen Sie Alarmplaner PRO 30 Tage kostenlos und machen Sie Ihr Unternehmen krisenfest.',
      cta: 'Kostenlos testen →',
    },
  },

  privat: {
    hero: {
      badge: 'Für Familien & Haushalte',
      headlineParts: [
        { text: 'Deine Familie.\n' },
        { text: 'Gut', color: 'orange' },
        { text: ' ' },
        { text: 'vorbereitet.', color: 'blue' },
        { text: ' Immer.' },
      ],
      subline: 'Lokale Warnungen in Echtzeit, persönlicher Notfallplan und KI-generierte Checklisten – kostenlos.',
      primaryCta: 'Kostenlos starten →',
      trustBadges: ['🇩🇪 Made in Germany', '🔒 DSGVO-konform', '💯 100% kostenlos'],
    },
    challenges: {
      title: 'Bist du wirklich vorbereitet?',
      subtitle: 'Die meisten Haushalte sind nicht auf Krisen vorbereitet – dabei kann Vorsorge Leben retten.',
      items: [
        { icon: 'flame', title: 'Extremwetter nimmt zu', description: 'Stürme, Hochwasser und Hitzewellen treffen immer häufiger auch deine Region.' },
        { icon: 'layers', title: 'Informationsflut', description: 'Zu viele Quellen, zu wenig Überblick – relevante Warnungen gehen unter.' },
        { icon: 'clock', title: 'Keine Zeit für Vorsorge', description: 'Im Alltag kommt Krisenvorsorge oft zu kurz. Ein Plan fehlt, wenn er gebraucht wird.' },
        { icon: 'eye', title: 'Wissen fehlt', description: 'Was brauche ich im Notfall? Wohin gehe ich? Die meisten wissen es nicht.' },
      ],
    },
    features: {
      title: 'Dein persönlicher Schutzschild',
      subtitle: 'Alles, was du für die Notfallvorsorge brauchst – in einer App.',
      items: [
        { icon: 'bell-ring', title: 'Lokale Warnungen', description: 'Wetter, Hochwasser und Katastrophenwarnungen in Echtzeit für deinen Standort.' },
        { icon: 'file-chart', title: 'Vorrats-Checkliste', description: 'KI-generierte Checkliste basierend auf BBK-Empfehlungen, angepasst an deinen Haushalt.' },
        { icon: 'package-check', title: 'Persönlicher Notfallplan', description: 'Treffpunkte, Kontakte, wichtige Dokumente – alles an einem Ort.' },
        { icon: 'wifi-off', title: 'Offline-Modus', description: 'Dein Notfallplan ist auch ohne Internet verfügbar. Genau dann, wenn du ihn brauchst.' },
      ],
    },
    benefits: {
      title: 'Warum Alarmplaner?',
      subtitle: 'Einfach, kostenlos und genau dann da, wenn du es brauchst.',
      items: [
        { icon: 'clock', stat: '30s', title: 'Schnellstart', description: 'In 30 Sekunden registriert und erste Warnungen aktiviert' },
        { icon: 'grid', stat: '1', statSub: 'App', title: 'Alles drin', description: 'Warnungen, Checklisten und Notfallplan in einer App' },
        { icon: 'cpu', stat: 'KI', title: 'Personalisiert', description: 'KI erstellt Pläne individuell für deine Situation' },
        { icon: 'shield', stat: '100%', title: 'Kostenlos', description: 'Komplett kostenlos, für immer. Kein Haken.' },
        { icon: 'smartphone', stat: '📱', title: 'Offline-fähig', description: 'Funktioniert auch ohne Internet als PWA' },
        { icon: 'refresh', stat: '24/7', title: 'Immer aktuell', description: 'Warnungen in Echtzeit, rund um die Uhr' },
      ],
    },
    testimonials: {
      title: 'Das sagen unsere Nutzer',
      items: [
        { quote: 'Endlich weiß ich, was ich im Notfall tun muss. Die Checkliste hat mir die Augen geöffnet.', name: 'Anna Lehmann', role: 'Mutter von 2 Kindern', org: 'München', initials: 'AL' },
        { quote: 'Die Push-Warnungen bei Sturm sind Gold wert. Letzte Woche wurde ich rechtzeitig gewarnt und konnte alles sichern.', name: 'Frank Richter', role: 'Hausbesitzer', org: 'Köln', initials: 'FR' },
        { quote: 'Einfach zu bedienen, kostenlos und der Offline-Modus gibt mir ein gutes Gefühl. Kann ich nur empfehlen.', name: 'Petra Schmitz', role: 'Rentnerin', org: 'Hamburg', initials: 'PS' },
      ],
    },
    pricing: {
      title: 'Kostenlos. Für immer.',
      subtitle: 'Wähle den Plan, der zu deiner Vorsorge passt.',
      plans: [
        {
          label: 'Kostenlos',
          price: '0 €',
          period: 'Monat',
          features: ['Lokale Warnungen', 'Basis-Checklisten', 'Notfallkontakte', 'Erste-Hilfe-Tipps', 'Community-Support'],
          cta: 'Kostenlos starten',
        },
        {
          label: 'Familie',
          price: '4,99 €',
          period: 'Monat',
          features: ['Alle Kostenlos-Features', 'Familien-Notfallplan', 'Erweiterte Vorratsplanung', 'Ablaufdatum-Erinnerungen', 'Offline-Modus', 'Prioritäts-Support'],
          cta: 'Jetzt starten',
          highlighted: true,
        },
        {
          label: 'Familie+',
          price: '9,99 €',
          period: 'Monat',
          features: ['Alle Familie-Features', 'Erweiterte Notfall-Karte', 'Video-Anleitungen', 'Familien-Sharing (5 Personen)', 'Persönlicher Vorsorge-Coach', 'Exklusive Inhalte'],
          cta: 'Jetzt starten',
        },
      ],
    },
    faq: [
      { question: 'Ist der Alarmplaner wirklich kostenlos?', answer: 'Ja, die Privat-Version ist komplett kostenlos und bleibt es auch. Wir finanzieren uns über unsere Lösungen für Kommunen und Unternehmen.' },
      { question: 'Woher kommen die Warnungen?', answer: 'Wir nutzen offizielle Quellen: NINA (BBK), den Deutschen Wetterdienst (DWD) und Pegelonline für Wasserstände.' },
      { question: 'Funktioniert der Plan auch ohne Internet?', answer: 'Ja, dein persönlicher Notfallplan und deine Checklisten werden lokal gespeichert und sind offline verfügbar.' },
      { question: 'Welche Daten werden gespeichert?', answer: 'Nur dein Standort und dein Notfallplan. Alle Daten liegen auf deutschen Servern (DSGVO-konform). Wir verkaufen keine Daten.' },
      { question: 'Gibt es eine App?', answer: 'Alarmplaner ist eine Progressive Web App (PWA). Du kannst sie über den Browser nutzen und auf dem Homescreen installieren.' },
    ],
    ctaBanner: {
      headline: 'Sei vorbereitet. Nicht überrascht.',
      subline: 'Erstelle jetzt deinen kostenlosen Notfallplan und schütze, was dir wichtig ist.',
      cta: 'Kostenlos starten →',
    },
  },
}
