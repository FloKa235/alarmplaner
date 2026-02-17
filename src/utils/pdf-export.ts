import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { DbScenario, DbScenarioPhase, ScenarioHandbook, ScenarioHandbookV2 } from '@/types/database'
import { isHandbookV2 } from '@/types/database'

// Brand Colors
const PRIMARY = [37, 99, 235] as const     // primary-600 (#2563EB)
const TEXT_DARK = [17, 24, 39] as const     // gray-900
const TEXT_MED = [75, 85, 99] as const      // gray-600
const TEXT_LIGHT = [156, 163, 175] as const // gray-400
const BG_LIGHT = [249, 250, 251] as const  // gray-50
const WHITE = [255, 255, 255] as const

// Kapitel-Farben (RGB) – passend zum Frontend
const KAPITEL_FARBEN: Record<number, [number, number, number]> = {
  1: [220, 38, 38],    // red-600
  2: [37, 99, 235],    // blue-600
  3: [22, 163, 74],    // green-600
  4: [217, 119, 6],    // amber-600
  5: [234, 88, 12],    // orange-600
  6: [147, 51, 234],   // purple-600
  7: [13, 148, 136],   // teal-600
}

/**
 * Generiert ein professionelles PDF-Krisenhandbuch für ein Szenario.
 * Unterstützt V2-Kapitelstruktur (bevorzugt) und V1-Fallback.
 */
