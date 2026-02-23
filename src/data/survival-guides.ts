export interface GuideSection {
  heading: string
  content: string
}

export interface SurvivalGuide {
  id: string
  title: string
  icon: string
  category: 'grundlagen' | 'wasser_nahrung' | 'notfall_szenarien' | 'familie'
  teaser: string
  sections: GuideSection[]
}

export const GUIDE_CATEGORIES = [
  { id: 'alle', name: 'Alle Themen' },
  { id: 'grundlagen', name: 'Grundlagen' },
  { id: 'wasser_nahrung', name: 'Wasser & Nahrung' },
  { id: 'notfall_szenarien', name: 'Notfall-Szenarien' },
  { id: 'familie', name: 'Familie' },
]

/**
 * Maps warning keywords (from external_warnings) to relevant guide IDs.
 * Used by WissenssammlungPage to show contextual recommendations.
 */
export const WARNING_GUIDE_MAP: Record<string, string[]> = {
  'hochwasser': ['hochwasser'],
  'unwetter': ['hochwasser', 'stromausfall'],
  'sturm': ['stromausfall', 'evakuierung'],
  'hitze': ['wasseraufbereitung'],
  'stromausfall': ['stromausfall', 'notkochen'],
  'brand': ['evakuierung', 'erste_hilfe'],
  'gewitter': ['stromausfall'],
  'starkregen': ['hochwasser'],
  'schnee': ['stromausfall', 'vorrat_lagern'],
  'frost': ['stromausfall', 'wasseraufbereitung'],
  'überschwemmung': ['hochwasser', 'evakuierung'],
  'blackout': ['stromausfall', 'notkochen'],
}

