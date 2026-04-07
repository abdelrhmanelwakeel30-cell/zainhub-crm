import { cn } from '@/lib/utils'

interface ScoreIndicatorProps {
  score: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function ScoreIndicator({ score, max = 100, size = 'md', showLabel = true }: ScoreIndicatorProps) {
  const percentage = Math.min(Math.round((score / max) * 100), 100)

  const getColor = (pct: number) => {
    if (pct >= 80) return 'text-green-600 bg-green-100 dark:bg-green-950'
    if (pct >= 60) return 'text-blue-600 bg-blue-100 dark:bg-blue-950'
    if (pct >= 40) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-950'
    if (pct >= 20) return 'text-orange-600 bg-orange-100 dark:bg-orange-950'
    return 'text-red-600 bg-red-100 dark:bg-red-950'
  }

  const sizeClass = {
    sm: 'h-6 w-6 text-[10px]',
    md: 'h-8 w-8 text-xs',
    lg: 'h-10 w-10 text-sm',
  }

  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        'flex items-center justify-center rounded-full font-bold',
        sizeClass[size],
        getColor(percentage)
      )}>
        {score}
      </div>
      {showLabel && (
        <div className="h-1.5 w-16 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', {
              'bg-green-500': percentage >= 80,
              'bg-blue-500': percentage >= 60 && percentage < 80,
              'bg-yellow-500': percentage >= 40 && percentage < 60,
              'bg-orange-500': percentage >= 20 && percentage < 40,
              'bg-red-500': percentage < 20,
            })}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  )
}
