import { QueryProvider } from '@/components/providers/query-provider'
import { Toaster } from '@/components/ui/sonner'
import { PortalAuthProvider } from '@/components/portal/portal-auth-provider'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <PortalAuthProvider>
        {children}
        <Toaster position="top-right" richColors />
      </PortalAuthProvider>
    </QueryProvider>
  )
}
