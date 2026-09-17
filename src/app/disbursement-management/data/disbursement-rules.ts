import type {
  ApprovalLevel,
  ApprovalStep,
  ApproverRole,
  BankAccount,
  BankAccountType,
  BankStatementItem,
  CheckRecord,
  ClientSite,
  DisbursementRequest,
  EFTBatch,
  PaymentCategory,
  PaymentMethod,
  PaymentRun,
  PaymentRunStatus,
  PaymentRunType,
  PriorityTier,
  ReconciliationItem,
  Voucher,
  VoucherStatus,
} from "./mock-data"

export const APPROVAL_THRESHOLDS = {
  L1_MAX: 50_000,
  L2_MAX: 250_000,
} as const

export const PETTY_CASH_CAP = 50_000
export const RECON_DATE_TOLERANCE_DAYS = 3

const ALL_METHODS: PaymentMethod[] = ["EFT", "Check", "Wire", "Cash"]

export function isPayrollOrStatutory(category: PaymentCategory): boolean {
  return category === "Payroll & Statutory"
}

export function requiredApprovalRoles(amount: number, category: PaymentCategory): ApproverRole[] {
  if (isPayrollOrStatutory(category)) {
    return ["Payroll Owner", "Finance Manager", "Authorized Signatory"]
  }
  if (amount <= APPROVAL_THRESHOLDS.L1_MAX) {
    return ["Dept Head", "Finance"]
  }
  if (amount <= APPROVAL_THRESHOLDS.L2_MAX) {
    return ["Dept Head", "Finance Manager"]
  }
  return ["Dept Head", "Finance Manager", "Authorized Signatory"]
}

export function requiredApprovalLevel(amount: number, category: PaymentCategory): ApprovalLevel {
  if (isPayrollOrStatutory(category)) {
    return "payroll"
  }
  if (amount <= APPROVAL_THRESHOLDS.L1_MAX) {
    return "l1"
  }
  if (amount <= APPROVAL_THRESHOLDS.L2_MAX) {
    return "l2"
  }
  return "l3"
}

export function nextRequiredRole(
  requiredRoles: ApproverRole[],
  approvals: ApprovalStep[],
): ApproverRole | null {
  return requiredRoles.find((role) => !approvals.some((step) => step.role === role)) ?? null
}

export function isFullyApproved(requiredRoles: ApproverRole[], approvals: ApprovalStep[]): boolean {
  return requiredRoles.every((role) => approvals.some((step) => step.role === role))
}

/**
 * A request may spawn exactly one voucher: only when fully approved and not
 * already linked to a voucher. Prevents duplicate approvals/vouchers.
 */
export function canCreateVoucher(
  requiredRoles: ApproverRole[],
  approvals: ApprovalStep[],
  voucherId?: string,
): boolean {
  return isFullyApproved(requiredRoles, approvals) && !voucherId
}

export function allowedPaymentMethods(
  category: PaymentCategory,
  isPayroll: boolean,
  accountType: BankAccountType,
): PaymentMethod[] {
  if (accountType === "petty_cash") {
    return ["Cash"]
  }
  if (isPayroll) {
    return ["EFT"]
  }
  if (isPayrollOrStatutory(category)) {
    return ["EFT", "Check"]
  }
  return ["EFT", "Check", "Wire"]
}

export function allowedMethodsForSelection(
  vouchers: Voucher[],
  accountType: BankAccountType,
): PaymentMethod[] {
  if (vouchers.length === 0) {
    return accountType === "petty_cash" ? ["Cash"] : ["EFT", "Check", "Wire"]
  }
  const perVoucher = vouchers.map((v) => allowedPaymentMethods(v.category, v.isPayroll, accountType))
  return ALL_METHODS.filter((method) => perVoucher.every((allowed) => allowed.includes(method)))
}

export function accountPaymentBlockReason(
  accountType: BankAccountType,
  vouchers: Voucher[],
): string | null {
  if (accountType !== "petty_cash") {
    return null
  }
  const paysNormalParty = vouchers.some(
    (v) =>
      v.isPayroll ||
      v.category === "Service Continuity" ||
      v.category === "Operating Expense" ||
      v.category === "Refund",
  )
  if (paysNormalParty) {
    return "The petty cash account cannot be used to pay vendors, payroll, or refunds."
  }
  return null
}

