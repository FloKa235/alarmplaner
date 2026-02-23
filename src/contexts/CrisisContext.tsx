/**
 * CrisisContext – Globaler Krisenmodus-State
 *
 * Verwaltet den aktiven Krisenfall auf District-Ebene.
 * Steuert CSS-Transformation, Sidebar-Navigation und Timer.
 * Muss innerhalb von DistrictProvider verwendet werden.
 */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import { supabase } from '@/lib/supabase'
import { useDistrict } from '@/hooks/useDistrict'
import type { CrisisEventType } from '@/types/database'

// ─── Types ───────────────────────────────────────────

export type CrisisStufe = 'vorwarnung' | 'teilaktivierung' | 'vollaktivierung'

interface CrisisState {
  isActive: boolean
  scenarioId: string | null
  scenarioTitle: string | null
  stufe: CrisisStufe | null
  startedAt: string | null
  elapsedSeconds: number
  loading: boolean
  activateCrisis: (scenarioId: string, scenarioTitle: string, stufe: CrisisStufe) => Promise<void>
  deactivateCrisis: () => Promise<void>
  changeStufe: (stufe: CrisisStufe) => Promise<void>
  insertEvent: (
    type: CrisisEventType,
    beschreibung: string,
    details?: Record<string, unknown>
  ) => Promise<void>
}

const CrisisContext = createContext<CrisisState | null>(null)

// ─── Helper: Elapsed seconds ─────────────────────────

function calcElapsed(startedAt: string | null): number {
  if (!startedAt) return 0
  return Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000))
}

// ─── Provider ────────────────────────────────────────

