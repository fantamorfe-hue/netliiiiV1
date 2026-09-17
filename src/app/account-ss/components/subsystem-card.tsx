"use client"

import type { Accountant, Subsystem } from "../types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Users2,
  FolderGit,
  Award,
  ShieldAlert,
  LineChart,
  BookOpen,
  Package,
  Truck,
  Building,
  PieChart,
  HeartHandshake,
  HelpCircle,
  MoreVertical,
  UserX,
  Sparkles,
} from "lucide-react"

interface SubsystemCardProps {
  subsystem: Subsystem
  accountants: Accountant[]
  onAssignAccountant: (subsystemId: string, moduleId: string, accountantId: number | null) => void
  onBulkAssign: (subsystemId: string, accountantId: number | null) => void
  accountantWorkloads: Record<number, number> // Map of accountantId -> assigned modules count
}

const getIcon = (name: string) => {
  switch (name) {
    case "Users2": return Users2
    case "FolderGit": return FolderGit
    case "Award": return Award
    case "ShieldAlert": return ShieldAlert
    case "LineChart": return LineChart
    case "BookOpen": return BookOpen
    case "Package": return Package
    case "Truck": return Truck
    case "Building": return Building
    case "PieChart": return PieChart
    case "HeartHandshake": return HeartHandshake
    default: return HelpCircle
  }
}

const getColorClasses = (color: string) => {
  switch (color) {
    case "blue":
      return {
        bg: "bg-blue-50 dark:bg-blue-950/20",
        border: "border-blue-100 dark:border-blue-900/30",
        text: "text-blue-700 dark:text-blue-400",
        icon: "text-blue-600 dark:text-blue-400 font-bold",
        ring: "focus-within:ring-blue-500",
      }
    case "indigo":
      return {
        bg: "bg-indigo-50 dark:bg-indigo-950/20",
        border: "border-indigo-100 dark:border-indigo-900/30",
        text: "text-indigo-700 dark:text-indigo-400",
        icon: "text-indigo-600 dark:text-indigo-400",
        ring: "focus-within:ring-indigo-500",
      }
    case "violet":
      return {
        bg: "bg-violet-50 dark:bg-violet-950/20",
        border: "border-violet-100 dark:border-violet-900/30",
        text: "text-violet-700 dark:text-violet-400",
        icon: "text-violet-600 dark:text-violet-400",
        ring: "focus-within:ring-violet-500",
      }
    case "rose":
      return {
        bg: "bg-rose-50 dark:bg-rose-950/20",
        border: "border-rose-100 dark:border-rose-900/30",
        text: "text-rose-700 dark:text-rose-400",
        icon: "text-rose-600 dark:text-rose-400",
        ring: "focus-within:ring-rose-500",
      }
    case "emerald":
      return {
        bg: "bg-emerald-50 dark:bg-emerald-950/20",
        border: "border-emerald-100 dark:border-emerald-900/30",
        text: "text-emerald-700 dark:text-emerald-400",
        icon: "text-emerald-600 dark:text-emerald-400",
        ring: "focus-within:ring-emerald-500",
      }
    case "amber":
      return {
        bg: "bg-amber-50 dark:bg-amber-950/20",
        border: "border-amber-100 dark:border-amber-900/30",
        text: "text-amber-700 dark:text-amber-400",
        icon: "text-amber-600 dark:text-amber-400",
        ring: "focus-within:ring-amber-500",
      }
    case "cyan":
      return {
        bg: "bg-cyan-50 dark:bg-cyan-950/20",
        border: "border-cyan-100 dark:border-cyan-900/30",
        text: "text-cyan-700 dark:text-cyan-400",
        icon: "text-cyan-600 dark:text-cyan-400",
        ring: "focus-within:ring-cyan-500",
      }
    case "sky":
      return {
        bg: "bg-sky-50 dark:bg-sky-950/20",
        border: "border-sky-100 dark:border-sky-900/30",
        text: "text-sky-700 dark:text-sky-400",
        icon: "text-sky-600 dark:text-sky-400",
        ring: "focus-within:ring-sky-500",
      }
    case "teal":
      return {
        bg: "bg-teal-50 dark:bg-teal-950/20",
        border: "border-teal-100 dark:border-teal-900/30",
        text: "text-teal-700 dark:text-teal-400",
        icon: "text-teal-600 dark:text-teal-400",
        ring: "focus-within:ring-teal-500",
      }
    case "pink":
      return {
        bg: "bg-pink-50 dark:bg-pink-950/20",
        border: "border-pink-100 dark:border-pink-900/30",
        text: "text-pink-700 dark:text-pink-400",
        icon: "text-pink-600 dark:text-pink-400",
        ring: "focus-within:ring-pink-500",
      }
    default:
      return {
        bg: "bg-slate-50 dark:bg-slate-950/20",
        border: "border-slate-100 dark:border-slate-900/30",
        text: "text-slate-700 dark:text-slate-400",
        icon: "text-slate-600 dark:text-slate-400",
        ring: "focus-within:ring-slate-500",
      }
  }
}

