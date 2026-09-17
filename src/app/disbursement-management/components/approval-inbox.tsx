"use client"

import * as React from "react"
import { AlertTriangle, Check, CircleSlash, Clock, FileText, Paperclip, Plus, Undo2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  OPERATIONAL_AREAS,
  PAYMENT_CATEGORIES,
  PAYMENT_METHODS,
  clientSites,
  nextSequentialId,
  todayIso,
  type ApproverRole,
  type AuditLog,
  type BankAccount,
  type DisbursementRequest,
  type LinkedDocumentType,
  type NewDisbursementRequest,
  type OperationalArea,
  type PaymentCategory,
  type PaymentMethod,
  type Voucher,
} from "../data/mock-data"
import {
  dueInfo,
  isProtectedVoucher,
  nextRequiredRole,
  payrollProtection,
  priorityTier,
  priorityWeight,
} from "../data/disbursement-rules"
import { ContextList, DueBadge, Money, PriorityBadge, RecordDrawer, DetailSection, formatPHP } from "./disbursement-ui"

interface ApprovalInboxProps {
  bankAccounts: BankAccount[]
  requests: DisbursementRequest[]
  vouchers: Voucher[]
  auditLogs: AuditLog[]
  onApproveRequest: (id: string, role: ApproverRole) => void
  onRejectRequest: (id: string, reason: string) => void
  onHoldRequest: (id: string, reason: string) => void
  onCreateRequest: (req: NewDisbursementRequest) => void
}

type InboxFilter = "all" | "needs_approval" | "payroll" | "unfunded" | "client_site" | "exceptions"

const FILTERS: { id: InboxFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "needs_approval", label: "Needs my approval" },
  { id: "payroll", label: "Payroll this cycle" },
  { id: "unfunded", label: "Unfunded" },
  { id: "client_site", label: "Client-site critical" },
  { id: "exceptions", label: "Exceptions" },
]

const AREA_TO_SUBSYSTEM: Record<OperationalArea, DisbursementRequest["subsystem"]> = {
  "Client Site Operations": "CRM",
  "Regional Deployment": "Fleet & Transport",
  "Head Office Operations": "Facilities",
  "Corporate Services": "Governance & Admin",
}

const LINKED_DOC_TYPES: LinkedDocumentType[] = [
  "PO",
  "Invoice",
  "Payroll Register",
  "Compliance Filing",
  "Contract",
  "Reimbursement",
  "Other",
]

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })

