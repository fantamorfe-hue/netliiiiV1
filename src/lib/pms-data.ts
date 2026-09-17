import customersSeed from "@/data/pms-primepower/customers.json"
import invoicesSeed from "@/data/pms-primepower/invoices.json"
import paymentsSeed from "@/data/pms-primepower/payments.json"

/* -------------------------------------------------------------------------- */
/*  Public types — identical to the previous `@/lib/ar-api` contract so that   */
/*  existing consumers keep compiling without changes.                        */
/* -------------------------------------------------------------------------- */

export interface PaginationLinks {
  first: string | null
  last: string | null
  prev: string | null
  next: string | null
}

export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export interface Paginated<T> {
  data: T[]
  links: PaginationLinks
  meta: PaginationMeta
}

export interface Customer {
  id: number
  name: string
  code: string
  email: string | null
  phone: string | null
  address: string | null
  tin: string | null
  contact_person: string | null
  payment_terms: string | null
  credit_limit: number
  currency: string
  status: string
  outstanding_balance?: number
  invoices_count?: number
  created_at: string
  updated_at: string
}

export interface ArInvoice {
  id: number
  invoice_number: string
  customer?: Customer
  invoice_date: string
  due_date: string
  currency: string
  service: string | null
  subtotal: number
  tax_amount: number
  total_amount: number
  balance_due: number
  status: string
  display_status: string
  aging_bucket: string
  days_overdue: number
  payment_terms: string | null
  reference_so: string | null
  notes: string | null
  line_items_count?: number
  issued_at: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
}

export interface ArInvoiceLineItem {
  id: number
  description: string
  quantity: number
  unit_price: number
  amount: number
  account_code: string | null
  sort_order: number
}

export interface ArPaymentAllocation {
  id: number
  ar_invoice_id: number
  invoice_number?: string | null
  allocated_amount: number
}

export interface ArInvoiceDetail extends ArInvoice {
  line_items: ArInvoiceLineItem[]
  payment_allocations: ArPaymentAllocation[]
  issuer?: { id: number; name: string } | null
}

export interface ArPayment {
  id: number
  reference_number: string
  customer?: Customer
  payment_date: string
  method: string
  total_amount: number
  currency: string
  status: string
  notes: string | null
  creator?: { id: number; name: string } | null
  posted_at: string | null
  allocations?: ArPaymentAllocation[]
  created_at: string
}

export interface ArAgingRow {
  id: number
  invoice_number: string
  customer: string | null
  due_date: string | null
  balance_due: number
  days_overdue: number
  bucket: string
  priority: string
}

export interface ArAgingBuckets {
  days_0_30: number
  days_31_60: number
  days_61_90: number
  over_90: number
}

export interface ArDashboard {
  total_outstanding: number
  overdue_total: number
  overdue_count: number
  open_invoices_count: number
  total_receivables: number
  collected_receivables: number
  collection_rate: number
  billed_change_pct: number
  aging: ArAgingBuckets
}

export interface InvoiceFilters {
  search?: string
  status?: string
  customer_id?: number
  overdue?: boolean
  outstanding?: boolean
  bucket?: string
  from?: string
  to?: string
  page?: number
  per_page?: number
  sort_by?: string
  sort_dir?: "asc" | "desc"
}

export interface CustomerFilters {
  search?: string
  status?: string
  page?: number
  per_page?: number
}

export interface PaymentFilters {
  search?: string
  status?: string
  customer_id?: number
  page?: number
  per_page?: number
}

export interface CreatePaymentAllocation {
  ar_invoice_id: number
  allocated_amount: number
}

export interface CreatePaymentPayload {
  customer_id: number
  payment_date: string
  method: "bank_transfer" | "check" | "online" | "cash"
  currency?: string
  notes?: string
  allocations: CreatePaymentAllocation[]
}

export interface CreateInvoiceLineItem {
  description: string
  quantity: number
  unit_price: number
  account_code?: string
}

export interface CreateInvoicePayload {
  customer_id: number
  invoice_date: string
  due_date?: string
  payment_terms?: "net15" | "net30" | "net60" | "cod"
  currency?: string
  service?: string
  reference_so?: string
  notes?: string
  tax_amount?: number
  line_items: CreateInvoiceLineItem[]
}

