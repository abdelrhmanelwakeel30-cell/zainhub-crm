'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Shield, ShieldCheck, UserCog, Pencil, Plus, Trash2, Lock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Role {
  id: string
  name: string
  nameAr?: string | null
  description?: string | null
  isSystem: boolean
  _count: { userRoles: number; rolePermissions: number }
  rolePermissions?: Array<{ permission: { id: string; module: string; action: string } }>
}

interface Permission {
  id: string
  module: string
  action: string
  description?: string | null
}

interface PermissionsPayload {
  success: boolean
  data: { flat: Permission[]; byModule: Record<string, Permission[]> }
}

const iconForRole = (name: string) => {
  const lower = name.toLowerCase()
  if (lower.includes('admin')) return ShieldCheck
  if (lower.includes('manager')) return Shield
  if (lower.includes('sales') || lower.includes('rep')) return UserCog
  return Pencil
}

const colorForRole = (name: string) => {
  const lower = name.toLowerCase()
  if (lower.includes('super')) return 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400'
  if (lower.includes('admin')) return 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400'
  if (lower.includes('manager')) return 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
  if (lower.includes('sales')) return 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400'
  if (lower.includes('content') || lower.includes('marketing')) return 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400'
  return 'bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-400'
}

export function RolesContent() {
  const t = useTranslations('admin')
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)

  const { data: rolesResponse, isLoading } = useQuery<{ success: boolean; data: Role[] }>({
    queryKey: ['admin', 'roles', 'with-permissions'],
    queryFn: () => fetch('/api/admin/roles?withPermissions=true').then(r => r.json()),
  })
  const roles = rolesResponse?.data ?? []

  const { data: permissionsResponse } = useQuery<PermissionsPayload>({
    queryKey: ['admin', 'permissions'],
    queryFn: () => fetch('/api/admin/permissions').then(r => r.json()),
    staleTime: 600_000,
  })
  const permissionsByModule = permissionsResponse?.data?.byModule ?? {}

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/admin/roles/${id}`, { method: 'DELETE' }).then(async r => {
      if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Failed to delete role') }
      return r.json()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] })
      toast.success('Role deleted')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title={t('roles')} description={`${roles.length} roles configured`}>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 me-2" /> New Role
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {roles.map((role) => {
            const Icon = iconForRole(role.name)
            return (
              <Card key={role.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorForRole(role.name)}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {role.name}
                          {role.isSystem && <Lock className="h-3 w-3 text-muted-foreground" />}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">{role._count.userRoles} users</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{role._count.rolePermissions} permissions</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground min-h-[40px]">
                    {role.description || 'No description provided'}
                  </p>
                  <div className="flex items-center gap-2 mt-4">
                    <Button variant="outline" size="sm" onClick={() => setEditingRole(role)}>
                      <Pencil className="h-3 w-3 me-1" /> Edit
                    </Button>
                    {!role.isSystem && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Delete role "${role.name}"?`)) deleteMutation.mutate(role.id)
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3 me-1 text-red-500" /> Delete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <RoleFormDialog
        open={showCreate || !!editingRole}
        onOpenChange={(o) => { if (!o) { setShowCreate(false); setEditingRole(null) } }}
        role={editingRole}
        permissionsByModule={permissionsByModule}
      />
    </div>
  )
}

interface RoleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role | null
  permissionsByModule: Record<string, Permission[]>
}

function RoleFormDialog({ open, onOpenChange, role, permissionsByModule }: RoleFormDialogProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(role?.name ?? '')
  const [description, setDescription] = useState(role?.description ?? '')
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set(role?.rolePermissions?.map(rp => rp.permission.id) ?? []),
  )

  // Reset state when the dialog switches to a different role
  if (open && role?.id && name === '' && role.name) {
    setName(role.name)
    setDescription(role.description ?? '')
    setSelectedPermissions(new Set(role.rolePermissions?.map(rp => rp.permission.id) ?? []))
  }

  const togglePermission = (id: string) => {
    setSelectedPermissions(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleModule = (permissions: Permission[], allSelected: boolean) => {
    setSelectedPermissions(prev => {
      const next = new Set(prev)
      permissions.forEach(p => {
        if (allSelected) next.delete(p.id)
        else next.add(p.id)
      })
      return next
    })
  }

  const mutation = useMutation({
    mutationFn: () => {
      const body = {
        name,
        description,
        permissionIds: Array.from(selectedPermissions),
      }
      return fetch(role ? `/api/admin/roles/${role.id}` : '/api/admin/roles', {
        method: role ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(async (r) => {
        if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Failed') }
        return r.json()
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] })
      toast.success(role ? 'Role updated' : 'Role created')
      setName('')
      setDescription('')
      setSelectedPermissions(new Set())
      onOpenChange(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const modules = Object.keys(permissionsByModule).sort()

  return (
    <Dialog open={open} onOpenChange={(o) => {
      onOpenChange(o)
      if (!o) {
        setName('')
        setDescription('')
        setSelectedPermissions(new Set())
      }
    }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{role ? `Edit Role: ${role.name}` : 'New Role'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="role-name">Role Name *</Label>
            <Input
              id="role-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={role?.isSystem}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="role-description">Description</Label>
            <Textarea
              id="role-description"
              value={description ?? ''}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1"
            />
          </div>

          <div className="pt-2 border-t">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base">Permissions</Label>
              <Badge variant="secondary">{selectedPermissions.size} selected</Badge>
            </div>

            {modules.length === 0 ? (
              <p className="text-sm text-muted-foreground">Loading permissions...</p>
            ) : (
              <div className="space-y-4 max-h-80 overflow-y-auto pe-2">
                {modules.map((module) => {
                  const perms = permissionsByModule[module]
                  const allSelected = perms.every(p => selectedPermissions.has(p.id))
                  return (
                    <div key={module} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold capitalize">{module.replace(/_/g, ' ')}</h4>
                        <Button type="button" variant="ghost" size="sm" onClick={() => toggleModule(perms, allSelected)}>
                          {allSelected ? 'Deselect all' : 'Select all'}
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {perms.map((p) => (
                          <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
                            <Checkbox
                              checked={selectedPermissions.has(p.id)}
                              onCheckedChange={() => togglePermission(p.id)}
                            />
                            <span className="capitalize">{p.action.replace(/_/g, ' ')}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
          <Button
            onClick={() => {
              if (!name.trim()) { toast.error('Role name is required'); return }
              mutation.mutate()
            }}
            disabled={mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
            {role ? 'Update Role' : 'Create Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