export function validatePaymentMethod(
  method: PaymentMethod,
  vouchers: Voucher[],
  accountType: BankAccountType,
): string | null {
  if (vouchers.length === 0) {
    return "Select at least one approved, unpaid voucher."
  }
  const blocked = accountPaymentBlockReason(accountType, vouchers)
  if (blocked) {
    return blocked
  }
  const allowed = allowedMethodsForSelection(vouchers, accountType)
  if (!allowed.includes(method)) {
    if (method === "Cash") {
      return "Cash payments must be drawn from the petty cash account."
    }
    return `${method} is not permitted for the selected vouchers from this account.`
  }
  return null
}

export function validatePettyCashCap(method: PaymentMethod, total: number): string | null {
  if (method === "Cash" && total > PETTY_CASH_CAP) {
    return `Petty cash runs are capped at PHP ${PETTY_CASH_CAP.toLocaleString()} per run.`
  }
  return null
}

export function deriveRunType(vouchers: Voucher[], method: PaymentMethod): PaymentRunType {
  if (method === "Cash") {
    return "petty_cash"
  }
  if (vouchers.some((v) => v.isPayroll)) {
    return "payroll"
  }
  if (vouchers.some((v) => isPayrollOrStatutory(v.category))) {
    return "statutory"
  }
  return "regular"
}

export function withReservation(account: BankAccount, amount: number): BankAccount {
  const reservedBalance = account.reservedBalance + amount
  return {
    ...account,
    reservedBalance,
    availableBalance: account.bookBalance - reservedBalance,
  }
}

export function releaseReservation(account: BankAccount, amount: number): BankAccount {
  const reservedBalance = Math.max(0, account.reservedBalance - amount)
  return {
    ...account,
    reservedBalance,
    availableBalance: account.bookBalance - reservedBalance,
  }
}

export function settleReservedFunds(account: BankAccount, amount: number): BankAccount {
  const bookBalance = account.bookBalance - amount
  const reservedBalance = Math.max(0, account.reservedBalance - amount)
  return {
    ...account,
    bookBalance,
    reservedBalance,
    availableBalance: bookBalance - reservedBalance,
  }
}

export function canReserve(account: BankAccount, amount: number): boolean {
  return account.availableBalance >= amount
}

/**
 * Single source of truth for disbursed cash: only settled payment runs count.
 * Paid vouchers / active checks / transmitted EFT batches are NOT summed again.
 */
export function settledDisbursedTotal(runs: PaymentRun[]): number {
  return runs.filter((run) => run.status === "settled").reduce((sum, run) => sum + run.total, 0)
}

export function reservedForApprovedRuns(runs: PaymentRun[]): number {
  return runs
    .filter((run) => run.status === "approved" || run.status === "transmitted")
    .reduce((sum, run) => sum + run.total, 0)
}

export function unreconciledOutflowTotal(items: ReconciliationItem[]): number {
  return items.filter((item) => !item.matched && item.amount < 0).reduce((sum, item) => sum + Math.abs(item.amount), 0)
}

export function voucherStatusAfterRun(status: PaymentRunStatus): VoucherStatus | null {
  if (status === "transmitted") {
    return "processing"
  }
  if (status === "settled") {
    return "paid"
  }
  return null
}

export function canVoidCheck(check: CheckRecord): { allowed: boolean; reason?: string } {
  if (check.status === "cleared") {
    return {
      allowed: false,
      reason: "A cleared check is a final bank record and cannot be voided. Post a reversal entry instead.",
    }
  }
  if (check.status === "voided") {
    return { allowed: false, reason: "This check has already been voided." }
  }
  return { allowed: true }
}

export type MatchConfidence = "exact" | "probable" | "none"

function normalizeReference(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "")
}

export function daysBetween(a: string, b: string): number {
  const first = Date.parse(a)
  const second = Date.parse(b)
  if (Number.isNaN(first) || Number.isNaN(second)) {
    return Number.POSITIVE_INFINITY
  }
  return Math.abs(first - second) / 86_400_000
}

