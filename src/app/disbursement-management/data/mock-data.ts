export type Subsystem =
  | "Client Acquisition"
  | "HRIS Payroll"
  | "Benefits & Compliance"
  | "Governance & Admin"
  | "Supply Chain"
  | "Fleet & Transport"
  | "Facilities"
  | "CRM"
  | "Financials"

export type OperationalArea =
  | "Client Site Operations"
  | "Regional Deployment"
  | "Head Office Operations"
  | "Corporate Services"

export type PaymentCategory =
  | "Payroll & Statutory"
  | "Service Continuity"
  | "Operating Expense"
  | "Employee / Other"
  | "Refund"

export type PaymentPriority = "Critical" | "High" | "Normal" | "Controlled" | "Exception"

/** Business-facing priority tier shown on queues and badges. */
export type PriorityTier = "Payroll" | "Statutory" | "Client-site critical" | "Contractual" | "Discretionary"

export type PaymentMethod = "EFT" | "Check" | "Wire" | "Cash"

export type PaymentRunType = "regular" | "payroll" | "statutory" | "petty_cash"

export type PaymentRunStatus =
  | "draft"
  | "for_approval"
  | "approved"
  | "transmitted"
  | "settled"
  | "cancelled"

export type VoucherStatus = "approved" | "processing" | "paid" | "cancelled"

export type GlStatus = "unposted" | "posted"

export type CheckStatus = "draft" | "printed" | "issued" | "cleared" | "voided"

export type EftStatus = "draft" | "approved" | "transmitted" | "settled" | "rejected"

export type RequestStatus = "pending" | "on_hold" | "approved" | "rejected" | "paid"

export type ApprovalLevel = "l1" | "l2" | "l3" | "payroll"

export type ApproverRole =
  | "Dept Head"
  | "Finance"
  | "Finance Manager"
  | "Authorized Signatory"
  | "Payroll Owner"

export type BankAccountType = "checking" | "savings" | "petty_cash"

export type LinkedDocumentType =
  | "PO"
  | "Invoice"
  | "Payroll Register"
  | "Compliance Filing"
  | "Contract"
  | "Reimbursement"
  | "Other"

export interface LinkedDocument {
  type: LinkedDocumentType
  ref: string
}

export interface Attachment {
  id: string
  name: string
  kind: "invoice" | "receipt" | "quotation" | "other"
}

export interface ApprovalStep {
  role: ApproverRole
  by: string
  at: string
}

export interface ClientSite {
  id: string
  clientName: string
  clientCode: string
  siteName: string
  deploymentRegion: string
  contractRef: string
  activeHeadcount: number
  operationalArea: OperationalArea
}

export interface BankAccount {
  id: string
  name: string
  accountNo: string
  currency: string
  bookBalance: number
  reservedBalance: number
  availableBalance: number
  accountType: BankAccountType
  isActive: boolean
}

export interface Voucher {
  id: string
  payee: string
  amount: number
  date: string
  subsystem: Subsystem
  operationalArea: OperationalArea
  description: string
  referenceNo: string
  status: VoucherStatus
  urgency: "low" | "medium" | "high"
  category: PaymentCategory
  paymentMethod: PaymentMethod
  bankAccountId?: string
  approvedBy?: string
  approvedAt?: string
  paymentRunId?: string
  glStatus: GlStatus
  costCenter: string
  branch: string
  dueDate: string
  attachments: Attachment[]
  isPayroll: boolean
  createdFromRequestId?: string
  // PrimePower business context
  clientSiteId?: string
  contractRef?: string
  deploymentRegion?: string
  payrollCycle?: string
  statutoryPeriod?: string
  headcount?: number
  linkedDocument: LinkedDocument
  protected: boolean
}

export interface DisbursementRequest {
  id: string
  title: string
  payee: string
  amount: number
  subsystem: Subsystem
  operationalArea: OperationalArea
  description: string
  bankAccountId: string
  requester: string
  date: string
  status: RequestStatus
  requestType: PaymentCategory
  costCenter: string
  branch: string
  dueDate: string
  attachments: Attachment[]
  paymentMethod: PaymentMethod
  approvalLevel: ApprovalLevel
  requiredRoles: ApproverRole[]
  approvals: ApprovalStep[]
  approvedBy?: string
  approvedAt?: string
  rejectionReason?: string
  heldBy?: string
  holdReason?: string
  voucherId?: string
  // PrimePower business context
  clientSiteId?: string
  contractRef?: string
  deploymentRegion?: string
  payrollCycle?: string
  statutoryPeriod?: string
  headcount?: number
  linkedDocument: LinkedDocument
  protected: boolean
}

