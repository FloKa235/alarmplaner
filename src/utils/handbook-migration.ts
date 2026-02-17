// ============================================
// V1 → V2 Krisenhandbuch Migration
// ============================================
// Wandelt das alte flache ScenarioHandbook (7 Sektionen)
// in die neue kapitel-basierte ScenarioHandbookV2 Struktur.
// ============================================

import type {
  ScenarioHandbook,
  ScenarioHandbookV2,
  KrisenhandbuchKapitel,
  KapitelChecklistItem,
  DbScenarioPhase,
} from '@/types/database'

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