export type ArReportScope = "aging_summary" | "overdue_invoices" | "collection_totals"

export interface ArReportFilters {
  report: ArReportScope
  search?: string
  status?: string
  customer_id?: number
  bucket?: string
  from?: string
  to?: string
}

/* -------------------------------------------------------------------------- */
/*  Seed record shapes (PMS PrimePower business model)                        */
/* -------------------------------------------------------------------------- */

type CustomerSeed = Omit<Customer, "outstanding_balance" | "invoices_count">

interface InvoiceLineItemSeed {
  description: string
  quantity: number
  unit_price: number
  account_code?: string | null
}

interface InvoiceSeed {
  id: number
  invoice_number: string
  customer_id: number
  invoice_date: string
  due_date: string
  currency: string
  service: string | null
  payment_terms: string | null
  reference_so: string | null
  notes: string | null
  tax_amount: number
  voided: boolean
  issued_at: string | null
  created_at: string
  updated_at: string
  issuer_name: string | null
  line_items: InvoiceLineItemSeed[]
}

interface AllocationSeed {
  ar_invoice_id: number
  allocated_amount: number
}

interface PaymentSeed {
  id: number
  reference_number: string
  customer_id: number
  payment_date: string
  method: string
  currency: string
  status: string
  notes: string | null
  creator_name: string | null
  posted_at: string | null
  created_at: string
  allocations: AllocationSeed[]
}

interface PmsStore {
  customers: CustomerSeed[]
  invoices: InvoiceSeed[]
  payments: PaymentSeed[]
}

interface DerivedInvoice {
  record: InvoiceSeed
  subtotal: number
  total: number
  allocated: number
  balance: number
  daysOverdue: number
  bucket: string
  status: string
  displayStatus: string
  paidAt: string | null
}

interface Snapshot {
  store: PmsStore
  derived: DerivedInvoice[]
  customers: Customer[]
  invoices: ArInvoice[]
  payments: ArPayment[]
  invoiceById: Map<number, ArInvoice>
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const STORAGE_KEY = "pms-primepower.ar.v1"

const CURRENCY = "PHP"

const CURRENT_USER_NAME = "M. Santos"

const PAYMENT_TERM_DAYS: Record<string, number> = { net15: 15, net30: 30, net60: 60, cod: 0 }

const AGING_BUCKETS = ["0-30", "31-60", "61-90", ">90"] as const

const DEFAULT_PER_PAGE = 10

/* -------------------------------------------------------------------------- */
/*  Date and number helpers                                                   */
/* -------------------------------------------------------------------------- */

const round2 = (value: number) => Math.round(value * 100) / 100

const todayIso = () => new Date().toISOString().slice(0, 10)

const toTime = (date: string) => new Date(`${date}T00:00:00Z`).getTime()

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

function daysPastDue(dueDate: string | null, reference: string): number {
  if (!dueDate) {
    return 0
  }
  const diff = Math.round((toTime(reference) - toTime(dueDate)) / 86_400_000)
  return diff > 0 ? diff : 0
}

function agingBucketFor(daysOverdue: number): string {
  if (daysOverdue <= 30) return "0-30"
  if (daysOverdue <= 60) return "31-60"
  if (daysOverdue <= 90) return "61-90"
  return ">90"
}

function priorityFor(daysOverdue: number): string {
  if (daysOverdue > 90) return "High"
  if (daysOverdue > 30) return "Medium"
  return "Low"
}

function nextId(records: { id: number }[]): number {
  return records.reduce((highest, record) => Math.max(highest, record.id), 0) + 1
}

function nextDocumentNumber(existing: string[], prefix: string, date: string): string {
  const year = date.slice(0, 4)
  const pattern = new RegExp(`^${prefix}-${year}-(\\d+)$`)
  const highest = existing.reduce((max, value) => {
    const match = pattern.exec(value)
    return match ? Math.max(max, Number(match[1])) : max
  }, 0)
  return `${prefix}-${year}-${String(highest + 1).padStart(4, "0")}`
}

/* -------------------------------------------------------------------------- */
/*  Local persistence store                                                   */
/* -------------------------------------------------------------------------- */

let store: PmsStore | null = null

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

function persistStore(): void {
  if (!store || !canUseStorage()) {
    return
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // Storage unavailable (private mode / quota) — the in-memory store still works.
  }
}

function seedStore(): PmsStore {
  return JSON.parse(
    JSON.stringify({ customers: customersSeed, invoices: invoicesSeed, payments: paymentsSeed }),
  ) as PmsStore
}

function getStore(): PmsStore {
  if (store) {
    return store
  }

  if (canUseStorage()) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        store = JSON.parse(raw) as PmsStore
        return store
      }
    } catch {
      // Corrupt payload — fall through and reseed.
    }
  }

  store = seedStore()
  persistStore()
  return store
}

