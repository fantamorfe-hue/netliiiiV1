export interface InvoiceItem {
  id: string
  invoiceNo: string
  clientName: string
  subsystem: 'Client Management' | 'HRIS & Recruitment' | 'Fleet & Transport' | 'Facilities & Admin' | 'Supply Chain'
  description: string
  amount: number
  vatAmount: number
  ewtAmount: number
  totalAmount: number
  dueDate: string
  status: 'PENDING' | 'OVERDUE' | 'PARTIAL'
  jobOrderNo?: string
}

export interface TransactionRecord {
  id: string
  orNo: string // Official Receipt Number or Voucher Number
  type: 'COLLECTION' | 'DISBURSEMENT'
  clientName: string
  subsystem: 'Client Management' | 'HRIS & Recruitment' | 'Fleet & Transport' | 'Facilities & Admin' | 'Supply Chain' | 'General Ledger'
  amount: number
  paymentMethod: 'Cash' | 'Credit Card' | 'QR Ph / E-Wallet' | 'Check' | 'Bank Transfer'
  referenceNo: string
  timestamp: string
  cashierName: string
  status: 'COMPLETED' | 'VOIDED' | 'UNDER_REVIEW'
  vatBreakdown?: {
    vatableSales: number
    vatAmount: number
    vatExempt: number
    zeroRated: number
  }
}

export interface ShiftInfo {
  shiftId: string
  cashierName: string
  terminalId: string
  startTime: string
  openingCash: number
  totalCollectionsCash: number
  totalCollectionsNonCash: number
  totalDisbursementsCash: number
  expectedEndingCash: number
  actualEndingCash?: number
  variance?: number
  status: 'OPEN' | 'CLOSING_IN_PROGRESS' | 'CLOSED'
}

export const INITIAL_SHIFT_INFO: ShiftInfo = {
  shiftId: 'SH-2026-0891',
  cashierName: 'Maria Santos',
  terminalId: 'POS-TERM-04 (Main Financial Hub)',
  startTime: '08:00 AM - Jul 31, 2026',
  openingCash: 15000.00,
  totalCollectionsCash: 48500.00,
  totalCollectionsNonCash: 136420.50,
  totalDisbursementsCash: 8450.00,
  expectedEndingCash: 55050.00,
  status: 'OPEN'
}

export const INITIAL_PENDING_INVOICES: InvoiceItem[] = [
  {
    id: 'INV-1001',
    invoiceNo: 'ISM-2026-INV-0481',
    clientName: 'Makati Hotel Group',
    subsystem: 'HRIS & Recruitment',
    description: 'Hospitality manpower deployment retainer and service-training fees (25 personnel)',
    amount: 85000.00,
    vatAmount: 10200.00,
    ewtAmount: 1700.00,
    totalAmount: 93500.00,
    dueDate: '2026-07-31',
    status: 'PENDING',
    jobOrderNo: 'JO-2026-889'
  },
  {
    id: 'INV-1002',
    invoiceNo: 'ISM-2026-INV-0482',
    clientName: 'Cebu Resort Operations',
    subsystem: 'Fleet & Transport',
    description: 'Inter-island personnel deployment and accommodation charges',
    amount: 32000.00,
    vatAmount: 3840.00,
    ewtAmount: 640.00,
    totalAmount: 35200.00,
    dueDate: '2026-07-31',
    status: 'PENDING',
    jobOrderNo: 'DEPLOY-TR-104'
  },
  {
    id: 'INV-1003',
    invoiceNo: 'ISM-2026-INV-0483',
    clientName: 'San Miguel Industrial Hub',
    subsystem: 'Facilities & Admin',
    description: 'Executive Conference Hall Rental & Security Escort (Aug Event)',
    amount: 18500.00,
    vatAmount: 2220.00,
    ewtAmount: 370.00,
    totalAmount: 20350.00,
    dueDate: '2026-08-01',
    status: 'PENDING',
    jobOrderNo: 'FAC-2026-044'
  },
  {
    id: 'INV-1004',
    invoiceNo: 'ISM-2026-INV-0484',
    clientName: 'Metro Health System Inc.',
    subsystem: 'Client Management',
    description: 'Monthly Managed Services & Staffing Retainer (July Billing)',
    amount: 145000.00,
    vatAmount: 17400.00,
    ewtAmount: 2900.00,
    totalAmount: 159500.00,
    dueDate: '2026-07-30',
    status: 'OVERDUE',
    jobOrderNo: 'CRM-2026-901'
  },
  {
    id: 'INV-1005',
    invoiceNo: 'ISM-2026-INV-0485',
    clientName: 'TechCore Supply Chain Co.',
    subsystem: 'Supply Chain',
    description: 'Warehouse Clearance Spare Parts & Asset Equipment Sale',
    amount: 12400.00,
    vatAmount: 1488.00,
    ewtAmount: 248.00,
    totalAmount: 13640.00,
    dueDate: '2026-07-31',
    status: 'PENDING',
    jobOrderNo: 'SCM-PO-3301'
  }
]

