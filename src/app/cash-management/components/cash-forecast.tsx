"use client"

import { TrendingDown, TrendingUp, AlertTriangle } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { CashForecastPeriod, CashBankAccount } from "../data/mock-data"

interface CashForecastViewProps {
  forecast: CashForecastPeriod[]
  bankAccounts: CashBankAccount[]
}

const formatPHP = (val: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(val)

export function CashForecastView({ forecast, bankAccounts }: CashForecastViewProps) {
  const currentBalance = bankAccounts.filter(a => a.isActive).reduce((s, a) => s + a.ledgerBalance, 0)
  const totalProjectedInflow = forecast.filter(f => !f.isActual).reduce((s, f) => s + f.projectedInflow, 0)
  const totalProjectedOutflow = forecast.filter(f => !f.isActual).reduce((s, f) => s + f.projectedOutflow, 0)
  const lowestBalance = Math.min(...forecast.map(f => f.closingBalance))
  const lowestPeriod = forecast.find(f => f.closingBalance === lowestBalance)

  const minimumRequired = bankAccounts.filter(a => a.isActive).reduce((s, a) => s + a.minimumBalance, 0)
  const hasLiquidityRisk = lowestBalance < minimumRequired

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Cash Position</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPHP(currentBalance)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <TrendingUp className="size-3.5 text-emerald-500" /> Projected Inflows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatPHP(totalProjectedInflow)}</div>
            <div className="text-xs text-muted-foreground mt-1">Next 5 weeks</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <TrendingDown className="size-3.5 text-red-500" /> Projected Outflows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{formatPHP(totalProjectedOutflow)}</div>
            <div className="text-xs text-muted-foreground mt-1">Next 5 weeks</div>
          </CardContent>
        </Card>
        <Card className={hasLiquidityRisk ? "border-amber-300" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lowest Projected Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${hasLiquidityRisk ? "text-amber-600" : ""}`}>{formatPHP(lowestBalance)}</div>
            <div className="text-xs text-muted-foreground mt-1">{lowestPeriod?.period}</div>
          </CardContent>
        </Card>
      </div>

      {hasLiquidityRisk && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
            <AlertTriangle className="size-4" />
            Liquidity Alert — Projected balance ({formatPHP(lowestBalance)} in {lowestPeriod?.period}) may fall below minimum required ({formatPHP(minimumRequired)}).
          </div>
          <p className="mt-1 text-sm text-amber-700/80 dark:text-amber-400/80">
            Consider accelerating collections, deferring non-critical disbursements, or transferring from the reserve savings account.
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>6-Week Cash Flow Forecast</CardTitle>
          <CardDescription>
            Rolling projection of inflows, outflows, and closing balances across all ISMERS treasury accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Opening Balance</TableHead>
                  <TableHead className="text-right">Projected Inflow</TableHead>
                  <TableHead className="text-right">Projected Outflow</TableHead>
                  <TableHead className="text-right">Net Movement</TableHead>
                  <TableHead className="text-right">Closing Balance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forecast.map(period => {
                  const net = period.projectedInflow - period.projectedOutflow
                  const belowMin = period.closingBalance < minimumRequired
                  return (
                    <TableRow key={period.period} className={belowMin ? "bg-amber-50/50 dark:bg-amber-950/10" : ""}>
                      <TableCell className="font-medium">{period.period}</TableCell>
                      <TableCell className="text-right">{formatPHP(period.openingBalance)}</TableCell>
                      <TableCell className="text-right text-emerald-600">{formatPHP(period.projectedInflow)}</TableCell>
                      <TableCell className="text-right text-red-500">{formatPHP(period.projectedOutflow)}</TableCell>
                      <TableCell className={`text-right font-medium ${net >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {net >= 0 ? "+" : ""}{formatPHP(net)}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${belowMin ? "text-amber-600" : ""}`}>
                        {formatPHP(period.closingBalance)}
                      </TableCell>
                      <TableCell>
                        {period.isActual ? (
                          <Badge variant="outline" className="text-emerald-600 border-emerald-300">Actual</Badge>
                        ) : belowMin ? (
                          <Badge variant="outline" className="text-amber-600 border-amber-300">Watch</Badge>
                        ) : (
                          <Badge variant="outline">Projected</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Key Assumptions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-lg border p-3">
              <div className="font-medium text-foreground">Payroll Cycle</div>
              <p className="mt-1">Bi-monthly payroll runs on the 15th and 30th — estimated ₱750K–₱1.2M per cycle from HRIS Payroll subsystem.</p>
            </div>
            <div className="rounded-lg border p-3">
              <div className="font-medium text-foreground">Collection Inflows</div>
              <p className="mt-1">Based on AR aging and CRM pipeline — client acquisition and deployment billing expected mid-month.</p>
            </div>
            <div className="rounded-lg border p-3">
              <div className="font-medium text-foreground">Operating Outflows</div>
              <p className="mt-1">Fleet fuel, supply chain procurement, and facilities costs from respective subsystems.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Treasury Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-lg border p-3">
              <div className="font-medium">Maintain payroll pre-funding</div>
              <p className="mt-1 text-muted-foreground">Transfer ₱500K to BPI Payroll account before Jul W3 payroll run.</p>
            </div>
            <div className="rounded-lg border p-3">
              <div className="font-medium">Accelerate overdue collections</div>
              <p className="mt-1 text-muted-foreground">Follow up on Pacific Retail Group check (₱285K pending clearance).</p>
            </div>
            <div className="rounded-lg border p-3">
              <div className="font-medium">Petty cash replenishment</div>
              <p className="mt-1 text-muted-foreground">HR Recruitment fund at 71% — schedule replenishment before month-end.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
