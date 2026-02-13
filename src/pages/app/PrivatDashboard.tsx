import { AlertTriangle, ClipboardList, FileText, Bell, ArrowRight, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import MapView from '@/components/ui/MapView'

export default function PrivatDashboard() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Dein persönliches Krisenmanagement auf einen Blick."
      />

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Bell className="h-5 w-5" />}
          label="Aktive Warnungen"
          value={0}
          trend={{ value: 'Keine', positive: true }}
        />
        <StatCard
          icon={<MapPin className="h-5 w-5" />}
          label="Dein Standort"
          value="Berlin"
        />
        <StatCard
          icon={<ClipboardList className="h-5 w-5" />}
          label="Checkliste"
          value="72%"
          trend={{ value: '+5%', positive: true }}
        />
        <StatCard
          icon={<FileText className="h-5 w-5" />}
          label="Notfallplan"
          value="Aktiv"
        />
      </div>

      {/* Map */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-border bg-white">
        <MapView
          height="400px"
          center={[13.405, 52.52]}
          zoom={11}
          fallbackTitle="Karte wird geladen..."
          fallbackDescription="Hier siehst du aktuelle Warnungen in deiner Umgebung."
          showControls
        />
      </div>

      {/* Quick actions */}
      <h2 className="mb-4 text-lg font-bold text-text-primary">Schnellzugriff</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          to="/app/warnungen"
          className="group flex items-center gap-4 rounded-2xl border border-border bg-white p-5 transition-shadow hover:shadow-md"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-text-primary">Warnungen</h3>
            <p className="text-sm text-text-secondary">Aktuelle NINA & DWD Meldungen</p>
          </div>
          <ArrowRight className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-1" />
        </Link>

        <Link
          to="/app/checklisten"
          className="group flex items-center gap-4 rounded-2xl border border-border bg-white p-5 transition-shadow hover:shadow-md"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-text-primary">Checklisten</h3>
            <p className="text-sm text-text-secondary">Vorräte & Notfallausrüstung</p>
          </div>
          <ArrowRight className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-1" />
        </Link>

        <Link
          to="/app/notfallplan"
          className="group flex items-center gap-4 rounded-2xl border border-border bg-white p-5 transition-shadow hover:shadow-md"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
            <FileText className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-text-primary">Notfallplan</h3>
            <p className="text-sm text-text-secondary">Dein persönlicher Plan</p>
          </div>
          <ArrowRight className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  )
}
