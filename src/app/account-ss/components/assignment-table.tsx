"use client"

import { useState, useMemo } from "react"
import type { Accountant, Subsystem } from "../types"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UserX, Trash2, ArrowUpDown, ChevronLeft, ChevronRight, FolderMinus } from "lucide-react"

interface AssignmentTableProps {
  subsystems: Subsystem[]
  accountants: Accountant[]
  onAssignAccountant: (subsystemId: string, moduleId: string, accountantId: number | null) => void
  accountantWorkloads: Record<number, number>
  searchQuery: string
  statusFilter: string
  selectedAccountantId: number | null
}

interface FlatModule {
  subsystemId: string
  subsystemName: string
  subsystemColor: string
  moduleId: string
  moduleName: string
  assignedAccountantId: number | null
}

const getColorClasses = (color: string) => {
  switch (color) {
    case "blue": return "text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/20 dark:border-blue-900/30"
    case "indigo": return "text-indigo-700 bg-indigo-50 border-indigo-200 dark:text-indigo-400 dark:bg-indigo-950/20 dark:border-indigo-900/30"
    case "violet": return "text-violet-700 bg-violet-50 border-violet-200 dark:text-violet-400 dark:bg-violet-950/20 dark:border-violet-900/30"
    case "rose": return "text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-950/20 dark:border-rose-900/30"
    case "emerald": return "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/20 dark:border-emerald-900/30"
    case "amber": return "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/20 dark:border-amber-900/30"
    case "cyan": return "text-cyan-700 bg-cyan-50 border-cyan-200 dark:text-cyan-400 dark:bg-cyan-950/20 dark:border-cyan-900/30"
    case "sky": return "text-sky-700 bg-sky-50 border-sky-200 dark:text-sky-400 dark:bg-sky-950/20 dark:border-sky-900/30"
    case "teal": return "text-teal-700 bg-teal-50 border-teal-200 dark:text-teal-400 dark:bg-teal-950/20 dark:border-teal-900/30"
    case "pink": return "text-pink-700 bg-pink-50 border-pink-200 dark:text-pink-400 dark:bg-pink-950/20 dark:border-pink-900/30"
    default: return "text-slate-700 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-950/20 dark:border-slate-900/30"
  }
}

