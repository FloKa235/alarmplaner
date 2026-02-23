/**
 * WissenssammlungPage — Survival-Handbuch für Bürger
 *
 * 10 Guides zu Notfallvorsorge, aufgeteilt in 4 Kategorien.
 * Karten-Grid mit expandierbaren Detail-Ansichten.
 * + Kontextuelle Empfehlungen basierend auf aktiven Warnungen
 * + Quiz-Modus zum Testen des Wissens
 */
import { useState, useCallback, useMemo } from 'react'
import {
  BookOpen, ChevronDown, ChevronUp, Clock, CheckCircle2,
  Droplets, Flame, Heart, ZapOff, Waves, Radio,
  Warehouse, Baby, ArrowLeft, AlertTriangle, Brain,
} from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import { SURVIVAL_GUIDES, WARNING_GUIDE_MAP, type SurvivalGuide } from '@/data/survival-guides'
import { markGuideAsRead, isGuideRead, getReadCount } from '@/utils/guide-tracking'
import { useCitizenLocation } from '@/hooks/useCitizenLocation'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import type { DbExternalWarning } from '@/types/database'
import QuizMode from '@/components/app/QuizMode'

// ─── Icon Mapping ─────────────────────────────────────────

const ICON_MAP: Record<string, typeof BookOpen> = {
  Droplets,
  Flame,
  Heart,
  ZapOff,
  Waves,
  Backpack: BookOpen,  // Fallback
  CookingPot: Flame,   // Fallback
  Radio,
  Warehouse,
  Baby,
}

const CATEGORY_CONFIG = {
  grundlagen: { name: 'Grundlagen', color: 'bg-blue-50 text-blue-700' },
  wasser_nahrung: { name: 'Wasser & Nahrung', color: 'bg-green-50 text-green-700' },
  notfall_szenarien: { name: 'Notfall-Szenarien', color: 'bg-red-50 text-red-700' },
  familie: { name: 'Familie', color: 'bg-purple-50 text-purple-700' },
}

