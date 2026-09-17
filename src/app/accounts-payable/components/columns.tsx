"use client"

import type { ColumnDef } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

import { categories, priorities, statuses, branches } from "../data/data"
import type { Task } from "../data/schema"
import { DataTableColumnHeader } from "./data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"

export const columns: ColumnDef<Task>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px] cursor-pointer"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label={`Select invoice ${row.original.id}`}
        className="translate-y-[2px] cursor-pointer"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    meta: { className: "ap-table__select" },
  },
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="No:" />
    ),
    cell: ({ row }) => (
      <div className="w-[72px] font-medium text-xs">{row.getValue("id")}</div>
    ),
    enableHiding: false,
    meta: { className: "ap-table__id" },
  },
  {
    accessorKey: "vendor",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Vendor" />
    ),
    cell: ({ row }) => {
      const vendor = row.getValue("vendor") as string
      return (
        <div className="flex space-x-2">
          <span className="truncate font-medium text-sm">
            {vendor || "—"}
          </span>
        </div>
      )
    },
    meta: { className: "ap-table__vendor" },
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <span className="w-full truncate text-sm">
            {row.getValue("title")}
          </span>
        </div>
      )
    },
    meta: { className: "ap-table__description" },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Amount" />
    ),
    cell: ({ row }) => {
      const amount = row.getValue("amount") as number
      return (
        <div className="flex w-[90px] items-center font-medium text-sm tabular-nums">
          {amount != null
            ? new Intl.NumberFormat("en-PH", {
                style: "currency",
                currency: "PHP",
                maximumFractionDigits: 0,
              }).format(amount)
            : "—"}
        </div>
      )
    },
  },
  {
    accessorKey: "dueDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Due Date" />
    ),
    cell: ({ row }) => {
      const dueDate = row.getValue("dueDate") as string
      return (
        <div className="flex w-[90px] items-center text-sm">
          {dueDate || "—"}
        </div>
      )
    },
    // Hidden on mobile — shown from md up
    meta: { className: "ap-table__due-date" },
  },
  {
    accessorKey: "branch",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Branch" />
    ),
    cell: ({ row }) => {
      const branchVal = row.getValue("branch") as string
      const branch = branches.find((b) => b.value === branchVal)
      return (
        <div className="flex w-[90px] items-center text-sm text-muted-foreground">
          {branch?.label || branchVal || "—"}
        </div>
      )
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
    // Hidden on mobile — shown from lg up
    meta: { className: "ap-table__branch" },
  },
  {
    accessorKey: "category",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Category" />
    ),
    cell: ({ row }) => {
      const category = categories.find(
        (cat) => cat.value === row.getValue("category")
      )
      if (!category) return null
      return (
        <div className="flex w-[110px] items-center">
          <Badge variant="outline" className="text-xs whitespace-nowrap">
            {category.label}
          </Badge>
        </div>
      )
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
    // Hidden on mobile — shown from xl up
    meta: { className: "ap-table__category" },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = statuses.find(
        (status) => status.value === row.getValue("status")
      )
      if (!status) return null
      return (
        <div className="flex w-[120px] items-center">
          {status.icon && (
            <status.icon className="mr-1.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <span className="text-xs sm:text-sm">{status.label}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
    meta: { className: "ap-table__status" },
  },
  {
    accessorKey: "priority",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Priority" />
    ),
    cell: ({ row }) => {
      const priority = priorities.find(
        (priority) => priority.value === row.getValue("priority")
      )
      if (!priority) return null

      const priorityColors = {
        urgent: "border-red-700 text-red-700 dark:text-red-400",
        high: "border-orange-500 text-orange-700 dark:text-orange-400",
        medium: "border-blue-500 text-blue-700 dark:text-blue-400",
        low: "border-gray-500 text-gray-700 dark:text-gray-400",
      }

      return (
        <div className="flex items-center">
          <Badge
            variant="outline"
            className={cn(
              "pl-2 text-xs whitespace-nowrap",
              priorityColors[priority.value as keyof typeof priorityColors]
            )}
          >
            {priority.label}
          </Badge>
        </div>
      )
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
    // Hidden below sm
    meta: { className: "ap-table__priority" },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
    meta: { className: "ap-table__actions" },
  },
]
