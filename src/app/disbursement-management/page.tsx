"use client"

import * as React from "react"
import { toast } from "sonner"
import { Activity, ClipboardList, CreditCard, FileText } from "lucide-react"

import { BaseLayout } from "@/components/layouts/base-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Toaster } from "@/components/ui/sonner"

import { ControlTower } from "./components/control-tower"
import { ApprovalInbox } from "./components/approval-inbox"
import { PaymentRuns } from "./components/payment-runs"
import { RegistersReconciliation } from "./components/registers-reconciliation"

import {
  initialBankAccounts,
  initialVouchers,
  initialRequests,
  initialChecks,
  initialEFTBatches,
  initialPaymentRuns,
  initialAuditLogs,
  initialReconciliationItems,
  initialBankStatementItems,
  nextSequentialId,
  todayIso,
  type BankAccount,
  type Voucher,
  type DisbursementRequest,
  type CheckRecord,
  type EFTBatch,
  type PaymentRun,
  type AuditLog,
  type ReconciliationItem,
  type BankStatementItem,
  type NewDisbursementRequest,
  type PaymentMethod,
  type ApproverRole,
} from "./data/mock-data"

import {
  requiredApprovalRoles,
  requiredApprovalLevel,
  nextRequiredRole,
  isFullyApproved,
  canCreateVoucher,
  validatePaymentMethod,
  validatePettyCashCap,
  deriveRunType,
  canReserve,
  withReservation,
  releaseReservation,
  settleReservedFunds,
  canVoidCheck,
  evaluateMatch,
  computeAutoMatches,
  detectExceptions,
  isProtectedVoucher,
} from "./data/disbursement-rules"

const formatPHP = (val: number) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(val)
}

const ROLE_ACTORS: Record<ApproverRole, string> = {
  "Dept Head": "Dept Head (Operations)",
  Finance: "Finance Officer",
  "Finance Manager": "A. Dela Cruz",
  "Authorized Signatory": "R. Villanueva (Signatory)",
  "Payroll Owner": "Payroll Owner (HRIS)",
}

type Workspace = "tower" | "inbox" | "runs" | "registers"

