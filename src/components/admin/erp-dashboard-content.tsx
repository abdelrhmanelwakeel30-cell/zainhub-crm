'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip as RTooltip } from 'recharts'
import { PageHeader } from '@/components/shared/page-header'
import { Users, Wallet, ArrowDownLeft, ArrowUpRight, Boxes, Target, Handshake, BookOpen } from 'lucide-react'

interface ErpData {
  headcount: number
  payrollTotal: number
  accountsReceivable: number
  accountsPayable: number
  inventoryValue: number
  budget: { total: number; spent: number; utilizationPct: number }
  counts: { leads: number; openOpportunities: number; journalEntries: number; vendors: number }
}

function Counter({ value, prefix = '' }: { value: number; prefix?: string }) {
  const mv = useMotionValue(0)
  const out = useTransform(mv, (v) => prefix + Math.round(v).toLocaleString())
  useEffect(() => {
    const c = animate(mv, value, { duration: 0.9, ease: 'easeOut' })
    return () => c.stop()
  }, [value, mv])
  return <motion.span>{out}</motion.span>
}

function Kpi({ icon: Icon, label, value, prefix, tone, delay }: { icon: React.ElementType; label: string; value: number; prefix?: string; tone: string; delay: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay }} className="lux-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-muted-foreground">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}><Icon className="h-4 w-4" strokeWidth={1.9} /></span>
      </div>
      <p className="mt-3 font-serif-lux text-[34px] font-medium leading-none tracking-tight text-foreground"><Counter value={value} prefix={prefix} /></p>
    </motion.div>
  )
}

export function ErpDashboardContent() {
  const { data } = useQuery<{ data: ErpData }>({
    queryKey: ['erp-dashboard'],
    queryFn: () => fetch('/api/erp-dashboard').then((r) => r.json()),
    refetchInterval: 60_000,
  })
  const d = data?.data

  const financeChart = [
    { name: 'AR', value: d?.accountsReceivable ?? 0, fill: '#16a34a' },
    { name: 'AP', value: d?.accountsPayable ?? 0, fill: '#dc2626' },
    { name: 'Inventory', value: d?.inventoryValue ?? 0, fill: '#1E3A8A' },
    { name: 'Payroll', value: d?.payrollTotal ?? 0, fill: '#7c3aed' },
  ]

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title="ERP Dashboard" description="Cross-module CRM + ERP overview" />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi icon={Users} label="Headcount" value={d?.headcount ?? 0} tone="bg-blue-50 text-blue-600 dark:bg-blue-500/10" delay={0} />
        <Kpi icon={ArrowDownLeft} label="Receivable" prefix="AED " value={d?.accountsReceivable ?? 0} tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10" delay={0.05} />
        <Kpi icon={ArrowUpRight} label="Payable" prefix="AED " value={d?.accountsPayable ?? 0} tone="bg-red-50 text-red-600 dark:bg-red-500/10" delay={0.1} />
        <Kpi icon={Boxes} label="Inventory value" prefix="AED " value={d?.inventoryValue ?? 0} tone="bg-amber-50 text-amber-600 dark:bg-amber-500/10" delay={0.15} />
        <Kpi icon={Wallet} label="Payroll (processed)" prefix="AED " value={d?.payrollTotal ?? 0} tone="bg-violet-50 text-violet-600 dark:bg-violet-500/10" delay={0.2} />
        <Kpi icon={Target} label="Active leads" value={d?.counts.leads ?? 0} tone="bg-blue-50 text-blue-600 dark:bg-blue-500/10" delay={0.25} />
        <Kpi icon={Handshake} label="Open opportunities" value={d?.counts.openOpportunities ?? 0} tone="bg-sky-50 text-sky-600 dark:bg-sky-500/10" delay={0.3} />
        <Kpi icon={BookOpen} label="Journal entries" value={d?.counts.journalEntries ?? 0} tone="bg-slate-100 text-slate-600 dark:bg-slate-500/10" delay={0.35} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div className="lux-card p-5 lg:col-span-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <h3 className="mb-4 text-sm font-semibold">Financial position (AED)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financeChart}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} width={70} />
                <RTooltip formatter={(v) => `AED ${Number(v).toLocaleString()}`} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {financeChart.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div className="lux-card p-5 flex flex-col justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
          <h3 className="mb-2 text-sm font-semibold">Budget utilization</h3>
          <p className="font-serif-lux text-[48px] font-medium leading-none text-foreground"><Counter value={d?.budget.utilizationPct ?? 0} />%</p>
          <p className="mt-1 text-xs text-muted-foreground">AED {(d?.budget.spent ?? 0).toLocaleString()} of {(d?.budget.total ?? 0).toLocaleString()}</p>
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <motion.div className="h-full rounded-full" style={{ background: (d?.budget.utilizationPct ?? 0) > 100 ? '#dc2626' : 'linear-gradient(90deg,#1E3A8A,#3B82F6)' }} initial={{ width: 0 }} animate={{ width: `${Math.min(100, d?.budget.utilizationPct ?? 0)}%` }} transition={{ duration: 0.7 }} />
          </div>
        </motion.div>
      </div>
    </div>
  )
}