export type NewDisbursementRequest = Omit<
  DisbursementRequest,
  | "id"
  | "date"
  | "status"
  | "approvalLevel"
  | "requiredRoles"
  | "approvals"
  | "approvedBy"
  | "approvedAt"
  | "rejectionReason"
  | "heldBy"
  | "holdReason"
  | "voucherId"
  | "protected"
>

export interface PaymentRun {
  id: string
  runNo: string
  runType: PaymentRunType
  paymentMethod: PaymentMethod
  sourceBankId: string
  voucherIds: string[]
  total: number
  maker: string
  checker?: string
  approver?: string
  createdAt: string
  approvedAt?: string
  transmittedAt?: string
  settledAt?: string
  status: PaymentRunStatus
  reference: string
  operationalArea?: OperationalArea
  protected: boolean
}

export interface AuditLog {
  id: string
  actor: string
  action: string
  entityType: string
  entityId: string
  timestamp: string
  before: string
  after: string
}

export interface CheckRecord {
  id: string
  checkNo: string
  voucherId?: string
  paymentRunId?: string
  payee: string
  amount: number
  date: string
  bankAccountId: string
  bankName: string
  status: CheckStatus
  clearedAt?: string
  voidedAt?: string
}

export interface EFTBatch {
  id: string
  batchRef: string
  paymentRunId?: string
  voucherCount: number
  totalAmount: number
  bankAccountId: string
  bankName: string
  date: string
  status: EftStatus
  transmittedAt?: string
  settledAt?: string
}

export interface ReconciliationItem {
  id: string
  date: string
  reference: string
  type: PaymentMethod
  description: string
  amount: number
  bankAccountId: string
  matched: boolean
  matchedId?: string
}

export interface BankStatementItem {
  id: string
  date: string
  description: string
  amount: number
  bankAccountId: string
  reference?: string
  matched: boolean
}

export const CATEGORY_PRIORITY: Record<PaymentCategory, PaymentPriority> = {
  "Payroll & Statutory": "Critical",
  "Service Continuity": "High",
  "Operating Expense": "Normal",
  "Employee / Other": "Controlled",
  Refund: "Exception",
}

export const SUBSYSTEMS: Subsystem[] = [
  "Client Acquisition",
  "HRIS Payroll",
  "Benefits & Compliance",
  "Governance & Admin",
  "Supply Chain",
  "Fleet & Transport",
  "Facilities",
  "CRM",
  "Financials",
]

export const OPERATIONAL_AREAS: OperationalArea[] = [
  "Client Site Operations",
  "Regional Deployment",
  "Head Office Operations",
  "Corporate Services",
]

export const PAYMENT_CATEGORIES: PaymentCategory[] = [
  "Payroll & Statutory",
  "Service Continuity",
  "Operating Expense",
  "Employee / Other",
  "Refund",
]

export const PAYMENT_METHODS: PaymentMethod[] = ["EFT", "Check", "Wire", "Cash"]

/**
 * Deterministic identifier generator. Scans existing ids for the highest numeric
 * suffix and returns the next one, so repeated calls with the same inputs always
 * yield the same identifier (no `Math.random()`).
 */
export function nextSequentialId(prefix: string, existingIds: readonly string[], pad = 3): string {
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const pattern = new RegExp(`^${escaped}(\\d+)$`)
  let max = 0
  for (const id of existingIds) {
    const match = id.match(pattern)
    if (match) {
      max = Math.max(max, Number(match[1]))
    }
  }
  return `${prefix}${String(max + 1).padStart(pad, "0")}`
}

export function todayIso(): string {
  return new Date().toISOString().split("T")[0]
}

export function isoDateOffset(offsetDays: number): string {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString().split("T")[0]
}

// ── PrimePower client sites (aligned with the Collection model) ───────────────

