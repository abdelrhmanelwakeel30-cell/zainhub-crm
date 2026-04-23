'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

interface ZainHubLogoProps {
  variant?: 'icon' | 'full' | 'login'
  className?: string
}

function LogoImage({ size, rounded }: { size: number; rounded: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden shrink-0',
        'bg-slate-900 shadow-md',
        'ring-1 ring-black/5 dark:ring-white/10',
        rounded
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src="/images/zainhub-logo-icon.png"
        alt="Zain Hub"
        fill
        sizes={`${size * 2}px`}
        quality={100}
        loading="eager"
        priority
        className="object-cover"
      />
    </div>
  )
}

export function ZainHubLogo({ variant = 'icon', className }: ZainHubLogoProps) {
  if (variant === 'login') {
    return (
      <div className={cn('flex flex-col items-center', className)}>
        <div className="relative">
          <div className="absolute -inset-3 rounded-3xl bg-blue-500/15 blur-2xl" />
          <div className="relative">
            <LogoImage size={88} rounded="rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'full') {
    return (
      <div className={cn('flex items-center gap-2.5', className)}>
        <LogoImage size={34} rounded="rounded-lg" />
        <span className="font-semibold text-lg tracking-tight">Zain Hub</span>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <LogoImage size={34} rounded="rounded-lg" />
    </div>
  )
}
