"use client"

import * as React from "react"
import {
  AlertCircle,
  ArrowRight,
  Ban,
  CheckSquare,
  Coins,
  CreditCard,
  Landmark,
  Send,
  ShieldCheck,
  Square,
  Stamp,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  clientSiteName,
  type AuditLog,
  type BankAccount,
  type PaymentMethod,
  type PaymentRun,
  type PaymentRunStatus,
  type Voucher,
} from "../data/mock-data"
import {
  accountPaymentBlockReason,
  allowedMethodsForSelection,
  deriveRunType,
  dueInfo,
  isProtectedVoucher,
  payrollProtection,
  priorityTier,
  priorityWeight,
  validatePettyCashCap,
} from "../data/disbursement-rules"
import { ContextList, DetailSection, DueBadge, Money, PriorityBadge, RecordDrawer, formatPHP } from "./disbursement-ui"

interface PaymentRunsProps {
  bankAccounts: BankAccount[]
  vouchers: Voucher[]
  paymentRuns: PaymentRun[]
  auditLogs: AuditLog[]
  onCreateRun: (voucherIds: string[], bankAccountId: string, paymentMethod: PaymentMethod, maker: string) => void
  onSubmitRunForApproval: (runId: string) => void
  onApproveRun: (runId: string) => void
  onTransmitRun: (runId: string) => void
  onCancelRun: (runId: string) => void
}

type RunFilter = "all" | "payroll" | "statutory" | "client_site" | "due_week" | "unfunded"

const FILTERS: { id: RunFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "payroll", label: "Payroll" },
  { id: "statutory", label: "Statutory" },
  { id: "client_site", label: "Client-site critical" },
  { id: "due_week", label: "Due this week" },
  { id: "unfunded", label: "Unfunded" },
]

const METHOD_OPTIONS: { id: PaymentMethod; label: string; icon: typeof Landmark }[] = [
  { id: "EFT", label: "EFT / Direct", icon: Landmark },
  { id: "Check", label: "Paper Check", icon: CreditCard },
  { id: "Wire", label: "Bank Wire", icon: Send },
  { id: "Cash", label: "Petty Cash", icon: Coins },
]

const RUN_STATUS_STYLES: Record<PaymentRunStatus, string> = {
  draft: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  for_approval: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  approved: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  transmitted: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  settled: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  cancelled: "bg-rose-500/10 text-rose-500 border-rose-500/20",
}

