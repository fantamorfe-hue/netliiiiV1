import { describe, expect, it } from "vitest"

import {
  allowedMethodsForSelection,
  canCreateVoucher,
  canReserve,
  canVoidCheck,
  clientSiteRisks,
  computeAutoMatches,
  detectExceptions,
  deriveRunType,
  dueInfo,
  evaluateMatch,
  isFullyApproved,
  isProtectedVoucher,
  nextRequiredRole,
  payrollProtection,
  priorityTier,
  releaseReservation,
  requiredApprovalLevel,
  requiredApprovalRoles,
  settleReservedFunds,
  settledDisbursedTotal,
  validatePaymentMethod,
  validatePettyCashCap,
  voucherStatusAfterRun,
  withReservation,
} from "./disbursement-rules"
import type {
  ApprovalStep,
  ApproverRole,
  BankAccount,
  BankStatementItem,
  CheckRecord,
  ClientSite,
  DisbursementRequest,
  EFTBatch,
  PaymentRun,
  ReconciliationItem,
  Voucher,
} from "./mock-data"

const makeAccount = (over: Partial<BankAccount> = {}): BankAccount => ({
  id: "bank-1",
  name: "Metrobank",
  accountNo: "METRO-1",
  currency: "PHP",
  bookBalance: 100_000,
  reservedBalance: 0,
  availableBalance: 100_000,
  accountType: "checking",
  isActive: true,
  ...over,
})

const makeVoucher = (over: Partial<Voucher> = {}): Voucher => ({
  id: "VCH-1",
  payee: "Payee",
  amount: 1_000,
  date: "2026-07-01",
  subsystem: "Facilities",
  operationalArea: "Head Office Operations",
  description: "desc",
  referenceNo: "REF",
  status: "approved",
  urgency: "medium",
  category: "Operating Expense",
  paymentMethod: "EFT",
  glStatus: "posted",
  costCenter: "CC",
  branch: "HO",
  dueDate: "2026-07-05",
  attachments: [],
  isPayroll: false,
  linkedDocument: { type: "Invoice", ref: "REF" },
  protected: false,
  ...over,
})

const makeLedger = (over: Partial<ReconciliationItem> = {}): ReconciliationItem => ({
  id: "REC-1",
  date: "2026-07-01",
  reference: "CHK-0001",
  type: "Check",
  description: "Check 0001",
  amount: -1_000,
  bankAccountId: "bank-1",
  matched: false,
  ...over,
})

const makeStatement = (over: Partial<BankStatementItem> = {}): BankStatementItem => ({
  id: "BST-1",
  date: "2026-07-01",
  description: "OUTWARD CHECK 0001",
  amount: -1_000,
  bankAccountId: "bank-1",
  matched: false,
  ...over,
})

const makeCheck = (over: Partial<CheckRecord> = {}): CheckRecord => ({
  id: "CHK-1",
  checkNo: "0001",
  payee: "Payee",
  amount: 1_000,
  date: "2026-07-01",
  bankAccountId: "bank-1",
  bankName: "Metrobank",
  status: "issued",
  ...over,
})

const makeRun = (over: Partial<PaymentRun> = {}): PaymentRun => ({
  id: "PR-1",
  runNo: "PR-1",
  runType: "regular",
  paymentMethod: "EFT",
  sourceBankId: "bank-1",
  voucherIds: [],
  total: 1_000,
  maker: "Maker",
  createdAt: "2026-07-01",
  status: "draft",
  reference: "REF",
  protected: false,
  ...over,
})