export function referenceMatches(ledgerReference: string, statement: BankStatementItem): boolean {
  const reference = normalizeReference(ledgerReference)
  if (!reference) {
    return false
  }
  const statementReference = normalizeReference(statement.reference ?? "")
  if (
    statementReference &&
    (statementReference === reference ||
      statementReference.includes(reference) ||
      reference.includes(statementReference))
  ) {
    return true
  }
  const digits = reference.replace(/^[A-Z]+/, "")
  if (digits.length >= 5) {
    const haystack = normalizeReference(`${statement.reference ?? ""} ${statement.description}`)
    return haystack.includes(digits)
  }
  return false
}

/**
 * Match rules, in order: bank account, reference, amount, then date within tolerance.
 * A match is only `exact` (eligible for auto-match) when every rule passes.
 * Amount alone can never produce a match.
 */
export function evaluateMatch(
  ledger: ReconciliationItem,
  statement: BankStatementItem,
  toleranceDays = RECON_DATE_TOLERANCE_DAYS,
): MatchConfidence {
  if (ledger.bankAccountId !== statement.bankAccountId) {
    return "none"
  }
  if (Math.sign(ledger.amount) !== Math.sign(statement.amount)) {
    return "none"
  }
  if (Math.abs(ledger.amount) !== Math.abs(statement.amount)) {
    return "none"
  }
  if (daysBetween(ledger.date, statement.date) > toleranceDays) {
    return "none"
  }
  if (referenceMatches(ledger.reference, statement)) {
    return "exact"
  }
  return "probable"
}

export interface AutoMatchResult {
  ledgerId: string
  statementId: string
}

export function computeAutoMatches(
  ledgers: ReconciliationItem[],
  statements: BankStatementItem[],
  toleranceDays = RECON_DATE_TOLERANCE_DAYS,
): AutoMatchResult[] {
  const usedStatements = new Set<string>()
  const results: AutoMatchResult[] = []
  for (const ledger of ledgers) {
    if (ledger.matched) {
      continue
    }
    const statement = statements.find(
      (candidate) =>
        !candidate.matched &&
        !usedStatements.has(candidate.id) &&
        evaluateMatch(ledger, candidate, toleranceDays) === "exact",
    )
    if (statement) {
      usedStatements.add(statement.id)
      results.push({ ledgerId: ledger.id, statementId: statement.id })
    }
  }
  return results
}


// -- PrimePower Cash-to-Deployment primitives ---------------------------------

export function priorityTier(category: PaymentCategory, isPayroll: boolean): PriorityTier {
  if (isPayroll) {
    return "Payroll"
  }
  if (category === "Payroll & Statutory") {
    return "Statutory"
  }
  if (category === "Service Continuity") {
    return "Client-site critical"
  }
  if (category === "Operating Expense") {
    return "Contractual"
  }
  return "Discretionary"
}

export const PRIORITY_ORDER: PriorityTier[] = [
  "Payroll",
  "Statutory",
  "Client-site critical",
  "Contractual",
  "Discretionary",
]

export function priorityWeight(tier: PriorityTier): number {
  return PRIORITY_ORDER.indexOf(tier)
}

export function isProtectedVoucher(input: {
  category?: PaymentCategory
  requestType?: PaymentCategory
  isPayroll?: boolean
  protected?: boolean
}): boolean {
  return (
    Boolean(input.protected) ||
    Boolean(input.isPayroll) ||
    input.category === "Payroll & Statutory" ||
    input.requestType === "Payroll & Statutory"
  )
}

export const PAYROLL_CYCLE_DAYS = 15

export type DueTone = "overdue" | "today" | "soon" | "later"

export interface DueInfo {
  days: number
  label: string
  tone: DueTone
}

