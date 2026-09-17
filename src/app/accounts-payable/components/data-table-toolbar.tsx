"use client"

import * as React from "react"
import type { Table } from "@tanstack/react-table"
import { RefreshCcw, SlidersHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTableViewOptions } from "@/app/tasks/components/data-table-view-options"
import { AddTaskModal } from "./add-task-modal"

import { categories, priorities, statuses } from "../data/data"
import type { Task } from "../data/schema"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  onAddTask?: (task: Task) => void
}

export function DataTableToolbar<TData>({
  table,
  onAddTask,
}: DataTableToolbarProps<TData>) {
  const [filtersOpen, setFiltersOpen] = React.useState(false)
  const isFiltered = table.getState().columnFilters.length > 0

  const handleStatusChange = (value: string) => {
    const column = table.getColumn("status")
    if (value === "all") {
      column?.setFilterValue(undefined)
    } else {
      column?.setFilterValue(value)
    }
  }

  const handleCategoryChange = (value: string) => {
    const column = table.getColumn("category")
    if (value === "all") {
      column?.setFilterValue(undefined)
    } else {
      column?.setFilterValue(value)
    }
  }

  const handlePriorityChange = (value: string) => {
    const column = table.getColumn("priority")
    if (value === "all") {
      column?.setFilterValue(undefined)
    } else {
      column?.setFilterValue(value)
    }
  }

  const statusFilter = table.getColumn("status")?.getFilterValue() as string | undefined
  const categoryFilter = table.getColumn("category")?.getFilterValue() as string | undefined
  const priorityFilter = table.getColumn("priority")?.getFilterValue() as string | undefined

  const filterSelects = (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {/* Status Filter */}
      <Select value={statusFilter || "all"} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-full cursor-pointer">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="cursor-pointer">All Status</SelectItem>
          {statuses.map((status) => (
            <SelectItem
              key={status.value}
              value={status.value}
              className="cursor-pointer"
            >
              <div className="flex items-center">
                {status.icon && (
                  <status.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                )}
                {status.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Category Filter */}
      <Select value={categoryFilter || "all"} onValueChange={handleCategoryChange}>
        <SelectTrigger className="w-full cursor-pointer">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="cursor-pointer">All Categories</SelectItem>
          {categories.map((category) => (
            <SelectItem
              key={category.value}
              value={category.value}
              className="cursor-pointer"
            >
              {category.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Priority Filter */}
      <Select value={priorityFilter || "all"} onValueChange={handlePriorityChange}>
        <SelectTrigger className="w-full cursor-pointer">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="cursor-pointer">All Priorities</SelectItem>
          {priorities.map((priority) => (
            <SelectItem
              key={priority.value}
              value={priority.value}
              className="cursor-pointer"
            >
              {priority.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <div className="space-y-3">
      {/* Search + action row — always visible */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search input grows to fill available space */}
        <Input
          placeholder="Search invoices…"
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("title")?.setFilterValue(event.target.value)
          }
          className="h-9 flex-1 min-w-[140px] max-w-xs cursor-text"
        />

        {/* Toggle filters on mobile (hidden on sm+ where filters are always shown) */}
        <Button
          variant={filtersOpen || isFiltered ? "secondary" : "outline"}
          size="sm"
          onClick={() => setFiltersOpen((v) => !v)}
          className="sm:hidden h-9 gap-1.5 cursor-pointer shrink-0"
          aria-expanded={filtersOpen}
          aria-controls="ap-filter-panel"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {isFiltered && (
            <span className="ml-1 rounded-full bg-primary text-primary-foreground text-[10px] w-4 h-4 flex items-center justify-center font-bold">
              {table.getState().columnFilters.length}
            </span>
          )}
        </Button>

        {/* Reset — shown when filtered */}
        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.resetColumnFilters()}
            className="h-9 gap-1.5 cursor-pointer shrink-0"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
        )}

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <DataTableViewOptions table={table} />
          <AddTaskModal onAddTask={onAddTask} />
        </div>
      </div>

      {/* Filter selects: always visible on sm+, collapsible on mobile */}
      <div
        id="ap-filter-panel"
        className={filtersOpen ? "block sm:block" : "hidden sm:block"}
      >
        {filterSelects}
      </div>
    </div>
  )
}