export const clientSites: ClientSite[] = [
  {
    id: "site-1",
    clientName: "Makati Hotel Group",
    clientCode: "MHG-001",
    siteName: "Makati Hotel Group — Makati CBD",
    deploymentRegion: "NCR",
    contractRef: "JO-MHG-2026-014",
    activeHeadcount: 85,
    operationalArea: "Client Site Operations",
  },
  {
    id: "site-2",
    clientName: "Cebu Resort Operations",
    clientCode: "CRO-002",
    siteName: "Cebu Resort Operations — Mactan",
    deploymentRegion: "Region VII",
    contractRef: "JO-CRO-2026-009",
    activeHeadcount: 140,
    operationalArea: "Regional Deployment",
  },
  {
    id: "site-3",
    clientName: "Palawan Resort Services",
    clientCode: "PRS-003",
    siteName: "Palawan Resort Services — El Nido",
    deploymentRegion: "Region IV-B",
    contractRef: "JO-PRS-2026-003",
    activeHeadcount: 60,
    operationalArea: "Client Site Operations",
  },
  {
    id: "site-4",
    clientName: "Manila Country Club",
    clientCode: "MCC-004",
    siteName: "Manila Country Club — Pasay",
    deploymentRegion: "NCR",
    contractRef: "JO-MCC-2026-021",
    activeHeadcount: 75,
    operationalArea: "Client Site Operations",
  },
  {
    id: "site-5",
    clientName: "Bataan Manufacturing Park",
    clientCode: "BMP-005",
    siteName: "Bataan Manufacturing Park — Mariveles",
    deploymentRegion: "Region III",
    contractRef: "JO-BMP-2026-017",
    activeHeadcount: 210,
    operationalArea: "Regional Deployment",
  },
  {
    id: "site-6",
    clientName: "Iloilo Hospitality Group",
    clientCode: "IHG-006",
    siteName: "Iloilo Hospitality Group — Iloilo City",
    deploymentRegion: "Region VI",
    contractRef: "JO-IHG-2026-011",
    activeHeadcount: 95,
    operationalArea: "Regional Deployment",
  },
  {
    id: "site-7",
    clientName: "Davao Hotel Operations",
    clientCode: "DHO-007",
    siteName: "Davao Hotel Operations — Davao City",
    deploymentRegion: "Region XI",
    contractRef: "JO-DHO-2026-006",
    activeHeadcount: 70,
    operationalArea: "Client Site Operations",
  },
]

export function clientSiteName(id?: string): string | undefined {
  if (!id) return undefined
  return clientSites.find((site) => site.id === id)?.siteName
}

const initialBookBalances: Record<string, number> = {
  "bank-1": 4250000,
  "bank-2": 2450000,
  "bank-3": 50000,
}

const initialReservedBalances: Record<string, number> = {
  "bank-1": 465000, // issued checks CHK-00028482 + CHK-00028483
  "bank-2": 480000, // transmitted EFT batch 202606B
  "bank-3": 0,
}

function seedBankAccount(
  id: string,
  name: string,
  accountNo: string,
  accountType: BankAccountType,
): BankAccount {
  const bookBalance = initialBookBalances[id]
  const reservedBalance = initialReservedBalances[id]
  return {
    id,
    name,
    accountNo,
    currency: "PHP",
    bookBalance,
    reservedBalance,
    availableBalance: bookBalance - reservedBalance,
    accountType,
    isActive: true,
  }
}

export const initialBankAccounts: BankAccount[] = [
  seedBankAccount("bank-1", "Metrobank Checking (Primary)", "METRO-9831-2940", "checking"),
  seedBankAccount("bank-2", "BDO Corporate Operating", "BDO-0021-8843", "checking"),
  seedBankAccount("bank-3", "Petty Cash Fund", "PETTY-CASH-MAIN", "petty_cash"),
]

