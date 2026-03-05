import { useState, useMemo } from 'react'
import {
  ClipboardList, Plus, CheckCircle2, Circle, MinusCircle,
  Clock, Flame, Loader2, ChevronDown, ChevronRight,
} from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import Modal, { FormField, inputClass, selectClass, textareaClass, ModalFooter, ConfirmDialog } from '@/components/ui/Modal'
import { useMembership } from '@/hooks/useMembership'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { supabase } from '@/lib/supabase'
import type { DbChecklist, ChecklistItem, DbScenario } from '@/types/database'

type Category = DbChecklist['category']

const categoryConfig: Record<Category, { label: string; bg: string; color: string }> = {
  krisenstab: { label: 'Krisenstab', bg: 'bg-red-50', color: 'text-red-600' },
  sofortmassnahmen: { label: 'Sofortmaßnahmen', bg: 'bg-amber-50', color: 'text-amber-600' },
  kommunikation: { label: 'Kommunikation', bg: 'bg-blue-50', color: 'text-blue-600' },
  nachbereitung: { label: 'Nachbereitung', bg: 'bg-green-50', color: 'text-green-600' },
  custom: { label: 'Benutzerdefiniert', bg: 'bg-gray-50', color: 'text-gray-600' },
  vorbereitung: { label: 'Vorbereitung', bg: 'bg-violet-50', color: 'text-violet-600' },
  kritis_compliance: { label: 'KRITIS Compliance', bg: 'bg-indigo-50', color: 'text-indigo-600' },
}

