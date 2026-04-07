'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { companies, contacts, opportunities, projects, invoices } from '@/lib/demo-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StatusBadge } from '@/components/shared/status-badge'
import { ScoreIndicator } from '@/components/shared/score-indicator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getInitials, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import {
  ArrowLeft, Edit, Building2, Globe, Phone, Mail, MapPin,
  Users, Handshake, Briefcase, ExternalLink, Receipt, FolderOpen
} from 'lucide-react'

interface CompanyDetailProps {
  companyId: string
}

export function CompanyDetail({ companyId }: CompanyDetailProps) {
  const t = useTranslations('companies')
  const tc = useTranslations('common')
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')

  const company = companies.find(c => c.id === companyId)

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-lg font-medium">Company not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/companies')}>
          <ArrowLeft className="h-4 w-4 me-2" /> Back to Companies
        </Button>
      </div>
    )
  }

  const companyContacts = contacts.filter(c => c.company?.id === companyId)
  const companyOpportunities = opportunities.filter(o => o.company?.id === companyId)
  const companyProjects = projects.filter(p => p.client?.id === companyId)
  const companyInvoices = invoices.filter(i => i.client?.id === companyId)

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/companies')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
            <Building2 className="h-6 w-6 text-gray-500" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{company.displayName}</h1>
              <StatusBadge status={company.lifecycleStage} />
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {company.companyNumber} · {company.industry} · {company.city}, {company.country}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => toast.info('Edit company form coming soon')}>
          <Edit className="h-4 w-4 me-2" /> Edit
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Tabs */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">{tc('overview')}</TabsTrigger>
              <TabsTrigger value="contacts">{t('associatedContacts')} ({companyContacts.length})</TabsTrigger>
              <TabsTrigger value="deals">{t('associatedDeals')} ({companyOpportunities.length})</TabsTrigger>
              <TabsTrigger value="projects">Projects ({companyProjects.length})</TabsTrigger>
              <TabsTrigger value="invoices">Invoices ({companyInvoices.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <InfoRow icon={<Building2 className="h-4 w-4" />} label={t('legalName')} value={company.legalName} />
                    <InfoRow icon={<Globe className="h-4 w-4" />} label={t('website')} value={company.website} isLink />
                    <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={company.email} />
                    <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={company.phone} />
                    <InfoRow icon={<MapPin className="h-4 w-4" />} label={t('address')} value={`${company.city}, ${company.country}`} />
                    <InfoRow icon={<Users className="h-4 w-4" />} label={t('employeeCount')} value={company.employeeCount?.toLocaleString()} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contacts" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  {companyContacts.length > 0 ? (
                    <div className="space-y-3">
                      {companyContacts.map(contact => (
                        <Link key={contact.id} href={`/contacts/${contact.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                              {getInitials(`${contact.firstName} ${contact.lastName}`)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{contact.firstName} {contact.lastName}</p>
                            <p className="text-xs text-muted-foreground">{contact.jobTitle}</p>
                          </div>
                          <StatusBadge status={contact.decisionRole} />
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No contacts linked</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="deals" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  {companyOpportunities.length > 0 ? (
                    <div className="space-y-3">
                      {companyOpportunities.map(opp => (
                        <Link key={opp.id} href={`/opportunities/${opp.id}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                          <div>
                            <p className="text-sm font-medium">{opp.title}</p>
                            <p className="text-xs text-muted-foreground">{opp.opportunityNumber} · {opp.service}</p>
                          </div>
                          <div className="text-end">
                            <p className="text-sm font-semibold">AED {opp.value.toLocaleString()}</p>
                            <StatusBadge status={opp.stage} />
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No deals linked</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="projects" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  {companyProjects.length > 0 ? (
                    <div className="space-y-3">
                      {companyProjects.map(proj => (
                        <Link key={proj.id} href={`/projects/${proj.id}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                          <div className="flex items-center gap-3">
                            <FolderOpen className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{proj.name}</p>
                              <p className="text-xs text-muted-foreground">{proj.projectNumber}{proj.startDate ? ` · ${formatDate(proj.startDate)}` : ''}</p>
                            </div>
                          </div>
                          <div className="text-end">
                            <StatusBadge status={proj.status.replace(/_/g, ' ')} />
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No projects linked</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="invoices" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  {companyInvoices.length > 0 ? (
                    <div className="space-y-3">
                      {companyInvoices.map(inv => (
                        <Link key={inv.id} href={`/invoices/${inv.id}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                          <div className="flex items-center gap-3">
                            <Receipt className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{inv.invoiceNumber}</p>
                              <p className="text-xs text-muted-foreground">Due {formatDate(inv.dueDate)}</p>
                            </div>
                          </div>
                          <div className="text-end">
                            <p className="text-sm font-semibold">AED {inv.totalAmount.toLocaleString()}</p>
                            <StatusBadge status={inv.status} />
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No invoices linked</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('healthScore')}</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center py-4">
              <ScoreIndicator score={company.healthScore} size="lg" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('accountOwner')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-blue-100 text-blue-700">
                    {getInitials(company.accountOwner.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{company.accountOwner.name}</p>
                  <p className="text-xs text-muted-foreground">Account Owner</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('annualRevenue')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {company.annualRevenue
                  ? `AED ${(company.annualRevenue / 1000000).toFixed(1)}M`
                  : 'Not specified'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value, isLink }: { icon: React.ReactNode; label: string; value?: string | null; isLink?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        {isLink && value ? (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1">
            {value} <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <p className="text-sm font-medium">{value || '-'}</p>
        )}
      </div>
    </div>
  )
}