export function SubsystemCard({
  subsystem,
  accountants,
  onAssignAccountant,
  onBulkAssign,
  accountantWorkloads,
}: SubsystemCardProps) {
  const IconComponent = getIcon(subsystem.icon)
  const colors = getColorClasses(subsystem.color)

  const assignedCount = subsystem.modules.filter((m) => m.assignedAccountantId !== null).length
  const totalCount = subsystem.modules.length
  const isFullyAssigned = assignedCount === totalCount
  const isUnassigned = assignedCount === 0

  return (
    <Card className="border hover:shadow-md transition-shadow duration-300 flex flex-col h-full overflow-hidden">
      <CardHeader className={`pb-4 border-b relative ${colors.bg}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border bg-background/80 ${colors.border}`}>
              <IconComponent className={`size-5 ${colors.icon}`} />
            </div>
            <div className="space-y-0.5">
              <CardTitle className="text-base font-bold leading-tight">{subsystem.name}</CardTitle>
              <CardDescription className="text-xs line-clamp-2 mt-0.5 leading-relaxed">
                {subsystem.description}
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Badge
              variant={isFullyAssigned ? "default" : isUnassigned ? "outline" : "secondary"}
              className={`text-xs font-semibold px-2 py-0.5 whitespace-nowrap ${
                isFullyAssigned
                  ? "bg-green-600 hover:bg-green-600 text-white"
                  : isUnassigned
                  ? "text-muted-foreground border-muted-foreground/30 bg-secondary/20"
                  : "bg-amber-100 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
              }`}
            >
              {assignedCount}/{totalCount} Modules
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer rounded-full hover:bg-background/50">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Subsystem Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="cursor-pointer">
                    <Sparkles className="mr-2 size-4 text-amber-500" />
                    <span>Assign all modules to...</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="max-h-[250px] overflow-y-auto w-56 scrollbar-thin">
                      {accountants.map((acc) => {
                        const currentLoad = accountantWorkloads[acc.id] || 0
                        return (
                          <DropdownMenuItem
                            key={acc.id}
                            className="cursor-pointer"
                            onClick={() => onBulkAssign(subsystem.id, acc.id)}
                          >
                            <Avatar className="h-5 w-5 mr-2">
                              <AvatarFallback className="text-[8px] font-bold">{acc.avatar}</AvatarFallback>
                            </Avatar>
                            <span className="truncate flex-1">{acc.name}</span>
                            <span className="text-[10px] text-muted-foreground font-semibold ml-1">
                              ({currentLoad})
                            </span>
                          </DropdownMenuItem>
                        )
                      })}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                <DropdownMenuItem
                  className="cursor-pointer text-rose-600 dark:text-rose-400 focus:text-rose-600"
                  onClick={() => onBulkAssign(subsystem.id, null)}
                  disabled={isUnassigned}
                >
                  <UserX className="mr-2 size-4" />
                  <span>Unassign all modules</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Module accountant assignments
          </p>
          <div className="space-y-2">
            {subsystem.modules.map((module) => {
              const currentAccountant = accountants.find((a) => a.id === module.assignedAccountantId)
              
              return (
                <div
                  key={module.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 border rounded-lg hover:bg-muted/10 transition-colors"
                >
                  <span className="text-xs font-semibold text-foreground break-words max-w-[200px] leading-tight">
                    {module.name}
                  </span>

                  <div className="w-full sm:w-[170px] shrink-0">
                    <Select
                      value={module.assignedAccountantId ? String(module.assignedAccountantId) : "unassigned"}
                      onValueChange={(val) => {
                        const id = val === "unassigned" ? null : Number(val)
                        onAssignAccountant(subsystem.id, module.id, id)
                      }}
                    >
                      <SelectTrigger
                        className={`h-8 text-xs font-medium border cursor-pointer w-full transition-all duration-200 ${
                          currentAccountant
                            ? "bg-background text-foreground border-border"
                            : "bg-muted/30 text-muted-foreground border-dashed border-muted-foreground/30 hover:bg-muted/50"
                        }`}
                      >
                        <SelectValue placeholder="Unassigned">
                          {currentAccountant ? (
                            <div className="flex items-center gap-1.5 text-left">
                              <Avatar className="h-4.5 w-4.5 shrink-0 border border-background">
                                <AvatarFallback className="text-[8px] font-bold bg-muted text-foreground">
                                  {currentAccountant.avatar}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate max-w-[120px]">{currentAccountant.name}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/70">Assign Accountant</span>
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
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
