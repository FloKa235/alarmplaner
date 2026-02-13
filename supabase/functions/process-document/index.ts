import { corsHeaders } from '../_shared/cors.ts'
import { getAuthenticatedUser, getServiceClient } from '../_shared/auth.ts'
import { callLangdock } from '../_shared/langdock.ts'

/**
 * Edge Function: process-document
 *
 * Verarbeitet ein hochgeladenes Dokument mit KI:
 * 1. Auth prüfen + District-Berechtigung
 * 2. Dokument-Record aus DB laden
 * 3. Datei aus Storage downloaden
 * 4. Text an Langdock senden → KI-Zusammenfassung
 * 5. documents Tabelle updaten: is_processed = true, summary = "..."
 */
Deno.serve(async (req) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1) Auth
    const user = await getAuthenticatedUser(req)
    const serviceClient = getServiceClient()

    // 2) Request Body
    const { document_id } = await req.json()
    if (!document_id) {
      return new Response(
        JSON.stringify({ error: 'document_id ist erforderlich.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3) Dokument aus DB laden
    const { data: doc, error: docError } = await serviceClient
      .from('documents')
      .select('*')
      .eq('id', document_id)
      .single()

    if (docError || !doc) {
      return new Response(
        JSON.stringify({ error: 'Dokument nicht gefunden.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4) District-Berechtigung prüfen
    const { data: district, error: districtError } = await serviceClient
      .from('districts')
      .select('id')
      .eq('id', doc.district_id)
      .eq('user_id', user.id)
      .single()

    if (districtError || !district) {
      return new Response(
        JSON.stringify({ error: 'Keine Berechtigung für dieses Dokument.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5) Datei aus Storage downloaden
    if (!doc.storage_path) {
      return new Response(
        JSON.stringify({ error: 'Keine Datei mit diesem Dokument verknüpft.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: fileData, error: downloadError } = await serviceClient
      .storage
      .from('documents')
      .download(doc.storage_path)

    if (downloadError || !fileData) {
      console.error('Storage Download Fehler:', downloadError)
      return new Response(
        JSON.stringify({ error: 'Datei konnte nicht heruntergeladen werden.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 6) Text extrahieren (für Text-basierte Dateien)
    let textContent = ''
    const fileType = doc.file_type?.toLowerCase() || ''

    if (fileType.includes('pdf') || fileType.includes('text') || fileType.includes('csv')) {
      // Für PDF: Raw Text aus dem Blob extrahieren
      // Hinweis: Echte PDF-Text-Extraktion braucht eine Library.
      // Wir senden den rohen Text-Content und lassen die KI damit arbeiten.
      textContent = await fileData.text()
    } else if (fileType.includes('image') || fileType.includes('jpg') || fileType.includes('png') || fileType.includes('jpeg')) {
      // Bilder können nicht direkt als Text verarbeitet werden
      textContent = `[Bilddatei: ${doc.name}. Bildanalyse nicht verfügbar. Bitte beschreibe das Dokument basierend auf dem Dateinamen und der Kategorie: ${doc.category || 'Unbekannt'}]`
    } else {
      // Office-Formate etc.: Raw text extraction attempt
      textContent = await fileData.text()
    }

    // Limitiere Text auf ~8000 Zeichen für die KI
    const truncatedText = textContent.substring(0, 8000)

    // 7) KI-Zusammenfassung erstellen
    const summaryContent = await callLangdock([
      {
        role: 'system',
        content: `Du bist ein Experte für Krisenmanagement und Katastrophenschutz in Deutschland.
Erstelle eine strukturierte Zusammenfassung des folgenden Dokuments.
Die Zusammenfassung soll für Krisenstabsmitarbeiter in Landkreisen nützlich sein.

Antworte im JSON-Format:
{
  "summary": "Zusammenfassung in 3-5 Sätzen",
  "key_points": ["Kernpunkt 1", "Kernpunkt 2", ...],
  "relevance": "Relevanz für den Katastrophenschutz (1 Satz)",
  "category_suggestion": "Vorgeschlagene Kategorie (Einsatzplan/Verordnung/Handbuch/Sonstiges)"
}`,
      },
      {
        role: 'user',
        content: `Dokument: "${doc.name}"
Kategorie: ${doc.category || 'Nicht angegeben'}
Dateityp: ${doc.file_type}

Inhalt:
${truncatedText || '[Kein Textinhalt verfügbar. Erstelle eine Zusammenfassung basierend auf dem Dateinamen und der Kategorie.]'}`,
      },
    ], {
      temperature: 0.3,
      max_tokens: 1024,
    })

    // 8) KI-Antwort parsen
    let parsedSummary: { summary: string; key_points?: string[]; relevance?: string }
    try {
      parsedSummary = JSON.parse(summaryContent)
    } catch {
      // Fallback wenn JSON-Parsing fehlschlägt
      parsedSummary = { summary: summaryContent }
    }

    // Zusammenfassung formatieren
    const formattedSummary = [
      parsedSummary.summary,
      '',
      parsedSummary.key_points?.length
        ? '**Kernpunkte:**\n' + parsedSummary.key_points.map((p: string) => `• ${p}`).join('\n')
        : '',
      '',
      parsedSummary.relevance ? `**Relevanz:** ${parsedSummary.relevance}` : '',
    ]
      .filter(Boolean)
      .join('\n')

    // 9) Dokument in DB updaten
    const { error: updateError } = await serviceClient
      .from('documents')
      .update({
        is_processed: true,
        summary: formattedSummary,
      })
      .eq('id', document_id)

    if (updateError) {
      console.error('DB Update Fehler:', updateError)
      return new Response(
        JSON.stringify({ error: 'Zusammenfassung konnte nicht gespeichert werden.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 10) Erfolg
    return new Response(
      JSON.stringify({
        success: true,
        summary: formattedSummary,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('process-document Fehler:', err)
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
