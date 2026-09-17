"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Layers, CheckCircle2, UserCheck, AlertOctagon } from "lucide-react"

interface StatCardsProps {
  totalSubsystems: number
  totalModules: number
  assignedModules: number
  activeAccountants: number
  overloadedCount: number
}

export function StatCards({
  totalSubsystems,
  totalModules,
  assignedModules,
  activeAccountants,
  overloadedCount,
}: StatCardsProps) {
  const coveragePercent = totalModules > 0 ? Math.round((assignedModules / totalModules) * 100) : 0

  const stats = [
    {
      title: "Subsystems Managed",
      value: totalSubsystems,
      description: "Across 10 key operational domains",
      icon: Layers,
      color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20",
    },
    {
      title: "Module Assignment Coverage",
      value: `${assignedModules} / ${totalModules}`,
      description: `${coveragePercent}% of modules have accountants`,
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20",
    },
    {
      title: "Active Accountants",
      value: activeAccountants,
      description: "Holding 1 or more module assignments",
      icon: UserCheck,
      color: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20",
    },
    {
      title: "Overload Status Alert",
      value: overloadedCount > 0 ? `${overloadedCount} Alert${overloadedCount > 1 ? "s" : ""}` : "Healthy",
      description: overloadedCount > 0 ? "Accountants with >5 modules assigned" : "All resource workloads balanced",
      icon: AlertOctagon,
      color: overloadedCount > 0 
        ? "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 animate-pulse" 
        : "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index} className="border hover:shadow-sm transition-all duration-200">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {stat.title}
                </p>
                <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </div>
              <div className={`p-3 rounded-xl shrink-0 ${stat.color}`}>
                <Icon className="size-6 stroke-[1.5]" />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
