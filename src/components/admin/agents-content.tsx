'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { PageHeader } from '@/components/shared/page-header'
import { formatRelativeDate } from '@/lib/utils'
import { Bot, Users, Activity, Building2, Zap, PauseCircle, CircleSlash } from 'lucide-react'

interface Agent {
  id: string
  agentId: string | null
  name: string
  department: string
  role: string
  status: 'active' | 'idle' | 'never' | 'revoked'
  lastUsedAt: string | null
  keyPrefix: string | null
}
interface DeptRow { department: string; count: number; active: number }
interface Summary { total: number; departments: number; active: number; idle: number; never: number; revoked: number }
interface AgentsResponse { success: boolean; data: { agents: Agent[]; byDepartment: DeptRow[]; summary: Summary } }

const STATUS: Record<Agent['status'], { label: string; dot: string; text: string }> = {
  active: { label: 'Active', dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
  idle: { label: 'Idle', dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
  never: { label: 'Never used', dot: 'bg-gray-400', text: 'text-muted-foreground' },
  revoked: { label: 'Revoked', dot: 'bg-red-500', text: 'text-red-600 dark:text-red-400' },
}

/** Animated count-up number (framer-motion). */
function Counter({ value }: { value: number }) {
  const mv = useMotionValue(0)
  const rounded = useTransform(mv, (v) => Math.round(v).toLocaleString())
  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.9, ease: 'easeOut' })
    return () => controls.stop()
  }, [value, mv])
  return <motion.span>{rounded}</motion.span>
}

function KpiCard({ icon: Icon, label, value, tone, delay }: {
  icon: React.ElementType; label: string; value: number; tone: string; delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="lux-card p-5"
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-muted-foreground">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-4 w-4" strokeWidth={1.9} />
        </span>
      </div>
      <p className="mt-3 font-serif-lux text-[40px] font-medium leading-none tracking-tight text-foreground">
        <Counter value={value} />
      </p>
    </motion.div>
  )
}

export function AgentsContent() {
  const t = useTranslations('erp')
  const { data, isLoading } = useQuery<AgentsResponse>({
    queryKey: ['agents', 'fleet'],
    queryFn: () => fetch('/api/agents').then((r) => r.json()),
    refetchInterval: 30_000,
  })

  const agents = data?.data.agents ?? []
  const byDepartment = data?.data.byDepartment ?? []
  const summary = data?.data.summary
  const maxDept = Math.max(1, ...byDepartment.map((d) => d.count))

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader
        title={t('agentsTitle')}
        description={summary ? t('agentsSubtitle', { count: summary.total, depts: summary.departments }) : t('agentsLoading')}
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard icon={Bot} label="Total agents" value={summary?.total ?? 0} tone="bg-blue-50 text-blue-600 dark:bg-blue-500/10" delay={0} />
        <KpiCard icon={Building2} label="Departments" value={summary?.departments ?? 0} tone="bg-violet-50 text-violet-600 dark:bg-violet-500/10" delay={0.06} />
        <KpiCard icon={Zap} label="Active (24h)" value={summary?.active ?? 0} tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10" delay={0.12} />
        <KpiCard icon={PauseCircle} label="Idle / unused" value={(summary?.idle ?? 0) + (summary?.never ?? 0)} tone="bg-amber-50 text-amber-600 dark:bg-amber-500/10" delay={0.18} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Department breakdown — animated bars */}
        <div className="lux-card p-5 lg:col-span-1">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">By department</h3>
          </div>
          <div className="space-y-3">
            {byDepartment.map((d, i) => (
              <div key={d.department}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="truncate text-foreground/80">{d.department}</span>
                  <span className="text-muted-foreground">{d.count}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg,#1E3A8A,#3B82F6)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(d.count / maxDept) * 100}%` }}
                    transition={{ duration: 0.7, delay: 0.1 + i * 0.03, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))}
            {!isLoading && byDepartment.length === 0 && (
              <p className="text-xs text-muted-foreground">No agents found.</p>
            )}
          </div>
        </div>

        {/* Agent grid — staggered cards */}
        <div className="lg:col-span-2">
          <motion.div
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.015 } } }}
          >
            {agents.map((a) => {
              const s = STATUS[a.status]
              return (
                <motion.div
                  key={a.id}
                  variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                  whileHover={{ y: -3 }}
                  className="rounded-xl border bg-card p-3.5 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10">
                        <Bot className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{a.name}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{a.role}</p>
                      </div>
                    </div>
                    <span className="relative flex h-2.5 w-2.5 shrink-0" title={s.label}>
                      {a.status === 'active' && (
                        <motion.span
                          className={`absolute inline-flex h-full w-full rounded-full ${s.dot} opacity-60`}
                          animate={{ scale: [1, 2.2, 1], opacity: [0.6, 0, 0.6] }}
                          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                        />
                      )}
                      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${s.dot}`} />
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-[11px]">
                    <span className="truncate text-muted-foreground">{a.department}</span>
                    <span className={s.text}>
                      {a.status === 'active' || a.status === 'idle'
                        ? a.lastUsedAt
                          ? formatRelativeDate(a.lastUsedAt)
                          : s.label
                        : s.label}
                    </span>
                  </div>
                </motion.div>
              )
            })}
            {isLoading &&
              Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="h-[88px] animate-pulse rounded-xl border bg-muted/40" />
              ))}
          </motion.div>
          {!isLoading && agents.length === 0 && (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <CircleSlash className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">No AI agents are connected yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