export function PaymentRuns({
  bankAccounts,
  vouchers,
  paymentRuns,
  auditLogs,
  onCreateRun,
  onSubmitRunForApproval,
  onApproveRun,
  onTransmitRun,
  onCancelRun,
}: PaymentRunsProps) {
  const [selectedVouchers, setSelectedVouchers] = React.useState<string[]>([])
  const [selectedBankId, setSelectedBankId] = React.useState<string>("bank-1")
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("EFT")
  const [filter, setFilter] = React.useState<RunFilter>("all")
  const [maker, setMaker] = React.useState("Clara Reyes")
  const [confirmCreate, setConfirmCreate] = React.useState(false)
  const [confirmTransmit, setConfirmTransmit] = React.useState<PaymentRun | null>(null)
  const [selectedVoucherId, setSelectedVoucherId] = React.useState<string | null>(null)
  const [selectedRunId, setSelectedRunId] = React.useState<string | null>(null)

  const coverage = React.useMemo(() => payrollProtection(bankAccounts, vouchers), [bankAccounts, vouchers])

  const queue = React.useMemo(() => {
    return vouchers
      .filter((v) => v.status === "approved" && !v.paymentRunId)
      .filter((v) => {
        const tier = priorityTier(v.category, v.isPayroll)
        switch (filter) {
          case "all":
            return true
          case "payroll":
            return tier === "Payroll"
          case "statutory":
            return tier === "Statutory"
          case "client_site":
            return tier === "Client-site critical"
          case "due_week":
            return dueInfo(v.dueDate).days <= 7
          case "unfunded":
            return coverage.availableCash < v.amount
          default:
            return true
        }
      })
      .sort((a, b) => {
        const weight = priorityWeight(priorityTier(a.category, a.isPayroll)) - priorityWeight(priorityTier(b.category, b.isPayroll))
        if (weight !== 0) return weight
        return dueInfo(a.dueDate).days - dueInfo(b.dueDate).days
      })
  }, [vouchers, filter, coverage.availableCash])

  const selectedBank = bankAccounts.find((b) => b.id === selectedBankId)
  const selectedList = vouchers.filter((v) => selectedVouchers.includes(v.id))
  const totalAmountSelected = selectedList.reduce((sum, v) => sum + v.amount, 0)

  const allowedMethods = React.useMemo(
    () => allowedMethodsForSelection(selectedList, selectedBank?.accountType ?? "checking"),
    [selectedList, selectedBank],
  )

  React.useEffect(() => {
    if (allowedMethods.length > 0 && !allowedMethods.includes(paymentMethod)) {
      setPaymentMethod(allowedMethods[0])
    }
  }, [allowedMethods, paymentMethod])

  const blockReason = selectedBank ? accountPaymentBlockReason(selectedBank.accountType, selectedList) : null
  const capError = validatePettyCashCap(paymentMethod, totalAmountSelected)
  const remainingBalance = selectedBank ? selectedBank.availableBalance - totalAmountSelected : 0
  const insufficient = remainingBalance < 0
  const selectionProtected = selectedList.some(isProtectedVoucher)

  const projected = (() => {
    const protectedDue = coverage.protectedDue + selectedList.filter(isProtectedVoucher).reduce((s, v) => s + v.amount, 0)
    const ratio = protectedDue === 0 ? Number.POSITIVE_INFINITY : coverage.availableCash / protectedDue
    return { protectedDue, ratio }
  })()

  const toggleSelect = (id: string) =>
    setSelectedVouchers((prev) => (prev.includes(id) ? prev.filter((vId) => vId !== id) : [...prev, id]))

  const toggleSelectAll = () => {
    if (selectedVouchers.length === queue.length) setSelectedVouchers([])
    else setSelectedVouchers(queue.map((v) => v.id))
  }

  const submitCreate = () => {
    onCreateRun(selectedVouchers, selectedBankId, paymentMethod, maker.trim() || "Unknown Maker")
    setSelectedVouchers([])
  }

  const handleCreateClick = () => {
    if (selectedVouchers.length === 0 || blockReason || capError || insufficient) return
    if (selectionProtected) {
      setConfirmCreate(true)
      return
    }
    submitCreate()
  }

  const runTypePreview = selectedList.length > 0 ? deriveRunType(selectedList, paymentMethod) : null

  const voucherDrawer = vouchers.find((v) => v.id === selectedVoucherId)
  const runDrawer = paymentRuns.find((r) => r.id === selectedRunId)
  const runDrawerVouchers = runDrawer ? vouchers.filter((v) => runDrawer.voucherIds.includes(v.id)) : []

  return (
    <div className="space-y-5 px-4 lg:px-6">
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          <Card className="bg-card/50">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3">
              <div>
                <CardTitle className="text-base">Payment Queue</CardTitle>
                <CardDescription>Approved, unpaid vouchers — sorted by policy risk</CardDescription>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {FILTERS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setFilter(item.id)}
                    className={`rounded-md border px-2 py-1 text-[11px] font-medium cursor-pointer ${
                      filter === item.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {queue.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-lg">
                  <Coins className="size-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">Queue empty</p>
                  <p className="text-xs text-muted-foreground/80">No vouchers match this filter.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-2 pb-2 text-xs text-muted-foreground border-b">
                    <button onClick={toggleSelectAll} className="flex items-center gap-2 font-medium hover:text-foreground cursor-pointer">
                      {selectedVouchers.length === queue.length && queue.length > 0 ? (
                        <CheckSquare className="size-4 text-primary" />
                      ) : (
                        <Square className="size-4" />
                      )}
                      Select all ({queue.length})
                    </button>
                  </div>
                  <div className="max-h-[520px] overflow-y-auto pr-1 space-y-2">
                    {queue.map((voucher) => {
                      const isSelected = selectedVouchers.includes(voucher.id)
                      return (
                        <div
                          key={voucher.id}
                          onClick={() => toggleSelect(voucher.id)}
                          className={`flex items-start gap-3 rounded-lg border p-3 transition-colors cursor-pointer ${
                            isSelected ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30 bg-card/40"
                          }`}
                        >
                          <div className="mt-1">
                            {isSelected ? <CheckSquare className="size-4 text-primary" /> : <Square className="size-4 text-muted-foreground" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <PriorityBadge tier={priorityTier(voucher.category, voucher.isPayroll)} />
                              <span className="text-xs font-semibold truncate">{voucher.payee}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                              {clientSiteName(voucher.clientSiteId) ?? voucher.operationalArea}
                              {voucher.headcount ? ` · ${voucher.headcount} staff` : ""}
                              {voucher.payrollCycle ? ` · Cycle ${voucher.payrollCycle}` : ""}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              {voucher.id} · {voucher.linkedDocument.type} {voucher.linkedDocument.ref}
                            </p>
                          </div>
                          <div className="text-right shrink-0 space-y-1">
                            <DueBadge dueDate={voucher.dueDate} beforeCutoff={isProtectedVoucher(voucher)} />
                            <Money value={voucher.amount} className="text-xs font-semibold block" />
                            <button
                              className="text-[10px] text-primary hover:underline cursor-pointer"
                              onClick={(e) => { e.stopPropagation(); setSelectedVoucherId(voucher.id) }}
                            >
                              Open record
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Payment Runs</CardTitle>
              <CardDescription>Maker prepares → approver approves → finance transmits → reconciliation settles</CardDescription>
            </CardHeader>
            <CardContent>
              {paymentRuns.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground border border-dashed rounded-lg">No payment runs yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        <th className="py-2 pr-3">Run</th>
                        <th className="py-2 pr-3">Type</th>
                        <th className="py-2 pr-3">Source bank</th>
                        <th className="py-2 pr-3 text-right">Total</th>
                        <th className="py-2 pr-3 text-center">Status</th>
                        <th className="py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {paymentRuns.map((run) => (
                        <tr key={run.id} className="hover:bg-muted/10 align-top">
                          <td className="py-2.5 pr-3">
                            <button className="text-xs font-mono font-semibold hover:underline cursor-pointer" onClick={() => setSelectedRunId(run.id)}>
                              {run.runNo}
                            </button>
                            <p className="text-[10px] text-muted-foreground">Maker {run.maker}{run.approver ? ` · ${run.approver}` : ""}</p>
                          </td>
                          <td className="py-2.5 pr-3 text-xs">
                            {run.protected && <PriorityBadge tier={run.runType === "payroll" ? "Payroll" : "Statutory"} />}
                            <span className="ml-1 capitalize">{run.runType.replace("_", " ")} · {run.paymentMethod}</span>
                          </td>
                          <td className="py-2.5 pr-3 text-xs text-muted-foreground">{bankAccounts.find((b) => b.id === run.sourceBankId)?.name}</td>
                          <td className="py-2.5 pr-3 text-right"><Money value={run.total} className="text-xs font-bold" /></td>
                          <td className="py-2.5 pr-3 text-center">
                            <Badge variant="outline" className={`text-[10px] capitalize ${RUN_STATUS_STYLES[run.status]}`}>{run.status.replace("_", " ")}</Badge>
                          </td>
                          <td className="py-2.5">
                            <div className="flex items-center justify-end gap-1.5">
                              {run.status === "draft" && (
                                <Button size="sm" variant="outline" className="h-7 text-xs cursor-pointer" onClick={() => onSubmitRunForApproval(run.id)}>
                                  <Send className="size-3 mr-1" /> Submit
                                </Button>
                              )}
                              {run.status === "for_approval" && (
                                <Button size="sm" variant="outline" className="h-7 text-xs cursor-pointer text-blue-600 border-blue-500/30" onClick={() => onApproveRun(run.id)}>
                                  <Stamp className="size-3 mr-1" /> Approve
                                </Button>
                              )}
                              {run.status === "approved" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs cursor-pointer text-indigo-600 border-indigo-500/30"
                                  onClick={() => setConfirmTransmit(run)}
                                >
                                  <Send className="size-3 mr-1" /> Transmit
                                </Button>
                              )}
                              {(run.status === "draft" || run.status === "for_approval" || run.status === "approved") && (
                                <Button size="sm" variant="outline" className="h-7 text-xs cursor-pointer text-rose-600 border-rose-500/30" onClick={() => onCancelRun(run.id)}>
                                  <Ban className="size-3" />
                                </Button>
                              )}
                              {(run.status === "transmitted" || run.status === "settled" || run.status === "cancelled") && (
                                <span className="text-[10px] text-muted-foreground italic">
                                  {run.status === "transmitted" ? "Awaiting reconciliation" : "Archived"}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Run builder */}
        <div>
          <Card className="sticky top-6 border bg-card/70">
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="size-4 text-primary" /> Prepare Payment Run
              </CardTitle>
              <CardDescription>Creating a run locks vouchers; funds reserve on approval</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="rounded-lg border bg-muted/40 p-3 space-y-1 text-sm">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Selected vouchers</span>
                  <span>{selectedVouchers.length}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="font-medium">Run total</span>
                  <Money value={totalAmountSelected} className="text-lg font-bold text-primary" />
                </div>
                {runTypePreview && <div className="flex justify-between text-[11px] text-muted-foreground"><span>Run type</span><span className="capitalize">{runTypePreview.replace("_", " ")}</span></div>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Maker</label>
                <Input value={maker} onChange={(e) => setMaker(e.target.value)} className="h-9" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Debit bank account</label>
                <Select value={selectedBankId} onValueChange={setSelectedBankId}>
                  <SelectTrigger className="w-full cursor-pointer h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id} className="cursor-pointer">
                        {account.name} ({formatPHP(account.availableBalance)} avail)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Disbursement method</label>
                <div className="grid grid-cols-2 gap-2">
                  {METHOD_OPTIONS.map((method) => {
                    const Icon = method.icon
                    const isSelected = paymentMethod === method.id
                    const isAllowed = allowedMethods.includes(method.id)
                    return (
                      <button
                        key={method.id}
                        type="button"
                        disabled={!isAllowed}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`flex flex-col items-center gap-1 rounded-lg border p-2.5 transition-colors ${
                          isSelected ? "border-primary bg-primary/5 text-primary" : isAllowed ? "border-border text-muted-foreground hover:border-muted-foreground/30 cursor-pointer" : "border-border/50 text-muted-foreground/40 cursor-not-allowed"
                        }`}
                      >
                        <Icon className="size-4" />
                        <span className="text-[11px] font-medium">{method.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {selectedBank && (
                <div className="border-t pt-3 space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Available after reservations</span><Money value={selectedBank.availableBalance} className="font-medium" /></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Run total</span><Money value={-totalAmountSelected} className="text-rose-500 font-medium" /></div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold text-muted-foreground">Projected available</span>
                    <Money value={remainingBalance} className={`font-bold ${insufficient ? "text-rose-600" : "text-emerald-600"}`} />
                  </div>
                </div>
              )}

              {blockReason && <Warning tone="rose">{blockReason}</Warning>}
              {insufficient && !blockReason && <Warning tone="rose">Selected total exceeds this account's available balance.</Warning>}
              {capError && <Warning tone="amber">{capError}</Warning>}
              {selectionProtected && !insufficient && !blockReason && (
                <Warning tone="amber">
                  This run contains protected payroll/statutory obligations. Approval affects payroll coverage.
                </Warning>
              )}
            </CardContent>
            <CardFooter className="border-t pt-4 bg-muted/10">
              <Button
                onClick={handleCreateClick}
                disabled={selectedVouchers.length === 0 || Boolean(blockReason) || insufficient || Boolean(capError)}
                className="w-full cursor-pointer h-10"
              >
                Create Payment Run <ArrowRight className="size-4 ml-1" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <ShieldCheck className="size-3.5 text-emerald-500" /> Segregation of duties enforced: maker, approver, and transmitter are distinct steps.
      </div>

      {/* Voucher drawer */}
      <RecordDrawer
        open={voucherDrawer !== undefined}
        onOpenChange={(value) => { if (!value) setSelectedVoucherId(null) }}
        title={voucherDrawer?.payee ?? ""}
        subtitle={voucherDrawer ? `${voucherDrawer.id} · ${voucherDrawer.operationalArea}` : undefined}
      >
        {voucherDrawer && (
          <>
            <div className="flex items-center justify-between">
              <PriorityBadge tier={priorityTier(voucherDrawer.category, voucherDrawer.isPayroll)} />
              <Money value={voucherDrawer.amount} className="text-lg font-bold" />
            </div>
            <DetailSection title="Business context">
              <ContextList
                context={{
                  operationalArea: voucherDrawer.operationalArea,
                  clientSiteName: clientSiteName(voucherDrawer.clientSiteId),
                  contractRef: voucherDrawer.contractRef,
                  deploymentRegion: voucherDrawer.deploymentRegion,
                  payrollCycle: voucherDrawer.payrollCycle,
                  statutoryPeriod: voucherDrawer.statutoryPeriod,
                  headcount: voucherDrawer.headcount,
                  linkedDocument: voucherDrawer.linkedDocument,
                  fundingSourceName: bankAccounts.find((b) => b.id === voucherDrawer.bankAccountId)?.name,
                  dueDate: voucherDrawer.dueDate,
                }}
              />
            </DetailSection>
            <DetailSection title="Description">
              <p className="text-xs text-muted-foreground">{voucherDrawer.description}</p>
            </DetailSection>
            <DetailSection title="Audit history">
              <AuditTrail logs={auditLogs} entityId={voucherDrawer.id} />
            </DetailSection>
          </>
        )}
      </RecordDrawer>

      {/* Run drawer */}
      <RecordDrawer
        open={runDrawer !== undefined}
        onOpenChange={(value) => { if (!value) setSelectedRunId(null) }}
        title={runDrawer?.runNo ?? ""}
        subtitle={runDrawer ? `${runDrawer.runType} · ${runDrawer.paymentMethod} · ${runDrawer.status.replace("_", " ")}` : undefined}
      >
        {runDrawer && (
          <>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className={`capitalize ${RUN_STATUS_STYLES[runDrawer.status]}`}>{runDrawer.status.replace("_", " ")}</Badge>
              <Money value={runDrawer.total} className="text-lg font-bold" />
            </div>
            <DetailSection title="Control trail">
              <div className="space-y-1.5 text-xs">
                <TrailRow label="Maker" value={`${runDrawer.maker} · ${runDrawer.createdAt}`} />
                <TrailRow label="Approver" value={runDrawer.approver ?? "Pending"} />
                <TrailRow label="Transmitted" value={runDrawer.transmittedAt ?? "Not yet"} />
                <TrailRow label="Settled" value={runDrawer.settledAt ?? "Not yet"} />
                <TrailRow label="Source bank" value={bankAccounts.find((b) => b.id === runDrawer.sourceBankId)?.name ?? ""} />
              </div>
            </DetailSection>
            <DetailSection title={`Vouchers (${runDrawerVouchers.length})`}>
              <div className="space-y-1">
                {runDrawerVouchers.map((voucher) => (
                  <div key={voucher.id} className="flex items-center justify-between rounded-md border bg-card/40 px-2.5 py-1.5 text-xs">
                    <span className="truncate">{voucher.payee}</span>
                    <Money value={voucher.amount} />
                  </div>
                ))}
                {runDrawerVouchers.length === 0 && <p className="text-xs text-muted-foreground">Legacy run — voucher links retained in the register.</p>}
              </div>
            </DetailSection>
            <DetailSection title="Audit history">
              <AuditTrail logs={auditLogs} entityId={runDrawer.id} />
            </DetailSection>
          </>
        )}
      </RecordDrawer>

      {/* High-risk create confirmation */}
      <Dialog open={confirmCreate} onOpenChange={setConfirmCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600"><AlertCircle className="size-4" /> Protected obligation run</DialogTitle>
            <DialogDescription>
              This run includes payroll/statutory payments. Approving it will reduce available payroll coverage to{" "}
              {Number.isFinite(projected.ratio) ? `${projected.ratio.toFixed(2)}x` : "no protected obligations"}.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground">
            Protected obligations would reach <Money value={projected.protectedDue} /> against <Money value={coverage.availableCash} /> available.
          </div>
          <DialogFooter>
            <Button variant="outline" className="cursor-pointer" onClick={() => setConfirmCreate(false)}>Cancel</Button>
            <Button className="cursor-pointer" onClick={() => { setConfirmCreate(false); submitCreate() }}>Create run</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transmission confirmation */}
      <Dialog open={confirmTransmit !== null} onOpenChange={(value) => { if (!value) setConfirmTransmit(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm bank transmission</DialogTitle>
            <DialogDescription>
              {confirmTransmit && (
                <>You are transmitting <span className="font-medium text-foreground">{confirmTransmit.runNo}</span> for{" "}
                <span className="font-medium text-foreground">{formatPHP(confirmTransmit.total)}</span> via {confirmTransmit.paymentMethod}.</>
              )}
            </DialogDescription>
          </DialogHeader>
          {confirmTransmit?.protected && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-xs text-rose-600">
              This is a protected payroll/statutory run. Transmitted funds leave available cash and can only be recovered before settlement.
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="cursor-pointer" onClick={() => setConfirmTransmit(null)}>Cancel</Button>
            <Button
              className="cursor-pointer"
              onClick={() => { if (confirmTransmit) onTransmitRun(confirmTransmit.id); setConfirmTransmit(null) }}
            >
              Transmit to bank
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Warning({ tone, children }: { tone: "rose" | "amber"; children: React.ReactNode }) {
  const classes = tone === "rose" ? "bg-rose-500/10 text-rose-600 border-rose-500/30" : "bg-amber-500/10 text-amber-600 border-amber-500/30"
  return (
    <div className={`flex items-start gap-2 rounded-lg border p-3 ${classes}`}>
      <AlertCircle className="size-4 shrink-0 mt-0.5" />
      <p className="text-[10px] leading-tight">{children}</p>
    </div>
  )
}

function TrailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 py-1 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

function AuditTrail({ logs, entityId }: { logs: AuditLog[]; entityId: string }) {
  const related = logs.filter((log) => log.entityId === entityId)
  if (related.length === 0) return <p className="text-xs text-muted-foreground">No audit events yet.</p>
  return (
    <div className="space-y-1.5">
      {[...related].reverse().map((log) => (
        <div key={log.id} className="rounded-md border bg-card/40 px-2.5 py-1.5 text-[11px]">
          <p className="font-medium">{log.action.replace(/_/g, " ")}</p>
          <p className="text-muted-foreground">{log.actor} · {log.before} → {log.after}</p>
        </div>
      ))}
    </div>
  )
}
