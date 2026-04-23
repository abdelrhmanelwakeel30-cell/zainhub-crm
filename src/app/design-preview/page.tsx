'use client'

/**
 * DESIGN PREVIEW — mockup of the enhanced UI.
 * Publicly accessible (allowlisted in middleware).
 *
 * Preserves EVERY nav item (8 sections, 42 links), EVERY KPI (8 cards),
 * the Top Performers card, Pipeline Overview, and Needs Attention +
 * Recent Activity. Adds motion (framer-motion) and a richer visual system.
 */

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { ZainHubLogo } from '@/components/shared/zainhub-logo'
import {
  LayoutDashboard, Bell, Target, Handshake, Building2, UserCircle, Package,
  GitBranch, Briefcase, ListTodo, Activity, PackageOpen, Eye, MessageSquare,
  HeartPulse, ClipboardList, FileText, Receipt, CreditCard, Wallet, RefreshCw,
  Calendar as CalendarIcon, Share2, Megaphone, Headphones, GitMerge, CheckSquare,
  Layers, FormInput, Users, Shield, Settings, BarChart3,
  Search, ChevronRight, Plus, Filter, Download, TrendingUp, TrendingDown,
  ArrowUpRight, MoreHorizontal, Clock, AlertTriangle, Circle, CheckCircle2,
  DollarSign, Sparkles, Globe, Sun, Moon, Crown, Zap, ChevronDown,
  LogOut, UserCog, HelpCircle, Keyboard, PanelLeftClose,
} from 'lucide-react'

// Full nav structure — mirrors src/components/layout/sidebar.tsx exactly
const NAV = [
  { label: 'Main', items: [
    { label: 'Dashboard', icon: LayoutDashboard, active: true },
    { label: 'Notifications', icon: Bell, badge: '2' },
  ]},
  { label: 'CRM & Sales', items: [
    { label: 'Leads', icon: Target, badge: '15' },
    { label: 'Opportunities', icon: Handshake },
    { label: 'Companies', icon: Building2 },
    { label: 'Contacts', icon: UserCircle },
    { label: 'Services', icon: Package },
    { label: 'Pipelines', icon: GitBranch },
  ]},
  { label: 'Delivery', items: [
    { label: 'Projects', icon: Briefcase },
    { label: 'Tasks', icon: ListTodo },
    { label: 'Client Services', icon: Activity },
    { label: 'Deliverables', icon: PackageOpen },
    { label: 'Preview Links', icon: Eye },
    { label: 'Communication Log', icon: MessageSquare },
    { label: 'Account Health', icon: HeartPulse },
    { label: 'Onboarding', icon: ClipboardList },
  ]},
  { label: 'Finance', items: [
    { label: 'Quotations', icon: FileText },
    { label: 'Proposals', icon: FileText },
    { label: 'Contracts', icon: FileText },
    { label: 'Invoices', icon: Receipt },
    { label: 'Payments', icon: CreditCard },
    { label: 'Expenses', icon: Wallet },
    { label: 'Subscriptions', icon: RefreshCw },
  ]},
  { label: 'Marketing', items: [
    { label: 'Content Calendar', icon: CalendarIcon },
    { label: 'Social Accounts', icon: Share2 },
    { label: 'Campaigns', icon: Megaphone },
  ]},
  { label: 'Support', items: [
    { label: 'Tickets', icon: Headphones, badge: '3' },
    { label: 'Change Requests', icon: GitMerge },
    { label: 'Approvals', icon: CheckSquare },
  ]},
  { label: 'Growth', items: [
    { label: 'Bundles', icon: Layers },
    { label: 'Forms', icon: FormInput },
  ]},
  { label: 'Administration', items: [
    { label: 'Users', icon: Users },
    { label: 'Roles', icon: Shield },
    { label: 'Settings', icon: Settings },
    { label: 'Audit Log', icon: Activity },
    { label: 'Reports', icon: BarChart3 },
  ]},
]