export const initialVouchers: Voucher[] = [
  {
    id: "VCH-2026-001",
    payee: "June 2026 Deployed Staff",
    amount: 750000,
    date: "2026-07-01",
    subsystem: "HRIS Payroll",
    operationalArea: "Client Site Operations",
    description: "Bi-monthly payroll disbursement for deployment contracts",
    referenceNo: "PAY-2026-06B",
    status: "approved",
    urgency: "high",
    category: "Payroll & Statutory",
    paymentMethod: "EFT",
    bankAccountId: "bank-1",
    approvedBy: "Finance Manager",
    approvedAt: "2026-07-01",
    glStatus: "posted",
    costCenter: "Payroll Operations",
    branch: "Head Office",
    dueDate: isoDateOffset(2),
    attachments: [{ id: "ATT-001", name: "payroll-register-june-2026.xlsx", kind: "other" }],
    isPayroll: true,
    deploymentRegion: "Nationwide",
    payrollCycle: "2026-07B",
    headcount: 120,
    linkedDocument: { type: "Payroll Register", ref: "PR-2026-07B" },
    protected: true,
  },
  {
    id: "VCH-2026-002",
    payee: "Regional Deployment Travel Provider",
    amount: 112500,
    date: "2026-07-02",
    subsystem: "Fleet & Transport",
    operationalArea: "Regional Deployment",
    description: "Regional deployment travel and shuttle expense replenishment",
    referenceNo: "DEPLOY-TRAVEL-492",
    status: "approved",
    urgency: "medium",
    category: "Service Continuity",
    paymentMethod: "EFT",
    bankAccountId: "bank-2",
    approvedBy: "Finance Manager",
    approvedAt: "2026-07-02",
    glStatus: "posted",
    costCenter: "Deployment Operations",
    branch: "Regional",
    dueDate: isoDateOffset(1),
    attachments: [],
    isPayroll: false,
    clientSiteId: "site-2",
    contractRef: "JO-CRO-2026-009",
    deploymentRegion: "Region VII",
    linkedDocument: { type: "Invoice", ref: "DEPLOY-TRAVEL-492" },
    protected: false,
  },
  {
    id: "VCH-2026-003",
    payee: "Ayala Land Inc.",
    amount: 280000,
    date: "2026-07-03",
    subsystem: "Facilities",
    operationalArea: "Head Office Operations",
    description: "Head Office Main lease payment (July 2026)",
    referenceNo: "FAC-LEASE-9921",
    status: "approved",
    urgency: "high",
    category: "Service Continuity",
    paymentMethod: "Check",
    bankAccountId: "bank-1",
    approvedBy: "Authorized Signatory",
    approvedAt: "2026-07-03",
    glStatus: "posted",
    costCenter: "Facilities",
    branch: "Head Office",
    dueDate: isoDateOffset(3),
    attachments: [{ id: "ATT-002", name: "lease-contract-july-2026.pdf", kind: "invoice" }],
    isPayroll: false,
    linkedDocument: { type: "Contract", ref: "FAC-LEASE-9921" },
    protected: false,
  },
  {
    id: "VCH-2026-004",
    payee: "Maxicare Health Plans",
    amount: 185000,
    date: "2026-07-04",
    subsystem: "Benefits & Compliance",
    operationalArea: "Corporate Services",
    description: "Q3 Employee medical insurance premium coverage",
    referenceNo: "BEN-MAXI-Q3",
    status: "approved",
    urgency: "medium",
    category: "Payroll & Statutory",
    paymentMethod: "EFT",
    bankAccountId: "bank-2",
    approvedBy: "Finance Manager",
    approvedAt: "2026-07-04",
    glStatus: "posted",
    costCenter: "People & Benefits",
    branch: "Head Office",
    dueDate: isoDateOffset(5),
    attachments: [],
    isPayroll: false,
    statutoryPeriod: "2026-Q3",
    linkedDocument: { type: "Compliance Filing", ref: "HMO-2026-Q3" },
    protected: true,
  },
  {
    id: "VCH-2026-005",
    payee: "TechVantage Corp Client",
    amount: 95000,
    date: "2026-07-05",
    subsystem: "CRM",
    operationalArea: "Client Site Operations",
    description: "Security deposit refund upon job order completion",
    referenceNo: "CRM-DEP-841",
    status: "approved",
    urgency: "low",
    category: "Refund",
    paymentMethod: "Check",
    bankAccountId: "bank-1",
    approvedBy: "Authorized Signatory",
    approvedAt: "2026-07-05",
    glStatus: "posted",
    costCenter: "Client Services",
    branch: "Head Office",
    dueDate: isoDateOffset(4),
    attachments: [],
    isPayroll: false,
    clientSiteId: "site-4",
    contractRef: "JO-MCC-2026-021",
    linkedDocument: { type: "Reimbursement", ref: "CRM-DEP-841" },
    protected: false,
  },
  {
    id: "VCH-2026-006",
    payee: "PLDT Enterprise",
    amount: 35000,
    date: "2026-07-05",
    subsystem: "Facilities",
    operationalArea: "Head Office Operations",
    description: "Dedicated high-speed internet lease for Smart Warehousing",
    referenceNo: "FAC-NET-3211",
    status: "approved",
    urgency: "medium",
    category: "Service Continuity",
    paymentMethod: "EFT",
    bankAccountId: "bank-2",
    approvedBy: "Finance",
    approvedAt: "2026-07-05",
    glStatus: "posted",
    costCenter: "Facilities",
    branch: "Smart Warehousing",
    dueDate: isoDateOffset(0),
    attachments: [],
    isPayroll: false,
    clientSiteId: "site-5",
    contractRef: "JO-BMP-2026-017",
    deploymentRegion: "Region III",
    linkedDocument: { type: "Invoice", ref: "FAC-NET-3211" },
    protected: false,
  },
  {
    id: "VCH-2026-007",
    payee: "Cisco Systems Philippines",
    amount: 420000,
    date: "2026-07-06",
    subsystem: "Supply Chain",
    operationalArea: "Head Office Operations",
    description: "Smart warehousing server and scanner infrastructure PO-991",
    referenceNo: "SC-INV-991A",
    status: "approved",
    urgency: "medium",
    category: "Operating Expense",
    paymentMethod: "Check",
    bankAccountId: "bank-1",
    approvedBy: "Authorized Signatory",
    approvedAt: "2026-07-06",
    glStatus: "posted",
    costCenter: "Supply Chain",
    branch: "Smart Warehousing",
    dueDate: isoDateOffset(6),
    attachments: [{ id: "ATT-003", name: "po-991-invoice.pdf", kind: "invoice" }],
    isPayroll: false,
    clientSiteId: "site-5",
    contractRef: "JO-BMP-2026-017",
    linkedDocument: { type: "PO", ref: "PO-991" },
    protected: false,
  },
  {
    id: "VCH-2026-008",
    payee: "Employee Calamity Loans Batch A",
    amount: 120000,
    date: "2026-07-07",
    subsystem: "Benefits & Compliance",
    operationalArea: "Corporate Services",
    description: "Employee assistance loan disbursement for typhoon affected staff",
    referenceNo: "BEN-LOAN-CALA",
    status: "approved",
    urgency: "high",
    category: "Employee / Other",
    paymentMethod: "EFT",
    bankAccountId: "bank-2",
    approvedBy: "Finance Manager",
    approvedAt: "2026-07-07",
    glStatus: "posted",
    costCenter: "People & Benefits",
    branch: "Regional",
    dueDate: isoDateOffset(2),
    attachments: [],
    isPayroll: false,
    deploymentRegion: "Region VII",
    headcount: 25,
    linkedDocument: { type: "Reimbursement", ref: "BEN-LOAN-CALA" },
    protected: false,
  },
  {
    id: "VCH-2026-009",
    payee: "Cruz & Associates Law Firm",
    amount: 85000,
    date: "2026-07-06",
    subsystem: "Governance & Admin",
    operationalArea: "Corporate Services",
    description: "Approved request: Legal Consultation Retainer (Professional legal retainer fees for contract management disputes)",
    referenceNo: "REQ-REF-REQ-102",
    status: "approved",
    urgency: "medium",
    category: "Operating Expense",
    paymentMethod: "EFT",
    bankAccountId: "bank-1",
    approvedBy: "Finance Manager",
    approvedAt: "2026-07-06",
    glStatus: "posted",
    costCenter: "Governance & Admin",
    branch: "Head Office",
    dueDate: isoDateOffset(3),
    attachments: [],
    isPayroll: false,
    createdFromRequestId: "REQ-102",
    linkedDocument: { type: "Contract", ref: "REQ-102-RETAINER" },
    protected: false,
  },
]