export const INITIAL_TRANSACTIONS: TransactionRecord[] = [
  {
    id: 'TXN-8801',
    orNo: 'OR-2026-78401',
    type: 'COLLECTION',
    clientName: 'Megaworld Property Management',
    subsystem: 'Client Management',
    amount: 68400.00,
    paymentMethod: 'Bank Transfer',
    referenceNo: 'BDO-REF-992144',
    timestamp: '02:45 PM',
    cashierName: 'Maria Santos',
    status: 'COMPLETED',
    vatBreakdown: {
      vatableSales: 61071.43,
      vatAmount: 7328.57,
      vatExempt: 0,
      zeroRated: 0
    }
  },
  {
    id: 'TXN-8802',
    orNo: 'OR-2026-78402',
    type: 'COLLECTION',
    clientName: 'Juan Dela Cruz (Employee ID #E-1049)',
    subsystem: 'HRIS & Recruitment',
    amount: 2500.00,
    paymentMethod: 'Cash',
    referenceNo: 'CASH-T04-8802',
    timestamp: '02:15 PM',
    cashierName: 'Maria Santos',
    status: 'COMPLETED',
    vatBreakdown: {
      vatableSales: 2232.14,
      vatAmount: 267.86,
      vatExempt: 0,
      zeroRated: 0
    }
  },
  {
    id: 'TXN-8803',
    orNo: 'VOU-2026-0412',
    type: 'DISBURSEMENT',
    clientName: 'Petty Cash Replenishment - Regional Deployment',
    subsystem: 'Fleet & Transport',
    amount: 4500.00,
    paymentMethod: 'Cash',
    referenceNo: 'PETTY-DEPLOY-09',
    timestamp: '01:30 PM',
    cashierName: 'Maria Santos',
    status: 'COMPLETED'
  },
  {
    id: 'TXN-8804',
    orNo: 'OR-2026-78403',
    type: 'COLLECTION',
    clientName: 'Primex Commercial Towers',
    subsystem: 'Facilities & Admin',
    amount: 42500.00,
    paymentMethod: 'Credit Card',
    referenceNo: 'VISA-AUTH-88102',
    timestamp: '11:50 AM',
    cashierName: 'Maria Santos',
    status: 'COMPLETED',
    vatBreakdown: {
      vatableSales: 37946.43,
      vatAmount: 4553.57,
      vatExempt: 0,
      zeroRated: 0
    }
  },
  {
    id: 'TXN-8805',
    orNo: 'OR-2026-78404',
    type: 'COLLECTION',
    clientName: 'Manila Country Club',
    subsystem: 'Fleet & Transport',
    amount: 25520.50,
    paymentMethod: 'QR Ph / E-Wallet',
    referenceNo: 'GCASH-TX-77382',
    timestamp: '10:40 AM',
    cashierName: 'Maria Santos',
    status: 'COMPLETED',
    vatBreakdown: {
      vatableSales: 22786.16,
      vatAmount: 2734.34,
      vatExempt: 0,
      zeroRated: 0
    }
  },
  {
    id: 'TXN-8806',
    orNo: 'OR-2026-78405',
    type: 'COLLECTION',
    clientName: 'Delta Security Services',
    subsystem: 'HRIS & Recruitment',
    amount: 46000.00,
    paymentMethod: 'Cash',
    referenceNo: 'CASH-T04-8806',
    timestamp: '09:15 AM',
    cashierName: 'Maria Santos',
    status: 'COMPLETED',
    vatBreakdown: {
      vatableSales: 41071.43,
      vatAmount: 4928.57,
      vatExempt: 0,
      zeroRated: 0
    }
  },
  {
    id: 'TXN-8807',
    orNo: 'VOU-2026-0411',
    type: 'DISBURSEMENT',
    clientName: 'Emergency Airfare Reimbursement - HR Deployment',
    subsystem: 'HRIS & Recruitment',
    amount: 3950.00,
    paymentMethod: 'Cash',
    referenceNo: 'VOU-HR-9921',
    timestamp: '08:45 AM',
    cashierName: 'Maria Santos',
    status: 'COMPLETED'
  }
]

export const HOURLY_COLLECTION_DATA = [
  { hour: '08:00 AM', cash: 4500, nonCash: 0, total: 4500 },
  { hour: '09:00 AM', cash: 46000, nonCash: 0, total: 46000 },
  { hour: '10:00 AM', cash: 0, nonCash: 25520, total: 25520 },
  { hour: '11:00 AM', cash: 0, nonCash: 42500, total: 42500 },
  { hour: '12:00 PM', cash: 1200, nonCash: 0, total: 1200 },
  { hour: '01:00 PM', cash: 0, nonCash: 0, total: 0 },
  { hour: '02:00 PM', cash: 2500, nonCash: 68400, total: 70900 },
  { hour: '03:00 PM', cash: 8500, nonCash: 12000, total: 20500 },
  { hour: '04:00 PM', cash: 0, nonCash: 0, total: 0 }
]

export const PAYMENT_METHOD_DISTRIBUTION = [
  { name: 'Bank Transfer', value: 68400, percentage: '37.0%', color: '#3b82f6' },
  { name: 'Cash', value: 48500, percentage: '26.2%', color: '#10b981' },
  { name: 'Credit Card', value: 42500, percentage: '23.0%', color: '#8b5cf6' },
  { name: 'QR Ph / E-Wallet', value: 25520, percentage: '13.8%', color: '#f59e0b' }
]

export const SUBSYSTEM_COLLECTION_DATA = [
  { name: 'Client Mgmt', amount: 68400, count: 1 },
  { name: 'HRIS & Recruit', amount: 48500, count: 2 },
  { name: 'Facilities & Admin', amount: 42500, count: 1 },
  { name: 'Fleet & Transport', amount: 25520, count: 1 },
  { name: 'Supply Chain', amount: 0, count: 0 }
]
