import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2, Shield, CheckCircle2, Loader2,
  ArrowRight, ArrowLeft, Sparkles, Scale, AlertTriangle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { NIS2_SECTORS, LEGAL_FORMS, calculateNis2Status, type Nis2Result } from '@/data/nis2-categories'

type Step = 1 | 2 | 3

export default function EnterpriseOnboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [legalForm, setLegalForm] = useState('')
  const [sectorId, setSectorId] = useState('')
  const [employeeCount, setEmployeeCount] = useState('')
  const [annualRevenue, setAnnualRevenue] = useState('')

  // NIS2 result
  const [nis2Result, setNis2Result] = useState<Nis2Result | null>(null)
  const [, setOrgId] = useState<string | null>(null)

  const handleStep1Submit = () => {
    if (!name.trim()) return
    // Calculate NIS2 status
    const empCount = employeeCount ? parseInt(employeeCount, 10) : null
    const revenue = annualRevenue ? parseFloat(annualRevenue) * 1_000_000 : null // Input in Mio EUR
    const result = calculateNis2Status(sectorId || null, empCount, revenue)
    setNis2Result(result)
    setStep(2)
  }

  const handleStep2Confirm = async () => {
    if (!nis2Result) return
    setSaving(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Nicht eingeloggt')

      const empCount = employeeCount ? parseInt(employeeCount, 10) : null
      const revenue = annualRevenue ? parseFloat(annualRevenue) * 1_000_000 : null

      const sector = NIS2_SECTORS.find(s => s.id === sectorId)

      const { data, error: insertError } = await supabase
        .from('organizations')
        .insert({
          user_id: user.id,
          name: name.trim(),
          legal_form: legalForm || null,
          industry_sector: sector?.label || null,
          employee_count: empCount,
          annual_revenue_eur: revenue,
          nis2_relevant: nis2Result.nis2Relevant,
          nis2_category: nis2Result.nis2Category,
          kritis_relevant: nis2Result.kritisRelevant,
          kritis_sector: nis2Result.kritisSector,
          onboarding_completed: true,
        })
        .select('id')
        .single()

      if (insertError) throw insertError
      setOrgId(data.id)
      setStep(3)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Fehler beim Speichern'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left: Gradient panel */}
      <div className="hidden flex-col justify-between bg-gradient-to-br from-[#111d35] via-[#1e3154] to-[#243a5e] p-10 lg:flex lg:w-[480px]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10">
            <AlertTriangle className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white">Alarmplaner</span>
          <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
            Enterprise
          </span>
        </div>

        <div>
          <h2 className="mb-3 text-2xl font-bold text-white">
            {step === 1 && 'Ihr Unternehmen. Professionell abgesichert.'}
            {step === 2 && 'NIS2 & KRITIS Einordnung'}
            {step === 3 && 'Alles eingerichtet!'}
          </h2>
          <p className="text-text-on-dark-secondary">
            {step === 1 && 'Geben Sie Ihre Unternehmensdaten ein. Wir kategorisieren automatisch Ihre NIS2- und KRITIS-Relevanz.'}
            {step === 2 && 'Basierend auf Branche und Groesse wird Ihre regulatorische Einordnung berechnet.'}
            {step === 3 && 'Das Enterprise-Dashboard ist eingerichtet. Compliance-Frameworks, BIA und Lieferketten-Analyse stehen bereit.'}
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-3">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  s < step
                    ? 'bg-green-500 text-white'
                    : s === step
                      ? 'bg-white text-[#111d35]'
                      : 'border border-white/20 text-white/40'
                }`}
              >
                {s < step ? <CheckCircle2 className="h-4 w-4" /> : s}
              </div>
              {s < 3 && (
                <div className={`h-0.5 w-8 rounded ${s < step ? 'bg-green-500' : 'bg-white/20'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right: Content */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">

          {/* Step 1: Unternehmensdaten */}
          {step === 1 && (
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600">
                <Sparkles className="h-3 w-3" />
                Schritt 1 von 3
              </div>
              <h1 className="mb-2 text-2xl font-bold text-text-primary">Unternehmensdaten</h1>
              <p className="mb-8 text-text-secondary">
                Diese Angaben werden fuer die automatische NIS2/KRITIS-Kategorisierung verwendet.
              </p>

              {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {/* Firmenname */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-primary">
                    Firmenname <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="z.B. Muster GmbH"
                    className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                  />
                </div>

                {/* Rechtsform */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-primary">Rechtsform</label>
                  <select
                    value={legalForm}
                    onChange={(e) => setLegalForm(e.target.value)}
                    className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-text-primary transition-colors focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                  >
                    <option value="">Bitte waehlen...</option>
                    {LEGAL_FORMS.map(lf => (
                      <option key={lf.value} value={lf.value}>{lf.label}</option>
                    ))}
                  </select>
                </div>

                {/* Branche */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-primary">Branche / Sektor</label>
                  <select
                    value={sectorId}
                    onChange={(e) => setSectorId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-text-primary transition-colors focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                  >
                    <option value="">Bitte waehlen...</option>
                    <optgroup label="Hohe Kritikalitaet (NIS2 Anhang I)">
                      {NIS2_SECTORS.filter(s => s.category === 'wesentlich').map(s => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Sonstige kritische Sektoren (NIS2 Anhang II)">
                      {NIS2_SECTORS.filter(s => s.category === 'wichtig').map(s => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Mitarbeiterzahl + Umsatz in row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-text-primary">Mitarbeiterzahl</label>
                    <input
                      type="number"
                      value={employeeCount}
                      onChange={(e) => setEmployeeCount(e.target.value)}
                      placeholder="z.B. 120"
                      min="0"
                      className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-text-primary">Jahresumsatz (Mio. EUR)</label>
                    <input
                      type="number"
                      value={annualRevenue}
                      onChange={(e) => setAnnualRevenue(e.target.value)}
                      placeholder="z.B. 25"
                      min="0"
                      step="0.1"
                      className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleStep1Submit}
                disabled={!name.trim()}
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Weiter zur Kategorisierung
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Step 2: NIS2/KRITIS-Kategorisierung */}
          {step === 2 && nis2Result && (
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600">
                <Scale className="h-3 w-3" />
                Schritt 2 von 3
              </div>
              <h1 className="mb-2 text-2xl font-bold text-text-primary">Regulatorische Einordnung</h1>
              <p className="mb-8 text-text-secondary">
                Basierend auf Ihren Angaben wurde die NIS2- und KRITIS-Relevanz ermittelt.
              </p>

              {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* NIS2 Result Card */}
              <div className={`mb-4 rounded-2xl border p-6 ${
                nis2Result.nis2Category === 'wesentlich'
                  ? 'border-red-200 bg-red-50/50'
                  : nis2Result.nis2Category === 'wichtig'
                    ? 'border-amber-200 bg-amber-50/50'
                    : 'border-green-200 bg-green-50/50'
              }`}>
                <div className="mb-3 flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                    nis2Result.nis2Category === 'wesentlich'
                      ? 'bg-red-100 text-red-600'
                      : nis2Result.nis2Category === 'wichtig'
                        ? 'bg-amber-100 text-amber-600'
                        : 'bg-green-100 text-green-600'
                  }`}>
                    <Shield className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-text-primary">
                      {nis2Result.nis2Category === 'wesentlich' && 'NIS2: Wesentliche Einrichtung'}
                      {nis2Result.nis2Category === 'wichtig' && 'NIS2: Wichtige Einrichtung'}
                      {!nis2Result.nis2Category && 'NIS2: Voraussichtlich nicht betroffen'}
                    </p>
                    {nis2Result.nis2Relevant && (
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                        nis2Result.nis2Category === 'wesentlich'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        Regulierungspflichtig
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {nis2Result.explanation}
                </p>
              </div>

              {/* KRITIS Badge */}
              {nis2Result.kritisRelevant && (
                <div className="mb-4 rounded-2xl border border-purple-200 bg-purple-50/50 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-text-primary">KRITIS-relevant</p>
                      <p className="text-sm text-text-secondary">
                        Sektor: {nis2Result.kritisSector}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="mb-6 rounded-2xl border border-border bg-white p-5">
                <p className="mb-3 text-sm font-semibold text-text-primary">Zusammenfassung</p>
                <div className="space-y-2 text-sm text-text-secondary">
                  <div className="flex justify-between">
                    <span>Unternehmen</span>
                    <span className="font-medium text-text-primary">{name}</span>
                  </div>
                  {legalForm && (
                    <div className="flex justify-between">
                      <span>Rechtsform</span>
                      <span className="font-medium text-text-primary">
                        {LEGAL_FORMS.find(lf => lf.value === legalForm)?.label || legalForm}
                      </span>
                    </div>
                  )}
                  {sectorId && (
                    <div className="flex justify-between">
                      <span>Branche</span>
                      <span className="font-medium text-text-primary">
                        {NIS2_SECTORS.find(s => s.id === sectorId)?.label || sectorId}
                      </span>
                    </div>
                  )}
                  {employeeCount && (
                    <div className="flex justify-between">
                      <span>Mitarbeiter</span>
                      <span className="font-medium text-text-primary">{parseInt(employeeCount).toLocaleString('de-DE')}</span>
                    </div>
                  )}
                  {annualRevenue && (
                    <div className="flex justify-between">
                      <span>Jahresumsatz</span>
                      <span className="font-medium text-text-primary">{parseFloat(annualRevenue).toLocaleString('de-DE')} Mio. EUR</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setStep(1); setError(null) }}
                  className="flex items-center gap-2 rounded-2xl border border-border px-5 py-4 text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-secondary"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Zurueck
                </button>
                <button
                  onClick={handleStep2Confirm}
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary-600 px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5" />
                  )}
                  Unternehmen anlegen
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Fertig */}
          {step === 3 && (
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-green-50">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-text-primary">Einrichtung abgeschlossen!</h1>
              <p className="mb-8 text-text-secondary">
                {name} ist erfolgreich angelegt. Ihr Enterprise-Dashboard steht bereit.
              </p>

              {/* Quick summary cards */}
              <div className="mb-8 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border bg-white p-4 text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                    <Shield className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-bold text-text-primary">
                    {nis2Result?.nis2Category === 'wesentlich' ? 'Wesentlich' : nis2Result?.nis2Category === 'wichtig' ? 'Wichtig' : 'Nicht betroffen'}
                  </p>
                  <p className="text-xs text-text-muted">NIS2-Status</p>
                </div>
                <div className="rounded-2xl border border-border bg-white p-4 text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-bold text-text-primary">
                    {nis2Result?.kritisRelevant ? 'Ja' : 'Nein'}
                  </p>
                  <p className="text-xs text-text-muted">KRITIS-relevant</p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => navigate('/unternehmen')}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-primary-700"
                >
                  Zum Dashboard
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