export const initialRequests: DisbursementRequest[] = [
  {
    id: "REQ-101",
    title: "Travel Reimbursement - Visayas Recruitment",
    payee: "Maria Santos (Recruitment Lead)",
    amount: 24500,
    subsystem: "Client Acquisition",
    operationalArea: "Regional Deployment",
    description: "Visayas recruiting roadshow expenses, hotel and terminal fees",
    bankAccountId: "bank-2",
    requester: "Maria Santos",
    date: "2026-07-05",
    status: "pending",
    requestType: "Employee / Other",
    costCenter: "Client Acquisition",
    branch: "Visayas",
    dueDate: isoDateOffset(4),
    attachments: [{ id: "ATT-101", name: "travel-receipts.pdf", kind: "receipt" }],
    paymentMethod: "EFT",
    approvalLevel: "l1",
    requiredRoles: ["Dept Head", "Finance"],
    approvals: [],
    clientSiteId: "site-6",
    contractRef: "JO-IHG-2026-011",
    deploymentRegion: "Region VI",
    linkedDocument: { type: "Reimbursement", ref: "TRV-REQ-101" },
    protected: false,
  },
  {
    id: "REQ-102",
    title: "Legal Consultation Retainer",
    payee: "Cruz & Associates Law Firm",
    amount: 85000,
    subsystem: "Governance & Admin",
    operationalArea: "Corporate Services",
    description: "Professional legal retainer fees for contract management disputes",
    bankAccountId: "bank-1",
    requester: "Atty. Juan Cruz",
    date: "2026-07-06",
    status: "approved",
    requestType: "Operating Expense",
    costCenter: "Governance & Admin",
    branch: "Head Office",
    dueDate: isoDateOffset(3),
    attachments: [{ id: "ATT-102", name: "retainer-agreement.pdf", kind: "quotation" }],
    paymentMethod: "EFT",
    approvalLevel: "l2",
    requiredRoles: ["Dept Head", "Finance Manager"],
    approvals: [
      { role: "Dept Head", by: "Atty. Juan Cruz", at: "2026-07-06" },
      { role: "Finance Manager", by: "A. Dela Cruz", at: "2026-07-06" },
    ],
    approvedBy: "A. Dela Cruz",
    approvedAt: "2026-07-06",
    voucherId: "VCH-2026-009",
    linkedDocument: { type: "Contract", ref: "REQ-102-RETAINER" },
    protected: false,
  },
  {
    id: "REQ-103",
    title: "Emergency Generator Fuel Replenishment",
    payee: "Petron Corporation",
    amount: 18000,
    subsystem: "Facilities",
    operationalArea: "Regional Deployment",
    description: "Diesel fuel replenishment for warehouse backup generators",
    bankAccountId: "bank-2",
    requester: "Roberto Gomez",
    date: "2026-07-07",
    status: "pending",
    requestType: "Service Continuity",
    costCenter: "Facilities",
    branch: "Smart Warehousing",
    dueDate: isoDateOffset(1),
    attachments: [],
    paymentMethod: "Check",
    approvalLevel: "l1",
    requiredRoles: ["Dept Head", "Finance"],
    approvals: [],
    clientSiteId: "site-5",
    contractRef: "JO-BMP-2026-017",
    deploymentRegion: "Region III",
    linkedDocument: { type: "Other", ref: "FUEL-REQ-103" },
    protected: false,
  },
  {
    id: "REQ-104",
    title: "Cloud Migration Server Hosting Payout",
    payee: "Amazon Web Services",
    amount: 55000,
    subsystem: "Governance & Admin",
    operationalArea: "Corporate Services",
    description: "Special system migration hosting fee payment (cancelled in governance)",
    bankAccountId: "bank-1",
    requester: "Mark Wilson",
    date: "2026-07-04",
    status: "rejected",
    requestType: "Operating Expense",
    costCenter: "Governance & Admin",
    branch: "Head Office",
    dueDate: isoDateOffset(-2),
    attachments: [],
    paymentMethod: "EFT",
    approvalLevel: "l2",
    requiredRoles: ["Dept Head", "Finance Manager"],
    approvals: [],
    rejectionReason: "Duplicate of an approved vendor contract; placed on governance hold.",
    linkedDocument: { type: "Invoice", ref: "AWS-REQ-104" },
    protected: false,
  },
  {
    id: "REQ-105",
    title: "Petty Cash Replenishment Request Q3",
    payee: "Finance Custodian",
    amount: 15000,
    subsystem: "Financials",
    operationalArea: "Head Office Operations",
    description: "Replenishing administrative office petty cash drawer",
    bankAccountId: "bank-3",
    requester: "Clara Reyes",
    date: "2026-07-08",
    status: "pending",
    requestType: "Employee / Other",
    costCenter: "Finance",
    branch: "Head Office",
    dueDate: isoDateOffset(2),
    attachments: [],
    paymentMethod: "Cash",
    approvalLevel: "l1",
    requiredRoles: ["Dept Head", "Finance"],
    approvals: [],
    linkedDocument: { type: "Reimbursement", ref: "PETTY-REQ-105" },
    protected: false,
  },
]

