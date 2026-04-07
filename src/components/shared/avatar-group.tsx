import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface AvatarGroupProps {
  users: { name: string; avatar?: string | null }[]
  max?: number
  size?: 'sm' | 'md'
}

export function AvatarGroup({ users, max = 3, size = 'sm' }: AvatarGroupProps) {
  const displayed = users.slice(0, max)
  const remaining = users.length - max

  const sizeClass = size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-9 w-9 text-xs'

  return (
    <div className="flex -space-x-2 rtl:space-x-reverse">
      {displayed.map((user, i) => (
        <Avatar key={i} className={cn(sizeClass, 'border-2 border-white dark:border-slate-950')}>
          <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
      ))}
      {remaining > 0 && (
        <div className={cn(
          'flex items-center justify-center rounded-full border-2 border-white dark:border-slate-950 bg-gray-100 dark:bg-gray-800 font-medium text-gray-600',
          sizeClass
        )}>
          +{remaining}
        </div>
      )}
    </div>
  )
}