export function ApprovalInbox({
  bankAccounts,
  requests,
  vouchers,
  auditLogs,
  onApproveRequest,
  onRejectRequest,
  onHoldRequest,
  onCreateRequest,
}: ApprovalInboxProps) {
  const [filter, setFilter] = React.useState<InboxFilter>("all")
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [confirmApprove, setConfirmApprove] = React.useState<{ request: DisbursementRequest; role: ApproverRole } | null>(null)
  const [reasonAction, setReasonAction] = React.useState<{ request: DisbursementRequest; kind: "hold" | "reject" } | null>(null)
  const [reason, setReason] = React.useState("")
  const [open, setOpen] = React.useState(false)

  const coverage = React.useMemo(() => payrollProtection(bankAccounts, vouchers), [bankAccounts, vouchers])

  const selectedRequest = requests.find((r) => r.id === selectedId) ?? null

  const matchesFilter = React.useCallback(
    (request: DisbursementRequest, id: InboxFilter): boolean => {
      const tier = priorityTier(request.requestType, isProtectedVoucher(request) && /payroll/i.test(request.title))
      switch (id) {
        case "all":
          return true
        case "needs_approval":
          return request.status === "pending" && nextRequiredRole(request.requiredRoles, request.approvals) !== null
        case "payroll":
          return tier === "Payroll" || tier === "Statutory"
        case "unfunded":
          return isProtectedVoucher(request) && coverage.availableCash < request.amount
        case "client_site":
          return tier === "Client-site critical" || Boolean(request.clientSiteId)
        case "exceptions":
          return request.status === "on_hold" || (request.status === "pending" && dueInfo(request.date).days < -2)
        default:
          return true
      }
    },
    [coverage.availableCash],
  )

  const filtered = React.useMemo(
    () => requests.filter((request) => matchesFilter(request, filter)),
    [requests, filter, matchesFilter],
  )

  // Group by the next required approver role, then by urgency.
  const groups = React.useMemo(() => {
    const map = new Map<string, DisbursementRequest[]>()
    filtered.forEach((request) => {
      const role =
        request.status === "pending"
          ? nextRequiredRole(request.requiredRoles, request.approvals) ?? "Awaiting filing"
          : request.status === "on_hold"
            ? "On hold"
            : request.status
      const list = map.get(role) ?? []
      list.push(request)
      map.set(role, list)
    })
    map.forEach((list) =>
      list.sort((a, b) => {
        const tierDiff =
          priorityWeight(priorityTier(a.requestType, isProtectedVoucher(a) && /payroll/i.test(a.title))) -
          priorityWeight(priorityTier(b.requestType, isProtectedVoucher(b) && /payroll/i.test(b.title)))
        if (tierDiff !== 0) return tierDiff
        return dueInfo(a.dueDate).days - dueInfo(b.dueDate).days
      }),
    )
    return Array.from(map.entries())
  }, [filtered])

  const projectedCoverage = (request: DisbursementRequest) => {
    if (!isProtectedVoucher(request)) return coverage
    const protectedDue = coverage.protectedDue + request.amount
    return {
      ...coverage,
      protectedDue,
      coverageRatio: protectedDue === 0 ? Number.POSITIVE_INFINITY : coverage.availableCash / protectedDue,
    }
  }

  const requestTier = (request: DisbursementRequest) =>
    priorityTier(request.requestType, isProtectedVoucher(request) && /payroll/i.test(request.title))

  const handleApproveClick = (request: DisbursementRequest, role: ApproverRole) => {
    const tier = requestTier(request)
    if (tier === "Payroll" || tier === "Statutory" || request.amount > 250_000) {
      setConfirmApprove({ request, role })
      return
    }
    onApproveRequest(request.id, role)
  }

  const handleConfirmApprove = () => {
    if (!confirmApprove) return
    onApproveRequest(confirmApprove.request.id, confirmApprove.role)
    setConfirmApprove(null)
  }

  const handleReasonSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reasonAction) return
    if (!reason.trim()) {
      toast.error("A reason is required.")
      return
    }
    if (reasonAction.kind === "hold") {
      onHoldRequest(reasonAction.request.id, reason.trim())
    } else {
      onRejectRequest(reasonAction.request.id, reason.trim())
    }
    setReasonAction(null)
    setReason("")
  }

  return (
    <div className="space-y-5 px-4 lg:px-6">
      <Card className="bg-card/50">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3">
          <div>
            <CardTitle className="text-base">Approval Inbox</CardTitle>
            <CardDescription>Grouped by required approver. Payroll and statutory requests surface first.</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="cursor-pointer">
                <Plus className="size-4 mr-1.5" /> File Request
              </Button>
            </DialogTrigger>
            <CreateRequestDialog bankAccounts={bankAccounts} onSubmit={onCreateRequest} onClose={() => setOpen(false)} />
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                onClick={() => setFilter(item.id)}
                className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                  filter === item.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center border border-dashed rounded-lg">
              <Check className="size-8 text-emerald-500 mb-2" />
              <p className="text-sm font-medium">Inbox clear</p>
              <p className="text-xs text-muted-foreground">No requests match this filter.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {groups.map(([role, list]) => (
                <div key={role} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{role}</span>
                    <Badge variant="secondary" className="text-[10px] py-0 px-1.5">{list.length}</Badge>
                  </div>
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full border-collapse text-left text-sm">
                      <tbody className="divide-y">
                        {list.map((request) => {
                          const nextRole = nextRequiredRole(request.requiredRoles, request.approvals)
                          const isPending = request.status === "pending"
                          return (
                            <tr key={request.id} className="hover:bg-muted/10 align-top">
                              <td className="py-3 pl-3 pr-2 w-[110px]">
                                <PriorityBadge tier={requestTier(request)} />
                              </td>
                              <td className="py-3 pr-3">
                                <p className="text-xs font-medium">{request.title}</p>
                                <p className="text-[11px] text-muted-foreground">{request.payee}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {request.clientSiteId
                                    ? clientSites.find((s) => s.id === request.clientSiteId)?.siteName
                                    : request.operationalArea}
                                  {request.headcount ? ` · ${request.headcount} staff` : ""}
                                </p>
                              </td>
                              <td className="py-3 pr-3 w-[170px]">
                                <DueBadge dueDate={request.dueDate} beforeCutoff={isProtectedVoucher(request)} />
                                <p className="text-[10px] text-muted-foreground mt-1">Filed {formatDate(request.date)}</p>
                              </td>
                              <td className="py-3 pr-3 text-right w-[120px]">
                                <Money value={request.amount} className="text-xs font-semibold" />
                              </td>
                              <td className="py-3 pr-3 w-[200px]">
                                <div className="flex flex-wrap gap-1">
                                  {request.requiredRoles.map((requiredRole) => {
                                    const signed = request.approvals.some((step) => step.role === requiredRole)
                                    return (
                                      <span
                                        key={requiredRole}
                                        className={`inline-flex items-center gap-0.5 rounded border px-1 text-[9px] ${
                                          signed ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-600" : "border-border text-muted-foreground"
                                        }`}
                                      >
                                        {signed ? <Check className="size-2.5" /> : null}
                                        {requiredRole}
                                      </span>
                                    )
                                  })}
                                </div>
                              </td>
                              <td className="py-3 pr-3 w-[210px]">
                                <div className="flex flex-col items-end gap-1">
                                  {isPending && nextRole ? (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs cursor-pointer text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                                        onClick={() => handleApproveClick(request, nextRole)}
                                      >
                                        <Check className="size-3 mr-1" /> Approve · {nextRole}
                                      </Button>
                                      <div className="flex gap-1">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-7 text-xs cursor-pointer text-amber-600"
                                          onClick={() => setReasonAction({ request, kind: "hold" })}
                                        >
                                          <Undo2 className="size-3 mr-1" /> Hold
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-7 text-xs cursor-pointer text-rose-600"
                                          onClick={() => setReasonAction({ request, kind: "reject" })}
                                        >
                                          <CircleSlash className="size-3 mr-1" /> Reject
                                        </Button>
                                      </div>
                                    </>
                                  ) : (
                                    <Badge variant="outline" className="text-[10px] capitalize">{request.status.replace("_", " ")}</Badge>
                                  )}
                                  <Button variant="ghost" size="sm" className="h-6 px-1 text-[10px] cursor-pointer" onClick={() => setSelectedId(request.id)}>
                                    <FileText className="size-3 mr-1" /> Open record
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail drawer */}
      <RecordDrawer
        open={selectedRequest !== null}
        onOpenChange={(value) => { if (!value) setSelectedId(null) }}
        title={selectedRequest?.title ?? ""}
        subtitle={selectedRequest ? `${selectedRequest.id} · ${selectedRequest.payee}` : undefined}
        footer={
          selectedRequest && selectedRequest.status === "pending" ? (
            <Button className="w-full cursor-pointer" onClick={() => setSelectedId(null)}>
              Close record
            </Button>
          ) : undefined
        }
      >
        {selectedRequest && (
          <>
            <div className="flex items-center justify-between">
              <PriorityBadge tier={requestTier(selectedRequest)} />
              <Money value={selectedRequest.amount} className="text-lg font-bold" />
            </div>
            <DetailSection title="Business context">
              <ContextList
                context={{
                  operationalArea: selectedRequest.operationalArea,
                  clientSiteName: clientSites.find((s) => s.id === selectedRequest.clientSiteId)?.siteName,
                  contractRef: selectedRequest.contractRef,
                  deploymentRegion: selectedRequest.deploymentRegion,
                  payrollCycle: selectedRequest.payrollCycle,
                  statutoryPeriod: selectedRequest.statutoryPeriod,
                  headcount: selectedRequest.headcount,
                  linkedDocument: selectedRequest.linkedDocument,
                  fundingSourceName: bankAccounts.find((b) => b.id === selectedRequest.bankAccountId)?.name,
                  dueDate: selectedRequest.dueDate,
                }}
              />
            </DetailSection>
            <DetailSection title="Justification">
              <p className="text-xs text-muted-foreground">{selectedRequest.description || "No justification provided."}</p>
            </DetailSection>
            <DetailSection title="Attachments">
              {selectedRequest.attachments.length === 0 ? (
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Paperclip className="size-3" /> No attachments</p>
              ) : (
                <div className="space-y-1">
                  {selectedRequest.attachments.map((attachment) => (
                    <p key={attachment.id} className="text-xs flex items-center gap-1">
                      <Paperclip className="size-3" /> {attachment.name}
                    </p>
                  ))}
                </div>
              )}
            </DetailSection>
            <DetailSection title="Approval path">
              <div className="space-y-1.5">
                {selectedRequest.requiredRoles.map((role) => {
                  const step = selectedRequest.approvals.find((s) => s.role === role)
                  return (
                    <div key={role} className="flex items-center justify-between rounded-md border bg-card/40 px-2.5 py-1.5 text-xs">
                      <span className="font-medium">{role}</span>
                      {step ? (
                        <span className="text-emerald-600">{step.by} · {formatDate(step.at)}</span>
                      ) : (
                        <span className="text-muted-foreground flex items-center gap-1"><Clock className="size-3" /> Pending</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </DetailSection>
            <DetailSection title="Audit history">
              <AuditTrail logs={auditLogs} entityId={selectedRequest.id} />
            </DetailSection>
          </>
        )}
      </RecordDrawer>

      {/* High-risk approval confirmation */}
      <Dialog open={confirmApprove !== null} onOpenChange={(value) => { if (!value) setConfirmApprove(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="size-4" /> High-consequence approval
            </DialogTitle>
            <DialogDescription>
              {confirmApprove && (
                <>
                  You are approving <span className="font-medium text-foreground">{confirmApprove.request.title}</span> for{" "}
                  <span className="font-medium text-foreground">{formatPHP(confirmApprove.request.amount)}</span> as{" "}
                  {confirmApprove.role}.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {confirmApprove && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs space-y-1">
              <p className="font-medium text-amber-700 dark:text-amber-500">
                This approval reduces available payroll coverage to{" "}
                {(() => {
                  const projected = projectedCoverage(confirmApprove.request)
                  const ratio = projected.coverageRatio
                  return Number.isFinite(ratio) ? `${ratio.toFixed(2)}x` : "no protected obligations"
                })()}
                .
              </p>
              <p className="text-muted-foreground">
                Protected obligations would reach {formatPHP(projectedCoverage(confirmApprove.request).protectedDue)} against{" "}
                {formatPHP(coverage.availableCash)} available.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="cursor-pointer" onClick={() => setConfirmApprove(null)}>Cancel</Button>
            <Button className="cursor-pointer" onClick={handleConfirmApprove}>Confirm approval</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hold / reject reason */}
      <Dialog open={reasonAction !== null} onOpenChange={(value) => { if (!value) setReasonAction(null) }}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleReasonSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{reasonAction?.kind === "hold" ? "Return for correction" : "Reject request"}</DialogTitle>
              <DialogDescription>
                {reasonAction?.kind === "hold"
                  ? "The request returns to the requester without creating a voucher."
                  : "A reason is mandatory and is written to the audit log."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label htmlFor="reason">{reasonAction?.kind === "hold" ? "Correction needed" : "Rejection reason"} *</Label>
              <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-[90px]" required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" className="cursor-pointer" onClick={() => setReasonAction(null)}>Cancel</Button>
              <Button type="submit" variant={reasonAction?.kind === "hold" ? "default" : "destructive"} className="cursor-pointer">
                {reasonAction?.kind === "hold" ? "Return to requester" : "Confirm rejection"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AuditTrail({ logs, entityId }: { logs: AuditLog[]; entityId: string }) {
  const related = logs.filter((log) => log.entityId === entityId)
  if (related.length === 0) {
    return <p className="text-xs text-muted-foreground">No audit events yet.</p>
  }
  return (
    <div className="space-y-1.5">
      {[...related].reverse().map((log) => (
        <div key={log.id} className="rounded-md border bg-card/40 px-2.5 py-1.5 text-[11px]">
          <p className="font-medium">{log.action.replace(/_/g, " ")}</p>
          <p className="text-muted-foreground">
            {log.actor} · {log.before} → {log.after} · {log.timestamp.slice(0, 10)}
          </p>
        </div>
      ))}
    </div>
  )
}

function CreateRequestDialog({
  bankAccounts,
  onSubmit,
  onClose,
}: {
  bankAccounts: BankAccount[]
  onSubmit: (req: NewDisbursementRequest) => void
  onClose: () => void
}) {
  const [title, setTitle] = React.useState("")
  const [requester, setRequester] = React.useState("")
  const [payee, setPayee] = React.useState("")
  const [amount, setAmount] = React.useState("")
  const [requestType, setRequestType] = React.useState<PaymentCategory>("Service Continuity")
  const [operationalArea, setOperationalArea] = React.useState<OperationalArea>("Client Site Operations")
  const [clientSiteId, setClientSiteId] = React.useState("none")
  const [contractRef, setContractRef] = React.useState("")
  const [deploymentRegion, setDeploymentRegion] = React.useState("")
  const [payrollCycle, setPayrollCycle] = React.useState("")
  const [statutoryPeriod, setStatutoryPeriod] = React.useState("")
  const [headcount, setHeadcount] = React.useState("")
  const [linkedDocType, setLinkedDocType] = React.useState<LinkedDocumentType>("Invoice")
  const [linkedDocRef, setLinkedDocRef] = React.useState("")
  const [costCenter, setCostCenter] = React.useState("")
  const [branch, setBranch] = React.useState("")
  const [dueDate, setDueDate] = React.useState("")
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("EFT")
  const [bankAccountId, setBankAccountId] = React.useState("bank-1")
  const [description, setDescription] = React.useState("")
  const [attachmentName, setAttachmentName] = React.useState("")

  const onSiteChange = (value: string) => {
    setClientSiteId(value)
    const site = clientSites.find((s) => s.id === value)
    if (site) {
      setContractRef(site.contractRef)
      setDeploymentRegion(site.deploymentRegion)
      setOperationalArea(site.operationalArea)
      setHeadcount(String(site.activeHeadcount))
      setBranch(site.deploymentRegion)
      if (!costCenter) setCostCenter(site.clientName)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = Number.parseFloat(amount)
    if (!title || !payee || !requester || !costCenter || !branch || !dueDate) {
      toast.error("Complete all required fields.")
      return
    }
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error("Enter a valid amount greater than zero.")
      return
    }
    if (description.trim().length < 5) {
      toast.error("Provide a business justification.")
      return
    }
    const site = clientSites.find((s) => s.id === clientSiteId)
    onSubmit({
      title,
      payee,
      amount: parsed,
      subsystem: AREA_TO_SUBSYSTEM[operationalArea],
      operationalArea,
      description,
      bankAccountId,
      requester,
      requestType,
      costCenter,
      branch,
      dueDate,
      attachments: attachmentName.trim()
        ? [{ id: nextSequentialId("ATT-", [], 3), name: attachmentName.trim(), kind: "other" }]
        : [],
      paymentMethod,
      clientSiteId: site?.id,
      contractRef: contractRef || undefined,
      deploymentRegion: deploymentRegion || undefined,
      payrollCycle: payrollCycle || undefined,
      statutoryPeriod: statutoryPeriod || undefined,
      headcount: headcount ? Number.parseInt(headcount, 10) : undefined,
      linkedDocument: { type: linkedDocType, ref: linkedDocRef || "—" },
    })
    onClose()
  }

  return (
    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <DialogHeader>
          <DialogTitle>File Disbursement Request</DialogTitle>
          <DialogDescription>
            Capture the client-site, contract, and workforce context so approvers can judge operational impact.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5 col-span-2">
            <Label htmlFor="title">Request subject *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="requester">Requester *</Label>
            <Input id="requester" value={requester} onChange={(e) => setRequester(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="payee">Payee *</Label>
            <Input id="payee" value={payee} onChange={(e) => setPayee(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount (PHP) *</Label>
            <Input id="amount" type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="requestType">Payment category *</Label>
            <Select value={requestType} onValueChange={(val) => setRequestType(val as PaymentCategory)}>
              <SelectTrigger id="requestType" className="cursor-pointer"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className="cursor-pointer">{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="operationalArea">Operational area *</Label>
            <Select value={operationalArea} onValueChange={(val) => setOperationalArea(val as OperationalArea)}>
              <SelectTrigger id="operationalArea" className="cursor-pointer"><SelectValue /></SelectTrigger>
              <SelectContent>
                {OPERATIONAL_AREAS.map((area) => (
                  <SelectItem key={area} value={area} className="cursor-pointer">{area}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="clientSite">Client site</Label>
            <Select value={clientSiteId} onValueChange={onSiteChange}>
              <SelectTrigger id="clientSite" className="cursor-pointer"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="cursor-pointer">None / Head Office</SelectItem>
                {clientSites.map((site) => (
                  <SelectItem key={site.id} value={site.id} className="cursor-pointer">{site.siteName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contractRef">Contract / job order</Label>
            <Input id="contractRef" value={contractRef} onChange={(e) => setContractRef(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="deploymentRegion">Deployment region</Label>
            <Input id="deploymentRegion" value={deploymentRegion} onChange={(e) => setDeploymentRegion(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="payrollCycle">Payroll cycle</Label>
            <Input id="payrollCycle" placeholder="e.g., 2026-07B" value={payrollCycle} onChange={(e) => setPayrollCycle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="statutoryPeriod">Statutory period</Label>
            <Input id="statutoryPeriod" placeholder="e.g., 2026-Q3" value={statutoryPeriod} onChange={(e) => setStatutoryPeriod(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="headcount">Workforce impacted</Label>
            <Input id="headcount" type="number" min="0" value={headcount} onChange={(e) => setHeadcount(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="linkedDocType">Linked document type</Label>
            <Select value={linkedDocType} onValueChange={(val) => setLinkedDocType(val as LinkedDocumentType)}>
              <SelectTrigger id="linkedDocType" className="cursor-pointer"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LINKED_DOC_TYPES.map((type) => (
                  <SelectItem key={type} value={type} className="cursor-pointer">{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="linkedDocRef">Linked document ref</Label>
            <Input id="linkedDocRef" value={linkedDocRef} onChange={(e) => setLinkedDocRef(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="costCenter">Cost center *</Label>
            <Input id="costCenter" value={costCenter} onChange={(e) => setCostCenter(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="branch">Branch *</Label>
            <Input id="branch" value={branch} onChange={(e) => setBranch(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dueDate">Due date *</Label>
            <Input id="dueDate" type="date" min={todayIso()} value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="paymentMethod">Payment preference</Label>
            <Select value={paymentMethod} onValueChange={(val) => setPaymentMethod(val as PaymentMethod)}>
              <SelectTrigger id="paymentMethod" className="cursor-pointer"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method} value={method} className="cursor-pointer">{method}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label htmlFor="bankAccountId">Funding source</Label>
            <Select value={bankAccountId} onValueChange={setBankAccountId}>
              <SelectTrigger id="bankAccountId" className="cursor-pointer"><SelectValue /></SelectTrigger>
              <SelectContent>
                {bankAccounts.map((b) => (
                  <SelectItem key={b.id} value={b.id} className="cursor-pointer">
                    {b.name} (Avail: {formatPHP(b.availableBalance)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label htmlFor="attachmentName">Attachment placeholder</Label>
            <div className="flex items-center gap-2">
              <Paperclip className="size-4 text-muted-foreground" />
              <Input id="attachmentName" value={attachmentName} onChange={(e) => setAttachmentName(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label htmlFor="description">Business justification *</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[80px]" required />
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" className="cursor-pointer" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="cursor-pointer">Submit request</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
