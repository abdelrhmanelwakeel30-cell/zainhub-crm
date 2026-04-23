'use client'

import { useTranslations } from 'next-intl'
import { TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface RevenueChartProps {
  data?: Array<{ month: string; total: number }>
}

const FALLBACK_DATA = [
  { month: '—', revenue: 0 },
]

export function RevenueChart({ data }: RevenueChartProps) {
  const t = useTranslations('dashboard')

  const chartData = data && data.length > 0
    ? data.map(d => ({
        month: d.month,
        revenue: Number(d.total ?? 0),
      }))
    : FALLBACK_DATA

  return (
    <div className="lux-card animate-lux-rise p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[15px] font-semibold tracking-tight">{t('revenueOverview')}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Paid invoices — last 12 months</p>
        </div>
        <span className="inline-flex items-center gap-1 h-6 px-2 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 text-[11px] font-semibold">
          <TrendingUp className="w-3 h-3" strokeWidth={2} /> +18%
        </span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} barGap={4} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="luxRevenueBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#1E3A8A" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(15,23,42,0.06)" />
          <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={11} className="fill-muted-foreground" />
          <YAxis axisLine={false} tickLine={false} fontSize={11} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} className="fill-muted-foreground" />
          <Tooltip
            cursor={{ fill: 'rgba(59,130,246,0.06)' }}
            formatter={(value) => [`AED ${Number(value).toLocaleString()}`, '']}
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.9)',
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)',
              color: '#0B1220',
              fontSize: '12px',
              boxShadow: '0 8px 32px rgba(15,23,42,0.08)',
            }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
          <Bar dataKey="revenue" fill="url(#luxRevenueBar)" radius={[6, 6, 0, 0]} name="Revenue" animationDuration={800} animationEasing="ease-out" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
