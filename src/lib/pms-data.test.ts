import { describe, expect, it } from "vitest"

import {
  cancelArPayment,
  createArInvoice,
  createArPayment,
  exportArReport,
  getArAgingReport,
  getArCustomers,
  getArDashboard,
  getArInvoice,
  getArInvoices,
  getArPayments,
} from "./pms-data"

describe("pms-data dashboard", () => {
  it("derives receivables and aging totals that reconcile", async () => {
    const { data } = await getArDashboard()

    expect(data.total_receivables).toBeGreaterThan(0)
    expect(data.total_outstanding).toBeGreaterThan(0)
    expect(data.open_invoices_count).toBeGreaterThan(0)
    expect(data.overdue_count).toBeGreaterThan(0)

    const { days_0_30, days_31_60, days_61_90, over_90 } = data.aging
    expect(days_0_30 + days_31_60 + days_61_90 + over_90).toBeCloseTo(data.total_outstanding, 2)
    expect(data.collected_receivables + data.total_outstanding).toBeCloseTo(
      data.total_receivables,
      2,
    )
    expect(data.collection_rate).toBeGreaterThanOrEqual(0)
    expect(data.collection_rate).toBeLessThanOrEqual(100)
  })
})

describe("pms-data aging report", () => {
  it("returns only outstanding invoices, ordered by age", async () => {
    const { data } = await getArAgingReport()

    expect(data.length).toBeGreaterThan(0)

    data.forEach((row) => {
      expect(row.balance_due).toBeGreaterThan(0)
      expect(["0-30", "31-60", "61-90", ">90"]).toContain(row.bucket)
    })

    const daysOverdue = data.map((row) => row.days_overdue)
    expect([...daysOverdue].sort((left, right) => right - left)).toEqual(daysOverdue)
  })
})

describe("pms-data invoice register", () => {
  it("paginates invoices", async () => {
    const page = await getArInvoices({ per_page: 10 })

    expect(page.data).toHaveLength(10)
    expect(page.meta.total).toBeGreaterThan(10)
    expect(page.meta.last_page).toBe(Math.ceil(page.meta.total / 10))
    expect(page.meta.from).toBe(1)
  })

  it("filters by outstanding balance and aging bucket", async () => {
    const outstanding = await getArInvoices({ outstanding: true, per_page: 100 })
    expect(outstanding.data.length).toBeGreaterThan(0)
    outstanding.data.forEach((invoice) => expect(invoice.balance_due).toBeGreaterThan(0))

    const overNinety = await getArInvoices({ bucket: ">90", per_page: 100 })
    expect(overNinety.data.length).toBeGreaterThan(0)
    overNinety.data.forEach((invoice) => expect(invoice.aging_bucket).toBe(">90"))
  })

  it("returns computed line items for a single invoice", async () => {
    const list = await getArInvoices({ per_page: 1 })
    const { data } = await getArInvoice(list.data[0].id)

    expect(data.line_items.length).toBeGreaterThan(0)
    data.line_items.forEach((item) => {
      expect(item.amount).toBeCloseTo(item.quantity * item.unit_price, 2)
    })
    expect(Array.isArray(data.payment_allocations)).toBe(true)
    expect(data.balance_due).toBeCloseTo(data.total_amount - sumAllocated(data.payment_allocations), 2)
  })

  it("rejects an unknown invoice", async () => {
    await expect(getArInvoice(-1)).rejects.toThrow(/not found/i)
  })
})

