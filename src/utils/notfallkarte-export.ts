/**
 * notfallkarte-export.ts — 1-Seite PDF-Notfallkarte für Bürger
 *
 * Generiert eine kompakte Notfallkarte mit:
 * - Treffpunkte
 * - Notfallkontakte
 * - Wichtige Nummern
 * - Persönliche Notizen
 *
 * Nutzt jsPDF (lazy-loaded, bereits im vendor-chunk).
 */
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Brand Colors
const PRIMARY = [37, 99, 235] as const
const RED = [220, 38, 38] as const
const TEXT_DARK = [17, 24, 39] as const
const TEXT_MED = [75, 85, 99] as const
const TEXT_LIGHT = [156, 163, 175] as const
const WHITE = [255, 255, 255] as const

interface NotfallkarteContact {
  name: string
  phone: string
  relation: string
}

interface NotfallkarteData {
  meetingPoint: {
    primary: string
    primaryAddress: string
    alternative: string
  }
  contacts: NotfallkarteContact[]
  notes: string
  locationName?: string
}

const WICHTIGE_NUMMERN = [
  ['Notruf (Feuerwehr & Rettung)', '112'],
  ['Polizei', '110'],
  ['Giftnotruf', '030 19240'],
  ['Ärztl. Bereitschaftsdienst', '116 117'],
  ['Telefonseelsorge', '0800 111 0 111'],
  ['THW-Bürgertelefon', '0800 434 9511'],
]

export function exportNotfallkartePDF(data: NotfallkarteData) {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - margin * 2
  let y = 0

  // ─── Header (rotes Banner) ────────────────────────────
  doc.setFillColor(RED[0], RED[1], RED[2])
  doc.rect(0, 0, pageWidth, 28, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...WHITE)
  doc.text('\u{1F198} NOTFALLKARTE', margin, 14)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(255, 200, 200)
  const dateStr = new Date().toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  doc.text(`Erstellt am ${dateStr} \u00B7 alarmplaner.de`, margin, 22)

  if (data.locationName) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...WHITE)
    doc.text(data.locationName, pageWidth - margin, 14, { align: 'right' })
  }

  y = 36

  // ─── Treffpunkt ───────────────────────────────────────
  drawSectionHeader('TREFFPUNKT')

  if (data.meetingPoint.primary) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...TEXT_DARK)
    doc.text(data.meetingPoint.primary, margin + 2, y)
    y += 5

    if (data.meetingPoint.primaryAddress) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(...TEXT_MED)
      doc.text(data.meetingPoint.primaryAddress, margin + 2, y)
      y += 5
    }

    if (data.meetingPoint.alternative) {
      y += 2
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(...TEXT_LIGHT)
      doc.text('Alternativ:', margin + 2, y)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...TEXT_MED)
      doc.text(data.meetingPoint.alternative, margin + 22, y)
      y += 5
    }
  } else {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(...TEXT_LIGHT)
    doc.text('Noch kein Treffpunkt festgelegt.', margin + 2, y)
    y += 5
  }

  y += 6

  // ─── Notfallkontakte ──────────────────────────────────
  drawSectionHeader('NOTFALLKONTAKTE')

  if (data.contacts.length > 0) {
    const contactData = data.contacts.map((c) => [
      c.name,
      c.phone || '\u2013',
      c.relation || '\u2013',
    ])

    autoTable(doc, {
      startY: y,
      head: [['Name', 'Telefon', 'Beziehung']],
      body: contactData,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 9,
        cellPadding: 3.5,
        textColor: TEXT_DARK as [number, number, number],
        lineColor: [229, 231, 235],
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: PRIMARY as [number, number, number],
        textColor: WHITE as [number, number, number],
        fontStyle: 'bold',
        fontSize: 9,
      },
      alternateRowStyles: { fillColor: [249, 250, 251] as [number, number, number] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 55 },
        1: { cellWidth: 50 },
      },
      theme: 'grid',
    })

    // @ts-expect-error jspdf-autotable extends doc with lastAutoTable
    y = doc.lastAutoTable.finalY + 6
  } else {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(...TEXT_LIGHT)
    doc.text('Noch keine Kontakte eingetragen.', margin + 2, y)
    y += 10
  }

  // ─── Wichtige Nummern ─────────────────────────────────
  drawSectionHeader('WICHTIGE NUMMERN')

  autoTable(doc, {
    startY: y,
    body: WICHTIGE_NUMMERN,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 9,
      cellPadding: 3,
      textColor: TEXT_DARK as [number, number, number],
      lineColor: [229, 231, 235],
      lineWidth: 0.2,
    },
    alternateRowStyles: { fillColor: [254, 242, 242] as [number, number, number] },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { fontStyle: 'bold', halign: 'right' as const, textColor: RED as [number, number, number] },
    },
    theme: 'plain',
  })

  // @ts-expect-error jspdf-autotable extends doc with lastAutoTable
  y = doc.lastAutoTable.finalY + 6

  // ─── Zusätzliche Hinweise ─────────────────────────────
  drawSectionHeader('HINWEISE & TIPPS')

  const tipps = [
    '\u{1F4F1} NINA Warn-App installieren (BBK)',
    '\u{1F4FB} Batteriebetriebenes Radio bereithalten',
    '\u{1F4B0} Bargeldreserve: 100\u2013200 \u20AC in kleinen Scheinen',
    '\u{1F4C4} Wichtige Dokumente (Kopien) griffbereit halten',
    '\u{1F4A7} Wasservorrat: 2 Liter pro Person und Tag (10 Tage)',
  ]

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...TEXT_MED)

  tipps.forEach((tipp) => {
    doc.text(tipp, margin + 2, y)
    y += 5
  })

  y += 4

  // ─── Persönliche Notizen ──────────────────────────────
  if (data.notes && data.notes.trim()) {
    drawSectionHeader('PERSÖNLICHE NOTIZEN')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...TEXT_MED)

    const lines = doc.splitTextToSize(data.notes, contentWidth - 4)
    // Limit to available space
    const maxLines = Math.min(lines.length, Math.floor((pageHeight - y - 25) / 4.5))
    const visibleLines = lines.slice(0, maxLines)
    doc.text(visibleLines, margin + 2, y)
    y += visibleLines.length * 4.5 + 4
  }

  // ─── Footer ───────────────────────────────────────────
  doc.setDrawColor(...TEXT_LIGHT)
  doc.setLineWidth(0.3)
  doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...TEXT_LIGHT)
  doc.text('Diese Notfallkarte wurde mit alarmplaner.de erstellt. Bitte aktuell halten und an einem sicheren Ort aufbewahren.', margin, pageHeight - 9)
  doc.text(dateStr, pageWidth - margin, pageHeight - 9, { align: 'right' })

  // ─── Save ─────────────────────────────────────────────
  doc.save(`Notfallkarte_${dateStr.replace(/\s/g, '_')}.pdf`)

  // ─── Helpers ──────────────────────────────────────────
  function drawSectionHeader(title: string) {
    doc.setFillColor(RED[0], RED[1], RED[2])
    doc.rect(margin, y - 1, 3, 6, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(RED[0], RED[1], RED[2])
    doc.text(title, margin + 6, y + 3)

    y += 10
  }
}
