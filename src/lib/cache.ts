import { unstable_cache, revalidateTag } from 'next/cache'

/**
 * Tenant-scoped cache wrapper around Next.js `unstable_cache`.
 *
 * Convention: the FIRST argument of the wrapped function is always `tenantId`.
 * Tags are auto-suffixed with `:<tenantId>` so cache invalidation is per-tenant.
 *
 * @example
 *   const getStats = cached(
 *     async (tenantId: string) => prisma.lead.count({ where: { tenantId } }),
 *     ['dashboard-stats'],
 *     { revalidate: 60, tags: ['dashboard'] }
 *   )
 *   const stats = await getStats(session.user.tenantId)
 *
 *   // Invalidate after a mutation:
 *   await invalidate('dashboard', session.user.tenantId)
 */
export function cached<TArgs extends [tenantId: string, ...rest: unknown[]], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  keyParts: string[],
  opts: { revalidate: number; tags?: string[] } = { revalidate: 60 },
): (...args: TArgs) => Promise<TReturn> {
  return ((...args: TArgs) => {
    const tenantId = args[0]
    const tagList = (opts.tags ?? keyParts).map((t) => `${t}:${tenantId}`)
    return unstable_cache(() => fn(...args), [...keyParts, ...args.map(String)], {
      tags: tagList,
      revalidate: opts.revalidate,
    })()
  }) as (...args: TArgs) => Promise<TReturn>
}

export function tagFor(scope: string, tenantId: string): string {
  return `${scope}:${tenantId}`
}

export async function invalidate(scope: string, tenantId: string, profile: string = 'default'): Promise<void> {
  // Next.js 16 changed `revalidateTag` to require a cache-life profile name
  // (the second argument). 'default' uses the default cache profile.
  revalidateTag(tagFor(scope, tenantId), profile)
}
