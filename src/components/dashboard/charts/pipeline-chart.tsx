'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const data = [
  { stage: 'Discovery', count: 2, value: 138000, color: '#6366F1' },
  { stage: 'Proposal', count: 2, value: 180000, color: '#8B5CF6' },
  { stage: 'Negotiation', count: 2, value: 60000, color: '#3B82F6' },
  { stage: 'Contract', count: 2, value: 54000, color: '#06B6D4' },
  { stage: 'Closed Won', count: 1, value: 12000, color: '#22C55E' },
  { stage: 'Closed Lost', count: 1, value: 36000, color: '#EF4444' },
]

export function PipelineChart() {
  const t = useTranslations('dashboard')

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{t('pipelineOverview')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical" barSize={24}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
            <XAxis type="number" axisLine={false} tickLine={false} fontSize={12} tickFormatter={(v) => `${v/1000}K`} className="fill-muted-foreground" />
            <YAxis type="category" dataKey="stage" axisLine={false} tickLine={false} fontSize={12} width={100} className="fill-muted-foreground" />
            <Tooltip
              formatter={(value) => [`AED ${Number(value).toLocaleString()}`, 'Value']}
              contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))', fontSize: '12px' }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
