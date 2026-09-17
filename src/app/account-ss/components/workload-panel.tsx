"use client"

import { useState } from "react"
import type { Accountant, Subsystem } from "../types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, AlertTriangle, CheckCircle2, Circle } from "lucide-react"

interface WorkloadPanelProps {
  accountants: Accountant[]
  subsystems: Subsystem[]
  selectedAccountantId: number | null
  onSelectAccountant: (id: number | null) => void
}

export function WorkloadPanel({
  accountants,
  subsystems,
  selectedAccountantId,
  onSelectAccountant,
}: WorkloadPanelProps) {
  const [search, setSearch] = useState("")

  // Calculate workloads
  const accountantWorkloads = accountants.map((accountant) => {
    let count = 0
    subsystems.forEach((subsystem) => {
      subsystem.modules.forEach((module) => {
        if (module.assignedAccountantId === accountant.id) {
          count++
        }
      })
    })
    return {
      ...accountant,
      assignedCount: count,
    }
  })

  // Sort accountants by assigned count descending
  const sortedWorkloads = [...accountantWorkloads].sort((a, b) => b.assignedCount - a.assignedCount)

  // Filter based on search query
  const filteredWorkloads = sortedWorkloads.filter(
    (acc) =>
      acc.name.toLowerCase().includes(search.toLowerCase()) ||
      acc.title.toLowerCase().includes(search.toLowerCase())
  )

  const getWorkloadStatus = (count: number) => {
    if (count === 0) return { label: "Unassigned", color: "text-muted-foreground bg-secondary/50 border-secondary", progressColor: "bg-muted" }
    if (count <= 2) return { label: "Underutilized", color: "text-sky-700 bg-sky-50 border-sky-200 dark:text-sky-400 dark:bg-sky-950/20 dark:border-sky-900/30", progressColor: "bg-sky-500" }
    if (count <= 5) return { label: "Optimal", color: "text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/20 dark:border-green-900/30", progressColor: "bg-green-500" }
    return { label: "Overloaded", color: "text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-950/20 dark:border-rose-900/30", progressColor: "bg-rose-500" }
  }

  // Workload statistics
  const totalAssigned = subsystems.reduce(
    (sum, sub) => sum + sub.modules.filter((m) => m.assignedAccountantId !== null).length,
    0
  )
  const activeAccountantsCount = accountantWorkloads.filter((acc) => acc.assignedCount > 0).length
  const avgWorkload = activeAccountantsCount > 0 ? (totalAssigned / activeAccountantsCount).toFixed(1) : "0"

  return (
    <Card className="border flex flex-col h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold">Accountant Workload Tracker</CardTitle>
            <CardDescription>Monitor task balancing and resources allocation</CardDescription>
          </div>
          <Badge variant="outline" className="px-2 py-0.5 text-xs font-semibold bg-primary/5 text-primary border-primary/20">
            Avg: {avgWorkload} modules
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col min-h-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search accountants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>

        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground bg-muted/40 p-2 rounded-md border">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-green-500" />
            <span>Optimal: 1-5</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="size-3.5 text-rose-500" />
            <span>Overload: &gt;5</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Circle className="size-3.5 text-muted-foreground" />
            <span>Unassigned: 0</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[460px] pr-1 space-y-3 scrollbar-thin">
          {filteredWorkloads.length > 0 ? (
            filteredWorkloads.map((acc) => {
              const status = getWorkloadStatus(acc.assignedCount)
              const isSelected = selectedAccountantId === acc.id
              const percentage = Math.min((acc.assignedCount / 8) * 100, 100) // normalized max load of 8 modules

              return (
                <div
                  key={acc.id}
                  onClick={() => onSelectAccountant(isSelected ? null : acc.id)}
                  className={`flex flex-col gap-2 p-3 rounded-lg border cursor-pointer transition-all duration-200 select-none hover:shadow-sm ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-muted-foreground/30 hover:bg-muted/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-background">
                      <AvatarFallback className="text-xs font-semibold bg-muted text-foreground">
                        {acc.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm truncate block">{acc.name}</span>
                        <span className="text-xs font-bold text-foreground">
                          {acc.assignedCount} {acc.assignedCount === 1 ? "module" : "modules"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-xs text-muted-foreground truncate block max-w-[140px]">
                          {acc.title}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 font-medium tracking-wide ${status.color}`}
                        >
                          {status.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {acc.assignedCount > 0 && (
                    <div className="mt-1 space-y-1">
                      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            acc.assignedCount > 5
                              ? "bg-rose-500"
                              : acc.assignedCount > 2
                              ? "bg-green-500"
                              : "bg-sky-500"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-lg">
              No accountants found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
