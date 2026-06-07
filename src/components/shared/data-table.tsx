'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  ColumnFiltersState,
  RowSelectionState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
  pageSize?: number
  showPagination?: boolean
  showSearch?: boolean
  emptyMessage?: string
  onRowClick?: (row: TData) => void
  toolbar?: React.ReactNode
  isLoading?: boolean
  /** C-3: opt-in row selection + bulk action bar. */
  enableSelection?: boolean
  /** Stable row id (defaults to a row `id` field). Required for selection to survive re-renders. */
  getRowId?: (row: TData) => string
  /** Render bulk actions when ≥1 row is selected. Receives selected ids + a clear callback. */
  renderBulkActions?: (selectedIds: string[], clear: () => void) => React.ReactNode
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Search...',
  pageSize = 10,
  showPagination = true,
  showSearch = true,
  emptyMessage = 'No results found.',
  onRowClick,
  toolbar,
  isLoading = false,
  enableSelection = false,
  getRowId,
  renderBulkActions,
}: DataTableProps<TData, TValue>) {
  const tc = useTranslations('common')
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  // C-3: prepend a checkbox column when selection is enabled.
  const selectionColumn: ColumnDef<TData, TValue> = {
    id: '__select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
        onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        aria-label="Select all"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(v) => row.toggleSelected(!!v)}
        aria-label="Select row"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    enableSorting: false,
    size: 40,
  }
  const tableColumns = enableSelection ? [selectionColumn, ...columns] : columns

  const table = useReactTable({
    data,
    columns: tableColumns,
    ...(getRowId ? { getRowId: (row: TData) => getRowId(row) } : {}),
    enableRowSelection: enableSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      rowSelection,
    },
    initialState: {
      pagination: { pageSize },
    },
  })

  const selectedIds = Object.keys(rowSelection).filter((k) => rowSelection[k])

  return (
    <div className="space-y-4">
      {/* C-3: bulk action bar */}
      {enableSelection && selectedIds.length > 0 && renderBulkActions && (
        <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-2.5">
          <span className="text-sm font-medium">{selectedIds.length} selected</span>
          <div className="flex items-center gap-2">
            {renderBulkActions(selectedIds, () => setRowSelection({}))}
          </div>
        </div>
      )}
      {/* Toolbar */}
      {(showSearch || toolbar) && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {showSearch && (
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="ps-9"
              />
            </div>
          )}
          {toolbar && <div className="flex items-center gap-2">{toolbar}</div>}
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      'text-xs font-medium',
                      header.column.getCanSort() && 'cursor-pointer select-none'
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <>
                          {header.column.getIsSorted() === 'asc' && <ArrowUp className="h-3 w-3" />}
                          {header.column.getIsSorted() === 'desc' && <ArrowDown className="h-3 w-3" />}
                          {!header.column.getIsSorted() && <ArrowUpDown className="h-3 w-3 opacity-30" />}
                        </>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {tableColumns.map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  className={cn(onRowClick && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900')}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={tableColumns.length} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <p className="text-sm">{emptyMessage}</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length > 0
              ? `${tc('showing')} ${table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} - ${Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length
                )} ${tc('of')} ${table.getFilteredRowModel().rows.length} ${tc('results')}`
              : tc('noResults')}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="First page"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="h-8 w-8"
            >
              <ChevronsLeft className="h-4 w-4 rtl:rotate-180" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous page"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            </Button>
            <span className="text-sm font-medium">
              {table.getState().pagination.pageIndex + 1} / {Math.max(1, table.getPageCount())}
            </span>
            <Button
              variant="outline"
              size="icon"
              aria-label="Next page"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Last page"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="h-8 w-8"
            >
              <ChevronsRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
