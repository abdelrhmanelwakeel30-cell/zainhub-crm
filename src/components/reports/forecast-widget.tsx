'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { TrendingUp } from 'lucide-react'

interface ForecastMonth {
  month: string
  expectedRevenue: number
  subscriptionRevenue: number
  pipelineRevenue: number
}

function formatMonth(month: string): string {
  const [year, mon] = month.split('-')
  const d = new Date(parseInt(year), parseInt(mon) - 1)
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

export function ForecastWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['forecast'],
    queryFn: () => fetch('/api/reports/forecast').then(r => r.json()),
  })

  const months: ForecastMonth[] = data?.data?.months ?? []

  const totalExpected = months.reduce((sum, m) => sum + m.expectedRevenue, 0)

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    )
  }

  const chartData = months.map(m => ({
    name: formatMonth(m.month),
    Subscriptions: m.subscriptionRevenue,
    Pipeline: m.pipelineRevenue,
  }))

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <TrendingUp className="h-4 w-4" />
            </div>
            <CardTitle className="text-base">3-Month Revenue Forecast</CardTitle>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total Expected</p>
            <p className="text-lg font-bold">AED {totalExpected.toLocaleString()}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {months.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No forecast data available. Add active subscriptions or opportunities with close dates.
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  formatter={(value) => `AED ${Number(value).toLocaleString()}`}
                  contentStyle={{
                    background: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="Subscriptions" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Pipeline" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {months.map(m => (
                <div key={m.month} className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">{formatMonth(m.month)}</p>
                  <p className="text-base font-bold">AED {(m.expectedRevenue / 1000).toFixed(0)}K</p>
                  <div className="mt-1 space-y-0.5">
                    <p className="text-xs text-indigo-600">↑ {(m.subscriptionRevenue / 1000).toFixed(0)}K sub</p>
                    <p className="text-xs text-amber-600">↑ {(m.pipelineRevenue / 1000).toFixed(0)}K pipe</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
