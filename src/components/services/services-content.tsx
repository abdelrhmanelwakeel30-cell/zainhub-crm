'use client'

import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Package } from 'lucide-react'
import { services, serviceCategories } from '@/lib/demo-data'

const pricingLabel: Record<string, string> = {
  FIXED: 'Fixed Price',
  PROJECT_BASED: 'Project Based',
  MONTHLY: 'Monthly',
  CUSTOM: 'Custom',
}

export function ServicesContent() {
  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title="Services" description={`${services.length} services across ${serviceCategories.length} categories`}>
        <Button size="sm"><Plus className="h-4 w-4 me-2" /> Add Service</Button>
      </PageHeader>

      {serviceCategories.map(cat => {
        const catServices = services.filter(s => s.category === cat.name)
        if (catServices.length === 0) return null
        return (
          <div key={cat.id} className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{cat.name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {catServices.map(svc => (
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
                    <p className="text-xs text-muted-foreground" dir="rtl">{svc.nameAr}</p>
                    <p className="text-lg font-bold mt-3">AED {svc.basePrice.toLocaleString()}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
