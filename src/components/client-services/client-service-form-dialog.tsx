'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const formSchema = z.object({
  serviceName: z.string().min(1, 'Service name is required'),
  serviceId: z.string().optional(),
  packageId: z.string().optional(),
  companyId: z.string().optional(),
  contactId: z.string().optional(),
  assignedToId: z.string().optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED', 'PENDING_RENEWAL']),
  environment: z.enum(['PRODUCTION', 'STAGING', 'DEVELOPMENT']),
  currency: z.enum(['AED', 'SAR', 'USD', 'EUR', 'GBP', 'EGP', 'KWD', 'QAR', 'BHD', 'OMR']),
  version: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  renewalDate: z.string().optional(),
  supportEndDate: z.string().optional(),
  monthlyValue: z.string().optional(),
  totalContractValue: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClientServiceFormDialog({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient()
  const [selectedCompanyId, setSelectedCompanyId] = useState('')

  const { data: companiesData } = useQuery({
    queryKey: ['companies', 'list'],
    queryFn: () => fetch('/api/companies?pageSize=200').then(r => r.json()),
    staleTime: 300_000,
  })

  const { data: contactsData } = useQuery({
    queryKey: ['contacts', 'by-company', selectedCompanyId],
    queryFn: () =>
      fetch(`/api/contacts?companyId=${selectedCompanyId}&pageSize=200`).then(r => r.json()),
    enabled: !!selectedCompanyId,
    staleTime: 300_000,
  })

  const { data: servicesData } = useQuery({
    queryKey: ['services', 'list'],
    queryFn: () => fetch('/api/services?pageSize=200').then(r => r.json()),
    staleTime: 300_000,
  })

  const { data: usersData } = useQuery({
    queryKey: ['users', 'minimal'],
    queryFn: () => fetch('/api/users?minimal=true').then(r => r.json()),
    staleTime: 300_000,
  })

  const companies: { id: string; displayName: string }[] = companiesData?.data ?? []
  const contacts: { id: string; firstName: string; lastName: string }[] = contactsData?.data ?? []
  const services: { id: string; name: string }[] = servicesData?.data ?? []
  const users: { id: string; firstName: string; lastName: string }[] = usersData?.data ?? []

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: 'ACTIVE',
      environment: 'PRODUCTION',
      currency: 'AED',
    },
  })

  const watchedServiceId = watch('serviceId')

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      fetch('/api/client-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceName: data.serviceName,
          serviceId: data.serviceId || undefined,
          packageId: data.packageId || undefined,
          companyId: data.companyId || undefined,
          contactId: data.contactId || undefined,
          assignedToId: data.assignedToId || undefined,
          status: data.status,
          environment: data.environment,
          currency: data.currency,
          version: data.version || undefined,
          startDate: data.startDate || undefined,
          endDate: data.endDate || undefined,
          renewalDate: data.renewalDate || undefined,
          supportEndDate: data.supportEndDate || undefined,
          monthlyValue: data.monthlyValue ? Number(data.monthlyValue) : undefined,
          totalContractValue: data.totalContractValue ? Number(data.totalContractValue) : undefined,
          notes: data.notes || undefined,
        }),
      }).then(r => {
        if (!r.ok) throw new Error('Failed to create client service')
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-services'] })
      toast.success('Client service created successfully')
      reset()
      setSelectedCompanyId('')
      onOpenChange(false)
    },
    onError: () => {
      toast.error('Failed to create client service')
    },
  })

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setSelectedCompanyId(val)
    setValue('companyId', val)
    setValue('contactId', '')
  }

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setValue('serviceId', val)
    // Auto-fill serviceName from selected service
    const found = services.find(s => s.id === val)
    if (found) {
      setValue('serviceName', found.name)
    }
  }

  const onSubmit = (data: FormData) => mutation.mutate(data)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Client Service</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">

            {/* Service (dropdown + name snapshot) */}
            <div>
              <Label>Service</Label>
              <select
                value={watchedServiceId || ''}
                onChange={handleServiceChange}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select service...</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="serviceName">Service Name (Snapshot) *</Label>
              <Input id="serviceName" {...register('serviceName')} className="mt-1" />
              {errors.serviceName && (
                <p className="text-xs text-red-500 mt-1">{errors.serviceName.message}</p>
              )}
            </div>

            {/* Company */}
            <div>
              <Label>Company</Label>
              <select
                value={selectedCompanyId}
                onChange={handleCompanyChange}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select company...</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.displayName}</option>
                ))}
              </select>
            </div>

            {/* Contact */}
            <div>
              <Label>Contact</Label>
              <select
                {...register('contactId')}
                disabled={!selectedCompanyId}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
              >
                <option value="">Select contact...</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                ))}
              </select>
            </div>

            {/* Assigned To */}
            <div>
              <Label>Assigned To</Label>
              <select
                {...register('assignedToId')}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select user...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <Label>Status</Label>
              <select
                {...register('status')}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="PENDING_RENEWAL">Pending Renewal</option>
              </select>
            </div>

            {/* Environment */}
            <div>
              <Label>Environment</Label>
              <select
                {...register('environment')}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="PRODUCTION">Production</option>
                <option value="STAGING">Staging</option>
                <option value="DEVELOPMENT">Development</option>
              </select>
            </div>

            {/* Version */}
            <div>
              <Label htmlFor="version">Version</Label>
              <Input id="version" {...register('version')} placeholder="e.g. 1.0.0" className="mt-1" />
            </div>

            {/* Currency */}
            <div>
              <Label>Currency</Label>
              <select
                {...register('currency')}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="AED">AED</option>
                <option value="SAR">SAR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="KWD">KWD</option>
                <option value="QAR">QAR</option>
              </select>
            </div>

            {/* Monthly Value */}
            <div>
              <Label htmlFor="monthlyValue">Monthly Value (MRR)</Label>
              <Input
                id="monthlyValue"
                type="number"
                {...register('monthlyValue')}
                placeholder="e.g. 5000"
                className="mt-1"
              />
            </div>

            {/* Total Contract Value */}
            <div>
              <Label htmlFor="totalContractValue">Total Contract Value</Label>
              <Input
                id="totalContractValue"
                type="number"
                {...register('totalContractValue')}
                placeholder="e.g. 60000"
                className="mt-1"
              />
            </div>

            {/* Dates */}
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" {...register('startDate')} className="mt-1" />
            </div>

            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" {...register('endDate')} className="mt-1" />
            </div>

            <div>
              <Label htmlFor="renewalDate">Renewal Date</Label>
              <Input id="renewalDate" type="date" {...register('renewalDate')} className="mt-1" />
            </div>

            <div>
              <Label htmlFor="supportEndDate">Support End Date</Label>
              <Input id="supportEndDate" type="date" {...register('supportEndDate')} className="mt-1" />
            </div>

            {/* Notes */}
            <div className="col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" {...register('notes')} rows={3} className="mt-1" />
            </div>
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              Create Service
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
