'use client'

import { useTranslations } from 'next-intl'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, ShieldCheck, UserCog, Pencil } from 'lucide-react'

const staticRoles = [
  {
    id: '1',
    name: 'Admin',
    description: 'Full system access. Can manage users, roles, settings, and all CRM data.',
    permissions: 24,
    icon: ShieldCheck,
    color: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
  },
  {
    id: '2',
    name: 'Sales Manager',
    description: 'Manage sales team, pipelines, reports, and approve quotations and proposals.',
    permissions: 18,
    icon: Shield,
    color: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  },
  {
    id: '3',
    name: 'Sales Rep',
    description: 'Create and manage leads, contacts, opportunities, and track personal sales activities.',
    permissions: 12,
    icon: UserCog,
    color: 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400',
  },
  {
    id: '4',
    name: 'Content Manager',
    description: 'Manage campaigns, social accounts, content calendar, and marketing materials.',
    permissions: 10,
    icon: Pencil,
    color: 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
  },
]

export function RolesContent() {
  const t = useTranslations('admin')

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title={t('roles')} description={`${staticRoles.length} roles configured`} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {staticRoles.map((role) => {
          const Icon = role.icon
          return (
            <Card key={role.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${role.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>{role.name}</CardTitle>
                    </div>
                  </div>
                  <Badge variant="secondary">{role.permissions} permissions</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{role.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
