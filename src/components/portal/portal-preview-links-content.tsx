'use client'

import { useQuery } from '@tanstack/react-query'
import { usePortalAuth } from './portal-auth-provider'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Eye, ExternalLink, Calendar, Clock } from 'lucide-react'
import { format } from 'date-fns'

interface PreviewLink {
  id: string
  title: string
  url: string
  type: string
  status: string
  expiresAt: string | null
  accessCount: number
  notes: string | null
  sharedByUser: { firstName: string; lastName: string } | null
  project: { name: string } | null
  clientService: { serviceName: string } | null
}

const typeColors: Record<string, string> = {
  STAGING: 'bg-yellow-100 text-yellow-700',
  PRODUCTION: 'bg-green-100 text-green-700',
  DEVELOPMENT: 'bg-blue-100 text-blue-700',
  DESIGN: 'bg-purple-100 text-purple-700',
  DEMO: 'bg-orange-100 text-orange-700',
}

export function PortalPreviewLinksContent() {
  const { token } = usePortalAuth()

  const { data, isLoading } = useQuery<{ success: boolean; data: PreviewLink[] }>({
    queryKey: ['portal-preview-links'],
    queryFn: () =>
      fetch('/api/client-portal/preview-links', {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    enabled: !!token,
  })

  const links = data?.data ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Eye className="h-6 w-6 text-blue-600" />
          Preview Links
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isLoading ? 'Loading...' : `${links.length} link${links.length !== 1 ? 's' : ''} shared with you`}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !links.length ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 gap-3 text-center">
            <Eye className="h-12 w-12 text-slate-300" />
            <p className="text-slate-500">No preview links have been shared with you yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {links.map((link) => (
            <Card key={link.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-medium text-sm truncate">{link.title}</h3>
                    {(link.project || link.clientService) && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {link.project?.name ?? link.clientService?.serviceName}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs shrink-0 ${typeColors[link.type] ?? ''}`}
                  >
                    {link.type}
                  </Badge>
                </div>

                {link.notes && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{link.notes}</p>
                )}

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {link.sharedByUser && (
                    <span>Shared by {link.sharedByUser.firstName} {link.sharedByUser.lastName}</span>
                  )}
                  {link.expiresAt && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Expires {format(new Date(link.expiresAt), 'MMM d, yyyy')}
                    </span>
                  )}
                  {link.accessCount > 0 && (
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {link.accessCount} views
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-xs"
                    onClick={() => window.open(link.url, '_blank')}
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    Open Preview
                  </Button>
                  {link.expiresAt && new Date(link.expiresAt) < new Date() && (
                    <Badge variant="outline" className="text-xs bg-red-50 text-red-600">Expired</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
