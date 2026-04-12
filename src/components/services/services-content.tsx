'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ServiceFormDialog } from './service-form-dialog'
import { Plus, Package } from 'lucide-react'

const pricingLabel: Record<string, string> = {
  FIXED: 'Fixed Price',
  PROJECT_BASED: 'Project Based',
  MONTHLY: 'Monthly',
  CUSTOM: 'Custom',
}

interface Service {
  id: string
  name: string
  nameAr?: string
  basePrice: number
  currency: string
  pricingType: string
  category?: { id: string; name: string; nameAr?: string }
}

export function ServicesContent() {
  const [showCreate, setShowCreate] = useState(false)
  const { data, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => fetch('/api/services').then(r => r.json()),
    staleTime: 300_000,
  })

  const services: Service[] = data?.data ?? []

  // Group by category
  const byCategory = services.reduce((acc, svc) => {
    const catName = svc.category?.name ?? 'Uncategorized'
    if (!acc[catName]) acc[catName] = []
    acc[catName].push(svc)
    return acc
  }, {} as Record<string, Service[]>)

  const categories = Object.keys(byCategory).sort()

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader
        title="Services"
        description={isLoading ? 'Loading...' : `${services.length} services across ${categories.length} categories`}
      >
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 me-2" /> Add Service
        </Button>
      </PageHeader>

      <ServiceFormDialog open={showCreate} onOpenChange={setShowCreate} />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      ) : (
        categories.map(catName => (
          <div key={catName} className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{catName}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {byCategory[catName].map(svc => (
                <Card key={svc.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium text-sm">{svc.name}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {pricingLabel[svc.pricingType] || svc.pricingType}
                      </Badge>
                    </div>
                    {svc.nameAr && (
                      <p className="text-xs text-muted-foreground" dir="rtl">{svc.nameAr}</p>
                    )}
                    <p className="text-lg font-bold mt-3">{svc.currency} {Number(svc.basePrice).toLocaleString()}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
