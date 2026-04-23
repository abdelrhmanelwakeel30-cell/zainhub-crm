'use client'

/**
 * DESIGN PREVIEW v2 — LUXURY ENTERPRISE aesthetic.
 *
 * Platinum + glassmorphism + serif display type + bento grid + scroll-under
 * translucent chrome. Benchmark against /design-preview (which stays intact).
 */

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Playfair_Display } from 'next/font/google'
import { ZainHubLogo } from '@/components/shared/zainhub-logo'
import {
  LayoutDashboard, Bell, Target, Handshake, Building2, UserCircle, Package,
  GitBranch, Briefcase, ListTodo, Activity, PackageOpen, Eye, MessageSquare,
  HeartPulse, ClipboardList, FileText, Receipt, CreditCard, Wallet, RefreshCw,
  Calendar as CalendarIcon, Share2, Megaphone, Headphones, GitMerge, CheckSquare,
  Layers, FormInput, Users, Shield, Settings, BarChart3,
  Search, ChevronRight, Plus, Filter, Download, TrendingUp, TrendingDown,
  ArrowUpRight, MoreHorizontal, Clock, AlertTriangle, Circle, CheckCircle2,
  DollarSign, Sparkles, Globe, Sun, Moon, Crown, ChevronDown,
  LogOut, UserCog, HelpCircle, Keyboard,
} from 'lucide-react'

const serif = Playfair_Display({ subsets: ['latin'], weight: ['400', '500', '600', '700'], style: ['normal', 'italic'] })

