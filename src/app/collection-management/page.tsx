"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  Activity, FileText, CreditCard, Bell, ReceiptText, Landmark, Users,
  TrendingUp, AlertTriangle, Clock, Wallet
} from "lucide-react"

import { BaseLayout } from "@/components/layouts/base-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Toaster } from "@/components/ui/sonner"

import { CollectionDashboard } from "./components/collection-dashboard"
import { InvoiceManagement } from "./components/invoice-management"
import { PaymentApplication } from "./components/payment-application"
import { DunningCollections } from "./components/dunning-collections"
import { CreditNotes } from "./components/credit-notes"
import { BankDeposits } from "./components/bank-deposits"
import { CustomerLedger } from "./components/customer-ledger"

import {
  initialCollectionBankAccounts,
  initialCustomerAccounts,
  initialInvoices,
  initialPaymentReceipts,
  initialCreditNotes,
  initialDunningActivities,
  initialPromisesToPay,
  initialBankDeposits,
  type CustomerAccount,
  type CollectionInvoice,
  type PaymentReceipt,
  type CreditNote,
  type DunningActivity,
  type PromiseToPay,
  type BankDeposit,
  type CollectionBankAccount,
} from "./data/mock-data"

const formatPHP = (val: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(val)

export default function CollectionManagementPage() {
  const [bankAccounts, setBankAccounts] = React.useState<CollectionBankAccount[]>(initialCollectionBankAccounts)
  const [customers, setCustomers] = React.useState<CustomerAccount[]>(initialCustomerAccounts)
  const [invoices, setInvoices] = React.useState<CollectionInvoice[]>(initialInvoices)
  const [receipts, setReceipts] = React.useState<PaymentReceipt[]>(initialPaymentReceipts)
  const [creditNotes, setCreditNotes] = React.useState<CreditNote[]>(initialCreditNotes)
  const [dunningActivities, setDunningActivities] = React.useState<DunningActivity[]>(initialDunningActivities)
  const [promisesToPay, setPromisesToPay] = React.useState<PromiseToPay[]>(initialPromisesToPay)
  const [deposits, setDeposits] = React.useState<BankDeposit[]>(initialBankDeposits)

  const todayStr = React.useMemo(() => new Date().toISOString().split("T")[0], [])

  // ── Top Metrics ──────────────────────────────────────────────────────────────
  const topMetrics = React.useMemo(() => {
    const totalOutstanding = invoices.filter(i => i.status !== "paid" && i.status !== "void").reduce((s, i) => s + i.balanceAmount, 0)
    const totalOverdue = invoices.filter(i => i.status === "overdue").reduce((s, i) => s + i.balanceAmount, 0)
    const collectedThisMonth = receipts.filter(r => r.status === "cleared" && r.datePaid.startsWith("2026-07")).reduce((s, r) => s + r.amountReceived, 0)
    const pendingPtp = promisesToPay.filter(p => p.status === "pending").reduce((s, p) => s + p.promisedAmount, 0)
    return { totalOutstanding, totalOverdue, collectedThisMonth, pendingPtp }
  }, [invoices, receipts, promisesToPay])

  // ── Invoice Actions ──────────────────────────────────────────────────────────
  const handleIssueInvoice = (data: Omit<CollectionInvoice, "id" | "invoiceNo" | "paidAmount" | "balanceAmount" | "status" | "agingBucket" | "dunningStage">) => {
    const id = `inv-${Math.floor(Math.random() * 90000 + 10000)}`
    const invNo = `INV-2026-0${Math.floor(Math.random() * 900 + 100)}`
    const today = new Date()
    const due = new Date(data.dueDate)
    const diffDays = Math.ceil((today.getTime() - due.getTime()) / 86400000)
    const agingBucket: CollectionInvoice["agingBucket"] =
      diffDays <= 0 ? "current" : diffDays <= 30 ? "1-30" : diffDays <= 60 ? "31-60" : diffDays <= 90 ? "61-90" : "over_90"

    const newInvoice: CollectionInvoice = {
      ...data, id, invoiceNo: invNo,
      paidAmount: 0, balanceAmount: data.totalAmount,
      status: "issued", agingBucket, dunningStage: "none",
    }
    setInvoices(prev => [newInvoice, ...prev])

    // Update customer balance
    setCustomers(prev => prev.map(c =>
      c.id === data.customerId ? { ...c, currentBalance: c.currentBalance + data.totalAmount } : c
    ))
    toast.success(`Invoice ${invNo} issued to ${data.clientName}.`)
  }

  const handleVoidInvoice = (id: string) => {
    const inv = invoices.find(i => i.id === id)
    if (!inv) return
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: "void" as const } : i))
    setCustomers(prev => prev.map(c =>
      c.id === inv.customerId ? { ...c, currentBalance: Math.max(0, c.currentBalance - inv.balanceAmount) } : c
    ))
    toast.warning(`Invoice ${inv.invoiceNo} voided.`)
  }

  const handleMarkDisputed = (id: string) => {
    const inv = invoices.find(i => i.id === id)
    if (!inv) return
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: "disputed" as const } : i))
    toast.info(`Invoice ${inv?.invoiceNo} marked as disputed.`)
  }

  // ── Payment Actions ──────────────────────────────────────────────────────────
  const handleApplyPayment = (data: Omit<PaymentReceipt, "id" | "receiptNo" | "status">) => {
    const id = `rec-${Math.floor(Math.random() * 9000 + 1000)}`
    const receiptNo = `OR-2026-${Math.floor(Math.random() * 9000 + 1000)}`

    const isInstant = ["Cash", "Bank Transfer", "Online"].includes(data.paymentMethod)
    const newReceipt: PaymentReceipt = {
      ...data, id, receiptNo,
      status: isInstant ? "cleared" : "pending",
    }
    setReceipts(prev => [newReceipt, ...prev])

    if (isInstant) {
      // Apply to each invoice
      const amount = data.amountReceived
      let remaining = amount
      setInvoices(prev => prev.map(inv => {
        if (!data.invoiceIds.includes(inv.id) || remaining <= 0) return inv
        const payment = Math.min(remaining, inv.balanceAmount)
        remaining -= payment
        const newPaid = inv.paidAmount + payment
        const newBalance = inv.totalAmount - newPaid
        return {
          ...inv,
          paidAmount: newPaid,
          balanceAmount: newBalance,
          status: newBalance <= 0 ? "paid" as const : "partially_paid" as const,
        }
      }))

      // Update customer balance
      setCustomers(prev => prev.map(c =>
        c.id === data.customerId
          ? { ...c, currentBalance: Math.max(0, c.currentBalance - amount), lastPaymentDate: todayStr, lastPaymentAmount: amount }
          : c
      ))

      // Credit to bank account
      setBankAccounts(prev => prev.map(b =>
        b.id === data.bankAccountId ? { ...b, balance: b.balance + amount } : b
      ))
    } else {
      // PDC or Check — mark as pending deposit
      setBankAccounts(prev => prev.map(b =>
        b.id === data.bankAccountId ? { ...b, pendingDeposits: b.pendingDeposits + data.amountReceived } : b
      ))
    }

    toast.success(`Receipt ${receiptNo} recorded. ${isInstant ? "Payment cleared immediately." : "Pending deposit confirmation."}`)
  }

  const handleBounceReceipt = (id: string) => {
    const rec = receipts.find(r => r.id === id)
    if (!rec) return
    setReceipts(prev => prev.map(r => r.id === id ? { ...r, status: "bounced" as const } : r))
    // Reverse bank pending deposit
    setBankAccounts(prev => prev.map(b =>
      b.id === rec.bankAccountId ? { ...b, pendingDeposits: Math.max(0, b.pendingDeposits - rec.amountReceived) } : b
    ))
    toast.error(`Receipt ${rec.receiptNo} marked as bounced. Customer notified.`)
  }

  const handleClearReceipt = (id: string) => {
    const rec = receipts.find(r => r.id === id)
    if (!rec) return
    setReceipts(prev => prev.map(r => r.id === id ? { ...r, status: "cleared" as const, bankDepositDate: todayStr } : r))

    // Apply to invoices
    let remaining = rec.amountReceived
    setInvoices(prev => prev.map(inv => {
      if (!rec.invoiceIds.includes(inv.id) || remaining <= 0) return inv
      const payment = Math.min(remaining, inv.balanceAmount)
      remaining -= payment
      const newPaid = inv.paidAmount + payment
      const newBalance = inv.totalAmount - newPaid
      return { ...inv, paidAmount: newPaid, balanceAmount: newBalance, status: newBalance <= 0 ? "paid" as const : "partially_paid" as const }
    }))

    // Move from pending to balance
    setBankAccounts(prev => prev.map(b =>
      b.id === rec.bankAccountId
        ? { ...b, balance: b.balance + rec.amountReceived, pendingDeposits: Math.max(0, b.pendingDeposits - rec.amountReceived) }
        : b
    ))

    // Update customer
    setCustomers(prev => prev.map(c =>
      c.id === rec.customerId
        ? { ...c, currentBalance: Math.max(0, c.currentBalance - rec.amountReceived), lastPaymentDate: todayStr, lastPaymentAmount: rec.amountReceived }
        : c
    ))
    toast.success(`Receipt ${rec.receiptNo} cleared and applied to customer ledger.`)
  }

  // ── Credit Note Actions ───────────────────────────────────────────────────────
  const handleCreateCreditNote = (data: Omit<CreditNote, "id" | "creditNoteNo" | "status">) => {
    const id = `cn-${Math.floor(Math.random() * 9000 + 1000)}`
    const creditNoteNo = `CN-2026-${Math.floor(Math.random() * 9000 + 1000)}`
    const newCN: CreditNote = { ...data, id, creditNoteNo, status: "draft" }
    setCreditNotes(prev => [newCN, ...prev])
    toast.success(`Credit note ${creditNoteNo} drafted.`)
  }

  const handleApplyCreditNote = (cnId: string, invoiceId: string) => {
    const cn = creditNotes.find(c => c.id === cnId)
    const inv = invoices.find(i => i.id === invoiceId)
    if (!cn || !inv) return

    setCreditNotes(prev => prev.map(c => c.id === cnId ? { ...c, status: "applied" as const, appliedToInvoiceId: invoiceId } : c))
    const creditApplied = Math.min(cn.amount, inv.balanceAmount)
    const newBalance = inv.balanceAmount - creditApplied
    setInvoices(prev => prev.map(i =>
      i.id === invoiceId ? {
        ...i,
        paidAmount: i.paidAmount + creditApplied,
        balanceAmount: newBalance,
        status: newBalance <= 0 ? "paid" as const : "partially_paid" as const,
      } : i
    ))
    setCustomers(prev => prev.map(c => c.id === cn.customerId ? { ...c, currentBalance: Math.max(0, c.currentBalance - creditApplied) } : c))
    toast.success(`Credit note applied. ${formatPHP(creditApplied)} deducted from ${inv.invoiceNo}.`)
  }

  const handleVoidCreditNote = (cnId: string) => {
    setCreditNotes(prev => prev.map(c => c.id === cnId ? { ...c, status: "voided" as const } : c))
    toast.warning("Credit note voided.")
  }

  // ── Dunning Actions ───────────────────────────────────────────────────────────
  const handleAddDunning = (data: Omit<DunningActivity, "id">) => {
    const id = `dun-${Math.floor(Math.random() * 9000 + 1000)}`
    setDunningActivities(prev => [{ ...data, id }, ...prev])
    // Update customer dunning stage
    setCustomers(prev => prev.map(c => c.id === data.customerId ? { ...c, dunningStage: data.stage } : c))
  }

  const handleAddPromise = (data: Omit<PromiseToPay, "id" | "createdDate">) => {
    const id = `ptp-${Math.floor(Math.random() * 9000 + 1000)}`
    setPromisesToPay(prev => [{ ...data, id, createdDate: todayStr }, ...prev])
  }

  const handleMarkPtpKept = (id: string) => {
    setPromisesToPay(prev => prev.map(p => p.id === id ? { ...p, status: "kept" as const } : p))
    toast.success("Promise to pay marked as kept.")
  }

  const handleMarkPtpBroken = (id: string) => {
    setPromisesToPay(prev => prev.map(p => p.id === id ? { ...p, status: "broken" as const } : p))
    toast.error("Promise to pay marked as broken. Consider escalating.")
  }

  const handleEscalate = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId)
    if (!customer) return
    const stages: CustomerAccount["dunningStage"][] = ["none", "reminder", "first_notice", "second_notice", "final_notice", "legal"]
    const currentIdx = stages.indexOf(customer.dunningStage)
    const nextStage = stages[Math.min(stages.length - 1, currentIdx + 1)]
    setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, dunningStage: nextStage } : c))
    toast.warning(`${customer.clientName} escalated to: ${nextStage.replace(/_/g, " ")}`)
  }

  // ── Bank Deposit Actions ──────────────────────────────────────────────────────
  const handleCreateDeposit = (data: Omit<BankDeposit, "id" | "depositSlipNo">) => {
    const id = `dep-${Math.floor(Math.random() * 9000 + 1000)}`
    const depositSlipNo = `DS-2026-0${Math.floor(Math.random() * 900 + 100)}`
    setDeposits(prev => [{ ...data, id, depositSlipNo }, ...prev])
    setBankAccounts(prev => prev.map(b =>
      b.id === data.bankAccountId ? { ...b, pendingDeposits: b.pendingDeposits + data.totalAmount } : b
    ))
  }

  const handleConfirmDeposit = (id: string) => {
    const dep = deposits.find(d => d.id === id)
    if (!dep) return
    setDeposits(prev => prev.map(d => d.id === id ? { ...d, status: "confirmed" as const } : d))
    setBankAccounts(prev => prev.map(b =>
      b.id === dep.bankAccountId
        ? { ...b, balance: b.balance + dep.totalAmount, pendingDeposits: Math.max(0, b.pendingDeposits - dep.totalAmount) }
        : b
    ))
    toast.success(`Deposit ${dep.depositSlipNo} confirmed. Funds credited to bank account.`)
  }

  const handleReconcileDeposit = (id: string) => {
    const dep = deposits.find(d => d.id === id)
    if (!dep) return
    setDeposits(prev => prev.map(d => d.id === id ? { ...d, status: "reconciled" as const } : d))
    toast.success(`Deposit ${dep?.depositSlipNo} reconciled.`)
  }

  // ── Customer Actions ──────────────────────────────────────────────────────────
  const handleHoldCustomer = (id: string) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, status: "on_hold" as const } : c))
    const c = customers.find(x => x.id === id)
    toast.warning(`${c?.clientName} account placed on hold.`)
  }

  const handleActivateCustomer = (id: string) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, status: "active" as const } : c))
    const c = customers.find(x => x.id === id)
    toast.success(`${c?.clientName} account reactivated.`)
  }

  return (
    <BaseLayout
      title="Collection Management"
      description="Track invoices, apply payments, manage dunning, and monitor AR aging for all ISMERS subsystems."
    >
      <Toaster />
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 px-4 lg:px-6">
          <Card className="bg-card/40 backdrop-blur-sm transition-all duration-300 hover:shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Total AR Outstanding</p>
                  <div className="mt-1">
                    <span className="text-2xl font-bold tracking-tight">{formatPHP(topMetrics.totalOutstanding)}</span>
                  </div>
                </div>
                <div className="bg-secondary rounded-lg p-2.5">
                  <Wallet className="size-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 backdrop-blur-sm transition-all duration-300 hover:shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Total Overdue</p>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold tracking-tight text-red-500">{formatPHP(topMetrics.totalOverdue)}</span>
                  </div>
                </div>
                <div className="bg-secondary rounded-lg p-2.5">
                  <AlertTriangle className="size-5 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 backdrop-blur-sm transition-all duration-300 hover:shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Collected (Jul)</p>
                  <div className="mt-1">
                    <span className="text-2xl font-bold tracking-tight text-emerald-500">{formatPHP(topMetrics.collectedThisMonth)}</span>
                  </div>
                </div>
                <div className="bg-secondary rounded-lg p-2.5">
                  <TrendingUp className="size-5 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 backdrop-blur-sm transition-all duration-300 hover:shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Promises to Pay</p>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold tracking-tight">{formatPHP(topMetrics.pendingPtp)}</span>
                    <span className="text-[10px] text-amber-500 font-semibold">{promisesToPay.filter(p => p.status === "pending").length} active</span>
                  </div>
                </div>
                <div className="bg-secondary rounded-lg p-2.5">
                  <Clock className="size-5 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Interface */}
        <Tabs defaultValue="overview" className="w-full">
          <div className="px-4 lg:px-6">
            <TabsList className="grid grid-cols-7 w-full max-w-5xl bg-muted/30 p-1 border">
              <TabsTrigger value="overview" className="cursor-pointer text-xs flex items-center gap-1.5">
                <Activity className="size-3.5" /> Dashboard
              </TabsTrigger>
              <TabsTrigger value="invoices" className="cursor-pointer text-xs flex items-center gap-1.5">
                <FileText className="size-3.5" /> Invoices
              </TabsTrigger>
              <TabsTrigger value="payments" className="cursor-pointer text-xs flex items-center gap-1.5">
                <CreditCard className="size-3.5" /> Payments
              </TabsTrigger>
              <TabsTrigger value="dunning" className="cursor-pointer text-xs flex items-center gap-1.5">
                <Bell className="size-3.5" /> Dunning
              </TabsTrigger>
              <TabsTrigger value="credits" className="cursor-pointer text-xs flex items-center gap-1.5">
                <ReceiptText className="size-3.5" /> Credits
              </TabsTrigger>
              <TabsTrigger value="deposits" className="cursor-pointer text-xs flex items-center gap-1.5">
                <Landmark className="size-3.5" /> Deposits
              </TabsTrigger>
              <TabsTrigger value="ledger" className="cursor-pointer text-xs flex items-center gap-1.5">
                <Users className="size-3.5" /> Ledger
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="mt-6">
            <TabsContent value="overview" className="outline-hidden">
              <CollectionDashboard
                customers={customers}
                invoices={invoices}
                receipts={receipts}
                bankAccounts={bankAccounts}
              />
            </TabsContent>

            <TabsContent value="invoices" className="outline-hidden">
              <InvoiceManagement
                invoices={invoices}
                customers={customers}
                onIssueInvoice={handleIssueInvoice}
                onVoidInvoice={handleVoidInvoice}
                onMarkDisputed={handleMarkDisputed}
              />
            </TabsContent>

            <TabsContent value="payments" className="outline-hidden">
              <PaymentApplication
                receipts={receipts}
                invoices={invoices}
                customers={customers}
                bankAccounts={bankAccounts}
                onApplyPayment={handleApplyPayment}
                onBounceReceipt={handleBounceReceipt}
                onClearReceipt={handleClearReceipt}
              />
            </TabsContent>

            <TabsContent value="dunning" className="outline-hidden">
              <DunningCollections
                dunningActivities={dunningActivities}
                promisesToPay={promisesToPay}
                customers={customers}
                invoices={invoices}
                onAddDunning={handleAddDunning}
                onAddPromise={handleAddPromise}
                onMarkPtpKept={handleMarkPtpKept}
                onMarkPtpBroken={handleMarkPtpBroken}
                onEscalate={handleEscalate}
              />
            </TabsContent>

            <TabsContent value="credits" className="outline-hidden">
              <CreditNotes
                creditNotes={creditNotes}
                customers={customers}
                invoices={invoices}
                onCreateCreditNote={handleCreateCreditNote}
                onApplyCreditNote={handleApplyCreditNote}
                onVoidCreditNote={handleVoidCreditNote}
              />
            </TabsContent>

            <TabsContent value="deposits" className="outline-hidden">
              <BankDeposits
                deposits={deposits}
                receipts={receipts}
                bankAccounts={bankAccounts}
                onCreateDeposit={handleCreateDeposit}
                onConfirmDeposit={handleConfirmDeposit}
                onReconcileDeposit={handleReconcileDeposit}
              />
            </TabsContent>

            <TabsContent value="ledger" className="outline-hidden">
              <CustomerLedger
                customers={customers}
                invoices={invoices}
                receipts={receipts}
                onHoldCustomer={handleHoldCustomer}
                onActivateCustomer={handleActivateCustomer}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </BaseLayout>
  )
}
