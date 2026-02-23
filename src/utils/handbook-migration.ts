// ============================================
// Krisenhandbuch Migration
// ============================================
// V1 → V2: Flache Sektionen → 7 Kapitel
// V2 → V3: 7 Kapitel → 12 BSI/BBK-Kapitel mit semantic keys
// ============================================

import type {
  ScenarioHandbook,
  ScenarioHandbookV2,
  ScenarioHandbookV3,
  KrisenhandbuchKapitel,
  KrisenhandbuchKapitelV3,
  KapitelChecklistItem,
  DbScenarioPhase,
} from '@/types/database'
import { KAPITEL_CONFIG } from '@/data/kapitel-config'

function makeChecklistItem(text: string): KapitelChecklistItem {
  return {
    id: crypto.randomUUID(),
    text,
    status: 'open',
    notiz: '',
    completed_at: null,
  }
}

export function migrateV1toV2(
  handbook: ScenarioHandbook,
  phases: DbScenarioPhase[],
): ScenarioHandbookV2 {
  const kapitel: KrisenhandbuchKapitel[] = []

  // ─── 1. Risikobewertung & Gefahrenanalyse ─────────
  if (handbook.risikobewertung) {
    const r = handbook.risikobewertung
    const wkLabels: Record<string, string> = { niedrig: 'Niedrig', mittel: 'Mittel', hoch: 'Hoch', sehr_hoch: 'Sehr hoch' }
    const smLabels: Record<string, string> = { gering: 'Gering', mittel: 'Mittel', erheblich: 'Erheblich', katastrophal: 'Katastrophal' }

    const inhalt = [
      r.bedrohungsanalyse,
      '',
      `Eintrittswahrscheinlichkeit: ${wkLabels[r.eintrittswahrscheinlichkeit] || r.eintrittswahrscheinlichkeit}`,
      `Schadensausmaß: ${smLabels[r.schadensausmass] || r.schadensausmass}`,
      '',
      r.risikoeinschaetzung,
      '',
      r.betroffene_sektoren?.length
        ? `Betroffene KRITIS-Sektoren: ${r.betroffene_sektoren.join(', ')}`
        : '',
    ].filter(Boolean).join('\n')

    const checkliste: KapitelChecklistItem[] = [
      makeChecklistItem('Risikobewertung durchführen und dokumentieren'),
      makeChecklistItem('Betroffene KRITIS-Sektoren identifizieren'),
      makeChecklistItem('Schadensszenarien mit Eintrittswahrscheinlichkeiten abgleichen'),
    ]

    kapitel.push({
      id: 'kap-1',
      nummer: 1,
      titel: 'Risikobewertung & Gefahrenanalyse',
      inhalt,
      checkliste,
    })
  }

  // ─── 2. Handlungsplan & Einsatzphasen ──────────────
  {
    const inhaltLines: string[] = []
    if (phases.length > 0) {
      for (const phase of phases) {
        inhaltLines.push(`### ${phase.name} (${phase.duration})`)
        if (phase.tasks?.length) {
          for (const task of phase.tasks) {
            inhaltLines.push(`- ${task}`)
          }
        }
        inhaltLines.push('')
      }
    }

    const checkliste: KapitelChecklistItem[] = phases.flatMap(phase =>
      (phase.tasks || []).map(task => makeChecklistItem(`[${phase.name}] ${task}`))
    )

    kapitel.push({
      id: 'kap-2',
      nummer: 2,
      titel: 'Handlungsplan & Einsatzphasen',
      inhalt: inhaltLines.join('\n') || 'Noch kein Handlungsplan definiert.',
      checkliste,
    })
  }

  // ─── 3. Krisenstab & Verantwortlichkeiten ──────────
  if (handbook.verantwortlichkeiten?.length) {
    const inhaltLines: string[] = []
    const checkliste: KapitelChecklistItem[] = []

    for (const rolle of handbook.verantwortlichkeiten) {
      inhaltLines.push(`### ${rolle.funktion}`)
      if (rolle.kontaktgruppe) {
        inhaltLines.push(`Kontaktgruppe: ${rolle.kontaktgruppe}`)
      }
      inhaltLines.push('')
      if (rolle.aufgaben?.length) {
        for (const aufgabe of rolle.aufgaben) {
          inhaltLines.push(`- ${aufgabe}`)
          checkliste.push(makeChecklistItem(`[${rolle.funktion.substring(0, 2)}] ${aufgabe}`))
        }
      }
      inhaltLines.push('')
    }

    kapitel.push({
      id: 'kap-3',
      nummer: 3,
      titel: 'Krisenstab & Verantwortlichkeiten',
      inhalt: inhaltLines.join('\n'),
      checkliste,
    })
  }

  // ─── 4. Krisenkommunikation ────────────────────────
  if (handbook.kommunikationsplan) {
    const k = handbook.kommunikationsplan
    const inhaltLines: string[] = []
    const checkliste: KapitelChecklistItem[] = []

    // Intern
    if (k.intern?.sofort?.length) {
      inhaltLines.push('### Interne Kommunikation – Sofortmeldungen')
      for (const s of k.intern.sofort) {
        inhaltLines.push(`- ${s}`)
        checkliste.push(makeChecklistItem(`[Sofort] ${s}`))
      }
      inhaltLines.push('')
    }
    if (k.intern?.laufend?.length) {
      inhaltLines.push('### Interne Kommunikation – Laufend')
      for (const s of k.intern.laufend) {
        inhaltLines.push(`- ${s}`)
        checkliste.push(makeChecklistItem(`[Laufend] ${s}`))
      }
      inhaltLines.push('')
    }

    // Extern
    if (k.extern?.bevoelkerung?.length) {
      inhaltLines.push('### Externe Kommunikation – Bevölkerung')
      for (const s of k.extern.bevoelkerung) {
        inhaltLines.push(`- ${s}`)
        checkliste.push(makeChecklistItem(`[Bevölkerung] ${s}`))
      }
      inhaltLines.push('')
    }
    if (k.extern?.medien?.length) {
      inhaltLines.push('### Externe Kommunikation – Medien')
      for (const s of k.extern.medien) {
        inhaltLines.push(`- ${s}`)
        checkliste.push(makeChecklistItem(`[Medien] ${s}`))
      }
      inhaltLines.push('')
    }
    if (k.extern?.behoerden?.length) {
      inhaltLines.push('### Externe Kommunikation – Behörden')
      for (const s of k.extern.behoerden) {
        inhaltLines.push(`- ${s}`)
        checkliste.push(makeChecklistItem(`[Behörden] ${s}`))
      }
      inhaltLines.push('')
    }

    // Kanäle + Sprachregelungen
    if (k.kanaele?.length) {
      inhaltLines.push(`### Kommunikationskanäle`)
      inhaltLines.push(k.kanaele.join(', '))
      inhaltLines.push('')
    }
    if (k.sprachregelungen?.length) {
      inhaltLines.push('### Sprachregelungen')
      for (const s of k.sprachregelungen) {
        inhaltLines.push(`- „${s}"`)
      }
      inhaltLines.push('')
    }

    kapitel.push({
      id: 'kap-4',
      nummer: 4,
      titel: 'Krisenkommunikation',
      inhalt: inhaltLines.join('\n'),
      checkliste,
    })
  }

  // ─── 5. Eskalationsstufen & Wenn-Dann-Regeln ──────
  if (handbook.wennDannSzenarien?.length) {
    const inhaltLines: string[] = []

    for (const wd of handbook.wennDannSzenarien) {
      inhaltLines.push(`### Wenn: ${wd.trigger}`)
      if (wd.massnahmen?.length) {
        inhaltLines.push('Dann:')
        for (const m of wd.massnahmen) {
          inhaltLines.push(`- ${m}`)
        }
      }
      if (wd.eskalation) {
        inhaltLines.push(`Eskalation: ${wd.eskalation}`)
      }
      inhaltLines.push('')
    }

    const checkliste = handbook.wennDannSzenarien.map(wd =>
      makeChecklistItem(`Regel prüfen: ${wd.trigger}`)
    )

    kapitel.push({
      id: 'kap-5',
      nummer: 5,
      titel: 'Eskalationsstufen & Wenn-Dann-Regeln',
      inhalt: inhaltLines.join('\n'),
      checkliste,
    })
  }

  // ─── 6. Prävention & Vorbereitung ──────────────────
  if (handbook.praevention) {
    const p = handbook.praevention
    const inhaltLines: string[] = []
    const checkliste: KapitelChecklistItem[] = []

    const sections: { key: keyof typeof p; label: string; prefix: string }[] = [
      { key: 'vorbereitung', label: 'Vorbereitung', prefix: 'Vorbereitung' },
      { key: 'fruehwarnung', label: 'Frühwarnung', prefix: 'Frühwarnung' },
      { key: 'schulungen', label: 'Schulungen', prefix: 'Schulung' },
      { key: 'materialvorhaltung', label: 'Materialvorhaltung', prefix: 'Material' },
    ]

    for (const section of sections) {
      const items = p[section.key] || []
      if (items.length > 0) {
        inhaltLines.push(`### ${section.label}`)
        for (const item of items) {
          inhaltLines.push(`- ${item}`)
          checkliste.push(makeChecklistItem(`[${section.prefix}] ${item}`))
        }
        inhaltLines.push('')
      }
    }

    if (inhaltLines.length > 0) {
      kapitel.push({
        id: 'kap-6',
        nummer: 6,
        titel: 'Prävention & Vorbereitung',
        inhalt: inhaltLines.join('\n'),
        checkliste,
      })
    }
  }

  // ─── 7. Material & Ressourcen ──────────────────────
  if (handbook.inventar?.length) {
    const inhaltLines: string[] = []

    for (const item of handbook.inventar) {
      inhaltLines.push(`- **${item.kategorie}**: ${item.empfohlene_menge} ${item.einheit} – ${item.begruendung}`)
    }

    const checkliste = handbook.inventar.map(item =>
      makeChecklistItem(`${item.kategorie}: ${item.empfohlene_menge} ${item.einheit} beschaffen/prüfen`)
    )

    kapitel.push({
      id: 'kap-7',
      nummer: 7,
      titel: 'Material & Ressourcen',
      inhalt: inhaltLines.join('\n'),
      checkliste,
    })
  }

  return {
    version: 2,
    kapitel,
    generated_at: handbook.generated_at || new Date().toISOString(),
  }
}


