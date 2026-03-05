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
      badge: 'NIS2 & KRITIS-DachG konform',
      headlineParts: [
        { text: 'Business Continuity.\n' },
        { text: 'KI-gestützt.', color: 'orange' },
        { text: ' ' },
        { text: 'Bezahlbar.', color: 'blue' },
        { text: ' Audit-ready.' },
      ],
      subline: 'Compliance-Center, Business Impact Analysis, Lieferketten-Monitoring und Krisenübungen – alles in einer Plattform. Ab 149 €/Monat.',
      primaryCta: 'Kostenlos testen →',
      secondaryCta: 'Demo anfragen',
      trustBadges: ['🇩🇪 Made in Germany', '🔒 DSGVO-konform', '📋 NIS2 · KRITIS-DachG · ISO 22301'],
    },
    challenges: {
      title: 'NIS2 ist in Kraft. Sind Sie compliant?',
      subtitle: 'Seit Dezember 2025 haften Geschäftsführer persönlich für Cybersicherheit. Das KRITIS-Dachgesetz folgt Mitte 2026.',
      items: [
        { icon: 'flame', title: 'Persönliche Haftung', description: 'NIS2 §38: Geschäftsführer haften persönlich für mangelnde Cybersicherheits-Maßnahmen. Bußgelder bis 10 Mio. €.' },
        { icon: 'layers', title: 'Drei Gesetze gleichzeitig', description: 'NIS2, KRITIS-Dachgesetz und BSI-KritisV fordern unterschiedliche Nachweise – schwer den Überblick zu behalten.' },
        { icon: 'clock', title: 'Fristen laufen ab', description: 'NIS2-Registrierung seit März 2026 überfällig. KRITIS-DachG Registrierung bis Juli 2026. Resilienzplan bis 2027.' },
        { icon: 'eye', title: 'BCM-Software ist teuer', description: 'Enterprise-Lösungen kosten 500–25.000 €/Monat. Für KMU und mittlere KRITIS-Betreiber unbezahlbar.' },
      ],
    },
    features: {
      title: 'Der erste KI-gestützte Krisenmanager, der bezahlbar ist',
      subtitle: 'Von der Business Impact Analysis bis zum Audit-Export – eine Plattform für NIS2, KRITIS-DachG und ISO 22301.',
      items: [
        { icon: 'chart-network', title: 'Compliance-Center', description: 'NIS2, KRITIS-DachG und ISO 22301 Anforderungskataloge mit Status-Tracking, Evidenz-Verknüpfung und Fortschritts-Dashboard.' },
        { icon: 'file-chart', title: 'Business Impact Analysis', description: 'Kritische Geschäftsprozesse identifizieren, RTO/RPO/MTPD definieren und Abhängigkeiten dokumentieren. NIS2 §30(2) konform.' },
        { icon: 'package-check', title: 'Lieferketten-Monitoring', description: 'Externe Abhängigkeiten erfassen, Alternativen dokumentieren, Single Points of Failure erkennen. NIS2 §30(2) Nr. 5.' },
        { icon: 'bell-ring', title: 'Alarmierung & Krisenstab', description: 'Mehrstufige Alarmketten, Krisenstab-Aktivierung, Meldepflichten an BSI innerhalb 24h. NIS2 §32 konform.' },
        { icon: 'map-pin', title: 'Krisenübungen & Tests', description: 'Tabletop, Funktionsübungen und Walkthroughs planen, durchführen und auswerten. Gesetzlich vorgeschrieben.' },
        { icon: 'users', title: 'KI-generierte Szenarien', description: 'Ransomware, IT-Ausfall, Lieferkette, Personalausfall, Gebäudeverlust – branchenspezifische Krisenszenarien per KI.' },
        { icon: 'file-text', title: 'BCM-Handbuch & Audit-Export', description: 'ISO 22301-konformes BCM-Handbuch mit automatischer Evidenz-Verknüpfung. PDF-Export für Audits und Prüfer.' },
        { icon: 'wifi-off', title: 'KRITIS-Infrastruktur', description: 'Kritische Standorte auf der Karte, Schwellenwerte nach BSI-KritisV, Versorgungsgrad-Berechnung.' },
      ],
    },
    benefits: {
      title: 'Warum Alarmplaner?',
      subtitle: '70% günstiger als Enterprise-Lösungen. In Minuten eingerichtet statt in Wochen.',
      items: [
        { icon: 'clock', stat: '10', statSub: 'Minuten', title: 'Self-Service Setup', description: 'Branche wählen, Standort anlegen, KI generiert Szenarien und BIA-Vorschläge' },
        { icon: 'grid', stat: '3', statSub: 'Frameworks', title: 'Ein Dashboard', description: 'NIS2, KRITIS-DachG und ISO 22301 Compliance in einer Übersicht' },
        { icon: 'cpu', stat: 'KI', title: 'Readiness-Score', description: 'KI bewertet Ihren Reifegrad pro Szenario und zeigt Lücken auf' },
        { icon: 'shield', stat: '100%', title: 'Audit-ready', description: 'Evidenz-Verknüpfung, Compliance-Nachweis und PDF-Export für Prüfer' },
        { icon: 'smartphone', stat: 'ab', statSub: '149 €/Mo', title: 'Bezahlbar', description: 'Professionelles BCM ohne Enterprise-Preise. Ab 149 €/Monat.' },
        { icon: 'refresh', stat: '30', statSub: 'Tage', title: 'Kostenlos testen', description: 'Voller Funktionsumfang ohne Risiko. Keine Kreditkarte nötig.' },
      ],
    },
    testimonials: {
      title: 'Das sagen unsere Pilotkunden',
      items: [
        { quote: 'Alarmplaner hat unser NIS2-Audit gerettet. Die Compliance-Übersicht zeigt auf einen Blick, wo wir stehen und was noch fehlt.', name: 'Dr. Lisa Weber', role: 'Head of Risk Management', org: 'Klinikverbund Süd (3.200 MA)', initials: 'LW' },
        { quote: 'In 2 Stunden hatten wir eine vollständige BIA und 5 Krisenszenarien. Das hätte uns sonst Wochen gekostet.', name: 'Michael Kraft', role: 'CISO', org: 'Stadtwerke Oberland', initials: 'MK' },
        { quote: 'Endlich eine BCM-Lösung die wir uns leisten können. Die KI-generierten Notfallpläne sind beeindruckend gut.', name: 'Sandra Müller', role: 'Geschäftsführerin', org: 'Pflegezentrum Bergland (480 MA)', initials: 'SM' },
      ],
    },
    pricing: {
      title: 'Professionelles BCM. Bezahlbar.',
      subtitle: 'Von KMU bis KRITIS-Betreiber – der richtige Plan für jedes Unternehmen.',
      plans: [
        {
          label: 'Starter',
          price: '149 €',
          period: 'Monat',
          features: ['1 Standort, bis 50 MA', '3 Krisenszenarios', 'Basis-Compliance (1 Framework)', 'E-Mail-Alarmierung', 'BCM-Handbuch', 'Community-Support'],
          cta: 'Kostenlos testen',
        },
        {
          label: 'Business',
          price: '349 €',
          period: 'Monat',
          features: ['Bis 3 Standorte, 500 MA', '10 Krisenszenarios', 'BIA + Lieferketten-Modul', 'Compliance-Center (2 Frameworks)', 'Multi-Kanal-Alarmierung', 'Krisenübungen & Tests', 'Prioritäts-Support'],
          cta: 'Kostenlos testen',
          highlighted: true,
        },
        {
          label: 'Enterprise',
          price: '799 €',
          period: 'Monat',
          features: ['Unbegrenzte Standorte & MA', 'Alle Frameworks (NIS2/KRITIS/ISO)', 'Audit-Ready PDF-Export', 'KI-Lückenanalyse', 'SSO & API-Zugang', 'Dedizierter Account Manager', 'SLA-Garantie'],
          cta: 'Demo anfragen',
        },
      ],
    },
    faq: [
      { question: 'Bin ich von NIS2 betroffen?', answer: 'Wahrscheinlich ja, wenn Sie mehr als 50 Mitarbeiter oder über 10 Mio. € Jahresumsatz haben und in einem der 18 regulierten Sektoren tätig sind. Alarmplaner hilft Ihnen bei der Einschätzung.' },
      { question: 'Erfüllt Alarmplaner die NIS2-Anforderungen?', answer: 'Ja. Unser Compliance-Center bildet alle Anforderungen nach §30-§38 NIS2-UmsuCG ab. Jede Anforderung kann mit Evidenz (Szenarien, Checklisten, Dokumenten) verknüpft werden.' },
      { question: 'Was ist mit KRITIS-DachG und BSI-KritisV?', answer: 'Alarmplaner unterstützt beide Frameworks. Die KRITIS-Infrastruktur-Übersicht zeigt Schwellenwerte nach BSI-KritisV, das Compliance-Center trackt KRITIS-DachG Anforderungen.' },
      { question: 'Wie schnell bin ich einsatzbereit?', answer: 'Self-Service Setup in unter 30 Minuten. Branche wählen, Standorte anlegen – die KI generiert BIA-Vorschläge und Krisenszenarien automatisch.' },
      { question: 'Wo werden die Daten gespeichert?', answer: 'Alle Daten liegen auf deutschen Servern. DSGVO-konform, verschlüsselt und mit regelmäßigen Backups. Für KRITIS-Betreiber bieten wir dedizierte Instanzen.' },
    ],
    ctaBanner: {
      headline: 'NIS2-Frist verpasst? Jetzt handeln.',
      subline: 'Starten Sie in 30 Minuten mit Ihrem Compliance-Nachweis. 30 Tage kostenlos, keine Kreditkarte nötig.',
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
