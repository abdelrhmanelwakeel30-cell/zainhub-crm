import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const statusColors: Record<string, string> = {
  // Lead/Opportunity stages
  new: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300',
  contacted: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300',
  qualified: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300',
  'meeting scheduled': 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300',
  'proposal sent': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300',
  discovery: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300',
  proposal: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300',
  negotiation: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300',
  contract: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300',
  won: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300',
  'closed won': 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300',
  lost: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300',
  'closed lost': 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300',
  // Priority
  low: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900 dark:text-gray-400',
  medium: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300',
  high: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300',
  urgent: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300',
  // Lifecycle
  lead: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400',
  prospect: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300',
  customer: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300',
  partner: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300',
  // Invoice statuses
  paid: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300',
  sent: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300',
  overdue: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300',
  // Task statuses
  todo: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400',
  'in progress': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300',
  'in review': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300',
  blocked: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300',
  completed: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-300',
  // Project statuses
  'not started': 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400',
  planning: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300',
  'on hold': 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300',
  cancelled: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300',
  // Project health
  'on track': 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300',
  'at risk': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300',
  delayed: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300',
  // Contract types
  service: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300',
  retainer: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300',
  nda: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900 dark:text-gray-400',
  partnership: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300',
  maintenance: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300',
  // Quotation/Finance statuses
  accepted: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300',
  viewed: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300',
  expired: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900 dark:text-gray-400',
  revised: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300',
  'partially paid': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300',
  refunded: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300',
  // Payment methods
  bank_transfer: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300',
  credit_card: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300',
  cash: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300',
  check: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300',
  online: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300',
  // Ticket types & statuses
  bug: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300',
  feature_request: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300',
  question: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300',
  support: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300',
  change_request: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300',
  open: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300',
  'waiting client': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300',
  waiting_client: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300',
  resolved: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300',
  closed: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900 dark:text-gray-400',
  reopened: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300',
  // Lead extended stages
  nurture: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300',
  disqualified: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900 dark:text-gray-400',
  // Campaign statuses
  paused: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300',
  // Content statuses
  internal_review: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300',
  client_review: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300',
  scheduled: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300',
  published: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300',
  revision_needed: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300',
  // Expense statuses
  'pending approval': 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300',
  // Decision roles
  'decision maker': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300',
  influencer: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300',
  user: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900 dark:text-gray-400',
  gatekeeper: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300',
  champion: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300',
  other: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900 dark:text-gray-400',
  // Project statuses extended
  review: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300',
  revisions: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300',
  delivered: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300',
  // Social platforms
  instagram: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950 dark:text-pink-300',
  facebook: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300',
  linkedin: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300',
  tiktok: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900 dark:text-gray-300',
  x: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900 dark:text-gray-300',
  youtube: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300',
  // Generic
  active: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300',
  inactive: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900 dark:text-gray-400',
  draft: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900 dark:text-gray-400',
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300',
  approved: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300',
  rejected: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300',
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colorClass = statusColors[status.toLowerCase()] || statusColors.active

  return (
    <Badge
      variant="outline"
      className={cn('font-medium capitalize', colorClass, className)}
    >
      {status}
    </Badge>
  )
}