describe("approval thresholds", () => {
  it("routes <= 50k to department head + finance", () => {
    expect(requiredApprovalLevel(50_000, "Operating Expense")).toBe("l1")
    expect(requiredApprovalRoles(50_000, "Operating Expense")).toEqual(["Dept Head", "Finance"])
  })

  it("routes 50k-250k to department head + finance manager", () => {
    expect(requiredApprovalLevel(50_001, "Operating Expense")).toBe("l2")
    expect(requiredApprovalLevel(250_000, "Operating Expense")).toBe("l2")
    expect(requiredApprovalRoles(120_000, "Service Continuity")).toEqual(["Dept Head", "Finance Manager"])
  })

  it("routes > 250k to department head + finance manager + signatory", () => {
    expect(requiredApprovalLevel(250_001, "Operating Expense")).toBe("l3")
    expect(requiredApprovalRoles(420_000, "Operating Expense")).toEqual([
      "Dept Head",
      "Finance Manager",
      "Authorized Signatory",
    ])
  })

  it("routes payroll & statutory to payroll owner + finance manager + signatory regardless of amount", () => {
    expect(requiredApprovalLevel(1_000, "Payroll & Statutory")).toBe("payroll")
    expect(requiredApprovalLevel(9_000_000, "Payroll & Statutory")).toBe("payroll")
    expect(requiredApprovalRoles(35_000, "Payroll & Statutory")).toEqual([
      "Payroll Owner",
      "Finance Manager",
      "Authorized Signatory",
    ])
  })
})

describe("staged approval & duplicate prevention", () => {
  const roles: ApproverRole[] = ["Dept Head", "Finance"]

  it("returns the next unsigned role in order", () => {
    expect(nextRequiredRole(roles, [])).toBe("Dept Head")
    expect(nextRequiredRole(roles, [{ role: "Dept Head", by: "X", at: "2026-07-01" }])).toBe("Finance")
    expect(nextRequiredRole(roles, [
      { role: "Dept Head", by: "X", at: "2026-07-01" },
      { role: "Finance", by: "Y", at: "2026-07-01" },
    ])).toBeNull()
  })

  it("creates a voucher only after full approval and only once", () => {
    const partial: ApprovalStep[] = [{ role: "Dept Head", by: "X", at: "2026-07-01" }]
    const full: ApprovalStep[] = [
      ...partial,
      { role: "Finance", by: "Y", at: "2026-07-01" },
    ]
    expect(canCreateVoucher(roles, partial, undefined)).toBe(false)
    expect(canCreateVoucher(roles, full, undefined)).toBe(true)
    expect(canCreateVoucher(roles, full, "VCH-1")).toBe(false)
    expect(isFullyApproved(roles, full)).toBe(true)
  })
})

describe("bank balance reservations", () => {
  it("blocks execution when available balance is insufficient", () => {
    const account = makeAccount({ bookBalance: 100_000, availableBalance: 100_000 })
    const reserved = withReservation(account, 60_000)
    expect(canReserve(reserved, 50_000)).toBe(false)
    expect(canReserve(reserved, 40_000)).toBe(true)
  })

  it("reserving holds cash without reducing book balance", () => {
    const account = makeAccount()
    const reserved = withReservation(account, 30_000)
    expect(reserved.bookBalance).toBe(100_000)
    expect(reserved.reservedBalance).toBe(30_000)
    expect(reserved.availableBalance).toBe(70_000)
  })

  it("releasing restores available funds", () => {
    const released = releaseReservation(withReservation(makeAccount(), 30_000), 30_000)
    expect(released.reservedBalance).toBe(0)
    expect(released.availableBalance).toBe(100_000)
  })

  it("settlement reduces book and reserved, leaving available unchanged", () => {
    const reserved = withReservation(makeAccount(), 30_000)
    const settled = settleReservedFunds(reserved, 30_000)
    expect(settled.bookBalance).toBe(70_000)
    expect(settled.reservedBalance).toBe(0)
    expect(settled.availableBalance).toBe(70_000)
  })
})

