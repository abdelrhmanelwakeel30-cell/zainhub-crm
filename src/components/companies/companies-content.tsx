'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { PageHeader } from '@/components/shared/page-header'
import { CompaniesTable } from './companies-table'
import { CompanyFormDialog } from './company-form-dialog'
import { Button } from '@/components/ui/button'
import { Plus, Download } from 'lucide-react'
import { companies } from '@/lib/demo-data'

export function CompaniesContent() {
  const t = useTranslations('companies')
  const tc = useTranslations('common')
  const [showCreateForm, setShowCreateForm] = useState(false)

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title={t('title')} description={`${companies.length} companies`}>
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