export const initialPaymentRuns: PaymentRun[] = [
  {
    id: "PR-2026-001",
    runNo: "PR-2026-001",
    runType: "regular",
    paymentMethod: "Check",
    sourceBankId: "bank-1",
    voucherIds: [],
    total: 67500,
    maker: "Clara Reyes",
    checker: "Finance Manager",
    approver: "A. Dela Cruz",
    createdAt: "2026-06-24",
    approvedAt: "2026-06-24",
    transmittedAt: "2026-06-25",
    settledAt: "2026-06-26",
    status: "settled",
    reference: "CHK-00028481",
    operationalArea: "Head Office Operations",
    protected: false,
  },
  {
    id: "PR-2026-002",
    runNo: "PR-2026-002",
    runType: "regular",
    paymentMethod: "EFT",
    sourceBankId: "bank-2",
    voucherIds: [],
    total: 640000,
    maker: "Clara Reyes",
    checker: "Finance Manager",
    approver: "A. Dela Cruz",
    createdAt: "2026-06-14",
    approvedAt: "2026-06-14",
    transmittedAt: "2026-06-15",
    settledAt: "2026-06-16",
    status: "settled",
    reference: "EFT-BATCH-202606A",
    operationalArea: "Client Site Operations",
    protected: false,
  },
  {
    id: "PR-2026-003",
    runNo: "PR-2026-003",
    runType: "regular",
    paymentMethod: "EFT",
    sourceBankId: "bank-2",
    voucherIds: [],
    total: 480000,
    maker: "Clara Reyes",
    checker: "Finance Manager",
    approver: "A. Dela Cruz",
    createdAt: "2026-06-29",
    approvedAt: "2026-06-29",
    transmittedAt: "2026-06-30",
    status: "transmitted",
    reference: "EFT-BATCH-202606B",
    operationalArea: "Regional Deployment",
    protected: false,
  },
  {
    id: "PR-2026-004",
    runNo: "PR-2026-004",
    runType: "regular",
    paymentMethod: "Check",
    sourceBankId: "bank-1",
    voucherIds: [],
    total: 465000,
    maker: "Clara Reyes",
    checker: "Finance Manager",
    approver: "A. Dela Cruz",
    createdAt: "2026-06-27",
    approvedAt: "2026-06-27",
    transmittedAt: "2026-06-28",
    status: "transmitted",
    reference: "CHK-00028482/00028483",
    operationalArea: "Head Office Operations",
    protected: false,
  },
]

