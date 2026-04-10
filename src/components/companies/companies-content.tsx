'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { CompaniesTable } from './companies-table'
import { CompanyFormDialog } from './company-form-dialog'
import { Button } from '@/components/ui/button'
import { Plus, Download } from 'lucide-react'

export function CompaniesContent() {
  const t = useTranslations('companies')
  const [showCreateForm, setShowCreateForm] = useState(false)

  const { data } = useQuery({
    queryKey: ['companies'],
    queryFn: () => fetch('/api/companies').then(r => r.json()),
  })

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title={t('title')} description={`${data?.total ?? 0} companies`}>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 me-2" /> Export
        </Button>
        <Button size="sm" onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 me-2" /> {t('newCompany')}
        </Button>
      </PageHeader>

      <CompaniesTable />

      <CompanyFormDialog open={showCreateForm} onOpenChange={setShowCreateForm} />
    </div>
  )
}
