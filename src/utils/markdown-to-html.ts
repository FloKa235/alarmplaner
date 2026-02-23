/**
 * Konvertiert bestehende Markdown-Inhalte zu HTML für den tiptap-Editor.
 * Wird nur einmal beim Laden alter (Markdown-)Inhalte aufgerufen.
 * Erkennung: Markdown beginnt NICHT mit '<'.
 */

export function isHtml(text: string): boolean {
  const trimmed = text.trim()
  return trimmed.startsWith('<')
}

export function markdownToHtml(md: string): string {
  if (!md || !md.trim()) return ''
  if (isHtml(md)) return md // Bereits HTML

  const lines = md.split('\n')
  const htmlParts: string[] = []
  let inList = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Leere Zeile
    if (!trimmed) {
      if (inList) {
        htmlParts.push('</ul>')
        inList = false
      }
      continue
    }

    // ### Überschrift
    if (trimmed.startsWith('### ')) {
      if (inList) { htmlParts.push('</ul>'); inList = false }
      const text = formatInline(trimmed.replace(/^###\s+/, ''))
      htmlParts.push(`<h3>${text}</h3>`)
      continue
    }

    // - Bullet Point
    if (trimmed.startsWith('- ')) {
      if (!inList) { htmlParts.push('<ul>'); inList = true }
      const text = formatInline(trimmed.replace(/^-\s+/, ''))
      htmlParts.push(`<li>${text}</li>`)
      continue
    }

    // Normaler Absatz
    if (inList) { htmlParts.push('</ul>'); inList = false }
    const text = formatInline(trimmed)
    htmlParts.push(`<p>${text}</p>`)
  }

  if (inList) htmlParts.push('</ul>')

  return htmlParts.join('')
}

/** Inline-Formatierung: **bold**, *italic*, [text](url), „Zitate" */
function formatInline(text: string): string {
  return text
    // **bold** → <strong>
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // *italic* → <em>
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // [text](url) → <a>
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // „Zitate" → <em>
    .replace(/\u201E([^\u201C]+)\u201C/g, '<em>\u201E$1\u201C</em>')
}