export function CrisisProvider({ children }: { children: ReactNode }) {
  const { district, districtId } = useDistrict()

  const [isActive, setIsActive] = useState(false)
  const [scenarioId, setScenarioId] = useState<string | null>(null)
  const [scenarioTitle, setScenarioTitle] = useState<string | null>(null)
  const [stufe, setStufe] = useState<CrisisStufe | null>(null)
  const [startedAt, setStartedAt] = useState<string | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [loading, setLoading] = useState(true)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ─── Initial load from district ────────────────────

  useEffect(() => {
    if (!district) {
      setLoading(false)
      return
    }

    const loadCrisisState = async () => {
      setLoading(true)

      if (district.crisis_active && district.crisis_scenario_id) {
        setIsActive(true)
        setScenarioId(district.crisis_scenario_id)
        setStufe(district.crisis_stufe ?? null)
        setStartedAt(district.crisis_started_at ?? null)
        setElapsedSeconds(calcElapsed(district.crisis_started_at ?? null))

        // Szenario-Titel laden
        const { data: scenario } = await supabase
          .from('scenarios')
          .select('title')
          .eq('id', district.crisis_scenario_id)
          .maybeSingle()

        setScenarioTitle(scenario?.title ?? null)
      } else {
        setIsActive(false)
        setScenarioId(null)
        setScenarioTitle(null)
        setStufe(null)
        setStartedAt(null)
        setElapsedSeconds(0)
      }

      setLoading(false)
    }

    loadCrisisState()
  }, [district])

  // ─── Timer: 1s Interval wenn Krise aktiv ───────────

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (isActive && startedAt) {
      setElapsedSeconds(calcElapsed(startedAt))
      timerRef.current = setInterval(() => {
        setElapsedSeconds(calcElapsed(startedAt))
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isActive, startedAt])

  // ─── Insert crisis event ───────────────────────────

  const insertEvent = useCallback(
    async (
      type: CrisisEventType,
      beschreibung: string,
      details: Record<string, unknown> = {}
    ) => {
      if (!districtId) return

      await supabase.from('crisis_events').insert({
        district_id: districtId,
        scenario_id: scenarioId,
        type,
        beschreibung,
        details,
      })
    },
    [districtId, scenarioId]
  )

  // ─── Activate crisis ──────────────────────────────

  const activateCrisis = useCallback(
    async (newScenarioId: string, newScenarioTitle: string, newStufe: CrisisStufe) => {
      if (!districtId) return

      const now = new Date().toISOString()

      // District updaten
      const { error } = await supabase
        .from('districts')
        .update({
          crisis_active: true,
          crisis_scenario_id: newScenarioId,
          crisis_stufe: newStufe,
          crisis_started_at: now,
          crisis_ended_at: null,
        })
        .eq('id', districtId)

      if (error) {
        console.error('Krise aktivieren fehlgeschlagen:', error)
        return
      }

      // State updaten
      setIsActive(true)
      setScenarioId(newScenarioId)
      setScenarioTitle(newScenarioTitle)
      setStufe(newStufe)
      setStartedAt(now)
      setElapsedSeconds(0)

      // Event loggen
      await supabase.from('crisis_events').insert({
        district_id: districtId,
        scenario_id: newScenarioId,
        type: 'krise_aktiviert' as CrisisEventType,
        beschreibung: `Krisenfall aktiviert: ${newScenarioTitle} (${newStufe})`,
        details: { stufe: newStufe },
      })
    },
    [districtId]
  )

  // ─── Deactivate crisis ─────────────────────────────

  const deactivateCrisis = useCallback(async () => {
    if (!districtId) return

    const now = new Date().toISOString()

    // Event loggen BEVOR wir den State zurücksetzen
    await supabase.from('crisis_events').insert({
      district_id: districtId,
      scenario_id: scenarioId,
      type: 'krise_beendet' as CrisisEventType,
      beschreibung: `Krisenfall beendet: ${scenarioTitle ?? 'Unbekannt'} (Dauer: ${formatElapsed(elapsedSeconds)})`,
      details: { dauer_sekunden: elapsedSeconds, stufe },
    })

    // District updaten
    await supabase
      .from('districts')
      .update({
        crisis_active: false,
        crisis_scenario_id: null,
        crisis_stufe: null,
        crisis_ended_at: now,
      })
      .eq('id', districtId)

    // State zurücksetzen
    setIsActive(false)
    setScenarioId(null)
    setScenarioTitle(null)
    setStufe(null)
    setStartedAt(null)
    setElapsedSeconds(0)
  }, [districtId, scenarioId, scenarioTitle, elapsedSeconds, stufe])

  // ─── Change Stufe ──────────────────────────────────

  const changeStufe = useCallback(
    async (newStufe: CrisisStufe) => {
      if (!districtId || !isActive) return

      await supabase
        .from('districts')
        .update({ crisis_stufe: newStufe })
        .eq('id', districtId)

      const oldStufe = stufe
      setStufe(newStufe)

      await supabase.from('crisis_events').insert({
        district_id: districtId,
        scenario_id: scenarioId,
        type: 'stufe_geaendert' as CrisisEventType,
        beschreibung: `Alarmstufe geändert: ${oldStufe} → ${newStufe}`,
        details: { von: oldStufe, nach: newStufe },
      })
    },
    [districtId, isActive, scenarioId, stufe]
  )

  return (
    <CrisisContext.Provider
      value={{
        isActive,
        scenarioId,
        scenarioTitle,
        stufe,
        startedAt,
        elapsedSeconds,
        loading,
        activateCrisis,
        deactivateCrisis,
        changeStufe,
        insertEvent,
      }}
    >
      {children}
    </CrisisContext.Provider>
  )
}

// ─── Hook ────────────────────────────────────────────

export function useCrisis(): CrisisState {
  const context = useContext(CrisisContext)
  if (!context) {
    throw new Error('useCrisis must be used within a CrisisProvider')
  }
  return context
}

// ─── Helpers (exported for use in components) ────────

export function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60

  if (h > 0) {
    return `${h}h ${m.toString().padStart(2, '0')}m`
  }
  return `${m}m ${s.toString().padStart(2, '0')}s`
}

export const stufeLabelMap: Record<CrisisStufe, string> = {
  vorwarnung: 'Vorwarnung',
  teilaktivierung: 'Teilaktivierung',
  vollaktivierung: 'Vollaktivierung',
}

export const stufeColorMap: Record<CrisisStufe, string> = {
  vorwarnung: 'bg-yellow-100 text-yellow-800',
  teilaktivierung: 'bg-orange-100 text-orange-800',
  vollaktivierung: 'bg-red-100 text-red-800',
}
