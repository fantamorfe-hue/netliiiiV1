// ─────────────────────────────────────────────────────────────────────────────
// ISMERS Collection Management — Data Types & Mock Dataset
// ─────────────────────────────────────────────────────────────────────────────

export type InvoiceStatus = "draft" | "issued" | "partially_paid" | "paid" | "overdue" | "void" | "disputed"
export type PaymentMethod = "Cash" | "Check" | "Bank Transfer" | "Online" | "Credit Card" | "PDC"
export type DunningStage = "none" | "reminder" | "first_notice" | "second_notice" | "final_notice" | "legal"
export type PromiseStatus = "pending" | "kept" | "broken" | "rescheduled"
export type AgingBucket = "current" | "1-30" | "31-60" | "61-90" | "over_90"
export type SubsystemSource =
  | "Client Acquisition"
  | "HRIS Payroll"
  | "Regional Deployment"
  | "Client Site Operations"
  | "Supply Chain"
  | "CRM"
  | "Governance & Admin"
  | "Benefits & Compliance"

export interface CustomerAccount {
  id: string
  clientName: string
  clientCode: string
  industry: string
  creditLimit: number
  currentBalance: number
  overdueBalance: number
  agingBucket: AgingBucket
  contactEmail: string
  contactPerson: string
  collectionRep: string
  paymentTerms: string
  dunningStage: DunningStage
  lastPaymentDate: string
  lastPaymentAmount: number
  status: "active" | "on_hold" | "suspended" | "closed"
  subsystem: SubsystemSource
}

export interface CollectionInvoice {
  id: string
  invoiceNo: string
  customerId: string
  clientName: string
  subsystem: SubsystemSource
  description: string
  issueDate: string
  dueDate: string
  grossAmount: number
  taxAmount: number
  totalAmount: number
  paidAmount: number
  balanceAmount: number
  status: InvoiceStatus
  agingBucket: AgingBucket
  dunningStage: DunningStage
  paymentTerms: string
}

export interface PaymentReceipt {
  id: string
  receiptNo: string
  customerId: string
  clientName: string
  invoiceIds: string[]
  paymentMethod: PaymentMethod
  referenceNo: string
  amountReceived: number
  datePaid: string
  bankDepositDate?: string
  bankAccountId: string
  status: "pending" | "cleared" | "bounced" | "reversed"
  notes?: string
}

export interface CreditNote {
  id: string
  creditNoteNo: string
  customerId: string
  clientName: string
  invoiceId?: string
  reason: "Price Adjustment" | "Service Failure" | "Overpayment" | "Discount" | "Write-off" | "Contract Dispute"
  amount: number
  date: string
  status: "draft" | "applied" | "voided"
  appliedToInvoiceId?: string
}

export interface DunningActivity {
  id: string
  customerId: string
  clientName: string
  invoiceId?: string
  stage: DunningStage
  method: "Email" | "Phone Call" | "SMS" | "Letter" | "Visit" | "Legal Notice"
  sentDate: string
  responseDate?: string
  response?: string
  assignedTo: string
  outcome: "no_response" | "promised_payment" | "dispute_raised" | "paid" | "escalated" | "pending"
}

export interface PromiseToPay {
  id: string
  customerId: string
  clientName: string
  invoiceId: string
  promisedAmount: number
  promisedDate: string
  status: PromiseStatus
  collectionRep: string
  createdDate: string
  notes?: string
}

export interface BankDeposit {
  id: string
  depositSlipNo: string
  bankAccountId: string
  bankName: string
  receipts: string[]
  totalAmount: number
  depositDate: string
  status: "pending" | "confirmed" | "reconciled"
}