describe("payment method rules", () => {
  it("restricts payroll vouchers to EFT from a bank account", () => {
    const payroll = makeVoucher({ category: "Payroll & Statutory", isPayroll: true })
    expect(allowedMethodsForSelection([payroll], "checking")).toEqual(["EFT"])
    expect(validatePaymentMethod("Check", [payroll], "checking")).not.toBeNull()
  })

  it("allows EFT or check for statutory remittances", () => {
    const statutory = makeVoucher({ category: "Payroll & Statutory", isPayroll: false })
    expect(allowedMethodsForSelection([statutory], "checking")).toEqual(["EFT", "Check"])
  })

  it("allows EFT/check/wire for ordinary vendor payments", () => {
    expect(allowedMethodsForSelection([makeVoucher()], "checking")).toEqual(["EFT", "Check", "Wire"])
  })

  it("only permits cash from the petty cash account and caps it", () => {
    const reimbursement = makeVoucher({ category: "Employee / Other", amount: 12_000 })
    expect(allowedMethodsForSelection([reimbursement], "petty_cash")).toEqual(["Cash"])
    expect(validatePaymentMethod("Cash", [reimbursement], "checking")).toContain("petty cash")
    expect(validatePettyCashCap("Cash", 60_000)).not.toBeNull()
    expect(validatePettyCashCap("Cash", 40_000)).toBeNull()
  })

  it("blocks the petty cash account from paying vendors or payroll", () => {
    const vendor = makeVoucher({ category: "Operating Expense" })
    const payroll = makeVoucher({ category: "Payroll & Statutory", isPayroll: true })
    expect(validatePaymentMethod("Cash", [vendor], "petty_cash")).not.toBeNull()
    expect(validatePaymentMethod("Cash", [payroll], "petty_cash")).not.toBeNull()
  })

  it("derives a dedicated run type for payroll, statutory, petty cash, and regular", () => {
    expect(deriveRunType([makeVoucher({ category: "Payroll & Statutory", isPayroll: true })], "EFT")).toBe("payroll")
    expect(deriveRunType([makeVoucher({ category: "Payroll & Statutory", isPayroll: false })], "EFT")).toBe("statutory")
    expect(deriveRunType([makeVoucher({ category: "Employee / Other" })], "Cash")).toBe("petty_cash")
    expect(deriveRunType([makeVoucher()], "Check")).toBe("regular")
  })
})

describe("cleared check void protection", () => {
  it("allows voiding an uncleared check", () => {
    expect(canVoidCheck(makeCheck({ status: "issued" })).allowed).toBe(true)
  })

  it("blocks voiding a cleared check with a reason", () => {
    const verdict = canVoidCheck(makeCheck({ status: "cleared" }))
    expect(verdict.allowed).toBe(false)
    expect(verdict.reason).toBeTruthy()
  })

  it("blocks voiding an already voided check", () => {
    expect(canVoidCheck(makeCheck({ status: "voided" })).allowed).toBe(false)
  })
})

describe("single source of truth for disbursed cash", () => {
  it("counts settled runs only, avoiding double counting", () => {
    const runs = [
      makeRun({ id: "PR-1", status: "settled", total: 500 }),
      makeRun({ id: "PR-2", status: "transmitted", total: 400 }),
      makeRun({ id: "PR-3", status: "approved", total: 300 }),
      makeRun({ id: "PR-4", status: "settled", total: 200 }),
    ]
    expect(settledDisbursedTotal(runs)).toBe(700)
  })

  it("maps run status to voucher status", () => {
    expect(voucherStatusAfterRun("transmitted")).toBe("processing")
    expect(voucherStatusAfterRun("settled")).toBe("paid")
    expect(voucherStatusAfterRun("approved")).toBeNull()
  })
})

