import { PortalShell } from '@/components/portal/portal-shell'
import { FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function PortalDocumentsPage() {
  return (
    <PortalShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            Documents
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Contracts, proposals, and project files shared with you.
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center py-16 gap-3 text-center">
            <FileText className="h-12 w-12 text-slate-300" />
            <p className="text-slate-500">No documents available yet.</p>
          </CardContent>
        </Card>
      </div>
    </PortalShell>
  )
}
