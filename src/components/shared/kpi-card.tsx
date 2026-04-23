import { cn } from '@/lib/utils'
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
  /** When true, render the value with Playfair serif (hero/wide styling). */
  serif?: boolean
  /** Optional pulsing green "live" indicator next to the title. */
  live?: boolean
  /** Optional inline mini bar-chart sparkline below the value. */
  spark?: number[]
  /** When true, place the change chip top-right (benchmark layout). Default true. */
  changeTopRight?: boolean
}

export function KPICard({
  title, value, change, changeLabel, icon, prefix, suffix, className,
  serif = false, live = false, spark, changeTopRight = true,
}: KPICardProps) {
  const isPositive = change !== undefined && change > 0
  const isNegative = change !== undefined && change < 0
  const showChip = changeTopRight && change !== undefined

  return (
    <div className={cn('lux-card animate-lux-rise p-5 flex flex-col', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0">
          <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground">
            {title}
            {live && <span aria-hidden className="lux-live-dot" />}
          </p>
          <p
            className={cn(
              'leading-tight truncate tabular-nums',
              serif ? 'font-serif-lux text-[38px] font-medium text-foreground' : 'text-2xl font-semibold text-foreground'
            )}
          >
            {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {showChip && (
            <span className={cn(
              'inline-flex items-center gap-1 h-6 px-2 rounded-md text-[11px] font-semibold',
              isPositive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                : isNegative ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400'
            )}>
              {isPositive && <TrendingUp className="w-3 h-3" strokeWidth={2} />}
              {isNegative && <TrendingDown className="w-3 h-3" strokeWidth={2} />}
              {!isPositive && !isNegative && <Minus className="w-3 h-3" strokeWidth={2} />}
              {isPositive && '+'}{change}{Math.abs(change as number) > 10 ? '%' : ''}
            </span>
          )}
          {icon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/70 dark:bg-white/5 border border-white/80 dark:border-white/10 text-[var(--tenant-primary)] shadow-sm">
              {icon}
            </div>
          )}
        </div>
      </div>

      {/* Inline bar sparkline */}
      {spark && spark.length > 1 && (
        <div className="mt-4 flex items-end gap-[4px] h-10">
          {spark.map((h, i) => {
            const max = Math.max(...spark)
            const pct = max > 0 ? Math.max(8, (h / max) * 100) : 8
            return (
              <div key={i} className="flex-1 h-full flex items-end">
                <div
                  className="w-full rounded-t-[3px] lux-bar-gradient animate-lux-bar"
                  style={{ height: `${pct}%`, minHeight: 3, animationDelay: `${i * 40}ms` }}
                />
              </div>
            )
          })}
        </div>
      )}

      {changeLabel && !showChip && (
        <p className="text-xs text-muted-foreground mt-2">{changeLabel}</p>
      )}
    </div>
  )
}
