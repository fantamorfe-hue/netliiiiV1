"use client"

import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeDollarSign,
  BriefcaseBusiness,
  Building2,
  CircleDollarSign,
  CreditCard,
  Landmark,
  ReceiptText,
  ShieldCheck,
  Truck,
  Users,
  Warehouse,
} from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { BaseLayout } from "@/components/layouts/base-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const monthlyTrend = [
  { month: "Jan", revenue: 18400000, expense: 13200000, cash: 9200000 },
  { month: "Feb", revenue: 19150000, expense: 13800000, cash: 9700000 },
  { month: "Mar", revenue: 20300000, expense: 14600000, cash: 10100000 },
  { month: "Apr", revenue: 21700000, expense: 15400000, cash: 10800000 },
  { month: "May", revenue: 22900000, expense: 16100000, cash: 11600000 },
  { month: "Jun", revenue: 24100000, expense: 16800000, cash: 12400000 },
]

const modulePerformance = [
  { module: "Client Acquisition", revenue: 5.4, cost: 2.1, margin: 61 },
  { module: "HRIS", revenue: 4.8, cost: 2.6, margin: 46 },
  { module: "Compliance & Benefits", revenue: 3.2, cost: 1.1, margin: 66 },
  { module: "Financial Management", revenue: 6.7, cost: 2.4, margin: 64 },
  { module: "Supply Chain", revenue: 4.1, cost: 1.7, margin: 59 },
  { module: "Regional Deployment", revenue: 3.6, cost: 1.3, margin: 64 },
  { module: "Facilities & Admin", revenue: 2.9, cost: 1.0, margin: 66 },
  { module: "CRM", revenue: 2.4, cost: 0.8, margin: 67 },
]

const controlHighlights = [
  { area: "Accounts Receivable", value: "₱12.8M", change: "+8.2%", trend: "up", note: "Collections improved from enterprise service contracts." },
  { area: "Payroll & Benefits", value: "₱8.4M", change: "-2.1%", trend: "down", note: "Lower overtime variance after workforce optimization." },
  { area: "Cash Position", value: "₱15.6M", change: "+5.4%", trend: "up", note: "Healthy liquidity supported by disbursement controls." },
  { area: "Budget Variance", value: "-1.6%", change: "-0.4%", trend: "down", note: "Operating costs stayed within approved thresholds." },
]

const moduleTable = [
  { subsystem: "Client Acquisition", module: "Recruitment & Deployment", revenue: "₱5.4M", cost: "₱2.1M", margin: "61%" },
  { subsystem: "HRIS", module: "Payroll & Timekeeping", revenue: "₱4.8M", cost: "₱2.6M", margin: "46%" },
  { subsystem: "Compliance", module: "Benefits & Loans", revenue: "₱3.2M", cost: "₱1.1M", margin: "66%" },
  { subsystem: "Financial Mgmt", module: "GL / AP / AR", revenue: "₱6.7M", cost: "₱2.4M", margin: "64%" },
  { subsystem: "Supply Chain", module: "Inventory & Procurement", revenue: "₱4.1M", cost: "₱1.7M", margin: "59%" },
  { subsystem: "Operations", module: "Regional Deployment", revenue: "₱3.6M", cost: "₱1.3M", margin: "64%" },
]

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value)

