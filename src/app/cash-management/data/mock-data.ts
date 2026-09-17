// ─────────────────────────────────────────────────────────────────────────────
// ISMERS Cash Management — Data Types & Mock Dataset
// ─────────────────────────────────────────────────────────────────────────────

export type AccountType = "checking" | "savings" | "petty_cash" | "payroll" | "trust"
export type CashReceiptSource =
  | "Collection Management"
  | "Accounts Receivable"
  | "Payroll Recovery"
  | "Loan Repayment"
  | "Inter-fund Transfer"
  | "Other Income"
export type CashDisbursementCategory =
  | "Payroll"
  | "Vendor Payment"
  | "Tax Remittance"
  | "Loan Payment"
  | "Petty Cash Replenishment"
  | "Inter-fund Transfer"
  | "Operating Expense"
export type SubsystemSource =
  | "Client Acquisition"
  | "HRIS Payroll"
  | "Fleet & Transport"
  | "Facilities"
  | "Supply Chain"
  | "CRM"
  | "Governance & Admin"
  | "Benefits & Compliance"
  | "Financial Management"
export type TransactionStatus = "pending" | "posted" | "voided" | "reconciled"
export type TransferStatus = "pending" | "completed" | "cancelled"
export type PettyCashVoucherStatus = "draft" | "approved" | "paid" | "voided"

export interface CashBankAccount {
  id: string
  name: string
  accountNo: string
  bankName: string
  accountType: AccountType
  currency: string
  ledgerBalance: number
  bankBalance: number
  minimumBalance: number
  isActive: boolean
  lastReconciled: string
  subsystem: SubsystemSource | "Treasury"
}

export interface CashReceipt {
  id: string
  receiptNo: string
  date: string
  source: CashReceiptSource
  subsystem: SubsystemSource
  payer: string
  description: string
  amount: number
  paymentMethod: "Cash" | "Check" | "Bank Transfer" | "Online"
  referenceNo: string
  bankAccountId: string
  status: TransactionStatus
  glPosted: boolean
}

export interface CashDisbursement {
  id: string
  voucherNo: string
  date: string
  category: CashDisbursementCategory
  subsystem: SubsystemSource
  payee: string
  description: string
  amount: number
  paymentMethod: "Cash" | "Check" | "EFT" | "Wire"
  referenceNo: string
  bankAccountId: string
  status: TransactionStatus
  glPosted: boolean
}

export interface PettyCashFund {
  id: string
  custodian: string
  department: string
  subsystem: SubsystemSource
  fundLimit: number
  currentBalance: number
  lastReplenished: string
  status: "active" | "suspended" | "closed"
}

export interface PettyCashVoucher {
  id: string
  voucherNo: string
  fundId: string
  date: string
  payee: string
  purpose: string
  amount: number
  expenseAccount: string
  status: PettyCashVoucherStatus
  approvedBy?: string
}

export interface FundTransfer {
  id: string
  transferNo: string
  date: string
  fromAccountId: string
  toAccountId: string
  amount: number
  reason: string
  requestedBy: string
  status: TransferStatus
}

export interface CashForecastPeriod {
  period: string
  projectedInflow: number
  projectedOutflow: number
  openingBalance: number
  closingBalance: number
  isActual: boolean
}

export interface DailyCashPosition {
  date: string
  openingBalance: number
  totalInflow: number
  totalOutflow: number
  closingBalance: number
}

