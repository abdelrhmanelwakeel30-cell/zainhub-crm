import { redirect } from 'next/navigation'

/**
 * F-006: /admin was returning a 404 because no index page existed.
 * Redirect to /admin/users as the canonical admin landing page.
 */
export default function AdminIndexPage() {
  redirect('/admin/users')
}
