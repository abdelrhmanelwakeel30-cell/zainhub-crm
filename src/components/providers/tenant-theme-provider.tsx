'use client'

import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

/**
 * Converts a hex color to HSL values string for CSS custom properties.
 * e.g. "#1E40AF" → "224 76% 40%"
 */
function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return '224 76% 40%' // fallback

  let r = parseInt(result[1], 16) / 255
  let g = parseInt(result[2], 16) / 255
  let b = parseInt(result[3], 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

/**
 * Injects tenant brand colors as CSS custom properties on :root.
 * These can be consumed anywhere via var(--tenant-primary) etc.
 */
export function TenantThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()

  useEffect(() => {
    if (!session?.user?.primaryColor) return

    const root = document.documentElement
    root.style.setProperty('--tenant-primary', session.user.primaryColor)
    root.style.setProperty('--tenant-secondary', session.user.secondaryColor)
    root.style.setProperty('--tenant-primary-hsl', hexToHsl(session.user.primaryColor))
    root.style.setProperty('--tenant-secondary-hsl', hexToHsl(session.user.secondaryColor))
  }, [session?.user?.primaryColor, session?.user?.secondaryColor])

  return <>{children}</>
}