export const initialCashBankAccounts: CashBankAccount[] = [
  {
    id: "cash-1",
    name: "Metrobank Checking (Primary)",
    accountNo: "METRO-9831-2940",
    bankName: "Metrobank",
    accountType: "checking",
    currency: "PHP",
    ledgerBalance: 4250000,
    bankBalance: 4248500,
    minimumBalance: 500000,
    isActive: true,
    lastReconciled: "2026-07-05",
    subsystem: "Treasury",
  },
  {
    id: "cash-2",
    name: "BDO Corporate Operating",
    accountNo: "BDO-0021-8843",
    bankName: "BDO",
    accountType: "checking",
    currency: "PHP",
    ledgerBalance: 2450000,
    bankBalance: 2450000,
    minimumBalance: 300000,
    isActive: true,
    lastReconciled: "2026-07-05",
    subsystem: "Treasury",
  },
  {
    id: "cash-3",
    name: "BPI Payroll Disbursement",
    accountNo: "BPI-4412-0098",
    bankName: "BPI",
    accountType: "payroll",
    currency: "PHP",
    ledgerBalance: 1850000,
    bankBalance: 1850000,
    minimumBalance: 200000,
    isActive: true,
    lastReconciled: "2026-07-01",
    subsystem: "HRIS Payroll",
  },
  {
    id: "cash-4",
    name: "Petty Cash — Main Office",
    accountNo: "PC-MAIN-001",
    bankName: "Internal",
    accountType: "petty_cash",
    currency: "PHP",
    ledgerBalance: 48500,
    bankBalance: 48500,
    minimumBalance: 10000,
    isActive: true,
    lastReconciled: "2026-07-07",
    subsystem: "Governance & Admin",
  },
  {
    id: "cash-5",
    name: "Petty Cash — Fleet Operations",
    accountNo: "PC-FLEET-001",
    bankName: "Internal",
    accountType: "petty_cash",
    currency: "PHP",
    ledgerBalance: 22000,
    bankBalance: 22000,
    minimumBalance: 5000,
    isActive: true,
    lastReconciled: "2026-07-06",
    subsystem: "Fleet & Transport",
  },
  {
    id: "cash-6",
    name: "BDO Savings — Reserve",
    accountNo: "BDO-SAV-7721",
    bankName: "BDO",
    accountType: "savings",
    currency: "PHP",
    ledgerBalance: 3200000,
    bankBalance: 3200000,
    minimumBalance: 1000000,
    isActive: true,
    lastReconciled: "2026-06-30",
    subsystem: "Treasury",
  },
]

export const initialCashReceipts: CashReceipt[] = [
  {
    id: "cr-001",
    receiptNo: "CR-2026-0142",
    date: "2026-07-08",
    source: "Collection Management",
    subsystem: "Client Acquisition",
    payer: "GlobalTech Solutions Inc.",
    description: "Partial payment — deployment services invoice INV-2026-041",
    amount: 450000,
    paymentMethod: "Bank Transfer",
    referenceNo: "TRF-GTS-070826",
    bankAccountId: "cash-1",
    status: "posted",
    glPosted: true,
  },
  {
    id: "cr-002",
    receiptNo: "CR-2026-0141",
    date: "2026-07-07",
    source: "Collection Management",
    subsystem: "CRM",
    payer: "Pacific Retail Group",
    description: "Full settlement — staffing contract renewal",
    amount: 285000,
    paymentMethod: "Check",
    referenceNo: "CHK-88421",
    bankAccountId: "cash-2",
    status: "pending",
    glPosted: false,
  },
  {
    id: "cr-003",
    receiptNo: "CR-2026-0140",
    date: "2026-07-07",
    source: "Accounts Receivable",
    subsystem: "Facilities",
    payer: "Metro Property Holdings",
    description: "Facility management retainer — Q3 2026",
    amount: 175000,
    paymentMethod: "Online",
    referenceNo: "GCASH-MPH-070726",
    bankAccountId: "cash-1",
    status: "posted",
    glPosted: true,
  },
  {
    id: "cr-004",
    receiptNo: "CR-2026-0139",
    date: "2026-07-06",
    source: "Payroll Recovery",
    subsystem: "HRIS Payroll",
    payer: "Employee — Ana Santos (E-1042)",
    description: "Salary advance recovery — 2 installments",
    amount: 12500,
    paymentMethod: "Cash",
    referenceNo: "ADV-REC-1042",
    bankAccountId: "cash-4",
    status: "posted",
    glPosted: true,
  },
  {
    id: "cr-005",
    receiptNo: "CR-2026-0138",
    date: "2026-07-05",
    source: "Collection Management",
    subsystem: "Supply Chain",
    payer: "LogiCore Distribution",
    description: "Warehousing service fees — June 2026",
    amount: 92000,
    paymentMethod: "Bank Transfer",
    referenceNo: "TRF-LC-070526",
    bankAccountId: "cash-2",
    status: "reconciled",
    glPosted: true,
  },
  {
    id: "cr-006",
    receiptNo: "CR-2026-0137",
    date: "2026-07-04",
    source: "Loan Repayment",
    subsystem: "Benefits & Compliance",
    payer: "Employee — Mark Dela Cruz (E-0876)",
    description: "SSS/Pag-IBIG loan deduction remittance",
    amount: 8400,
    paymentMethod: "Cash",
    referenceNo: "LOAN-0876-JUL",
    bankAccountId: "cash-4",
    status: "posted",
    glPosted: true,
  },
]