// ============================================
// V2 → V3 Migration (7 Kapitel → 12 BSI/BBK-Kapitel)
// ============================================

function makeV3Kapitel(
  key: string,
  inhalt: string,
  checkliste: KapitelChecklistItem[] = [],
): KrisenhandbuchKapitelV3 {
  const cfg = KAPITEL_CONFIG.find(k => k.key === key)!
  return {
    id: `kap-${cfg.nummer}`,
    nummer: cfg.nummer,
    key,
    titel: cfg.titel,
    inhalt,
    checkliste,
  }
}

function findV2Kapitel(kapitel: KrisenhandbuchKapitel[], nummer: number): KrisenhandbuchKapitel | undefined {
  return kapitel.find(k => k.nummer === nummer)
}

/** Splittet Inhalt eines V2-Kapitels anhand von KRITIS-Sektoren-Keywords */
function splitRisikoInhalt(inhalt: string): { lagefuehrung: string; schutzKritis: string } {
  const lines = inhalt.split('\n')
  const lagefuehrungLines: string[] = []
  const schutzKritisLines: string[] = []
  let isKritis = false

  for (const line of lines) {
    const lower = line.toLowerCase()
    if (lower.includes('kritis') || lower.includes('sektor') || lower.includes('infrastruktur')) {
      isKritis = true
    }
    if (isKritis) {
      schutzKritisLines.push(line)
    } else {
      lagefuehrungLines.push(line)
    }
  }

  return {
    lagefuehrung: lagefuehrungLines.join('\n').trim(),
    schutzKritis: schutzKritisLines.join('\n').trim(),
  }
}

