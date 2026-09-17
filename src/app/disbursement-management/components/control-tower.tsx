"use client"

import * as React from "react"
import { ArrowRight, CalendarClock, Landmark, ShieldCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  clientSiteRisks,
  detectExceptions,
  dueInfo,
  isProtectedVoucher,
  payrollProtection,
  priorityTier,
  priorityWeight,
} from "../data/disbursement-rules"
import {
  clientSiteName,
  clientSites,
  type BankAccount,
  type DisbursementRequest,
  type PriorityTier,
  type ReconciliationItem,
  type Voucher,
} from "../data/mock-data"
import { Money, PriorityBadge, DueBadge, formatPHP } from "./disbursement-ui"

interface ControlTowerProps {
  bankAccounts: BankAccount[]
  vouchers: Voucher[]
  requests: DisbursementRequest[]
  reconciliationItems: ReconciliationItem[]
  onOpenVoucher: (voucherId: string) => void
  onOpenRequest: (requestId: string) => void
  onNavigate: (workspace: "inbox" | "runs" | "registers") => void
}

interface QueueEntry {
  id: string
  kind: "voucher" | "request"
  title: string
  amount: number
  tier: PriorityTier
  dueDate: string
  site?: string
  area: string
  headcount?: number
}

export function ControlTower({
  bankAccounts,
  vouchers,
  requests,
  reconciliationItems,
  onOpenVoucher,
  onOpenRequest,
  onNavigate,
}: ControlTowerProps) {
  const coverage = React.useMemo(() => payrollProtection(bankAccounts, vouchers), [bankAccounts, vouchers])
  const risks = React.useMemo(() => clientSiteRisks(vouchers, clientSites, undefined, 7), [vouchers])
  const exceptions = React.useMemo(
    () => detectExceptions({ requests, eftBatches: [], reconciliationItems }),
    [requests, reconciliationItems],
  )

  const dueWindow = React.useMemo(() => {
    const tiers: Record<PriorityTier, number> = {
      Payroll: 0,
      Statutory: 0,
      "Client-site critical": 0,
      Contractual: 0,
      Discretionary: 0,
    }
    let total = 0
    vouchers
      .filter((v) => v.status !== "paid")
      .forEach((v) => {
        const info = dueInfo(v.dueDate)
        if (info.days > 7) return
        const tier = priorityTier(v.category, v.isPayroll)
        tiers[tier] += v.amount
        total += v.amount
      })
    return { tiers, total }
  }, [vouchers])

  const queue = React.useMemo<QueueEntry[]>(() => {
    const entries: QueueEntry[] = []
    vouchers
      .filter((v) => v.status === "approved" || v.status === "processing")
      .forEach((v) => {
        entries.push({
          id: v.id,
          kind: "voucher",
          title: v.payee,
          amount: v.amount,
          tier: priorityTier(v.category, v.isPayroll),
          dueDate: v.dueDate,
          site: clientSiteName(v.clientSiteId),
          area: v.operationalArea,
          headcount: v.headcount,
        })
      })
    requests
      .filter((r) => r.status === "pending" || r.status === "on_hold")
      .forEach((r) => {
        entries.push({
          id: r.id,
          kind: "request",
          title: `${r.title} · ${r.payee}`,
          amount: r.amount,
          tier: priorityTier(r.requestType, isProtectedVoucher(r) && /payroll/i.test(r.title)),
          dueDate: r.dueDate,
          site: clientSiteName(r.clientSiteId),
          area: r.operationalArea,
          headcount: r.headcount,
        })
      })
    return entries
      .sort((a, b) => {
        const weight = priorityWeight(a.tier) - priorityWeight(b.tier)
        if (weight !== 0) return weight
        return dueInfo(a.dueDate).days - dueInfo(b.dueDate).days
      })
      .slice(0, 8)
  }, [vouchers, requests])

  const coveragePct = Number.isFinite(coverage.coverageRatio) ? coverage.coverageRatio : null
  const coverageDays = Number.isFinite(coverage.coverageDays) ? `${coverage.coverageDays} days` : "No protected obligations"

  return (
    <div className="space-y-5 px-4 lg:px-6">
      {/* Coverage banner */}
      <div
        className={`rounded-xl border px-4 py-4 ${coverage.covered ? "border-emerald-500/30 bg-emerald-500/5" : "border-rose-500/40 bg-rose-500/5"}`}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className={`rounded-lg p-2 ${coverage.covered ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}>
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">
                {coverage.covered ? "Payroll & statutory obligations are cash-covered" : "Payroll coverage shortfall"}
              </p>
              <p className="text-xs text-muted-foreground">
                {coverage.covered
                  ? `${coverageDays} of protected coverage. Available cash exceeds payroll and mandatory remittances.`
                  : `${formatPHP(coverage.shortfall)} short of the protected obligation queue.`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-right">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Available cash</p>
              <Money value={coverage.availableCash} className="text-lg font-bold" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Protected due</p>
              <Money value={coverage.protectedDue} className="text-lg font-bold" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Coverage</p>
              <span className={`text-lg font-bold tabular-nums ${coverage.covered ? "text-emerald-600" : "text-rose-600"}`}>
                {coveragePct === null ? "—" : `${coveragePct.toFixed(2)}x`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Four decision measures */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Protected payroll coverage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className={`text-2xl font-bold tracking-tight ${coverage.covered ? "text-emerald-600" : "text-rose-600"}`}>
              {coveragePct === null ? "—" : `${coveragePct.toFixed(2)}x`}
            </p>
            <p className="text-xs text-muted-foreground">{coverageDays}</p>
            <p className="text-[11px] text-muted-foreground">
              Payroll + statutory due <Money value={coverage.protectedDue} className="font-semibold" />
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Payments due in 7 days</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <Money value={dueWindow.total} className="text-2xl font-bold tracking-tight block" />
            {(
              [
                ["Payroll", dueWindow.tiers.Payroll],
                ["Statutory", dueWindow.tiers.Statutory],
                ["Client-site critical", dueWindow.tiers["Client-site critical"]],
                ["Discretionary", dueWindow.tiers.Discretionary],
              ] as [PriorityTier, number][]
            ).map(([tier, amount]) => (
              <div key={tier} className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">{tier}</span>
                <Money value={amount} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Client-site continuity at risk</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-2xl font-bold tracking-tight">{risks.length}</p>
            {risks.length === 0 ? (
              <p className="text-xs text-muted-foreground">No continuity payments due within 7 days.</p>
            ) : (
              risks.slice(0, 3).map((risk) => (
                <button
                  key={risk.voucher.id}
                  onClick={() => onOpenVoucher(risk.voucher.id)}
                  className="w-full text-left rounded-md border bg-background/50 px-2 py-1.5 hover:border-muted-foreground/40"
                >
                  <p className="text-[11px] font-medium truncate">{risk.site.siteName}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {risk.voucher.payee} · {risk.due.label}
                  </p>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Approval & bank exceptions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-2xl font-bold tracking-tight text-rose-600">{exceptions.length}</p>
            {exceptions.length === 0 ? (
              <p className="text-xs text-muted-foreground">No open exceptions.</p>
            ) : (
              exceptions.slice(0, 3).map((exception) => (
                <div key={exception.id} className="flex items-start gap-2">
                  <span className={`mt-1 h-1.5 w-1.5 rounded-full shrink-0 ${exception.severity === "high" ? "bg-rose-500" : "bg-amber-500"}`} />
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium truncate">{exception.label}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{exception.detail}</p>
                  </div>
                </div>
              ))
            )}
            {exceptions.length > 0 && (
              <Button variant="ghost" size="sm" className="h-7 px-1 text-xs cursor-pointer" onClick={() => onNavigate("registers")}>
                View exceptions <ArrowRight className="size-3 ml-1" />
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Priority queue */}
      <Card className="bg-card/50">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Cash-to-Deployment Priority Queue</CardTitle>
            <CardDescription>Sorted by policy risk and due date, not status</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs cursor-pointer" onClick={() => onNavigate("inbox")}>
              Approval Inbox
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs cursor-pointer" onClick={() => onNavigate("runs")}>
              Payment Runs
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-3">Priority</th>
                  <th className="py-2 pr-3">Payee / Request</th>
                  <th className="py-2 pr-3">Client-site impact</th>
                  <th className="py-2 pr-3">Due</th>
                  <th className="py-2 pr-3 text-right">Amount</th>
                  <th className="py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {queue.map((entry) => (
                  <tr key={`${entry.kind}-${entry.id}`} className="hover:bg-muted/10">
                    <td className="py-2.5 pr-3">
                      <PriorityBadge tier={entry.tier} />
                    </td>
                    <td className="py-2.5 pr-3">
                      <p className="font-medium text-xs truncate max-w-[260px]">{entry.title}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{entry.id} · {entry.area}</p>
                    </td>
                    <td className="py-2.5 pr-3 text-xs">
                      {entry.site ? (
                        <span className="text-foreground">{entry.site}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                      {entry.headcount ? <span className="text-muted-foreground"> · {entry.headcount} staff</span> : null}
                    </td>
                    <td className="py-2.5 pr-3">
                      <DueBadge dueDate={entry.dueDate} beforeCutoff={entry.tier === "Payroll" || entry.tier === "Statutory"} />
                    </td>
                    <td className="py-2.5 pr-3 text-right">
                      <Money value={entry.amount} className="text-xs font-semibold" />
                    </td>
                    <td className="py-2.5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs cursor-pointer"
                        onClick={() => (entry.kind === "voucher" ? onOpenVoucher(entry.id) : onOpenRequest(entry.id))}
                      >
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
                {queue.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                      No outstanding payments or approvals.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Funding sources */}
      <Card className="bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Landmark className="size-4 text-muted-foreground" /> Funding Sources
          </CardTitle>
          <CardDescription>Available cash after reservations at each bank</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {bankAccounts.map((account) => (
              <div key={account.id} className="rounded-lg border bg-card/40 px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium truncate">{account.name}</p>
                  <Badge variant="outline" className="text-[9px] capitalize">{account.accountType.replace("_", " ")}</Badge>
                </div>
                <Money value={account.availableBalance} className="text-lg font-bold block mt-1" />
                <p className="text-[10px] text-muted-foreground">
                  Book {formatPHP(account.bookBalance)} · Reserved {formatPHP(account.reservedBalance)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <CalendarClock className="size-3.5" />
        Control Tower prioritizes payroll protection and client-site continuity over discretionary spend.
      </div>
    </div>
  )
}
