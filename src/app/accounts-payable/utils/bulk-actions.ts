import type { Task } from "../data/schema"

// ─── Action Types ─────────────────────────────────────────────────────────────

export type BulkActionType =
  | "approve"
  | "schedule"
  | "change-priority"
  | "assign-branch"
  | "export"

export interface BulkActionPayload {
  type: BulkActionType
  /** For change-priority */
  priority?: string
  /** For assign-branch */
  branch?: string
}

export interface BulkActionResult {
  changed: number
  skipped: number
  skippedReason?: string
}

// ─── Eligibility ──────────────────────────────────────────────────────────────

/** Returns the subset of invoices that are eligible for a given action */
export function getEligibleInvoices(
  invoices: Task[],
  action: BulkActionType
): Task[] {
  switch (action) {
    case "approve":
      return invoices.filter((inv) => inv.status === "pending-review")
    case "schedule":
      return invoices.filter((inv) => inv.status === "approved")
    case "change-priority":
      // All non-paid invoices
      return invoices.filter((inv) => inv.status !== "paid")
    case "assign-branch":
    case "export":
      return invoices
    default:
      return invoices
  }
}

/** Human-readable reason why an action is disabled for the selection */
export function getDisabledReason(
  selectedInvoices: Task[],
  action: BulkActionType
): string | null {
  if (selectedInvoices.length === 0) return "No invoices selected"

  switch (action) {
    case "approve": {
      const eligible = getEligibleInvoices(selectedInvoices, "approve")
      if (eligible.length === 0)
        return "None of the selected invoices are in Pending Review status"
      return null
    }
    case "schedule": {
      const eligible = getEligibleInvoices(selectedInvoices, "schedule")
      if (eligible.length === 0)
        return "None of the selected invoices are in Approved status"
      return null
    }
    case "change-priority": {
      const eligible = getEligibleInvoices(selectedInvoices, "change-priority")
      if (eligible.length === 0)
        return "Priority cannot be changed for paid invoices"
      return null
    }
    case "assign-branch":
    case "export":
      return null
    default:
      return null
  }
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Apply a bulk action to the full invoice list.
 * Returns a new array (immutable update) and a result summary.
 */
export function applyBulkAction(
  allInvoices: Task[],
  selectedIds: string[],
  payload: BulkActionPayload
): { updatedInvoices: Task[]; result: BulkActionResult } {
  const selectedSet = new Set(selectedIds)

  let changed = 0
  let skipped = 0

  const updatedInvoices = allInvoices.map((inv) => {
    if (!selectedSet.has(inv.id)) return inv

    switch (payload.type) {
      case "approve": {
        if (inv.status === "pending-review") {
          changed++
          return { ...inv, status: "approved" }
        }
        skipped++
        return inv
      }
      case "schedule": {
        if (inv.status === "approved") {
          changed++
          return { ...inv, status: "scheduled" }
        }
        skipped++
        return inv
      }
      case "change-priority": {
        if (inv.status !== "paid" && payload.priority) {
          changed++
          return { ...inv, priority: payload.priority }
        }
        skipped++
        return inv
      }
      case "assign-branch": {
        if (payload.branch) {
          changed++
          return { ...inv, branch: payload.branch }
        }
        skipped++
        return inv
      }
      default:
        return inv
    }
  })

  const skippedReason =
    skipped > 0
      ? payload.type === "approve"
        ? "not in Pending Review status"
        : payload.type === "schedule"
          ? "not in Approved status"
          : payload.type === "change-priority"
            ? "paid invoices cannot be changed"
            : undefined
      : undefined

  return { updatedInvoices, result: { changed, skipped, skippedReason } }
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

const money = (amount = 0) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    amount
  )

export function exportInvoicesCSV(invoices: Task[]): void {
  const headers = [
    "ID",
    "Vendor",
    "Description",
    "Amount (PHP)",
    "Due Date",
    "Status",
    "Priority",
    "Branch",
  ]

  const rows = invoices.map((inv) => [
    inv.id,
    inv.vendor ?? "",
    `"${(inv.title ?? "").replace(/"/g, '""')}"`,
    money(inv.amount),
    inv.dueDate ?? "",
    inv.status,
    inv.priority,
    inv.branch ?? "",
  ])

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join(
    "\n"
  )

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `ap-invoices-export-${new Date().toISOString().split("T")[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