describe("pms-data customers and collections", () => {
  it("aggregates outstanding balances consistently with the invoice register", async () => {
    const customers = await getArCustomers({ per_page: 100 })
    const invoices = await getArInvoices({ per_page: 100 })

    expect(customers.data.length).toBeGreaterThan(0)

    const perCustomer = customers.data.reduce(
      (sum, customer) => sum + (customer.outstanding_balance ?? 0),
      0,
    )
    const perInvoice = invoices.data.reduce((sum, invoice) => sum + invoice.balance_due, 0)

    expect(perCustomer).toBeCloseTo(perInvoice, 2)
  })

  it("returns collections with their allocations", async () => {
    const { data } = await getArPayments({ per_page: 100 })

    expect(data.length).toBeGreaterThan(0)
    expect(data.some((payment) => (payment.allocations?.length ?? 0) > 0)).toBe(true)
    data.forEach((payment) => {
      expect(["completed", "cancelled"]).toContain(payment.status)
      expect(payment.reference_number).toMatch(/^RCPT-\d{4}-\d{4}$/)
    })
  })
})

describe("pms-data writes", () => {
  it("creates an invoice, records a payment, and restores balances on cancel", async () => {
    const before = await getArDashboard()

    const created = await createArInvoice({
      customer_id: 1,
      invoice_date: "2026-09-16",
      due_date: "2026-10-16",
      payment_terms: "net30",
      service: "Regression test billing",
      tax_amount: 0,
      line_items: [{ description: "Test line item", quantity: 1, unit_price: 1000 }],
    })

    expect(created.data.invoice_number).toMatch(/^INV-\d{4}-\d{4}$/)
    expect(created.data.total_amount).toBeCloseTo(1000, 2)
    expect(created.data.balance_due).toBeCloseTo(1000, 2)
    expect(created.data.status).toBe("issued")

    const afterCreate = await getArDashboard()
    expect(afterCreate.data.total_outstanding).toBeCloseTo(
      before.data.total_outstanding + 1000,
      2,
    )

    const payment = await createArPayment({
      customer_id: 1,
      payment_date: "2026-09-16",
      method: "cash",
      allocations: [{ ar_invoice_id: created.data.id, allocated_amount: 400 }],
    })

    expect(payment.data.total_amount).toBeCloseTo(400, 2)

    const partiallyPaid = await getArInvoice(created.data.id)
    expect(partiallyPaid.data.balance_due).toBeCloseTo(600, 2)
    expect(partiallyPaid.data.status).toBe("partially_paid")

    await cancelArPayment(payment.data.id)

    const restored = await getArInvoice(created.data.id)
    expect(restored.data.balance_due).toBeCloseTo(1000, 2)
    expect(restored.data.status).toBe("issued")
  })

  it("rejects an allocation larger than the invoice balance", async () => {
    const list = await getArInvoices({ outstanding: true, per_page: 1 })
    const invoice = list.data[0]

    if (!invoice.customer) {
      throw new Error("Expected the seeded invoice to have a customer.")
    }

    await expect(
      createArPayment({
        customer_id: invoice.customer.id,
        payment_date: "2026-09-16",
        method: "cash",
        allocations: [
          { ar_invoice_id: invoice.id, allocated_amount: invoice.balance_due + 1 },
        ],
      }),
    ).rejects.toThrow(/exceeds/i)
  })
})

describe("pms-data export", () => {
  it("builds an aging summary CSV from the local dataset", async () => {
    const { blob, filename } = await exportArReport({ report: "aging_summary" })

    expect(filename).toMatch(/^aging_summary-\d{4}-\d{2}-\d{2}\.csv$/)

    const text = await blob.text()
    expect(text).toContain("Bucket,Invoices,Outstanding")
    expect(text).toContain("Total")
  })

  it("builds overdue invoice and collection total CSVs", async () => {
    const overdue = await exportArReport({ report: "overdue_invoices" })
    expect(await overdue.blob.text()).toContain("Days Overdue")

    const collections = await exportArReport({ report: "collection_totals" })
    expect(await collections.blob.text()).toContain(
      "Reference,Customer,Payment Date,Method,Amount,Status",
    )
  })
})

function sumAllocated(allocations: { allocated_amount: number }[]): number {
  return Math.round(allocations.reduce((sum, item) => sum + item.allocated_amount, 0) * 100) / 100
}
