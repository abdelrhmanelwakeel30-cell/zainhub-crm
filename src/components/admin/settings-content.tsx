'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Settings, Palette, Bell, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { SecuritySection } from '@/components/admin/security-section'
import { BillingSection } from '@/components/admin/billing-section'

interface TenantSettings {
  name?: string
  primaryColor?: string
  secondaryColor?: string
  defaultCurrency?: string
  defaultLanguage?: string
  timezone?: string
  taxRegistrationNumber?: string
  address?: string
  phone?: string
  email?: string
  website?: string
}

type SettingRow = { key: string; value: unknown }

export function SettingsContent() {
  const t = useTranslations('admin')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => fetch('/api/admin/settings').then(r => r.json()),
  })

  const tenant: TenantSettings = data?.data?.tenant ?? {}
  const settingsRows: SettingRow[] = data?.data?.settings ?? []
  const notifPref = settingsRows.find((s) => s.key === 'notifications')?.value as
    | { email?: boolean; push?: boolean }
    | undefined

  const [tenantName, setTenantName] = useState('')
  const [currency, setCurrency] = useState('AED')
  const [timezone, setTimezone] = useState('Asia/Dubai')
  const [language, setLanguage] = useState('en')
  const [primaryColor, setPrimaryColor] = useState('#2563eb')
  const [secondaryColor, setSecondaryColor] = useState('#1e40af')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)

  // Seed editable form fields from async-loaded tenant data (the form must
  // remain user-editable, so deriving from props directly isn't an option).
  // Synchronous setState here is intentional and bounded by the deps.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (tenant.name) setTenantName(tenant.name)
    if (tenant.defaultCurrency) setCurrency(tenant.defaultCurrency)
    if (tenant.timezone) setTimezone(tenant.timezone)
    if (tenant.defaultLanguage) setLanguage(tenant.defaultLanguage)
    if (tenant.primaryColor) setPrimaryColor(tenant.primaryColor)
    if (tenant.secondaryColor) setSecondaryColor(tenant.secondaryColor)
  }, [tenant.name, tenant.defaultCurrency, tenant.timezone, tenant.defaultLanguage, tenant.primaryColor, tenant.secondaryColor])

  useEffect(() => {
    if (notifPref?.email != null) setEmailNotifications(!!notifPref.email)
    if (notifPref?.push != null) setPushNotifications(!!notifPref.push)
  }, [notifPref?.email, notifPref?.push])
  /* eslint-enable react-hooks/set-state-in-effect */

  const patchTenant = useMutation({
    mutationFn: (payload: TenantSettings) =>
      fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(r => {
        if (!r.ok) throw new Error('Failed to save settings')
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] })
      toast.success(t('settingsSaved'))
    },
    onError: () => toast.error(t('settingsSaveFailed')),
  })

  const putSetting = useMutation({
    mutationFn: (payload: { key: string; value: unknown }) =>
      fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(r => {
        if (!r.ok) throw new Error('Failed to save preferences')
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] })
      toast.success(t('settingsSaved'))
    },
    onError: () => toast.error(t('settingsSaveFailed')),
  })

  const saveGeneral = () =>
    patchTenant.mutate({ name: tenantName, defaultCurrency: currency, timezone, defaultLanguage: language })

  const saveAppearance = () =>
    patchTenant.mutate({ primaryColor, secondaryColor })

  const saveNotifications = () =>
    putSetting.mutate({ key: 'notifications', value: { email: emailNotifications, push: pushNotifications } })

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title={t('settings')} description={t('settingsDesc')} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>{t('generalSettings')}</CardTitle>
                <CardDescription>{t('generalSettingsDesc')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tenantName">{t('tenantName')}</Label>
              <Input
                id="tenantName"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">{t('defaultCurrency')}</Label>
              <Select value={currency} onValueChange={(v) => v && setCurrency(v)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="SAR">SAR - Saudi Riyal</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  <SelectItem value="EGP">EGP - Egyptian Pound</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">{t('defaultLanguage')}</Label>
              <Select value={language} onValueChange={(v) => v && setLanguage(v)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">العربية</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">{t('timezone')}</Label>
              <Select value={timezone} onValueChange={(v) => v && setTimezone(v)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Dubai">Asia/Dubai (GMT+4)</SelectItem>
                  <SelectItem value="Asia/Riyadh">Asia/Riyadh (GMT+3)</SelectItem>
                  <SelectItem value="Africa/Cairo">Africa/Cairo (GMT+2)</SelectItem>
                  <SelectItem value="Europe/London">Europe/London (GMT+0)</SelectItem>
                  <SelectItem value="America/New_York">America/New_York (GMT-5)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" className="mt-2" onClick={saveGeneral} disabled={patchTenant.isPending || isLoading}>
              {patchTenant.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {t('saveChanges')}
            </Button>
          </CardContent>
        </Card>

        {/* Appearance */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                  <Palette className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>{t('appearance')}</CardTitle>
                  <CardDescription>{t('appearanceDesc')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">{t('primaryColor')}</Label>
                  <div className="flex items-center gap-2">
                    <input id="primaryColor" type="color" aria-label={t('primaryColor')} value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-9 w-12 rounded border bg-transparent p-0.5" />
                    <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="font-mono text-xs" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">{t('secondaryColor')}</Label>
                  <div className="flex items-center gap-2">
                    <input id="secondaryColor" type="color" aria-label={t('secondaryColor')} value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="h-9 w-12 rounded border bg-transparent p-0.5" />
                    <Input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="font-mono text-xs" />
                  </div>
                </div>
              </div>
              <Button size="sm" onClick={saveAppearance} disabled={patchTenant.isPending || isLoading}>
                {patchTenant.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                {t('saveChanges')}
              </Button>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>{t('notificationPrefs')}</CardTitle>
                  <CardDescription>{t('notificationPrefsDesc')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t('emailNotifications')}</p>
                  <p className="text-xs text-muted-foreground">{t('emailNotificationsDesc')}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={emailNotifications}
                  aria-label={t('emailNotifications')}
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    emailNotifications ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${emailNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t('pushNotifications')}</p>
                  <p className="text-xs text-muted-foreground">{t('pushNotificationsDesc')}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={pushNotifications}
                  aria-label={t('pushNotifications')}
                  onClick={() => setPushNotifications(!pushNotifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    pushNotifications ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${pushNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <Button size="sm" onClick={saveNotifications} disabled={putSetting.isPending || isLoading}>
                {putSetting.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                {t('saveChanges')}
              </Button>
            </CardContent>
          </Card>

          {/* Security — TOTP two-factor auth */}
          <SecuritySection />

          {/* Billing — Stripe subscription (gated) */}
          <BillingSection />
        </div>
      </div>
    </div>
  )
}
