"use client"

import * as React from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { DataTablePagination } from "./data-table-pagination"
import { DataTableToolbar } from "./data-table-toolbar"
import { BulkActionsBar } from "./bulk-actions-bar"
import type { Task } from "../data/schema"
import type { BulkActionPayload } from "../utils/bulk-actions"

interface DataTableProps<TData extends Task, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onAddTask?: (task: Task) => void
  onBulkAction?: (payload: BulkActionPayload, selectedIds: string[]) => void
}

export function DataTable<TData extends Task, TValue>({
  columns,
  data,
  onAddTask,
  onBulkAction,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    // Stable row IDs keyed by invoice ID so selection survives sort/filter
    getRowId: (row) => row.id,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  // Derive selected invoices from ALL rows (not just current page)
  const selectedInvoices = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original)

  const handleBulkAction = (payload: BulkActionPayload) => {
    const selectedIds = selectedInvoices.map((inv) => inv.id)
    onBulkAction?.(payload, selectedIds)
    // Reset after action
    table.resetRowSelection()
  }

  const handleClearSelection = () => {
    table.resetRowSelection()
  }

  return (
    <div className="ap-table space-y-4">
      <DataTableToolbar table={table} onAddTask={onAddTask} />

      {/* Bulk actions bar — visible when at least one row is selected */}
      {selectedInvoices.length > 0 && (
        <BulkActionsBar
          selectedInvoices={selectedInvoices}
          onAction={handleBulkAction}
          onClearSelection={handleClearSelection}
        />
      )}

      <div className="rounded-md border">
        <Table className="table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  // Apply responsive visibility class from column meta
                  const metaClass = (header.column.columnDef.meta as { className?: string } | undefined)?.className
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={metaClass}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={
                    row.getIsSelected()
                      ? "bg-primary/5 border-l-2 border-l-primary"
                      : undefined
                  }
                >
                  {row.getVisibleCells().map((cell) => {
                    const metaClass = (cell.column.columnDef.meta as { className?: string } | undefined)?.className
                    return (
                      <TableCell key={cell.id} className={metaClass}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  )
}