/* -------------------------------------------------------------------------- */
/*  Derivation — invoices, customers and payments are all computed from the   */
/*  two source-of-truth collections (invoices + completed payment           */
/*  allocations) so totals can never drift apart.                           */
/* -------------------------------------------------------------------------- */

function allocationTotals(payments: PaymentSeed[]): Map<number, number> {
  const totals = new Map<number, number>()
  payments.forEach((payment) => {
    if (payment.status !== "completed") {
      return
    }
    payment.allocations.forEach((allocation) => {
      const current = totals.get(allocation.ar_invoice_id) ?? 0
      totals.set(allocation.ar_invoice_id, round2(current + allocation.allocated_amount))
    })
  })
  return totals
}

function latestPaymentDates(payments: PaymentSeed[]): Map<number, string> {
  const dates = new Map<number, string>()
  payments.forEach((payment) => {
    if (payment.status !== "completed") {
      return
    }
    payment.allocations.forEach((allocation) => {
      const current = dates.get(allocation.ar_invoice_id)
      if (!current || payment.payment_date > current) {
        dates.set(allocation.ar_invoice_id, payment.payment_date)
      }
    })
  })
  return dates
}

function deriveInvoices(invoices: InvoiceSeed[], payments: PaymentSeed[]): DerivedInvoice[] {
  const allocated = allocationTotals(payments)
  const paidDates = latestPaymentDates(payments)
  const reference = todayIso()

  return invoices.map((record) => {
    const subtotal = round2(
      record.line_items.reduce((sum, item) => sum + round2(item.quantity * item.unit_price), 0),
    )
    const total = round2(subtotal + record.tax_amount)
    const paid = round2(allocated.get(record.id) ?? 0)
    const balance = record.voided ? 0 : round2(Math.max(0, total - paid))
    const daysOverdue = balance > 0 ? daysPastDue(record.due_date, reference) : 0

    const status = record.voided
      ? "voided"
      : balance <= 0
        ? "paid"
        : paid > 0
          ? "partially_paid"
          : "issued"

    const displayStatus = record.voided
      ? "Voided"
      : balance <= 0
        ? "Collected"
        : daysOverdue > 90
          ? "Critical"
          : daysOverdue > 0
            ? "Overdue"
            : "Open"

    return {
      record,
      subtotal,
      total,
      allocated: paid,
      balance,
      daysOverdue,
      bucket: agingBucketFor(daysOverdue),
      status,
      displayStatus,
      paidAt: balance <= 0 && !record.voided ? (paidDates.get(record.id) ?? null) : null,
    }
  })
}

function buildCustomers(customers: CustomerSeed[], derived: DerivedInvoice[]): Customer[] {
  return customers.map((record) => {
    const owned = derived.filter((invoice) => invoice.record.customer_id === record.id)
    return {
      ...record,
      outstanding_balance: round2(owned.reduce((sum, invoice) => sum + invoice.balance, 0)),
      invoices_count: owned.length,
    }
  })
}