export default function WissenssammlungPage() {
  const [selectedGuide, setSelectedGuide] = useState<SurvivalGuide | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set())
  const [categoryFilter, setCategoryFilter] = useState<string>('alle')
  const [readCount, setReadCount] = useState(() => getReadCount())
  const [showQuiz, setShowQuiz] = useState(false)

  // ─── Warnungen für kontextuelle Empfehlungen ─────────
  const { location } = useCitizenLocation()

  const { data: matchingDistricts } = useSupabaseQuery<{ id: string }>(
    (sb) => {
      if (!location?.districtAgs) return sb.from('districts').select('id').eq('id', '00000000-0000-0000-0000-000000000000')
      return sb.from('districts').select('id').eq('ags_code', location.districtAgs).limit(1)
    },
    [location?.districtAgs]
  )

  const districtId = matchingDistricts[0]?.id || null

  const { data: warnungen } = useSupabaseQuery<DbExternalWarning>(
    (sb) => {
      if (!districtId) return sb.from('external_warnings').select('*').eq('district_id', '00000000-0000-0000-0000-000000000000')
      return sb.from('external_warnings').select('*').eq('district_id', districtId).order('fetched_at', { ascending: false })
    },
    [districtId]
  )

  // Empfohlene Guides basierend auf aktiven Warnungen
  const recommendedGuides = useMemo(() => {
    if (warnungen.length === 0) return []

    const guideIds = new Set<string>()
    for (const w of warnungen) {
      const titleLower = (w.title || '').toLowerCase()
      for (const [keyword, ids] of Object.entries(WARNING_GUIDE_MAP)) {
        if (titleLower.includes(keyword)) {
          ids.forEach(id => guideIds.add(id))
        }
      }
    }

    return SURVIVAL_GUIDES.filter(g => guideIds.has(g.id))
  }, [warnungen])

  const filteredGuides = categoryFilter === 'alle'
    ? SURVIVAL_GUIDES
    : SURVIVAL_GUIDES.filter(g => g.category === categoryFilter)

  const toggleSection = (idx: number) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const openGuide = useCallback((guide: SurvivalGuide) => {
    setSelectedGuide(guide)
    setExpandedSections(new Set([0]))
    markGuideAsRead(guide.id)
    setReadCount(getReadCount())
  }, [])

  // ─── Detail View ───────────────────────────────────

  if (selectedGuide) {
    const Icon = ICON_MAP[selectedGuide.icon] || BookOpen
    const catConfig = CATEGORY_CONFIG[selectedGuide.category]

    return (
      <div>
        {/* Back Button */}
        <button
          onClick={() => setSelectedGuide(null)}
          className="mb-4 flex items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Übersicht
        </button>

        {/* Guide Header */}
        <div className="mb-6 rounded-2xl border border-border bg-white p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary-50">
              <Icon className="h-7 w-7 text-primary-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${catConfig.color}`}>
                  {catConfig.name}
                </span>
                <span className="flex items-center gap-1 text-xs text-text-muted">
                  <Clock className="h-3 w-3" />
                  {Math.max(2, Math.ceil(selectedGuide.sections.length * 1.2))} Min.
                </span>
              </div>
              <h1 className="text-xl font-bold text-text-primary">{selectedGuide.title}</h1>
              <p className="mt-1 text-sm text-text-secondary">{selectedGuide.teaser}</p>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-3">
          {selectedGuide.sections.map((section, idx) => {
            const isExpanded = expandedSections.has(idx)
            return (
              <div key={idx} className="overflow-hidden rounded-2xl border border-border bg-white">
                <button
                  onClick={() => toggleSection(idx)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-surface-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-xs font-bold text-primary-600">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-semibold text-text-primary">{section.heading}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-text-muted" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-text-muted" />
                  )}
                </button>
                {isExpanded && (
                  <div className="border-t border-border px-6 py-5">
                    <p className="text-sm leading-relaxed text-text-secondary whitespace-pre-line">
                      {section.content}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ─── Grid View ─────────────────────────────────────

  return (
    <div>
      <PageHeader
        title="Wissenssammlung"
        description="Praktische Anleitungen für den Notfall \u2014 von Wasseraufbereitung bis Erste Hilfe."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQuiz(true)}
              className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
            >
              <Brain className="h-4 w-4" />
              Quiz starten
            </button>
            <span className="flex items-center gap-2 rounded-xl bg-surface-secondary px-4 py-2 text-sm font-medium text-text-secondary">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              {readCount}/{SURVIVAL_GUIDES.length} gelesen
            </span>
          </div>
        }
      />

      {/* Quiz Overlay */}
      {showQuiz && <QuizMode onClose={() => setShowQuiz(false)} />}

      {/* Kontextuelle Empfehlungen basierend auf Warnungen */}
      {recommendedGuides.length > 0 && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <h3 className="text-sm font-bold text-amber-800">
              Aktuell empfohlen — basierend auf aktiven Warnungen
            </h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {recommendedGuides.map(guide => {
              const Icon = ICON_MAP[guide.icon] || BookOpen
              const isRead = isGuideRead(guide.id)
              return (
                <button
                  key={guide.id}
                  onClick={() => openGuide(guide)}
                  className="flex items-center gap-3 rounded-xl border border-amber-200 bg-white p-3 text-left transition-all hover:border-primary-300 hover:shadow-sm"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50">
                    <Icon className="h-5 w-5 text-primary-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-text-primary">{guide.title}</p>
                    <p className="truncate text-xs text-text-secondary">{guide.teaser}</p>
                  </div>
                  {isRead && <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setCategoryFilter('alle')}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            categoryFilter === 'alle'
              ? 'bg-primary-100 text-primary-700'
              : 'bg-surface-secondary text-text-secondary hover:bg-surface-secondary/80'
          }`}
        >
          Alle ({SURVIVAL_GUIDES.length})
        </button>
        {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
          const count = SURVIVAL_GUIDES.filter(g => g.category === key).length
          if (count === 0) return null
          return (
            <button
              key={key}
              onClick={() => setCategoryFilter(key)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                categoryFilter === key
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-surface-secondary text-text-secondary hover:bg-surface-secondary/80'
              }`}
            >
              {cfg.name} ({count})
            </button>
          )
        })}
      </div>

      {/* Guide Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {filteredGuides.map((guide) => {
          const Icon = ICON_MAP[guide.icon] || BookOpen
          const catConfig = CATEGORY_CONFIG[guide.category]
          const isRead = isGuideRead(guide.id)

          return (
            <button
              key={guide.id}
              onClick={() => openGuide(guide)}
              className={`group rounded-2xl border bg-white p-6 text-left transition-all hover:border-primary-200 hover:shadow-md ${
                isRead ? 'border-green-200' : 'border-border'
              }`}
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 transition-colors group-hover:bg-primary-100">
                  <Icon className="h-6 w-6 text-primary-600" />
                </div>
                <div className="flex items-center gap-2">
                  {isRead && (
                    <span className="flex items-center gap-1 rounded-lg bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
                      <CheckCircle2 className="h-3 w-3" />
                      Gelesen
                    </span>
                  )}
                  <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${catConfig.color}`}>
                    {catConfig.name}
                  </span>
                </div>
              </div>

              <h3 className="mb-1 text-sm font-bold text-text-primary group-hover:text-primary-600">
                {guide.title}
              </h3>
              <p className="mb-3 text-xs text-text-secondary line-clamp-2">
                {guide.teaser}
              </p>

              <div className="flex items-center gap-3 text-xs text-text-muted">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {Math.max(2, Math.ceil(guide.sections.length * 1.2))} Min.
                </span>
                <span>\u00B7</span>
                <span>{guide.sections.length} Abschnitte</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
