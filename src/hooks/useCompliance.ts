import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useOrganization } from '@/hooks/useOrganization'
import type { DbComplianceFramework, DbComplianceRequirement, DbComplianceRequirementInsert, RequirementStatus } from '@/types/database'
import { DEFAULT_FRAMEWORK_TEMPLATES } from '@/data/compliance-defaults'

interface UseComplianceReturn {
  frameworks: DbComplianceFramework[]
  requirements: DbComplianceRequirement[]
  loading: boolean
  error: string | null
  seeding: boolean
  updateRequirementStatus: (id: string, status: RequirementStatus) => Promise<void>
  updateRequirement: (id: string, updates: Partial<DbComplianceRequirementInsert>) => Promise<void>
  refetch: () => void
}

function calcProgress(reqs: DbComplianceRequirement[]): number {
  const applicable = reqs.filter(r => r.status !== 'nicht_anwendbar')
  if (applicable.length === 0) return 0
  const score = applicable.reduce((sum, r) => {
    if (r.status === 'erfuellt') return sum + 1
    if (r.status === 'teilweise') return sum + 0.5
    return sum
  }, 0)
  return Math.round((score / applicable.length) * 100)
}

export function useCompliance(): UseComplianceReturn {
  const { organizationId } = useOrganization()
  const [frameworks, setFrameworks] = useState<DbComplianceFramework[]>([])
  const [requirements, setRequirements] = useState<DbComplianceRequirement[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)
  const seedingRef = useRef(false)

  const fetchAll = useCallback(async () => {
    if (!organizationId) {
      setFrameworks([])
      setRequirements([])
      setLoading(false)
      return
    }

    const currentRequestId = ++requestIdRef.current
    setLoading(true)
    setError(null)

    try {
      // Fetch frameworks
      const { data: fwData, error: fwError } = await supabase
        .from('compliance_frameworks')
        .select('*')
        .eq('organization_id', organizationId)

      if (currentRequestId !== requestIdRef.current) return
      if (fwError) throw fwError

      const fws = (fwData as DbComplianceFramework[]) || []

      // If no frameworks exist, seed defaults
      if (fws.length === 0 && !seedingRef.current) {
        seedingRef.current = true
        setSeeding(true)
        await seedDefaults(organizationId)
        seedingRef.current = false
        setSeeding(false)
        // Re-fetch after seeding
        requestIdRef.current++ // invalidate current request
        fetchAll()
        return
      }

      setFrameworks(fws)

      // Fetch requirements for all frameworks
      if (fws.length > 0) {
        const fwIds = fws.map(f => f.id)
        const { data: reqData, error: reqError } = await supabase
          .from('compliance_requirements')
          .select('*')
          .in('framework_id', fwIds)
          .order('sort_order')

        if (currentRequestId !== requestIdRef.current) return
        if (reqError) throw reqError

        setRequirements((reqData as DbComplianceRequirement[]) || [])
      } else {
        setRequirements([])
      }
    } catch (err) {
      if (currentRequestId !== requestIdRef.current) return
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [organizationId])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // Seed default frameworks + requirements
  const seedDefaults = async (orgId: string) => {
    for (const template of DEFAULT_FRAMEWORK_TEMPLATES) {
      // Insert framework (ON CONFLICT ignore via unique constraint)
      const { data: fwData, error: fwError } = await supabase
        .from('compliance_frameworks')
        .upsert(
          { organization_id: orgId, framework_type: template.framework_type },
          { onConflict: 'organization_id,framework_type' }
        )
        .select('id')
        .single()

      if (fwError || !fwData) continue

      // Insert requirements
      const reqInserts = template.requirements.map(r => ({
        framework_id: fwData.id,
        section: r.section,
        title: r.title,
        description: r.description,
        action_href: r.action_href || null,
        action_label: r.action_label || null,
        sort_order: r.sort_order,
        status: 'offen' as const,
      }))

      await supabase.from('compliance_requirements').insert(reqInserts)
    }
  }

  // Update single requirement status + recalc framework progress
  const updateRequirementStatus = useCallback(async (id: string, status: RequirementStatus) => {
    const prevReqs = requirements
    const req = requirements.find(r => r.id === id)
    if (!req) return

    // Optimistic update
    const updatedReqs = requirements.map(r => r.id === id ? { ...r, status } : r)
    setRequirements(updatedReqs)

    const { error: updateError } = await supabase
      .from('compliance_requirements')
      .update({ status })
      .eq('id', id)

    if (updateError) {
      setRequirements(prevReqs)
      throw updateError
    }

    // Recalculate framework progress
    const frameworkReqs = updatedReqs.filter(r => r.framework_id === req.framework_id)
    const newProgress = calcProgress(frameworkReqs)

    setFrameworks(fws => fws.map(f =>
      f.id === req.framework_id ? { ...f, progress_pct: newProgress } : f
    ))

    await supabase
      .from('compliance_frameworks')
      .update({ progress_pct: newProgress })
      .eq('id', req.framework_id)
  }, [requirements])

  // Update requirement fields (notes, responsible, due_date)
  const updateRequirement = useCallback(async (id: string, updates: Partial<DbComplianceRequirementInsert>) => {
    const prev = requirements
    setRequirements(r => r.map(item => item.id === id ? { ...item, ...updates } as DbComplianceRequirement : item))

    const { error: updateError } = await supabase
      .from('compliance_requirements')
      .update(updates)
      .eq('id', id)

    if (updateError) {
      setRequirements(prev)
      throw updateError
    }

    // If status was changed, recalculate progress
    if (updates.status) {
      const req = requirements.find(r => r.id === id)
      if (req) {
        const updatedReqs = requirements.map(r => r.id === id ? { ...r, ...updates } as DbComplianceRequirement : r)
        const frameworkReqs = updatedReqs.filter(r => r.framework_id === req.framework_id)
        const newProgress = calcProgress(frameworkReqs)
        setFrameworks(fws => fws.map(f =>
          f.id === req.framework_id ? { ...f, progress_pct: newProgress } : f
        ))
        await supabase
          .from('compliance_frameworks')
          .update({ progress_pct: newProgress })
          .eq('id', req.framework_id)
      }
    }
  }, [requirements])

  return {
    frameworks,
    requirements,
    loading,
    error,
    seeding,
    updateRequirementStatus,
    updateRequirement,
    refetch: fetchAll,
  }
}