function toArInvoice(invoice: DerivedInvoice, customer: Customer | undefined): ArInvoice {
  const record = invoice.record
  return {
    id: record.id,
    invoice_number: record.invoice_number,
    customer,
    invoice_date: record.invoice_date,
    due_date: record.due_date,
    currency: record.currency,
    service: record.service,
    subtotal: invoice.subtotal,
    tax_amount: record.tax_amount,
    total_amount: invoice.total,
    balance_due: invoice.balance,
    status: invoice.status,
    display_status: invoice.displayStatus,
    aging_bucket: invoice.bucket,
    days_overdue: invoice.daysOverdue,
    payment_terms: record.payment_terms,
    reference_so: record.reference_so,
    notes: record.notes,
    line_items_count: record.line_items.length,
    issued_at: record.issued_at,
    paid_at: invoice.paidAt,
    created_at: record.created_at,
    updated_at: record.updated_at,
  }
}

function buildInvoices(derived: DerivedInvoice[], customers: Customer[]): ArInvoice[] {
  const byId = new Map(customers.map((customer) => [customer.id, customer]))
  return derived.map((invoice) => toArInvoice(invoice, byId.get(invoice.record.customer_id)))
}

function buildPayments(
  records: PaymentSeed[],
  customers: Customer[],
  invoiceById: Map<number, ArInvoice>,
): ArPayment[] {
  const customerById = new Map(customers.map((customer) => [customer.id, customer]))

  return records.map((record) => ({
    id: record.id,
    reference_number: record.reference_number,
    customer: customerById.get(record.customer_id),
    payment_date: record.payment_date,
    method: record.method,
    total_amount: round2(
      record.allocations.reduce((sum, allocation) => sum + allocation.allocated_amount, 0),
    ),
    currency: record.currency,
    status: record.status,
    notes: record.notes,
    creator: record.creator_name ? { id: 0, name: record.creator_name } : null,
    posted_at: record.posted_at,
    allocations: record.allocations.map((allocation, index) => ({
      id: record.id * 100 + index,
      ar_invoice_id: allocation.ar_invoice_id,
      invoice_number: invoiceById.get(allocation.ar_invoice_id)?.invoice_number ?? null,
      allocated_amount: allocation.allocated_amount,
    })),
    created_at: record.created_at,
  }))
}

function materialize(): Snapshot {
  const current = getStore()
  const derived = deriveInvoices(current.invoices, current.payments)
  const customers = buildCustomers(current.customers, derived)
  const invoices = buildInvoices(derived, customers)
  const invoiceById = new Map(invoices.map((invoice) => [invoice.id, invoice]))
  const payments = buildPayments(current.payments, customers, invoiceById)

  return { store: current, derived, customers, invoices, payments, invoiceById }
}

/* -------------------------------------------------------------------------- */
/*  Pagination, sorting and filtering                                         */
/* -------------------------------------------------------------------------- */

function paginate<T>(items: T[], page = 1, perPage = DEFAULT_PER_PAGE): Paginated<T> {
  const total = items.length
  const lastPage = Math.max(1, Math.ceil(total / perPage))
  const currentPage = Math.min(Math.max(1, page), lastPage)
  const start = (currentPage - 1) * perPage
  const data = items.slice(start, start + perPage)

  return {
    data,
    links: { first: null, last: null, prev: null, next: null },
    meta: {
      current_page: currentPage,
      last_page: lastPage,
      per_page: perPage,
      total,
      from: total === 0 ? null : start + 1,
      to: total === 0 ? null : start + data.length,
    },
  }
}

const invoiceSearchText = (invoice: ArInvoice) =>
  [invoice.invoice_number, invoice.customer?.name ?? "", invoice.service ?? ""].join(" ").toLowerCase()

const paymentSearchText = (payment: ArPayment) =>
  [payment.reference_number, payment.customer?.name ?? ""].join(" ").toLowerCase()

function sortInvoices(
  invoices: ArInvoice[],
  sortBy = "due_date",
  sortDir: "asc" | "desc" = "asc",
): ArInvoice[] {
  const direction = sortDir === "desc" ? -1 : 1

  return [...invoices].sort((left, right) => {
    switch (sortBy) {
      case "invoice_number":
        return left.invoice_number.localeCompare(right.invoice_number) * direction
      case "balance_due":
        return (left.balance_due - right.balance_due) * direction
      case "status":
        return left.status.localeCompare(right.status) * direction
      case "due_date":
      default:
        return left.due_date.localeCompare(right.due_date) * direction
    }
  })
}

