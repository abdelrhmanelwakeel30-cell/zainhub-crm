import { getApiSession } from '@/lib/auth-utils'
import { NextResponse } from 'next/server'

export async function getSession() {
  return await getApiSession()
}

export function unauthorized() {
  return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
}

export function notFound(msg = 'Not found') {
  return NextResponse.json({ success: false, error: msg }, { status: 404 })
}

export function badRequest(msg: string) {
  return NextResponse.json({ success: false, error: msg }, { status: 400 })
}

export function serverError(err: unknown) {
  const msg = err instanceof Error ? err.message : 'Internal server error'
  console.error('[API Error]', err)
  return NextResponse.json({ success: false, error: msg }, { status: 500 })
}

export function ok<T>(data: T, extra?: Record<string, unknown>) {
  return NextResponse.json({ success: true, data, ...extra })
}

export function paginatedOk<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
) {
  return NextResponse.json({
    success: true,
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}

/** Parse pagination params from URL */
export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20')))
  return { page, pageSize, skip: (page - 1) * pageSize }
}

/** Convert Prisma Decimal fields to numbers recursively */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializeDecimals(obj: any): any {
  if (obj === null || obj === undefined) return obj
  if (typeof obj === 'object' && typeof obj.toNumber === 'function') return obj.toNumber()
  if (Array.isArray(obj)) return obj.map(serializeDecimals)
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const key of Object.keys(obj)) {
      result[key] = serializeDecimals(obj[key])
    }
    return result
  }
  return obj
}
