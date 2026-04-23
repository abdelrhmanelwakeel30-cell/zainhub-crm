import type { Metadata } from 'next'
import { Geist, Geist_Mono, Noto_Naskh_Arabic, Playfair_Display } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { ThemeProvider } from 'next-themes'
import { SessionProvider } from '@/components/providers/session-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { TenantThemeProvider } from '@/components/providers/tenant-theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { localeDirections } from '@/i18n/config'
import type { Locale } from '@/i18n/config'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const notoNaskhArabic = Noto_Naskh_Arabic({
  variable: '--font-arabic',
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
})

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  title: 'Zain Hub BOS — Business Operating System',
  description: 'Complete business management platform by Zain Hub AI Solutions — zainhub.ae',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale() as Locale
  const messages = await getMessages()
  const dir = localeDirections[locale] || 'ltr'

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${geistSans.variable} ${geistMono.variable} ${notoNaskhArabic.variable} ${playfair.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <SessionProvider>
          <NextIntlClientProvider messages={messages}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <QueryProvider>
                <TenantThemeProvider>
                  <TooltipProvider>
                    {children}
                    <Toaster position="top-right" richColors />
                  </TooltipProvider>
                </TenantThemeProvider>
              </QueryProvider>
            </ThemeProvider>
          </NextIntlClientProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
