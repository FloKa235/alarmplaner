/**
 * html-to-pdf-text.ts — Parst HTML-Content aus TiptapEditor
 * und rendert Segmente (heading, paragraph, bulletList, hr) in jsPDF.
 *
 * Kein DOM nötig — rein regex-basiert für die von Tiptap/Edge-Function
 * generierten Tags: <h3>, <p>, <ul><li>, <ol><li>, <hr>, <strong>, <em>, <a>
 */

export interface PDFRenderContext {
  addSubHeader: (text: string) => void
  addParagraph: (text: string) => void
  addBulletList: (items: string[], indent?: number) => void
  checkPageBreak: (height: number) => void
  addY: (delta: number) => void
}

interface Segment {
  type: 'heading' | 'paragraph' | 'bulletList' | 'orderedList' | 'hr'
  content: string // plain text (headings, paragraphs)
  items?: string[] // list items
}

/**
 * Erkennt ob ein String HTML enthält.
 */
export function isHtml(text: string): boolean {
  return /<\/?[a-z][\s\S]*?>/i.test(text)
}

/**
 * Entfernt Inline-Tags und dekodiert HTML-Entities.
 */
function stripInlineTags(html: string): string {
  return html
    // Entferne Tags, behalte Textinhalt
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(?:strong|b|em|i|u|a|span|code|mark|s|del|sub|sup)[^>]*>/gi, '')
    // HTML-Entities dekodieren
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Doppelte Leerzeichen normalisieren
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Parst HTML in Segmente für PDF-Rendering.
 */
function parseHtmlSegments(html: string): Segment[] {
  const segments: Segment[] = []

  // Normalisiere Whitespace zwischen Tags
  const normalized = html.replace(/>\s+</g, '><').trim()

  // Split nach Block-Level-Elementen
  const blockPattern = /<(h[1-6]|p|ul|ol|hr|div|blockquote)(?:\s[^>]*)?>[\s\S]*?<\/\1>|<hr\s*\/?>/gi
  let match: RegExpExecArray | null

  while ((match = blockPattern.exec(normalized)) !== null) {
    const block = match[0]
    const tag = match[1]?.toLowerCase()

    if (tag === 'hr' || block.match(/^<hr/i)) {
      segments.push({ type: 'hr', content: '' })
      continue
    }

    if (tag?.startsWith('h')) {
      const inner = block.replace(/<\/?h[1-6][^>]*>/gi, '')
      const text = stripInlineTags(inner)
      if (text) {
        segments.push({ type: 'heading', content: text })
      }
      continue
    }

    if (tag === 'ul') {
      const items: string[] = []
      const liPattern = /<li[^>]*>([\s\S]*?)<\/li>/gi
      let liMatch: RegExpExecArray | null
      while ((liMatch = liPattern.exec(block)) !== null) {
        const text = stripInlineTags(liMatch[1])
        if (text) items.push(text)
      }
      if (items.length > 0) {
        segments.push({ type: 'bulletList', content: '', items })
      }
      continue
    }

    if (tag === 'ol') {
      const items: string[] = []
      const liPattern = /<li[^>]*>([\s\S]*?)<\/li>/gi
      let liMatch: RegExpExecArray | null
      let idx = 1
      while ((liMatch = liPattern.exec(block)) !== null) {
        const text = stripInlineTags(liMatch[1])
        if (text) items.push(`${idx}. ${text}`)
        idx++
      }
      if (items.length > 0) {
        segments.push({ type: 'orderedList', content: '', items })
      }
      continue
    }

    if (tag === 'p' || tag === 'div' || tag === 'blockquote') {
      const inner = block.replace(/<\/?(?:p|div|blockquote)[^>]*>/gi, '')
      const text = stripInlineTags(inner)
      if (text) {
        segments.push({ type: 'paragraph', content: text })
      }
      continue
    }
  }

  // Fallback: Wenn keine Segmente erkannt, gesamten Text als Paragraph
  if (segments.length === 0) {
    const fallbackText = stripInlineTags(html)
    if (fallbackText) {
      segments.push({ type: 'paragraph', content: fallbackText })
    }
  }

  return segments
}

/**
 * Rendert HTML-Content in jsPDF über den Context.
 */
export function renderHtmlToPDF(html: string, ctx: PDFRenderContext): void {
  const segments = parseHtmlSegments(html)

  segments.forEach(seg => {
    switch (seg.type) {
      case 'heading':
        ctx.addSubHeader(seg.content)
        break
      case 'paragraph':
        ctx.addParagraph(seg.content)
        break
      case 'bulletList':
        if (seg.items) ctx.addBulletList(seg.items)
        ctx.addY(2)
        break
      case 'orderedList':
        // Ordered lists als Bullets rendern (Nummerierung ist schon im Text)
        if (seg.items) ctx.addBulletList(seg.items)
        ctx.addY(2)
        break
      case 'hr':
        ctx.addY(4)
        break
    }
  })
}
