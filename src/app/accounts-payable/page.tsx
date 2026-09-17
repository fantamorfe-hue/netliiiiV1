"use client"

import { useState } from "react"
import { z } from "zod"
import { toast } from "sonner"

import { BaseLayout } from "@/components/layouts/base-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Toaster } from "@/components/ui/sonner"
import { columns } from "./components/columns"
import { DataTable } from "./components/data-table"
import { taskSchema } from "./data/schema"
import tasksData from "./data/tasks.json"
import { applyBulkAction } from "./utils/bulk-actions"
import type { BulkActionPayload } from "./utils/bulk-actions"
import { branches } from "./data/data"

const money = (amount = 0) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    amount
  )

// Validate data to ensure it matches schema — preserved as immutable initial source
const tasks = z.array(taskSchema).parse(tasksData)

export default function AccountsPayablePage() {
  // Lift invoice data into state so bulk actions can mutate it and KPIs recalculate
  const [invoices, setInvoices] = useState(tasks)

  // ─── KPIs (live, recalculate from invoices state) ──────────────────────────
  const totalOutstanding = invoices
    .filter((t) => t.status !== "paid")
    .reduce((sum, t) => sum + (t.amount || 0), 0)

  const overdueTotal = invoices
    .filter((t) => t.status === "pending-review" && t.priority === "urgent")
    .reduce((sum, t) => sum + (t.amount || 0), 0)

  const overdueCount = invoices.filter(
    (t) => t.status === "pending-review" && t.priority === "urgent"
  ).length

  const myApprovals = invoices.filter((t) => t.status === "pending-review").length

  const scheduledTotal = invoices
    .filter((t) => t.status === "scheduled")
    .reduce((sum, t) => sum + (t.amount || 0), 0)

  // ─── Bulk action handler ────────────────────────────────────────────────────
  const handleBulkAction = (payload: BulkActionPayload, selectedIds: string[]) => {
    if (payload.type === "export") return // export is handled client-side in the bar

    const { updatedInvoices, result } = applyBulkAction(
      invoices,
      selectedIds,
      payload
    )

    setInvoices(updatedInvoices)

    // Build human-readable action label
    const actionLabel =
      payload.type === "approve"
        ? "approved"
        : payload.type === "schedule"
          ? "scheduled for payment"
          : payload.type === "change-priority"
            ? `set to ${payload.priority} priority`
            : payload.type === "assign-branch"
              ? `assigned to ${branches.find((b) => b.value === payload.branch)?.label ?? payload.branch}`
              : payload.type

    // Toast feedback
    if (result.changed > 0 && result.skipped === 0) {
      toast.success(
        `${result.changed} invoice${result.changed !== 1 ? "s" : ""} ${actionLabel}.`
      )
    } else if (result.changed > 0 && result.skipped > 0) {
      toast.success(
        `${result.changed} invoice${result.changed !== 1 ? "s" : ""} ${actionLabel}.`,
        {
          description: `${result.skipped} invoice${result.skipped !== 1 ? "s" : ""} skipped — ${result.skippedReason ?? "ineligible status"}.`,
        }
      )
    } else {
      toast.warning(
        `No invoices were changed — all ${selectedIds.length} selected were ineligible.`
      )
    }
  }

  return (
    <BaseLayout
      title="Accounts Payable"
      description="Live invoices, approvals, vendors, attachments, and payment status."
    >
      <div className="space-y-6 px-4 lg:px-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding (PHP)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{money(totalOutstanding)}</div>
              <p className="text-xs text-muted-foreground">+20.1% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue / Critical</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {money(overdueTotal)}
              </div>
              <p className="text-xs text-muted-foreground">
                {overdueCount} critical invoices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled for Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{money(scheduledTotal)}</div>
              <p className="text-xs text-muted-foreground">Next payment run: Friday</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Awaiting Approval</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myApprovals}</div>
              <p className="text-xs text-muted-foreground">Require your attention</p>
            </CardContent>
          </Card>
        </section>

        <Tabs defaultValue="tasks" className="space-y-4">
          <TabsList className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <TabsTrigger value="tasks">AP Task &amp; Workflow Hub</TabsTrigger>
            <TabsTrigger value="vouchers">Vouchers &amp; Invoices Registry</TabsTrigger>
            <TabsTrigger value="vendors">Accredited Vendors Directory</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <DataTable
                  data={invoices}
                  columns={columns}
                  onBulkAction={handleBulkAction}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vouchers">
            <Card>
              <CardHeader>
                <CardTitle>Vouchers &amp; Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Detailed list of vendor billings (Makati HQ, Cebu Regional, Davao
                  Site, etc.).
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vendors">
            <Card>
              <CardHeader>
                <CardTitle>Accredited Vendors</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Profile cards/table with accreditation status, contact info, bank
                  details, and BIR 2303 registration.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Toaster position="bottom-right" />
    </BaseLayout>
  )
}