export default function DisbursementManagementPage() {
  const [workspace, setWorkspace] = React.useState<Workspace>("tower")
  const [bankAccounts, setBankAccounts] = React.useState<BankAccount[]>(initialBankAccounts)
  const [vouchers, setVouchers] = React.useState<Voucher[]>(initialVouchers)
  const [requests, setRequests] = React.useState<DisbursementRequest[]>(initialRequests)
  const [checks, setChecks] = React.useState<CheckRecord[]>(initialChecks)
  const [eftBatches, setEftBatches] = React.useState<EFTBatch[]>(initialEFTBatches)
  const [paymentRuns, setPaymentRuns] = React.useState<PaymentRun[]>(initialPaymentRuns)
  const [auditLogs, setAuditLogs] = React.useState<AuditLog[]>(initialAuditLogs)
  const [reconciliationItems, setReconciliationItems] = React.useState<ReconciliationItem[]>(initialReconciliationItems)
  const [bankStatementItems, setBankStatementItems] = React.useState<BankStatementItem[]>(initialBankStatementItems)

  const todayStr = React.useMemo(() => todayIso(), [])

  const appendAudit = React.useCallback((entry: Omit<AuditLog, "id" | "timestamp">) => {
    setAuditLogs((prev) => [
      ...prev,
      {
        ...entry,
        id: nextSequentialId("AUD-", prev.map((log) => log.id)),
        timestamp: new Date().toISOString(),
      },
    ])
  }, [])

  const inboxCount = requests.filter((r) => r.status === "pending" || r.status === "on_hold").length
  const runsCount = paymentRuns.filter((r) => r.status === "draft" || r.status === "for_approval" || r.status === "approved").length
  const exceptionCount = React.useMemo(
    () => detectExceptions({ requests, eftBatches, reconciliationItems }).length,
    [requests, eftBatches, reconciliationItems],
  )

  // 1. File a request
  const handleCreateRequest = (input: NewDisbursementRequest) => {
    const requiredRoles = requiredApprovalRoles(input.amount, input.requestType)
    const approvalLevel = requiredApprovalLevel(input.amount, input.requestType)
    const id = nextSequentialId("REQ-", requests.map((r) => r.id))
    const request: DisbursementRequest = {
      ...input,
      id,
      date: todayStr,
      status: "pending",
      approvalLevel,
      requiredRoles,
      approvals: [],
      protected: isProtectedVoucher(input),
    }
    setRequests((prev) => [request, ...prev])
    appendAudit({
      actor: input.requester,
      action: "request_filed",
      entityType: "DisbursementRequest",
      entityId: id,
      before: "none",
      after: `pending (${approvalLevel} · ${formatPHP(input.amount)})`,
    })
    toast.success(`Disbursement request ${id} filed. Required approvals: ${requiredRoles.join(" → ")}.`)
  }

  // 2. Approve a request step (staged, role-driven)
  const handleApproveRequest = (requestId: string, role: ApproverRole) => {
    const request = requests.find((r) => r.id === requestId)
    if (!request || request.status !== "pending") return

    const expected = nextRequiredRole(request.requiredRoles, request.approvals)
    if (expected !== role) {
      toast.error(`Out-of-sequence approval. Waiting on ${expected ?? "final authorization"}.`)
      return
    }

    const approvals = [...request.approvals, { role, by: ROLE_ACTORS[role], at: todayStr }]
    const fullyApproved = isFullyApproved(request.requiredRoles, approvals)

    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              approvals,
              status: fullyApproved ? "approved" : "pending",
              approvedBy: fullyApproved ? ROLE_ACTORS[role] : r.approvedBy,
              approvedAt: fullyApproved ? todayStr : r.approvedAt,
              heldBy: undefined,
              holdReason: undefined,
            }
          : r,
      ),
    )
    appendAudit({
      actor: ROLE_ACTORS[role],
      action: "request_approved",
      entityType: "DisbursementRequest",
      entityId: requestId,
      before: request.status,
      after: fullyApproved ? "approved" : `pending (${role} signed)`,
    })

    if (!fullyApproved) {
      toast.success(`${role} approval recorded for ${requestId}.`)
      return
    }

    if (!canCreateVoucher(request.requiredRoles, approvals, request.voucherId)) {
      toast.error("This request is already linked to a voucher. No duplicate created.")
      return
    }

    const voucherId = nextSequentialId("VCH-2026-", vouchers.map((v) => v.id))
    const voucher: Voucher = {
      id: voucherId,
      payee: request.payee,
      amount: request.amount,
      date: todayStr,
      subsystem: request.subsystem,
      operationalArea: request.operationalArea,
      description: `Approved request: ${request.title} (${request.description})`,
      referenceNo: `REQ-REF-${request.id}`,
      status: "approved",
      urgency: "medium",
      category: request.requestType,
      paymentMethod: request.paymentMethod,
      bankAccountId: request.bankAccountId,
      approvedBy: ROLE_ACTORS[role],
      approvedAt: todayStr,
      glStatus: "posted",
      costCenter: request.costCenter,
      branch: request.branch,
      dueDate: request.dueDate,
      attachments: request.attachments,
      isPayroll: request.requestType === "Payroll & Statutory" && /payroll/i.test(`${request.title} ${request.payee}`),
      createdFromRequestId: request.id,
      clientSiteId: request.clientSiteId,
      contractRef: request.contractRef,
      deploymentRegion: request.deploymentRegion,
      payrollCycle: request.payrollCycle,
      statutoryPeriod: request.statutoryPeriod,
      headcount: request.headcount,
      linkedDocument: request.linkedDocument,
      protected: isProtectedVoucher(request),
    }
    setVouchers((prev) => [voucher, ...prev])
    setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, voucherId } : r)))
    appendAudit({ actor: "System", action: "voucher_created", entityType: "Voucher", entityId: voucherId, before: "none", after: `approved (from ${requestId})` })
    appendAudit({ actor: "System", action: "gl_posted", entityType: "Voucher", entityId: voucherId, before: "unposted", after: "posted" })
    toast.success(`${requestId} fully approved. Voucher ${voucherId} created and posted to GL.`)
  }

  // 3. Reject a request (reason required)
  const handleRejectRequest = (requestId: string, reason: string) => {
    const trimmed = reason.trim()
    if (!trimmed) {
      toast.error("A rejection reason is required.")
      return
    }
    setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, status: "rejected", rejectionReason: trimmed } : r)))
    appendAudit({
      actor: ROLE_ACTORS["Finance Manager"],
      action: "request_rejected",
      entityType: "DisbursementRequest",
      entityId: requestId,
      before: "pending",
      after: `rejected: ${trimmed}`,
    })
    toast.warning(`Disbursement request ${requestId} rejected.`)
  }

  // 4. Hold / return for correction
  const handleHoldRequest = (requestId: string, reason: string) => {
    const trimmed = reason.trim()
    if (!trimmed) {
      toast.error("A hold reason is required.")
      return
    }
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: "on_hold", heldBy: ROLE_ACTORS["Finance Manager"], holdReason: trimmed } : r)),
    )
    appendAudit({
      actor: ROLE_ACTORS["Finance Manager"],
      action: "request_returned",
      entityType: "DisbursementRequest",
      entityId: requestId,
      before: "pending",
      after: `on_hold: ${trimmed}`,
    })
    toast.warning(`Request ${requestId} returned for correction.`)
  }

  // 5. Create a payment run (maker step — does NOT pay)
  const handleCreatePaymentRun = (voucherIds: string[], bankAccountId: string, paymentMethod: PaymentMethod, maker: string) => {
    const selected = vouchers.filter((v) => voucherIds.includes(v.id))
    const account = bankAccounts.find((b) => b.id === bankAccountId)
    if (!account) {
      toast.error("Select a valid source bank account.")
      return
    }
    const methodError = validatePaymentMethod(paymentMethod, selected, account.accountType)
    if (methodError) {
      toast.error(methodError)
      return
    }
    const total = selected.reduce((sum, v) => sum + v.amount, 0)
    const capError = validatePettyCashCap(paymentMethod, total)
    if (capError) {
      toast.error(capError)
      return
    }
    const pendingCommitment = paymentRuns
      .filter((run) => run.sourceBankId === bankAccountId && (run.status === "draft" || run.status === "for_approval"))
      .reduce((sum, run) => sum + run.total, 0)
    if (account.availableBalance - pendingCommitment < total) {
      toast.error("Insufficient available balance after existing draft commitments.")
      return
    }

    const runId = nextSequentialId("PR-2026-", paymentRuns.map((run) => run.id))
    const runType = deriveRunType(selected, paymentMethod)
    const run: PaymentRun = {
      id: runId,
      runNo: runId,
      runType,
      paymentMethod,
      sourceBankId: bankAccountId,
      voucherIds,
      total,
      maker,
      createdAt: todayStr,
      status: "draft",
      reference: `${runType.toUpperCase()}-${runId}`,
      operationalArea: selected[0]?.operationalArea,
      protected: selected.some(isProtectedVoucher),
    }
    setPaymentRuns((prev) => [run, ...prev])
    setVouchers((prev) => prev.map((v) => (voucherIds.includes(v.id) ? { ...v, paymentRunId: runId } : v)))
    appendAudit({ actor: maker, action: "payment_run_created", entityType: "PaymentRun", entityId: runId, before: "none", after: `draft (${runType} · ${formatPHP(total)})` })
    toast.success(`Payment run ${runId} prepared as draft. Submit it for approval.`)
  }

  const handleSubmitRunForApproval = (runId: string) => {
    const run = paymentRuns.find((r) => r.id === runId)
    if (!run || run.status !== "draft") return
    setPaymentRuns((prev) => prev.map((r) => (r.id === runId ? { ...r, status: "for_approval", checker: ROLE_ACTORS.Finance } : r)))
    appendAudit({ actor: run.maker, action: "payment_run_submitted", entityType: "PaymentRun", entityId: runId, before: "draft", after: "for_approval" })
    toast.success(`Payment run ${runId} submitted for approval.`)
  }

  const handleApprovePaymentRun = (runId: string) => {
    const run = paymentRuns.find((r) => r.id === runId)
    if (!run || (run.status !== "draft" && run.status !== "for_approval")) return
    const account = bankAccounts.find((b) => b.id === run.sourceBankId)
    if (account && !canReserve(account, run.total)) {
      toast.error("Approval blocked: available balance no longer covers this run.")
      return
    }
    setPaymentRuns((prev) =>
      prev.map((r) => (r.id === runId ? { ...r, status: "approved", approver: ROLE_ACTORS["Authorized Signatory"], approvedAt: todayStr } : r)),
    )
    if (account) {
      setBankAccounts((prev) => prev.map((b) => (b.id === account.id ? withReservation(b, run.total) : b)))
    }
    appendAudit({
      actor: ROLE_ACTORS["Authorized Signatory"],
      action: "payment_run_approved",
      entityType: "PaymentRun",
      entityId: runId,
      before: run.status,
      after: `approved (reserved ${formatPHP(run.total)})`,
    })
    toast.success(`Payment run ${runId} approved. ${formatPHP(run.total)} reserved.`)
  }

  const handleTransmitPaymentRun = (runId: string) => {
    const run = paymentRuns.find((r) => r.id === runId)
    if (!run || run.status !== "approved") return
    const runVouchers = vouchers.filter((v) => run.voucherIds.includes(v.id))

    if (run.paymentMethod === "Check") {
      let nextNo = checks.reduce((max, c) => Math.max(max, Number(c.checkNo) || 0), 0)
      const newChecks: CheckRecord[] = []
      const newLedger: ReconciliationItem[] = []
      const newStatements: BankStatementItem[] = []
      runVouchers.forEach((voucher) => {
        nextNo += 1
        const checkNo = String(nextNo).padStart(8, "0")
        const bankName = bankAccounts.find((b) => b.id === run.sourceBankId)?.name ?? "Unknown Bank"
        const checkId = nextSequentialId("CHK-", [...checks.map((c) => c.id), ...newChecks.map((c) => c.id)])
        newChecks.push({
          id: checkId,
          checkNo,
          voucherId: voucher.id,
          paymentRunId: run.id,
          payee: voucher.payee,
          amount: voucher.amount,
          date: todayStr,
          bankAccountId: run.sourceBankId,
          bankName,
          status: "issued",
        })
        newLedger.push({
          id: nextSequentialId("REC-", [...reconciliationItems.map((i) => i.id), ...newLedger.map((i) => i.id)]),
          date: todayStr,
          reference: `CHK-${checkNo}`,
          type: "Check",
          description: `Check ${checkNo} - ${voucher.payee}`,
          amount: -voucher.amount,
          bankAccountId: run.sourceBankId,
          matched: false,
        })
        newStatements.push({
          id: nextSequentialId("BST-", [...bankStatementItems.map((i) => i.id), ...newStatements.map((i) => i.id)]),
          date: todayStr,
          description: `${bankName.split(" ")[0].toUpperCase()} OUTWARD CHECK ${checkNo}`,
          amount: -voucher.amount,
          bankAccountId: run.sourceBankId,
          reference: `CHK-${checkNo}`,
          matched: false,
        })
      })
      setChecks((prev) => [...newChecks, ...prev])
      setReconciliationItems((prev) => [...newLedger, ...prev])
      setBankStatementItems((prev) => [...newStatements, ...prev])
    } else if (run.paymentMethod === "EFT") {
      const batchId = nextSequentialId("EFT-", eftBatches.map((b) => b.id))
      const batchRef = `EFT-BATCH-${todayStr.replace(/-/g, "")}-${run.id.replace("PR-2026-", "")}`
      const account = bankAccounts.find((b) => b.id === run.sourceBankId)
      const batch: EFTBatch = {
        id: batchId,
        batchRef,
        paymentRunId: run.id,
        voucherCount: runVouchers.length,
        totalAmount: run.total,
        bankAccountId: run.sourceBankId,
        bankName: account?.name ?? "Unknown Bank",
        date: todayStr,
        status: "transmitted",
        transmittedAt: todayStr,
      }
      const ledger: ReconciliationItem = {
        id: nextSequentialId("REC-", reconciliationItems.map((i) => i.id)),
        date: todayStr,
        reference: batchRef,
        type: "EFT",
        description: `Direct Deposit Batch ${batchRef}`,
        amount: -run.total,
        bankAccountId: run.sourceBankId,
        matched: false,
      }
      const statement: BankStatementItem = {
        id: nextSequentialId("BST-", bankStatementItems.map((i) => i.id)),
        date: todayStr,
        description: `${(account?.name ?? "BANK").split(" ")[0].toUpperCase()} PESONet OUTWARD ${batchRef}`,
        amount: -run.total,
        bankAccountId: run.sourceBankId,
        reference: batchRef,
        matched: false,
      }
      setEftBatches((prev) => [batch, ...prev])
      setReconciliationItems((prev) => [ledger, ...prev])
      setBankStatementItems((prev) => [statement, ...prev])
    } else {
      const reference = `${run.paymentMethod.toUpperCase()}-${run.id}`
      const ledger: ReconciliationItem = {
        id: nextSequentialId("REC-", reconciliationItems.map((i) => i.id)),
        date: todayStr,
        reference,
        type: run.paymentMethod,
        description: `${run.paymentMethod} payout - ${run.runNo}`,
        amount: -run.total,
        bankAccountId: run.sourceBankId,
        matched: false,
      }
      const statement: BankStatementItem = {
        id: nextSequentialId("BST-", bankStatementItems.map((i) => i.id)),
        date: todayStr,
        description: `OUTWARD ${run.paymentMethod.toUpperCase()} ${reference}`,
        amount: -run.total,
        bankAccountId: run.sourceBankId,
        reference,
        matched: false,
      }
      setReconciliationItems((prev) => [ledger, ...prev])
      setBankStatementItems((prev) => [statement, ...prev])
    }

    setPaymentRuns((prev) => prev.map((r) => (r.id === run.id ? { ...r, status: "transmitted", transmittedAt: todayStr } : r)))
    setVouchers((prev) => prev.map((v) => (run.voucherIds.includes(v.id) ? { ...v, status: "processing" } : v)))
    appendAudit({
      actor: ROLE_ACTORS["Authorized Signatory"],
      action: "payment_run_transmitted",
      entityType: "PaymentRun",
      entityId: run.id,
      before: "approved",
      after: "transmitted",
    })
    toast.success(`Payment run ${run.runNo} transmitted via ${run.paymentMethod}. Vouchers marked processing.`)
  }

  const handleCancelPaymentRun = (runId: string) => {
    const run = paymentRuns.find((r) => r.id === runId)
    if (!run || run.status === "transmitted" || run.status === "settled" || run.status === "cancelled") {
      toast.error("Transmitted or settled runs cannot be cancelled.")
      return
    }
    if (run.status === "approved") {
      setBankAccounts((prev) => prev.map((b) => (b.id === run.sourceBankId ? releaseReservation(b, run.total) : b)))
    }
    setPaymentRuns((prev) => prev.map((r) => (r.id === runId ? { ...r, status: "cancelled" } : r)))
    setVouchers((prev) => prev.map((v) => (v.paymentRunId === runId ? { ...v, paymentRunId: undefined, status: "approved" } : v)))
    appendAudit({ actor: run.maker, action: "payment_run_cancelled", entityType: "PaymentRun", entityId: runId, before: run.status, after: "cancelled" })
    toast.warning(`Payment run ${runId} cancelled. Vouchers returned to the queue.`)
  }

  const handleVoidCheck = (checkId: string) => {
    const check = checks.find((c) => c.id === checkId)
    if (!check) return
    const verdict = canVoidCheck(check)
    if (!verdict.allowed) {
      toast.error(verdict.reason ?? "This check cannot be voided.")
      return
    }
    setBankAccounts((prev) => prev.map((b) => (b.id === check.bankAccountId ? releaseReservation(b, check.amount) : b)))
    setChecks((prev) => prev.map((c) => (c.id === checkId ? { ...c, status: "voided", voidedAt: todayStr } : c)))
    if (check.voucherId) {
      setVouchers((prev) => prev.map((v) => (v.id === check.voucherId ? { ...v, status: "approved", paymentRunId: undefined } : v)))
    }
    appendAudit({
      actor: "Finance Officer",
      action: "check_voided",
      entityType: "Check",
      entityId: check.id,
      before: check.status,
      after: `voided (reversal of ${formatPHP(check.amount)})`,
    })
    toast.warning(`Check ${check.checkNo} voided. Reversal recorded; ${formatPHP(check.amount)} returned to available funds.`)
  }

  const settleLedgerItem = (ledger: ReconciliationItem, statementId: string) => {
    const amount = Math.abs(ledger.amount)
    setBankAccounts((prev) => prev.map((b) => (b.id === ledger.bankAccountId ? settleReservedFunds(b, amount) : b)))
    setReconciliationItems((prev) => prev.map((i) => (i.id === ledger.id ? { ...i, matched: true, matchedId: statementId } : i)))
    setBankStatementItems((prev) => prev.map((i) => (i.id === statementId ? { ...i, matched: true } : i)))

    let runId: string | undefined
    if (ledger.type === "Check") {
      const checkNo = ledger.reference.replace("CHK-", "")
      const check = checks.find((c) => c.checkNo === checkNo)
      if (check) {
        runId = check.paymentRunId
        setChecks((prev) => prev.map((c) => (c.id === check.id ? { ...c, status: "cleared", clearedAt: todayStr } : c)))
      }
    } else if (ledger.type === "EFT") {
      const batch = eftBatches.find((b) => b.batchRef === ledger.reference)
      if (batch) {
        runId = batch.paymentRunId
        setEftBatches((prev) => prev.map((b) => (b.id === batch.id ? { ...b, status: "settled", settledAt: todayStr } : b)))
      }
    }

    if (runId) {
      setPaymentRuns((prev) => prev.map((r) => (r.id === runId ? { ...r, status: "settled", settledAt: todayStr } : r)))
      setVouchers((prev) => prev.map((v) => (v.paymentRunId === runId ? { ...v, status: "paid" } : v)))
    }

    appendAudit({
      actor: "Finance Officer",
      action: "cash_settlement",
      entityType: ledger.type === "EFT" ? "EFTBatch" : "Check",
      entityId: ledger.reference,
      before: "transmitted",
      after: `settled (${formatPHP(amount)})`,
    })
  }

  const handleMatch = (ledgerId: string, statementId: string) => {
    const ledger = reconciliationItems.find((i) => i.id === ledgerId)
    const statement = bankStatementItems.find((i) => i.id === statementId)
    if (!ledger || !statement) return
    const confidence = evaluateMatch(ledger, statement)
    if (confidence === "none") {
      toast.error("Cannot reconcile: bank account, reference, amount, and date tolerance do not all align.")
      return
    }
    settleLedgerItem(ledger, statementId)
    toast.success(confidence === "exact" ? "Exact match reconciled." : "Probable match reconciled after review.")
  }

  const handleAutoMatch = () => {
    const matches = computeAutoMatches(reconciliationItems, bankStatementItems)
    if (matches.length === 0) {
      toast.info("Auto-match found no exact matches (reference + amount + date + account).")
      return
    }
    matches.forEach(({ ledgerId, statementId }) => {
      const ledger = reconciliationItems.find((i) => i.id === ledgerId)
      if (ledger) settleLedgerItem(ledger, statementId)
    })
    toast.success(`Auto-match reconciled ${matches.length} exact transaction(s).`)
  }

  const goToWorkspace = (_id: string, target: Workspace) => setWorkspace(target)

  return (
    <BaseLayout
      title="Cash-to-Deployment Control"
      description="Ensure deployed staff are paid, statutory obligations stay current, and client-site operations keep running without endangering payroll coverage."
    >
      <Toaster />
      <div className="space-y-5">
        <Tabs value={workspace} onValueChange={(value) => setWorkspace(value as Workspace)} className="w-full">
          <div className="px-4 lg:px-6">
            <TabsList className="h-auto w-full justify-start gap-1 bg-muted/30 p-1 border flex-wrap">
              <TabsTrigger value="tower" className="cursor-pointer text-xs flex items-center gap-1.5 data-[state=active]:bg-background">
                <Activity className="size-3.5" /> Today's Control Tower
              </TabsTrigger>
              <TabsTrigger value="inbox" className="cursor-pointer text-xs flex items-center gap-1.5 data-[state=active]:bg-background">
                <ClipboardList className="size-3.5" /> Approval Inbox
                {inboxCount > 0 && <span className="ml-1 rounded-full bg-amber-500/15 px-1.5 text-[10px] font-semibold text-amber-600">{inboxCount}</span>}
              </TabsTrigger>
              <TabsTrigger value="runs" className="cursor-pointer text-xs flex items-center gap-1.5 data-[state=active]:bg-background">
                <CreditCard className="size-3.5" /> Payment Runs
                {runsCount > 0 && <span className="ml-1 rounded-full bg-blue-500/15 px-1.5 text-[10px] font-semibold text-blue-600">{runsCount}</span>}
              </TabsTrigger>
              <TabsTrigger value="registers" className="cursor-pointer text-xs flex items-center gap-1.5 data-[state=active]:bg-background">
                <FileText className="size-3.5" /> Registers & Reconciliation
                {exceptionCount > 0 && <span className="ml-1 rounded-full bg-rose-500/15 px-1.5 text-[10px] font-semibold text-rose-600">{exceptionCount}</span>}
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="mt-5">
            <TabsContent value="tower" className="outline-hidden">
              <ControlTower
                bankAccounts={bankAccounts}
                vouchers={vouchers}
                requests={requests}
                reconciliationItems={reconciliationItems}
                onOpenVoucher={(id) => goToWorkspace(id, "runs")}
                onOpenRequest={(id) => goToWorkspace(id, "inbox")}
                onNavigate={setWorkspace}
              />
            </TabsContent>

            <TabsContent value="inbox" className="outline-hidden">
              <ApprovalInbox
                bankAccounts={bankAccounts}
                requests={requests}
                vouchers={vouchers}
                auditLogs={auditLogs}
                onApproveRequest={handleApproveRequest}
                onRejectRequest={handleRejectRequest}
                onHoldRequest={handleHoldRequest}
                onCreateRequest={handleCreateRequest}
              />
            </TabsContent>

            <TabsContent value="runs" className="outline-hidden">
              <PaymentRuns
                bankAccounts={bankAccounts}
                vouchers={vouchers}
                paymentRuns={paymentRuns}
                auditLogs={auditLogs}
                onCreateRun={handleCreatePaymentRun}
                onSubmitRunForApproval={handleSubmitRunForApproval}
                onApproveRun={handleApprovePaymentRun}
                onTransmitRun={handleTransmitPaymentRun}
                onCancelRun={handleCancelPaymentRun}
              />
            </TabsContent>

            <TabsContent value="registers" className="outline-hidden">
              <RegistersReconciliation
                bankAccounts={bankAccounts}
                checks={checks}
                eftBatches={eftBatches}
                paymentRuns={paymentRuns}
                requests={requests}
                reconciliationItems={reconciliationItems}
                bankStatementItems={bankStatementItems}
                onVoidCheck={handleVoidCheck}
                onMatch={handleMatch}
                onAutoMatch={handleAutoMatch}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </BaseLayout>
  )
}