/* =================== NAV (all 42 items, 8 sections) =================== */
const NAV = [
  { label: 'Main', items: [
    { label: 'Dashboard', icon: LayoutDashboard, active: true },
    { label: 'Notifications', icon: Bell, badge: '2' },
  ]},
  { label: 'CRM & Sales', items: [
    { label: 'Leads', icon: Target, badge: '15' },
    { label: 'Opportunities', icon: Handshake, live: true },
    { label: 'Companies', icon: Building2 },
    { label: 'Contacts', icon: UserCircle },
    { label: 'Services', icon: Package },
    { label: 'Pipelines', icon: GitBranch },
  ]},
  { label: 'Delivery', items: [
    { label: 'Projects', icon: Briefcase, live: true },
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

/* =================== ROOT =================== */

export default function LuxuryDesignPreview() {
  const [isDark, setIsDark] = useState(false)
  const [lang, setLang] = useState<'EN'|'AR'>('EN')

  return (
    <div className={`${serif.className} ${isDark ? 'dark' : ''}`}>
      <div
        className="min-h-screen antialiased relative"
        style={{
          // Cool Platinum base
          background: isDark
            ? 'linear-gradient(180deg, #0B1020 0%, #050812 100%)'
            : '#F4F5F7',
          fontFamily: 'ui-sans-serif, -apple-system, "SF Pro Text", Inter, system-ui, sans-serif',
        }}
      >
        {/* Ambient luxury glows */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <motion.div
            animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-40 left-1/4 w-[600px] h-[600px] rounded-full blur-[120px]"
            style={{ background: isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.10)' }}
          />
          <motion.div
            animate={{ x: [0, -40, 0], y: [0, -30, 0] }}
            transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full blur-[120px]"
            style={{ background: isDark ? 'rgba(99, 102, 241, 0.08)' : 'rgba(212, 175, 55, 0.06)' }}
          />
        </div>

        <div className="relative flex min-h-screen">
          <LuxurySidebar />
          <main className="flex-1 flex flex-col min-w-0">
            <LuxuryTopBar isDark={isDark} setIsDark={setIsDark} lang={lang} setLang={setLang} />
            <BentoDashboard />
          </main>
        </div>
      </div>
    </div>
  )
}

/* =================== SIDEBAR =================== */

function LuxurySidebar() {
  return (
    <aside
      className="w-64 sticky top-0 h-screen border-r z-40 flex flex-col"
      style={{
        background: 'rgba(255, 255, 255, 0.55)',
        backdropFilter: 'blur(20px) saturate(140%)',
        WebkitBackdropFilter: 'blur(20px) saturate(140%)',
        borderColor: 'rgba(255, 255, 255, 0.7)',
        boxShadow: '1px 0 0 rgba(255, 255, 255, 0.8) inset, 0 8px 32px rgba(15, 23, 42, 0.04)',
      }}
    >
      {/* Logo */}
      <div className="h-20 px-6 flex items-center border-b" style={{ borderColor: 'rgba(226, 232, 240, 0.6)' }}>
        <ZainHubLogo variant="full" />
      </div>

      {/* Workspace chip (real logo) */}
      <div className="px-4 pt-5">
        <motion.button
          whileHover={{ scale: 1.01, y: -1 }}
          whileTap={{ scale: 0.99 }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all relative overflow-hidden group"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.6) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.9)',
            boxShadow: '0 1px 2px rgba(15,23,42,0.03), 0 4px 12px rgba(15,23,42,0.03)',
          }}
        >
          <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-slate-900 shadow-sm shrink-0">
            <img src="/images/zainhub-logo-icon.png" alt="" className="absolute inset-0 w-full h-full object-cover" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <div className="text-[13px] font-semibold text-slate-900 flex items-center gap-1 truncate">
              ZainHub AI
              <Crown className="w-3 h-3" style={{ color: '#C9A961' }} strokeWidth={1.5} />
            </div>
            <div className="text-[11px] text-slate-500 truncate">Super Admin</div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.5} />
        </motion.button>
      </div>

      {/* Nav — grouped with generous spacing */}
      <nav className="flex-1 px-4 py-5 space-y-6 overflow-y-auto">
        {NAV.map((section, si) => (
          <motion.div
            key={section.label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: si * 0.04, duration: 0.3 }}
          >
            <div className="px-3 mb-2 text-[10px] uppercase tracking-[0.12em] text-slate-400 font-semibold">
              {section.label}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item, ii) => (
                <LuxuryNavItem
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  active={(item as { active?: boolean }).active}
                  badge={(item as { badge?: string }).badge}
                  live={(item as { live?: boolean }).live}
                  delay={si * 0.04 + ii * 0.015}
                />
              ))}
            </div>
          </motion.div>
        ))}
      </nav>

      {/* Footer user */}
      <div className="p-3 border-t" style={{ borderColor: 'rgba(226, 232, 240, 0.6)' }}>
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-white/60 transition cursor-pointer"
        >
          <div className="relative">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 50%, #EC4899 100%)' }}>AE</div>
            <motion.div
              animate={{ scale: [1, 1.25, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-slate-900 truncate">Abdelrhman E.</div>
            <div className="text-[11px] text-slate-500 truncate">admin@zainhub.ae</div>
          </div>
          <MoreHorizontal className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
        </motion.div>
      </div>
    </aside>
  )
}

function LuxuryNavItem({
  icon: Icon, label, active, badge, live, delay = 0,
}: {
  icon: React.ElementType; label: string;
  active?: boolean; badge?: string; live?: boolean; delay?: number;
}) {
  return (
    <motion.a
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
      whileHover={{ x: 2 }}
      className={`group relative flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] cursor-pointer transition-all ${
        active
          ? 'text-slate-900 font-semibold'
          : 'text-slate-600 hover:text-slate-900 font-medium'
      }`}
      style={active ? {
        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 100%)',
        border: '1px solid rgba(255,255,255,0.9)',
        boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.05), inset 0 1px 0 rgba(255,255,255,0.9)',
      } : {}}
    >
      {active && (
        <motion.div
          layoutId="lux-active-rail"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
          style={{ background: 'linear-gradient(180deg, #1E3A8A 0%, #3B82F6 100%)' }}
        />
      )}
      <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={active ? 2 : 1.5} style={{ color: active ? '#1E3A8A' : '#64748B' }} />
      <span className="flex-1 truncate">{label}</span>
      {live && (
        <motion.span
          animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          className="w-1.5 h-1.5 rounded-full bg-emerald-500"
          style={{ boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.18)' }}
        />
      )}
      {badge && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: delay + 0.1 }}
          className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-md text-[10px] font-bold ${
            active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
          }`}
        >{badge}</motion.span>
      )}
    </motion.a>
  )
}

/* =================== TOP BAR =================== */

function LuxuryTopBar({ isDark, setIsDark, lang, setLang }: {
  isDark: boolean; setIsDark: (v: boolean) => void;
  lang: 'EN'|'AR'; setLang: (v: 'EN'|'AR') => void
}) {
  const [langOpen, setLangOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  return (
    <header
      className="h-20 px-8 flex items-center gap-3 sticky top-0 z-30 border-b"
      style={{
        background: 'rgba(244, 245, 247, 0.7)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderColor: 'rgba(255, 255, 255, 0.7)',
      }}
    >
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[13px]">
        <span className="text-slate-500">Workspace</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
        <span className="text-slate-900 font-semibold">Dashboard</span>
      </div>

      {/* Command palette search */}
      <div className="flex-1 max-w-xl mx-auto">
        <motion.button
          whileHover={{ y: -1 }}
          className="w-full flex items-center gap-3 h-10 px-4 rounded-xl text-[13px] transition group"
          style={{
            background: 'rgba(255, 255, 255, 0.55)',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            boxShadow: '0 1px 2px rgba(15,23,42,0.03), inset 0 1px 0 rgba(255,255,255,0.6)',
          }}
        >
          <Search className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
          <span className="text-slate-400 flex-1 text-left">Search or jump to…</span>
          <kbd className="text-[10px] font-mono text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 bg-white/60">⌘K</kbd>
        </motion.button>
      </div>

      {/* Quick new */}
      <motion.button
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.97 }}
        className="h-10 px-3.5 rounded-xl text-[13px] font-medium text-slate-700 hover:bg-white/60 flex items-center gap-1.5 transition"
      >
        <Plus className="w-4 h-4" strokeWidth={1.5} />
        <span className="hidden xl:inline">New</span>
      </motion.button>

      <div className="h-6 w-px bg-slate-200/70" />

      {/* Language */}
      <div className="relative">
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { setLangOpen(!langOpen); setUserOpen(false); setNotifOpen(false) }}
          className="h-10 px-3 rounded-xl hover:bg-white/60 flex items-center gap-1.5 text-[12px] font-semibold text-slate-700 tracking-wider transition"
        >
          <Globe className="w-4 h-4" strokeWidth={1.5} />
          <span>{lang}</span>
          <ChevronDown className="w-3 h-3 text-slate-400" strokeWidth={1.5} />
        </motion.button>
        <AnimatePresence>
          {langOpen && (
            <Dropdown>
              <div className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-slate-400 font-semibold border-b border-slate-100">Language</div>
              {[
                { code: 'EN', label: 'English', flag: '🇬🇧' },
                { code: 'AR', label: 'العربية', flag: '🇦🇪' },
              ].map((l) => (
                <button key={l.code} onClick={() => { setLang(l.code as 'EN'|'AR'); setLangOpen(false) }} className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] hover:bg-slate-50 ${lang === l.code ? 'text-slate-900 font-semibold' : 'text-slate-700'}`}>
                  <span className="text-base">{l.flag}</span>
                  <span className="flex-1 text-left">{l.label}</span>
                  {lang === l.code && <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} style={{ color: '#1E3A8A' }} />}
                </button>
              ))}
            </Dropdown>
          )}
        </AnimatePresence>
      </div>

      {/* Theme */}
      <motion.button
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.9, rotate: 180 }}
        onClick={() => setIsDark(!isDark)}
        className="relative w-10 h-10 rounded-xl hover:bg-white/60 flex items-center justify-center overflow-hidden transition"
      >
        <AnimatePresence mode="wait">
          {isDark ? (
            <motion.div key="moon" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}>
              <Moon className="w-4 h-4" strokeWidth={1.5} style={{ color: '#C9A961' }} fill="currentColor" />
            </motion.div>
          ) : (
            <motion.div key="sun" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}>
              <Sun className="w-4 h-4" strokeWidth={1.5} style={{ color: '#C9A961' }} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Notifications */}
      <div className="relative">
        <motion.button
          whileHover={{ y: -1, rotate: 12 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { setNotifOpen(!notifOpen); setUserOpen(false); setLangOpen(false) }}
          className="relative w-10 h-10 rounded-xl hover:bg-white/60 flex items-center justify-center transition"
        >
          <Bell className="w-4 h-4 text-slate-600" strokeWidth={1.5} />
          <motion.span
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"
          />
        </motion.button>
        <AnimatePresence>
          {notifOpen && (
            <Dropdown wide>
              <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100">
                <div className="text-[13px] font-semibold text-slate-900">Notifications</div>
                <button className="text-[11px] font-medium" style={{ color: '#1E3A8A' }}>Mark all read</button>
              </div>
              {[
                { dot: 'bg-red-500', title: 'INV-0042 is overdue', meta: 'Al Futtaim · 2m ago' },
                { dot: 'bg-emerald-500', title: 'Payment received: AED 26,250', meta: 'DAMAC · 1h ago' },
                { dot: 'bg-blue-500', title: 'New lead assigned to you', meta: 'Lead #15 · 3h ago' },
              ].map((n, i) => (
                <button key={i} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-start gap-2.5 border-b border-slate-50 last:border-0">
                  <span className={`w-1.5 h-1.5 rounded-full ${n.dot} mt-1.5 shrink-0`} />
                  <div className="flex-1">
                    <div className="text-[12px] font-medium text-slate-900">{n.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{n.meta}</div>
                  </div>
                </button>
              ))}
            </Dropdown>
          )}
        </AnimatePresence>
      </div>

      {/* User */}
      <div className="relative">
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { setUserOpen(!userOpen); setLangOpen(false); setNotifOpen(false) }}
          className="flex items-center gap-2 h-10 pl-1 pr-2.5 rounded-xl hover:bg-white/60 transition"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shadow-sm" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 50%, #EC4899 100%)' }}>AE</div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white" />
          </div>
          <div className="hidden lg:block text-left leading-tight">
            <div className="text-[12px] font-semibold text-slate-900">Abdelrhman</div>
            <div className="text-[10px] text-slate-500">Super Admin</div>
          </div>
          <ChevronDown className="w-3 h-3 text-slate-400" strokeWidth={1.5} />
        </motion.button>
        <AnimatePresence>
          {userOpen && (
            <Dropdown>
              <div className="px-4 py-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #FEF3C7 0%, #FCE7F3 50%, #DBEAFE 100%)' }}>
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shadow" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 50%, #EC4899 100%)' }}>AE</div>
                <div className="flex-1">
                  <div className="text-[13px] font-semibold text-slate-900 flex items-center gap-1">
                    Abdelrhman E.
                    <Crown className="w-3 h-3" style={{ color: '#C9A961' }} strokeWidth={1.5} />
                  </div>
                  <div className="text-[11px] text-slate-600">admin@zainhub.ae</div>
                </div>
              </div>
              <div className="py-1">
                {[
                  { icon: UserCog, label: 'Profile settings' },
                  { icon: Keyboard, label: 'Keyboard shortcuts', kbd: '⌘/' },
                  { icon: HelpCircle, label: 'Help & support' },
                ].map((i) => (
                  <button key={i.label} className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-slate-700 hover:bg-slate-50">
                    <i.icon className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
                    <span className="flex-1 text-left">{i.label}</span>
                    {i.kbd && <kbd className="text-[10px] font-mono text-slate-400">{i.kbd}</kbd>}
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-100 py-1">
                <button className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-red-600 hover:bg-red-50">
                  <LogOut className="w-4 h-4" strokeWidth={1.5} />
                  Sign out
                </button>
              </div>
            </Dropdown>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}

function Dropdown({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.96 }}
      transition={{ duration: 0.18 }}
      className={`absolute right-0 top-12 ${wide ? 'w-80' : 'w-56'} rounded-2xl overflow-hidden z-50`}
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.9)',
        boxShadow: '0 2px 4px rgba(15,23,42,0.04), 0 12px 32px rgba(15,23,42,0.08), 0 24px 64px rgba(15,23,42,0.08)',
      }}
    >
      {children}
    </motion.div>
  )
}