export const initialCashDisbursements: CashDisbursement[] = [
  {
    id: "cd-001",
    voucherNo: "CD-2026-0089",
    date: "2026-07-08",
    category: "Payroll",
    subsystem: "HRIS Payroll",
    payee: "June 2026 Deployed Staff (Batch B)",
    description: "Bi-monthly payroll disbursement — deployment contracts",
    amount: 750000,
    paymentMethod: "EFT",
    referenceNo: "PAY-2026-06B",
    bankAccountId: "cash-3",
    status: "pending",
    glPosted: false,
  },
  {
    id: "cd-002",
    voucherNo: "CD-2026-0088",
    date: "2026-07-07",
    category: "Vendor Payment",
    subsystem: "Fleet & Transport",
    payee: "Shell Fleet Solutions",
    description: "Monthly fleet fuel card replenishment",
    amount: 112500,
    paymentMethod: "Check",
    referenceNo: "FLEET-FUEL-492",
    bankAccountId: "cash-1",
    status: "posted",
    glPosted: true,
  },
  {
    id: "cd-003",
    voucherNo: "CD-2026-0087",
    date: "2026-07-07",
    category: "Tax Remittance",
    subsystem: "Financial Management",
    payee: "Bureau of Internal Revenue",
    description: "Withholding tax remittance — June 2026",
    amount: 186400,
    paymentMethod: "EFT",
    referenceNo: "BIR-WHT-062026",
    bankAccountId: "cash-1",
    status: "posted",
    glPosted: true,
  },
  {
    id: "cd-004",
    voucherNo: "CD-2026-0086",
    date: "2026-07-06",
    category: "Operating Expense",
    subsystem: "Governance & Admin",
    payee: "Office Depot Philippines",
    description: "Office supplies and consumables",
    amount: 8450,
    paymentMethod: "Cash",
    referenceNo: "PCV-OD-070626",
    bankAccountId: "cash-4",
    status: "posted",
    glPosted: true,
  },
  {
    id: "cd-005",
    voucherNo: "CD-2026-0085",
    date: "2026-07-05",
    category: "Vendor Payment",
    subsystem: "Supply Chain",
    payee: "Manila Industrial Supply Co.",
    description: "PPE and safety equipment procurement",
    amount: 67800,
    paymentMethod: "Check",
    referenceNo: "PO-2026-0441",
    bankAccountId: "cash-2",
    status: "reconciled",
    glPosted: true,
  },
  {
    id: "cd-006",
    voucherNo: "CD-2026-0084",
    date: "2026-07-04",
    category: "Petty Cash Replenishment",
    subsystem: "Fleet & Transport",
    payee: "Petty Cash — Fleet Operations",
    description: "Replenish fleet petty cash fund after expense liquidation",
    amount: 15000,
    paymentMethod: "Cash",
    referenceNo: "PCR-FLEET-JUL",
    bankAccountId: "cash-5",
    status: "posted",
    glPosted: true,
  },
]

export const initialPettyCashFunds: PettyCashFund[] = [
  {
    id: "pcf-1",
    custodian: "Maria Lopez",
    department: "Administration",
    subsystem: "Governance & Admin",
    fundLimit: 50000,
    currentBalance: 48500,
    lastReplenished: "2026-07-01",
    status: "active",
  },
  {
    id: "pcf-2",
    custodian: "Rico Mendoza",
    department: "Fleet Operations",
    subsystem: "Fleet & Transport",
    fundLimit: 25000,
    currentBalance: 22000,
    lastReplenished: "2026-07-04",
    status: "active",
  },
  {
    id: "pcf-3",
    custodian: "Jenny Tan",
    department: "HR & Recruitment",
    subsystem: "Client Acquisition",
    fundLimit: 20000,
    currentBalance: 14200,
    lastReplenished: "2026-06-15",
    status: "active",
  },
]

