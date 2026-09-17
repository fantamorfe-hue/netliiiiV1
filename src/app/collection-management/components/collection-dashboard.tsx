"use client"

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type {
  CustomerAccount, CollectionInvoice, PaymentReceipt, CollectionBankAccount
} from "../data/mock-data"

interface CollectionDashboardProps {
  customers: CustomerAccount[]
  invoices: CollectionInvoice[]
  receipts: PaymentReceipt[]
  bankAccounts: CollectionBankAccount[]
}

const formatPHP = (val: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(val)

const AGING_COLORS = ["#22c55e", "#84cc16", "#eab308", "#f97316", "#ef4444"]

export function CollectionDashboard({ customers, invoices, receipts, bankAccounts }: CollectionDashboardProps) {
  const totalAR = invoices.filter(i => i.status !== "paid" && i.status !== "void").reduce((s, i) => s + i.balanceAmount, 0)
  const overdueAR = invoices.filter(i => i.status === "overdue").reduce((s, i) => s + i.balanceAmount, 0)
  const collectedThisMonth = receipts.filter(r => r.status === "cleared" && r.datePaid.startsWith("2026-07")).reduce((s, r) => s + r.amountReceived, 0)
  const pendingReceipts = receipts.filter(r => r.status === "pending").reduce((s, r) => s + r.amountReceived, 0)
  const totalBankBalance = bankAccounts.reduce((s, b) => s + b.balance, 0)
  const collectionRate = totalAR > 0 ? Math.round((collectedThisMonth / (totalAR + collectedThisMonth)) * 100) : 0

  // Aging buckets
  const agingData = [
    { label: "Current", bucket: "current", amount: invoices.filter(i => i.agingBucket === "current" && i.balanceAmount > 0).reduce((s, i) => s + i.balanceAmount, 0) },
    { label: "1-30 Days", bucket: "1-30", amount: invoices.filter(i => i.agingBucket === "1-30" && i.balanceAmount > 0).reduce((s, i) => s + i.balanceAmount, 0) },
    { label: "31-60 Days", bucket: "31-60", amount: invoices.filter(i => i.agingBucket === "31-60" && i.balanceAmount > 0).reduce((s, i) => s + i.balanceAmount, 0) },
    { label: "61-90 Days", bucket: "61-90", amount: invoices.filter(i => i.agingBucket === "61-90" && i.balanceAmount > 0).reduce((s, i) => s + i.balanceAmount, 0) },
    { label: ">90 Days", bucket: "over_90", amount: invoices.filter(i => i.agingBucket === "over_90" && i.balanceAmount > 0).reduce((s, i) => s + i.balanceAmount, 0) },
  ]

  // Monthly collection trend (simulated)
  const trendData = [
    { month: "Feb", collected: 1820000, target: 2000000 },
    { month: "Mar", collected: 2340000, target: 2200000 },
    { month: "Apr", collected: 1950000, target: 2100000 },
    { month: "May", collected: 2680000, target: 2400000 },
    { month: "Jun", collected: 2120000, target: 2300000 },
    { month: "Jul", collected: collectedThisMonth, target: 2500000 },
  ]

  // Subsystem breakdown
  const subsystemMap: Record<string, number> = {}
  invoices.filter(i => i.balanceAmount > 0).forEach(i => {
    subsystemMap[i.subsystem] = (subsystemMap[i.subsystem] || 0) + i.balanceAmount
  })
  const subsystemData = Object.entries(subsystemMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)

  const PIE_COLORS = ["#6366f1","#8b5cf6","#a78bfa","#ec4899","#f43f5e","#f97316","#eab308","#22c55e"]

  const dunningCounts = {
    none: customers.filter(c => c.dunningStage === "none").length,
    reminder: customers.filter(c => c.dunningStage === "reminder").length,
    first: customers.filter(c => c.dunningStage === "first_notice").length,
    second: customers.filter(c => c.dunningStage === "second_notice").length,
    final: customers.filter(c => c.dunningStage === "final_notice").length,
    legal: customers.filter(c => c.dunningStage === "legal").length,
  }

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Metric Cards Row 2 */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* Collection Trend Chart */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              Monthly Collection Performance
            </CardTitle>
            <CardDescription>Actual vs. target collections (PHP)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ collected: { label: "Collected", color: "hsl(var(--primary))" }, target: { label: "Target", color: "hsl(var(--muted-foreground))" } }} className="h-[220px] w-full">
              <AreaChart data={trendData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                <defs>
                  <linearGradient id="colGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-[11px]" />
                <YAxis tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} className="text-[11px]" />
                <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatPHP(Number(v))} />} />
                <Area type="monotone" dataKey="target" stroke="hsl(var(--muted-foreground))" strokeDasharray="4 3" fill="none" />
                <Area type="monotone" dataKey="collected" stroke="hsl(var(--primary))" fill="url(#colGrad)" strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Dunning Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-500" />
              Dunning Pipeline
            </CardTitle>
            <CardDescription>Collection escalation by stage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {[
              { label: "No Action", count: dunningCounts.none, color: "bg-emerald-500" },
              { label: "Reminder", count: dunningCounts.reminder, color: "bg-lime-500" },
              { label: "1st Notice", count: dunningCounts.first, color: "bg-amber-500" },
              { label: "2nd Notice", count: dunningCounts.second, color: "bg-orange-500" },
              { label: "Final Notice", count: dunningCounts.final, color: "bg-red-500" },
              { label: "Legal", count: dunningCounts.legal, color: "bg-rose-700" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="w-24 text-xs text-muted-foreground shrink-0">{item.label}</span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${Math.min(100, (item.count / customers.length) * 100)}%` }} />
                </div>
                <span className="text-xs font-semibold w-4 text-right">{item.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* AR Aging + Subsystem */}
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>AR Aging Summary</CardTitle>
            <CardDescription>Outstanding balance by days overdue</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ amount: { label: "Balance", color: "hsl(var(--primary))" } }} className="h-[220px] w-full">
              <BarChart data={agingData} layout="vertical" margin={{ top: 0, right: 12, left: 12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                <XAxis type="number" tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} className="text-[11px]" />
                <YAxis type="category" dataKey="label" width={72} className="text-[11px]" />
                <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatPHP(Number(v))} />} />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                  {agingData.map((_, i) => (
                    <Cell key={i} fill={AGING_COLORS[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
            <div className="mt-4 space-y-2">
              {agingData.map((bucket, i) => (
                <div key={bucket.label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="size-3 rounded-full" style={{ backgroundColor: AGING_COLORS[i] }} />
                    <span className="text-muted-foreground">{bucket.label}</span>
                  </div>
                  <span className="font-medium">{formatPHP(bucket.amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Outstanding by Subsystem</CardTitle>
            <CardDescription>AR balance distribution across ISMERS modules</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ value: { label: "Balance", color: "hsl(var(--primary))" } }} className="h-[180px] w-full">
              <PieChart>
                <Pie data={subsystemData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name">
                  {subsystemData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatPHP(Number(v))} />} />
              </PieChart>
            </ChartContainer>
            <div className="mt-2 space-y-1.5">
              {subsystemData.slice(0, 5).map((item, i) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="size-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-muted-foreground truncate max-w-[130px]">{item.name}</span>
                  </div>
                  <span className="font-medium">{formatPHP(item.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bank Account Balances */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-500" />
            Collection Bank Accounts
          </CardTitle>
          <CardDescription>Live balance positions and pending deposit queue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {bankAccounts.map(bank => {
              const utilization = Math.min(100, Math.round((bank.pendingDeposits / (bank.balance + bank.pendingDeposits)) * 100))
              return (
                <div key={bank.id} className="rounded-xl border bg-card/40 p-4 space-y-2">
                  <p className="text-sm font-semibold truncate">{bank.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{bank.accountNo}</p>
                  <p className="text-xl font-bold tracking-tight">{formatPHP(bank.balance)}</p>
                  {bank.pendingDeposits > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-amber-500 flex items-center gap-1"><Clock className="size-3" /> Pending</span>
                        <span className="text-amber-500 font-medium">{formatPHP(bank.pendingDeposits)}</span>
                      </div>
                      <Progress value={utilization} className="h-1.5" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Collection efficiency */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Collection Rate</CardTitle>
            <CardDescription>July 2026</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 mb-4">
              <span className="text-4xl font-bold">{collectionRate}%</span>
              <span className="text-sm text-emerald-500 flex items-center gap-1 mb-1"><TrendingUp className="size-4" /> +3.2% vs last month</span>
            </div>
            <Progress value={collectionRate} className="h-3 mb-2" />
            <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground text-xs">Collected (Jul)</p>
                <p className="font-semibold mt-1">{formatPHP(collectedThisMonth)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground text-xs">Still Pending</p>
                <p className="font-semibold mt-1">{formatPHP(pendingReceipts)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Receivables At Risk</CardTitle>
            <CardDescription>Largest overdue balances by client</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {customers
                .filter(c => c.overdueBalance > 0)
                .sort((a, b) => b.overdueBalance - a.overdueBalance)
                .slice(0, 4)
                .map(c => (
                  <div key={c.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-xs truncate max-w-[180px]">{c.clientName}</p>
                      <p className="text-muted-foreground text-[11px]">{c.paymentTerms} · {c.dunningStage.replace(/_/g, " ")}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-500">{formatPHP(c.overdueBalance)}</p>
                      <Badge
                        variant="outline"
                        className={`text-[10px] mt-0.5 ${c.dunningStage === "final_notice" ? "border-red-500 text-red-500" : c.dunningStage === "second_notice" ? "border-orange-500 text-orange-500" : "border-amber-500 text-amber-500"}`}
                      >
                        {c.agingBucket}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
