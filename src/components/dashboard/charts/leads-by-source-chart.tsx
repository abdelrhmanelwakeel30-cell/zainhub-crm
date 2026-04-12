'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface SourceCount {
  name: string
  count: number
}

interface LeadsBySourceChartProps {
  data?: SourceCount[]
}

const COLORS = ['#3B82F6', '#6366F1', '#10B981', '#22C55E', '#F59E0B', '#EC4899', '#8B5CF6', '#64748B']

export function LeadsBySourceChart({ data }: LeadsBySourceChartProps) {
  const t = useTranslations('dashboard')

  const chartData = data && data.length > 0
    ? data.map((d, i) => ({
        name: d.name ?? 'Unknown',
        value: d.count,
        color: COLORS[i % COLORS.length],
      }))
    : [{ name: 'No data', value: 1, color: '#CBD5E1' }]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{t('leadsBySource')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <ResponsiveContainer width={200} height={200}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, 'Leads']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-2">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