export const SURVIVAL_GUIDES: SurvivalGuide[] = [
  // ─── 1. Wasseraufbereitung ─────────────────────────────────────────
  {
    id: 'wasseraufbereitung',
    title: 'Trinkwasser im Notfall',
    icon: 'Droplets',
    category: 'wasser_nahrung',
    teaser:
      'Ohne sauberes Trinkwasser wird jede Krise lebensbedrohlich. Lernen Sie, wie Sie Wasser aufbereiten, lagern und im Notfall finden.',
    sections: [
      {
        heading: 'Warum Wasservorsorge wichtig ist',
        content: `<p>Der menschliche Koerper benoetigt mindestens <strong>1,5 bis 2 Liter Trinkwasser pro Tag</strong>, um lebenswichtige Koerperfunktionen aufrechtzuerhalten. Bei koerperlicher Anstrengung, Hitze oder Krankheit steigt der Bedarf auf 3 Liter oder mehr. Bereits nach wenigen Stunden ohne Wasser treten Konzentrationsstoerungen und Kopfschmerzen auf. Nach zwei bis drei Tagen ohne Fluessigkeitszufuhr besteht akute Lebensgefahr.</p>
<p>Bei Naturkatastrophen, Stromausfaellen oder Infrastrukturschaeden kann die oeffentliche Wasserversorgung ausfallen. Leitungswasser koennte verunreinigt sein, ohne dass Sie es sehen, riechen oder schmecken koennen. Bakterien wie E. coli, Viren und chemische Rueckstaende machen verschmutztes Wasser zu einem ernsthaften Gesundheitsrisiko.</p>
<p>Das Bundesamt fuer Bevoelkerungsschutz und Katastrophenhilfe empfiehlt, <strong>einen Trinkwasservorrat fuer mindestens 10 Tage</strong> anzulegen. Pro Person sollten Sie mit 2 Litern pro Tag rechnen — also insgesamt 20 Liter. Denken Sie auch an Haustiere und an Wasser fuer die Zubereitung von Nahrung.</p>`,
      },
      {
        heading: 'Wasser abkochen — die sicherste Methode',
        content: `<p>Abkochen ist die zuverlaessigste Methode, um Krankheitserreger im Wasser abzutoeten. Bei korrekter Anwendung werden nahezu alle Bakterien, Viren und Parasiten beseitigt.</p>
<p><strong>So gehen Sie vor:</strong></p>
<ul>
<li>Fuellen Sie das Wasser in einen sauberen Topf. Wenn das Wasser trueb ist, filtern Sie es vorher durch ein sauberes Tuch, um grobe Partikel zu entfernen.</li>
<li>Bringen Sie das Wasser zum <strong>sprudelnden Kochen</strong> (sogenannter "rolling boil" — grosse Blasen steigen kontinuierlich auf).</li>
<li>Lassen Sie das Wasser <strong>mindestens 3 Minuten</strong> sprudelnd kochen. In Hoehenlagen ueber 2.000 Meter sollten Sie mindestens 5 Minuten kochen, da der Siedepunkt dort niedriger liegt.</li>
<li>Lassen Sie das Wasser in einem sauberen, abgedeckten Gefaess abkuehlen.</li>
<li>Abgekochtes Wasser schmeckt oft etwas flach. Sie koennen den Geschmack verbessern, indem Sie es zwischen zwei sauberen Gefaessen hin- und hergiessen, um es mit Sauerstoff anzureichern.</li>
</ul>
<p><em>Wichtig: Abkochen entfernt keine chemischen Verunreinigungen wie Schwermetalle oder Pestizide. Verwenden Sie chemisch verunreinigtes Wasser auch nach dem Abkochen nicht zum Trinken.</em></p>`,
      },
      {
        heading: 'Entkeimungstabletten verwenden',
        content: `<p>Wasserentkeimungstabletten sind eine praktische Alternative zum Abkochen, besonders wenn keine Kochmoeglichkeit besteht. Sie sind leicht, guenstig und jahrelang haltbar — ideal fuer das Notfallgepaeck.</p>
<p><strong>Anwendung:</strong></p>
<ul>
<li>Lesen Sie immer die Packungsbeilage, da die Dosierung je nach Hersteller variiert.</li>
<li>Als Faustregel gilt: <strong>Eine Tablette pro Liter</strong> klares Wasser. Bei truebem Wasser ist oft die doppelte Dosis noetig.</li>
<li>Tablette ins Wasser geben und mindestens <strong>30 Minuten einwirken lassen</strong>. Einige Produkte benoetigen bis zu 2 Stunden fuer die vollstaendige Entkeimung.</li>
<li>Waehrend der Einwirkzeit den Behaelter leicht schuetteln und den Deckel kurz oeffnen, damit auch das Gewinde desinfiziert wird.</li>
</ul>
<p>Die gaengigsten Wirkstoffe sind <strong>Natriumdichlorisocyanurat</strong> (NaDCC) und <strong>Chlordioxid</strong>. Chlordioxid-Tabletten wirken zuverlaessiger gegen Parasiten wie Giardien und Kryptosporidien, brauchen aber laenger. Bewahren Sie die Tabletten trocken und bei Raumtemperatur auf.</p>
<p><em>Hinweis: Entkeimungstabletten koennen einen leichten Chlorgeschmack hinterlassen. Lassen Sie das Wasser nach der Einwirkzeit offen stehen, damit sich ein Teil des Chlors verflueechtigt.</em></p>`,
      },
      {
        heading: 'Improvisierten Wasserfilter bauen',
        content: `<p>Wenn Sie weder Kochmoeglichkeit noch Tabletten haben, koennen Sie mit einfachen Materialien einen Notfilter bauen. Dieser entfernt Truebstoffe und einen Teil der Bakterien, <strong>ersetzt aber nicht das Abkochen</strong>. Nutzen Sie ihn als Vorfilter, bevor Sie das Wasser mit einer weiteren Methode behandeln.</p>
<p><strong>Materialien (von unten nach oben im Gefaess):</strong></p>
<ul>
<li><strong>Unterste Schicht:</strong> Saubere Kieselsteine oder grober Schotter (ca. 5 cm) — sie verhindern, dass feineres Material herausfaellt.</li>
<li><strong>Zweite Schicht:</strong> Grober Sand (ca. 5 cm) — faengt mittlere Partikel ab.</li>
<li><strong>Dritte Schicht:</strong> Feiner Sand (ca. 5 cm) — filtert kleine Schwebstoffe heraus.</li>
<li><strong>Oberste Schicht:</strong> Aktivkohle oder zerkleinerte Holzkohle (ca. 5 cm) — bindet chemische Stoffe und verbessert den Geschmack. Verwenden Sie <em>keine</em> Grillkohle mit chemischen Anzuendhilfen.</li>
</ul>
<p>Bohren Sie ein kleines Loch in den Boden einer Plastikflasche oder eines Eimers. Schichten Sie die Materialien wie beschrieben ein. Giessen Sie das Wasser langsam oben hinein und fangen Sie das gefilterte Wasser unten auf. Lassen Sie die ersten zwei Durchlaeufe weg, da sie noch Feinstaub enthalten.</p>
<p><em>Sehr wichtig: Ein improvisierter Filter macht das Wasser klarer, aber nicht keimfrei. Kochen oder desinfizieren Sie das Wasser nach dem Filtern unbedingt noch.</em></p>`,
      },
      {
        heading: 'Wasser richtig lagern',
        content: `<p>Ein Wasservorrat nuetzt nur, wenn er im Ernstfall auch trinkbar ist. Falsch gelagertes Wasser kann verkeimen und unbrauchbar werden.</p>
<p><strong>Behaelter:</strong></p>
<ul>
<li>Verwenden Sie <strong>lebensmittelechte Wasserkanister</strong> aus HDPE-Kunststoff (erkennbar am Recycling-Symbol mit der Nummer 2). Diese sind lichtundurchlaessig und geben keine Schadstoffe ab.</li>
<li>Alternativ eignen sich Glasflaschen mit dicht schliessendem Deckel.</li>
<li>Verwenden Sie <em>keine</em> Milchkanister oder andere Behaelter, die vorher andere Fluessigkeiten enthielten — Rueckstaende lassen sich kaum vollstaendig entfernen.</li>
</ul>
<p><strong>Lagerung:</strong></p>
<ul>
<li>Lagern Sie Wasser <strong>kuehl, dunkel und trocken</strong>. Idealtemperatur: 10 bis 15 Grad Celsius. Ein Keller eignet sich gut.</li>
<li>Vermeiden Sie direkte Sonneneinstrahlung — UV-Licht und Waerme foerdern Algenbildung und Keimwachstum.</li>
<li>Stellen Sie die Behaelter nicht direkt auf den Betonboden (Kaeltebruecke kann Kondenswasser bilden), sondern auf ein Regal oder eine Holzpalette.</li>
<li><strong>Tauschen Sie das Wasser alle 6 Monate aus</strong>, auch wenn es optisch noch klar aussieht.</li>
</ul>
<p>Beschriften Sie jeden Kanister mit dem Abfuelldatum. Ein einfacher Aufkleber oder wasserfester Stift genuegt. So behalten Sie den Ueberblick ueber die Rotation.</p>`,
      },
    ],
  },

  // ─── 2. Feuer machen ───────────────────────────────────────────────
  {
    id: 'feuer_machen',
    title: 'Feuer machen & sicher heizen',
    icon: 'Flame',
    category: 'grundlagen',
    teaser:
      'Waerme und Kochmoeglichkeit sind im Notfall ueberlebenswichtig. Erfahren Sie, wie Sie sicher Feuer machen und heizen, ohne sich in Gefahr zu bringen.',
    sections: [
      {
        heading: 'Wann brauche ich Feuer im Notfall?',
        content: `<p>In einer Krisensituation brauchen Sie Feuer vor allem fuer drei Zwecke: <strong>Kochen</strong> (Nahrung zubereiten, Wasser abkochen), <strong>Waerme</strong> (Heizungsausfall im Winter) und <strong>Licht</strong> (bei laengerem Stromausfall). Besonders in den Wintermonaten kann ein unbeheizter Wohnraum innerhalb weniger Stunden auf unter 10 Grad abkuehlen.</p>
<p>Ohne Strom fallen elektrische Herde, Heizungsanlagen (auch Gasheizungen mit elektronischer Zuendung) und Warmwasserbereiter aus. Selbst moderne Pelletheizungen benoetigen Strom fuer Foerderschnecke und Steuerung. Nur holzbetriebene Kaminoefen und reine Schwerkraft-Heizungen funktionieren dann noch.</p>
<p>Bevor Sie alternative Feuer- oder Heizquellen nutzen, beachten Sie die wichtigste Grundregel: <strong>Offenes Feuer und Verbrennungsprozesse erzeugen Kohlenmonoxid (CO)</strong>. Dieses geruchlose, unsichtbare Gas ist toedlich. Jede offene Flamme braucht ausreichend Frischluftzufuhr. Nutzen Sie Verbrennungsgeraete wie Grills oder Campingkocher <em>niemals</em> in geschlossenen Raeumen.</p>`,
      },
      {
        heading: 'Streichhoelzer und Feuerzeuge richtig lagern',
        content: `<p>Im Notfall muessen Sie schnell und zuverlaessig Feuer machen koennen. Lagern Sie deshalb mehrere Zuendquellen an verschiedenen Orten in Ihrem Haushalt.</p>
<ul>
<li><strong>Sturmstreichhoelzer:</strong> Diese sind wind- und feuchtigkeitsresistent. Bewahren Sie sie in einer wasserdichten Dose oder einem Ziplock-Beutel auf. Normale Streichhoelzer taugen bei Feuchtigkeit wenig.</li>
<li><strong>Feuerzeuge:</strong> Halten Sie mindestens zwei Gas-Feuerzeuge vorraeitig. Butangas-Feuerzeuge funktionieren bei Temperaturen unter minus 5 Grad schlecht — lagern Sie sie deshalb bei Raumtemperatur oder tragen Sie eines am Koerper.</li>
<li><strong>Feuerstahl (Feuerstarter):</strong> Ein Ferrocer-Stab erzeugt Funken auch bei Naesse und Kaelte. Er haelt tausende Zuendvorgaenge lang. Ueben Sie die Handhabung vor dem Ernstfall.</li>
</ul>
<p>Lagern Sie Zuendmittel <strong>trocken und fuer Kinder unerreichbar</strong>. Eine Metalldose im Vorratsschrank ist ideal. Legen Sie auch trockenes Anzuendmaterial bereit: Wattepads, Zeitungspapier, Birkenrinde oder kommerzielle Anzuendwuerfel.</p>`,
      },
      {
        heading: 'Campingkocher sicher nutzen',
        content: `<p>Ein Campingkocher ist die beste Loesung, um im Notfall Essen zuzubereiten und Wasser abzukochen. Er ist kompakt, schnell einsatzbereit und verhaeltnismaessig sicher — <strong>wenn Sie die Regeln einhalten</strong>.</p>
<p><strong>Sicherheitsregeln:</strong></p>
<ul>
<li>Betreiben Sie den Campingkocher <strong>ausschliesslich im Freien</strong> oder bei <strong>weit geoeffneten Fenstern</strong> (Durchzug). Geschlossene Raeume: <em>Niemals!</em> Es besteht akute CO-Vergiftungsgefahr.</li>
<li>Stellen Sie den Kocher auf eine <strong>stabile, feuerfeste Unterlage</strong>. Ein Metalltablett oder eine Steinplatte eignen sich. Kein Holz, kein Kunststoff, kein Stoff.</li>
<li>Halten Sie einen <strong>Sicherheitsabstand von mindestens 1 Meter</strong> zu brennbaren Materialien (Gardinen, Papier, Plastik).</li>
<li>Wechseln Sie Gaskartuschen nur im Freien und bei abgekuehltem Kocher. Pruefen Sie den Anschluss auf festen Sitz, bevor Sie zuenden.</li>
<li>Lassen Sie den Kocher <strong>niemals unbeaufsichtigt</strong> brennen.</li>
</ul>
<p>Bevorraten Sie ausreichend Brennstoff: Fuer 10 Tage Notversorgung rechnen Sie mit etwa 4 bis 6 kleinen Gaskartuschen (230 g) fuer eine Familie. Lagern Sie Gaskartuschen bei Raumtemperatur, nicht ueber 50 Grad und nicht in direkter Sonne.</p>`,
      },
      {
        heading: 'Kerzen sicher verwenden',
        content: `<p>Kerzen sind die einfachste Notbeleuchtung, aber auch eine der haeufigsten Brandursachen in Privathaushalten. Gerade in Krisensituationen, wenn Sie abgelenkt oder gestresst sind, steigt die Unfallgefahr.</p>
<p><strong>Brandschutz-Regeln:</strong></p>
<ul>
<li>Stellen Sie Kerzen <strong>immer in einen feuerfesten Kerzenhalter</strong> oder auf einen Teller mit Rand. Niemals direkt auf Holzmoebel, Plastik oder Stoff.</li>
<li>Halten Sie <strong>mindestens 30 cm Abstand</strong> zu Vorhaengen, Buechern, Papier und anderen brennbaren Gegenstaenden.</li>
<li>Lassen Sie brennende Kerzen <strong>niemals unbeaufsichtigt</strong> — auch nicht "nur kurz". Loeschen Sie alle Kerzen, bevor Sie den Raum verlassen oder einschlafen.</li>
<li>Stellen Sie Kerzen so auf, dass <strong>Kinder und Haustiere</strong> sie nicht erreichen oder umstossen koennen.</li>
<li>Legen Sie einen <strong>Eimer Wasser oder Feuerloescher</strong> in Reichweite bereit.</li>
</ul>
<p>Teelichter in geschlossenen Glaesern (z. B. Einmachglaeser) sind sicherer als offene Kerzen, da sie nicht so leicht umkippen und der Luftzug die Flamme nicht auf brennbares Material lenken kann. Bevorraten Sie mindestens 20 Teelichter und einige groessere Stumpenkerzen.</p>`,
      },
      {
        heading: 'Alternative Waermequellen bei Heizungsausfall',
        content: `<p>Wenn die Heizung im Winter ausfaellt und kein Kaminofen vorhanden ist, muessen Sie mit anderen Mitteln warm bleiben. <strong>Unterkuehlung</strong> (Hypothermie) kann schon ab einer Koerpertemperatur von 35 Grad lebensbedrohlich werden.</p>
<p><strong>Sofortmassnahmen:</strong></p>
<ul>
<li><strong>Einen Raum zum Waermeraum bestimmen:</strong> Waehlen Sie den kleinsten Raum mit moeglichst wenigen Aussenfenstern. Haengen Sie Decken vor Fenster und Tueren, um Waermeverlust zu reduzieren.</li>
<li><strong>Schichten-Prinzip:</strong> Ziehen Sie mehrere duenne Kleidungsschichten uebereinander statt einer dicken Jacke. Zwischen den Schichten bilden sich isolierende Luftpolster. Vergessen Sie Muetze, Schal und dicke Socken nicht — ueber den Kopf und die Fuesse geht viel Waerme verloren.</li>
<li><strong>Schlafsysteme:</strong> Ein Winterschlafsack (Komfortbereich bis minus 5 Grad) haelt Sie nachts warm. Schlafen Sie auf einer Isomatte oder Yoga-Matte, um den Kontakt zum kalten Boden zu vermeiden.</li>
<li><strong>Gemeinsame Koerperwaerme:</strong> Schlafen Sie als Familie zusammen in einem Raum. Koerperwaerme ist eine der effektivsten Waermequellen. Ein Doppelschlafsack oder uebereinander gelegte Decken halten die gemeinsame Waerme zusammen.</li>
<li><strong>Waermflaschen:</strong> Kochen Sie Wasser auf dem Campingkocher und fuellen Sie Waermflaschen. Wickeln Sie die Flasche in ein Handtuch, um Verbrennungen zu vermeiden. Die Waerme haelt mehrere Stunden.</li>
</ul>
<p><em>Warnung: Nutzen Sie niemals einen Holzkohlegrill, Gasgrill oder improvisierte Feuerstelle in geschlossenen Raeumen. Die CO-Vergiftungsgefahr ist toedlich. Jedes Jahr sterben in Deutschland Menschen, die mit Grills in der Wohnung heizen wollten.</em></p>`,
      },
    ],
  },

  // ─── 3. Erste Hilfe ────────────────────────────────────────────────
  {
    id: 'erste_hilfe',
    title: 'Erste Hilfe Grundlagen',
    icon: 'Heart',
    category: 'grundlagen',
    teaser:
      'In einer Krise kann der Rettungsdienst nicht immer schnell kommen. Grundlegende Erste-Hilfe-Kenntnisse koennen Leben retten.',
    sections: [
      {
        heading: 'Stabile Seitenlage — Schritt fuer Schritt',
        content: `<p>Die stabile Seitenlage schuetzt bewusstlose Personen, die noch atmen, vor dem Ersticken. Bewusstlose Menschen verlieren die Kontrolle ueber ihre Muskeln — die Zunge kann nach hinten rutschen und die Atemwege blockieren. Erbrochenes kann nicht abfliessen und in die Lunge gelangen.</p>
<p><strong>Anleitung:</strong></p>
<ul>
<li><strong>Schritt 1:</strong> Knien Sie sich neben die Person. Legen Sie den Ihnen naeheren Arm der Person im rechten Winkel nach oben (Handflaeche zeigt nach oben).</li>
<li><strong>Schritt 2:</strong> Greifen Sie den entfernteren Arm der Person am Handgelenk. Fuehren Sie diese Hand an die Ihnen zugewandte Wange und halten Sie sie dort fest (Handruecken an Wange).</li>
<li><strong>Schritt 3:</strong> Greifen Sie mit der anderen Hand das entferntere Bein oberhalb des Knies und ziehen Sie es hoch, sodass der Fuss flach auf dem Boden steht.</li>
<li><strong>Schritt 4:</strong> Ziehen Sie am angewinkelten Knie zu sich herueber. Die Person rollt sanft auf die Seite.</li>
<li><strong>Schritt 5:</strong> Ueberstrecken Sie den Kopf leicht nach hinten, damit die Atemwege frei bleiben. Oeffnen Sie den Mund leicht, damit Fluessigkeiten abfliessen koennen.</li>
</ul>
<p><strong>Pruefen Sie regelmaessig die Atmung</strong> (alle 1 bis 2 Minuten). Schauen Sie, ob sich der Brustkorb hebt, hoeren und fuehlen Sie den Atem an Mund und Nase. Wenn die Atmung aussetzt, beginnen Sie sofort mit der Herz-Lungen-Wiederbelebung.</p>`,
      },
      {
        heading: 'Wundversorgung: Reinigen, Desinfizieren, Verbinden',
        content: `<p>Im Krisenfall koennen Schnitte, Schuerfwunden und kleinere Verletzungen haeufiger auftreten — beim Aufraeumen, Kochen ueber offenem Feuer oder durch Glasscherben. Ohne aerztliche Versorgung ist sorgfaeltige Wundbehandlung entscheidend, um Infektionen zu vermeiden.</p>
<p><strong>Grundregel: Saubere Haende!</strong> Waschen Sie sich gruendlich die Haende oder ziehen Sie Einmalhandschuhe an, bevor Sie eine Wunde versorgen.</p>
<ul>
<li><strong>Reinigen:</strong> Spuelen Sie die Wunde unter fliessendem, sauberem Wasser (oder abgekochtem Wasser). Entfernen Sie sichtbaren Schmutz vorsichtig mit einer sterilen Kompresse. Wischen Sie immer <em>von der Wunde weg</em>, nie hinein.</li>
<li><strong>Desinfizieren:</strong> Tragen Sie Wunddesinfektionsmittel grosszuegig auf. Lassen Sie es einwirken, ohne zu pusten oder zu wischen.</li>
<li><strong>Verbinden:</strong> Decken Sie die Wunde mit einer sterilen Kompresse ab und fixieren Sie sie mit einer Mullbinde oder Pflaster. Wickeln Sie Binden nicht zu fest — zwei Finger sollten unter den Verband passen.</li>
<li><strong>Wechseln:</strong> Kontrollieren und wechseln Sie den Verband mindestens einmal taeglich oder wenn er durchnaesst oder verschmutzt ist.</li>
</ul>
<p><em>Warnsignale fuer eine Infektion: Zunehmende Roetung, Schwellung, Waerme, pochender Schmerz, Eiter oder rote Streifen, die von der Wunde wegfuehren. Suchen Sie dann schnellstmoeglich medizinische Hilfe.</em></p>`,
      },
      {
        heading: 'Druckverband bei starker Blutung',
        content: `<p>Starke Blutungen koennen innerhalb von Minuten lebensbedrohlich werden. Ein Druckverband ist die wichtigste Sofortmassnahme, um die Blutung zu kontrollieren.</p>
<p><strong>Anlegen eines Druckverbands:</strong></p>
<ul>
<li><strong>Schritt 1:</strong> Pressen Sie sofort eine sterile Kompresse oder ein sauberes Tuch fest auf die Wunde. Druecken Sie mit der flachen Hand kraeftig zu.</li>
<li><strong>Schritt 2:</strong> Halten Sie den Druck aufrecht und wickeln Sie eine Mullbinde zweimal fest um die verletzte Stelle und ueber die Kompresse.</li>
<li><strong>Schritt 3:</strong> Legen Sie ein <strong>Druckpolster</strong> auf die Wunde (z. B. ein noch verpacktes Verbandpaeckchen, ein zusammengerolltes Tuch oder eine kleine Flasche).</li>
<li><strong>Schritt 4:</strong> Wickeln Sie die Binde straff ueber das Druckpolster und fixieren Sie das Ende mit Klebeband, einer Sicherheitsnadel oder durch Verknoten.</li>
</ul>
<p>Wenn das Blut durch den Verband sickert, entfernen Sie ihn <em>nicht</em>. Legen Sie stattdessen einen zweiten Druckverband ueber den ersten. Lagern Sie die verletzte Extremitaet moeglichst hoch, um den Blutdruck in der Wunde zu senken.</p>
<p><strong>Rufen Sie immer den Notruf</strong> bei starken Blutungen. Bis Hilfe eintrifft, sprechen Sie beruhigend mit der verletzten Person und halten Sie sie warm.</p>`,
      },
      {
        heading: 'Schock erkennen und behandeln',
        content: `<p>Ein Schock ist ein lebensbedrohlicher Zustand, bei dem die Organe nicht mehr ausreichend mit Blut und Sauerstoff versorgt werden. Er kann durch starken Blutverlust, allergische Reaktionen, schwere Infektionen oder Verbrennungen ausgeloest werden.</p>
<p><strong>Anzeichen eines Schocks:</strong></p>
<ul>
<li>Blasse, kalte und feuchte Haut (Kaltschweiss)</li>
<li>Schneller, flacher Puls (ueber 100 Schlaege pro Minute)</li>
<li>Schnelle, flache Atmung</li>
<li>Unruhe, Angst oder Verwirrtheit</li>
<li>Uebelkeit oder Erbrechen</li>
<li>Starker Durst</li>
<li>Im fortgeschrittenen Stadium: Teilnahmslosigkeit, Bewusstlosigkeit</li>
</ul>
<p><strong>Sofortmassnahmen:</strong></p>
<ul>
<li><strong>Notruf absetzen</strong> (112).</li>
<li>Die Ursache behandeln, wenn moeglich (Blutung stoppen, Allergen entfernen).</li>
<li><strong>Schocklagerung:</strong> Person flach auf den Ruecken legen, Beine um etwa 30 cm erhoehen (z. B. auf einen Stuhl, Rucksack oder Kissen). Dadurch fliesst Blut zurueck zu den lebenswichtigen Organen.</li>
<li>Person <strong>warm halten</strong> mit Decken oder Rettungsfolie (Silberseite zum Koerper).</li>
<li><strong>Beruhigend sprechen</strong> und bei der Person bleiben.</li>
<li><em>Nicht</em> zu trinken geben — auch wenn die Person starken Durst hat. Bei Uebelkeit droht Aspiration.</li>
</ul>`,
      },
      {
        heading: 'Notruf richtig absetzen — die 5 W-Fragen',
        content: `<p>In Deutschland erreichen Sie die Feuerwehr und den Rettungsdienst unter der <strong>112</strong> und die Polizei unter der <strong>110</strong>. Die 112 funktioniert auch ohne SIM-Karte und ist europaweit gueltig.</p>
<p>Damit die Leitstelle schnell die richtige Hilfe schicken kann, beantworten Sie die <strong>5 W-Fragen</strong>:</p>
<ul>
<li><strong>Wo</strong> ist es passiert? Geben Sie die genaue Adresse an: Strasse, Hausnummer, Stockwerk. Bei Unfaellen auf Landstrassen: Strassenname, Kilometerstein, Fahrtrichtung.</li>
<li><strong>Was</strong> ist passiert? Beschreiben Sie kurz die Situation: Verkehrsunfall, Brand, medizinischer Notfall, Ueberschwemmung etc.</li>
<li><strong>Wie viele</strong> Verletzte oder Betroffene gibt es? Schaetzen Sie, wenn Sie es nicht genau wissen.</li>
<li><strong>Welche</strong> Verletzungen oder Erkrankungen liegen vor? Beschreiben Sie, was Sie sehen: Bewusstlosigkeit, starke Blutung, Atemprobleme, Verbrennungen.</li>
<li><strong>Warten</strong> auf Rueckfragen. Legen Sie nicht auf, bis die Leitstelle das Gespraech beendet. Die Disponenten koennen Ihnen am Telefon Anweisungen geben — zum Beispiel zur Herz-Lungen-Wiederbelebung.</li>
</ul>
<p><em>Tipp: Speichern Sie die 112 als Favorit in Ihrem Handy. In Panik vergessen Menschen manchmal die einfachsten Nummern. Bringen Sie auch Kindern frueh bei, wann und wie man den Notruf waehlt.</em></p>`,
      },
    ],
  },

  // ─── 4. Stromausfall ───────────────────────────────────────────────
  {
    id: 'stromausfall',
    title: 'Stromausfall — was tun?',
    icon: 'Zap',
    category: 'notfall_szenarien',
    teaser:
      'Ein laengerer Stromausfall legt Kuehlschraenke, Heizung und Kommunikation lahm. Mit der richtigen Vorbereitung meistern Sie auch mehrere Tage ohne Strom.',
    sections: [
      {
        heading: 'Sofortmassnahmen bei Stromausfall',
        content: `<p>Wenn ploetzlich das Licht ausgeht, bewahren Sie Ruhe. Pruefen Sie zuerst, ob nur Ihre Wohnung betroffen ist (Sicherung geprueft?) oder ob es ein flaechendeckender Ausfall ist (Blick aus dem Fenster: Strassenbeleuchtung, Nachbarn).</p>
<p><strong>Erste Schritte:</strong></p>
<ul>
<li><strong>Kuehlschrank und Tiefkuehler geschlossen halten.</strong> Jedes Oeffnen laesst Kaelte entweichen. Ein voller Tiefkuehler haelt die Temperatur bis zu 48 Stunden, ein halbvoller etwa 24 Stunden — aber nur bei geschlossener Tuer.</li>
<li><strong>Elektrische Geraete ausschalten oder vom Netz trennen.</strong> Wenn der Strom wiederkommt, kann eine Spannungsspitze empfindliche Elektronik beschaedigen. Lassen Sie nur eine Lampe eingeschaltet, damit Sie sehen, wann der Strom zurueckkehrt.</li>
<li><strong>Taschenlampe bereithalten.</strong> Vermeiden Sie Kerzen in der ersten Hektik — in der Dunkelheit steigt die Stolper- und damit die Brandgefahr. Greifen Sie erst zur Taschenlampe, dann koennen Sie in Ruhe Kerzen aufstellen.</li>
<li><strong>Batteriebetriebenes Radio einschalten.</strong> Lokale Radiosender informieren ueber Ursache und voraussichtliche Dauer des Ausfalls. Auf UKW (nicht DAB+, das braucht mehr Strom).</li>
</ul>`,
      },
      {
        heading: 'Kuehlkette: Was zuerst essen?',
        content: `<p>Ohne Strom beginnt der Kampf gegen das Verderben Ihrer Lebensmittel. Mit der richtigen Reihenfolge koennen Sie Verluste minimieren.</p>
<p><strong>Reihenfolge des Verbrauchs:</strong></p>
<ul>
<li><strong>Tag 1 bis 2:</strong> Essen Sie zuerst frische Lebensmittel aus dem Kuehlschrank — Milchprodukte, Aufschnitt, frisches Fleisch, Reste. Der Kuehlschrank haelt bei geschlossener Tuer etwa 4 Stunden eine sichere Temperatur.</li>
<li><strong>Tag 2 bis 4:</strong> Verbrauchen Sie Tiefkuehlware. Tauen Sie groessere Mengen nicht auf einmal auf. Aufgetautes Fleisch und Fisch sollten sofort durchgegart und innerhalb von 24 Stunden verzehrt werden.</li>
<li><strong>Ab Tag 3:</strong> Wechseln Sie zu haltbaren Vorraeten: Konserven, Trockennahrung, Nuesse, Honig, Zwieback.</li>
</ul>
<p><strong>Lebensmittelsicherheit:</strong></p>
<ul>
<li>Fleisch, Fisch, Milch und Eier bei Temperaturen ueber 7 Grad <em>nicht mehr</em> roh essen. Im Zweifelsfall wegwerfen.</li>
<li>Riecht ein Lebensmittel ungewoehnlich oder hat es eine veraenderte Konsistenz oder Farbe, <em>nicht probieren</em> — sofort entsorgen.</li>
<li>Hartkaese, Butter in Dosen, Marmelade und Senf sind weniger empfindlich und halten einige Tage auch ohne Kuehlung.</li>
</ul>`,
      },
      {
        heading: 'Kommunikation ohne Strom',
        content: `<p>Bei einem flaechendeckenden Stromausfall fallen nach wenigen Stunden auch Mobilfunkmasten und Internetknoten aus (deren Notstrom-Akkus halten typischerweise nur 4 bis 8 Stunden). Festnetztelefone mit eigener Stromversorgung (alte analoge Geraete) koennen laenger funktionieren, aber modernere IP-basierte Anschluesse fallen sofort aus.</p>
<p><strong>Ihre Kommunikationsmoeglichkeiten:</strong></p>
<ul>
<li><strong>UKW-Radio (Kurbelradio):</strong> Das wichtigste Geraet im Notfall. UKW-Sender werden von Notstromanlagen versorgt und senden auch bei laengerem Blackout weiter. Ein Kurbelradio benoetigt keine Batterien — 1 Minute Kurbeln ergibt etwa 15 bis 30 Minuten Empfang.</li>
<li><strong>Batteriebetriebenes Radio:</strong> Als Alternative zum Kurbelradio. Halten Sie Ersatzbatterien vorraeitig (AA oder AAA, je nach Geraet). Alkaline-Batterien halten im Radio viele Stunden.</li>
<li><strong>Handy-Akku sparen:</strong> Schalten Sie in den Flugmodus (spart am meisten Strom). Deaktivieren Sie WLAN, Bluetooth, GPS und Hintergrund-Apps. Reduzieren Sie die Bildschirmhelligkeit auf das Minimum. Kommunizieren Sie per SMS statt Anruf — SMS braucht weniger Energie und kommt auch bei schwachem Netz durch.</li>
<li><strong>Powerbank:</strong> Eine vollgeladene Powerbank mit 20.000 mAh laedt ein Smartphone etwa 4 bis 5 Mal. Halten Sie mindestens eine immer geladen bereit.</li>
</ul>
<p>Vereinbaren Sie mit Ihrer Familie und Nachbarn <strong>feste Treffpunkte</strong> fuer den Fall, dass Telefon und Internet ausfallen. Ein einfacher Plan wie "Wir treffen uns bei Stromausfall um 18 Uhr am Rathaus" kann im Ernstfall Gold wert sein.</p>`,
      },
      {
        heading: 'Beleuchtung im Stromausfall',
        content: `<p>Licht gibt Sicherheit und Orientierung. Ohne Beleuchtung steigt die Unfallgefahr durch Stolpern und Stuerze erheblich, besonders bei aelteren Menschen und Kindern.</p>
<p><strong>Empfohlene Beleuchtungsmittel (in dieser Reihenfolge):</strong></p>
<ul>
<li><strong>LED-Taschenlampen:</strong> Erste Wahl. Moderne LED-Lampen sind hell, langlebig und energieeffizient. Eine gute Taschenlampe mit frischen Batterien leuchtet 10 bis 50 Stunden. Halten Sie mindestens 2 Taschenlampen und ausreichend Ersatzbatterien bereit.</li>
<li><strong>LED-Campinglaternen:</strong> Ideal fuer die Beleuchtung ganzer Raeume. Viele Modelle laufen mit AA-Batterien und leuchten bis zu 100 Stunden im Sparmodus.</li>
<li><strong>Stirnlampen:</strong> Beide Haende bleiben frei — unverzichtbar beim Kochen, Aufraeumen oder Treppensteigen im Dunkeln.</li>
<li><strong>Kerzen und Teelichter:</strong> Als Ergaenzung nutzbar, aber immer mit Vorsicht. Stellen Sie Kerzen immer in feuerfeste Halter und lassen Sie sie nie unbeaufsichtigt.</li>
</ul>
<p><em>Tipp: Stellen Sie eine brennende Taschenlampe aufrecht in ein grosses Glas oder eine helle Plastikflasche mit Wasser. Das Wasser verteilt das Licht gleichmaessig im Raum — ein improvisierter Lampenschirm.</em></p>`,
      },
      {
        heading: 'Kochen ohne Strom',
        content: `<p>Wenn Herd und Mikrowelle ausfallen, muessen Sie auf alternative Kochmoeglichkeiten zurueckgreifen. Die sicherste Loesung ist ein Campingkocher auf dem Balkon oder im Garten.</p>
<p><strong>Moeglichkeiten im Ueberblick:</strong></p>
<ul>
<li><strong>Campingkocher (Gas):</strong> Schnell, effizient, gut regelbar. Immer mit ausreichender Belueftung oder im Freien nutzen.</li>
<li><strong>Holzkohle- oder Gasgrill:</strong> Eignet sich zum Kochen und Braten. <strong>Ausschliesslich im Freien</strong> verwenden — niemals in der Garage, im Keller oder in der Wohnung. Kohlenmonoxid ist toedlich.</li>
<li><strong>Fondue- oder Rechaud-Set:</strong> Brennpaste (Ethanol) als Brennstoff. Gut fuer kleine Mahlzeiten. Auch hier fuer Belueftung sorgen.</li>
<li><strong>Selbstwaermer und flammenlose Rationenerhitzer:</strong> Erwaermen Nahrung ohne offene Flamme durch chemische Reaktion mit Wasser. Im Outdoor-Handel erhaeltlich.</li>
</ul>
<p><strong>Was kochen?</strong> Setzen Sie auf Gerichte, die schnell gar sind und wenig Wasser brauchen: Instantnudeln, Doseneintopf, Couscous (nur heisses Wasser noetig), Haferbrei. Konserven koennen notfalls auch kalt gegessen werden — sie sind bereits durchgegart.</p>`,
      },
    ],
  },

  // ─── 5. Hochwasser ─────────────────────────────────────────────────
  {
    id: 'hochwasser',
    title: 'Hochwasser — richtig handeln',
    icon: 'Waves',
    category: 'notfall_szenarien',
    teaser:
      'Hochwasser gehoert zu den haeufigsten Naturkatastrophen in Deutschland. Wer vorbereitet ist und richtig handelt, schuetzt Leben und Eigentum.',
    sections: [
      {
        heading: 'Vorbereitung vor dem Hochwasser',
        content: `<p>Wenn Sie in einem hochwassergefaehrdeten Gebiet leben, koennen Sie durch Vorbereitung die Schaeden erheblich reduzieren. Pruefen Sie auf den Hochwassergefahrenkarten Ihres Bundeslandes, ob Ihr Grundstueck betroffen sein koennte.</p>
<p><strong>Bauliche Vorsorge:</strong></p>
<ul>
<li><strong>Rueckstauklappe:</strong> Lassen Sie eine Rueckstauklappe in die Abwasserleitung einbauen. Sie verhindert, dass bei Kanalrueckstau Schmutzwasser in den Keller drueckt. Lassen Sie die Klappe jaehrlich warten.</li>
<li><strong>Sandsaecke und Schutzwaende:</strong> Halten Sie Sandsaecke oder mobile Hochwasserschutzwaende bereit. Sandsaecke zu zwei Dritteln fuellen, nie ganz voll. Legen Sie sie ueberlappend wie Mauerwerk vor Tueren und Kellerfenster.</li>
<li><strong>Kellerraeumung:</strong> Lagern Sie keine wertvollen Gegenstaende, wichtigen Dokumente oder Chemikalien im Keller. Installieren Sie Steckdosen im Keller moeglichst hoch (ueber der zu erwartenden Hochwassermarke).</li>
<li><strong>Heizoel-Tanks:</strong> Heizoel-Tanks muessen gegen Aufschwimmen gesichert sein. Austretendes Heizoel verursacht massive Umweltschaeden und macht das Haus oft unbewohnbar.</li>
</ul>
<p><strong>Organisatorische Vorsorge:</strong> Packen Sie ein Notgepaeck (siehe Ratgeber Evakuierung). Fotografieren Sie wertvolle Gegenstaende und Raeume fuer die Versicherungsdokumentation. Bewahren Sie wichtige Dokumente in wasserdichten Behaeltern im Obergeschoss auf.</p>`,
      },
      {
        heading: 'Waehrend des Hochwassers',
        content: `<p>Wenn das Wasser steigt, zaehlt jede Minute. Handeln Sie schnell, aber ueberlegt.</p>
<p><strong>Sofortmassnahmen:</strong></p>
<ul>
<li><strong>Strom abschalten:</strong> Schalten Sie die Sicherung fuer alle Raeume ab, die vom Wasser erreicht werden koennten. <em>Betreten Sie keine ueberfluteten Raeume</em>, in denen noch Strom angeschlossen ist — Lebensgefahr durch Stromschlag!</li>
<li><strong>Gas abstellen:</strong> Drehen Sie den Gashahn am Zaehler zu.</li>
<li><strong>In hoehergelegene Stockwerke gehen:</strong> Bringen Sie sich, Ihre Familie und Haustiere in Sicherheit. Nehmen Sie Ihr Notgepaeck, Trinkwasser, Lebensmittel und Mobiltelefon mit.</li>
<li><strong>Nachbarn warnen:</strong> Informieren Sie besonders aeltere oder mobilitaetseingeschraenkte Nachbarn.</li>
</ul>
<p><strong>Was Sie unbedingt vermeiden muessen:</strong></p>
<ul>
<li><strong>Niemals durch fliessendes Hochwasser waten oder fahren.</strong> Bereits 15 cm schnell fliessendes Wasser koennen einen Erwachsenen umwerfen. 30 cm genuegen, um ein Auto wegzuschwemmen. Unter dem Wasser koennen Gullydeckel fehlen oder Gegenstaende lauern.</li>
<li><strong>Keinen Keller betreten</strong>, wenn Wasser eindringt. Der Wasserstand kann in Minuten auf gefaehrliche Hoehen steigen.</li>
<li><strong>Keine elektrischen Geraete</strong> in ueberschwemmten Bereichen nutzen.</li>
</ul>`,
      },
      {
        heading: 'Evakuierung bei Hochwasser',
        content: `<p>Wenn die Behoerden eine Evakuierung anordnen, folgen Sie dieser Anweisung <strong>sofort</strong>. Warten Sie nicht, bis das Wasser Ihre Tuer erreicht — dann ist es oft schon zu spaet fuer eine sichere Evakuierung.</p>
<p><strong>Evakuierungsplan:</strong></p>
<ul>
<li><strong>Sammelstellen kennen:</strong> Informieren Sie sich vorab ueber die Evakuierungsstellen Ihrer Gemeinde. Diese finden Sie auf der Website Ihrer Kommune, in der NINA-Warn-App oder beim Buergeramt.</li>
<li><strong>Fluchtrouten planen:</strong> Legen Sie mindestens zwei verschiedene Routen fest, da Strassen ueberflutet sein koennen. Meiden Sie Unterfuehrungen, Tunnel und Flussnaehe.</li>
<li><strong>Notgepaeck mitnehmen:</strong> Dokumente, Medikamente, Bargeld, warme Kleidung, Trinkwasser (siehe Ratgeber "Evakuierung").</li>
<li><strong>Haus sichern:</strong> Wenn Zeit bleibt: Strom und Gas abstellen, Fenster und Tueren schliessen (nicht abschliessen, damit Rettungskraefte Zugang haben), Sandsaecke platzieren.</li>
</ul>
<p><em>Wichtig: Verlassen Sie niemals Ihr Haus durch tief stehendes Wasser zu Fuss, wenn sich das Wasser schnell bewegt. Warten Sie notfalls auf dem Dachboden oder Dach auf Rettung und machen Sie sich durch Rufen, Winken oder eine Taschenlampe bemerkbar.</em></p>`,
      },
      {
        heading: 'Nach dem Hochwasser: Aufraeumen und Trockenlegen',
        content: `<p>Wenn das Wasser zurueckgeht, beginnt die muehsame Arbeit der Schadensbeseitigung. Gehen Sie systematisch vor und schuetzen Sie Ihre Gesundheit.</p>
<p><strong>Gebaeude pruefen:</strong></p>
<ul>
<li>Betreten Sie Ihr Haus erst, wenn die Behoerden es freigegeben haben. Pruefen Sie die Statik: Schiefe Waende, Risse im Mauerwerk oder absackende Boeden sind Warnsignale — verlassen Sie das Gebaeude sofort und kontaktieren Sie einen Statiker.</li>
<li>Lassen Sie die <strong>Elektrik von einem Fachmann pruefen</strong>, bevor Sie den Strom wieder einschalten. Nasse Leitungen und Verteilerdosen koennen Kurzschluesse und Braende verursachen.</li>
<li>Ueberpruefen Sie Gas- und Wasserleitungen auf Schaeden. Wenn Sie Gas riechen, sofort das Gebaeude verlassen und die Feuerwehr rufen.</li>
</ul>
<p><strong>Trockenlegung und Schimmelvorbeugung:</strong></p>
<ul>
<li>Pumpen Sie stehendes Wasser ab, sobald der Grundwasserspiegel es erlaubt. Zu schnelles Abpumpen kann bei hohem Grundwasserdruck Schaeden an der Bodenplatte verursachen.</li>
<li>Oeffnen Sie alle Fenster und Tueren fuer maximale Durchlueftung. Nutzen Sie Bautrockner und Ventilatoren, wenn Strom verfuegbar ist.</li>
<li>Entfernen Sie durchnaesste Daemmmaterialien, Teppiche, Gipskartonplatten und Tapeten. Diese Materialien trocknen nie vollstaendig und sind ideale Naehrboeden fuer Schimmel.</li>
<li><strong>Schimmelvorbeugung:</strong> Schimmelsporen koennen sich innerhalb von 24 bis 48 Stunden bilden. Desinfizieren Sie betroffene Flaechen mit geeigneten Mitteln. Tragen Sie dabei Schutzkleidung, Handschuhe und eine FFP2-Maske.</li>
</ul>
<p><strong>Dokumentation:</strong> Fotografieren Sie alle Schaeden gruendlich fuer Ihre Versicherung, <em>bevor</em> Sie mit dem Aufraeumen beginnen. Erstellen Sie eine detaillierte Schadensliste mit geschaetzten Werten.</p>`,
      },
    ],
  },

  // ─── 6. Evakuierung ────────────────────────────────────────────────
  {
    id: 'evakuierung',
    title: 'Evakuierung — Notgepaeck packen',
    icon: 'LogOut',
    category: 'notfall_szenarien',
    teaser:
      'Im Ernstfall muessen Sie Ihr Zuhause schnell verlassen koennen. Ein fertig gepacktes Notgepaeck spart wertvolle Minuten.',
    sections: [
      {
        heading: 'Was Sie IMMER mitnehmen muessen',
        content: `<p>Wenn Sie Ihr Zuhause verlassen muessen, zaehlt jede Minute. Es ist keine Zeit, lange zu suchen. Die folgenden Dinge sollten Sie <strong>jederzeit griffbereit</strong> haben — idealerweise in einer wasserdichten Mappe oder Tasche an einem festen Platz.</p>
<p><strong>Dokumente (Originale oder beglaubigte Kopien):</strong></p>
<ul>
<li>Personalausweis oder Reisepass</li>
<li>Krankenversicherungskarte und Impfpass</li>
<li>Geburtsurkunde, Heiratsurkunde</li>
<li>Eigentumsnachweise (Grundbuchauszug, Fahrzeugbrief)</li>
<li>Versicherungspolicen (Hausrat, Gebaeude, Haftpflicht)</li>
<li>Testament, Vorsorgevollmacht, Patientenverfuegung</li>
</ul>
<p><strong>Ausserdem unverzichtbar:</strong></p>
<ul>
<li><strong>Medikamente:</strong> Mindestens einen Wochenvorrat aller regelmaessig eingenommenen Medikamente. Dazu ein Zettel mit Medikamentennamen, Dosis und behandelndem Arzt.</li>
<li><strong>Bargeld:</strong> Mindestens 300 bis 500 Euro in kleinen Scheinen und Muenzen. Bei Stromausfall funktionieren keine Geldautomaten und keine Kartenzahlung.</li>
<li><strong>Mobiltelefon und Ladekabel:</strong> Dazu eine Powerbank.</li>
<li><strong>Schluessel:</strong> Haus, Auto, Tresor.</li>
</ul>
<p><em>Tipp: Scannen Sie alle wichtigen Dokumente ein und speichern Sie sie verschluesselt in einer Cloud oder auf einem USB-Stick, den Sie am Schluesselring tragen.</em></p>`,
      },
      {
        heading: 'Notgepaeck fuer 3 Tage — die Rucksack-Checkliste',
        content: `<p>Das Notgepaeck soll Sie und Ihre Familie fuer mindestens <strong>3 Tage autark</strong> versorgen. Packen Sie fuer jede Person einen Rucksack — Koffer sind unpraktisch, wenn Sie zu Fuss gehen muessen.</p>
<p><strong>Essen und Trinken:</strong></p>
<ul>
<li>2 Liter Wasser pro Person pro Tag (Flaschen oder Faltkanister)</li>
<li>Energieriegel, Trockenobst, Nuesse, Kekse</li>
<li>Konserven mit Ringzug-Oeffner (kein Dosenoeffner noetig)</li>
<li>Instant-Kaffee oder Teebeutel (Komfort fuer die Moral)</li>
</ul>
<p><strong>Kleidung und Schutz:</strong></p>
<ul>
<li>Wetterfeste Jacke, warmer Pullover</li>
<li>Ersatzunterwaesche und Socken (2 Paar)</li>
<li>Feste, bequeme Schuhe (bereits eingelaufen!)</li>
<li>Regenponcho oder Muellsack als Notfall-Regenschutz</li>
</ul>
<p><strong>Werkzeuge und Hilfsmittel:</strong></p>
<ul>
<li>Taschenlampe mit Ersatzbatterien</li>
<li>Multifunktionswerkzeug (Taschenmesser mit Dosenoeffner)</li>
<li>Feuerzeug und Sturmstreichhoelzer (wasserdicht verpackt)</li>
<li>Erste-Hilfe-Set</li>
<li>Rettungsdecke (Rettungsfolie)</li>
<li>Pfeife (zur Signalgebung)</li>
<li>Notizbuch und Bleistift (funktioniert auch bei Naesse)</li>
</ul>
<p><strong>Hygiene:</strong> Zahnbuerste, kleine Tube Zahnpasta, Seife, Handdesinfektionsmittel, Toilettenpapier, Feuchttuecher, Muellbeutel, Damenhygieneartikel.</p>`,
      },
      {
        heading: 'Kinder und Senioren: besondere Beduerfnisse',
        content: `<p>Bei einer Evakuierung brauchen Kinder und aeltere Menschen besondere Aufmerksamkeit. Ihre Beduerfnisse unterscheiden sich deutlich von denen gesunder Erwachsener.</p>
<p><strong>Fuer Kinder:</strong></p>
<ul>
<li><strong>Babys:</strong> Windeln (Vorrat fuer mindestens 3 Tage), Flaeschennahrung und steriles Wasser, Flaschenwaaermer fuer unterwegs (Thermosflasche mit heissem Wasser), Schnuller, Wickelunterlage.</li>
<li><strong>Kleinkinder:</strong> Lieblingskuscheltier oder Schmusedecke — diese Gegenstaende geben emotionale Sicherheit und sind in einer Krise unschaetzbar. Lieblingssnacks, Trinkflasche.</li>
<li><strong>Schulkinder:</strong> Beschaeftigungsmaterial (kleines Buch, Kartenspiel, Malstifte). Kinder erleben Stress anders als Erwachsene — Routine und Beschaeftigung helfen enorm.</li>
<li>Kleidung in der <em>aktuellen</em> Groesse bereithalten — Kinder wachsen schnell, pruefen Sie die Notfall-Kleidung alle 6 Monate.</li>
</ul>
<p><strong>Fuer Senioren:</strong></p>
<ul>
<li><strong>Medikamente:</strong> Vollstaendige Medikamentenliste mit Dosierungen. Genug Vorrat fuer mindestens eine Woche. Kuehlpflichtige Medikamente (z. B. Insulin) in einer Kuehltasche transportieren.</li>
<li><strong>Hilfsmittel:</strong> Ersatzbrille, Hoergeraete-Batterien, Gehstock oder Rollator.</li>
<li><strong>Mobilitaet:</strong> Planen Sie, wie Sie mobilitaetseingeschraenkte Personen transportieren. Sprechen Sie mit Nachbarn ueber gegenseitige Hilfe.</li>
<li><strong>Kontaktliste:</strong> Schriftliche Liste mit Telefonnummern von Familienangehoerigen, Hausarzt, Pflegedienst. Nicht nur im Handy speichern — was, wenn der Akku leer ist?</li>
</ul>`,
      },
      {
        heading: 'Haustiere bei Evakuierung',
        content: `<p>Ihre Haustiere sind Familienmitglieder — lassen Sie sie nicht zurueck. Allerdings nehmen nicht alle Notunterkuenfte Tiere auf. Planen Sie deshalb im Voraus.</p>
<ul>
<li><strong>Transportbox oder Leine:</strong> Katzen, Kaninchen und kleine Tiere muessen in einer gesicherten Transportbox mitgenommen werden. Hunde an der Leine mit Halsband und Adressanhaenger.</li>
<li><strong>Futter und Wasser:</strong> Trockenfutter fuer mindestens 3 Tage, ein Napf fuer Wasser und Futter, Wasservorrat.</li>
<li><strong>Impfpass und Chip-Nummer:</strong> Manche Notunterkuenfte verlangen einen Nachweis aktueller Impfungen. Notieren Sie die Chipnummer Ihres Tieres.</li>
<li><strong>Medikamente:</strong> Falls Ihr Tier regelmaessig Medikamente benoetigt, packen Sie einen Vorrat ein.</li>
<li><strong>Alternativer Unterbringungsort:</strong> Sprechen Sie im Voraus mit Verwandten, Freunden oder einem Tierheim ab, wo Ihr Tier im Notfall untergebracht werden kann, falls die Sammelunterkunft keine Tiere erlaubt.</li>
</ul>
<p><em>Wichtig: Binden Sie Ihr Tier niemals im Haus an, wenn Sie evakuieren. Steigendes Wasser oder Feuer wuerde das Tier toeten. Nehmen Sie es mit oder lassen Sie es frei, damit es sich selbst in Sicherheit bringen kann.</em></p>`,
      },
      {
        heading: 'Haus verlassen: Strom, Gas, Wasser abstellen',
        content: `<p>Bevor Sie Ihr Haus verlassen, sollten Sie es so gut wie moeglich sichern, um Folgeschaeden zu minimieren.</p>
<p><strong>Checkliste vor dem Verlassen:</strong></p>
<ul>
<li><strong>Strom:</strong> Schalten Sie den Hauptsicherungsschalter aus. So vermeiden Sie Kurzschluesse und Braende, wenn Wasser in die Elektrik eindringt oder wenn bei Stromrueckkehr Spannungsspitzen auftreten.</li>
<li><strong>Gas:</strong> Drehen Sie den Gashahn am Zaehler zu. Wenn Sie Gas riechen, oeffnen Sie Fenster und verlassen Sie sofort das Haus — kein Licht einschalten, kein Feuerzeug benutzen!</li>
<li><strong>Wasser:</strong> Stellen Sie die Hauptwasserleitung ab. So verhindern Sie, dass ein Rohrbruch waehrend Ihrer Abwesenheit das Haus flutet.</li>
<li><strong>Fenster und Tueren:</strong> Schliessen Sie alle Fenster und Tueren. Bei Hochwasser: Kellerfenster und -tueren mit Sandsaecken oder Schutzplatten sichern.</li>
<li><strong>Herd und Ofen:</strong> Pruefen Sie, ob Herd, Backofen und andere Waermequellen ausgeschaltet sind.</li>
<li><strong>Wertgegenstaende:</strong> Bringen Sie wenn moeglich Wertsachen aus dem Keller in hoehergelegene Stockwerke.</li>
</ul>
<p><em>Tipp: Machen Sie vor der Evakuierung Fotos von jedem Raum als Bestandsdokumentation fuer die Versicherung. Das dauert nur wenige Minuten und kann spaeter tausende Euro wert sein.</em></p>`,
      },
    ],
  },

  // ─── 7. Notkochen ──────────────────────────────────────────────────
  {
    id: 'notkochen',
    title: 'Kochen ohne Strom',
    icon: 'Utensils',
    category: 'wasser_nahrung',
    teaser:
      'Wenn Herd und Mikrowelle ausfallen, muessen Sie trotzdem essen. Lernen Sie, wie Sie sicher und ohne Strom kochen koennen.',
    sections: [
      {
        heading: 'Campingkocher: Typen und Sicherheit',
        content: `<p>Ein Campingkocher ist die beste Investition fuer die Notfallvorsorge. Er ist kompakt, zuverlaessig und einfach zu bedienen. Es gibt verschiedene Typen mit unterschiedlichen Vor- und Nachteilen.</p>
<p><strong>Gaskocher mit Schraubkartusche:</strong> Am weitesten verbreitet. Butangas- oder Butan-Propan-Mischung. Einfache Handhabung, gute Leistung, stufenlos regelbar. Nachteil: Funktioniert bei Temperaturen unter minus 5 Grad schlecht (Butan verdampft nicht mehr). Fuer den Hausgebrauch im Notfall die beste Wahl.</p>
<p><strong>Spirituskocher (Trangia-System):</strong> Brennstoff (Ethanol/Brennspiritus) ist ueberall erhaeltlich und billig. Sehr robust, keine beweglichen Teile. Nachteil: Laengere Kochzeit, schwer regelbar, Flamme bei Tageslicht fast unsichtbar (Verbrennungsgefahr).</p>
<p><strong>Esbit-Kocher (Trockenbrennstoff):</strong> Ultraleicht und kompakt. Gut als Backup im Notgepaeck. Nachteil: Geringe Heizleistung, nur fuer kleine Toepfe und Tassen geeignet, starker Geruch.</p>
<p><strong>Grundsaetzliche Sicherheitsregeln fuer alle Kocher:</strong></p>
<ul>
<li>Nur <strong>im Freien oder bei weit geoeffneten Fenstern</strong> betreiben</li>
<li><strong>Stabile, feuerfeste Unterlage</strong> verwenden</li>
<li><strong>Nie unbeaufsichtigt</strong> lassen</li>
<li>Brennstoff erst nachfuellen, wenn der Kocher <strong>vollstaendig abgekuehlt</strong> ist</li>
<li>Brennstoff in Originalbehaeltern lagern und <strong>von Hitzequellen fernhalten</strong></li>
</ul>`,
      },
      {
        heading: 'Grill als Notkochstelle',
        content: `<p>Ein Holzkohle- oder Gasgrill eignet sich im Notfall hervorragend zum Kochen, Braten und Erwaermen von Mahlzeiten. Aber es gibt eine Regel, die keine Ausnahme kennt:</p>
<p><strong>Einen Grill duerfen Sie AUSSCHLIESSLICH im Freien betreiben. Nicht in der Wohnung, nicht in der Garage, nicht im Keller, nicht unter dem Carport.</strong></p>
<p>Holzkohlegrills erzeugen grosse Mengen <strong>Kohlenmonoxid (CO)</strong> — ein farbloses, geruchloses, toedliches Gas. Bereits wenige Minuten in einem geschlossenen Raum koennen toedlich sein. Jedes Jahr sterben in Deutschland Menschen an CO-Vergiftung durch Grills in Innenraeumen.</p>
<p><strong>Sicher grillen im Notfall:</strong></p>
<ul>
<li>Stellen Sie den Grill auf dem Balkon, der Terrasse oder im Garten auf — mindestens 3 Meter entfernt von Hauswand, Fenstern und brennbaren Materialien.</li>
<li>Bei starkem Wind den Grill windgeschuetzt aufstellen, aber <em>nicht</em> in geschlossene Bereiche.</li>
<li>Nutzen Sie zum Kochen einen Topf oder eine Pfanne auf dem Grillrost. Aluminiumfolie als Unterlage erleichtert das Aufraeumen.</li>
<li>Glut nach dem Kochen vollstaendig ausbrennen lassen oder mit Sand loeschen. <em>Kein Wasser</em> auf heisse Kohle giessen (Dampfexplosion, Verbruehungsgefahr).</li>
</ul>`,
      },
      {
        heading: 'Dosennahrung erwaermen — einfache Methoden',
        content: `<p>Konserven sind bereits durchgegart und koennen notfalls auch kalt gegessen werden. Warm schmecken sie aber deutlich besser und tragen zum Wohlbefinden bei — das ist in einer Krisensituation nicht zu unterschaetzen.</p>
<p><strong>Methoden zum Erwaermen ohne Herd:</strong></p>
<ul>
<li><strong>Teelicht-Ofen:</strong> Stellen Sie 3 bis 4 Teelichter auf eine feuerfeste Unterlage. Darauf ein kleines Grillrost oder zwei Backsteine als Auflage, darauf den Topf. Die Leistung ist gering, aber fuer Suppen und Eintoepfe genuegt es. Rechnen Sie mit 20 bis 30 Minuten fuer 500 ml.</li>
<li><strong>Brennpaste / Fondue-Brenner:</strong> Effektiver als Teelichter. Die Dose unter ein kleines Gestell stellen, Topf darauf. Gut fuer mittelgrosse Portionen.</li>
<li><strong>Doseninhalt direkt erwaermen:</strong> Oeffnen Sie die Dose, stellen Sie sie in heisses Wasser (Wasserbad-Methode) oder stellen Sie die geoeffnete Dose auf eine stabile Waermequelle. Erwaermen Sie den Inhalt nur bis er dampft, nicht kochen lassen (Spritzgefahr).</li>
</ul>
<p><em>Warnung: Erwaermen Sie niemals eine geschlossene Dose! Der Ueberdruck kann dazu fuehren, dass die Dose explodiert und heissen Inhalt versprueht.</em></p>
<p><strong>Tipp:</strong> Eine Thermoskanne ist im Notfall Gold wert. Kochen Sie morgens Wasser auf dem Campingkocher und fuellen Sie es in die Thermoskanne. Damit koennen Sie den ganzen Tag ueber Instant-Suppen, Tee oder Babyflaeschchen zubereiten, ohne jedes Mal den Kocher anwerfen zu muessen.</p>`,
      },
      {
        heading: 'Einfache Notfall-Rezepte',
        content: `<p>Im Notfall muessen Mahlzeiten vor allem drei Kriterien erfuellen: <strong>schnell zubereitet, nahrhaft und mit wenig Ausruestung machbar</strong>. Hier sind bewaehrte Rezepte aus dem Notvorrat.</p>
<p><strong>Warmer Haferbrei (Porridge):</strong> 100 g Haferflocken mit 300 ml Wasser aufkochen, 3 Minuten ruehren. Nach Geschmack Zucker, Honig, Trockenobst oder Nuesse dazugeben. Liefert langanhaltende Energie und waermt von innen.</p>
<p><strong>Couscous mit Dosengemuese:</strong> 200 g Couscous in eine Schuessel geben, mit 200 ml kochendem Wasser uebergiessen, abdecken, 5 Minuten quellen lassen. Dosengemuese (Mais, Erbsen, Bohnen) unterruehren. Wuerzen mit Salz, Pfeffer, etwas Oel. Satt machend und in unter 10 Minuten fertig.</p>
<p><strong>Doseneintopf aufgepeppt:</strong> Linsen- oder Erbseneintopf aus der Dose erwaermen. Dazu Knaeckebrot oder Zwieback. Wenn verfuegbar: ein Loeffel Senf oder getrocknete Kraeuter untermischen fuer besseren Geschmack.</p>
<p><strong>Nudeln mit Tomatensauce:</strong> Nudeln in Salzwasser kochen (7 bis 10 Minuten). Passierte Tomaten aus dem Tetrapak erwaermen, mit Salz und getrockneten Kraeutern wuerzen. Einfach, kalorienreich und beliebt bei Kindern.</p>
<p><strong>Muesliriegel ohne Backen:</strong> Haferflocken, Honig, Nuesse, Trockenobst und etwas Oel vermengen. In eine Form druecken und kaltstellen (im Winter auf dem Balkon). Nach einer Stunde in Riegel schneiden. Perfekt als Marschverpflegung.</p>`,
      },
      {
        heading: 'Lebensmittel ohne Kuehlung: Was haelt wie lange?',
        content: `<p>Ohne Kuehlschrank muessen Sie wissen, welche Lebensmittel auch bei Raumtemperatur sicher geniessbar bleiben.</p>
<p><strong>Sehr lange haltbar (Monate bis Jahre):</strong></p>
<ul>
<li><strong>Konserven</strong> (Fleisch, Fisch, Gemuese, Obst, Suppen): Mindestens 2 Jahre, oft deutlich laenger. Nach dem Oeffnen innerhalb von 24 Stunden verbrauchen.</li>
<li><strong>Honig:</strong> Praktisch unbegrenzt haltbar. Kristallisierter Honig ist nicht schlecht — im Wasserbad erwaermen.</li>
<li><strong>Trockennahrung:</strong> Nudeln, Reis, Haferflocken, Linsen, Couscous — in luftdichten Behaeltern 1 bis 2 Jahre und laenger.</li>
<li><strong>Knaeckebrot und Zwieback:</strong> In der Originalverpackung 12 Monate und mehr.</li>
<li><strong>Zucker und Salz:</strong> Unbegrenzt haltbar, wenn trocken gelagert.</li>
</ul>
<p><strong>Mittlere Haltbarkeit (Wochen bis Monate):</strong></p>
<ul>
<li><strong>Kartoffeln:</strong> 2 bis 4 Monate bei kuehl-dunkler Lagerung (Keller).</li>
<li><strong>Zwiebeln und Knoblauch:</strong> 2 bis 3 Monate, trocken und luftig lagern.</li>
<li><strong>Aepfel:</strong> 2 bis 4 Wochen bei Raumtemperatur, laenger im kuehlen Keller.</li>
<li><strong>Hartkaese (ganz, ungeschnitten):</strong> Mehrere Wochen auch ohne Kuehlung.</li>
</ul>
<p><strong>Schnell verderblich (Stunden bis wenige Tage ohne Kuehlung):</strong></p>
<ul>
<li>Frisches Fleisch und Fisch: Innerhalb weniger Stunden verderbt. Nur durchgegart aufbewahren, dann 24 Stunden.</li>
<li>Milch und Milchprodukte: Pasteurisierte Milch hoechstens einen Tag. H-Milch haelt ungeoeffnet monatelang, geoeffnet 2 bis 3 Tage.</li>
<li>Eier: Bei Raumtemperatur etwa 10 bis 14 Tage haltbar (in Deutschland oft vorher gekuehlt, dann kuerzere Haltbarkeit).</li>
</ul>`,
      },
    ],
  },

  // ─── 8. Kommunikation ──────────────────────────────────────────────
  {
    id: 'kommunikation',
    title: 'Kommunikation im Notfall',
    icon: 'Radio',
    category: 'grundlagen',
    teaser:
      'Wenn Internet und Handynetz ausfallen, muessen Sie trotzdem informiert bleiben und Ihre Familie erreichen koennen.',
    sections: [
      {
        heading: 'UKW-Radio: Warum analog wichtig ist',
        content: `<p>In einer Krise ist Information lebenswichtig. Sie muessen wissen: Was ist passiert? Wie lange dauert es? Wo gibt es Hilfe? Die behoerdlichen Informationen laufen ueber den <strong>oeffentlich-rechtlichen Rundfunk</strong> — und der sendet auch dann weiter, wenn Internet und Mobilfunk laengst ausgefallen sind.</p>
<p>UKW-Sender (Ultrakurzwelle) verfuegen ueber <strong>Notstromaggregate</strong>, die den Sendebetrieb fuer Tage aufrechterhalten koennen. Die Bundeslaender haben mit den Sendern Notfall-Vereinbarungen, die im Krisenfall aktiviert werden. Ueber UKW erhalten Sie dann Durchsagen zu Evakuierungen, Wasserausgabestellen, Notunterkuenften und Verhaltensregeln.</p>
<p><strong>Warum nicht DAB+ oder Internet-Radio?</strong> DAB+ (digitales Radio) braucht deutlich mehr Strom als UKW und die Empfaenger sind stromhungriger. Internetradio ist ohne funktionierendes Internet wertlos. UKW funktioniert mit einfachster Technik und minimalem Stromverbrauch — selbst ein selbstgebauter Kristalldetektor kann UKW empfangen.</p>
<p>Notieren Sie sich die UKW-Frequenzen Ihres lokalen Senders (z. B. WDR, NDR, BR, SWR) und bewahren Sie den Zettel bei Ihrem Notfallradio auf. Im Stress sucht man nicht lange auf dem Senderscale.</p>`,
      },
      {
        heading: 'Kurbelradio vs. batteriebetrieben',
        content: `<p>Fuer den Notfall sollten Sie ein <strong>stromunabhaengiges Radio</strong> besitzen. Die zwei gaengigsten Optionen sind Kurbelradios und batteriebetriebene Radios.</p>
<p><strong>Kurbelradio (Dynamo-Radio):</strong></p>
<ul>
<li><strong>Vorteil:</strong> Funktioniert ohne Batterien und Strom. Eine Minute Kurbeln ergibt ca. 15 bis 30 Minuten Empfang. Viele Modelle haben zusaetzlich ein kleines Solarpanel und einen integrierten Akku, der auch per USB geladen werden kann.</li>
<li><strong>Vorteil:</strong> Oft mit eingebauter Taschenlampe und USB-Ausgang zum Handy-Laden (allerdings sehr langsam).</li>
<li><strong>Nachteil:</strong> Kurbeln ist muehsam und laut. Die Lautstaerke ist oft begrenzt. Guenstige Modelle haben schlechten Empfang.</li>
</ul>
<p><strong>Batteriebetriebenes Radio:</strong></p>
<ul>
<li><strong>Vorteil:</strong> Sofort einsatzbereit, guter Empfang, angemessene Lautstaerke. Einfache Bedienung auch fuer aeltere Menschen.</li>
<li><strong>Nachteil:</strong> Sie brauchen Ersatzbatterien. Ohne Batterien ist es nutzlos.</li>
</ul>
<p><strong>Empfehlung:</strong> Halten Sie beides bereit — ein batteriebetriebenes Radio fuer den taeglichen Gebrauch und ein Kurbelradio als absolute Notreserve. Pruefen Sie die Batterien zweimal jaehrlich (z. B. bei der Zeitumstellung) und tauschen Sie sie bei Bedarf aus.</p>`,
      },
      {
        heading: 'Warn-Apps: NINA und KATWARN',
        content: `<p>Solange das Mobilfunknetz noch funktioniert, sind Warn-Apps die schnellste Informationsquelle. Die beiden wichtigsten Apps in Deutschland sind <strong>NINA</strong> und <strong>KATWARN</strong>.</p>
<p><strong>NINA (Notfall-Informations- und Nachrichten-App):</strong></p>
<ul>
<li>Herausgegeben vom <strong>Bundesamt fuer Bevoelkerungsschutz und Katastrophenhilfe (BBK)</strong></li>
<li>Buendelt Warnungen des Modularen Warnsystems (MoWaS), des Deutschen Wetterdienstes (DWD) und der Hochwasserzentralen</li>
<li>Standortbezogene Warnungen: Sie erhalten Meldungen fuer Ihren aktuellen Aufenthaltsort und frei waehlbare Orte (z. B. Wohnort, Arbeitsplatz, Wohnort der Eltern)</li>
<li>Verfuegbar fuer iOS und Android, kostenlos</li>
</ul>
<p><strong>KATWARN:</strong></p>
<ul>
<li>Entwickelt vom Fraunhofer-Institut FOKUS</li>
<li>Ergaenzt NINA um kommunale Warnungen einzelner Staedte und Landkreise</li>
<li>Besonders verbreitet in Grossstaedten</li>
</ul>
<p><strong>Empfehlung:</strong> Installieren Sie <em>beide</em> Apps und aktivieren Sie die Push-Benachrichtigungen. Richten Sie Ihre relevanten Orte ein. Testen Sie die Apps, indem Sie pruefen, ob aktuelle Wetterwarnungen angezeigt werden. So stellen Sie sicher, dass alles funktioniert, bevor Sie die Apps im Ernstfall brauchen.</p>`,
      },
      {
        heading: 'Handy-Akku sparen im Notfall',
        content: `<p>Wenn der Strom ausfaellt, wird Ihr Handy-Akku zur kostbaren Ressource. Mit den richtigen Einstellungen koennen Sie die Laufzeit um das Drei- bis Fuenffache verlaengern.</p>
<p><strong>Sofortmassnahmen:</strong></p>
<ul>
<li><strong>Flugmodus aktivieren:</strong> Spart am meisten Energie, da das Handy nicht staendig nach Netz sucht. Schalten Sie den Flugmodus nur kurz aus, wenn Sie aktiv kommunizieren muessen.</li>
<li><strong>Bildschirmhelligkeit auf Minimum</strong> reduzieren. Der Bildschirm ist der groesste Stromverbraucher.</li>
<li><strong>WLAN, Bluetooth und GPS deaktivieren</strong>, wenn nicht benoetigt.</li>
<li><strong>Hintergrund-Apps schliessen</strong> und automatische Updates deaktivieren.</li>
<li><strong>Energiesparmodus aktivieren</strong> (alle modernen Smartphones haben diese Funktion).</li>
</ul>
<p><strong>Kommunikation optimieren:</strong></p>
<ul>
<li><strong>SMS statt Anrufe:</strong> Eine SMS verbraucht einen Bruchteil der Energie eines Telefonats und kommt auch bei ueberlasteten Netzen eher durch.</li>
<li><strong>Kurze, praezise Nachrichten:</strong> Schreiben Sie einmal gruendlich statt zehnmal nachzufragen. "Bin sicher bei Oma, Strom aus, alles ok" statt mehrerer Einzelnachrichten.</li>
<li><strong>Festnetz nutzen:</strong> Wenn ein analoges Festnetztelefon verfuegbar ist, nutzen Sie dieses fuer laengere Gespraeche. Alte Schnurtelefone (nicht DECT) funktionieren auch bei Stromausfall, solange die Telefonleitung intakt ist.</li>
</ul>
<p><strong>Vorsorge:</strong> Halten Sie immer eine vollgeladene Powerbank bereit (mindestens 10.000 mAh, besser 20.000 mAh). Lagern Sie sie bei Raumtemperatur und laden Sie sie alle 3 Monate nach, da Lithium-Akkus sich langsam selbst entladen.</p>`,
      },
      {
        heading: 'Nachbarschaftshilfe und Treffpunkte',
        content: `<p>Wenn Telefon und Internet komplett ausfallen, bleibt nur die direkte Kommunikation von Mensch zu Mensch. Eine gut organisierte Nachbarschaft ist in der Krise mehr wert als jede App.</p>
<p><strong>Vor der Krise vorbereiten:</strong></p>
<ul>
<li><strong>Nachbarn kennenlernen:</strong> Wissen Sie, wer in Ihrem Haus wohnt? Gibt es aeltere, alleinstehende oder mobilitaetseingeschraenkte Personen, die Hilfe brauchen koennten?</li>
<li><strong>Kontaktliste erstellen:</strong> Tauschen Sie Telefonnummern mit direkten Nachbarn aus. Legen Sie eine schriftliche Liste an — nicht nur digital im Handy.</li>
<li><strong>Treffpunkt vereinbaren:</strong> Bestimmen Sie einen Ort, an dem sich die Familie oder Nachbarschaft trifft, wenn Kommunikation nicht moeglich ist. Zum Beispiel: "Bei komplettem Kommunikationsausfall treffen wir uns taeglich um 10 Uhr am Brunnen auf dem Marktplatz."</li>
<li><strong>Aushang am Haus:</strong> Vereinbaren Sie ein einfaches Signal-System. Zum Beispiel: Ein gruenes Tuch im Fenster bedeutet "Alles in Ordnung", ein rotes Tuch bedeutet "Brauche Hilfe".</li>
</ul>
<p><strong>In der Krise:</strong></p>
<ul>
<li>Klopfen Sie bei Nachbarn, die Sie laenger nicht gesehen haben. Besonders bei aelteren oder kranken Menschen.</li>
<li>Teilen Sie Informationen, die Sie ueber Radio erfahren haben.</li>
<li>Organisieren Sie gemeinsame Kochstellen, wenn nur einzelne Personen einen Campingkocher oder Grill haben. Gemeinsames Kochen spart Brennstoff und staerkt den Zusammenhalt.</li>
</ul>
<p><em>Denken Sie daran: In jeder Krise gibt es mehr hilfsbereite Menschen als Egoisten. Nachbarschaftshilfe funktioniert — aber nur, wenn man sie vorher organisiert.</em></p>`,
      },
    ],
  },

  // ─── 9. Vorraete lagern ────────────────────────────────────────────
  {
    id: 'vorrat_lagern',
    title: 'Vorraete richtig lagern',
    icon: 'Package',
    category: 'wasser_nahrung',
    teaser:
      'Ein durchdachter Notvorrat muss nicht teuer sein und braucht nicht viel Platz. Entscheidend ist die richtige Lagerung und regelmaessige Rotation.',
    sections: [
      {
        heading: 'Ideale Lagerbedingungen',
        content: `<p>Die Haltbarkeit Ihrer Vorraete haengt massgeblich davon ab, <strong>wie</strong> Sie sie lagern. Falsche Lagerung kann selbst langlebige Konserven vorzeitig verderben lassen.</p>
<p><strong>Die vier Feinde der Vorratshaltung:</strong></p>
<ul>
<li><strong>Waerme:</strong> Hohe Temperaturen beschleunigen chemische Abbauprozesse und foerdern Bakterienwachstum. Ideal sind 10 bis 18 Grad Celsius. Bei jedem Grad mehr ueber 20 Grad verkuerzt sich die Haltbarkeit deutlich.</li>
<li><strong>Feuchtigkeit:</strong> Feuchtigkeit foerdert Schimmelbildung und laesst Verpackungen aufweichen. Die relative Luftfeuchtigkeit sollte unter 60 Prozent liegen. Lagern Sie nichts direkt auf dem Kellerboden — Kondenswasser sammelt sich dort.</li>
<li><strong>Licht:</strong> UV-Strahlung zerstoert Vitamine und veraendert den Geschmack. Lagern Sie Vorraete dunkel — in einem Schrank, Keller oder zumindest in blickdichten Behaeltern.</li>
<li><strong>Sauerstoff:</strong> Sauerstoff laesst Fette ranzig werden und foerdert oxidative Prozesse. Vakuumverpackte oder in luftdichte Behaelter umgefuellte Vorraete halten deutlich laenger.</li>
</ul>
<p><strong>Idealer Lagerort:</strong> Ein trockener, kuehler Keller oder eine innenliegende Vorratskammer ohne Fenster. Lagern Sie Vorraete auf Regalen oder Holzpaletten, nicht direkt auf Stein- oder Betonboeden. Stellen Sie sicher, dass die Luft um die Regale zirkulieren kann.</p>`,
      },
      {
        heading: 'FIFO-Prinzip: First In, First Out',
        content: `<p>Das FIFO-Prinzip ist die Grundregel jeder Vorratshaltung: Was zuerst gekauft wurde, wird zuerst verbraucht. So vermeiden Sie, dass Lebensmittel im hinteren Regaleck vergessen werden und verderben.</p>
<p><strong>Praktische Umsetzung:</strong></p>
<ul>
<li><strong>Neues nach hinten, Altes nach vorn:</strong> Wenn Sie neue Vorraete einraeumen, stellen Sie die neuen Artikel hinter die bestehenden. Greifen Sie immer von vorn.</li>
<li><strong>Datum markieren:</strong> Beschriften Sie jeden Artikel mit dem Kaufdatum (ein wasserfester Stift genuegt). Das Mindesthaltbarkeitsdatum allein reicht nicht, da Sie oft mehrere Chargen desselben Produkts haben.</li>
<li><strong>Regale beschriften:</strong> Kleben Sie Zettel an die Regale: "Nudeln", "Konserven", "Wasser". So finden Sie alles schnell und koennen den Bestand auf einen Blick ueberpruefen.</li>
<li><strong>Bestandsliste fuehren:</strong> Eine einfache Liste (Papier oder Smartphone-Notiz) mit Artikel, Menge und Ablaufdatum hilft Ihnen, den Ueberblick zu behalten und rechtzeitig nachzukaufen.</li>
</ul>
<p><em>Tipp: Haengen Sie die Bestandsliste an die Innenseite einer Schranktuer. Streichen Sie verbrauchte Artikel durch und schreiben Sie sie auf den Einkaufszettel. So wird Ihre Notvorsorge zum natuerlichen Teil des Alltags.</em></p>`,
      },
      {
        heading: 'Haltbarkeitsdaten verstehen',
        content: `<p>In Deutschland gibt es zwei verschiedene Datumskennzeichnungen auf Lebensmitteln — und der Unterschied kann im Notfall wichtig sein.</p>
<p><strong>Mindesthaltbarkeitsdatum (MHD) — "mindestens haltbar bis":</strong></p>
<ul>
<li>Das MHD ist eine <strong>Qualitaetsgarantie</strong> des Herstellers, keine Verfallsfrist. Es sagt: Bis zu diesem Datum garantiert der Hersteller Geschmack, Geruch, Farbe und Naehrwert.</li>
<li>Lebensmittel sind nach Ablauf des MHD <strong>oft noch wochen- oder monatelang geniessbar</strong>. Pruefen Sie mit Ihren Sinnen: Sieht es normal aus? Riecht es normal? Ist die Verpackung intakt und nicht aufgeblaeeht?</li>
<li>Konserven mit ueberschrittenem MHD sind haeufig noch Jahre spaeter sicher, solange die Dose unbeschaedigt ist (keine Beulen, kein Rost, kein aufgeblaehter Deckel).</li>
</ul>
<p><strong>Verbrauchsdatum — "zu verbrauchen bis":</strong></p>
<ul>
<li>Das Verbrauchsdatum findet sich auf <strong>leicht verderblichen</strong> Lebensmitteln wie frischem Fleisch, Fisch, Hackfleisch und Feinkostsalaten.</li>
<li>Nach Ablauf sollten diese Lebensmittel <strong>nicht mehr verzehrt werden</strong> — hier besteht ein echtes Gesundheitsrisiko durch Keime wie Salmonellen oder Listerien.</li>
</ul>
<p><strong>Im Zweifelsfall gilt:</strong> Vertrauen Sie Ihren Sinnen. Wenn ein Lebensmittel ungewoehnlich aussieht, riecht oder eine veraenderte Konsistenz hat, werfen Sie es weg. Im Notfall ist eine Lebensmittelvergiftung das Letzte, was Sie gebrauchen koennen.</p>`,
      },
      {
        heading: 'Rotation: Vorraete in den Alltag einbauen',
        content: `<p>Der beste Notvorrat ist kein staubiges Regal voller vergessener Dosen, sondern ein <strong>lebendiger Vorrat</strong>, der regelmaessig verbraucht und erneuert wird. Das Prinzip heisst "Lebender Vorrat" oder "Rolling Stock".</p>
<p><strong>So funktioniert es:</strong></p>
<ul>
<li><strong>Kaufen Sie Vorrats-Lebensmittel, die Sie tatsaechlich essen:</strong> Wenn Ihre Familie keine Linsensuppe mag, werden die Dosen jahrelang im Regal stehen. Bevorraten Sie stattdessen Nudeln, Reis, Tomatensauce — Dinge, die Sie regelmaessig kochen.</li>
<li><strong>Immer den doppelten Bedarf kaufen:</strong> Wenn Sie normalerweise 2 Packungen Nudeln pro Monat verbrauchen, halten Sie immer 4 vorraeitig. Verbrauchen Sie zwei, kaufen Sie zwei nach.</li>
<li><strong>Konserventag einfuehren:</strong> Kochen Sie einmal pro Woche ein Gericht aus Ihrem Vorrat. So rotieren die Konserven automatisch und Sie gewoehnen sich an die Gerichte — im Notfall ist dann nichts unbekannt.</li>
<li><strong>Saisonale Pruefung:</strong> Pruefen Sie zweimal im Jahr (z. B. bei der Zeitumstellung) Ihren gesamten Vorrat. Sortieren Sie Abgelaufenes aus, fuellen Sie Luecken auf, erneuern Sie Batterien in Taschenlampen und Radios.</li>
</ul>
<p><em>Praxis-Tipp: Viele Familien unterschaetzen, wie einfach Notvorsorge ist. Wenn Sie bei jedem regulaeren Einkauf nur 2 bis 3 haltbare Artikel extra kaufen, haben Sie innerhalb weniger Wochen einen soliden Vorrat aufgebaut — ohne grosse Einmalinvestition.</em></p>`,
      },
      {
        heading: 'Schaedlingsschutz und luftdichte Lagerung',
        content: `<p>Nichts ist aergerlicher als ein Vorratsregal voller Lebensmittelmotten oder Maeuse. Schaedlinge sind nicht nur eklig, sondern machen Ihre muehsam aufgebauten Vorraete unbrauchbar.</p>
<p><strong>Vorbeugung gegen Lebensmittelmotten:</strong></p>
<ul>
<li><strong>Sofort umfuellen:</strong> Fuellen Sie Mehl, Muesli, Haferflocken, Reis und Nudeln nach dem Kauf in <strong>luftdichte Behaelter</strong> um. Glas, Metall oder harter Kunststoff mit Gummidichtung eignen sich. Motten koennen sich durch Karton und duenne Plastikfolie fressen.</li>
<li><strong>Neue Ware pruefen:</strong> Motteneier koennen bereits beim Kauf im Produkt sein. Frieren Sie neue Mehl- und Getreideprodukte fuer 48 Stunden ein, bevor Sie sie einlagern — das toetet eventuell vorhandene Eier und Larven zuverlaessig ab.</li>
<li><strong>Regelmaessig kontrollieren:</strong> Pruefen Sie Ihre Vorraete monatlich auf Gespinste (feine Faeden), Larven oder kleine Loecher in Verpackungen.</li>
<li><strong>Lorbeerblaetter und Lavendel:</strong> Legen Sie getrocknete Lorbeerblaetter oder Lavendelsaeckchen zwischen die Vorraete. Der Geruch haelt viele Schaedlinge fern.</li>
</ul>
<p><strong>Schutz vor Nagetieren:</strong></p>
<ul>
<li>Lagern Sie keine Lebensmittel in Pappe oder duennem Plastik — Maeuse und Ratten nagen sich durch beides.</li>
<li>Halten Sie den Lagerraum sauber. Kruemel und offene Packungen ziehen Nagetiere an.</li>
<li>Verschliessen Sie moegliche Zugaenge: Maeuse passen durch Spalten ab 6 mm Breite. Pruefen Sie Tueren, Rohrdurchfuehrungen und Lueftungsoeffnungen.</li>
</ul>
<p><strong>Empfohlene Behaelter:</strong> Einmachglaeser mit Buegelverschluss, Edelstahl-Dosen mit Deckel, oder lebensmittelechte Kunststoffboxen (BPA-frei) mit Silikondichtung. Beschriften Sie jeden Behaelter mit Inhalt und Datum.</p>`,
      },
    ],
  },

  // ─── 10. Notfall mit Kindern ───────────────────────────────────────
  {
    id: 'notfall_kinder',
    title: 'Notfall mit Kindern',
    icon: 'Users',
    category: 'familie',
    teaser:
      'Kinder reagieren auf Krisen anders als Erwachsene. Mit der richtigen Vorbereitung und einfuehlsamer Kommunikation helfen Sie ihnen, schwierige Situationen zu bewaeltigen.',
    sections: [
      {
        heading: 'Kindern altersgerecht erklaeren',
        content: `<p>Kinder spueren Anspannung und Angst der Erwachsenen sofort — auch wenn Sie versuchen, alles vor ihnen zu verbergen. Schweigen und Verheimlichen verstaerkt ihre Angst, weil sie sich das Schlimmste vorstellen. Gleichzeitig sollten Sie Kinder nicht mit Informationen ueberfluten, die sie nicht verarbeiten koennen.</p>
<p><strong>Grundregeln der Krisenkommunikation mit Kindern:</strong></p>
<ul>
<li><strong>Ehrlich, aber altersgerecht:</strong> Erklaeren Sie in einfachen Worten, was passiert ist. "Es gibt gerade keinen Strom in unserer Stadt. Das kann ein paar Tage dauern. Wir haben uns gut vorbereitet und passen aufeinander auf."</li>
<li><strong>Nicht verharmlosen, nicht dramatisieren:</strong> Sagen Sie nicht "Es ist gar nichts" (das Kind merkt, dass etwas nicht stimmt) und auch nicht "Es ist ganz schlimm" (das verstaerkt die Angst). Bleiben Sie sachlich und ruhig.</li>
<li><strong>Gefuehle anerkennen:</strong> "Es ist voellig in Ordnung, dass du Angst hast. Mir geht es auch so. Aber wir sind zusammen und wir schaffen das."</li>
<li><strong>Fragen zulassen:</strong> Ermutigen Sie Kinder, Fragen zu stellen. Beantworten Sie sie ehrlich. Wenn Sie etwas nicht wissen, sagen Sie das: "Das weiss ich gerade nicht, aber wir werden es herausfinden."</li>
<li><strong>Kontrolle geben:</strong> Geben Sie Kindern kleine Aufgaben: Taschenlampe halten, Wasserflaschen zaehlen, Kerze beaufsichtigen (aeltere Kinder). Das Gefuehl, etwas Nuetzliches tun zu koennen, reduziert Angst erheblich.</li>
</ul>
<p><em>Fuer Kleinkinder (2 bis 5 Jahre) reichen sehr einfache Erklaerungen: "Das Licht funktioniert gerade nicht. Wir benutzen jetzt Kerzen und Taschenlampen, das ist wie Camping." Kinder in diesem Alter verstehen komplexe Zusammenhaenge noch nicht und brauchen vor allem Naehe und Routine.</em></p>`,
      },
      {
        heading: 'Routinen beibehalten',
        content: `<p>Kinder brauchen Struktur und Vorhersehbarkeit — das gilt in Krisenzeiten noch staerker als im Alltag. Gewohnte Ablaeufe geben Sicherheit und das Gefuehl, dass die Welt nicht voellig aus den Fugen geraten ist.</p>
<p><strong>Tagesstruktur aufrechterhalten:</strong></p>
<ul>
<li><strong>Feste Essenszeiten:</strong> Halten Sie Fruehstueck, Mittagessen und Abendessen so nah wie moeglich an den gewohnten Zeiten. Gemeinsames Essen ist ein Ankerpunkt. Auch wenn es nur Knaeckebrot mit Dosenwurst ist — das gemeinsame Ritual zaehlt.</li>
<li><strong>Schlafenszeit:</strong> Halten Sie die gewohnte Schlafenszeit ein, auch wenn es noch hell ist oder die Situation aufregend wirkt. Vorlesen oder eine Geschichte erzaehlen als Einschlafritual beibehalten. Eine Taschenlampe neben dem Bett gibt Kindern Sicherheit.</li>
<li><strong>Spielzeiten:</strong> Planen Sie feste Spielzeiten ein. Kinder verarbeiten Stress durch Spielen. Geben Sie ihnen Raum dafuer.</li>
<li><strong>Aufgaben verteilen:</strong> Auch in der Krise koennen Kinder altersgerechte Aufgaben uebernehmen: Tisch decken (auch auf dem Fussboden mit Decke), Geschwister beschaeftigen, beim Kochen helfen.</li>
</ul>
<p><strong>Was vermeiden?</strong></p>
<ul>
<li>Vermeiden Sie dauerhafte Krisengespaeche in Anwesenheit von Kindern. Besprechen Sie ernste Themen unter Erwachsenen, wenn die Kinder schlafen oder beschaeftigt sind.</li>
<li>Vermeiden Sie staendiges Radiohoeren in Anwesenheit kleiner Kinder — alarmierende Nachrichten koennen Aengste verstaerken.</li>
</ul>`,
      },
      {
        heading: 'Notfall-Spiele und Beschaeftigung ohne Strom',
        content: `<p>Ohne Tablet, Fernseher und Spielkonsole werden Kinder schnell unruhig — besonders wenn die Situation ohnehin angespannt ist. Ein Vorrat an stromloser Beschaeftigung ist genauso wichtig wie Lebensmittelvorraete.</p>
<p><strong>Fuer alle Altersgruppen:</strong></p>
<ul>
<li><strong>Kartenspiele:</strong> UNO, Mau-Mau, Quartett, Skip-Bo. Ein Kartenspiel passt in jede Tasche und beschaeftigt die ganze Familie stundenlang.</li>
<li><strong>Brettspiele:</strong> Mensch aergere Dich nicht, Schach, Dame. Auch Wuerfelspiele (Kniffel) brauchen nur Wuerfel und Papier.</li>
<li><strong>Malen und Basteln:</strong> Buntstifte, Papier und Scheren reichen fuer endlose Beschaeftigung. Kinder koennen ihre Erlebnisse malen — das hilft auch bei der Verarbeitung.</li>
<li><strong>Geschichten erzaehlen:</strong> Erzaehlrunden, bei denen jeder einen Satz ergaenzt. Oder lesen Sie bei Kerzenlicht aus einem Buch vor — das schafft eine besondere Atmosphaere.</li>
<li><strong>Bewegungsspiele:</strong> Verstecken, Fangen, Yoga fuer Kinder, Schattentheater mit der Taschenlampe an der Wand.</li>
</ul>
<p><strong>Fuer aeltere Kinder und Jugendliche:</strong></p>
<ul>
<li>Raetsel- und Sudoku-Buecher</li>
<li>Tagebuch schreiben (verarbeitet Erlebnisse und ist spaeter ein einzigartiges Dokument)</li>
<li>Aktive Einbindung: Jugendliche koennen beim Kochen, bei der Wasseraufbereitung oder bei der Nachbarschaftshilfe mitarbeiten. Das staerkt Selbstwirksamkeit und Verantwortungsgefuehl.</li>
</ul>
<p><em>Tipp: Packen Sie eine "Notfall-Spielkiste" mit Kartenspielen, Wuerfeln, Buntstiften und einem Buch. Bewahren Sie sie beim Notgepaeck auf und oeffnen Sie sie erst im Ernstfall — so hat die Kiste einen besonderen Reiz.</em></p>`,
      },
      {
        heading: 'Kinder auf Evakuierung vorbereiten',
        content: `<p>Eine Evakuierung ist fuer Kinder besonders beaengstigend: Sie muessen ihr vertrautes Zuhause verlassen, das Chaos und die Eile der Erwachsenen spueren, und sie verstehen oft nicht, was passiert. Vorbereitung kann viel von dieser Angst nehmen.</p>
<p><strong>Vor dem Ernstfall:</strong></p>
<ul>
<li><strong>Ueben Sie die Evakuierung:</strong> Machen Sie ein "Notfall-Spiel". Jedes Familienmitglied packt in 10 Minuten seinen Rucksack und trifft sich an der Haustuer. Kinder lieben solche "Missionen" — und im Ernstfall laeuft es dann automatisch.</li>
<li><strong>Eigenen Rucksack packen lassen:</strong> Geben Sie jedem Kind ab ca. 4 Jahren einen eigenen kleinen Rucksack. Lassen Sie es mitentscheiden, was hineinkommt (innerhalb vernuenftiger Grenzen). Wer seinen eigenen Rucksack hat, fuehlt sich weniger hilflos.</li>
<li><strong>Trostgegenstand bestimmen:</strong> Jedes Kind darf <strong>einen</strong> Lieblingsgegenstand mitnehmen: Kuscheltier, Puppe, Lieblingsbuch. Legen Sie diesen Gegenstand immer griffbereit zum Notgepaeck. Im Stress sucht ein Kind sein Kuscheltier — wenn es bereitliegt, spart das wertvolle Minuten.</li>
</ul>
<p><strong>Im Ernstfall:</strong></p>
<ul>
<li>Bleiben Sie ruhig und bestimmt. Kinder orientieren sich an Ihrem Verhalten. Wenn Sie ruhig bleiben, beruhigen sich auch die Kinder.</li>
<li>Erklaeren Sie kurz und klar: "Wir muessen jetzt unser Haus verlassen und an einen sicheren Ort gehen. Nimm deinen Rucksack und dein Kuscheltier."</li>
<li>Halten Sie Koerperkontakt: Hand halten, auf den Arm nehmen, nah bei sich tragen.</li>
<li>Versprechen Sie nichts, was Sie nicht halten koennen ("Wir sind bald wieder zurueck" — vielleicht nicht). Sagen Sie stattdessen: "Wir gehen jetzt zusammen an einen sicheren Ort."</li>
</ul>`,
      },
      {
        heading: 'Babys und Kleinkinder: besondere Vorsorge',
        content: `<p>Babys und Kleinkinder unter 3 Jahren haben besondere Beduerfnisse, die in der Notfallplanung oft unterschaetzt werden. Ohne die richtigen Vorraete kann eine Krise fuer die Kleinsten schnell kritisch werden.</p>
<p><strong>Ernaehrung:</strong></p>
<ul>
<li><strong>Stillende Muetter:</strong> Muttermilch ist die sicherste Nahrung im Notfall — sie ist immer verfuegbar, immer die richtige Temperatur und keimfrei. Trinken Sie selbst ausreichend, um die Milchproduktion aufrechtzuerhalten (mindestens 2,5 Liter pro Tag).</li>
<li><strong>Flaeschennahrung:</strong> Halten Sie einen Vorrat an Pre-Milch fuer mindestens 10 Tage. Bevorzugen Sie <strong>trinkfertige Portionen</strong> (gebrauchsfertige Flaeschchen), da Sie dafuer kein abgekochtes Wasser brauchen. Pulvernahrung muss mit abgekochtem, auf 70 Grad abgekuehltem Wasser zubereitet werden — im Notfall aufwendiger.</li>
<li><strong>Beikost:</strong> Fertige Glaeschen (Gemuese, Obst, Fleisch) sind ideal fuer den Notvorrat. Sie sind sterilisiert und lange haltbar. Packen Sie auch Loeffel ein.</li>
</ul>
<p><strong>Windeln und Hygiene:</strong></p>
<ul>
<li>Halten Sie einen Windelvorrat fuer mindestens 10 Tage. Bei Neugeborenen sind das etwa 80 bis 100 Windeln, bei aelteren Babys 50 bis 60.</li>
<li>Feuchttuecher (mehrere Packungen) — sie ersetzen im Notfall auch die Koerperwaesche.</li>
<li>Wundschutzcreme und Desinfektionsmittel.</li>
<li><strong>Stoffwindeln als Backup:</strong> Ein paar Stoffwindeln oder Mulltuecher als Notloesung, falls die Wegwerfwindeln ausgehen.</li>
</ul>
<p><strong>Gesundheit und Wohlbefinden:</strong></p>
<ul>
<li>Fieberthermometer und fiebersenkende Mittel (altersgerecht, z. B. Paracetamol-Zaepfchen).</li>
<li>Nasentropfen (Kochsalz), Wunddesinfektionsmittel, Pflaster.</li>
<li>Ein warmer Schlafsack oder mehrere warme Decken — Babys kuehlen viel schneller aus als Erwachsene.</li>
<li>Vertraute Gegenstaende: Schnuller (mindestens 2), Schmusetuch, vertraute Spieluhr. Vertraute Geraeusche und Gerueche beruhigen Babys in fremder Umgebung.</li>
</ul>
<p><em>Wichtig: Aktualisieren Sie den Notvorrat fuer Babys und Kleinkinder alle 2 bis 3 Monate. Die Beduerfnisse aendern sich schnell — Windelgroesse, Nahrungsstufe, Kleidungsgroesse. Was fuer einen 6 Monate alten Saeugling passt, ist fuer ein Einjaehriges laengst zu klein.</em></p>`,
      },
    ],
  },
]