export const initialPettyCashVouchers: PettyCashVoucher[] = [
  {
    id: "pcv-001",
    voucherNo: "PCV-2026-0312",
    fundId: "pcf-1",
    date: "2026-07-08",
    payee: "National Book Store",
    purpose: "Printer toner and A4 bond paper",
    amount: 3200,
    expenseAccount: "6100 — Office Supplies",
    status: "draft",
  },
  {
    id: "pcv-002",
    voucherNo: "PCV-2026-0311",
    fundId: "pcf-2",
    date: "2026-07-07",
    payee: "Petron Station — EDSA",
    purpose: "Emergency fuel for dispatch vehicle",
    amount: 1500,
    expenseAccount: "6200 — Fleet Fuel",
    status: "approved",
    approvedBy: "Fleet Manager",
  },
  {
    id: "pcv-003",
    voucherNo: "PCV-2026-0310",
    fundId: "pcf-1",
    date: "2026-07-06",
    payee: "Office Depot Philippines",
    purpose: "Office supplies and consumables",
    amount: 8450,
    expenseAccount: "6100 — Office Supplies",
    status: "paid",
    approvedBy: "Admin Manager",
  },
  {
    id: "pcv-004",
    voucherNo: "PCV-2026-0309",
    fundId: "pcf-3",
    date: "2026-07-05",
    payee: "Grab Transport",
    purpose: "Applicant interview transport reimbursement",
    amount: 680,
    expenseAccount: "6300 — Recruitment Expense",
    status: "paid",
    approvedBy: "HR Manager",
  },
]

export const initialFundTransfers: FundTransfer[] = [
  {
    id: "ft-001",
    transferNo: "FT-2026-0024",
    date: "2026-07-08",
    fromAccountId: "cash-1",
    toAccountId: "cash-3",
    amount: 500000,
    reason: "Pre-fund payroll disbursement account for mid-month run",
    requestedBy: "Treasury Officer",
    status: "pending",
  },
  {
    id: "ft-002",
    transferNo: "FT-2026-0023",
    date: "2026-07-05",
    fromAccountId: "cash-6",
    toAccountId: "cash-1",
    amount: 800000,
    reason: "Transfer reserve funds to operating account for vendor payments",
    requestedBy: "CFO",
    status: "completed",
  },
  {
    id: "ft-003",
    transferNo: "FT-2026-0022",
    date: "2026-07-03",
    fromAccountId: "cash-1",
    toAccountId: "cash-4",
    amount: 20000,
    reason: "Petty cash replenishment — Main Office",
    requestedBy: "Maria Lopez",
    status: "completed",
  },
]

export const initialCashForecast: CashForecastPeriod[] = [
  { period: "Jul W1", projectedInflow: 820000, projectedOutflow: 1050000, openingBalance: 8621500, closingBalance: 8391500, isActual: true },
  { period: "Jul W2", projectedInflow: 650000, projectedOutflow: 980000, openingBalance: 8391500, closingBalance: 8061500, isActual: false },
  { period: "Jul W3", projectedInflow: 1200000, projectedOutflow: 1850000, openingBalance: 8061500, closingBalance: 7411500, isActual: false },
  { period: "Jul W4", projectedInflow: 950000, projectedOutflow: 720000, openingBalance: 7411500, closingBalance: 7641500, isActual: false },
  { period: "Aug W1", projectedInflow: 780000, projectedOutflow: 1100000, openingBalance: 7641500, closingBalance: 7321500, isActual: false },
  { period: "Aug W2", projectedInflow: 1100000, projectedOutflow: 1750000, openingBalance: 7321500, closingBalance: 6671500, isActual: false },
]

export const initialDailyPositions: DailyCashPosition[] = [
  { date: "2026-07-04", openingBalance: 8512000, totalInflow: 20900, totalOutflow: 67800, closingBalance: 8465100 },
  { date: "2026-07-05", openingBalance: 8465100, totalInflow: 92000, totalOutflow: 271400, closingBalance: 8285700 },
  { date: "2026-07-06", openingBalance: 8285700, totalInflow: 175000, totalOutflow: 22850, closingBalance: 8437850 },
  { date: "2026-07-07", openingBalance: 8437850, totalInflow: 285000, totalOutflow: 298900, closingBalance: 8423950 },
  { date: "2026-07-08", openingBalance: 8423950, totalInflow: 450000, totalOutflow: 750000, closingBalance: 8123950 },
]