function startOfDay(date: Date): Date {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

export function dueInfo(dueDate: string, today: Date = new Date()): DueInfo {
  const days = Math.round(
    (startOfDay(new Date(dueDate)).getTime() - startOfDay(today).getTime()) / 86_400_000,
  )
  if (days < 0) {
    const overdue = Math.abs(days)
    return { days, label: `${overdue} day${overdue === 1 ? "" : "s"} overdue`, tone: "overdue" }
  }
  if (days === 0) {
    return { days, label: "Due today", tone: "today" }
  }
  if (days <= 3) {
    return { days, label: `Due in ${days} day${days === 1 ? "" : "s"}`, tone: "soon" }
  }
  return { days, label: `Due ${dueDate}`, tone: "later" }
}

export interface CoverageSummary {
  availableCash: number
  protectedDue: number
  coverageRatio: number
  coverageDays: number
  covered: boolean
  shortfall: number
}

/**
 * Protected payroll coverage: available cash versus outstanding payroll and
 * mandatory remittances. coverageDays converts the buffer into payroll-cycle days.
 */
export function payrollProtection(accounts: BankAccount[], vouchers: Voucher[]): CoverageSummary {
  const availableCash = accounts.reduce((sum, account) => sum + account.availableBalance, 0)
  const protectedDue = vouchers
    .filter((voucher) => isProtectedVoucher(voucher) && voucher.status !== "paid")
    .reduce((sum, voucher) => sum + voucher.amount, 0)

  const coverageRatio = protectedDue === 0 ? Number.POSITIVE_INFINITY : availableCash / protectedDue
  const dailyBurn = protectedDue === 0 ? 0 : protectedDue / PAYROLL_CYCLE_DAYS
  const coverageDays = dailyBurn === 0 ? Number.POSITIVE_INFINITY : Math.floor(availableCash / dailyBurn)

  return {
    availableCash,
    protectedDue,
    coverageRatio,
    coverageDays,
    covered: availableCash >= protectedDue,
    shortfall: Math.max(0, protectedDue - availableCash),
  }
}

export interface SiteRiskItem {
  site: ClientSite
  voucher: Voucher
  due: DueInfo
}

export function clientSiteRisks(
  vouchers: Voucher[],
  sites: ClientSite[],
  today: Date = new Date(),
  horizonDays = 7,
): SiteRiskItem[] {
  const risks: SiteRiskItem[] = []
  vouchers
    .filter((voucher) => voucher.clientSiteId && voucher.status !== "paid" && voucher.category === "Service Continuity")
    .forEach((voucher) => {
      const site = sites.find((candidate) => candidate.id === voucher.clientSiteId)
      if (!site) {
        return
      }
      const due = dueInfo(voucher.dueDate, today)
      if (due.days <= horizonDays) {
        risks.push({ site, voucher, due })
      }
    })
  return risks.sort((a, b) => a.due.days - b.due.days)
}

export type ExceptionKind = "overdue_approval" | "failed_eft" | "unreconciled" | "rejected_request"

export interface ExceptionItem {
  id: string
  kind: ExceptionKind
  label: string
  detail: string
  severity: "high" | "medium"
}

export function detectExceptions(input: {
  requests: DisbursementRequest[]
  eftBatches: EFTBatch[]
  reconciliationItems: ReconciliationItem[]
  today?: Date
  approvalSlaDays?: number
}): ExceptionItem[] {
  const today = input.today ?? new Date()
  const sla = input.approvalSlaDays ?? 2
  const exceptions: ExceptionItem[] = []

  input.requests
    .filter((request) => request.status === "pending")
    .forEach((request) => {
      const age = -dueInfo(request.date, today).days
      if (age > sla) {
        exceptions.push({
          id: `exc-approval-${request.id}`,
          kind: "overdue_approval",
          label: `${request.id} awaiting approval ${age} days`,
          detail: `${request.title} � ${request.requiredRoles.length} role(s) required`,
          severity: isProtectedVoucher(request) ? "high" : "medium",
        })
      }
    })

  input.requests
    .filter((request) => request.status === "rejected")
    .forEach((request) => {
      exceptions.push({
        id: `exc-rejected-${request.id}`,
        kind: "rejected_request",
        label: `${request.id} rejected`,
        detail: request.rejectionReason ?? "No reason recorded",
        severity: "medium",
      })
    })

  input.eftBatches
    .filter((batch) => batch.status === "rejected")
    .forEach((batch) => {
      exceptions.push({
        id: `exc-eft-${batch.id}`,
        kind: "failed_eft",
        label: `EFT ${batch.batchRef} rejected by bank`,
        detail: `${batch.voucherCount} transactions � PHP ${batch.totalAmount.toLocaleString()}`,
        severity: "high",
      })
    })

  const unreconciledCount = input.reconciliationItems.filter((item) => !item.matched && item.amount < 0).length
  if (unreconciledCount > 0) {
    exceptions.push({
      id: "exc-unreconciled",
      kind: "unreconciled",
      label: `${unreconciledCount} unreconciled bank outflow(s)`,
      detail: "Book items without an exact bank match",
      severity: "medium",
    })
  }

  return exceptions
}