export function exportScenarioPDF(
  scenario: DbScenario,
  phases: DbScenarioPhase[],
  districtName?: string,
) {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  let y = 0

  // ─── Helper ──────────────────────────────────────────
  const addFooter = () => {
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setDrawColor(...TEXT_LIGHT)
      doc.setLineWidth(0.3)
      doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15)
      doc.setFontSize(8)
      doc.setTextColor(...TEXT_LIGHT)
      doc.text('Alarmplaner – Vertraulich', margin, pageHeight - 10)
      doc.text(`Seite ${i} / ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' })
      doc.text(
        `Erstellt am ${new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      )
    }
  }

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 25) {
      doc.addPage()
      y = 20
    }
  }

  const addSectionHeader = (title: string, color?: readonly [number, number, number]) => {
    checkPageBreak(20)
    const c = color || PRIMARY
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(15)
    doc.setTextColor(c[0], c[1], c[2])
    doc.text(title, margin, y)
    y += 2
    doc.setDrawColor(c[0], c[1], c[2])
    doc.setLineWidth(0.8)
    doc.line(margin, y, margin + 50, y)
    y += 10
  }

  const addSubHeader = (title: string) => {
    checkPageBreak(12)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...TEXT_DARK)
    doc.text(title, margin, y)
    y += 6
  }

  const addBulletList = (items: string[], indent = 0) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...TEXT_MED)
    items.forEach(item => {
      const lines = doc.splitTextToSize(item, contentWidth - indent - 5)
      const lineHeight = lines.length * 4
      checkPageBreak(lineHeight + 2)
      doc.text('•', margin + indent, y)
      doc.text(lines, margin + indent + 4, y)
      y += lineHeight + 2
    })
  }

  const addParagraph = (text: string) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(...TEXT_MED)
    const lines = doc.splitTextToSize(text, contentWidth)
    const height = lines.length * 4.5
    checkPageBreak(height + 5)
    doc.text(lines, margin, y)
    y += height + 6
  }

  // Mehrzeiligen Text umbrechen (Markdown-ähnliche Absätze)
  const addMultilineParagraph = (text: string) => {
    const paragraphs = text.split(/\n{2,}/)
    paragraphs.forEach(para => {
      const trimmed = para.trim()
      if (!trimmed) return

      // Einfache Bullet-Erkennung
      if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        const bulletItems = trimmed.split('\n').map(l => l.replace(/^[-•]\s*/, '').trim()).filter(Boolean)
        addBulletList(bulletItems)
        y += 2
      } else {
        // Regulärer Absatz
        addParagraph(trimmed)
      }
    })
  }

  // ─── Header ──────────────────────────────────────────
  doc.setFillColor(...PRIMARY)
  doc.rect(0, 0, pageWidth, 36, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...WHITE)
  doc.text('ALARMPLANER', margin, 16)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(200, 215, 255)
  const subtitle = districtName
    ? `Krisenmanagement  |  ${districtName}`
    : 'Krisenmanagement'
  doc.text(subtitle, margin, 26)

  doc.setFontSize(8)
  doc.setTextColor(...WHITE)
  doc.text('VERTRAULICH', pageWidth - margin, 16, { align: 'right' })

  y = 48

  // ─── Scenario Title ──────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...TEXT_DARK)
  const titleLines = doc.splitTextToSize(scenario.title, contentWidth)
  doc.text(titleLines, margin, y)
  y += titleLines.length * 8 + 4

  if (scenario.is_default) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(146, 64, 14)
    doc.text('● PFLICHT-SZENARIO', margin, y)
    y += 6
  } else if (scenario.is_ai_generated) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...PRIMARY)
    doc.text('✦ KI-GENERIERT', margin, y)
    y += 6
  }

  y += 4

  // ─── Metadata Table ──────────────────────────────────
  const severityLabel = scenario.severity >= 80 ? 'Kritisch' :
    scenario.severity >= 60 ? 'Hoch' :
    scenario.severity >= 40 ? 'Mittel' : 'Niedrig'

  const metaData = [
    ['Typ', scenario.type],
    ['Schweregrad', `${scenario.severity}/100 (${severityLabel})`],
    ['Betroffene', scenario.affected_population
      ? `~${scenario.affected_population.toLocaleString('de-DE')} Personen`
      : 'Keine Angabe'],
    ['Erstellt am', new Date(scenario.created_at).toLocaleDateString('de-DE', {
      day: '2-digit', month: 'long', year: 'numeric'
    })],
  ]

  autoTable(doc, {
    startY: y,
    head: [['Eigenschaft', 'Wert']],
    body: metaData,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 9, cellPadding: 4,
      textColor: TEXT_DARK as [number, number, number],
      lineColor: [229, 231, 235], lineWidth: 0.3,
    },
    headStyles: {
      fillColor: PRIMARY as [number, number, number],
      textColor: WHITE as [number, number, number],
      fontStyle: 'bold', fontSize: 9,
    },
    alternateRowStyles: { fillColor: BG_LIGHT as [number, number, number] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
    theme: 'grid',
  })

  // @ts-expect-error jspdf-autotable extends doc with lastAutoTable
  y = doc.lastAutoTable.finalY + 10

  // ─── Description ─────────────────────────────────────
  if (scenario.description) {
    checkPageBreak(30)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(...TEXT_DARK)
    doc.text('Beschreibung', margin, y)
    y += 7

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(...TEXT_MED)
    const descLines = doc.splitTextToSize(scenario.description, contentWidth)
    const descHeight = descLines.length * 4.5
    checkPageBreak(descHeight + 5)
    doc.text(descLines, margin, y)
    y += descHeight + 10
  }

  // ─── Action Plan (Phases + Tasks) ────────────────────
  if (phases.length > 0) {
    addSectionHeader('Handlungsplan')

    phases.forEach((phase, i) => {
      const taskCount = (phase.tasks || []).length
      const estimatedHeight = 18 + taskCount * 8
      checkPageBreak(Math.min(estimatedHeight, 60))

      doc.setFillColor(...PRIMARY)
      doc.circle(margin + 4, y - 1, 4, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(...WHITE)
      doc.text(`${i + 1}`, margin + 4, y + 0.5, { align: 'center' })

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(...TEXT_DARK)
      doc.text(phase.name, margin + 12, y + 1)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...TEXT_LIGHT)
      doc.text(`Dauer: ${phase.duration}`, margin + 12, y + 6)
      y += 12

      if (phase.tasks && phase.tasks.length > 0) {
        const taskData = phase.tasks.map((task, j) => [`${j + 1}`, task])

        autoTable(doc, {
          startY: y,
          head: [['Nr.', 'Aufgabe']],
          body: taskData,
          margin: { left: margin + 8, right: margin },
          styles: {
            fontSize: 8.5, cellPadding: 3,
            textColor: TEXT_DARK as [number, number, number],
            lineColor: [229, 231, 235], lineWidth: 0.2, overflow: 'linebreak',
          },
          headStyles: {
            fillColor: [239, 246, 255] as [number, number, number],
            textColor: PRIMARY as [number, number, number],
            fontStyle: 'bold', fontSize: 8,
          },
          alternateRowStyles: { fillColor: [249, 250, 251] as [number, number, number] },
          columnStyles: { 0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' } },
          theme: 'grid',
        })

        // @ts-expect-error jspdf-autotable extends doc with lastAutoTable
        y = doc.lastAutoTable.finalY + 8
      } else {
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(8.5)
        doc.setTextColor(...TEXT_LIGHT)
        doc.text('Keine Aufgaben definiert.', margin + 12, y)
        y += 8
      }
    })
  }

  // ─── Krisenhandbuch ──────────────────────────────────
  const rawHandbook = scenario.handbook as ScenarioHandbook | ScenarioHandbookV2 | null
  if (rawHandbook) {
    if (isHandbookV2(rawHandbook)) {
      // ═══ V2: Kapitel-basiertes Krisenhandbuch ═══
      renderV2Handbook(rawHandbook)
    } else {
      // ═══ V1: Legacy flat sections (Fallback) ═══
      renderV1Handbook(rawHandbook)
    }
  }

  // ─── Footer on all pages ─────────────────────────────
  addFooter()

  // ─── Save ────────────────────────────────────────────
  const sanitizedTitle = scenario.title
    .replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50)
  const filename = `Krisenhandbuch_${sanitizedTitle}.pdf`
  doc.save(filename)

  // ═══════════════════════════════════════════════════════
  // V2 Kapitel-basiertes Rendering
  // ═══════════════════════════════════════════════════════
  function renderV2Handbook(handbook: ScenarioHandbookV2) {
    // Titelseite für Krisenhandbuch
    doc.addPage()
    y = 40

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.setTextColor(...PRIMARY)
    doc.text('KRISENHANDBUCH', margin, y)
    y += 10

    doc.setDrawColor(...PRIMARY)
    doc.setLineWidth(1)
    doc.line(margin, y, pageWidth - margin, y)
    y += 8

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...TEXT_MED)
    doc.text(`${handbook.kapitel.length} Kapitel`, margin, y)
    y += 5

    // Checklisten-Statistik
    const allItems = handbook.kapitel.flatMap(k => k.checkliste)
    const totalDone = allItems.filter(i => i.status === 'done').length
    const totalSkipped = allItems.filter(i => i.status === 'skipped').length
    const totalOpen = allItems.filter(i => i.status === 'open').length
    const totalPercent = allItems.length > 0
      ? Math.round(((totalDone + totalSkipped) / allItems.length) * 100)
      : 0

    doc.text(
      `Checklisten-Fortschritt: ${totalDone + totalSkipped}/${allItems.length} erledigt (${totalPercent}%) – ${totalOpen} offen`,
      margin, y
    )
    y += 12

    // Inhaltsverzeichnis
    addSubHeader('Inhaltsverzeichnis')
    handbook.kapitel.forEach(kap => {
      checkPageBreak(8)
      const kapColor = KAPITEL_FARBEN[kap.nummer] || [107, 114, 128]
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(kapColor[0], kapColor[1], kapColor[2])
      doc.text(`${kap.nummer}.`, margin, y)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...TEXT_DARK)
      doc.text(kap.titel, margin + 10, y)

      // Checklisten-Fortschritt pro Kapitel
      const kapDone = kap.checkliste.filter(i => i.status === 'done' || i.status === 'skipped').length
      if (kap.checkliste.length > 0) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(...TEXT_LIGHT)
        doc.text(`${kapDone}/${kap.checkliste.length}`, pageWidth - margin, y, { align: 'right' })
      }

      y += 6
    })

    y += 6

    // Kapitel rendern
    handbook.kapitel.forEach(kap => {
      const kapColor = KAPITEL_FARBEN[kap.nummer] || [107, 114, 128]
      const kapColorTuple = kapColor as unknown as readonly [number, number, number]

      // Neues Kapitel auf neuer Seite
      doc.addPage()
      y = 20

      // Kapitel-Header mit farbigem Akzent
      doc.setFillColor(kapColor[0], kapColor[1], kapColor[2])
      doc.rect(margin, y, 4, 12, 'F')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(kapColor[0], kapColor[1], kapColor[2])
      doc.text(`Kapitel ${kap.nummer}`, margin + 8, y + 4)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.setTextColor(...TEXT_DARK)
      doc.text(kap.titel, margin + 8, y + 12)
      y += 20

      // Trennlinie
      doc.setDrawColor(kapColor[0], kapColor[1], kapColor[2])
      doc.setLineWidth(0.5)
      doc.line(margin, y, pageWidth - margin, y)
      y += 10

      // Fließtext (Inhalt)
      if (kap.inhalt && kap.inhalt.trim().length > 0) {
        addMultilineParagraph(kap.inhalt)
        y += 4
      } else {
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(9)
        doc.setTextColor(...TEXT_LIGHT)
        doc.text('Noch kein Inhalt verfasst.', margin, y)
        y += 8
      }

      // Checkliste
      if (kap.checkliste.length > 0) {
        checkPageBreak(20)
        addSubHeader('Checkliste')

        const checkData = kap.checkliste.map((item, idx) => {
          const statusIcon = item.status === 'done' ? '✓' :
            item.status === 'skipped' ? '–' : '○'
          const statusText = item.status === 'done' ? 'Erledigt' :
            item.status === 'skipped' ? 'Übersprungen' : 'Offen'
          return [
            `${idx + 1}`,
            statusIcon,
            item.text,
            statusText,
            item.notiz || '–',
          ]
        })

        autoTable(doc, {
          startY: y,
          head: [['Nr.', '', 'Aufgabe', 'Status', 'Notiz']],
          body: checkData,
          margin: { left: margin, right: margin },
          styles: {
            fontSize: 8, cellPadding: 3,
            textColor: TEXT_DARK as [number, number, number],
            lineColor: [229, 231, 235], lineWidth: 0.2,
            overflow: 'linebreak',
          },
          headStyles: {
            fillColor: kapColorTuple as [number, number, number],
            textColor: WHITE as [number, number, number],
            fontStyle: 'bold', fontSize: 8,
          },
          alternateRowStyles: { fillColor: BG_LIGHT as [number, number, number] },
          columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 8, halign: 'center', fontStyle: 'bold' },
            2: { cellWidth: 55 },
            3: { cellWidth: 22, halign: 'center' },
          },
          theme: 'grid',
          didParseCell: (data) => {
            // Farbige Status-Zelle
            if (data.section === 'body' && data.column.index === 3) {
              const val = data.cell.raw as string
              if (val === 'Erledigt') {
                data.cell.styles.textColor = [22, 163, 74] // green-600
                data.cell.styles.fontStyle = 'bold'
              } else if (val === 'Übersprungen') {
                data.cell.styles.textColor = [107, 114, 128] // gray-500
              }
            }
          },
        })

        // @ts-expect-error jspdf-autotable extends doc with lastAutoTable
        y = doc.lastAutoTable.finalY + 10
      }
    })
  }

  // ═══════════════════════════════════════════════════════
  // V1 Legacy Rendering (Fallback für alte Daten)
  // ═══════════════════════════════════════════════════════
  function renderV1Handbook(handbook: ScenarioHandbook) {
    // === Risikobewertung ===
    addSectionHeader('Risikobewertung')

    const wkLabels: Record<string, string> = { niedrig: 'Niedrig', mittel: 'Mittel', hoch: 'Hoch', sehr_hoch: 'Sehr hoch' }
    const smLabels: Record<string, string> = { gering: 'Gering', mittel: 'Mittel', erheblich: 'Erheblich', katastrophal: 'Katastrophal' }

    autoTable(doc, {
      startY: y,
      head: [['Dimension', 'Bewertung']],
      body: [
        ['Eintrittswahrscheinlichkeit', wkLabels[handbook.risikobewertung.eintrittswahrscheinlichkeit] || handbook.risikobewertung.eintrittswahrscheinlichkeit],
        ['Schadensausmaß', smLabels[handbook.risikobewertung.schadensausmass] || handbook.risikobewertung.schadensausmass],
        ['Betroffene Sektoren', (handbook.risikobewertung.betroffene_sektoren || []).join(', ')],
      ],
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 4, textColor: TEXT_DARK as [number, number, number], lineColor: [229, 231, 235], lineWidth: 0.3 },
      headStyles: { fillColor: PRIMARY as [number, number, number], textColor: WHITE as [number, number, number], fontStyle: 'bold', fontSize: 9 },
      alternateRowStyles: { fillColor: BG_LIGHT as [number, number, number] },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 } },
      theme: 'grid',
    })
    // @ts-expect-error jspdf-autotable extends doc with lastAutoTable
    y = doc.lastAutoTable.finalY + 6

    addSubHeader('Bedrohungsanalyse')
    addParagraph(handbook.risikobewertung.bedrohungsanalyse)

    addSubHeader('Risikoeinschätzung')
    addParagraph(handbook.risikobewertung.risikoeinschaetzung)

    // === Prävention ===
    addSectionHeader('Prävention')

    const praevSections = [
      { title: 'Vorbereitung', items: handbook.praevention.vorbereitung },
      { title: 'Frühwarnung', items: handbook.praevention.fruehwarnung },
      { title: 'Schulungen', items: handbook.praevention.schulungen },
      { title: 'Materialvorhaltung', items: handbook.praevention.materialvorhaltung },
    ]

    praevSections.forEach(({ title, items }) => {
      if (items && items.length > 0) {
        addSubHeader(title)
        addBulletList(items)
        y += 2
      }
    })

    // === Kommunikationsplan ===
    addSectionHeader('Kommunikationsplan')

    if (handbook.kommunikationsplan.intern) {
      addSubHeader('Interne Kommunikation – Sofort')
      addBulletList(handbook.kommunikationsplan.intern.sofort || [])
      addSubHeader('Interne Kommunikation – Laufend')
      addBulletList(handbook.kommunikationsplan.intern.laufend || [])
    }

    if (handbook.kommunikationsplan.extern) {
      addSubHeader('Externe Kommunikation – Bevölkerung')
      addBulletList(handbook.kommunikationsplan.extern.bevoelkerung || [])
      addSubHeader('Externe Kommunikation – Medien')
      addBulletList(handbook.kommunikationsplan.extern.medien || [])
      addSubHeader('Externe Kommunikation – Behörden')
      addBulletList(handbook.kommunikationsplan.extern.behoerden || [])
    }

    if (handbook.kommunikationsplan.kanaele?.length) {
      addSubHeader('Kommunikationskanäle')
      addParagraph(handbook.kommunikationsplan.kanaele.join(', '))
    }

    if (handbook.kommunikationsplan.sprachregelungen?.length) {
      addSubHeader('Sprachregelungen')
      handbook.kommunikationsplan.sprachregelungen.forEach((regel, i) => {
        checkPageBreak(8)
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(9)
        doc.setTextColor(...TEXT_MED)
        const lines = doc.splitTextToSize(`${i + 1}. \u201E${regel}\u201C`, contentWidth)
        doc.text(lines, margin, y)
        y += lines.length * 4.5 + 2
      })
      y += 4
    }

    // === Wenn-Dann-Szenarien ===
    if (handbook.wennDannSzenarien?.length) {
      addSectionHeader('Wenn-Dann-Szenarien')

      const wdData = handbook.wennDannSzenarien.map(wd => [
        wd.trigger,
        (wd.massnahmen || []).join('\n'),
        wd.eskalation,
      ])

      autoTable(doc, {
        startY: y,
        head: [['WENN (Trigger)', 'DANN (Maßnahmen)', 'Eskalation']],
        body: wdData,
        margin: { left: margin, right: margin },
        styles: { fontSize: 8.5, cellPadding: 4, textColor: TEXT_DARK as [number, number, number], lineColor: [229, 231, 235], lineWidth: 0.3, overflow: 'linebreak' },
        headStyles: { fillColor: [245, 158, 11] as [number, number, number], textColor: WHITE as [number, number, number], fontStyle: 'bold', fontSize: 8.5 },
        alternateRowStyles: { fillColor: BG_LIGHT as [number, number, number] },
        columnStyles: { 0: { cellWidth: 45 }, 2: { cellWidth: 40 } },
        theme: 'grid',
      })
      // @ts-expect-error jspdf-autotable extends doc with lastAutoTable
      y = doc.lastAutoTable.finalY + 10
    }

    // === Verantwortlichkeiten (S1–S6) ===
    if (handbook.verantwortlichkeiten?.length) {
      addSectionHeader('Verantwortlichkeiten (Krisenstab)')

      const verantData = handbook.verantwortlichkeiten.map(v => [
        v.funktion,
        (v.aufgaben || []).join('\n'),
        v.kontaktgruppe || '–',
      ])

      autoTable(doc, {
        startY: y,
        head: [['Funktion', 'Aufgaben', 'Kontaktgruppe']],
        body: verantData,
        margin: { left: margin, right: margin },
        styles: { fontSize: 8, cellPadding: 3.5, textColor: TEXT_DARK as [number, number, number], lineColor: [229, 231, 235], lineWidth: 0.3, overflow: 'linebreak' },
        headStyles: { fillColor: PRIMARY as [number, number, number], textColor: WHITE as [number, number, number], fontStyle: 'bold', fontSize: 8.5 },
        alternateRowStyles: { fillColor: BG_LIGHT as [number, number, number] },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 }, 2: { cellWidth: 30 } },
        theme: 'grid',
      })
      // @ts-expect-error jspdf-autotable extends doc with lastAutoTable
      y = doc.lastAutoTable.finalY + 10
    }
  }
}
