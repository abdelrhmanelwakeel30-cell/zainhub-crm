'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface PipelineStage {
  id: string
  name: string
  count: number
  color?: string
}

interface PipelineChartProps {
  data?: PipelineStage[]
}

const COLORS = ['#6366F1', '#8B5CF6', '#3B82F6', '#06B6D4', '#22C55E', '#EF4444', '#F59E0B', '#EC4899']

export function PipelineChart({ data }: PipelineChartProps) {
  const t = useTranslations('dashboard')

  const chartData = data && data.length > 0
    ? data.map((s) => ({ stage: s.name, count: s.count, color: s.color || COLORS[0] }))
    : [{ stage: 'No data', count: 0, color: '#CBD5E1' }]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{t('pipelineOverview')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical" barSize={24}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
            <XAxis type="number" axisLine={false} tickLine={false} fontSize={12} className="fill-muted-foreground" />
            <YAxis type="category" dataKey="stage" axisLine={false} tickLine={false} fontSize={12} width={110} className="fill-muted-foreground" />
            <Tooltip
              formatter={(value) => [value, 'Deals']}
              contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))', fontSize: '12px' }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color || COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
