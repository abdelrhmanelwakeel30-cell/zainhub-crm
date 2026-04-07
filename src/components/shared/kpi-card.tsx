import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
  prefix?: string
  suffix?: string
  className?: string
}

export function KPICard({ title, value, change, changeLabel, icon, prefix, suffix, className }: KPICardProps) {
  const isPositive = change && change > 0
  const isNegative = change && change < 0

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">
              {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
            </p>
          </div>
          {icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              {icon}
            </div>
          )}
        </div>
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-3">
            {isPositive && <TrendingUp className="h-3.5 w-3.5 text-green-600" />}
            {isNegative && <TrendingDown className="h-3.5 w-3.5 text-red-600" />}
            {!isPositive && !isNegative && <Minus className="h-3.5 w-3.5 text-gray-400" />}
            <span className={cn(
              'text-xs font-medium',
              isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-400'
            )}>
              {isPositive && '+'}{change}%
            </span>
            {changeLabel && (
              <span className="text-xs text-muted-foreground">{changeLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