/* =================== BENTO DASHBOARD =================== */

// Buttery layered shadow used across glass cards
const LUX_SHADOW = '0 1px 2px rgba(15,23,42,0.02), 0 4px 16px rgba(15,23,42,0.03), 0 12px 40px rgba(15,23,42,0.04)'
const LUX_SHADOW_HOVER = '0 1px 2px rgba(15,23,42,0.03), 0 8px 24px rgba(15,23,42,0.06), 0 20px 60px rgba(15,23,42,0.08)'

const GLASS_CARD: React.CSSProperties = {
  background: 'linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.65) 100%)',
  backdropFilter: 'blur(14px) saturate(150%)',
  WebkitBackdropFilter: 'blur(14px) saturate(150%)',
  border: '1px solid rgba(255,255,255,0.85)',
  boxShadow: LUX_SHADOW,
}

function BentoDashboard() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-10 py-10 space-y-10 max-w-[1400px] mx-auto">
        {/* HERO GREETING */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-4"
        >
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <h1 className={`${serif.className} text-[40px] leading-tight font-normal tracking-tight text-slate-900 flex items-center gap-3`}>
                Welcome back, Abdelrhman
                <motion.span
                  animate={{ rotate: [0, 14, -8, 14, 0] }}
                  transition={{ duration: 1.2, delay: 0.6 }}
                  style={{ display: 'inline-block', transformOrigin: '70% 70%' }}
                >👋</motion.span>
              </h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className={`${serif.className} mt-2 text-[17px] italic text-slate-500 max-w-2xl leading-relaxed`}
              >
                &ldquo;Your pipeline is looking strong this week. You have <span className="text-slate-800 font-medium not-italic">8 active opportunities</span> and revenue is up <span className="text-emerald-700 font-medium not-italic">18%</span> compared to last month.&rdquo;
              </motion.p>
            </div>
            <div className="flex items-center gap-2">
              <LuxBtn icon={Filter}>This month</LuxBtn>
              <LuxBtn icon={Download}>Export</LuxBtn>
              <LuxPrimaryBtn icon={Plus}>New deal</LuxPrimaryBtn>
            </div>
          </div>
        </motion.div>

        {/* BENTO GRID */}
        <div className="grid grid-cols-12 gap-5 auto-rows-[180px]">
          {/* Hero KPI — Pipeline Value (double-wide, double-tall) */}
          <HeroKpi />

          {/* Monthly Revenue — wide */}
          <WideKpi
            label="Monthly Revenue"
            value="AED 58K"
            delta="+18%"
            trend="up"
            accent="#1E3A8A"
            spark={[30, 45, 35, 55, 48, 65, 58, 72, 68, 80, 75, 90]}
          />

          {/* Total Leads — standard */}
          <StandardKpi label="Total Leads" value="15" delta="+23%" trend="up" icon={Target} />
          {/* Active Opportunities — standard (with live dot) */}
          <StandardKpi label="Active Opportunities" value="8" delta="+4" trend="up" icon={Handshake} live />
          {/* Active Projects — small (with live dot) */}
          <SmallKpi label="Active Projects" value="3" icon={Briefcase} live />
          {/* Pending Tasks — small */}
          <SmallKpi label="Pending Tasks" value="1" icon={ListTodo} />
          {/* Conversion Rate — small */}
          <SmallKpi label="Conversion Rate" value="10%" icon={ArrowUpRight} trendDown />
          {/* Overdue Invoices — small */}
          <SmallKpi label="Overdue Invoices" value="1" icon={Receipt} trendDown />
        </div>

        {/* Revenue bar chart — full width */}
        <RevenueChart />

        {/* Leads + Pipeline */}
        <div className="grid grid-cols-12 gap-5">
          <LeadsBySource />
          <PipelineOverview />
        </div>

        {/* Top performers full width */}
        <TopPerformers />

        {/* Attention + Activity */}
        <div className="grid grid-cols-12 gap-5">
          <NeedsAttention />
          <RecentActivity />
        </div>

        {/* AI banner */}
        <AiBanner />

        <div className="h-10" />
      </div>
    </div>
  )
}

