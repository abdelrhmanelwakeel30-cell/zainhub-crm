'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Plus, Users, CalendarClock, Check, X, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

type Employee = {
  id: string
  employeeNumber: string
  firstName: string
  lastName: string
  jobTitle?: string | null
  department?: string | null
  status: string
  employmentType: string
  manager?: { firstName: string; lastName: string } | null
}

type LeaveRequest = {
  id: string
  type: string
  startDate: string
  endDate: string
  days: number | string
  status: string
  employee?: { firstName: string; lastName: string; employeeNumber: string } | null
}

export function HRContent() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<'employees' | 'leave'>('employees')
  const [showCreate, setShowCreate] = useState(false)

  const { data: empData, isLoading } = useQuery({
    queryKey: ['employees', 'list'],
    queryFn: () => fetch('/api/employees?pageSize=100').then((r) => r.json()),
  })
  const employees: Employee[] = empData?.data ?? []

  const { data: leaveData } = useQuery({
    queryKey: ['leave-requests', 'list'],
    queryFn: () => fetch('/api/leave-requests?pageSize=100').then((r) => r.json()),
  })
  const leave: LeaveRequest[] = leaveData?.data ?? []

  const reviewMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' }) =>
      fetch(`/api/leave-requests/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status }),
      }).then((r) => {
        if (!r.ok) throw new Error('review failed')
        return r.json()
      }),
    onSuccess: (_r, v) => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
      toast.success(`Leave ${v.status.toLowerCase()}`)
    },
    onError: () => toast.error('Could not update the leave request'),
  })

  const columns: ColumnDef<Employee, unknown>[] = [
    { accessorKey: 'employeeNumber', header: '#', cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.employeeNumber}</span>, size: 90 },
    {
      accessorKey: 'firstName',
      header: 'Name',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.firstName} {row.original.lastName}</p>
          {row.original.jobTitle && <p className="text-xs text-muted-foreground">{row.original.jobTitle}</p>}
        </div>
      ),
    },
    { accessorKey: 'department', header: 'Department', cell: ({ row }) => <span className="text-sm">{row.original.department ?? '—'}</span> },
    { accessorKey: 'employmentType', header: 'Type', cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.employmentType.replace('_', ' ')}</span> },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: 'manager', header: 'Manager', cell: ({ row }) => <span className="text-sm">{row.original.manager ? `${row.original.manager.firstName} ${row.original.manager.lastName}` : '—'}</span> },
  ]

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title="HR & Workforce" description={`${empData?.total ?? 0} employees`}>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 me-2" /> New employee
        </Button>
      </PageHeader>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'employees' | 'leave')}>
        <TabsList>
          <TabsTrigger value="employees" className="gap-1.5"><Users className="h-4 w-4" /> Employees</TabsTrigger>
          <TabsTrigger value="leave" className="gap-1.5"><CalendarClock className="h-4 w-4" /> Leave</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="mt-4">
          <DataTable columns={columns} data={employees} isLoading={isLoading} searchPlaceholder="Search employees..." />
        </TabsContent>

        <TabsContent value="leave" className="mt-4">
          <div className="rounded-lg border bg-card divide-y">
            {leave.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No leave requests.</p>}
            {leave.map((lr) => (
              <div key={lr.id} className="flex items-center justify-between gap-4 p-3.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {lr.employee ? `${lr.employee.firstName} ${lr.employee.lastName}` : 'Employee'}{' '}
                    <span className="text-xs text-muted-foreground">· {lr.type}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(lr.startDate)} → {formatDate(lr.endDate)} · {String(lr.days)} day(s)
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={lr.status} />
                  {lr.status === 'PENDING' && (
                    <>
                      <Button size="icon" variant="outline" className="h-8 w-8" aria-label="Approve"
                        disabled={reviewMutation.isPending}
                        onClick={() => reviewMutation.mutate({ id: lr.id, status: 'APPROVED' })}>
                        <Check className="h-4 w-4 text-emerald-600" />
                      </Button>
                      <Button size="icon" variant="outline" className="h-8 w-8" aria-label="Reject"
                        disabled={reviewMutation.isPending}
                        onClick={() => reviewMutation.mutate({ id: lr.id, status: 'REJECTED' })}>
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <NewEmployeeDialog open={showCreate} onOpenChange={setShowCreate} />
    </div>
  )
}

function NewEmployeeDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ firstName: '', lastName: '', jobTitle: '', department: '', employmentType: 'FULL_TIME' })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const createMutation = useMutation({
    mutationFn: () =>
      fetch('/api/employees', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      }).then(async (r) => {
        if (!r.ok) throw new Error('create failed')
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Employee added')
      setForm({ firstName: '', lastName: '', jobTitle: '', department: '', employmentType: 'FULL_TIME' })
      onOpenChange(false)
    },
    onError: () => toast.error('Could not add employee'),
  })

  const canSubmit = form.firstName.trim() && form.lastName.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New employee</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="emp-fn">First name</Label>
            <Input id="emp-fn" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="emp-ln">Last name</Label>
            <Input id="emp-ln" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="emp-jt">Job title</Label>
            <Input id="emp-jt" value={form.jobTitle} onChange={(e) => set('jobTitle', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="emp-dept">Department</Label>
            <Input id="emp-dept" value={form.department} onChange={(e) => set('department', e.target.value)} />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label>Employment type</Label>
            <Select value={form.employmentType} onValueChange={(v) => set('employmentType', v ?? 'FULL_TIME')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="FULL_TIME">Full time</SelectItem>
                <SelectItem value="PART_TIME">Part time</SelectItem>
                <SelectItem value="CONTRACT">Contract</SelectItem>
                <SelectItem value="INTERN">Intern</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
          <Button disabled={!canSubmit || createMutation.isPending} onClick={() => createMutation.mutate()}>
            {createMutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
            Add employee
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
