import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

export function EmptyStateNoWebsite() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 p-12 text-center">
      <Globe className="mb-4 h-10 w-10 text-muted-foreground" aria-hidden="true" />
      <h3 className="mb-1 text-lg font-semibold">Add your first website</h3>
      <p className="mb-4 max-w-md text-sm text-muted-foreground">
        Register a website to start tracking its analytics, conversions, and SEO performance.
      </p>
      <Link href="/website-analysis/websites/new" className={cn(buttonVariants())}>
        Add website
      </Link>
    </div>
  )
}
