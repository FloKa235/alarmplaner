import { useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'

// ─── Result-Typen ─────────────────────────────────────

export interface RiskAnalysisResult {
  success: boolean
  profile: {
    id: string
    district_id: string
    risk_score: number
    risk_level: string
    generated_at: string
  }
  entries: Array<{
    id: string
    risk_profile_id: string
    type: string
    score: number
    level: string
    trend: string
    description: string
  }>
  zusammenfassung: string
}

export interface ScenarioGenerationResult {
  success: boolean
  scenario: {
    id: string
    district_id: string
    title: string
    type: string
    severity: number
    description: string
    affected_population: number
    is_ai_generated: boolean
    created_at: string
  }
  phases: Array<{
    id: string
    scenario_id: string
    sort_order: number
    name: string
    duration: string
    tasks: string[]
  }>
}

// ─── Direkter Edge-Function Aufruf (ohne SDK) ────────

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

async function callEdgeFunction<T>(
  functionName: string,
  body: Record<string, unknown>
): Promise<T> {
  // Session-Token holen
  const { data: { session } } = await supabase.auth.getSession()
  const accessToken = session?.access_token

  if (!accessToken) {
    throw new Error('Nicht angemeldet. Bitte erneut einloggen.')
  }

  const url = `${SUPABASE_URL}/functions/v1/${functionName}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  })

  // Response-Body immer als JSON parsen
  let result: T & { success?: boolean; error?: string }
  try {
    result = await response.json()
  } catch {
    throw new Error(
      `Edge Function Fehler (HTTP ${response.status}). Antwort konnte nicht gelesen werden.`
    )
  }

  // Fehler aus dem Body prüfen (unsere Functions geben immer success: true/false)
  if (!result.success) {
    throw new Error(
      result.error || `Unbekannter Fehler (HTTP ${response.status})`
    )
  }

  return result
}

// ─── Generischer Hook ────────────────────────────────

interface UseAIResult<T> {
  execute: () => Promise<T | null>
  data: T | null
  loading: boolean
  error: string | null
  reset: () => void
}

function useEdgeFunction<T>(
  functionName: string,
  bodyFn: () => Record<string, unknown>
): UseAIResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Ref hält immer die aktuelle bodyFn, damit execute() nie einen stale Closure nutzt
  const bodyFnRef = useRef(bodyFn)
  bodyFnRef.current = bodyFn

  const execute = useCallback(async () => {
    setLoading(true)
    setError(null)
    setData(null)

    try {
      const result = await callEdgeFunction<T>(functionName, bodyFnRef.current())
      setData(result)
      return result
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Verbindungsfehler. Bitte prüfen Sie Ihre Internetverbindung.'
      console.error(`[useAI] ${functionName} Fehler:`, message)
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [functionName])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return { execute, data, loading, error, reset }
}

// ─── Exported Hooks ───────────────────────────────────

/**
 * Hook für KI-Risikoanalyse (Säule 1).
 * Ruft die Edge Function `ai-risk-analysis` auf.
 */
export function useRiskAnalysis(districtId: string | null) {
  return useEdgeFunction<RiskAnalysisResult>('ai-risk-analysis', () => ({
    districtId,
  }))
}

/**
 * Hook für KI-Szenario-Generierung (Säule 2).
 * Ruft die Edge Function `ai-generate-scenario` auf.
 */
export function useScenarioGeneration(
  districtId: string | null,
  scenarioType?: string
) {
  return useEdgeFunction<ScenarioGenerationResult>(
    'ai-generate-scenario',
    () => ({
      districtId,
      scenarioType,
    })
  )
}

// ─── Handbook Enrichment ─────────────────────────────

export interface HandbookEnrichmentResult {
  success: boolean
  scenario: {
    id: string
    handbook: import('@/types/database').ScenarioHandbook
    is_handbook_generated: boolean
  }
}

/**
 * Hook für KI-Krisenhandbuch-Generierung.
 * Ruft die Edge Function `ai-enrich-scenario` auf.
 * Optional: documentId eines hochgeladenen Handlungsplans als KI-Kontext.
 */
export function useHandbookEnrichment(scenarioId: string | null, documentId?: string | null) {
  return useEdgeFunction<HandbookEnrichmentResult>(
    'ai-enrich-scenario',
    () => ({
      scenarioId,
      ...(documentId ? { documentId } : {}),
    })
  )
}
