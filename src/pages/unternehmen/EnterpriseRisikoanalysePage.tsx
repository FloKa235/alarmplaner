import { useState, Fragment } from 'react'
import {
  Loader2,
  Wifi, Server, FileWarning,
  Link2, AlertTriangle,
} from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import { useOrganization } from '@/hooks/useOrganization'

const RISK_CATEGORIES = [
  {
    id: 'cyber',
    label: 'Cyber-Risiken',
    icon: Wifi,
    color: 'text-red-600',
    bg: 'bg-red-50',
    items: [
      { title: 'Ransomware-Angriff', description: 'Verschluesselung kritischer Systeme und Daten durch Schadsoftware' },
      { title: 'Datenleck / Data Breach', description: 'Unbefugter Zugriff auf sensible Unternehmens- oder Kundendaten' },
      { title: 'DDoS-Attacke', description: 'Ueberlastung der IT-Infrastruktur durch verteilte Angriffe' },
      { title: 'Phishing / Social Engineering', description: 'Manipulation von Mitarbeitern zur Preisgabe von Zugangsdaten' },
    ],
  },
  {
    id: 'operativ',
    label: 'Operative Risiken',
    icon: Server,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    items: [
      { title: 'IT-Systemausfall', description: 'Ausfall zentraler IT-Systeme (ERP, CRM, E-Mail)' },
      { title: 'Personalausfall', description: 'Grossflaechiger Ausfall von Schluesselkraeften (Pandemie, Streik)' },
      { title: 'Produktionsstoerung', description: 'Unterbrechung von Kerngeschaeftsprozessen' },
      { title: 'Rechenzentrum-Ausfall', description: 'Physischer Ausfall des primaeren Rechenzentrums' },
    ],
  },
  {
    id: 'compliance',
    label: 'Compliance-Risiken',
    icon: FileWarning,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    items: [
      { title: 'DSGVO-Verstoss', description: 'Verletzung der Datenschutz-Grundverordnung mit Bussgeldrisiko' },
      { title: 'Audit-Versagen', description: 'Nichtbestehen regulatorischer Pruefungen (NIS2, ISO 27001)' },
      { title: 'Regulierungsaenderung', description: 'Neue gesetzliche Anforderungen mit kurzfristiger Umsetzungsfrist' },
    ],
  },
  {
    id: 'extern',
    label: 'Externe Risiken',
    icon: Link2,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    items: [
      { title: 'Lieferkettenausfall', description: 'Ausfall eines kritischen Zulieferers oder Dienstleisters' },
      { title: 'Marktrisiko', description: 'Ploetzliche Marktveraenderungen oder Kundenverluste' },
      { title: 'Reputationsschaden', description: 'Oeffentliche Krise mit negativer Medienberichterstattung' },
    ],
  },
]

const LIKELIHOOD_CONFIG = {
  niedrig: { label: 'Niedrig', color: 'text-green-700', bg: 'bg-green-50', score: 1 },
  mittel: { label: 'Mittel', color: 'text-amber-700', bg: 'bg-amber-50', score: 2 },
  hoch: { label: 'Hoch', color: 'text-orange-700', bg: 'bg-orange-50', score: 3 },
  sehr_hoch: { label: 'Sehr hoch', color: 'text-red-700', bg: 'bg-red-50', score: 4 },
}

const IMPACT_CONFIG = {
  gering: { label: 'Gering', color: 'text-green-700', bg: 'bg-green-50', score: 1 },
  mittel: { label: 'Mittel', color: 'text-amber-700', bg: 'bg-amber-50', score: 2 },
  erheblich: { label: 'Erheblich', color: 'text-orange-700', bg: 'bg-orange-50', score: 3 },
  katastrophal: { label: 'Katastrophal', color: 'text-red-700', bg: 'bg-red-50', score: 4 },
}

