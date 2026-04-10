import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
            <FileQuestion className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-6xl font-bold text-muted-foreground/30">404</p>
          <h1 className="text-2xl font-bold">Page Not Found</h1>
          <p className="text-muted-foreground text-sm">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 h-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
