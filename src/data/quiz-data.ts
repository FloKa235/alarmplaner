/**
 * quiz-data.ts — Quiz-Fragen zur Krisenvorsorge
 *
 * 20 Fragen basierend auf BBK-Empfehlungen und den Survival-Guides.
 * Pro Quiz-Runde werden 10 zufällig ausgewählt.
 */

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
  guideId: string // Verweis auf zugehörigen Survival-Guide
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'Wie viel Trinkwasser empfiehlt das BBK pro Person und Tag?',
    options: ['0,5 Liter', '1 Liter', '2 Liter', '5 Liter'],
    correctIndex: 2,
    explanation: 'Das BBK empfiehlt 2 Liter Trinkwasser pro Person und Tag. Für 10 Tage also 20 Liter pro Person.',
    guideId: 'wasseraufbereitung',
  },
  {
    id: 'q2',
    question: 'Wie lange sollte ein Notvorrat laut BBK-Empfehlung reichen?',
    options: ['3 Tage', '7 Tage', '10 Tage', '30 Tage'],
    correctIndex: 2,
    explanation: 'Das BBK empfiehlt einen Vorrat für mindestens 10 Tage, um auch längere Versorgungsengpässe zu überbrücken.',
    guideId: 'vorrat_lagern',
  },
  {
    id: 'q3',
    question: 'Was sollten Sie bei einem Stromausfall als Erstes tun?',
    options: [
      'Alle Fenster öffnen',
      'Kühlschrank und Gefriertruhe geschlossen halten',
      'Den Hauptschalter ausschalten',
      'Nachbarn alarmieren',
    ],
    correctIndex: 1,
    explanation: 'Kühlschrank und Gefriertruhe geschlossen halten! Ein voller Gefrierschrank hält die Temperatur bis zu 48 Stunden.',
    guideId: 'stromausfall',
  },
  {
    id: 'q4',
    question: 'Welche Notrufnummer gilt europaweit für den Rettungsdienst?',
    options: ['110', '112', '115', '116'],
    correctIndex: 1,
    explanation: 'Die 112 ist die europaweite Notrufnummer für Feuerwehr und Rettungsdienst.',
    guideId: 'erste_hilfe',
  },
  {
    id: 'q5',
    question: 'Wie lange können Sie abgekochtes Wasser in sauberen Behältern lagern?',
    options: ['1 Tag', '3 Tage', 'Bis zu 6 Monate', 'Unbegrenzt'],
    correctIndex: 2,
    explanation: 'In sauberen, verschlossenen Behältern lässt sich abgekochtes Wasser etwa 6 Monate lagern. Regelmäßig erneuern!',
    guideId: 'wasseraufbereitung',
  },
  {
    id: 'q6',
    question: 'Was gehört NICHT in die Hausapotheke?',
    options: ['Schmerzmittel', 'Verbandsmaterial', 'Antibiotika ohne Rezept', 'Fieberthermometer'],
    correctIndex: 2,
    explanation: 'Antibiotika dürfen nur auf ärztliche Verschreibung eingenommen werden. Die Hausapotheke sollte frei verkäufliche Medikamente und Verbandsmaterial enthalten.',
    guideId: 'erste_hilfe',
  },
  {
    id: 'q7',
    question: 'Was bedeutet ein Sirenenton von 1 Minute auf- und abschwellend?',
    options: ['Entwarnung', 'Warnung vor Gefahr', 'Feueralarm', 'Probealarm'],
    correctIndex: 1,
    explanation: 'Ein auf- und abschwellender Sirenenton von 1 Minute bedeutet: Warnung! Radio/TV einschalten und auf Durchsagen achten.',
    guideId: 'kommunikation',
  },
  {
    id: 'q8',
    question: 'Welche App warnt Sie vor Katastrophen in Deutschland?',
    options: ['WeatherPro', 'NINA', 'DWD WarnWetter', 'Alle genannten'],
    correctIndex: 3,
    explanation: 'Alle drei Apps können warnen! NINA ist die offizielle Warn-App des BBK. Auch DWD WarnWetter liefert Wetterwarnungen.',
    guideId: 'kommunikation',
  },
  {
    id: 'q9',
    question: 'Bei Hochwasser: Wann sollten Sie mit der Evakuierung beginnen?',
    options: [
      'Wenn das Wasser im Keller steht',
      'Bei offizieller Evakuierungswarnung',
      'Wenn die Nachbarn gehen',
      'Erst wenn das Wasser die Tür erreicht',
    ],
    correctIndex: 1,
    explanation: 'Folgen Sie immer den offiziellen Evakuierungsanweisungen. Warten Sie nicht, bis das Wasser Ihr Haus erreicht!',
    guideId: 'hochwasser',
  },
  {
    id: 'q10',
    question: 'Was sollten Sie im Notgepäck immer dabei haben?',
    options: [
      'Nur Kleidung',
      'Wichtige Dokumente, Medikamente, Wasser',
      'Computer und Handy',
      'Nur Bargeld',
    ],
    correctIndex: 1,
    explanation: 'Im Notgepäck sollten wichtige Dokumente (Kopien), persönliche Medikamente, Wasser und Verpflegung für 2 Tage sein.',
    guideId: 'evakuierung',
  },
  {
    id: 'q11',
    question: 'Wie können Sie ohne Strom kochen?',
    options: [
      'Gar nicht möglich',
      'Campingkocher, Grill (nur draußen) oder Fondue-Set',
      'Nur mit Lagerfeuer',
      'Mit der Mikrowelle über Batterie',
    ],
    correctIndex: 1,
    explanation: 'Campingkocher (Spiritus/Gas), Holzkohlegrill (NUR im Freien!) oder Fondue-/Raclette-Sets sind Alternativen zum Elektroherd.',
    guideId: 'notkochen',
  },
  {
    id: 'q12',
    question: 'Wie oft sollten Sie Ihren Notvorrat kontrollieren?',
    options: ['Einmal im Jahr', 'Alle 3 Monate', 'Alle 6 Monate', 'Nur bei Warnungen'],
    correctIndex: 2,
    explanation: 'Das BBK empfiehlt, den Vorrat alle 6 Monate zu kontrollieren — Haltbarkeit prüfen und verbrauchte Artikel nachkaufen.',
    guideId: 'vorrat_lagern',
  },
  {
    id: 'q13',
    question: 'Was ist das wichtigste Kommunikationsmittel bei Stromausfall?',
    options: ['Smartphone', 'Batteriebetriebenes Radio', 'Festnetztelefon', 'Internet'],
    correctIndex: 1,
    explanation: 'Ein batteriebetriebenes oder Kurbel-Radio ist bei Stromausfall oft das einzige Mittel, um offizielle Informationen zu empfangen.',
    guideId: 'kommunikation',
  },
  {
    id: 'q14',
    question: 'Wie viel Bargeld empfiehlt das BBK als Notreserve?',
    options: ['50 Euro', '100-200 Euro', '500 Euro', '1.000 Euro'],
    correctIndex: 1,
    explanation: 'Halten Sie einen Bargeldvorrat von mindestens 100-200 Euro in kleinen Scheinen bereit, da Geldautomaten bei Stromausfall nicht funktionieren.',
    guideId: 'stromausfall',
  },
  {
    id: 'q15',
    question: 'Welche Lebensmittel eignen sich besonders gut für den Notvorrat?',
    options: [
      'Frisches Obst und Gemüse',
      'Tiefkühlkost',
      'Konserven, Nudeln, Reis, Knäckebrot',
      'Nur Fertiggerichte',
    ],
    correctIndex: 2,
    explanation: 'Lange haltbare Lebensmittel wie Konserven, Nudeln, Reis und Knäckebrot sind ideal. Sie brauchen keine Kühlung und haben lange MHD.',
    guideId: 'vorrat_lagern',
  },
  {
    id: 'q16',
    question: 'Was ist die stabile Seitenlage?',
    options: [
      'Eine Schlafposition',
      'Eine Lagerung für bewusstlose, aber atmende Personen',
      'Eine Übung beim Sport',
      'Eine Methode zum Schienen von Knochen',
    ],
    correctIndex: 1,
    explanation: 'Die stabile Seitenlage sichert die Atemwege bewusstloser Personen, die noch atmen, und verhindert Ersticken.',
    guideId: 'erste_hilfe',
  },
  {
    id: 'q17',
    question: 'Was sollten Sie mit Kindern für den Notfall besprechen?',
    options: [
      'Nichts — das verunsichert sie nur',
      'Treffpunkt, Notrufnummern und Verhaltensregeln',
      'Nur die Notrufnummer',
      'Dass Katastrophen nicht passieren werden',
    ],
    correctIndex: 1,
    explanation: 'Kinder sollten altersgerecht den Treffpunkt, Notrufnummern und grundlegende Verhaltensregeln kennen. Das gibt ihnen Sicherheit!',
    guideId: 'notfall_kinder',
  },
  {
    id: 'q18',
    question: 'Warum ist es wichtig, Kopien wichtiger Dokumente anzufertigen?',
    options: [
      'Für die Steuererklärung',
      'Originale könnten bei einer Katastrophe verloren gehen',
      'Damit Nachbarn sie lesen können',
      'Weil das Amt es verlangt',
    ],
    correctIndex: 1,
    explanation: 'Bei Evakuierung oder Zerstörung könnten Originaldokumente verloren gehen. Kopien (auch digital/Cloud) sichern wichtige Unterlagen.',
    guideId: 'evakuierung',
  },
  {
    id: 'q19',
    question: 'Was tun bei einer Gaswolke in der Nähe?',
    options: [
      'Fenster öffnen zum Lüften',
      'Ins Obergeschoss gehen, Fenster/Türen abdichten',
      'Sofort nach draußen rennen',
      'Abwarten und Tee trinken',
    ],
    correctIndex: 1,
    explanation: 'Bei Gasgefahr: Fenster und Türen schließen, mit nassen Tüchern abdichten, obere Stockwerke aufsuchen (die meisten Gase sind schwerer als Luft).',
    guideId: 'evakuierung',
  },
  {
    id: 'q20',
    question: 'Wie lange hält eine gefüllte Gefriertruhe ohne Strom die Temperatur?',
    options: ['6 Stunden', '12 Stunden', '24 Stunden', 'Bis zu 48 Stunden'],
    correctIndex: 3,
    explanation: 'Eine volle Gefriertruhe hält die Temperatur bis zu 48 Stunden, wenn sie geschlossen bleibt. Eine halbvolle nur etwa 24 Stunden.',
    guideId: 'stromausfall',
  },
]

/** Select N random questions for a quiz round */
export function getRandomQuestions(count = 10): QuizQuestion[] {
  const shuffled = [...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

// ─── localStorage Helpers ─────────────────────────────────

const QUIZ_STORAGE_KEY = 'alarmplaner-quiz-best'

export function getQuizBestScore(): number {
  try {
    const raw = localStorage.getItem(QUIZ_STORAGE_KEY)
    return raw ? Number(raw) : 0
  } catch {
    return 0
  }
}

export function saveQuizScore(score: number): void {
  try {
    const best = getQuizBestScore()
    if (score > best) {
      localStorage.setItem(QUIZ_STORAGE_KEY, String(score))
    }
  } catch {
    // ignore
  }
}
