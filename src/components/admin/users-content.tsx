'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { PageHeader } from '@/components/shared/page-header'
import { KPICard } from '@/components/shared/kpi-card'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import { Users, UserCheck, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ApiUser {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
  jobTitle?: string
  department?: string
  phone?: string
  status: string
  lastLoginAt?: string
  userRoles?: Array<{ role: { name: string } }>
}

const ROLE_OPTIONS = [
  { label: 'Admin', value: 'Admin' },
  { label: 'Sales Rep', value: 'Sales Rep' },
  { label: 'Project Manager', value: 'Project Manager' },
  { label: 'Finance Manager', value: 'Finance Manager' },
  { label: 'Support Agent', value: 'Support Agent' },
]

interface AddUserForm {
  firstName: string
  lastName: string
  email: string
  password: string
}

function AddUserDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<AddUserForm>({ firstName: '', lastName: '', email: '', password: '' })

  const mutation = useMutation({
    mutationFn: (data: AddUserForm) =>
      fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, roleIds: [] }),
      }).then(r => {
        if (!r.ok) throw new Error('Failed to create user')
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success('User created successfully')
      setForm({ firstName: '', lastName: '', email: '', password: '' })
      onOpenChange(false)
    },
    onError: () => {
      toast.error('Failed to create user')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.firstName || !form.lastName || !form.email || !form.password) return
    mutation.mutate(form)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
              minLength={8}
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" disabled>
              <option value="">No role (assign later)</option>
              {ROLE_OPTIONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">Roles can be assigned after creation</p>
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function UsersContent() {
  const t = useTranslations('admin')
  const [showAddDialog, setShowAddDialog] = useState(false)

  const { data } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => fetch('/api/admin/users').then(r => r.json()),
  })

  const users: ApiUser[] = data?.data ?? []
  const totalUsers = data?.total ?? 0
  const activeUsers = users.filter(u => u.status === 'active' || u.status === 'ACTIVE').length

  const columns: ColumnDef<ApiUser, unknown>[] = [
    {
      accessorKey: 'firstName',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
              {getInitials(`${row.original.firstName} ${row.original.lastName}`)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{row.original.firstName} {row.original.lastName}</p>
            <p className="text-xs text-muted-foreground">{row.original.department}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => <span className="text-sm">{row.original.email}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'jobTitle',
      header: 'Job Title',
      cell: ({ row }) => <span className="text-sm">{row.original.jobTitle ?? '—'}</span>,
    },
    {
      accessorKey: 'userRoles',
      header: 'Role',
      cell: ({ row }) => {
        const roles = row.original.userRoles ?? []
        if (roles.length === 0) return <span className="text-xs text-muted-foreground">—</span>
        return (
          <span className="text-xs">
            {roles.map(r => r.role.name).join(', ')}
          </span>
        )
      },
    },
    {
      accessorKey: 'lastLoginAt',
      header: 'Last Login',
      cell: ({ row }) => {
        const raw = row.original.lastLoginAt
        if (!raw) return <span className="text-xs text-muted-foreground">Never</span>
        const date = new Date(raw)
        return (
          <span className="text-xs text-muted-foreground">
            {date.toLocaleDateString('en-AE', { month: 'short', day: 'numeric', year: 'numeric' })}{' '}
            {date.toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )
      },
    },
  ]

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title={t('users')} description={`${totalUsers} users`}>
        <Button size="sm" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 me-2" /> Add User
        </Button>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KPICard
          title={t('totalUsers')}
          value={totalUsers}
          icon={<Users className="h-5 w-5" />}
        />
        <KPICard
          title={t('activeUsers')}
          value={activeUsers}
          icon={<UserCheck className="h-5 w-5" />}
        />
      </div>

      {/* Users Table */}
      <DataTable
        columns={columns}
        data={users}
        searchPlaceholder="Search users..."
      />

      <AddUserDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </div>
  )
}