export interface CollectionBankAccount {
  id: string
  name: string
  accountNo: string
  balance: number
  currency: string
  pendingDeposits: number
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

export const initialCollectionBankAccounts: CollectionBankAccount[] = [
  { id: "cbank-1", name: "Metrobank Collections (Primary)", accountNo: "METRO-COL-4421", balance: 8650000, currency: "PHP", pendingDeposits: 480000 },
  { id: "cbank-2", name: "BDO Enterprise Account", accountNo: "BDO-ENT-8831", balance: 4120000, currency: "PHP", pendingDeposits: 155000 },
  { id: "cbank-3", name: "BPI Corporate Savings", accountNo: "BPI-CORP-3310", balance: 2380000, currency: "PHP", pendingDeposits: 0 },
]

export const initialCustomerAccounts: CustomerAccount[] = [
  {
    id: "cust-001", clientName: "Makati Hotel Group", clientCode: "MHG-001", industry: "Hospitality",
    creditLimit: 3000000, currentBalance: 850000, overdueBalance: 285000, agingBucket: "31-60",
    contactEmail: "finance@makatihotelgroup.ph", contactPerson: "Maria Santos", collectionRep: "Jenny Cruz",
    paymentTerms: "Net 30", dunningStage: "first_notice", lastPaymentDate: "2026-06-05", lastPaymentAmount: 420750,
    status: "active", subsystem: "Client Site Operations",
  },
  {
    id: "cust-002", clientName: "Cebu Resort Operations", clientCode: "CRO-002", industry: "Resort & Hospitality",
    creditLimit: 5000000, currentBalance: 1240000, overdueBalance: 620000, agingBucket: "61-90",
    contactEmail: "ar@ceburesorts.ph", contactPerson: "Roberto Tan", collectionRep: "Mark Reyes",
    paymentTerms: "Net 45", dunningStage: "second_notice", lastPaymentDate: "2026-05-18", lastPaymentAmount: 380000,
    status: "on_hold", subsystem: "Client Acquisition",
  },
  {
    id: "cust-003", clientName: "Palawan Resort Services", clientCode: "PRS-003", industry: "Resort & Hospitality",
    creditLimit: 2500000, currentBalance: 315000, overdueBalance: 315000, agingBucket: "over_90",
    contactEmail: "billing@palawanresorts.ph", contactPerson: "Ana Reyes", collectionRep: "Jenny Cruz",
    paymentTerms: "Net 30", dunningStage: "final_notice", lastPaymentDate: "2026-04-02", lastPaymentAmount: 150000,
    status: "suspended", subsystem: "Client Site Operations",
  },
  {
    id: "cust-004", clientName: "Manila Country Club", clientCode: "MCC-004", industry: "Club & Food Service",
    creditLimit: 4000000, currentBalance: 360000, overdueBalance: 0, agingBucket: "current",
    contactEmail: "accounting@manilacountryclub.ph", contactPerson: "Juan Dela Cruz", collectionRep: "Paul Villar",
    paymentTerms: "Net 30", dunningStage: "none", lastPaymentDate: "2026-07-01", lastPaymentAmount: 360000,
    status: "active", subsystem: "Client Site Operations",
  },
  {
    id: "cust-005", clientName: "Bataan Manufacturing Park", clientCode: "BMP-005", industry: "Manufacturing",
    creditLimit: 6000000, currentBalance: 2100000, overdueBalance: 0, agingBucket: "current",
    contactEmail: "finance@bataanmanufacturing.ph", contactPerson: "Ben Torres", collectionRep: "Paul Villar",
    paymentTerms: "Net 60", dunningStage: "none", lastPaymentDate: "2026-06-30", lastPaymentAmount: 1050000,
    status: "active", subsystem: "Regional Deployment",
  },
  {
    id: "cust-006", clientName: "Iloilo Hospitality Group", clientCode: "IHG-006", industry: "Hospitality",
    creditLimit: 1500000, currentBalance: 490000, overdueBalance: 180000, agingBucket: "1-30",
    contactEmail: "ar@iloilohospitality.ph", contactPerson: "Lucia Gomez", collectionRep: "Mark Reyes",
    paymentTerms: "Net 30", dunningStage: "reminder", lastPaymentDate: "2026-06-20", lastPaymentAmount: 200000,
    status: "active", subsystem: "Supply Chain",
  },
  {
    id: "cust-007", clientName: "Davao Hotel Operations", clientCode: "DHO-007", industry: "Hospitality",
    creditLimit: 2000000, currentBalance: 125000, overdueBalance: 0, agingBucket: "current",
    contactEmail: "billing@davaohotels.ph", contactPerson: "Jess Navarro", collectionRep: "Jenny Cruz",
    paymentTerms: "Net 15", dunningStage: "none", lastPaymentDate: "2026-07-03", lastPaymentAmount: 125000,
    status: "active", subsystem: "Client Site Operations",
  },
]

export const initialInvoices: CollectionInvoice[] = [
  {
    id: "inv-001", invoiceNo: "INV-2026-0448", customerId: "cust-001", clientName: "Makati Hotel Group",
    subsystem: "Client Site Operations", description: "Housekeeping and food-service manpower deployment - June 2026",
    issueDate: "2026-06-01", dueDate: "2026-07-01", grossAmount: 247826, taxAmount: 29739, totalAmount: 277565,
    paidAmount: 0, balanceAmount: 277565, status: "overdue", agingBucket: "1-30", dunningStage: "first_notice",
    paymentTerms: "Net 30",
  },
  {
    id: "inv-002", invoiceNo: "INV-2026-0447", customerId: "cust-001", clientName: "Makati Hotel Group",
    subsystem: "Client Site Operations", description: "Hotel service crew deployment - May 2026",
    issueDate: "2026-05-15", dueDate: "2026-06-15", grossAmount: 510714, taxAmount: 61286, totalAmount: 572000,
    paidAmount: 285000, balanceAmount: 287000, status: "partially_paid", agingBucket: "31-60", dunningStage: "first_notice",
    paymentTerms: "Net 30",
  },
  {
    id: "inv-003", invoiceNo: "INV-2026-0446", customerId: "cust-002", clientName: "Cebu Resort Operations",
    subsystem: "Client Acquisition", description: "Recruitment and deployment services - April-May 2026",
    issueDate: "2026-04-30", dueDate: "2026-06-15", grossAmount: 1107143, taxAmount: 132857, totalAmount: 1240000,
    paidAmount: 620000, balanceAmount: 620000, status: "partially_paid", agingBucket: "61-90", dunningStage: "second_notice",
    paymentTerms: "Net 45",
  },
  {
    id: "inv-004", invoiceNo: "INV-2026-0445", customerId: "cust-003", clientName: "Palawan Resort Services",
    subsystem: "Client Site Operations", description: "Resort housekeeping manpower services - Q1 2026",
    issueDate: "2026-03-31", dueDate: "2026-04-30", grossAmount: 281250, taxAmount: 33750, totalAmount: 315000,
    paidAmount: 0, balanceAmount: 315000, status: "overdue", agingBucket: "over_90", dunningStage: "final_notice",
    paymentTerms: "Net 30",
  },
  {
    id: "inv-005", invoiceNo: "INV-2026-0444", customerId: "cust-004", clientName: "Manila Country Club",
    subsystem: "Client Site Operations", description: "Restaurant and events service crew deployment - June 2026",
    issueDate: "2026-06-01", dueDate: "2026-07-01", grossAmount: 321429, taxAmount: 38571, totalAmount: 360000,
    paidAmount: 360000, balanceAmount: 0, status: "paid", agingBucket: "current", dunningStage: "none",
    paymentTerms: "Net 30",
  },
  {
    id: "inv-006", invoiceNo: "INV-2026-0443", customerId: "cust-005", clientName: "Bataan Manufacturing Park",
    subsystem: "Regional Deployment", description: "Production and engineering manpower services - June 2026",
    issueDate: "2026-06-15", dueDate: "2026-08-15", grossAmount: 1875000, taxAmount: 225000, totalAmount: 2100000,
    paidAmount: 0, balanceAmount: 2100000, status: "issued", agingBucket: "current", dunningStage: "none",
    paymentTerms: "Net 60",
  },
  {
    id: "inv-007", invoiceNo: "INV-2026-0442", customerId: "cust-006", clientName: "Iloilo Hospitality Group",
    subsystem: "Regional Deployment", description: "Hotel and restaurant manpower services - June 2026",
    issueDate: "2026-06-10", dueDate: "2026-07-10", grossAmount: 437500, taxAmount: 52500, totalAmount: 490000,
    paidAmount: 310000, balanceAmount: 180000, status: "partially_paid", agingBucket: "1-30", dunningStage: "reminder",
    paymentTerms: "Net 30",
  },
  {
    id: "inv-008", invoiceNo: "INV-2026-0441", customerId: "cust-007", clientName: "Davao Hotel Operations",
    subsystem: "Client Site Operations", description: "Front-office and housekeeping manpower services - June 2026",
    issueDate: "2026-06-25", dueDate: "2026-07-10", grossAmount: 111607, taxAmount: 13393, totalAmount: 125000,
    paidAmount: 125000, balanceAmount: 0, status: "paid", agingBucket: "current", dunningStage: "none",
    paymentTerms: "Net 15",
  },
  {
    id: "inv-009", invoiceNo: "INV-2026-0440", customerId: "cust-002", clientName: "Cebu Resort Operations",
    subsystem: "Client Acquisition", description: "Applicant registration and selection services - March 2026",
    issueDate: "2026-03-01", dueDate: "2026-04-15", grossAmount: 535714, taxAmount: 64286, totalAmount: 600000,
    paidAmount: 600000, balanceAmount: 0, status: "paid", agingBucket: "current", dunningStage: "none",
    paymentTerms: "Net 45",
  },
]

export const initialPaymentReceipts: PaymentReceipt[] = [
  {
    id: "rec-001", receiptNo: "OR-2026-1001", customerId: "cust-004", clientName: "Manila Country Club",
    invoiceIds: ["inv-005"], paymentMethod: "Bank Transfer", referenceNo: "BPI-TXN-20260701-884421",
    amountReceived: 360000, datePaid: "2026-07-01", bankDepositDate: "2026-07-01", bankAccountId: "cbank-1",
    status: "cleared", notes: "Full payment for restaurant and events service crew",
  },
  {
    id: "rec-002", receiptNo: "OR-2026-0998", customerId: "cust-007", clientName: "Davao Hotel Operations",
    invoiceIds: ["inv-008"], paymentMethod: "Online", referenceNo: "GCash-REF-20260703-119922",
    amountReceived: 125000, datePaid: "2026-07-03", bankDepositDate: "2026-07-04", bankAccountId: "cbank-2",
    status: "cleared", notes: "Online payment - GCash Business",
  },
  {
    id: "rec-003", receiptNo: "OR-2026-0995", customerId: "cust-001", clientName: "Makati Hotel Group",
    invoiceIds: ["inv-002"], paymentMethod: "Check", referenceNo: "BDO-CHK-009283747",
    amountReceived: 285000, datePaid: "2026-06-18", bankDepositDate: "2026-06-20", bankAccountId: "cbank-2",
    status: "cleared", notes: "Partial payment for May service crew deployment",
  },
  {
    id: "rec-004", receiptNo: "OR-2026-0980", customerId: "cust-002", clientName: "Cebu Resort Operations",
    invoiceIds: ["inv-003"], paymentMethod: "Bank Transfer", referenceNo: "METRO-TXN-20260520-550012",
    amountReceived: 620000, datePaid: "2026-05-20", bankDepositDate: "2026-05-21", bankAccountId: "cbank-1",
    status: "cleared", notes: "Partial payment under approved payment plan",
  },
  {
    id: "rec-005", receiptNo: "OR-2026-0960", customerId: "cust-006", clientName: "Iloilo Hospitality Group",
    invoiceIds: ["inv-007"], paymentMethod: "PDC", referenceNo: "PDC-PNB-00482910",
    amountReceived: 310000, datePaid: "2026-06-25", bankAccountId: "cbank-3",
    status: "pending", notes: "Post-dated check to be deposited on due date",
  },
  {
    id: "rec-006", receiptNo: "OR-2026-0940", customerId: "cust-002", clientName: "Cebu Resort Operations",
    invoiceIds: ["inv-009"], paymentMethod: "Bank Transfer", referenceNo: "BPI-TXN-20260610-224410",
    amountReceived: 600000, datePaid: "2026-06-10", bankDepositDate: "2026-06-10", bankAccountId: "cbank-1",
    status: "cleared", notes: "Full settlement for March recruitment services",
  },
]

export const initialCreditNotes: CreditNote[] = [
  {
    id: "cn-001", creditNoteNo: "CN-2026-0088", customerId: "cust-001", clientName: "Makati Hotel Group",
    invoiceId: "inv-002", reason: "Service Failure", amount: 45000,
    date: "2026-06-25", status: "applied", appliedToInvoiceId: "inv-002",
  },
  {
    id: "cn-002", creditNoteNo: "CN-2026-0075", customerId: "cust-002", clientName: "Cebu Resort Operations",
    invoiceId: "inv-003", reason: "Price Adjustment", amount: 60000,
    date: "2026-05-10", status: "applied", appliedToInvoiceId: "inv-003",
  },
  {
    id: "cn-003", creditNoteNo: "CN-2026-0062", customerId: "cust-003", clientName: "Palawan Resort Services",
    invoiceId: "inv-004", reason: "Discount", amount: 25000,
    date: "2026-04-15", status: "applied", appliedToInvoiceId: "inv-004",
  },
  {
    id: "cn-004", creditNoteNo: "CN-2026-0050", customerId: "cust-006", clientName: "Iloilo Hospitality Group",
    reason: "Overpayment", amount: 18000,
    date: "2026-06-28", status: "draft",
  },
]

export const initialDunningActivities: DunningActivity[] = [
  {
    id: "dun-001", customerId: "cust-001", clientName: "Makati Hotel Group", invoiceId: "inv-001",
    stage: "first_notice", method: "Email", sentDate: "2026-07-03", responseDate: "2026-07-04",
    response: "Acknowledged, will pay by July 15", assignedTo: "Jenny Cruz",
    outcome: "promised_payment",
  },
  {
    id: "dun-002", customerId: "cust-002", clientName: "Cebu Resort Operations", invoiceId: "inv-003",
    stage: "second_notice", method: "Phone Call", sentDate: "2026-06-30",
    assignedTo: "Mark Reyes", outcome: "no_response",
  },
  {
    id: "dun-003", customerId: "cust-003", clientName: "Palawan Resort Services", invoiceId: "inv-004",
    stage: "final_notice", method: "Letter", sentDate: "2026-06-28", responseDate: "2026-07-01",
    response: "Customer disputes invoice amount requesting credit note adjustment",
    assignedTo: "Jenny Cruz", outcome: "dispute_raised",
  },
  {
    id: "dun-004", customerId: "cust-006", clientName: "Iloilo Hospitality Group", invoiceId: "inv-007",
    stage: "reminder", method: "SMS", sentDate: "2026-07-02",
    assignedTo: "Mark Reyes", outcome: "promised_payment",
  },
  {
    id: "dun-005", customerId: "cust-001", clientName: "Makati Hotel Group", invoiceId: "inv-002",
    stage: "reminder", method: "Email", sentDate: "2026-06-22", responseDate: "2026-06-23",
    response: "Sent partial payment of PHP 285,000", assignedTo: "Jenny Cruz", outcome: "paid",
  },
]

export const initialPromisesToPay: PromiseToPay[] = [
  {
    id: "ptp-001", customerId: "cust-001", clientName: "Makati Hotel Group", invoiceId: "inv-001",
    promisedAmount: 277565, promisedDate: "2026-07-15", status: "pending",
    collectionRep: "Jenny Cruz", createdDate: "2026-07-04", notes: "Client confirmed by email",
  },
  {
    id: "ptp-002", customerId: "cust-002", clientName: "Cebu Resort Operations", invoiceId: "inv-003",
    promisedAmount: 310000, promisedDate: "2026-07-08", status: "broken",
    collectionRep: "Mark Reyes", createdDate: "2026-06-28", notes: "Failed to pay on agreed date. Rescheduled.",
  },
  {
    id: "ptp-003", customerId: "cust-006", clientName: "Iloilo Hospitality Group", invoiceId: "inv-007",
    promisedAmount: 180000, promisedDate: "2026-07-20", status: "pending",
    collectionRep: "Mark Reyes", createdDate: "2026-07-02",
  },
  {
    id: "ptp-004", customerId: "cust-004", clientName: "Manila Country Club", invoiceId: "inv-005",
    promisedAmount: 360000, promisedDate: "2026-07-01", status: "kept",
    collectionRep: "Paul Villar", createdDate: "2026-06-28", notes: "Paid on time via bank transfer",
  },
]

export const initialBankDeposits: BankDeposit[] = [
  {
    id: "dep-001", depositSlipNo: "DS-2026-0441", bankAccountId: "cbank-1", bankName: "Metrobank Collections (Primary)",
    receipts: ["rec-001", "rec-006"], totalAmount: 960000, depositDate: "2026-07-01", status: "reconciled",
  },
  {
    id: "dep-002", depositSlipNo: "DS-2026-0438", bankAccountId: "cbank-2", bankName: "BDO Enterprise Account",
    receipts: ["rec-002", "rec-003"], totalAmount: 410000, depositDate: "2026-07-04", status: "confirmed",
  },
  {
    id: "dep-003", depositSlipNo: "DS-2026-0430", bankAccountId: "cbank-1", bankName: "Metrobank Collections (Primary)",
    receipts: ["rec-004"], totalAmount: 620000, depositDate: "2026-05-21", status: "reconciled",
  },
  {
    id: "dep-004", depositSlipNo: "DS-2026-0450", bankAccountId: "cbank-3", bankName: "BPI Corporate Savings",
    receipts: ["rec-005"], totalAmount: 310000, depositDate: "2026-07-08", status: "pending",
  },
]