/* -------------------------------------------------------------------------- */
/*  Read API                                                                  */
/* -------------------------------------------------------------------------- */

export function getArDashboard(): Promise<{ data: ArDashboard }> {
  const { derived } = materialize()
  const live = derived.filter((invoice) => !invoice.record.voided)

  const totalReceivables = round2(live.reduce((sum, invoice) => sum + invoice.total, 0))
  const totalOutstanding = round2(live.reduce((sum, invoice) => sum + invoice.balance, 0))
  const collected = round2(totalReceivables - totalOutstanding)
  const overdue = live.filter((invoice) => invoice.daysOverdue > 0 && invoice.balance > 0)

  const aging: ArAgingBuckets = { days_0_30: 0, days_31_60: 0, days_61_90: 0, over_90: 0 }

  live.forEach((invoice) => {
    if (invoice.balance <= 0) {
      return
    }
    if (invoice.bucket === "0-30") aging.days_0_30 = round2(aging.days_0_30 + invoice.balance)
    else if (invoice.bucket === "31-60") aging.days_31_60 = round2(aging.days_31_60 + invoice.balance)
    else if (invoice.bucket === "61-90") aging.days_61_90 = round2(aging.days_61_90 + invoice.balance)
    else aging.over_90 = round2(aging.over_90 + invoice.balance)
  })

  return Promise.resolve({
    data: {
      total_outstanding: totalOutstanding,
      overdue_total: round2(overdue.reduce((sum, invoice) => sum + invoice.balance, 0)),
      overdue_count: overdue.length,
      open_invoices_count: live.filter((invoice) => invoice.balance > 0).length,
      total_receivables: totalReceivables,
      collected_receivables: collected,
      collection_rate: totalReceivables > 0 ? Math.round((collected / totalReceivables) * 100) : 0,
      billed_change_pct: billedChangePct(live),
      aging,
    },
  })
}

function billedChangePct(live: DerivedInvoice[]): number {
  const currentMonth = todayIso().slice(0, 7)
  const [year, month] = currentMonth.split("-").map(Number)
  const previousMonth = new Date(Date.UTC(year, month - 2, 1)).toISOString().slice(0, 7)

  const billedIn = (prefix: string) =>
    round2(
      live
        .filter((invoice) => invoice.record.invoice_date.startsWith(prefix))
        .reduce((sum, invoice) => sum + invoice.total, 0),
    )

  const current = billedIn(currentMonth)
  const previous = billedIn(previousMonth)

  if (previous <= 0) {
    return current > 0 ? 100 : 0
  }
  return Math.round(((current - previous) / previous) * 1000) / 10
}

export function getArAgingReport(): Promise<{ data: ArAgingRow[] }> {
  const { derived, invoiceById } = materialize()

  const rows = derived
    .filter((invoice) => !invoice.record.voided && invoice.balance > 0)
    .map<ArAgingRow>((invoice) => ({
      id: invoice.record.id,
      invoice_number: invoice.record.invoice_number,
      customer: invoiceById.get(invoice.record.id)?.customer?.name ?? null,
      due_date: invoice.record.due_date,
      balance_due: invoice.balance,
      days_overdue: invoice.daysOverdue,
      bucket: invoice.bucket,
      priority: priorityFor(invoice.daysOverdue),
    }))
    .sort((left, right) => right.days_overdue - left.days_overdue)

  return Promise.resolve({ data: rows })
}

export function getArCustomers(filters: CustomerFilters = {}): Promise<Paginated<Customer>> {
  const { customers } = materialize()
  const search = filters.search?.trim().toLowerCase() ?? ""

  const rows = customers
    .filter((customer) => {
      const matchesSearch =
        !search ||
        customer.name.toLowerCase().includes(search) ||
        customer.code.toLowerCase().includes(search)
      const matchesStatus = !filters.status || customer.status === filters.status
      return matchesSearch && matchesStatus
    })
    .sort((left, right) => left.name.localeCompare(right.name))

  return Promise.resolve(paginate(rows, filters.page, filters.per_page ?? DEFAULT_PER_PAGE))
}

