// Prisma type re-exports — uncomment once `npx prisma generate` runs successfully
// export type {
//   User, Tenant, Company, Contact, Lead, Opportunity,
//   Pipeline, PipelineStage, Role, Permission,
//   LeadSource, Service, ServiceCategory
// } from '@prisma/client'

// Session types
export interface SessionUser {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar?: string | null
  tenantId: string
  tenantName: string
  tenantSlug: string
  roles: string[]
  permissions: string[]
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Filter types
export interface FilterOption {
  label: string
  value: string
  count?: number
}

export interface SortOption {
  field: string
  direction: 'asc' | 'desc'
}

export interface DataTableFilters {
  search?: string
  page: number
  pageSize: number
  sort?: SortOption
  filters: Record<string, string | string[]>
}

// Dashboard types
export interface KPIMetric {
  label: string
  value: number | string
  change?: number
  changeType?: 'increase' | 'decrease' | 'neutral'
  icon?: string
  prefix?: string
  suffix?: string
}

export interface ChartDataPoint {
  name: string
  value: number
  [key: string]: string | number
}

// Navigation types
export interface NavItem {
  titleKey: string
  href: string
  icon: string
  badge?: number
  children?: NavItem[]
  permission?: string
}

export interface NavGroup {
  titleKey: string
  items: NavItem[]
}
