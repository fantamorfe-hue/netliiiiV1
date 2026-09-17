"use client"

import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeDollarSign,
  Banknote,
  BriefcaseBusiness,
  Landmark,
  ShieldCheck,
  WalletCards,
} from "lucide-react"

import { BaseLayout } from "@/components/layouts/base-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const budgetSummary = [
  {
    title: "Approved Annual Budget",
    value: 18250000,
    change: "+4.8%",
    trend: "up",
    icon: Landmark,
  },
  {
    title: "Budget Utilized",
    value: 11240000,
    change: "+2.1%",
    trend: "up",
    icon: WalletCards,
  },
  {
    title: "Remaining Balance",
    value: 7010000,
    change: "-1.2%",
    trend: "down",
    icon: Banknote,
  },
  {
    title: "Budget Variance",
    value: 540000,
    change: "+3.6%",
    trend: "up",
    icon: BadgeDollarSign,
  },
]

const subsystemBudgets = [
  {
    name: "Client Acquisition & Recruitment",
    modules: "Client Management, Applicant Registration, Recruitment, Job Order, Deployment",
    budget: 3200000,
    utilized: 2140000,
    status: "On Track",
  },
  {
    name: "HRIS & Workforce Operations",
    modules: "Employee Information, Timekeeping, Leave, Payroll, Performance",
    budget: 4100000,
    utilized: 3680000,
    status: "Watch",
  },
  {
    name: "Development, Compliance & Benefits",
    modules: "Training, Contracts, Compliance, Benefits, Separation",
    budget: 2100000,
    utilized: 1420000,
    status: "On Track",
  },
  {
    name: "Governance, Safety & Administration",
    modules: "Health/Safety, Legal, System Admin, Reports, Asset Tracking",
    budget: 1800000,
    utilized: 1260000,
    status: "On Track",
  },
  {
    name: "Financial Management",
    modules: "GL, AP, AR, Disbursement, Collection, Budget, Cash, Tax",
    budget: 2600000,
    utilized: 1930000,
    status: "On Track",
  },
  {
    name: "Supply Chain & Inventory",
    modules: "Warehousing, Inventory, Procurement, Vendor, Purchase Orders",
    budget: 1950000,
    utilized: 1600000,
    status: "Watch",
  },
]

const moduleBudgets = [
  { module: "Payroll & Benefits", owner: "HRIS", approved: 2400000, actual: 2280000, variance: 120000, status: "Healthy" },
  { module: "Regional Deployment & Travel", owner: "Operations", approved: 900000, actual: 1015000, variance: -15000, status: "Needs Review" },
  { module: "Procurement & Inventory", owner: "Supply Chain", approved: 780000, actual: 710000, variance: 70000, status: "Healthy" },
  { module: "System Administration", owner: "Governance", approved: 650000, actual: 610000, variance: 40000, status: "Healthy" },
  { module: "Facilities & Office Support", owner: "Admin", approved: 520000, actual: 575000, variance: -55000, status: "Needs Review" },
]

const controlFocus = [
  { title: "Payroll control", detail: "Review overtime and benefits accruals before the next payroll cycle." },
  { title: "Regional deployment costs", detail: "Track lodging, local travel, and mobilization costs for provincial deployments monthly." },
  { title: "Procurement approval", detail: "Ensure purchase order requests align with approved departmental budgets." },
]

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value)

export default function BudgetManagementPage() {
  return (
    <BaseLayout
      title="Budget Management"
      description="Enterprise budget planning and control view for the ISMERS platform across finance, HR, operations, and service delivery modules."
    >
      <div className="space-y-6 px-4 lg:px-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {budgetSummary.map((item) => {
            const Icon = item.icon
            const isPositive = item.trend === "up"

            return (
              <Card key={item.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                  <div className="rounded-full bg-muted p-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{formatCurrency(item.value)}</div>
                  <div className={`mt-1 flex items-center gap-1 text-sm ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                    {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    <span>{item.change} vs last period</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <Card>
            <CardHeader>
              <CardTitle>Budget allocation by ISMERS subsystem</CardTitle>
              <CardDescription>Planned spending coverage across core service, workforce, finance, logistics, and administration domains.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {subsystemBudgets.map((item) => {
                const percent = Math.round((item.utilized / item.budget) * 100)

                return (
                  <div key={item.name} className="rounded-lg border p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="font-semibold">{item.name}</div>
                        <div className="text-sm text-muted-foreground">{item.modules}</div>
                      </div>
                      <div className="rounded-full border px-3 py-1 text-sm font-medium">
                        {item.status}
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Budget</span>
                        <span className="font-medium">{formatCurrency(item.budget)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Utilized</span>
                        <span className="font-medium">{formatCurrency(item.utilized)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(percent, 100)}%` }} />
                      </div>
                      <div className="text-right text-xs text-muted-foreground">{percent}% utilized</div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Budget control focus</CardTitle>
              <CardDescription>Key areas requiring monthly review for compliance and cost stability.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/40 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Cost discipline remains healthy across 70% of the budget centers.
                </div>
              </div>
              {controlFocus.map((item) => (
                <div key={item.title} className="rounded-lg border p-4">
                  <div className="font-medium">{item.title}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                </div>
              ))}
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
                  <BriefcaseBusiness className="h-4 w-4" />
                  Recommended reserve: {formatCurrency(850000)}
                </div>
                <p className="mt-1 text-sm text-amber-700/80 dark:text-amber-400/80">
                  Hold contingency for regional deployment, employee benefits, and urgent procurement needs.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Module-level budget performance</CardTitle>
            <CardDescription>Detailed comparison of approved budget, actual spend, and variance by operational module.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Module</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead className="text-right">Approved</TableHead>
                    <TableHead className="text-right">Actual</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {moduleBudgets.map((item) => {
                    const varianceColor = item.variance >= 0 ? "text-emerald-600" : "text-rose-600"

                    return (
                      <TableRow key={item.module}>
                        <TableCell className="font-medium">{item.module}</TableCell>
                        <TableCell>{item.owner}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.approved)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.actual)}</TableCell>
                        <TableCell className={`text-right ${varianceColor}`}>{formatCurrency(item.variance)}</TableCell>
                        <TableCell>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.status === "Healthy" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}>
                            {item.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </BaseLayout>
  )
}