export function getArInvoices(filters: InvoiceFilters = {}): Promise<Paginated<ArInvoice>> {
  const { invoices } = materialize()
  const search = filters.search?.trim().toLowerCase() ?? ""

  const rows = invoices.filter((invoice) => {
    if (search && !invoiceSearchText(invoice).includes(search)) return false
    if (filters.status && invoice.status !== filters.status) return false
    if (filters.customer_id && invoice.customer?.id !== filters.customer_id) return false
    if (filters.overdue && invoice.days_overdue <= 0) return false
    if (filters.outstanding && invoice.balance_due <= 0) return false
    if (filters.bucket && !(invoice.balance_due > 0 && invoice.aging_bucket === filters.bucket)) {
      return false
    }
    if (filters.from && invoice.invoice_date < filters.from) return false
    if (filters.to && invoice.invoice_date > filters.to) return false
    return true
  })

  const sorted = sortInvoices(rows, filters.sort_by, filters.sort_dir)
  return Promise.resolve(paginate(sorted, filters.page, filters.per_page ?? DEFAULT_PER_PAGE))
}

export function getArInvoice(id: number): Promise<{ data: ArInvoiceDetail }> {
  const { invoices, store } = materialize()
  const invoice = invoices.find((candidate) => candidate.id === id)

  if (!invoice) {
    return Promise.reject(new Error(`Invoice ${id} was not found.`))
  }

  const record = store.invoices.find((candidate) => candidate.id === id)

  const lineItems: ArInvoiceLineItem[] = (record?.line_items ?? []).map((item, index) => ({
    id: id * 100 + index + 1,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    amount: round2(item.quantity * item.unit_price),
    account_code: item.account_code ?? null,
    sort_order: index,
  }))

  const paymentAllocations: ArPaymentAllocation[] = store.payments
    .filter((payment) => payment.status === "completed")
    .flatMap((payment) =>
      payment.allocations
        .filter((allocation) => allocation.ar_invoice_id === id)
        .map((allocation, index) => ({
          id: payment.id * 100 + index,
          ar_invoice_id: id,
          invoice_number: invoice.invoice_number,
          allocated_amount: allocation.allocated_amount,
        })),
    )

  return Promise.resolve({
    data: {
      ...invoice,
      line_items: lineItems,
      payment_allocations: paymentAllocations,
      issuer: record?.issuer_name ? { id: 0, name: record.issuer_name } : null,
    },
  })
}

export function getArPayments(filters: PaymentFilters = {}): Promise<Paginated<ArPayment>> {
  const { payments } = materialize()
  const search = filters.search?.trim().toLowerCase() ?? ""

  const rows = payments
    .filter((payment) => {
      if (search && !paymentSearchText(payment).includes(search)) return false
      if (filters.status && payment.status !== filters.status) return false
      if (filters.customer_id && payment.customer?.id !== filters.customer_id) return false
      return true
    })
    .sort((left, right) => right.payment_date.localeCompare(left.payment_date) || right.id - left.id)

  return Promise.resolve(paginate(rows, filters.page, filters.per_page ?? DEFAULT_PER_PAGE))
}

export function getArPayment(id: number): Promise<{ data: ArPayment }> {
  const { payments } = materialize()
  const payment = payments.find((candidate) => candidate.id === id)

  if (!payment) {
    return Promise.reject(new Error(`Collection ${id} was not found.`))
  }

  return Promise.resolve({ data: payment })
}

/* -------------------------------------------------------------------------- */
/*  Write API (persisted to localStorage)                                     */
/* -------------------------------------------------------------------------- */