export const initialChecks: CheckRecord[] = [
  {
    id: "CHK-001",
    checkNo: "00028481",
    paymentRunId: "PR-2026-001",
    payee: "Hospitality Supplies Philippines Inc.",
    amount: 67500,
    date: "2026-06-25",
    bankAccountId: "bank-1",
    bankName: "Metrobank Checking (Primary)",
    status: "cleared",
    clearedAt: "2026-06-26",
  },
  {
    id: "CHK-002",
    checkNo: "00028482",
    paymentRunId: "PR-2026-004",
    payee: "Davao Regional Deployment Services",
    amount: 145000,
    date: "2026-06-28",
    bankAccountId: "bank-1",
    bankName: "Metrobank Checking (Primary)",
    status: "issued",
  },
  {
    id: "CHK-003",
    checkNo: "00028483",
    paymentRunId: "PR-2026-004",
    payee: "Bureau of Internal Revenue",
    amount: 320000,
    date: "2026-06-30",
    bankAccountId: "bank-1",
    bankName: "Metrobank Checking (Primary)",
    status: "issued",
  },
]

export const initialEFTBatches: EFTBatch[] = [
  {
    id: "EFT-001",
    batchRef: "EFT-BATCH-202606A",
    paymentRunId: "PR-2026-002",
    voucherCount: 15,
    totalAmount: 640000,
    bankAccountId: "bank-2",
    bankName: "BDO Corporate Operating",
    date: "2026-06-15",
    status: "settled",
    transmittedAt: "2026-06-15",
    settledAt: "2026-06-16",
  },
  {
    id: "EFT-002",
    batchRef: "EFT-BATCH-202606B",
    paymentRunId: "PR-2026-003",
    voucherCount: 12,
    totalAmount: 480000,
    bankAccountId: "bank-2",
    bankName: "BDO Corporate Operating",
    date: "2026-06-30",
    status: "transmitted",
    transmittedAt: "2026-06-30",
  },
  {
    id: "EFT-003",
    batchRef: "EFT-BATCH-202607C",
    paymentRunId: "PR-2026-003",
    voucherCount: 2,
    totalAmount: 89000,
    bankAccountId: "bank-2",
    bankName: "BDO Corporate Operating",
    date: "2026-07-01",
    status: "rejected",
    transmittedAt: "2026-07-01",
  },
]

