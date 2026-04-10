'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface RevenueChartProps {
  data?: Array<{ month: string; total: number }>
}

const FALLBACK_DATA = [
  { month: '—', revenue: 0, expenses: 0 },
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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{t('revenueOverview')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} className="fill-muted-foreground" />
            <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} className="fill-muted-foreground" />
            <Tooltip
              formatter={(value) => [`AED ${Number(value).toLocaleString()}`, '']}
              contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))', fontSize: '12px' }}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Revenue" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
