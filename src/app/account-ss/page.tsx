"use client"

import { useState } from "react"
import { BaseLayout } from "@/components/layouts/base-layout"
import { StatCards } from "./components/stat-cards"
import { WorkloadPanel } from "./components/workload-panel"
import { SubsystemCard } from "./components/subsystem-card"
import { AssignmentTable } from "./components/assignment-table"
import { initialSubsystems, initialAccountants } from "./initial-data"
import type { Accountant, Subsystem } from "./types"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Search,
  Plus,
  Grid,
  Table2,
  X,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Check,
} from "lucide-react"

export default function AccountSsPage() {
  const [subsystems, setSubsystems] = useState<Subsystem[]>(initialSubsystems)
  const [accountants, setAccountants] = useState<Accountant[]>(initialAccountants)
  
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedAccountantId, setSelectedAccountantId] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")

  // State for Add Accountant Dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newTitle, setNewTitle] = useState("")
  const [newStatus, setNewStatus] = useState("Active")
  const [formError, setFormError] = useState("")

  // Update a single module's accountant assignment
  const handleAssignAccountant = (subsystemId: string, moduleId: string, accountantId: number | null) => {
    setSubsystems((prev) =>
      prev.map((sub) => {
        if (sub.id !== subsystemId) return sub
        return {
          ...sub,
          modules: sub.modules.map((mod) => {
            if (mod.id !== moduleId) return mod
            return { ...mod, assignedAccountantId: accountantId }
          }),
        }
      })
    )
  }

  // Bulk assign all modules in a subsystem to a single accountant
  const handleBulkAssign = (subsystemId: string, accountantId: number | null) => {
    setSubsystems((prev) =>
      prev.map((sub) => {
        if (sub.id !== subsystemId) return sub
        return {
          ...sub,
          modules: sub.modules.map((mod) => ({ ...mod, assignedAccountantId: accountantId })),
        }
      })
    )
  }

  // Create a record map of accountantId -> assigned modules count
  const accountantWorkloads = accountants.reduce<Record<number, number>>((acc, curr) => {
    let count = 0
    subsystems.forEach((sub) => {
      sub.modules.forEach((mod) => {
        if (mod.assignedAccountantId === curr.id) {
          count++
        }
      })
    })
    acc[curr.id] = count
    return acc
  }, {})

  // Suggest and assign the accountant with the lowest workload
  const handleAutoRecommend = () => {
    // Find first unassigned module
    let targetSubsystemId = ""
    let targetModuleId = ""
    
    for (const sub of subsystems) {
      const unassignedMod = sub.modules.find((mod) => mod.assignedAccountantId === null)
      if (unassignedMod) {
        targetSubsystemId = sub.id
        targetModuleId = unassignedMod.id
        break
      }
    }

    if (!targetSubsystemId || !targetModuleId) return

    // Find active accountant with the lowest workload
    const activeAccountants = accountants.filter((a) => a.status === "Active")
    if (activeAccountants.length === 0) return

    let bestAccountantId = activeAccountants[0].id
    let minWorkload = accountantWorkloads[bestAccountantId] ?? 0

    activeAccountants.forEach((acc) => {
      const load = accountantWorkloads[acc.id] ?? 0
      if (load < minWorkload) {
        minWorkload = load
        bestAccountantId = acc.id
      }
    })

    handleAssignAccountant(targetSubsystemId, targetModuleId, bestAccountantId)
  }

  // Handle adding new accountant to the pool
  const handleAddAccountant = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")

    if (!newName.trim() || !newEmail.trim() || !newTitle.trim()) {
      setFormError("Please fill out all fields.")
      return
    }

    if (!newEmail.includes("@")) {
      setFormError("Please enter a valid email address.")
      return
    }

    const generateAvatar = (name: string) => {
      const names = name.split(" ")
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase()
      }
      return name.substring(0, 2).toUpperCase()
    }

    const newAcc: Accountant = {
      id: Math.max(...accountants.map((a) => a.id), 0) + 1,
      name: newName,
      email: newEmail,
      avatar: generateAvatar(newName),
      title: newTitle,
      status: newStatus,
    }

    setAccountants((prev) => [...prev, newAcc])
    setNewName("")
    setNewEmail("")
    setNewTitle("")
    setNewStatus("Active")
    setIsAddDialogOpen(false)
  }

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setSelectedAccountantId(null)
  }

  // Calculate high-level stats for top cards
  const totalSubsystems = subsystems.length
  const totalModules = subsystems.reduce((sum, sub) => sum + sub.modules.length, 0)
  const assignedModules = subsystems.reduce(
    (sum, sub) => sum + sub.modules.filter((m) => m.assignedAccountantId !== null).length,
    0
  )
  const activeAccountantsCount = accountants.filter((a) => (accountantWorkloads[a.id] ?? 0) > 0).length
  const overloadedCount = accountants.filter((a) => (accountantWorkloads[a.id] ?? 0) > 5).length
  const hasUnassignedModules = assignedModules < totalModules

  // Filtering subsystems for grid view
  const filteredSubsystems = subsystems.map((sub) => {
    const matchedModules = sub.modules.filter((mod) => {
      const matchesSearch =
        mod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.name.toLowerCase().includes(searchQuery.toLowerCase())

      let matchesStatus = true
      if (statusFilter === "assigned") {
        matchesStatus = mod.assignedAccountantId !== null
      } else if (statusFilter === "unassigned") {
        matchesStatus = mod.assignedAccountantId === null
      }

      let matchesAccountant = true
      if (selectedAccountantId !== null) {
        matchesAccountant = mod.assignedAccountantId === selectedAccountantId
      }

      return matchesSearch && matchesStatus && matchesAccountant
    })

    return {
      ...sub,
      modules: matchedModules,
    }
  }).filter((sub) => sub.modules.length > 0 || (searchQuery === "" && statusFilter === "all" && selectedAccountantId === null))

  // Find overloaded accountant details for warnings
  const overloadedAccountant = accountants.find((a) => (accountantWorkloads[a.id] ?? 0) > 5)
  const selectedAccountantDetails = accountants.find((a) => a.id === selectedAccountantId)

  return (
    <BaseLayout
      title="Subsystem Accountant Assignment"
      description="Map financial professionals and senior accountants to ISMERS subsystems and modules."
    >
      <div className="flex flex-col gap-6 px-4 lg:px-6 py-2">
        {/* Dynamic Warning Alert for Overload */}
        {overloadedAccountant && (
          <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30 rounded-xl">
            <AlertTriangle className="size-5 shrink-0" />
            <div className="flex-1 text-sm font-medium">
              Resource warning: <span className="font-bold">{overloadedAccountant.name}</span> is currently assigned to{" "}
              <span className="font-bold">{accountantWorkloads[overloadedAccountant.id]}</span> modules. Consider reassigning modules to balance workloads.
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-amber-300 hover:bg-amber-100 text-xs font-semibold cursor-pointer"
              onClick={() => setSelectedAccountantId(overloadedAccountant.id)}
            >
              Analyze Load
            </Button>
          </div>
        )}

        {/* Top metrics dashboard */}
        <StatCards
          totalSubsystems={totalSubsystems}
          totalModules={totalModules}
          assignedModules={assignedModules}
          activeAccountants={activeAccountantsCount}
          overloadedCount={overloadedCount}
        />

        {/* Action Controls & Filtering panel */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-card p-4 rounded-xl border">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search subsystems or modules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            <div className="w-full sm:w-[180px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="cursor-pointer text-sm">
                  <SelectValue placeholder="All Assignment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="cursor-pointer">All Status</SelectItem>
                  <SelectItem value="assigned" className="cursor-pointer">Assigned Only</SelectItem>
                  <SelectItem value="unassigned" className="cursor-pointer">Unassigned Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(searchQuery || statusFilter !== "all" || selectedAccountantId !== null) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 h-10 px-3 cursor-pointer self-start"
              >
                <RotateCcw className="size-4" />
                Reset Filters
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Workload suggest optimizer */}
            {hasUnassignedModules && (
              <Button
                onClick={handleAutoRecommend}
                variant="outline"
                className="border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/10 hover:bg-emerald-50 cursor-pointer text-sm font-semibold flex items-center gap-1.5"
                title="Automatically assign the accountant with the lowest workload to the next unassigned module"
              >
                <Sparkles className="size-4" />
                Auto-Balance Next
              </Button>
            )}

            {/* View Mode Selectors */}
            <div className="flex items-center bg-muted p-1 rounded-lg border">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("grid")}
                className={`h-8 w-8 cursor-pointer ${
                  viewMode === "grid" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
                title="Grid view"
              >
                <Grid className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("table")}
                className={`h-8 w-8 cursor-pointer ${
                  viewMode === "table" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
                title="Table view"
              >
                <Table2 className="size-4" />
              </Button>
            </div>

            {/* Add Accountant Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="cursor-pointer font-semibold text-sm">
                  <Plus className="size-4 mr-2 stroke-[2.5]" />
                  Add Accountant
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Accountant</DialogTitle>
                  <DialogDescription>
                    Add a professional accountant to the allocation pool.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddAccountant} className="space-y-4 py-2">
                  {formError && (
                    <div className="p-3 text-xs font-semibold bg-rose-50 text-rose-600 rounded-lg border border-rose-100">
                      {formError}
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label htmlFor="acc-name" className="text-sm font-medium">
                      Full Name
                    </Label>
                    <Input
                      id="acc-name"
                      placeholder="e.g. Liam Henderson"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="acc-email" className="text-sm font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="acc-email"
                      type="email"
                      placeholder="e.g. liam.h@company.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="acc-title" className="text-sm font-medium">
                      Professional Designation
                    </Label>
                    <Input
                      id="acc-title"
                      placeholder="e.g. Senior Tax Associate"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="acc-status" className="text-sm font-medium">
                      Status
                    </Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger id="acc-status" className="cursor-pointer">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active" className="cursor-pointer">Active</SelectItem>
                        <SelectItem value="Pending" className="cursor-pointer">Pending</SelectItem>
                        <SelectItem value="Inactive" className="cursor-pointer">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter className="pt-4 border-t">
                    <Button type="submit" className="w-full cursor-pointer font-bold">
                      Add Accountant
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Selected Accountant Filter Notification Panel */}
        {selectedAccountantDetails && (
          <div className="flex items-center justify-between p-3 px-4 bg-primary/5 text-primary border border-primary/20 rounded-xl">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Check className="size-4 shrink-0" />
              <span>
                Filtering assignments for Accountant:{" "}
                <span className="font-bold">{selectedAccountantDetails.name}</span> ({selectedAccountantDetails.title})
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedAccountantId(null)}
              className="text-primary hover:bg-primary/10 h-7 w-7 p-0 cursor-pointer rounded-full"
            >
              <X className="size-4" />
            </Button>
          </div>
        )}

        {/* Dashboard Content split layout */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
          {/* Main Grid Card or Table Container */}
          <div className="xl:col-span-3 order-2 xl:order-1">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredSubsystems.length > 0 ? (
                  filteredSubsystems.map((subsystem) => (
                    <SubsystemCard
                      key={subsystem.id}
                      subsystem={subsystem}
                      accountants={accountants}
                      onAssignAccountant={handleAssignAccountant}
                      onBulkAssign={handleBulkAssign}
                      accountantWorkloads={accountantWorkloads}
                    />
                  ))
                ) : (
                  <div className="md:col-span-2 text-center py-16 bg-card border border-dashed rounded-2xl text-muted-foreground flex flex-col items-center justify-center gap-3">
                    <Search className="size-10 text-muted-foreground/60 stroke-[1.5]" />
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-foreground">No subsystems match your filters</p>
                      <p className="text-sm">Try clearing your filters or resetting the search text.</p>
                    </div>
                    <Button onClick={handleResetFilters} variant="outline" className="mt-2 cursor-pointer">
                      Reset Filters
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <AssignmentTable
                subsystems={subsystems}
                accountants={accountants}
                onAssignAccountant={handleAssignAccountant}
                accountantWorkloads={accountantWorkloads}
                searchQuery={searchQuery}
                statusFilter={statusFilter}
                selectedAccountantId={selectedAccountantId}
              />
            )}
          </div>

          {/* Side tracker panel */}
          <div className="xl:col-span-1 xl:sticky xl:top-6 order-1 xl:order-2 h-auto xl:h-[calc(100vh-140px)]">
            <WorkloadPanel
              accountants={accountants}
              subsystems={subsystems}
              selectedAccountantId={selectedAccountantId}
              onSelectAccountant={setSelectedAccountantId}
            />
          </div>
        </div>
      </div>
    </BaseLayout>
  )
}