export const initialReconciliationItems: ReconciliationItem[] = [
  {
    id: "REC-001",
    date: "2026-06-25",
    reference: "CHK-00028481",
    type: "Check",
    description: "Check 00028481 - Hospitality Supplies Philippines",
    amount: -67500,
    bankAccountId: "bank-1",
    matched: true,
    matchedId: "BST-001",
  },
  {
    id: "REC-002",
    date: "2026-06-28",
    reference: "CHK-00028482",
    type: "Check",
    description: "Check 00028482 - Davao Regional Deployment Services",
    amount: -145000,
    bankAccountId: "bank-1",
    matched: false,
  },
  {
    id: "REC-003",
    date: "2026-06-30",
    reference: "CHK-00028483",
    type: "Check",
    description: "Check 00028483 - Bureau of Internal Revenue",
    amount: -320000,
    bankAccountId: "bank-1",
    matched: false,
  },
  {
    id: "REC-004",
    date: "2026-06-15",
    reference: "EFT-BATCH-202606A",
    type: "EFT",
    description: "Direct Deposit Batch EFT-BATCH-202606A",
    amount: -640000,
    bankAccountId: "bank-2",
    matched: true,
    matchedId: "BST-002",
  },
  {
    id: "REC-005",
    date: "2026-06-30",
    reference: "EFT-BATCH-202606B",
    type: "EFT",
    description: "Direct Deposit Batch EFT-BATCH-202606B",
    amount: -480000,
    bankAccountId: "bank-2",
    matched: false,
  },
]

export const initialBankStatementItems: BankStatementItem[] = [
  {
    id: "BST-001",
    date: "2026-06-26",
    description: "METROBANK OUTWARD CHECK 00028481",
    amount: -67500,
    bankAccountId: "bank-1",
    reference: "CHK-00028481",
    matched: true,
  },
  {
    id: "BST-002",
    date: "2026-06-16",
    description: "BDO CORPORATE PESONet OUTWARD EFT-BATCH-202606A",
    amount: -640000,
    bankAccountId: "bank-2",
    reference: "EFT-BATCH-202606A",
    matched: true,
  },
  {
    id: "BST-003",
    date: "2026-06-29",
    description: "METROBANK DEPOSIT RET-CLIENT RET-9831",
    amount: 150000,
    bankAccountId: "bank-1",
    matched: false,
  },
  {
    id: "BST-004",
    date: "2026-07-02",
    description: "BDO CORPORATE PESONet OUTWARD EFT-BATCH-202606B",
    amount: -480000,
    bankAccountId: "bank-2",
    reference: "EFT-BATCH-202606B",
    matched: false,
  },
  {
    id: "BST-005",
    date: "2026-07-03",
    description: "METROBANK OUTWARD CHECK 00028482",
    amount: -145000,
    bankAccountId: "bank-1",
    reference: "CHK-00028482",
    matched: false,
  },
  {
    id: "BST-006",
    date: "2026-07-01",
    description: "METROBANK OUTWARD TRANSFER SUPPLIER-X SETTLEMENT",
    amount: -320000,
    bankAccountId: "bank-1",
    matched: false,
  },
]

export const initialAuditLogs: AuditLog[] = [
  {
    id: "AUD-001",
    actor: "Clara Reyes",
    action: "voucher_approved",
    entityType: "Voucher",
    entityId: "VCH-2026-001",
    timestamp: "2026-07-01T09:00:00.000Z",
    before: "unposted",
    after: "approved / gl_posted",
  },
  {
    id: "AUD-002",
    actor: "System",
    action: "gl_posted",
    entityType: "Voucher",
    entityId: "VCH-2026-001",
    timestamp: "2026-07-01T09:00:05.000Z",
    before: "unposted",
    after: "posted",
  },
  {
    id: "AUD-003",
    actor: "A. Dela Cruz",
    action: "payment_run_settled",
    entityType: "PaymentRun",
    entityId: "PR-2026-001",
    timestamp: "2026-06-26T15:30:00.000Z",
    before: "transmitted",
    after: "settled",
  },
]