describe("reconciliation matching rules", () => {
  it("never matches on amount alone across different bank accounts", () => {
    const ledger = makeLedger({ bankAccountId: "bank-1" })
    const statement = makeStatement({ bankAccountId: "bank-2" })
    expect(evaluateMatch(ledger, statement)).toBe("none")
  })

  it("does not auto-match same amount without a reference", () => {
    const ledger = makeLedger({ reference: "EFT-BATCH-XYZ" })
    const statement = makeStatement({ description: "OUTWARD TRANSFER", reference: undefined })
    expect(evaluateMatch(ledger, statement)).toBe("probable")
  })

  it("requires reference, amount, account and date tolerance for an exact match", () => {
    const ledger = makeLedger({ reference: "CHK-0001", date: "2026-07-01" })
    const statement = makeStatement({ reference: "CHK-0001", date: "2026-07-02" })
    expect(evaluateMatch(ledger, statement)).toBe("exact")
  })

  it("rejects matches outside the date tolerance", () => {
    const ledger = makeLedger({ reference: "CHK-0001", date: "2026-07-01" })
    const statement = makeStatement({ reference: "CHK-0001", date: "2026-07-15" })
    expect(evaluateMatch(ledger, statement)).toBe("none")
  })

  it("ignores inflow statements", () => {
    const ledger = makeLedger({ amount: -1_000 })
    const inflow = makeStatement({ amount: 1_000, reference: "CHK-0001" })
    expect(evaluateMatch(ledger, inflow)).toBe("none")
  })

  it("auto-matches only exact pairs and never reuses a statement", () => {
    const ledgers = [
      makeLedger({ id: "REC-1", reference: "CHK-0001", amount: -1_000 }),
      makeLedger({ id: "REC-2", reference: "CHK-0002", amount: -2_000 }),
    ]
    const statements = [
      makeStatement({ id: "BST-1", reference: "CHK-0002", amount: -2_000, date: "2026-07-01" }),
      makeStatement({ id: "BST-2", reference: "CHK-0001", amount: -1_000, date: "2026-07-01" }),
    ]
    const matches = computeAutoMatches(ledgers, statements)
    expect(matches).toEqual([
      { ledgerId: "REC-1", statementId: "BST-2" },
      { ledgerId: "REC-2", statementId: "BST-1" },
    ])
  })

  it("does not auto-match two ledgers to one statement of the same amount", () => {
    const ledgers = [
      makeLedger({ id: "REC-1", reference: "CHK-0009", amount: -5_000 }),
      makeLedger({ id: "REC-2", reference: "CHK-0008", amount: -5_000 }),
    ]
    const statements = [makeStatement({ id: "BST-1", reference: "CHK-0009", amount: -5_000 })]
    const matches = computeAutoMatches(ledgers, statements)
    expect(matches).toEqual([{ ledgerId: "REC-1", statementId: "BST-1" }])
  })
})

describe("PrimePower priority tiers", () => {
  it("maps payroll, statutory, client-site, contractual and discretionary payments", () => {
    expect(priorityTier("Payroll & Statutory", true)).toBe("Payroll")
    expect(priorityTier("Payroll & Statutory", false)).toBe("Statutory")
    expect(priorityTier("Service Continuity", false)).toBe("Client-site critical")
    expect(priorityTier("Operating Expense", false)).toBe("Contractual")
    expect(priorityTier("Refund", false)).toBe("Discretionary")
    expect(priorityTier("Employee / Other", false)).toBe("Discretionary")
  })

  it("treats payroll, statutory and generated requests as protected", () => {
    expect(isProtectedVoucher({ category: "Payroll & Statutory", isPayroll: false })).toBe(true)
    expect(isProtectedVoucher({ category: "Service Continuity", isPayroll: false })).toBe(false)
    expect(isProtectedVoucher({ requestType: "Payroll & Statutory" })).toBe(true)
  })
})

describe("protected payroll coverage", () => {
  it("reports shortfall when protected obligations exceed available cash", () => {
    const accounts = [makeAccount({ availableBalance: 500_000, bookBalance: 500_000 })]
    const vouchers = [
      makeVoucher({ category: "Payroll & Statutory", isPayroll: true, amount: 700_000, protected: true }),
      makeVoucher({ category: "Operating Expense", amount: 50_000 }),
    ]
    const coverage = payrollProtection(accounts, vouchers)
    expect(coverage.protectedDue).toBe(700_000)
    expect(coverage.covered).toBe(false)
    expect(coverage.shortfall).toBe(200_000)
  })

  it("ignores paid and discretionary obligations", () => {
    const accounts = [makeAccount({ availableBalance: 400_000, bookBalance: 400_000 })]
    const vouchers = [
      makeVoucher({ category: "Payroll & Statutory", isPayroll: true, amount: 300_000, status: "paid", protected: true }),
      makeVoucher({ category: "Operating Expense", amount: 200_000 }),
    ]
    const coverage = payrollProtection(accounts, vouchers)
    expect(coverage.protectedDue).toBe(0)
    expect(coverage.covered).toBe(true)
  })
})