export default function GemeindeChecklistenPage() {
  const { municipalityId, districtId, municipality } = useMembership()

  const { data: checklists, loading, refetch } = useSupabaseQuery<DbChecklist>(
    (sb) =>
      sb
        .from('checklists')
        .select('*')
        .eq('district_id', districtId!)
        .eq('municipality_id', municipalityId!)
        .order('created_at', { ascending: false }),
    [districtId, municipalityId]
  )

  const { data: scenarios } = useSupabaseQuery<DbScenario>(
    (sb) =>
      sb
        .from('scenarios')
        .select('id, title, type')
        .eq('district_id', districtId!)
        .order('title'),
    [districtId]
  )

  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving] = useState(false)
  const emptyForm = { title: '', description: '', category: 'custom' as Category, scenario_id: '', items_text: '' }
  const [form, setForm] = useState(emptyForm)

  const [deleteTarget, setDeleteTarget] = useState<DbChecklist | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const stats = useMemo(() => {
    let total = 0
    let done = 0
    for (const cl of checklists) {
      for (const item of cl.items as ChecklistItem[]) {
        total++
        if (item.status === 'done') done++
      }
    }
    return { total, done, percent: total > 0 ? Math.round((done / total) * 100) : 0 }
  }, [checklists])

  const handleCreate = async () => {
    if (!form.title.trim() || !districtId || !municipalityId) return
    setSaving(true)
    try {
      const lines = form.items_text.split('\n').map((l) => l.trim()).filter(Boolean)
      const items: ChecklistItem[] = lines.map((text) => ({
        id: crypto.randomUUID(),
        text,
        status: 'open',
        completed_at: null,
        completed_by: null,
      }))

      const { error } = await supabase.from('checklists').insert({
        district_id: districtId,
        municipality_id: municipalityId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        category: form.category,
        scenario_id: form.scenario_id || null,
        items,
        is_template: false,
      })
      if (error) throw error
      refetch()
      setShowCreate(false)
      setForm(emptyForm)
    } catch (err) {
      console.error('Checkliste erstellen fehlgeschlagen:', err)
      alert('Fehler beim Erstellen.')
    } finally {
      setSaving(false)
    }
  }

  const toggleItem = async (checklist: DbChecklist, itemId: string) => {
    const updatedItems = (checklist.items as ChecklistItem[]).map((item) => {
      if (item.id !== itemId) return item
      if (item.status === 'open') {
        return { ...item, status: 'done' as const, completed_at: new Date().toISOString(), completed_by: null }
      } else if (item.status === 'done') {
        return { ...item, status: 'skipped' as const, completed_at: null, completed_by: null }
      } else {
        return { ...item, status: 'open' as const, completed_at: null, completed_by: null }
      }
    })

    try {
      const { error } = await supabase
        .from('checklists')
        .update({ items: updatedItems, updated_at: new Date().toISOString() })
        .eq('id', checklist.id)
      if (error) throw error
      refetch()
    } catch (err) {
      console.error('Item-Status aktualisieren fehlgeschlagen:', err)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('checklists').delete().eq('id', deleteTarget.id)
      if (error) throw error
      refetch()
      setDeleteTarget(null)
    } catch (err) {
      console.error('Checkliste löschen fehlgeschlagen:', err)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>
  }

  return (
    <div>
      <PageHeader
        title={`Checklisten – ${municipality?.name || 'Gemeinde'}`}
        description="Notfallpläne und Checklisten Ihrer Gemeinde verwalten."
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            Neue Checkliste
          </button>
        }
      />

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-white p-6">
          <p className="text-sm text-text-secondary">Checklisten</p>
          <p className="text-3xl font-extrabold text-text-primary">{checklists.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-6">
          <p className="text-sm text-text-secondary">Aufgaben erledigt</p>
          <p className="text-3xl font-extrabold text-text-primary">{stats.done} / {stats.total}</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-secondary">
            <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${stats.percent}%` }} />
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-white p-6">
          <p className="text-sm text-text-secondary">Fortschritt</p>
          <p className="text-3xl font-extrabold text-text-primary">{stats.percent}%</p>
        </div>
      </div>

      {/* Checklists */}
      {checklists.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-12 text-center">
          <ClipboardList className="mx-auto mb-3 h-8 w-8 text-text-muted" />
          <p className="text-sm text-text-secondary">Noch keine Checklisten vorhanden. Erstellen Sie Ihre erste Checkliste.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {checklists.map((cl) => {
            const cat = categoryConfig[cl.category]
            const items = cl.items as ChecklistItem[]
            const doneCount = items.filter((i) => i.status === 'done').length
            const percent = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0
            const isExpanded = expanded.has(cl.id)
            const scenario = scenarios.find((s) => s.id === cl.scenario_id)

            return (
              <div key={cl.id} className="rounded-2xl border border-border bg-white transition-shadow hover:shadow-sm">
                <button
                  onClick={() => toggleExpanded(cl.id)}
                  className="flex w-full items-center gap-4 p-6 text-left"
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cat.bg} ${cat.color}`}>
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-text-primary">{cl.title}</h3>
                      <Badge>{cat.label}</Badge>
                      {scenario && (
                        <Badge variant="info">
                          <Flame className="mr-1 inline h-3 w-3" />
                          {scenario.title}
                        </Badge>
                      )}
                    </div>
                    {cl.description && (
                      <p className="text-sm text-text-secondary">{cl.description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-2 w-32 overflow-hidden rounded-full bg-surface-secondary">
                        <div
                          className={`h-full rounded-full transition-all ${percent === 100 ? 'bg-green-500' : percent > 0 ? 'bg-primary-500' : 'bg-gray-300'}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-text-muted">
                        {doneCount}/{items.length} erledigt
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(cl) }}
                      className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-red-50 hover:text-red-500"
                      title="Löschen"
                    >
                      <MinusCircle className="h-4 w-4" />
                    </button>
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-text-muted" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-text-muted" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border px-6 py-4">
                    <div className="space-y-2">
                      {items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => toggleItem(cl, item.id)}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                            item.status === 'done'
                              ? 'bg-green-50'
                              : item.status === 'skipped'
                              ? 'bg-gray-50'
                              : 'hover:bg-surface-secondary'
                          }`}
                        >
                          {item.status === 'done' ? (
                            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                          ) : item.status === 'skipped' ? (
                            <MinusCircle className="h-5 w-5 shrink-0 text-gray-400" />
                          ) : (
                            <Circle className="h-5 w-5 shrink-0 text-text-muted" />
                          )}
                          <span
                            className={`flex-1 text-sm ${
                              item.status === 'done'
                                ? 'text-green-700 line-through'
                                : item.status === 'skipped'
                                ? 'text-gray-400 line-through'
                                : 'text-text-primary'
                            }`}
                          >
                            {item.text}
                          </span>
                          {item.completed_at && (
                            <span className="flex items-center gap-1 text-xs text-text-muted">
                              <Clock className="h-3 w-3" />
                              {new Date(item.completed_at).toLocaleString('de-DE', {
                                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                              })}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-text-muted">
                      Klick: Offen → Erledigt → Übersprungen → Offen
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Neue Checkliste">
        <FormField label="Titel" required>
          <input
            className={inputClass}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="z.B. Hochwasser-Erstmaßnahmen"
          />
        </FormField>

        <FormField label="Beschreibung">
          <input
            className={inputClass}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Kurzbeschreibung der Checkliste"
          />
        </FormField>

        <div className="mb-4 grid grid-cols-2 gap-4">
          <FormField label="Kategorie">
            <select
              className={selectClass}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
            >
              {Object.entries(categoryConfig).map(([key, conf]) => (
                <option key={key} value={key}>{conf.label}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Szenario (optional)">
            <select
              className={selectClass}
              value={form.scenario_id}
              onChange={(e) => setForm({ ...form, scenario_id: e.target.value })}
            >
              <option value="">Keinem Szenario zugeordnet</option>
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField label="Aufgaben (eine pro Zeile)" required>
          <textarea
            className={textareaClass}
            rows={8}
            value={form.items_text}
            onChange={(e) => setForm({ ...form, items_text: e.target.value })}
            placeholder={"Aufgabe 1\nAufgabe 2\nAufgabe 3"}
          />
        </FormField>

        <ModalFooter
          onCancel={() => setShowCreate(false)}
          onSubmit={handleCreate}
          submitLabel="Checkliste erstellen"
          loading={saving}
          disabled={!form.title.trim() || !form.items_text.trim()}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Checkliste löschen"
        message={`Möchten Sie "${deleteTarget?.title}" wirklich löschen? Alle Aufgaben und der Fortschritt gehen verloren.`}
        loading={deleting}
      />
    </div>
  )
}
