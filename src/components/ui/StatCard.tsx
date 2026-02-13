import type { ReactNode } from 'react'
import clsx from 'clsx'

interface StatCardProps {
  icon: ReactNode
  label: string
  value: string | number
  trend?: { value: string; positive: boolean }
  className?: string
}

export default function StatCard({ icon, label, value, trend, className }: StatCardProps) {
  return (
    <div className={clsx('rounded-2xl border border-border bg-white p-5 transition-shadow hover:shadow-md', className)}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
          {icon}
        </div>
        {trend && (
          <span
            className={clsx(
              'rounded-full px-2.5 py-0.5 text-xs font-medium',
              trend.positive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
            )}
          >
            {trend.value}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="mt-0.5 text-sm text-text-secondary">{label}</p>
    </div>
  )
}