export function createArInvoice(payload: CreateInvoicePayload): Promise<{ data: ArInvoice }> {
  const current = getStore()
  const customer = current.customers.find((record) => record.id === payload.customer_id)

  if (!customer) {
    return Promise.reject(new Error("Select a valid customer before creating the invoice."))
  }

  const lineItems = payload.line_items ?? []
  if (lineItems.length === 0) {
    return Promise.reject(new Error("At least one line item is required."))
  }

  const invalid = lineItems.find(
    (item) => !item.description?.trim() || item.quantity <= 0 || item.unit_price < 0,
  )
  if (invalid) {
    return Promise.reject(
      new Error("Every line item needs a description, a quantity above zero, and a non-negative price."),
    )
  }

  const invoiceDate = payload.invoice_date || todayIso()
  const terms = payload.payment_terms ?? "net30"
  const dueDate = payload.due_date || addDays(invoiceDate, PAYMENT_TERM_DAYS[terms] ?? 30)

  const record: InvoiceSeed = {
    id: nextId(current.invoices),
    invoice_number: nextDocumentNumber(
      current.invoices.map((invoice) => invoice.invoice_number),
      "INV",
      invoiceDate,
    ),
    customer_id: payload.customer_id,
    invoice_date: invoiceDate,
    due_date: dueDate,
    currency: payload.currency ?? customer.currency ?? CURRENCY,
    service: payload.service?.trim() || lineItems[0].description.trim(),
    payment_terms: terms,
    reference_so: payload.reference_so?.trim() || null,
    notes: payload.notes?.trim() || null,
    tax_amount: round2(payload.tax_amount ?? 0),
    voided: false,
    issued_at: invoiceDate,
    created_at: invoiceDate,
    updated_at: invoiceDate,
    issuer_name: CURRENT_USER_NAME,
    line_items: lineItems.map((item) => ({
      description: item.description.trim(),
      quantity: item.quantity,
      unit_price: item.unit_price,
      account_code: item.account_code ?? null,
    })),
  }

  current.invoices.push(record)
  persistStore()

  const { invoiceById } = materialize()
  const created = invoiceById.get(record.id)

  if (!created) {
    return Promise.reject(new Error("Unable to create the invoice."))
  }

  return Promise.resolve({ data: created })
}

export function createArPayment(payload: CreatePaymentPayload): Promise<{ data: ArPayment }> {
  const current = getStore()
  const customer = current.customers.find((record) => record.id === payload.customer_id)

  if (!customer) {
    return Promise.reject(new Error("Select a valid customer before recording a payment."))
  }

  const allocations = (payload.allocations ?? []).filter(
    (allocation) => allocation.allocated_amount > 0,
  )
  if (allocations.length === 0) {
    return Promise.reject(new Error("Enter an amount for at least one invoice."))
  }

  const { invoiceById } = materialize()

  for (const allocation of allocations) {
    const invoice = invoiceById.get(allocation.ar_invoice_id)
    if (!invoice) {
      return Promise.reject(new Error(`Invoice ${allocation.ar_invoice_id} was not found.`))
    }
    if (invoice.status === "voided") {
      return Promise.reject(
        new Error(`Invoice ${invoice.invoice_number} is voided and cannot receive a payment.`),
      )
    }
    if (round2(allocation.allocated_amount) > round2(invoice.balance_due)) {
      return Promise.reject(
        new Error(
          `Allocation for ${invoice.invoice_number} exceeds its ${invoice.balance_due} balance.`,
        ),
      )
    }
  }

  const paymentDate = payload.payment_date || todayIso()

  const record: PaymentSeed = {
    id: nextId(current.payments),
    reference_number: nextDocumentNumber(
      current.payments.map((payment) => payment.reference_number),
      "RCPT",
      paymentDate,
    ),
    customer_id: payload.customer_id,
    payment_date: paymentDate,
    method: payload.method,
    currency: payload.currency ?? customer.currency ?? CURRENCY,
    status: "completed",
    notes: payload.notes?.trim() || null,
    creator_name: CURRENT_USER_NAME,
    posted_at: paymentDate,
    created_at: paymentDate,
    allocations: allocations.map((allocation) => ({
      ar_invoice_id: allocation.ar_invoice_id,
      allocated_amount: round2(allocation.allocated_amount),
    })),
  }

  current.payments.push(record)
  persistStore()

  const { payments } = materialize()
  const created = payments.find((payment) => payment.id === record.id)

  if (!created) {
    return Promise.reject(new Error("Unable to record the payment."))
  }

  return Promise.resolve({ data: created })
}

