'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const data = [
  { month: 'Sep', revenue: 85000, expenses: 42000 },
  { month: 'Oct', revenue: 110000, expenses: 48000 },
  { month: 'Nov', revenue: 95000, expenses: 45000 },
  { month: 'Dec', revenue: 130000, expenses: 52000 },
  { month: 'Jan', revenue: 125000, expenses: 55000 },
  { month: 'Feb', revenue: 140000, expenses: 50000 },
  { month: 'Mar', revenue: 157000, expenses: 58000 },
]

export function RevenueChart() {
  const t = useTranslations('dashboard')

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{t('revenueOverview')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} className="fill-muted-foreground" />
            <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(v) => `${v/1000}K`} className="fill-muted-foreground" />
            <Tooltip
              formatter={(value) => [`AED ${Number(value).toLocaleString()}`, '']}
              contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))', fontSize: '12px' }}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Revenue" />
            <Bar dataKey="expenses" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Expenses" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