describe("due date language", () => {
  const today = new Date("2026-07-10T00:00:00.000Z")

  it("describes overdue, today, soon and later", () => {
    expect(dueInfo("2026-07-08", today).label).toContain("overdue")
    expect(dueInfo("2026-07-08", today).tone).toBe("overdue")
    expect(dueInfo("2026-07-10", today).label).toBe("Due today")
    expect(dueInfo("2026-07-12", today).tone).toBe("soon")
    expect(dueInfo("2026-07-20", today).tone).toBe("later")
  })
})

describe("client-site continuity risk", () => {
  const site: ClientSite = {
    id: "site-x",
    clientName: "Cebu Resort Operations",
    clientCode: "CRO-002",
    siteName: "Cebu Resort Operations — Mactan",
    deploymentRegion: "Region VII",
    contractRef: "JO-CRO-2026-009",
    activeHeadcount: 140,
    operationalArea: "Regional Deployment",
  }

  it("flags only unpaid client-site service-continuity payments within the horizon", () => {
    const today = new Date("2026-07-10T00:00:00.000Z")
    const risks = clientSiteRisks(
      [
        makeVoucher({ id: "V1", clientSiteId: "site-x", category: "Service Continuity", amount: 50_000, dueDate: "2026-07-12" }),
        makeVoucher({ id: "V2", clientSiteId: "site-x", category: "Service Continuity", amount: 50_000, dueDate: "2026-08-30" }),
        makeVoucher({ id: "V3", clientSiteId: "site-x", category: "Operating Expense", amount: 50_000, dueDate: "2026-07-12" }),
      ],
      [site],
      today,
      7,
    )
    expect(risks.map((r) => r.voucher.id)).toEqual(["V1"])
  })
})

describe("exception detection", () => {
  const request = (over: Partial<DisbursementRequest>): DisbursementRequest => ({
    id: "REQ-X",
    title: "Title",
    payee: "Payee",
    amount: 1_000,
    subsystem: "Facilities",
    operationalArea: "Head Office Operations",
    description: "d",
    bankAccountId: "bank-1",
    requester: "R",
    date: "2026-07-01",
    status: "pending",
    requestType: "Operating Expense",
    costCenter: "CC",
    branch: "HO",
    dueDate: "2026-07-15",
    attachments: [],
    paymentMethod: "EFT",
    approvalLevel: "l1",
    requiredRoles: ["Dept Head", "Finance"],
    approvals: [],
    linkedDocument: { type: "Invoice", ref: "X" },
    protected: false,
    ...over,
  })

  const rejected: EFTBatch = {
    id: "EFT-X",
    batchRef: "EFT-BATCH-X",
    voucherCount: 1,
    totalAmount: 5_000,
    bankAccountId: "bank-1",
    bankName: "Metrobank",
    date: "2026-07-01",
    status: "rejected",
  }

  it("surfaces overdue approvals, failed EFTs, and unreconciled outflows", () => {
    const exceptions = detectExceptions({
      requests: [request({ date: "2026-07-01" })],
      eftBatches: [rejected],
      reconciliationItems: [makeLedger({ matched: false })],
      today: new Date("2026-07-10T00:00:00.000Z"),
      approvalSlaDays: 2,
    })
    const kinds = exceptions.map((e) => e.kind)
    expect(kinds).toContain("overdue_approval")
    expect(kinds).toContain("failed_eft")
    expect(kinds).toContain("unreconciled")
  })
})