/* =================== BENTO KPI CARDS =================== */

function HeroKpi() {
  const bars = [35, 52, 45, 60, 55, 72, 65, 80, 74, 88, 82, 95]
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      className="col-span-6 row-span-2 relative rounded-3xl p-7 overflow-hidden group"
      style={GLASS_CARD}
    >
      {/* hover shimmer */}
      <motion.div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <motion.div
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-y-0 w-1/3"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', transform: 'skewX(-20deg)' }}
        />
      </motion.div>

      {/* Decorative orb */}
      <div
        className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-30 group-hover:opacity-50 transition-opacity"
        style={{ background: 'radial-gradient(circle, #1E3A8A 0%, transparent 70%)', filter: 'blur(40px)' }}
      />

      <div className="relative flex items-start justify-between mb-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-slate-500 font-semibold mb-1">Pipeline Value</div>
          <div className="text-[11px] text-slate-400">as of today</div>
        </div>
        <span className="inline-flex items-center gap-1 px-2 h-6 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
          <TrendingUp className="w-3 h-3" strokeWidth={2} /> +12% MoM
        </span>
      </div>

      <div className="relative">
        <div className={`${serif.className} text-[64px] leading-none font-medium tracking-tight text-slate-900 tabular-nums`}>
          AED <span style={{ backgroundImage: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>176K</span>
        </div>
        <div className="text-[13px] text-slate-500 mt-2">Across <span className="font-semibold text-slate-700">8 active opportunities</span> · expected close by Q2</div>
      </div>

      {/* Mini sparkline inside */}
      <div className="relative mt-6 h-16 flex items-end gap-[6px]">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 h-full flex items-end">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ delay: 0.2 + i * 0.05, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="w-full rounded-t-md"
              style={{
                background: 'linear-gradient(180deg, #3B82F6 0%, #1E3A8A 100%)',
                minHeight: 4,
                boxShadow: '0 -2px 8px rgba(30, 58, 138, 0.2)',
              }}
            />
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function WideKpi({ label, value, delta, trend, accent, spark }: {
  label: string; value: string; delta: string; trend: 'up'|'down'; accent: string; spark: number[]
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      className="col-span-6 row-span-1 relative rounded-3xl p-6 overflow-hidden group"
      style={GLASS_CARD}
    >
      <motion.div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <motion.div
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-y-0 w-1/3"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', transform: 'skewX(-20deg)' }}
        />
      </motion.div>

      <div className="relative flex items-start justify-between mb-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-slate-500 font-semibold">{label}</div>
        </div>
        <span className={`inline-flex items-center gap-1 px-2 h-6 rounded-md text-[11px] font-semibold ${
          trend === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>
          {trend === 'up' ? <TrendingUp className="w-3 h-3" strokeWidth={2} /> : <TrendingDown className="w-3 h-3" strokeWidth={2} />}
          {delta}
        </span>
      </div>

      <div className={`${serif.className} relative text-[40px] leading-none font-medium tracking-tight text-slate-900 tabular-nums`}>{value}</div>

      {/* Sparkline */}
      <div className="relative mt-4 h-10 flex items-end gap-[3px]">
        {spark.map((h, i) => (
          <div key={i} className="flex-1 h-full flex items-end">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ delay: 0.1 + i * 0.03, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="w-full rounded-t-sm"
              style={{ background: `linear-gradient(180deg, ${accent} 0%, ${accent}80 100%)`, minHeight: 2, opacity: 0.8 }}
            />
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function StandardKpi({ label, value, delta, trend, icon: Icon, live }: {
  label: string; value: string; delta: string; trend: 'up'|'down'; icon: React.ElementType; live?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      className="col-span-3 row-span-1 relative rounded-3xl p-5 overflow-hidden group"
      style={GLASS_CARD}
    >
      <motion.div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <motion.div
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-y-0 w-1/3"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', transform: 'skewX(-20deg)' }}
        />
      </motion.div>

      <div className="relative flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(30, 58, 138, 0.06)' }}>
          <Icon className="w-[18px] h-[18px]" strokeWidth={1.5} style={{ color: '#1E3A8A' }} />
        </div>
        <span className={`inline-flex items-center gap-0.5 px-1.5 h-5 rounded-md text-[10px] font-semibold ${
          trend === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>
          {trend === 'up' ? <TrendingUp className="w-2.5 h-2.5" strokeWidth={2} /> : <TrendingDown className="w-2.5 h-2.5" strokeWidth={2} />}
          {delta}
        </span>
      </div>
      <div className="relative text-[11px] uppercase tracking-[0.14em] text-slate-500 font-semibold mb-1 flex items-center gap-1.5">
        {label}
        {live && (
          <motion.span
            animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-emerald-500"
            style={{ boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.18)' }}
          />
        )}
      </div>
      <div className={`${serif.className} relative text-[32px] leading-none font-medium text-slate-900 tabular-nums`}>{value}</div>
    </motion.div>
  )
}

function SmallKpi({ label, value, icon: Icon, live, trendDown }: {
  label: string; value: string; icon: React.ElementType; live?: boolean; trendDown?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      className="col-span-3 row-span-1 relative rounded-3xl p-5 overflow-hidden group"
      style={GLASS_CARD}
    >
      <motion.div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <motion.div
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-y-0 w-1/3"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', transform: 'skewX(-20deg)' }}
        />
      </motion.div>
      <div className="relative flex items-start justify-between mb-2">
        <Icon className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
        {trendDown && <TrendingDown className="w-3.5 h-3.5 text-red-500" strokeWidth={1.5} />}
      </div>
      <div className="relative text-[10px] uppercase tracking-[0.12em] text-slate-500 font-semibold mb-1 flex items-center gap-1.5">
        {label}
        {live && (
          <motion.span
            animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-emerald-500"
            style={{ boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.18)' }}
          />
        )}
      </div>
      <div className={`${serif.className} relative text-[26px] leading-none font-medium text-slate-900 tabular-nums`}>{value}</div>
    </motion.div>
  )
}

/* =================== CHARTS & WIDGETS =================== */

function RevenueChart() {
  const bars = [42, 58, 51, 72, 68, 85, 92, 78, 88, 95, 82, 98]
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-3xl p-8 relative overflow-hidden"
      style={GLASS_CARD}
    >
      <div className="flex items-start justify-between mb-8">
        <div>
          <h3 className={`${serif.className} text-[22px] font-normal text-slate-900 tracking-tight`}>Revenue overview</h3>
          <p className="text-[13px] text-slate-500 mt-1">Paid invoices · last 12 months</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
            <TrendingUp className="w-3 h-3" strokeWidth={2} /> +18%
          </span>
          <button className="text-slate-400 hover:text-slate-600 transition">
            <MoreHorizontal className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
      <div className="h-56 flex items-end gap-3">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 h-full flex flex-col items-center justify-end gap-2">
            <div className="w-full flex-1 flex items-end">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: 0.3 + i * 0.04, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ filter: 'brightness(1.08)' }}
                className="w-full rounded-t-lg cursor-pointer"
                style={{
                  background: 'linear-gradient(180deg, #3B82F6 0%, #1E3A8A 100%)',
                  boxShadow: '0 -4px 12px rgba(30, 58, 138, 0.15)',
                  minHeight: 4,
                }}
              />
            </div>
            <span className="text-[10px] text-slate-400 font-medium tracking-wider">{['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i]}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function LeadsBySource() {
  const sources = [
    { label: 'WhatsApp', value: 2, pct: 22, color: '#059669' },
    { label: 'Referral', value: 2, pct: 22, color: '#2563EB' },
    { label: 'LinkedIn', value: 2, pct: 22, color: '#4F46E5' },
    { label: 'Website', value: 2, pct: 22, color: '#7C3AED' },
    { label: 'Event', value: 2, pct: 22, color: '#DB2777' },
    { label: 'Cold Call', value: 1, pct: 11, color: '#D97706' },
    { label: 'Direct', value: 1, pct: 11, color: '#0284C7' },
    { label: 'Partner', value: 1, pct: 11, color: '#0D9488' },
  ]
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
      className="col-span-5 rounded-3xl p-8"
      style={GLASS_CARD}
    >
      <div className="flex items-start justify-between mb-8">
        <div>
          <h3 className={`${serif.className} text-[22px] font-normal text-slate-900 tracking-tight`}>Leads by source</h3>
          <p className="text-[13px] text-slate-500 mt-1">Across all acquisition channels</p>
        </div>
        <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal className="w-4 h-4" strokeWidth={1.5} /></button>
      </div>
      <div className="space-y-3.5">
        {sources.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.04 }}>
            <div className="flex items-center justify-between text-[12px] mb-1.5">
              <span className="flex items-center gap-2 text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} /> {s.label}
              </span>
              <span className="font-semibold text-slate-900 tabular-nums">{s.value}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100/80 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${s.pct}%` }}
                transition={{ delay: 0.35 + i * 0.04, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${s.color}CC, ${s.color})` }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

function PipelineOverview() {
  const stages = [
    { label: 'Discovery', count: 3, pct: 60, color: '#64748B' },
    { label: 'Proposal', count: 2, pct: 40, color: '#2563EB' },
    { label: 'Negotiation', count: 2, pct: 40, color: '#D97706' },
    { label: 'Contract', count: 1, pct: 20, color: '#4F46E5' },
    { label: 'Closed Won', count: 1, pct: 20, color: '#059669' },
    { label: 'Closed Lost', count: 0, pct: 0, color: '#DC2626' },
  ]
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="col-span-7 rounded-3xl p-8"
      style={GLASS_CARD}
    >
      <div className="flex items-start justify-between mb-8">
        <div>
          <h3 className={`${serif.className} text-[22px] font-normal text-slate-900 tracking-tight`}>Pipeline overview</h3>
          <p className="text-[13px] text-slate-500 mt-1">Opportunities by stage</p>
        </div>
        <a className="text-[12px] font-medium cursor-pointer" style={{ color: '#1E3A8A' }}>Open Pipelines →</a>
      </div>
      <div className="space-y-4">
        {stages.map((s, i) => (
          <div key={s.label} className="flex items-center gap-4">
            <div className="w-28 text-[12px] font-medium text-slate-700">{s.label}</div>
            <div className="flex-1 h-7 bg-slate-100/80 rounded-lg overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${s.pct}%` }}
                transition={{ delay: 0.35 + i * 0.06, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-lg flex items-center justify-end pr-2.5"
                style={{ background: `linear-gradient(90deg, ${s.color}DD, ${s.color})` }}
              >
                {s.pct > 12 && <span className="text-[11px] font-bold text-white">{s.count}</span>}
              </motion.div>
              {s.pct <= 12 && s.count > 0 && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-600">{s.count}</span>}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function TopPerformers() {
  const people = [
    { rank: 1, name: 'Abdelrhman Elwakeel', role: 'CEO & Founder', avatar: 'AE', tint: 'linear-gradient(135deg, #F59E0B, #EC4899)', deals: 4, value: 'AED 128K' },
    { rank: 2, name: 'Ahmed Noor', role: 'Junior Sales Rep', avatar: 'AN', tint: 'linear-gradient(135deg, #3B82F6, #6366F1)', deals: 3, value: 'AED 92K' },
    { rank: 3, name: 'Layla Mahmoud', role: 'Account Manager', avatar: 'LM', tint: 'linear-gradient(135deg, #10B981, #14B8A6)', deals: 3, value: 'AED 78K' },
    { rank: 4, name: 'Omar Hassan', role: 'Senior Sales Rep', avatar: 'OH', tint: 'linear-gradient(135deg, #8B5CF6, #A855F7)', deals: 2, value: 'AED 54K' },
  ]
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
      className="rounded-3xl p-8"
      style={GLASS_CARD}
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className={`${serif.className} text-[22px] font-normal text-slate-900 tracking-tight`}>Top performers</h3>
          <p className="text-[13px] text-slate-500 mt-1">Revenue closed this quarter</p>
        </div>
        <a className="text-[12px] font-medium cursor-pointer" style={{ color: '#1E3A8A' }}>View team →</a>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {people.map((p, i) => (
          <motion.div
            key={p.rank}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.08 }}
            whileHover={{ y: -2 }}
            className="relative rounded-2xl p-5 cursor-pointer"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.8), rgba(255,255,255,0.4))',
              border: '1px solid rgba(255,255,255,0.8)',
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                p.rank === 1 ? 'text-amber-900' : p.rank === 2 ? 'text-slate-700' : p.rank === 3 ? 'text-orange-900' : 'text-slate-500'
              }`} style={{
                background: p.rank === 1 ? 'linear-gradient(135deg, #FCD34D, #F59E0B)' :
                            p.rank === 2 ? 'linear-gradient(135deg, #E2E8F0, #CBD5E1)' :
                            p.rank === 3 ? 'linear-gradient(135deg, #FDBA74, #F97316)' :
                            '#F1F5F9',
              }}>{p.rank}</div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[11px] font-bold" style={{ background: p.tint }}>{p.avatar}</div>
            </div>
            <div className="text-[13px] font-semibold text-slate-900 truncate">{p.name}</div>
            <div className="text-[11px] text-slate-500 truncate">{p.role}</div>
            <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between">
              <span className={`${serif.className} text-[18px] font-medium text-slate-900 tabular-nums`}>{p.value}</span>
              <span className="text-[10px] text-slate-500">{p.deals} deals</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

function NeedsAttention() {
  const items = [
    { severity: 'high' as const, title: 'TKT-0003 — Invoice PDF bug', meta: 'Assigned to you · Overdue 2h' },
    { severity: 'medium' as const, title: 'INV-0042 overdue', meta: 'Al Futtaim · AED 26,250' },
    { severity: 'low' as const, title: 'Proposal PRP-0004 review', meta: 'DAMAC · Sent 3d ago' },
  ]
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="col-span-5 rounded-3xl p-8"
      style={GLASS_CARD}
    >
      <div className="flex items-start justify-between mb-6">
        <h3 className={`${serif.className} text-[22px] font-normal text-slate-900 tracking-tight flex items-center gap-2`}>
          Needs attention
          <motion.span
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-flex items-center px-2 h-5 rounded-md bg-red-50 text-red-700 text-[10px] font-semibold not-italic"
            style={{ fontFamily: 'ui-sans-serif, -apple-system, sans-serif' }}
          >3</motion.span>
        </h3>
        <a className="text-[12px] font-medium cursor-pointer" style={{ color: '#1E3A8A' }}>View all →</a>
      </div>
      <div className="space-y-3">
        {items.map((it, i) => (
          <AttentionRow key={i} {...it} delay={0.45 + i * 0.08} />
        ))}
      </div>
    </motion.div>
  )
}

function AttentionRow({ severity, title, meta, delay }: { severity: 'high'|'medium'|'low'; title: string; meta: string; delay: number }) {
  const cfg = {
    high: { Icon: AlertTriangle, chipBg: 'rgba(220, 38, 38, 0.08)', icon: '#DC2626', bar: '#DC2626' },
    medium: { Icon: Clock, chipBg: 'rgba(217, 119, 6, 0.08)', icon: '#D97706', bar: '#D97706' },
    low: { Icon: Circle, chipBg: 'rgba(37, 99, 235, 0.08)', icon: '#2563EB', bar: '#2563EB' },
  }[severity]
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      whileHover={{ x: 2 }}
      className="group relative flex items-start gap-3 p-3 rounded-xl cursor-pointer overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.8)' }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ background: cfg.bar }} />
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: cfg.chipBg, color: cfg.icon }}>
        <cfg.Icon className="w-4 h-4" strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-slate-900 truncate">{title}</div>
        <div className="text-[11px] text-slate-500 mt-0.5">{meta}</div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" strokeWidth={1.5} />
    </motion.div>
  )
}

function RecentActivity() {
  const acts = [
    { who: 'Omar Hassan', what: 'moved', target: 'Al Futtaim deal', to: 'Negotiation', when: '2m ago', tint: 'linear-gradient(135deg, #3B82F6, #6366F1)', avatar: 'OH' },
    { who: 'Layla Mahmoud', what: 'created invoice', target: 'INV-0043', when: '14m ago', tint: 'linear-gradient(135deg, #10B981, #059669)', avatar: 'LM' },
    { who: 'Sarah Al-Rashid', what: 'updated', target: 'DAMAC opportunity', when: '1h ago', tint: 'linear-gradient(135deg, #8B5CF6, #6366F1)', avatar: 'SR' },
    { who: 'System', what: 'auto-assigned', target: 'Lead #15 → Omar', when: '3h ago', tint: 'linear-gradient(135deg, #64748B, #475569)', avatar: '⚙' },
    { who: 'Abdelrhman', what: 'approved', target: 'Contract CTR-0005', when: '5h ago', tint: 'linear-gradient(135deg, #F59E0B, #F97316)', avatar: 'AE' },
    { who: 'Ahmed Noor', what: 'added task', target: 'Follow up: DAMAC', when: '7h ago', tint: 'linear-gradient(135deg, #14B8A6, #0EA5E9)', avatar: 'AN' },
  ]
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.45 }}
      className="col-span-7 rounded-3xl p-8"
      style={GLASS_CARD}
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className={`${serif.className} text-[22px] font-normal text-slate-900 tracking-tight`}>Recent activity</h3>
          <p className="text-[13px] text-slate-500 mt-1">Across your workspace</p>
        </div>
        <a className="text-[12px] font-medium cursor-pointer" style={{ color: '#1E3A8A' }}>See all →</a>
      </div>
      <div className="space-y-4">
        {acts.map((a, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.06 }}
            className="flex items-start gap-3 group"
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0" style={{ background: a.tint }}>{a.avatar}</div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-slate-700 leading-5">
                <span className="font-semibold text-slate-900">{a.who}</span>{' '}
                <span className="text-slate-500">{a.what}</span>{' '}
                <a className="font-medium cursor-pointer" style={{ color: '#1E3A8A' }}>{a.target}</a>
                {a.to && <> <span className="text-slate-500">to</span> <span className="font-semibold text-slate-900">{a.to}</span></>}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">{a.when}</div>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition mt-1" strokeWidth={1.5} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

function AiBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.55 }}
      whileHover={{ scale: 1.005 }}
      className="relative rounded-3xl p-7 overflow-hidden flex items-center justify-between"
      style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 50%, #4338CA 100%)',
        boxShadow: '0 4px 16px rgba(30, 58, 138, 0.15), 0 20px 60px rgba(30, 58, 138, 0.2)',
      }}
    >
      {/* Shimmer sweep */}
      <motion.div
        animate={{ x: ['-20%', '120%'] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-y-0 w-1/3"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)', transform: 'skewX(-20deg)' }}
      />
      {/* Gold accent orb */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{ background: '#D4AF37' }} />

      <div className="relative flex items-center gap-5">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur"
          style={{ background: 'rgba(212, 175, 55, 0.15)', border: '1px solid rgba(212, 175, 55, 0.3)' }}
        >
          <Sparkles className="w-5 h-5" strokeWidth={1.5} style={{ color: '#D4AF37' }} />
        </motion.div>
        <div className="text-white">
          <div className={`${serif.className} text-[18px] font-medium`}>Enable AI lead scoring</div>
          <div className="text-[12px] text-white/70 mt-1">Let Claude auto-rank your 15 open leads by conversion likelihood.</div>
        </div>
      </div>
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        className="relative h-10 px-5 rounded-xl text-[13px] font-semibold transition"
        style={{
          background: 'linear-gradient(180deg, #D4AF37, #B8952B)',
          color: '#0F172A',
          boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
        }}
      >
        Turn on
      </motion.button>
    </motion.div>
  )
}

/* =================== BUTTONS =================== */

function LuxBtn({ icon: Icon, children }: { icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      className="h-10 px-4 rounded-xl text-[12px] font-medium text-slate-700 flex items-center gap-1.5 transition"
      style={{
        background: 'rgba(255,255,255,0.7)',
        border: '1px solid rgba(255,255,255,0.9)',
        boxShadow: '0 1px 2px rgba(15,23,42,0.03), 0 4px 12px rgba(15,23,42,0.04)',
      }}
    >
      {Icon && <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />}
      {children}
    </motion.button>
  )
}

function LuxPrimaryBtn({ icon: Icon, children }: { icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      className="h-10 px-5 rounded-xl text-[12px] font-semibold text-white flex items-center gap-1.5 transition"
      style={{
        background: 'linear-gradient(180deg, #1E3A8A 0%, #1E293B 100%)',
        boxShadow: '0 2px 4px rgba(30, 58, 138, 0.2), 0 8px 24px rgba(30, 58, 138, 0.15), inset 0 1px 0 rgba(255,255,255,0.15)',
      }}
    >
      {Icon && <Icon className="w-3.5 h-3.5" strokeWidth={2} />}
      {children}
    </motion.button>
  )
}