export function AssignmentTable({
  subsystems,
  accountants,
  onAssignAccountant,
  accountantWorkloads,
  searchQuery,
  statusFilter,
  selectedAccountantId,
}: AssignmentTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortField, setSortField] = useState<"subsystem" | "module" | "status">("subsystem")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // 1. Flatten all subsystems and modules
  const flatModules = useMemo(() => {
    const list: FlatModule[] = []
    subsystems.forEach((sub) => {
      sub.modules.forEach((mod) => {
        list.push({
          subsystemId: sub.id,
          subsystemName: sub.name,
          subsystemColor: sub.color,
          moduleId: mod.id,
          moduleName: mod.name,
          assignedAccountantId: mod.assignedAccountantId,
        })
      })
    })
    return list
  }, [subsystems])

  // 2. Filter flat modules
  const filteredModules = useMemo(() => {
    return flatModules.filter((item) => {
      // Search text match
      const matchesSearch =
        item.moduleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subsystemName.toLowerCase().includes(searchQuery.toLowerCase())

      // Status filter match
      let matchesStatus = true
      if (statusFilter === "assigned") {
        matchesStatus = item.assignedAccountantId !== null
      } else if (statusFilter === "unassigned") {
        matchesStatus = item.assignedAccountantId === null
      }

      // Accountant filter match (workload selection)
      let matchesAccountant = true
      if (selectedAccountantId !== null) {
        matchesAccountant = item.assignedAccountantId === selectedAccountantId
      }

      return matchesSearch && matchesStatus && matchesAccountant
    })
  }, [flatModules, searchQuery, statusFilter, selectedAccountantId])

  // 3. Sort filtered modules
  const sortedModules = useMemo(() => {
    const sorted = [...filteredModules]
    sorted.sort((a, b) => {
      let comparison = 0
      if (sortField === "subsystem") {
        comparison = a.subsystemName.localeCompare(b.subsystemName)
      } else if (sortField === "module") {
        comparison = a.moduleName.localeCompare(b.moduleName)
      } else if (sortField === "status") {
        const aAssigned = a.assignedAccountantId ? 1 : 0
        const bAssigned = b.assignedAccountantId ? 1 : 0
        comparison = aAssigned - bAssigned
      }

      return sortDirection === "asc" ? comparison : -comparison
    })
    return sorted
  }, [filteredModules, sortField, sortDirection])

  // Reset page when filters change
  useMemo(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, selectedAccountantId])

  // 4. Paginate
  const totalItems = sortedModules.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const paginatedModules = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return sortedModules.slice(startIndex, startIndex + pageSize)
  }, [sortedModules, currentPage, pageSize])

  const toggleSort = (field: "subsystem" | "module" | "status") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  return (
    <div className="w-full space-y-4">
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30%]">
                <Button
                  variant="ghost"
                  className="p-0 hover:bg-transparent font-bold cursor-pointer text-xs uppercase tracking-wider text-muted-foreground"
                  onClick={() => toggleSort("subsystem")}
                >
                  Subsystem
                  <ArrowUpDown className="ml-1 size-3" />
                </Button>
              </TableHead>
              <TableHead className="w-[30%]">
                <Button
                  variant="ghost"
                  className="p-0 hover:bg-transparent font-bold cursor-pointer text-xs uppercase tracking-wider text-muted-foreground"
                  onClick={() => toggleSort("module")}
                >
                  Submodule / Feature Area
                  <ArrowUpDown className="ml-1 size-3" />
                </Button>
              </TableHead>
              <TableHead className="w-[15%]">
                <Button
                  variant="ghost"
                  className="p-0 hover:bg-transparent font-bold cursor-pointer text-xs uppercase tracking-wider text-muted-foreground"
                  onClick={() => toggleSort("status")}
                >
                  Status
                  <ArrowUpDown className="ml-1 size-3" />
                </Button>
              </TableHead>
              <TableHead className="w-[20%] text-left font-bold text-xs uppercase tracking-wider text-muted-foreground">
                Assigned Accountant
              </TableHead>
              <TableHead className="w-[5%] text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedModules.length > 0 ? (
              paginatedModules.map((item) => {
                const currentAccountant = accountants.find((a) => a.id === item.assignedAccountantId)
                const isAssigned = item.assignedAccountantId !== null

                return (
                  <TableRow key={`${item.subsystemId}-${item.moduleId}`} className="hover:bg-muted/10">
                    <TableCell className="align-middle">
                      <Badge variant="outline" className={`font-semibold text-[11px] ${getColorClasses(item.subsystemColor)}`}>
                        {item.subsystemName}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-sm align-middle">
                      {item.moduleName}
                    </TableCell>
                    <TableCell className="align-middle">
                      <Badge
                        variant={isAssigned ? "default" : "outline"}
                        className={`text-xs font-semibold px-2 py-0.5 ${
                          isAssigned
                            ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-950/40 dark:text-green-400 border-green-200 dark:border-green-900/30"
                            : "text-muted-foreground border-muted-foreground/30 bg-secondary/20"
                        }`}
                      >
                        {isAssigned ? "Assigned" : "Unassigned"}
                      </Badge>
                    </TableCell>
                    <TableCell className="align-middle">
                      <div className="w-[180px]">
                        <Select
                          value={isAssigned ? String(item.assignedAccountantId) : "unassigned"}
                          onValueChange={(val) => {
                            const id = val === "unassigned" ? null : Number(val)
                            onAssignAccountant(item.subsystemId, item.moduleId, id)
                          }}
                        >
                          <SelectTrigger
                            className={`h-8 text-xs font-medium border cursor-pointer w-full ${
                              currentAccountant
                                ? "bg-background text-foreground"
                                : "bg-muted/30 text-muted-foreground border-dashed border-muted-foreground/30 hover:bg-muted/50"
                            }`}
                          >
                            <SelectValue>
                              {currentAccountant ? (
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-4.5 w-4.5 border border-background">
                                    <AvatarFallback className="text-[8px] font-bold bg-muted text-foreground">
                                      {currentAccountant.avatar}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="truncate max-w-[120px]">{currentAccountant.name}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground/75">Assign Accountant</span>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="max-h-[220px]">
                            <SelectItem value="unassigned" className="text-xs font-medium text-rose-600 focus:text-rose-600 cursor-pointer">
                              <span className="flex items-center gap-1.5">
                                <UserX className="size-3.5" />
                                Unassigned
                              </span>
                            </SelectItem>
                            {accountants.map((acc) => {
                              const load = accountantWorkloads[acc.id] || 0
                              return (
                                <SelectItem key={acc.id} value={String(acc.id)} className="text-xs cursor-pointer">
                                  <span className="flex items-center justify-between w-full gap-4">
                                    <span className="truncate font-medium">{acc.name}</span>
                                    <span className="text-[10px] text-muted-foreground shrink-0 bg-muted px-1.5 py-0.5 rounded font-bold">
                                      {load} {load === 1 ? "mod" : "mods"}
                                    </span>
                                  </span>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell className="text-right align-middle">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-full cursor-pointer disabled:opacity-30"
                        disabled={!isAssigned}
                        onClick={() => onAssignAccountant(item.subsystemId, item.moduleId, null)}
                        title="Unassign module"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center align-middle">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <FolderMinus className="size-8 stroke-[1.5]" />
                    <span className="text-sm font-medium">No subsystem modules match the selected filter criteria.</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2 px-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Show</span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => {
                setPageSize(Number(val))
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-16 h-8 text-xs cursor-pointer">
                <SelectValue placeholder={String(pageSize)} />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 30, 50].map((size) => (
                  <SelectItem key={size} value={String(size)} className="text-xs cursor-pointer">
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>entries</span>
            <span className="mx-2">|</span>
            <span>
              Showing {Math.min(totalItems, (currentPage - 1) * pageSize + 1)}-
              {Math.min(totalItems, currentPage * pageSize)} of {totalItems} modules
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 cursor-pointer"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="mr-1 size-4" />
              Previous
            </Button>
            <div className="flex items-center text-sm font-semibold px-2">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 cursor-pointer"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="ml-1 size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