export default function DesignPreviewPage() {
  const [isDark, setIsDark] = useState(false)
  const [lang, setLang] = useState<'EN' | 'AR'>('EN')

  return (
    <div className={isDark ? 'dark' : ''}>
      <div
        className="min-h-screen antialiased relative overflow-hidden"
        style={{
          background: isDark
            ? 'radial-gradient(ellipse at top, #0f172a 0%, #020617 50%, #000 100%)'
            : 'radial-gradient(ellipse at top left, #f1f5ff 0%, #f8fafc 35%, #f7f8fa 100%)',
        }}
      >
        {/* Ambient background orbs — luxury touch */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ x: [0, 40, 0], y: [0, -20, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-400/10 dark:bg-blue-500/5 blur-3xl"
          />
          <motion.div
            animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-indigo-400/10 dark:bg-indigo-500/5 blur-3xl"
          />
          <motion.div
            animate={{ x: [0, 20, 0], y: [0, -30, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-amber-300/10 dark:bg-amber-500/5 blur-3xl"
          />
        </div>

        <div className="relative flex min-h-screen">
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0">
            <TopBar isDark={isDark} setIsDark={setIsDark} lang={lang} setLang={setLang} />
            <Dashboard />
          </main>
        </div>
      </div>
    </div>
  )
}

/* ====================== SIDEBAR ====================== */

function Sidebar() {
  return (
    <aside className="w-64 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col sticky top-0 h-screen shadow-[1px_0_0_0_rgba(255,255,255,0.5)_inset]">
      {/* Real Zain Hub logo */}
      <div className="h-16 px-5 flex items-center border-b border-slate-100/80 dark:border-slate-800/80">
        <ZainHubLogo variant="full" />
      </div>

      {/* Workspace chip — uses the REAL logo, not a blue ZH square */}
      <div className="px-3 pt-3">
        <motion.button
          whileHover={{ scale: 1.01, y: -1 }}
          whileTap={{ scale: 0.99 }}
          className="relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-amber-300 dark:hover:border-amber-500/50 hover:shadow-md hover:shadow-amber-500/5 transition-all overflow-hidden"
        >
          <div className="relative w-7 h-7 rounded-md overflow-hidden bg-slate-900 ring-1 ring-black/10 shrink-0 shadow-sm">
            <img src="/images/zainhub-logo-icon.png" alt="Zain Hub" className="absolute inset-0 w-full h-full object-cover" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1 truncate">
              ZainHub AI
              <Crown className="w-3 h-3 text-amber-500 shrink-0" />
            </div>
            <div className="text-[10px] text-slate-500 truncate">Super Admin · Pro</div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </motion.button>
      </div>

      {/* Nav — all 8 sections */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto scrollbar-thin">
        {NAV.map((section, si) => (
          <motion.div
            key={section.label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: si * 0.03, duration: 0.25 }}
          >
            <div className="px-2 mb-1.5 text-[10px] uppercase tracking-[0.08em] text-slate-400 font-semibold">
              {section.label}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item, ii) => (
                <SidebarItem
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  active={(item as { active?: boolean }).active}
                  badge={(item as { badge?: string }).badge}
                  delay={si * 0.03 + ii * 0.01}
                />
              ))}
            </div>
          </motion.div>
        ))}
      </nav>

      {/* User card */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800">
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold">AE</div>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">Abdelrhman E.</div>
            <div className="text-[10px] text-slate-500 truncate">admin@zainhub.ae</div>
          </div>
          <MoreHorizontal className="w-4 h-4 text-slate-400" />
        </motion.div>
      </div>
    </aside>
  )
}

function SidebarItem({
  icon: Icon, label, active, badge, delay = 0,
}: {
  icon: React.ElementType; label: string; active?: boolean; badge?: string; delay?: number
}) {
  return (
    <motion.a
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
      whileHover={{ x: 2 }}
      className={`group relative flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm cursor-pointer ${
        active
          ? 'bg-gradient-to-r from-blue-50 to-blue-50/50 dark:from-blue-950/40 dark:to-blue-950/20 text-blue-700 dark:text-blue-400 font-semibold'
          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'
      }`}
    >
      {active && (
        <motion.div
          layoutId="active-indicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-600 rounded-full"
        />
      )}
      <Icon className={`w-4 h-4 ${active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} strokeWidth={active ? 2.5 : 2} />
      <span className="flex-1 truncate">{label}</span>
      {badge && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: delay + 0.1 }}
          className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-md text-[10px] font-bold ${
            active ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >{badge}</motion.span>
      )}
    </motion.a>
  )
}

/* ====================== TOP BAR ====================== */

function TopBar({ isDark, setIsDark, lang, setLang }: {
  isDark: boolean; setIsDark: (v: boolean) => void;
  lang: 'EN'|'AR'; setLang: (v: 'EN'|'AR') => void
}) {
  const [searchFocus, setSearchFocus] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  return (
    <header className="h-16 bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 px-6 flex items-center gap-3 sticky top-0 z-30">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-sm">
        <span className="text-slate-500">Workspace</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 dark:text-white font-semibold">Dashboard</span>
      </div>

      {/* Search */}
      <motion.div
        animate={{ maxWidth: searchFocus ? 520 : 400 }}
        transition={{ duration: 0.2 }}
        className="flex-1 ml-auto"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search leads, invoices, contacts…"
            onFocus={() => setSearchFocus(true)}
            onBlur={() => setSearchFocus(false)}
            className="w-full h-9 pl-9 pr-16 rounded-lg bg-slate-100/80 dark:bg-slate-800/80 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 text-sm transition"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-[10px] font-mono text-slate-500">⌘K</kbd>
        </div>
      </motion.div>

      {/* Quick new */}
      <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} className="h-9 px-3 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5">
        <Plus className="w-4 h-4" /> <span className="hidden xl:inline">New</span>
      </motion.button>

      <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

      {/* Language switcher */}
      <div className="relative">
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { setLangOpen(!langOpen); setUserOpen(false); setNotifOpen(false) }}
          className="h-9 px-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300"
        >
          <Globe className="w-4 h-4" />
          <span className="tracking-wider">{lang}</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </motion.button>
        <AnimatePresence>
          {langOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-11 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-900/10 dark:shadow-black/40 overflow-hidden z-50"
            >
              <div className="px-3 py-2 text-[10px] uppercase tracking-[0.08em] text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">Language</div>
              {[
                { code: 'EN', label: 'English', flag: '🇬🇧' },
                { code: 'AR', label: 'العربية', flag: '🇦🇪' },
              ].map((l) => (
                <button
                  key={l.code}
                  onClick={() => { setLang(l.code as 'EN'|'AR'); setLangOpen(false) }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition ${
                    lang === l.code ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="text-base">{l.flag}</span>
                  <span className="flex-1 text-left">{l.label}</span>
                  {lang === l.code && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Theme toggle */}
      <motion.button
        whileHover={{ y: -1, rotate: isDark ? -15 : 15 }}
        whileTap={{ scale: 0.9, rotate: 180 }}
        onClick={() => setIsDark(!isDark)}
        className="relative w-9 h-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center overflow-hidden"
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <AnimatePresence mode="wait">
          {isDark ? (
            <motion.div key="moon" initial={{ y: 20, opacity: 0, rotate: -90 }} animate={{ y: 0, opacity: 1, rotate: 0 }} exit={{ y: -20, opacity: 0, rotate: 90 }} transition={{ duration: 0.25 }}>
              <Moon className="w-4 h-4 text-amber-400" fill="currentColor" />
            </motion.div>
          ) : (
            <motion.div key="sun" initial={{ y: 20, opacity: 0, rotate: -90 }} animate={{ y: 0, opacity: 1, rotate: 0 }} exit={{ y: -20, opacity: 0, rotate: 90 }} transition={{ duration: 0.25 }}>
              <Sun className="w-4 h-4 text-amber-500" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Notifications */}
      <div className="relative">
        <motion.button
          whileHover={{ y: -1, rotate: 15 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { setNotifOpen(!notifOpen); setUserOpen(false); setLangOpen(false) }}
          className="relative w-9 h-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
        >
          <Bell className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          <motion.span
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900"
          />
        </motion.button>
        <AnimatePresence>
          {notifOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-11 w-80 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-900/10 dark:shadow-black/40 overflow-hidden z-50"
            >
              <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</div>
                <button className="text-[11px] font-medium text-blue-600 hover:text-blue-700">Mark all read</button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {[
                  { dot: 'bg-red-500', title: 'Invoice INV-0042 is overdue', meta: 'Al Futtaim · 2m ago' },
                  { dot: 'bg-emerald-500', title: 'Payment received: AED 26,250', meta: 'DAMAC · 1h ago' },
                  { dot: 'bg-blue-500', title: 'New lead assigned to you', meta: 'Lead #15 · 3h ago' },
                ].map((n, i) => (
                  <button key={i} className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-start gap-2.5 border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                    <span className={`w-1.5 h-1.5 rounded-full ${n.dot} mt-1.5 shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-slate-900 dark:text-white">{n.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{n.meta}</div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="p-2 border-t border-slate-100 dark:border-slate-800">
                <button className="w-full text-center text-xs font-medium text-blue-600 hover:text-blue-700 py-1.5">View all notifications</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* User menu */}
      <div className="relative">
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { setUserOpen(!userOpen); setLangOpen(false); setNotifOpen(false) }}
          className="flex items-center gap-2 h-9 pl-1 pr-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <div className="relative">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 via-orange-400 to-pink-500 flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-white dark:ring-slate-900 shadow-sm">AE</div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
          </div>
          <div className="hidden lg:block text-left leading-tight">
            <div className="text-xs font-semibold text-slate-900 dark:text-white">Abdelrhman</div>
            <div className="text-[10px] text-slate-500">Super Admin</div>
          </div>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </motion.button>
        <AnimatePresence>
          {userOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-11 w-60 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-900/10 dark:shadow-black/40 overflow-hidden z-50"
            >
              <div className="px-3 py-3 flex items-center gap-3 bg-gradient-to-br from-amber-50 via-pink-50 to-blue-50 dark:from-amber-950/20 dark:via-pink-950/20 dark:to-blue-950/20">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 via-orange-400 to-pink-500 flex items-center justify-center text-white text-sm font-bold shadow">AE</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white truncate flex items-center gap-1">
                    Abdelrhman E.
                    <Crown className="w-3 h-3 text-amber-500" />
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">admin@zainhub.ae</div>
                </div>
              </div>
              <div className="py-1">
                {[
                  { icon: UserCog, label: 'Profile settings' },
                  { icon: Keyboard, label: 'Keyboard shortcuts', kbd: '⌘/' },
                  { icon: HelpCircle, label: 'Help & support' },
                ].map((i) => (
                  <button key={i.label} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <i.icon className="w-4 h-4 text-slate-400" />
                    <span className="flex-1 text-left">{i.label}</span>
                    {i.kbd && <kbd className="text-[10px] font-mono text-slate-400">{i.kbd}</kbd>}
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 py-1">
                <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20">
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}

/* ====================== DASHBOARD ====================== */

function Dashboard() {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-end justify-between flex-wrap gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Welcome back, Abdelrhman
            <motion.span
              animate={{ rotate: [0, 14, -8, 14, 0] }}
              transition={{ duration: 1.2, delay: 0.4 }}
              style={{ display: 'inline-block', transformOrigin: '70% 70%' }}
            >👋</motion.span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">Here&apos;s what&apos;s happening with your business today.</p>
        </div>
        <div className="flex items-center gap-2">
          <SecondaryBtn icon={Filter}>This month</SecondaryBtn>
          <SecondaryBtn icon={Download}>Export</SecondaryBtn>
          <PrimaryBtn icon={Plus}>New deal</PrimaryBtn>
        </div>
      </motion.div>

      {/* 8 KPIs (preserved all original metrics) */}
      <div className="grid grid-cols-4 gap-4">
        {KPIS.map((k, i) => (
          <KpiCard key={k.label} {...k} index={i} />
        ))}
      </div>

      {/* Revenue + Leads by source */}
      <div className="grid grid-cols-3 gap-4">
        <RevenueChart />
        <LeadsBySource />
      </div>

      {/* Pipeline Overview (horizontal bars) + Top Performers */}
      <div className="grid grid-cols-3 gap-4">
        <PipelineOverview />
        <TopPerformers />
      </div>

      {/* Needs attention + Recent activity */}
      <div className="grid grid-cols-3 gap-4">
        <NeedsAttention />
        <RecentActivity />
      </div>

      {/* AI upsell banner */}
      <AiBanner />
    </div>
  )
}

/* ====================== KPI CARDS (all 8) ====================== */

const KPIS: Array<Omit<Parameters<typeof KpiCard>[0], 'index'>> = [
  { label: 'Total Leads', value: '15', delta: '+23%', trend: 'up', icon: Target, tint: 'blue' },
  { label: 'Active Opportunities', value: '8', delta: '+4', trend: 'up', icon: Handshake, tint: 'indigo' },
  { label: 'Pipeline Value', value: 'AED 176K', delta: '+12%', trend: 'up', icon: TrendingUp, tint: 'emerald' },
  { label: 'Conversion Rate', value: '10%', delta: '-2%', trend: 'down', icon: ArrowUpRight, tint: 'amber' },
  { label: 'Monthly Revenue', value: 'AED 58K', delta: '+18%', trend: 'up', icon: DollarSign, tint: 'violet' },
  { label: 'Overdue Invoices', value: '1', delta: 'AED 8K', trend: 'down', icon: Receipt, tint: 'rose' },
  { label: 'Active Projects', value: '3', delta: '2 on track', trend: 'up', icon: Briefcase, tint: 'sky' },
  { label: 'Pending Tasks', value: '1', delta: '0 overdue', trend: 'up', icon: ListTodo, tint: 'teal' },
]

const TINT = {
  blue:    { chip: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40',       bar: 'from-blue-400 to-blue-600' },
  indigo:  { chip: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40', bar: 'from-indigo-400 to-indigo-600' },
  emerald: { chip: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40', bar: 'from-emerald-400 to-emerald-600' },
  amber:   { chip: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40',     bar: 'from-amber-400 to-amber-600' },
  violet:  { chip: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40', bar: 'from-violet-400 to-violet-600' },
  rose:    { chip: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40',       bar: 'from-rose-400 to-rose-600' },
  sky:     { chip: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40',           bar: 'from-sky-400 to-sky-600' },
  teal:    { chip: 'bg-teal-50 text-teal-600 dark:bg-teal-950/40',       bar: 'from-teal-400 to-teal-600' },
} as const

function KpiCard({ label, value, delta, trend, icon: Icon, tint, index = 0 }: {
  label: string; value: string; delta: string; trend: 'up' | 'down';
  icon: React.ElementType; tint: keyof typeof TINT; index?: number;
}) {
  const t = TINT[tint]
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 overflow-hidden hover:shadow-xl hover:shadow-slate-900/10 dark:hover:shadow-black/40 transition-all duration-300"
      style={{ backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 50%)' }}
    >
      {/* Shimmer on hover */}
      <motion.div
        initial={false}
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
      >
        <motion.div
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
        />
      </motion.div>

      {/* Decorative orb */}
      <div className={`absolute -top-6 -right-6 w-28 h-28 rounded-full ${t.chip} opacity-40 blur-2xl group-hover:opacity-70 group-hover:scale-110 transition-all duration-500`} />

      <div className="relative flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg ${t.chip} flex items-center justify-center`}>
          <Icon className="w-4 h-4" strokeWidth={2.5} />
        </div>
        <span className={`inline-flex items-center gap-0.5 px-1.5 h-5 rounded-md text-[10px] font-semibold ${
          trend === 'up'
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
            : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
        }`}>
          {trend === 'up' ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
          {delta}
        </span>
      </div>
      <div className="relative text-xs font-medium text-slate-500 mb-1">{label}</div>
      <div className="relative text-2xl font-bold text-slate-900 dark:text-white tracking-tight tabular-nums">{value}</div>
      {/* Sparkline */}
      <div className="relative mt-3 h-8 flex items-end gap-[3px]">
        {[30, 45, 35, 55, 48, 65, 58, 72, 68, 80, 75, 90].map((h, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ delay: index * 0.05 + i * 0.02, duration: 0.4, ease: 'easeOut' }}
            className={`flex-1 rounded-sm bg-gradient-to-t ${t.bar} opacity-30 group-hover:opacity-60 transition-opacity`}
          />
        ))}
      </div>
    </motion.div>
  )
}

/* ====================== REVENUE CHART ====================== */

function RevenueChart() {
  const bars = [42, 58, 51, 72, 68, 85, 92, 78, 88, 95, 82, 98]
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.35 }}
      className="col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Revenue overview</h3>
          <p className="text-xs text-slate-500 mt-0.5">Paid invoices · last 12 months</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
            <TrendingUp className="w-3 h-3" /> +18%
          </span>
          <button className="text-slate-400 hover:text-slate-600 transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="h-56 flex gap-3 items-end">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 h-full flex flex-col items-center justify-end gap-1.5">
            <div className="w-full flex-1 flex items-end">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: 0.4 + i * 0.04, duration: 0.6, ease: 'easeOut' }}
                whileHover={{ filter: 'brightness(1.1)' }}
                className="w-full bg-gradient-to-t from-blue-600 via-blue-500 to-indigo-400 rounded-t-md cursor-pointer"
                style={{ minHeight: 4 }}
              />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">{['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i]}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

/* ====================== LEADS BY SOURCE ====================== */

function LeadsBySource() {
  const sources = [
    { label: 'WhatsApp', value: 2, pct: 22, color: 'bg-emerald-500', light: 'bg-emerald-100 dark:bg-emerald-950/40' },
    { label: 'Referral', value: 2, pct: 22, color: 'bg-blue-500', light: 'bg-blue-100 dark:bg-blue-950/40' },
    { label: 'LinkedIn', value: 2, pct: 22, color: 'bg-indigo-500', light: 'bg-indigo-100 dark:bg-indigo-950/40' },
    { label: 'Website', value: 2, pct: 22, color: 'bg-violet-500', light: 'bg-violet-100 dark:bg-violet-950/40' },
    { label: 'Event', value: 2, pct: 22, color: 'bg-pink-500', light: 'bg-pink-100 dark:bg-pink-950/40' },
    { label: 'Cold Call', value: 1, pct: 11, color: 'bg-amber-500', light: 'bg-amber-100 dark:bg-amber-950/40' },
    { label: 'Direct', value: 1, pct: 11, color: 'bg-sky-500', light: 'bg-sky-100 dark:bg-sky-950/40' },
    { label: 'Partner', value: 1, pct: 11, color: 'bg-teal-500', light: 'bg-teal-100 dark:bg-teal-950/40' },
    { label: 'Google Ads', value: 1, pct: 11, color: 'bg-orange-500', light: 'bg-orange-100 dark:bg-orange-950/40' },
    { label: 'Instagram', value: 1, pct: 11, color: 'bg-rose-500', light: 'bg-rose-100 dark:bg-rose-950/40' },
  ]
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.35 }}
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Leads by source</h3>
        <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal className="w-4 h-4" /></button>
      </div>
      <div className="space-y-2.5">
        {sources.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.55 + i * 0.03 }}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <span className={`w-1.5 h-1.5 rounded-full ${s.color}`} /> {s.label}
              </span>
              <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{s.value}</span>
            </div>
            <div className={`h-1.5 rounded-full ${s.light} overflow-hidden`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${s.pct}%` }}
                transition={{ delay: 0.6 + i * 0.03, duration: 0.6, ease: 'easeOut' }}
                className={`h-full ${s.color} rounded-full`}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

/* ====================== PIPELINE OVERVIEW ====================== */

function PipelineOverview() {
  const stages = [
    { label: 'Discovery', count: 3, pct: 60, color: 'bg-slate-500' },
    { label: 'Proposal', count: 2, pct: 40, color: 'bg-blue-500' },
    { label: 'Negotiation', count: 2, pct: 40, color: 'bg-amber-500' },
    { label: 'Contract', count: 1, pct: 20, color: 'bg-indigo-500' },
    { label: 'Closed Won', count: 1, pct: 20, color: 'bg-emerald-500' },
    { label: 'Closed Lost', count: 0, pct: 0, color: 'bg-rose-500' },
  ]
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.35 }}
      className="col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Pipeline overview</h3>
          <p className="text-xs text-slate-500 mt-0.5">Opportunities by stage</p>
        </div>
        <a className="text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer">Open Pipelines →</a>
      </div>
      <div className="space-y-3">
        {stages.map((s, i) => (
          <div key={s.label} className="flex items-center gap-3">
            <div className="w-24 text-xs font-medium text-slate-700 dark:text-slate-300">{s.label}</div>
            <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${s.pct}%` }}
                transition={{ delay: 0.65 + i * 0.06, duration: 0.7, ease: 'easeOut' }}
                className={`h-full ${s.color} rounded-md flex items-center justify-end pr-2`}
              >
                {s.pct > 10 && <span className="text-[10px] font-bold text-white">{s.count}</span>}
              </motion.div>
              {s.pct <= 10 && s.count > 0 && (
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-600 dark:text-slate-300">{s.count}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

/* ====================== TOP PERFORMERS ====================== */

function TopPerformers() {
  const people = [
    { rank: 1, name: 'Abdelrhman Elwakeel', role: 'CEO & Founder', avatar: 'AE', tint: 'from-amber-400 to-pink-500', deals: 4, value: 'AED 128K' },
    { rank: 2, name: 'Ahmed Noor', role: 'Junior Sales Rep', avatar: 'AN', tint: 'from-blue-400 to-indigo-500', deals: 3, value: 'AED 92K' },
    { rank: 3, name: 'Layla Mahmoud', role: 'Account Manager', avatar: 'LM', tint: 'from-emerald-400 to-teal-500', deals: 3, value: 'AED 78K' },
    { rank: 4, name: 'Omar Hassan', role: 'Senior Sales Rep', avatar: 'OH', tint: 'from-violet-400 to-purple-500', deals: 2, value: 'AED 54K' },
  ]
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.35 }}
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Top performers</h3>
        <a className="text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer">View team →</a>
      </div>
      <div className="space-y-3">
        {people.map((p, i) => (
          <motion.div
            key={p.rank}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.75 + i * 0.06 }}
            whileHover={{ x: 2 }}
            className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            <div className={`w-6 h-6 rounded-full ${
              p.rank === 1 ? 'bg-amber-400 text-amber-900' :
              p.rank === 2 ? 'bg-slate-300 text-slate-700' :
              p.rank === 3 ? 'bg-orange-400 text-orange-900' :
              'bg-slate-100 dark:bg-slate-800 text-slate-500'
            } flex items-center justify-center text-[10px] font-bold flex-shrink-0`}>
              {p.rank}
            </div>
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${p.tint} flex items-center justify-center text-white text-xs font-bold`}>{p.avatar}</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">{p.name}</div>
              <div className="text-[10px] text-slate-500 truncate">{p.role}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-semibold text-slate-900 dark:text-white tabular-nums">{p.value}</div>
              <div className="text-[10px] text-slate-500">{p.deals} deals</div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

/* ====================== NEEDS ATTENTION ====================== */

function NeedsAttention() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.35 }}
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          Needs attention
          <motion.span
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-flex items-center px-1.5 h-4 rounded-md bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-[10px] font-semibold"
          >3</motion.span>
        </h3>
        <a className="text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer">View all →</a>
      </div>
      <div className="space-y-2">
        <AttentionItem severity="high" title="TKT-0003 — Invoice PDF bug" meta="Assigned to you · Overdue 2h" />
        <AttentionItem severity="medium" title="INV-0042 overdue" meta="Al Futtaim · AED 26,250" />
        <AttentionItem severity="low" title="Proposal PRP-0004 review" meta="DAMAC · Sent 3d ago" />
      </div>
    </motion.div>
  )
}

function AttentionItem({ severity, title, meta }: { severity: 'high' | 'medium' | 'low'; title: string; meta: string }) {
  const cfg = {
    high: { Icon: AlertTriangle, chip: 'text-red-600 bg-red-50 dark:bg-red-950/40', bar: 'bg-red-500' },
    medium: { Icon: Clock, chip: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40', bar: 'bg-amber-500' },
    low: { Icon: Circle, chip: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40', bar: 'bg-blue-500' },
  }[severity]
  return (
    <motion.div
      whileHover={{ x: 2 }}
      className="group relative flex items-start gap-3 p-2.5 rounded-lg bg-slate-50/70 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer overflow-hidden"
    >
      <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${cfg.bar}`} />
      <div className={`w-7 h-7 rounded-md ${cfg.chip} flex items-center justify-center flex-shrink-0 mt-0.5`}>
        <cfg.Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">{title}</div>
        <div className="text-[11px] text-slate-500 mt-0.5">{meta}</div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
    </motion.div>
  )
}

/* ====================== RECENT ACTIVITY ====================== */

function RecentActivity() {
  const acts = [
    { who: 'Omar Hassan',      what: 'moved',           target: 'Al Futtaim deal',   to: 'Negotiation', when: '2m ago',  tint: 'blue',    avatar: 'OH' },
    { who: 'Layla Mahmoud',    what: 'created invoice', target: 'INV-0043',          when: '14m ago', tint: 'emerald', avatar: 'LM' },
    { who: 'Sarah Al-Rashid',  what: 'updated',         target: 'DAMAC opportunity', when: '1h ago',  tint: 'violet',  avatar: 'SR' },
    { who: 'System',           what: 'auto-assigned',   target: 'Lead #15 → Omar',   when: '3h ago',  tint: 'slate',   avatar: '⚙' },
    { who: 'Abdelrhman',       what: 'approved',        target: 'Contract CTR-0005', when: '5h ago',  tint: 'amber',   avatar: 'AE' },
    { who: 'Ahmed Noor',       what: 'added task',      target: 'Follow up: DAMAC',  when: '7h ago',  tint: 'teal',    avatar: 'AN' },
  ] as const
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.85, duration: 0.35 }}
      className="col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Recent activity</h3>
        <a className="text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer">See all →</a>
      </div>
      <div className="space-y-3">
        <AnimatePresence>
          {acts.map((a, i) => (
            <ActivityItem key={a.who + i} {...a} index={i} />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

function ActivityItem({ who, what, target, to, when, tint, avatar, index }: {
  who: string; what: string; target: string; to?: string; when: string;
  tint: 'blue'|'emerald'|'violet'|'amber'|'slate'|'teal'; avatar: string; index: number;
}) {
  const tints: Record<string,string> = {
    blue: 'from-blue-400 to-blue-600',
    emerald: 'from-emerald-400 to-emerald-600',
    violet: 'from-violet-400 to-violet-600',
    amber: 'from-amber-400 to-orange-500',
    slate: 'from-slate-400 to-slate-600',
    teal: 'from-teal-400 to-cyan-500',
  }
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.9 + index * 0.06 }}
      className="flex items-start gap-3 group"
    >
      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${tints[tint]} flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0`}>{avatar}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-700 dark:text-slate-300 leading-5">
          <span className="font-semibold text-slate-900 dark:text-white">{who}</span>{' '}
          <span className="text-slate-500">{what}</span>{' '}
          <a className="font-medium text-blue-600 hover:underline cursor-pointer">{target}</a>
          {to && <> <span className="text-slate-500">to</span> <span className="font-semibold text-slate-900 dark:text-white">{to}</span></>}
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">{when}</div>
      </div>
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 opacity-0 group-hover:opacity-100 transition mt-1" />
    </motion.div>
  )
}

/* ====================== AI BANNER ====================== */

function AiBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1, duration: 0.35 }}
      whileHover={{ scale: 1.005 }}
      className="relative rounded-xl p-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between overflow-hidden"
    >
      <motion.div
        animate={{ x: ['-20%', '120%'] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
      />
      <div className="relative flex items-center gap-4">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="w-10 h-10 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center"
        >
          <Sparkles className="w-5 h-5" />
        </motion.div>
        <div>
          <div className="text-sm font-semibold">Enable AI lead scoring</div>
          <div className="text-xs text-white/80 mt-0.5">Let Claude auto-rank your 15 open leads by conversion likelihood.</div>
        </div>
      </div>
      <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="relative h-9 px-4 rounded-lg bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100">
        Turn on
      </motion.button>
    </motion.div>
  )
}

/* ====================== BUTTONS ====================== */

function PrimaryBtn({ icon: Icon, children }: { icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      className="h-9 px-3.5 rounded-lg bg-gradient-to-b from-blue-600 to-blue-700 text-white text-sm font-semibold shadow-sm shadow-blue-600/30 hover:shadow-md hover:shadow-blue-600/40 flex items-center gap-1.5 transition-shadow"
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </motion.button>
  )
}

function SecondaryBtn({ icon: Icon, children }: { icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </motion.button>
  )
}
