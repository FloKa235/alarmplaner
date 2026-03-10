/**
 * EnterpriseCrisisContext – Krisenmodus fuer Unternehmen
 *
 * Fork von CrisisContext, nutzt useOrganization() statt useDistrict().
 * Schreibt in organizations-Tabelle statt districts.
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
import { useOrganization } from '@/hooks/useOrganization'
import type { CrisisEventType } from '@/types/database'

export type CrisisStufe = 'vorwarnung' | 'teilaktivierung' | 'vollaktivierung'

interface EnterpriseCrisisState {
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

export const EnterpriseCrisisContext = createContext<EnterpriseCrisisState | null>(null)

function calcElapsed(startedAt: string | null): number {
  if (!startedAt) return 0
  return Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000))
}

export function EnterpriseCrisisProvider({ children }: { children: ReactNode }) {
  const { organization, organizationId } = useOrganization()

  const [isActive, setIsActive] = useState(false)
  const [scenarioId, setScenarioId] = useState<string | null>(null)
  const [scenarioTitle, setScenarioTitle] = useState<string | null>(null)
  const [stufe, setStufe] = useState<CrisisStufe | null>(null)
  const [startedAt, setStartedAt] = useState<string | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [loading, setLoading] = useState(true)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Initial load from organization
  useEffect(() => {
    if (!organization) {
      setLoading(false)
      return
    }

    const loadCrisisState = async () => {
      setLoading(true)

      if (organization.crisis_active && organization.crisis_scenario_id) {
        setIsActive(true)
        setScenarioId(organization.crisis_scenario_id)
        setStufe(organization.crisis_stufe ?? null)
        setStartedAt(organization.crisis_started_at ?? null)
        setElapsedSeconds(calcElapsed(organization.crisis_started_at ?? null))

        const { data: scenario } = await supabase
          .from('scenarios')
          .select('title')
          .eq('id', organization.crisis_scenario_id)
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
  }, [organization])

  // Timer
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
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isActive, startedAt])

  const insertEvent = useCallback(
    async (
      type: CrisisEventType,
      beschreibung: string,
      details: Record<string, unknown> = {}
    ) => {
      if (!organizationId) return

      await supabase.from('crisis_events').insert({
        organization_id: organizationId,
        scenario_id: scenarioId,
        type,
        beschreibung,
        details,
      })
    },
    [organizationId, scenarioId]
  )

  const activateCrisis = useCallback(
    async (newScenarioId: string, newScenarioTitle: string, newStufe: CrisisStufe) => {
      if (!organizationId) return

      const now = new Date().toISOString()

      const { error } = await supabase
        .from('organizations')
        .update({
          crisis_active: true,
          crisis_scenario_id: newScenarioId,
          crisis_stufe: newStufe,
          crisis_started_at: now,
          crisis_ended_at: null,
        })
        .eq('id', organizationId)

      if (error) {
        console.error('Krise aktivieren fehlgeschlagen:', error)
        return
      }

      setIsActive(true)
      setScenarioId(newScenarioId)
      setScenarioTitle(newScenarioTitle)
      setStufe(newStufe)
      setStartedAt(now)
      setElapsedSeconds(0)

      await supabase.from('crisis_events').insert({
        organization_id: organizationId,
        scenario_id: newScenarioId,
        type: 'krise_aktiviert' as CrisisEventType,
        beschreibung: `Krisenfall aktiviert: ${newScenarioTitle} (${newStufe})`,
        details: { stufe: newStufe },
      })
    },
    [organizationId]
  )

  const deactivateCrisis = useCallback(async () => {
    if (!organizationId) return

    const now = new Date().toISOString()

    await supabase.from('crisis_events').insert({
      organization_id: organizationId,
      scenario_id: scenarioId,
      type: 'krise_beendet' as CrisisEventType,
      beschreibung: `Krisenfall beendet: ${scenarioTitle ?? 'Unbekannt'} (Dauer: ${formatElapsed(elapsedSeconds)})`,
      details: { dauer_sekunden: elapsedSeconds, stufe },
    })

    await supabase
      .from('organizations')
      .update({
        crisis_active: false,
        crisis_scenario_id: null,
        crisis_stufe: null,
        crisis_ended_at: now,
      })
      .eq('id', organizationId)

    setIsActive(false)
    setScenarioId(null)
    setScenarioTitle(null)
    setStufe(null)
    setStartedAt(null)
    setElapsedSeconds(0)
  }, [organizationId, scenarioId, scenarioTitle, elapsedSeconds, stufe])

  const changeStufe = useCallback(
    async (newStufe: CrisisStufe) => {
      if (!organizationId || !isActive) return

      await supabase
        .from('organizations')
        .update({ crisis_stufe: newStufe })
        .eq('id', organizationId)

      const oldStufe = stufe
      setStufe(newStufe)

      await supabase.from('crisis_events').insert({
        organization_id: organizationId,
        scenario_id: scenarioId,
        type: 'stufe_geaendert' as CrisisEventType,
        beschreibung: `Alarmstufe geaendert: ${oldStufe} → ${newStufe}`,
        details: { von: oldStufe, nach: newStufe },
      })
    },
    [organizationId, isActive, scenarioId, stufe]
  )

  return (
    <EnterpriseCrisisContext.Provider
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
    </EnterpriseCrisisContext.Provider>
  )
}

export function useEnterpriseCrisis(): EnterpriseCrisisState {
  const context = useContext(EnterpriseCrisisContext)
  if (!context) {
    throw new Error('useEnterpriseCrisis must be used within an EnterpriseCrisisProvider')
  }
  return context
}

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
