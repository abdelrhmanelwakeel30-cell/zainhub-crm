'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const data = [
  { name: 'Website', value: 4, color: '#3B82F6' },
  { name: 'LinkedIn', value: 3, color: '#6366F1' },
  { name: 'Referral', value: 2, color: '#10B981' },
  { name: 'WhatsApp', value: 2, color: '#22C55E' },
  { name: 'Google Ads', value: 1, color: '#F59E0B' },
  { name: 'Instagram', value: 1, color: '#EC4899' },
  { name: 'Events', value: 1, color: '#8B5CF6' },
  { name: 'Direct', value: 1, color: '#64748B' },
]

export function LeadsBySourceChart() {
  const t = useTranslations('dashboard')

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
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, 'Leads']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-2">
            {data.map((item) => (
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
