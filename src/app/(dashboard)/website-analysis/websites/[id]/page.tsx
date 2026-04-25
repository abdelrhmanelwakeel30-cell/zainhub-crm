import { redirect } from 'next/navigation'

export default async function WebsiteDetailIndex({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/website-analysis/websites/${id}/overview`)
}