export function cancelArPayment(id: number): Promise<{ message: string }> {
  const current = getStore()
  const payment = current.payments.find((record) => record.id === id)

  if (!payment) {
    return Promise.reject(new Error(`Collection ${id} was not found.`))
  }
  if (payment.status === "cancelled") {
    return Promise.reject(new Error(`Collection ${payment.reference_number} is already cancelled.`))
  }

  payment.status = "cancelled"
  payment.posted_at = null
  persistStore()

  return Promise.resolve({ message: `Collection ${payment.reference_number} cancelled.` })
}

/* -------------------------------------------------------------------------- */
/*  CSV export (generated in-browser from the local dataset)                  */
/* -------------------------------------------------------------------------- */

function csvCell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value)
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function filterForReport(invoices: ArInvoice[], filters: ArReportFilters): ArInvoice[] {
  const search = filters.search?.trim().toLowerCase() ?? ""

  return invoices.filter((invoice) => {
    if (search && !invoiceSearchText(invoice).includes(search)) return false
    if (filters.status && invoice.status !== filters.status) return false
    if (filters.customer_id && invoice.customer?.id !== filters.customer_id) return false
    if (filters.bucket && invoice.aging_bucket !== filters.bucket) return false
    if (filters.from && invoice.invoice_date < filters.from) return false
    if (filters.to && invoice.invoice_date > filters.to) return false
    return true
  })
}

function buildReportRows(
  filters: ArReportFilters,
  invoices: ArInvoice[],
  payments: ArPayment[],
): (string | number)[][] {
  if (filters.report === "collection_totals") {
    const search = filters.search?.trim().toLowerCase() ?? ""
    const rows = payments
      .filter((payment) => {
        if (search && !paymentSearchText(payment).includes(search)) return false
        if (filters.status && payment.status !== filters.status) return false
        if (filters.from && payment.payment_date < filters.from) return false
        if (filters.to && payment.payment_date > filters.to) return false
        return true
      })
      .sort((left, right) => left.payment_date.localeCompare(right.payment_date))

    return [
      ["Reference", "Customer", "Payment Date", "Method", "Amount", "Status"],
      ...rows.map((payment) => [
        payment.reference_number,
        payment.customer?.name ?? "",
        payment.payment_date,
        payment.method,
        payment.total_amount,
        payment.status,
      ]),
    ]
  }

  const outstanding = filterForReport(invoices, filters).filter(
    (invoice) => invoice.balance_due > 0 && invoice.status !== "voided",
  )

  if (filters.report === "overdue_invoices") {
    const rows = outstanding
      .filter((invoice) => invoice.days_overdue > 0)
      .sort((left, right) => right.days_overdue - left.days_overdue)

    return [
      ["Invoice", "Customer", "Due Date", "Days Overdue", "Balance Due"],
      ...rows.map((invoice) => [
        invoice.invoice_number,
        invoice.customer?.name ?? "",
        invoice.due_date,
        invoice.days_overdue,
        invoice.balance_due,
      ]),
    ]
  }

  const rows: (string | number)[][] = AGING_BUCKETS.map((bucket) => {
    const inBucket = outstanding.filter((invoice) => invoice.aging_bucket === bucket)
    return [
      bucket,
      inBucket.length,
      round2(inBucket.reduce((sum, invoice) => sum + invoice.balance_due, 0)),
    ]
  })

  rows.push([
    "Total",
    outstanding.length,
    round2(outstanding.reduce((sum, invoice) => sum + invoice.balance_due, 0)),
  ])

  return [["Bucket", "Invoices", "Outstanding"], ...rows]
}

export function exportArReport(
  filters: ArReportFilters,
): Promise<{ blob: Blob; filename: string }> {
  const { invoices, payments } = materialize()
  const csv = buildReportRows(filters, invoices, payments)
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n")

  return Promise.resolve({
    blob: new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }),
    filename: `${filters.report}-${todayIso()}.csv`,
  })
}
