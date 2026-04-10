'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { ContactsTable } from './contacts-table'
import { ContactFormDialog } from './contact-form-dialog'
import { Button } from '@/components/ui/button'
import { Plus, Download } from 'lucide-react'

export function ContactsContent() {
  const t = useTranslations('contacts')
  const [showCreateForm, setShowCreateForm] = useState(false)

  const { data } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => fetch('/api/contacts').then(r => r.json()),
  })

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title={t('title')} description={`${data?.total ?? 0} contacts`}>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 me-2" /> Export
        </Button>
        <Button size="sm" onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 me-2" /> {t('newContact')}
        </Button>
      </PageHeader>

      <ContactsTable />
      <ContactFormDialog open={showCreateForm} onOpenChange={setShowCreateForm} />
    </div>
  )
}
