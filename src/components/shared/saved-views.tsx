'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Bookmark, Plus, Trash2, Star } from 'lucide-react'

export interface SavedView {
  id: string
  name: string
  module: string
  filters: Record<string, unknown>
  isDefault: boolean
  isShared: boolean
}

interface SavedViewsProps {
  /** Module key, e.g. "leads". */
  module: string
  /** Current filter state to persist when saving a new view. */
  current: Record<string, unknown>
  /** Called with a view's stored filters when the user applies it. */
  onApply: (filters: Record<string, unknown>) => void
}

/**
 * Reusable saved-views control (C-4). Lists the user's saved views (plus shared
 * ones) for a module, applies them, saves the current filter state as a new
 * view, and deletes owned views. Drop into any list page toolbar.
 */
export function SavedViews({ module, current, onApply }: SavedViewsProps) {
  const queryClient = useQueryClient()
  const key = ['saved-views', module]

  const { data } = useQuery({
    queryKey: key,
    queryFn: () => fetch(`/api/saved-views?module=${encodeURIComponent(module)}`).then((r) => r.json()),
  })
  const views: SavedView[] = data?.data ?? []

  const createMutation = useMutation({
    mutationFn: (name: string) =>
      fetch('/api/saved-views', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, module, filters: current }),
      }).then((r) => {
        if (!r.ok) throw new Error('save failed')
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key })
      toast.success('View saved')
    },
    onError: () => toast.error('Could not save the view'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/saved-views/${id}`, { method: 'DELETE' }).then((r) => {
        if (!r.ok) throw new Error('delete failed')
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key })
      toast.success('View deleted')
    },
    onError: () => toast.error('Could not delete the view'),
  })

  function handleSave() {
    const name = window.prompt('Name this view')?.trim()
    if (name) createMutation.mutate(name)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center h-9 px-3 rounded-md border bg-background text-sm font-medium hover:bg-accent transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Bookmark className="h-4 w-4 me-2" />
        Views{views.length > 0 ? ` (${views.length})` : ''}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>Saved views</DropdownMenuLabel>
        {views.length === 0 && (
          <div className="px-2 py-1.5 text-xs text-muted-foreground">No saved views yet</div>
        )}
        {views.map((v) => (
          <DropdownMenuItem
            key={v.id}
            onSelect={(e) => {
              e.preventDefault()
              onApply(v.filters ?? {})
            }}
            className="flex items-center justify-between gap-2"
          >
            <span className="flex items-center gap-1.5 truncate">
              {v.isDefault && <Star className="h-3 w-3 fill-current text-amber-500" />}
              <span className="truncate">{v.name}</span>
              {v.isShared && <span className="text-[10px] text-muted-foreground">shared</span>}
            </span>
            <button
              type="button"
              aria-label={`Delete ${v.name}`}
              onClick={(e) => {
                e.stopPropagation()
                deleteMutation.mutate(v.id)
              }}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleSave() }}>
          <Plus className="h-4 w-4 me-2" /> Save current view
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
