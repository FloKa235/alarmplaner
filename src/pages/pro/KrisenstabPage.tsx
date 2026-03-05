import { Loader2 } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import KrisenstabTab from './vorbereitung/KrisenstabTab'
import { useDistrict } from '@/hooks/useDistrict'

export default function KrisenstabPage() {
  const { districtId, loading: districtLoading } = useDistrict()

  if (districtLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Krisenstab"
        description="Besetzung des Krisenstabs nach S1–S6 Schema mit Hauptverantwortlichen und Stellvertretern"
      />

      {districtId ? (
        <KrisenstabTab districtId={districtId} />
      ) : (
        <div className="rounded-2xl border border-border bg-white p-12 text-center">
          <p className="text-sm text-text-secondary">
            Kein Landkreis gefunden. Bitte melden Sie sich an.
          </p>
        </div>
      )}
    </div>
  )
}