export function migrateV2toV3(handbook: ScenarioHandbookV2): ScenarioHandbookV3 {
  const v2 = handbook.kapitel

  // V2-Kapitel extrahieren
  const risiko = findV2Kapitel(v2, 1)       // → split nach Kap 5 (Lage) + Kap 8 (KRITIS)
  const handlungsplan = findV2Kapitel(v2, 2) // → Kap 4 (Aktivierung)
  const krisenstab = findV2Kapitel(v2, 3)    // → Kap 3 (Krisenorganisation)
  const kommunikation = findV2Kapitel(v2, 4) // → Kap 6 (Alarmierung & Kommunikation)
  const wennDann = findV2Kapitel(v2, 5)      // → Merge in Kap 4 (Aktivierung)
  const praevention = findV2Kapitel(v2, 6)   // → Merge in Kap 8 (Schutz KRITIS)
  const material = findV2Kapitel(v2, 7)      // → Kap 7 (Ressourcenmanagement)

  // Risiko-Inhalt splitten
  const risikoSplit = risiko ? splitRisikoInhalt(risiko.inhalt) : { lagefuehrung: '', schutzKritis: '' }

  // Kapitel 4 (Aktivierung): Handlungsplan + Wenn-Dann mergen
  const aktivierungInhalt = [
    handlungsplan?.inhalt || '',
    wennDann?.inhalt ? `\n\n### Eskalationsstufen und Wenn-Dann-Regeln\n\n${wennDann.inhalt}` : '',
  ].filter(Boolean).join('\n').trim()

  const aktivierungCheckliste = [
    ...(handlungsplan?.checkliste || []),
    ...(wennDann?.checkliste || []),
  ]

  // Kapitel 8 (Schutz KRITIS): KRITIS-Teil von Risiko + Prävention mergen
  const schutzKritisInhalt = [
    risikoSplit.schutzKritis,
    praevention?.inhalt ? `\n\n### Prävention und Vorbereitung\n\n${praevention.inhalt}` : '',
  ].filter(Boolean).join('\n').trim()

  const schutzKritisCheckliste = [
    ...(risiko?.checkliste.filter(c => c.text.toLowerCase().includes('kritis') || c.text.toLowerCase().includes('sektor')) || []),
    ...(praevention?.checkliste || []),
  ]

  // Lageführung: Nicht-KRITIS-Teil von Risiko
  const lagefuehrungCheckliste = risiko?.checkliste.filter(c =>
    !c.text.toLowerCase().includes('kritis') && !c.text.toLowerCase().includes('sektor')
  ) || []

  // Alle 12 Kapitel aufbauen
  const kapitelV3: KrisenhandbuchKapitelV3[] = [
    // 1. Einleitung (neu – Placeholder)
    makeV3Kapitel('einleitung', '', [
      makeChecklistItem('Zweck und Geltungsbereich des Krisenhandbuchs festlegen'),
      makeChecklistItem('Rechtsgrundlagen prüfen (KatSG, ZSKG)'),
      makeChecklistItem('Verteiler und Zuständigkeiten klären'),
    ]),

    // 2. Dokumentenmanagement (neu – Boilerplate)
    makeV3Kapitel('dokumentenmanagement', '', [
      makeChecklistItem('Versionierung und Änderungshistorie pflegen'),
      makeChecklistItem('Verteilerliste aktualisieren'),
      makeChecklistItem('Nächsten Review-Termin festlegen'),
    ]),

    // 3. Krisenorganisation (direkt von V2 Kap 3)
    makeV3Kapitel(
      'krisenorganisation',
      krisenstab?.inhalt || '',
      krisenstab?.checkliste || [],
    ),

    // 4. Aktivierung (V2 Kap 2 Handlungsplan + V2 Kap 5 Wenn-Dann)
    makeV3Kapitel('aktivierung', aktivierungInhalt, aktivierungCheckliste),

    // 5. Lageführung (Nicht-KRITIS-Teil von V2 Kap 1)
    makeV3Kapitel('lagefuehrung', risikoSplit.lagefuehrung, lagefuehrungCheckliste),

    // 6. Alarmierung und Kommunikation (direkt von V2 Kap 4)
    makeV3Kapitel(
      'alarmierung_kommunikation',
      kommunikation?.inhalt || '',
      kommunikation?.checkliste || [],
    ),

    // 7. Ressourcenmanagement (direkt von V2 Kap 7)
    makeV3Kapitel(
      'ressourcenmanagement',
      material?.inhalt || '',
      material?.checkliste || [],
    ),

    // 8. Schutz kritischer Funktionen (KRITIS-Teil + Prävention)
    makeV3Kapitel('schutz_kritischer_funktionen', schutzKritisInhalt, schutzKritisCheckliste),

    // 9. Notfallarbeitsplätze (neu – leer)
    makeV3Kapitel('notfallarbeitsplaetze', '', [
      makeChecklistItem('Ausweichstandort für Krisenstab festlegen'),
      makeChecklistItem('IT-Notfallarbeitsplätze einrichten'),
      makeChecklistItem('Bürgertelefon-Standort bestimmen'),
    ]),

    // 10. Wiederherstellung (neu – leer)
    makeV3Kapitel('wiederherstellung', '', [
      makeChecklistItem('Priorisierung der Wiederherstellung festlegen'),
      makeChecklistItem('Normalbetriebs-Kriterien definieren'),
      makeChecklistItem('Zeitrahmen für Wiederherstellungsphasen bestimmen'),
    ]),

    // 11. Dokumentation (neu – leer)
    makeV3Kapitel('dokumentation', '', [
      makeChecklistItem('Ereignis-Logbuch anlegen'),
      makeChecklistItem('Entscheidungsprotokoll-Vorlage bereitstellen'),
      makeChecklistItem('Beweissicherung organisieren'),
    ]),

    // 12. Nachbereitung (neu – leer)
    makeV3Kapitel('nachbereitung', '', [
      makeChecklistItem('After-Action-Review durchführen'),
      makeChecklistItem('Lessons Learned dokumentieren'),
      makeChecklistItem('Verbesserungsmaßnahmen ableiten'),
      makeChecklistItem('Nächste Übung terminieren'),
    ]),
  ]

  return {
    version: 3,
    kapitel: kapitelV3,
    generated_at: handbook.generated_at || new Date().toISOString(),
  }
}
