'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/shared/status-badge'
import { ScoreIndicator } from '@/components/shared/score-indicator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getInitials, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import {
  ArrowLeft, Edit, Phone, Mail, Building2, Briefcase,
  UserCircle, Globe
} from 'lucide-react'

interface ContactDetailProps {
  contactId: string
}

type ContactDetail = {
  id: string
  contactNumber: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  jobTitle?: string
  department?: string
  linkedinUrl?: string
  leadScore?: number
  decisionRole?: string
  lastContactedAt?: string
  createdAt?: string
  companyContacts?: {
    company: { id: string; displayName: string; industry?: string }
    role?: string
  }[]
}

export function ContactDetail({ contactId }: ContactDetailProps) {
  const t = useTranslations('contacts')
  const tc = useTranslations('common')
  const router = useRouter()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['contacts', contactId],
    queryFn: () => fetch('/api/contacts/' + contactId).then(r => r.json()),
  })

  const contact: ContactDetail | undefined = data?.data

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" aria-label="Back to contacts" onClick={() => router.push('/contacts')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-64" />
          <div className="space-y-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !contact) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-lg font-medium">Contact not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/contacts')}>
          <ArrowLeft className="h-4 w-4 me-2" /> Back to Contacts
        </Button>
      </div>
    )
  }

  const primaryCompany = contact.companyContacts?.[0]?.company ?? null

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" aria-label="Back to contacts" onClick={() => router.push('/contacts')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-blue-100 text-blue-700 text-lg">
              {getInitials(`${contact.firstName} ${contact.lastName}`)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{contact.firstName} {contact.lastName}</h1>
              {contact.decisionRole && <StatusBadge status={contact.decisionRole.replace('_', ' ')} />}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {contact.contactNumber} · {contact.jobTitle || '-'} {primaryCompany ? `at ${primaryCompany.displayName}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { if (contact.phone) { window.open(`tel:${contact.phone}`) } else { toast.info('No phone number on file') } }}>
            <Phone className="h-4 w-4 me-2" /> Call
          </Button>
          <Button variant="outline" size="sm" onClick={() => { if (contact.email) { window.open(`mailto:${contact.email}`) } else { toast.info('No email on file') } }}>
            <Mail className="h-4 w-4 me-2" /> Email
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.info('Edit contact form coming soon')}>
            <Edit className="h-4 w-4 me-2" /> Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">{tc('overview')}</TabsTrigger>
              <TabsTrigger value="companies">Companies ({contact.companyContacts?.length ?? 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={contact.email} />
                    <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={contact.phone} />
                    <InfoRow icon={<Briefcase className="h-4 w-4" />} label={t('jobTitle')} value={contact.jobTitle} />
                    <InfoRow icon={<Building2 className="h-4 w-4" />} label={t('department')} value={contact.department} />
                    {contact.decisionRole && (
                      <InfoRow icon={<UserCircle className="h-4 w-4" />} label={t('decisionRole')} value={contact.decisionRole.replace('_', ' ')} />
                    )}
                    <InfoRow icon={<Globe className="h-4 w-4" />} label={t('lastContacted')} value={contact.lastContactedAt ? formatDate(contact.lastContactedAt) : 'Never'} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="companies" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  {contact.companyContacts && contact.companyContacts.length > 0 ? (
                    <div className="space-y-3">
                      {contact.companyContacts.map((cc, i) => (
                        <Link key={i} href={`/companies/${cc.company.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                            <Building2 className="h-5 w-5 text-gray-500" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{cc.company.displayName}</p>
                            <p className="text-xs text-muted-foreground">{cc.company.industry}{cc.role ? ` · ${cc.role}` : ''}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No companies linked</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {contact.leadScore != null && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('leadScore')}</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center py-4">
                <ScoreIndicator score={contact.leadScore} size="lg" />
              </CardContent>
            </Card>
          )}

          {primaryCompany && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Company</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/companies/${primaryCompany.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                    <Building2 className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{primaryCompany.displayName}</p>
                    <p className="text-xs text-muted-foreground">{primaryCompany.industry}</p>
                  </div>
                </Link>
              </CardContent>
            </Card>
          )}

          {contact.decisionRole && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('decisionRole')}</CardTitle>
              </CardHeader>
              <CardContent>
                <StatusBadge status={contact.decisionRole.replace('_', ' ')} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-2">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value || '-'}</p>
      </div>
    </div>
  )
}
