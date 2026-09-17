"use client"

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts"
import { ArrowDownRight, ArrowUpRight, Landmark, TrendingUp, Wallet } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type {
  CashBankAccount,
  CashReceipt,
  CashDisbursement,
  DailyCashPosition,
  CashForecastPeriod,
} from "../data/mock-data"

interface CashDashboardProps {
  bankAccounts: CashBankAccount[]
  receipts: CashReceipt[]
  disbursements: CashDisbursement[]
  dailyPositions: DailyCashPosition[]
  forecast: CashForecastPeriod[]
}

const formatPHP = (val: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(val)

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  checking: "Checking",
  savings: "Savings",
  petty_cash: "Petty Cash",
  payroll: "Payroll",
  trust: "Trust",
}

const PIE_COLORS = ["#6366f1", "#8b5cf6", "#22c55e", "#f97316", "#ec4899", "#06b6d4"]

export function CashDashboard({ bankAccounts, receipts, disbursements, dailyPositions, forecast }: CashDashboardProps) {
  const totalLedgerBalance = bankAccounts.filter(a => a.isActive).reduce((s, a) => s + a.ledgerBalance, 0)
  const totalBankBalance = bankAccounts.filter(a => a.isActive).reduce((s, a) => s + a.bankBalance, 0)
  const unreconciledDiff = totalLedgerBalance - totalBankBalance

  const monthInflow = receipts
    .filter(r => r.status !== "voided" && r.date.startsWith("2026-07"))
    .reduce((s, r) => s + r.amount, 0)
  const monthOutflow = disbursements
    .filter(d => d.status !== "voided" && d.date.startsWith("2026-07"))
    .reduce((s, d) => s + d.amount, 0)
  const netCashFlow = monthInflow - monthOutflow

  const pendingReceipts = receipts.filter(r => r.status === "pending").reduce((s, r) => s + r.amount, 0)
  const pendingDisbursements = disbursements.filter(d => d.status === "pending").reduce((s, d) => s + d.amount, 0)

  const accountBreakdown = bankAccounts
    .filter(a => a.isActive)
    .map(a => ({
      name: a.name.length > 22 ? a.name.substring(0, 22) + "…" : a.name,
      value: a.ledgerBalance,
      type: ACCOUNT_TYPE_LABELS[a.accountType],
    }))
    .sort((a, b) => b.value - a.value)

  const subsystemInflow: Record<string, number> = {}
  receipts.filter(r => r.status !== "voided").forEach(r => {
    subsystemInflow[r.subsystem] = (subsystemInflow[r.subsystem] || 0) + r.amount
  })
  const inflowBySubsystem = Object.entries(subsystemInflow)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)

  const subsystemOutflow: Record<string, number> = {}
  disbursements.filter(d => d.status !== "voided").forEach(d => {
    subsystemOutflow[d.subsystem] = (subsystemOutflow[d.subsystem] || 0) + d.amount
  })
  const outflowBySubsystem = Object.entries(subsystemOutflow)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)

  const liquidityAccounts = bankAccounts.filter(a => a.isActive && a.accountType !== "petty_cash")
  const belowMinimum = liquidityAccounts.filter(a => a.ledgerBalance < a.minimumBalance)

  const forecastChartData = forecast.map(f => ({
    period: f.period,
    inflow: f.projectedInflow,
    outflow: f.projectedOutflow,
    balance: f.closingBalance,
    isActual: f.isActual,
  }))

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Daily Position Trend */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              Daily Cash Position (Jul 2026)
            </CardTitle>
            <CardDescription>Consolidated closing balance across all treasury accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ closingBalance: { label: "Closing Balance" } }} className="h-[240px] w-full">
              <AreaChart data={dailyPositions}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tickFormatter={d => d.slice(5)} fontSize={11} />
                <YAxis tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} fontSize={11} />
                <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatPHP(Number(v))} />} />
                <Area type="monotone" dataKey="closingBalance" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="size-4 text-primary" />
              Liquidity Summary
            </CardTitle>
            <CardDescription>Current month cash movement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm">
                <ArrowUpRight className="size-4 text-emerald-500" />
                <span className="text-muted-foreground">Total Inflow</span>
              </div>
              <span className="font-semibold text-emerald-600">{formatPHP(monthInflow)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm">
                <ArrowDownRight className="size-4 text-red-500" />
                <span className="text-muted-foreground">Total Outflow</span>
              </div>
              <span className="font-semibold text-red-500">{formatPHP(monthOutflow)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-3">
              <span className="text-sm font-medium">Net Cash Flow</span>
              <span className={`font-bold ${netCashFlow >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {formatPHP(netCashFlow)}
              </span>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Pending receipts</span>
                <span className="font-medium text-foreground">{formatPHP(pendingReceipts)}</span>
              </div>
              <div className="flex justify-between">
                <span>Pending disbursements</span>
                <span className="font-medium text-foreground">{formatPHP(pendingDisbursements)}</span>
              </div>
              <div className="flex justify-between">
                <span>Ledger vs bank variance</span>
                <span className={`font-medium ${unreconciledDiff !== 0 ? "text-amber-600" : "text-emerald-600"}`}>
                  {formatPHP(Math.abs(unreconciledDiff))} {unreconciledDiff !== 0 ? "(unreconciled)" : "(matched)"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cash by Account</CardTitle>
            <CardDescription>Ledger balance distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ value: { label: "Balance" } }} className="mx-auto h-[200px] w-full">
              <PieChart>
                <Pie data={accountBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}>
                  {accountBreakdown.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatPHP(Number(v))} />} />
              </PieChart>
            </ChartContainer>
            <div className="mt-2 space-y-1">
              {accountBreakdown.slice(0, 4).map((a, i) => (
                <div key={a.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="size-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                    <span className="text-muted-foreground truncate max-w-[140px]">{a.name}</span>
                  </div>
                  <span className="font-medium">{formatPHP(a.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inflow by Subsystem</CardTitle>
            <CardDescription>Cash receipts by ISMERS domain</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ amount: { label: "Inflow" } }} className="h-[240px] w-full">
              <BarChart data={inflowBySubsystem} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                <XAxis type="number" tickFormatter={v => `${(v / 1000).toFixed(0)}K`} fontSize={10} />
                <YAxis type="category" dataKey="name" width={90} fontSize={10} />
                <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatPHP(Number(v))} />} />
                <Bar dataKey="amount" fill="var(--chart-2)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Outflow by Subsystem</CardTitle>
            <CardDescription>Cash disbursements by ISMERS domain</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ amount: { label: "Outflow" } }} className="h-[240px] w-full">
              <BarChart data={outflowBySubsystem} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                <XAxis type="number" tickFormatter={v => `${(v / 1000).toFixed(0)}K`} fontSize={10} />
                <YAxis type="category" dataKey="name" width={90} fontSize={10} />
                <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatPHP(Number(v))} />} />
                <Bar dataKey="amount" fill="var(--chart-3)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Account Health + Forecast */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Landmark className="size-4 text-primary" />
              Account Minimum Balance Monitor
            </CardTitle>
            <CardDescription>Accounts below required minimum balance threshold</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {belowMinimum.length === 0 ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-400">
                All liquidity accounts are above minimum balance requirements.
              </div>
            ) : (
              belowMinimum.map(a => {
                const pct = Math.round((a.ledgerBalance / a.minimumBalance) * 100)
                return (
                  <div key={a.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{a.name}</span>
                      <Badge variant="outline" className="text-amber-600 border-amber-300">Below Minimum</Badge>
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                      <span>Balance: {formatPHP(a.ledgerBalance)}</span>
                      <span>Min: {formatPHP(a.minimumBalance)}</span>
                    </div>
                    <Progress value={pct} className="mt-2 h-1.5" />
                  </div>
                )
              })
            )}
            {liquidityAccounts.filter(a => a.ledgerBalance >= a.minimumBalance).slice(0, 3).map(a => {
              const pct = Math.min(100, Math.round((a.ledgerBalance / (a.minimumBalance * 3)) * 100))
              return (
                <div key={a.id} className="rounded-lg border p-3 opacity-80">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{a.name}</span>
                    <Badge variant="outline" className="text-emerald-600 border-emerald-300">Healthy</Badge>
                  </div>
                  <Progress value={pct} className="mt-2 h-1.5" />
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">6-Week Cash Forecast</CardTitle>
            <CardDescription>Projected inflows, outflows, and closing balances</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ balance: { label: "Closing Balance" } }} className="h-[280px] w-full">
              <AreaChart data={forecastChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="period" fontSize={10} />
                <YAxis tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} fontSize={10} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(v, name) => [
                        formatPHP(Number(v)),
                        name === "balance" ? "Closing Balance" : name === "inflow" ? "Inflow" : "Outflow",
                      ]}
                    />
                  }
                />
                <Area type="monotone" dataKey="inflow" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} strokeWidth={1.5} />
                <Area type="monotone" dataKey="outflow" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} strokeWidth={1.5} />
                <Area type="monotone" dataKey="balance" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.2} strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
