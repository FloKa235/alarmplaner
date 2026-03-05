import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2, Circle, Clock,
  ChevronDown, ChevronRight, Shield, Landmark,
  BookOpen, ArrowRight, Loader2, AlertCircle,
} from 'lucide-react'
import { useCompliance } from '@/hooks/useCompliance'
import { DEFAULT_FRAMEWORK_TEMPLATES } from '@/data/compliance-defaults'
import type { RequirementStatus, FrameworkType, DbComplianceRequirement } from '@/types/database'

// ─── UI Config ──────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  shield: Shield,
  landmark: Landmark,
  bookOpen: BookOpen,
}

const STATUS_CONFIG: Record<RequirementStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  erfuellt: { label: 'Erfuellt', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
  teilweise: { label: 'Teilweise', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  offen: { label: 'Offen', icon: Circle, color: 'text-red-500', bg: 'bg-red-50' },
  nicht_anwendbar: { label: 'N/A', icon: Circle, color: 'text-gray-400', bg: 'bg-gray-50' },
}

const STATUS_OPTIONS: { value: RequirementStatus; label: string }[] = [
  { value: 'offen', label: 'Offen' },
  { value: 'teilweise', label: 'Teilweise' },
  { value: 'erfuellt', label: 'Erfuellt' },
  { value: 'nicht_anwendbar', label: 'N/A' },
]

// ─── Main Component ──────────────────────────────────

export default function CompliancePage() {
  const { frameworks, requirements, loading, error, seeding, updateRequirementStatus, updateRequirement } = useCompliance()
  const [activeFrameworkType, setActiveFrameworkType] = useState<FrameworkType>('nis2')

  const activeFramework = frameworks.find(f => f.framework_type === activeFrameworkType)
  const activeTemplate = DEFAULT_FRAMEWORK_TEMPLATES.find(t => t.framework_type === activeFrameworkType)

  const frameworkReqs = useMemo(() => {
    if (!activeFramework) return []
    return requirements.filter(r => r.framework_id === activeFramework.id)
  }, [activeFramework, requirements])

  const statusCounts = useMemo(() => {
    const counts = { erfuellt: 0, teilweise: 0, offen: 0, nicht_anwendbar: 0 }
    frameworkReqs.forEach(r => counts[r.status]++)
    return counts
  }, [frameworkReqs])

  const progress = activeFramework?.progress_pct ?? 0

  if (loading || seeding) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
        {seeding && <p className="mt-3 text-sm text-text-muted">Frameworks werden initialisiert...</p>}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <AlertCircle className="mx-auto mb-2 h-6 w-6 text-red-500" />
        <p className="text-sm text-red-700">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Compliance-Center</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Regulatorische Anforderungen tracken, Nachweise verknuepfen, Audit-ready werden.
        </p>
      </div>

      {/* Framework-Tabs */}
      <div className="flex flex-wrap gap-2">
        {DEFAULT_FRAMEWORK_TEMPLATES.map(template => {
          const fw = frameworks.find(f => f.framework_type === template.framework_type)
          const pct = fw?.progress_pct ?? 0
          const isSelected = template.framework_type === activeFrameworkType
          const Icon = ICON_MAP[template.iconKey] || Shield
          return (
            <button
              key={template.framework_type}
              onClick={() => setActiveFrameworkType(template.framework_type)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                isSelected
                  ? `${template.border} ${template.bg} ${template.color}`
                  : 'border-border bg-white text-text-secondary hover:border-primary-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {template.shortLabel}
              <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                pct >= 80 ? 'bg-green-100 text-green-700' :
                pct >= 40 ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>
                {pct}%
              </span>
            </button>
          )
        })}
      </div>

      {/* Framework Header Card */}
      {activeTemplate && (
        <div className={`rounded-2xl border ${activeTemplate.border} ${activeTemplate.bg} p-5`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className={`text-lg font-bold ${activeTemplate.color}`}>{activeTemplate.label}</h2>
              <p className="mt-1 text-sm text-text-secondary">{activeTemplate.description}</p>
              <p className="mt-1 text-xs font-semibold text-text-muted">{activeTemplate.deadline}</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Donut */}
              <div className="relative h-20 w-20">
                <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15.9" fill="none"
                    stroke={progress >= 80 ? '#22c55e' : progress >= 40 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="3" strokeLinecap="round"
                    strokeDasharray={`${progress} ${100 - progress}`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-text-primary">{progress}%</span>
                </div>
              </div>
              {/* Counts */}
              <div className="space-y-1 text-xs">
                <p><span className="font-bold text-green-600">{statusCounts.erfuellt}</span> erfuellt</p>
                <p><span className="font-bold text-amber-600">{statusCounts.teilweise}</span> teilweise</p>
                <p><span className="font-bold text-red-500">{statusCounts.offen}</span> offen</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Requirements List */}
      <div className="space-y-2">
        {frameworkReqs.map(req => (
          <RequirementRow
            key={req.id}
            requirement={req}
            onStatusChange={updateRequirementStatus}
            onUpdate={updateRequirement}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Requirement Row ──────────────────────────────────

interface RequirementRowProps {
  requirement: DbComplianceRequirement
  onStatusChange: (id: string, status: RequirementStatus) => Promise<void>
  onUpdate: (id: string, updates: Partial<{ notes: string | null; responsible: string | null; due_date: string | null }>) => Promise<void>
}

function RequirementRow({ requirement: req, onStatusChange, onUpdate }: RequirementRowProps) {
  const [expanded, setExpanded] = useState(false)
  const [notes, setNotes] = useState(req.notes || '')
  const [responsible, setResponsible] = useState(req.responsible || '')
  const [dueDate, setDueDate] = useState(req.due_date || '')
  const cfg = STATUS_CONFIG[req.status]

  const handleStatusChange = async (status: RequirementStatus) => {
    try {
      await onStatusChange(req.id, status)
    } catch {
      // Rollback handled in hook
    }
  }

  const handleFieldBlur = async (field: 'notes' | 'responsible' | 'due_date', value: string) => {
    const currentValue = req[field] || ''
    if (value === currentValue) return
    try {
      await onUpdate(req.id, { [field]: value.trim() || null })
    } catch {
      // Rollback handled in hook
    }
  }

  return (
    <div className="rounded-xl border border-border bg-white transition-all">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${cfg.bg}`}>
          <cfg.icon className={`h-3.5 w-3.5 ${cfg.color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-text-muted">{req.section}</span>
            <span className="text-sm font-medium text-text-primary">{req.title}</span>
          </div>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.bg} ${cfg.color}`}>
          {cfg.label}
        </span>
        {expanded ? <ChevronDown className="h-4 w-4 text-text-muted" /> : <ChevronRight className="h-4 w-4 text-text-muted" />}
      </button>

      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-4">
          <p className="text-sm text-text-secondary">{req.description}</p>

          {/* Inline Status + Fields */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-text-muted">Status</label>
              <select
                value={req.status}
                onChange={e => handleStatusChange(e.target.value as RequirementStatus)}
                className="w-full rounded-lg border border-border bg-white px-3 py-1.5 text-xs text-text-primary focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600/20"
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-text-muted">Verantwortlich</label>
              <input
                value={responsible}
                onChange={e => setResponsible(e.target.value)}
                onBlur={() => handleFieldBlur('responsible', responsible)}
                placeholder="Name / Rolle"
                className="w-full rounded-lg border border-border bg-white px-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-text-muted">Faellig bis</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                onBlur={() => handleFieldBlur('due_date', dueDate)}
                className="w-full rounded-lg border border-border bg-white px-3 py-1.5 text-xs text-text-primary focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600/20"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-text-muted">Notizen / Nachweise</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onBlur={() => handleFieldBlur('notes', notes)}
              rows={2}
              placeholder="Notizen, Nachweise, Links..."
              className="w-full rounded-lg border border-border bg-white px-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600/20 resize-none"
            />
          </div>

          {/* Action Link */}
          {req.action_href && (
            <Link
              to={req.action_href}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-100"
            >
              {req.action_label || 'Bearbeiten'} <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