export default function FinancialReportingAnalyticsPage() {
  return (
    <BaseLayout
      title="Financial Reporting & Analytics"
      description="Accounting intelligence for PMS operations spanning recruitment, deployment, workforce, finance, and regional-office operations."
    >
      <div className="space-y-6 px-4 lg:px-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue Performance</CardTitle>
              <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₱24.1M</div>
              <p className="text-xs text-muted-foreground">+11.8% vs prior period</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Operating Margin</CardTitle>
              <BadgeDollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">42.6%</div>
              <p className="text-xs text-muted-foreground">Stable after payroll normalization</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cash Position</CardTitle>
              <Landmark className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₱15.6M</div>
              <p className="text-xs text-muted-foreground">Healthy liquidity across all modules</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receivables</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₱12.8M</div>
              <p className="text-xs text-muted-foreground">Collections improving weekly</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Revenue, Expense & Cash Trend</CardTitle>
              <CardDescription>Monthly financial movement across ISMERS operations and support services.</CardDescription>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend}>
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `₱${value / 1000000}M`} />
                  <Tooltip formatter={(value: string | number | undefined) => formatCurrency(Number(value ?? 0))} />
                  <Area type="monotone" dataKey="revenue" stroke="#2563eb" fillOpacity={1} fill="url(#revenueFill)" />
                  <Area type="monotone" dataKey="expense" stroke="#f59e0b" fillOpacity={1} fill="url(#expenseFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Control Highlights</CardTitle>
              <CardDescription>Key financial controls and variance signals from the integrated system.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {controlHighlights.map((item) => (
                <div key={item.area} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{item.area}</p>
                      <p className="text-sm text-muted-foreground">{item.note}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{item.value}</p>
                      <p className={`text-xs ${item.trend === "up" ? "text-emerald-600" : "text-amber-600"}`}>
                        {item.trend === "up" ? <ArrowUpRight className="mr-1 inline h-3 w-3" /> : <ArrowDownRight className="mr-1 inline h-3 w-3" />} {item.change}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Module Profitability</CardTitle>
              <CardDescription>Revenue contribution and margin view by ISMERS subsystem.</CardDescription>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modulePerformance}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="module" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `₱${value}M`} />
                  <Tooltip formatter={(value: string | number | undefined) => `₱${Number(value ?? 0)}M`} />
                  <Bar dataKey="revenue" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Coverage Across ISMERS</CardTitle>
              <CardDescription>Finance-centric view of major domains and support functions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <p className="font-medium">Client & HR</p>
                  </div>
                  <p className="text-sm text-muted-foreground">Accounts for recruitment, deployment, payroll, and personnel operations.</p>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <p className="font-medium">Compliance & Benefits</p>
                  </div>
                  <p className="text-sm text-muted-foreground">Tracks statutory obligations, benefits, loans, and separation costs.</p>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Warehouse className="h-4 w-4 text-primary" />
                    <p className="font-medium">Inventory & Supply</p>
                  </div>
                  <p className="text-sm text-muted-foreground">Monitors procurement, warehousing, supplier performance, and stock valuation.</p>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Truck className="h-4 w-4 text-primary" />
                    <p className="font-medium">Regional Operations</p>
                  </div>
                  <p className="text-sm text-muted-foreground">Provides visibility into deployment, travel, accommodation, and operational-support costs.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Subsystem Financial Summary</CardTitle>
            <CardDescription>Consolidated economics for the main ISMERS service and enterprise modules.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subsystem</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Margin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {moduleTable.map((row) => (
                    <TableRow key={row.subsystem}>
                      <TableCell className="font-medium">{row.subsystem}</TableCell>
                      <TableCell>{row.module}</TableCell>
                      <TableCell>{row.revenue}</TableCell>
                      <TableCell>{row.cost}</TableCell>
                      <TableCell>{row.margin}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="bg-muted/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Financial Control</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <ReceiptText className="h-4 w-4 text-primary" />
                <span className="text-sm">Standardized journals for GL, AP, AR, and cash movements.</span>
              </div>
              <div className="flex items-center gap-2">
                <BriefcaseBusiness className="h-4 w-4 text-primary" />
                <span className="text-sm">Budget approvals tied to service delivery and staffing plans.</span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Operational Insight</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="text-sm">Regional deployment costs are monitored through travel, accommodation, and field-expense analytics.</span>
              </div>
              <div className="flex items-center gap-2">
                <Warehouse className="h-4 w-4 text-primary" />
                <span className="text-sm">Inventory and procurement costs are linked to deployment activity.</span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Executive Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span className="text-sm">ISMERS remains financially sound with improving collections and controlled spend.</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                <span className="text-sm">Projected growth is strongest in finance, compliance, and service delivery modules.</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </BaseLayout>
  )
}