function getRiskLevel(likelihood: keyof typeof LIKELIHOOD_CONFIG, impact: keyof typeof IMPACT_CONFIG) {
  const score = LIKELIHOOD_CONFIG[likelihood].score * IMPACT_CONFIG[impact].score
  if (score >= 9) return { label: 'Kritisch', variant: 'danger' as const }
  if (score >= 6) return { label: 'Hoch', variant: 'warning' as const }
  if (score >= 3) return { label: 'Mittel', variant: 'info' as const }
  return { label: 'Niedrig', variant: 'success' as const }
}

export default function EnterpriseRisikoanalysePage() {
  const { loading } = useOrganization()
  const [expandedCategory, setExpandedCategory] = useState<string | null>('cyber')

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  const totalRisks = RISK_CATEGORIES.reduce((sum, cat) => sum + cat.items.length, 0)

  return (
    <div>
      <PageHeader
        title="Business-Risikoanalyse"
        description={`${totalRisks} identifizierte Risiken in 4 Kategorien`}
      />

      {/* Info Banner */}
      <div className="mb-6 rounded-2xl border border-primary-200 bg-primary-50/50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />
          <div>
            <p className="text-sm font-semibold text-text-primary">Business-Risikobewertung</p>
            <p className="text-sm text-text-secondary">
              Bewerten Sie die Eintrittswahrscheinlichkeit und Auswirkung jedes Risikos auf Ihr Unternehmen.
              Die Risikomatrix berechnet automatisch die Gesamtrisikostufe.
            </p>
          </div>
        </div>
      </div>

      {/* Risk Categories */}
      <div className="space-y-4">
        {RISK_CATEGORIES.map((category) => {
          const Icon = category.icon
          const isExpanded = expandedCategory === category.id
          return (
            <div key={category.id} className="rounded-2xl border border-border bg-white overflow-hidden">
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-surface-secondary"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${category.bg} ${category.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">{category.label}</p>
                    <p className="text-xs text-text-muted">{category.items.length} Risiken</p>
                  </div>
                </div>
                <svg
                  className={`h-5 w-5 text-text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isExpanded && (
                <div className="border-t border-border">
                  {category.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between border-b border-border/50 px-5 py-4 last:border-0"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-text-primary">{item.title}</p>
                        <p className="mt-0.5 text-xs text-text-secondary">{item.description}</p>
                      </div>
                      <div className="ml-4 flex items-center gap-2">
                        <Badge variant="default">Ausstehend</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Risk Matrix Preview */}
      <div className="mt-8 rounded-2xl border border-border bg-white p-6">
        <h3 className="mb-4 text-lg font-bold text-text-primary">Risikomatrix</h3>
        <div className="grid grid-cols-5 gap-1 text-center text-xs">
          {/* Header row */}
          <div className="p-2" />
          <div className="rounded-lg bg-surface-secondary p-2 font-semibold text-text-muted">Gering</div>
          <div className="rounded-lg bg-surface-secondary p-2 font-semibold text-text-muted">Mittel</div>
          <div className="rounded-lg bg-surface-secondary p-2 font-semibold text-text-muted">Erheblich</div>
          <div className="rounded-lg bg-surface-secondary p-2 font-semibold text-text-muted">Katastrophal</div>

          {/* Rows */}
          {(['sehr_hoch', 'hoch', 'mittel', 'niedrig'] as const).map((likelihood) => (
            <Fragment key={likelihood}>
              <div className="flex items-center justify-end rounded-lg bg-surface-secondary p-2 font-semibold text-text-muted">
                {LIKELIHOOD_CONFIG[likelihood].label}
              </div>
              {(['gering', 'mittel', 'erheblich', 'katastrophal'] as const).map((impact) => {
                const level = getRiskLevel(likelihood, impact)
                const bgColor = level.variant === 'danger' ? 'bg-red-100' : level.variant === 'warning' ? 'bg-amber-100' : level.variant === 'info' ? 'bg-blue-100' : 'bg-green-100'
                return (
                  <div key={`${likelihood}-${impact}`} className={`rounded-lg p-2 ${bgColor}`}>
                    {level.label}
                  </div>
                )
              })}
            </Fragment>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-text-muted">
          Eintrittswahrscheinlichkeit (Zeilen) x Auswirkung (Spalten)
        </p>
      </div>
    </div>
  )
}
