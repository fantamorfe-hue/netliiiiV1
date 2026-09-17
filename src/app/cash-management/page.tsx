"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  Activity, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight,
  Banknote, Landmark, TrendingUp, Wallet,
} from "lucide-react"

import { BaseLayout } from "@/components/layouts/base-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Toaster } from "@/components/ui/sonner"

import { CashDashboard } from "./components/cash-dashboard"
import { BankAccountsView } from "./components/bank-accounts"
import { CashReceiptsView } from "./components/cash-receipts"
import { CashDisbursementsView } from "./components/cash-disbursements"
import { PettyCashView } from "./components/petty-cash"
import { FundTransfersView } from "./components/fund-transfers"
import { CashForecastView } from "./components/cash-forecast"

import {
  initialCashBankAccounts,
  initialCashReceipts,
  initialCashDisbursements,
  initialPettyCashFunds,
  initialPettyCashVouchers,
  initialFundTransfers,
  initialCashForecast,
  initialDailyPositions,
  type CashBankAccount,
  type CashReceipt,
  type CashDisbursement,
  type PettyCashFund,
  type PettyCashVoucher,
  type FundTransfer,
} from "./data/mock-data"

const formatPHP = (val: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(val)

export default function CashManagementPage() {
  const [bankAccounts, setBankAccounts] = React.useState<CashBankAccount[]>(initialCashBankAccounts)
  const [receipts, setReceipts] = React.useState<CashReceipt[]>(initialCashReceipts)
  const [disbursements, setDisbursements] = React.useState<CashDisbursement[]>(initialCashDisbursements)
  const [pettyCashFunds, setPettyCashFunds] = React.useState<PettyCashFund[]>(initialPettyCashFunds)
  const [pettyCashVouchers, setPettyCashVouchers] = React.useState<PettyCashVoucher[]>(initialPettyCashVouchers)
  const [fundTransfers, setFundTransfers] = React.useState<FundTransfer[]>(initialFundTransfers)

  const todayStr = React.useMemo(() => new Date().toISOString().split("T")[0], [])

  const topMetrics = React.useMemo(() => {
    const totalCash = bankAccounts.filter(a => a.isActive).reduce((s, a) => s + a.ledgerBalance, 0)
    const monthInflow = receipts.filter(r => r.status !== "voided" && r.date.startsWith("2026-07")).reduce((s, r) => s + r.amount, 0)
    const monthOutflow = disbursements.filter(d => d.status !== "voided" && d.date.startsWith("2026-07")).reduce((s, d) => s + d.amount, 0)
    const pendingItems = receipts.filter(r => r.status === "pending").length + disbursements.filter(d => d.status === "pending").length
    return { totalCash, monthInflow, monthOutflow, pendingItems, netFlow: monthInflow - monthOutflow }
  }, [bankAccounts, receipts, disbursements])

  const updateAccountBalance = (accountId: string, delta: number) => {
    setBankAccounts(prev => prev.map(a =>
      a.id === accountId ? { ...a, ledgerBalance: a.ledgerBalance + delta, bankBalance: a.bankBalance + delta } : a
    ))
  }

  // ── Cash Receipts ────────────────────────────────────────────────────────────
  const handleRecordReceipt = (data: Omit<CashReceipt, "id" | "receiptNo" | "status" | "glPosted">) => {
    const id = `cr-${Math.floor(Math.random() * 9000 + 1000)}`
    const receiptNo = `CR-2026-${Math.floor(Math.random() * 9000 + 1000)}`
    setReceipts(prev => [{ ...data, id, receiptNo, status: "pending", glPosted: false }, ...prev])
    toast.success(`Receipt ${receiptNo} recorded. Pending posting.`)
  }

  const handlePostReceipt = (id: string) => {
    const receipt = receipts.find(r => r.id === id)
    if (!receipt) return
    setReceipts(prev => prev.map(r => r.id === id ? { ...r, status: "posted" as const, glPosted: true } : r))
    updateAccountBalance(receipt.bankAccountId, receipt.amount)
    toast.success(`Receipt ${receipt.receiptNo} posted. ${formatPHP(receipt.amount)} credited to account.`)
  }

  const handleVoidReceipt = (id: string) => {
    const receipt = receipts.find(r => r.id === id)
    if (!receipt) return
    if (receipt.status === "posted") {
      updateAccountBalance(receipt.bankAccountId, -receipt.amount)
    }
    setReceipts(prev => prev.map(r => r.id === id ? { ...r, status: "voided" as const } : r))
    toast.warning(`Receipt ${receipt.receiptNo} voided.`)
  }

  // ── Cash Disbursements ─────────────────────────────────────────────────────────
  const handleRecordDisbursement = (data: Omit<CashDisbursement, "id" | "voucherNo" | "status" | "glPosted">) => {
    const id = `cd-${Math.floor(Math.random() * 9000 + 1000)}`
    const voucherNo = `CD-2026-${Math.floor(Math.random() * 9000 + 1000)}`
    setDisbursements(prev => [{ ...data, id, voucherNo, status: "pending", glPosted: false }, ...prev])
    toast.success(`Disbursement ${voucherNo} recorded. Pending execution.`)
  }

  const handlePostDisbursement = (id: string) => {
    const disbursement = disbursements.find(d => d.id === id)
    if (!disbursement) return
    const account = bankAccounts.find(a => a.id === disbursement.bankAccountId)
    if (account && account.ledgerBalance < disbursement.amount) {
      toast.error("Insufficient funds in source account.")
      return
    }
    setDisbursements(prev => prev.map(d => d.id === id ? { ...d, status: "posted" as const, glPosted: true } : d))
    updateAccountBalance(disbursement.bankAccountId, -disbursement.amount)
    toast.success(`Disbursement ${disbursement.voucherNo} executed. ${formatPHP(disbursement.amount)} debited.`)
  }

  const handleVoidDisbursement = (id: string) => {
    const disbursement = disbursements.find(d => d.id === id)
    if (!disbursement) return
    if (disbursement.status === "posted") {
      updateAccountBalance(disbursement.bankAccountId, disbursement.amount)
    }
    setDisbursements(prev => prev.map(d => d.id === id ? { ...d, status: "voided" as const } : d))
    toast.warning(`Disbursement ${disbursement.voucherNo} voided.`)
  }

  // ── Petty Cash ─────────────────────────────────────────────────────────────────
  const handleCreateVoucher = (data: Omit<PettyCashVoucher, "id" | "voucherNo" | "status">) => {
    const id = `pcv-${Math.floor(Math.random() * 9000 + 1000)}`
    const voucherNo = `PCV-2026-${Math.floor(Math.random() * 9000 + 1000)}`
    setPettyCashVouchers(prev => [{ ...data, id, voucherNo, status: "draft" }, ...prev])
    toast.success(`Petty cash voucher ${voucherNo} created.`)
  }

  const handleApproveVoucher = (id: string) => {
    setPettyCashVouchers(prev => prev.map(v => v.id === id ? { ...v, status: "approved" as const, approvedBy: "Department Head" } : v))
    const voucher = pettyCashVouchers.find(v => v.id === id)
    toast.success(`Voucher ${voucher?.voucherNo} approved.`)
  }

  const handlePayVoucher = (id: string) => {
    const voucher = pettyCashVouchers.find(v => v.id === id)
    if (!voucher) return
    const fund = pettyCashFunds.find(f => f.id === voucher.fundId)
    if (fund && fund.currentBalance < voucher.amount) {
      toast.error("Insufficient petty cash balance.")
      return
    }
    setPettyCashVouchers(prev => prev.map(v => v.id === id ? { ...v, status: "paid" as const } : v))
    setPettyCashFunds(prev => prev.map(f =>
      f.id === voucher.fundId ? { ...f, currentBalance: f.currentBalance - voucher.amount } : f
    ))
    // Sync petty cash bank account
    const pcAccount = bankAccounts.find(a => a.accountType === "petty_cash" && a.subsystem === fund?.subsystem)
    if (pcAccount) updateAccountBalance(pcAccount.id, -voucher.amount)
    toast.success(`Voucher ${voucher.voucherNo} paid. ${formatPHP(voucher.amount)} deducted from fund.`)
  }

  const handleVoidVoucher = (id: string) => {
    setPettyCashVouchers(prev => prev.map(v => v.id === id ? { ...v, status: "voided" as const } : v))
    toast.warning("Petty cash voucher voided.")
  }

  const handleReplenishFund = (fundId: string, amount: number) => {
    const fund = pettyCashFunds.find(f => f.id === fundId)
    if (!fund) return
    const newBalance = Math.min(fund.fundLimit, fund.currentBalance + amount)
    const actualReplenish = newBalance - fund.currentBalance
    setPettyCashFunds(prev => prev.map(f =>
      f.id === fundId ? { ...f, currentBalance: newBalance, lastReplenished: todayStr } : f
    ))
    const pcAccount = bankAccounts.find(a => a.accountType === "petty_cash" && a.subsystem === fund.subsystem)
    if (pcAccount) updateAccountBalance(pcAccount.id, actualReplenish)
    toast.success(`Fund replenished with ${formatPHP(actualReplenish)}.`)
  }

  // ── Fund Transfers ─────────────────────────────────────────────────────────────
  const handleCreateTransfer = (data: Omit<FundTransfer, "id" | "transferNo" | "status">) => {
    const id = `ft-${Math.floor(Math.random() * 9000 + 1000)}`
    const transferNo = `FT-2026-${Math.floor(Math.random() * 9000 + 1000)}`
    setFundTransfers(prev => [{ ...data, id, transferNo, status: "pending" }, ...prev])
    toast.success(`Transfer ${transferNo} initiated. Pending execution.`)
  }

  const handleCompleteTransfer = (id: string) => {
    const transfer = fundTransfers.find(t => t.id === id)
    if (!transfer) return
    const source = bankAccounts.find(a => a.id === transfer.fromAccountId)
    if (source && source.ledgerBalance < transfer.amount) {
      toast.error("Insufficient balance in source account.")
      return
    }
    setFundTransfers(prev => prev.map(t => t.id === id ? { ...t, status: "completed" as const } : t))
    updateAccountBalance(transfer.fromAccountId, -transfer.amount)
    updateAccountBalance(transfer.toAccountId, transfer.amount)
    toast.success(`Transfer ${transfer.transferNo} completed. ${formatPHP(transfer.amount)} moved.`)
  }

  const handleCancelTransfer = (id: string) => {
    const transfer = fundTransfers.find(t => t.id === id)
    setFundTransfers(prev => prev.map(t => t.id === id ? { ...t, status: "cancelled" as const } : t))
    toast.info(`Transfer ${transfer?.transferNo} cancelled.`)
  }

  return (
    <BaseLayout
      title="Cash Management"
      description="Monitor treasury liquidity, manage cash receipts and disbursements, petty cash funds, and cash flow forecasting across all ISMERS subsystems."
    >
      <Toaster />
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 px-4 lg:px-6">
          <Card className="bg-card/40 backdrop-blur-sm transition-all duration-300 hover:shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Total Cash Position</p>
                  <div className="mt-1">
                    <span className="text-2xl font-bold tracking-tight">{formatPHP(topMetrics.totalCash)}</span>
                  </div>
                </div>
                <div className="bg-secondary rounded-lg p-2.5">
                  <Wallet className="size-5 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 backdrop-blur-sm transition-all duration-300 hover:shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Cash Inflow (Jul)</p>
                  <div className="mt-1">
                    <span className="text-2xl font-bold tracking-tight text-emerald-500">{formatPHP(topMetrics.monthInflow)}</span>
                  </div>
                </div>
                <div className="bg-secondary rounded-lg p-2.5">
                  <ArrowDownToLine className="size-5 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 backdrop-blur-sm transition-all duration-300 hover:shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Cash Outflow (Jul)</p>
                  <div className="mt-1">
                    <span className="text-2xl font-bold tracking-tight text-red-500">{formatPHP(topMetrics.monthOutflow)}</span>
                  </div>
                </div>
                <div className="bg-secondary rounded-lg p-2.5">
                  <ArrowUpFromLine className="size-5 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 backdrop-blur-sm transition-all duration-300 hover:shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Net Cash Flow</p>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className={`text-2xl font-bold tracking-tight ${topMetrics.netFlow >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                      {formatPHP(topMetrics.netFlow)}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-semibold">{topMetrics.pendingItems} pending</span>
                  </div>
                </div>
                <div className="bg-secondary rounded-lg p-2.5">
                  <TrendingUp className="size-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Interface */}
        <Tabs defaultValue="overview" className="w-full">
          <div className="px-4 lg:px-6 overflow-x-auto">
            <TabsList className="inline-flex w-auto min-w-full lg:grid lg:grid-cols-7 lg:w-full max-w-5xl bg-muted/30 p-1 border">
              <TabsTrigger value="overview" className="cursor-pointer text-xs flex items-center gap-1.5">
                <Activity className="size-3.5" /> Dashboard
              </TabsTrigger>
              <TabsTrigger value="accounts" className="cursor-pointer text-xs flex items-center gap-1.5">
                <Landmark className="size-3.5" /> Accounts
              </TabsTrigger>
              <TabsTrigger value="receipts" className="cursor-pointer text-xs flex items-center gap-1.5">
                <ArrowDownToLine className="size-3.5" /> Receipts
              </TabsTrigger>
              <TabsTrigger value="disbursements" className="cursor-pointer text-xs flex items-center gap-1.5">
                <ArrowUpFromLine className="size-3.5" /> Disbursements
              </TabsTrigger>
              <TabsTrigger value="petty-cash" className="cursor-pointer text-xs flex items-center gap-1.5">
                <Banknote className="size-3.5" /> Petty Cash
              </TabsTrigger>
              <TabsTrigger value="transfers" className="cursor-pointer text-xs flex items-center gap-1.5">
                <ArrowLeftRight className="size-3.5" /> Transfers
              </TabsTrigger>
              <TabsTrigger value="forecast" className="cursor-pointer text-xs flex items-center gap-1.5">
                <TrendingUp className="size-3.5" /> Forecast
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="mt-6">
            <TabsContent value="overview" className="outline-hidden">
              <CashDashboard
                bankAccounts={bankAccounts}
                receipts={receipts}
                disbursements={disbursements}
                dailyPositions={initialDailyPositions}
                forecast={initialCashForecast}
              />
            </TabsContent>

            <TabsContent value="accounts" className="outline-hidden">
              <BankAccountsView bankAccounts={bankAccounts} />
            </TabsContent>

            <TabsContent value="receipts" className="outline-hidden">
              <CashReceiptsView
                receipts={receipts}
                bankAccounts={bankAccounts}
                onRecordReceipt={handleRecordReceipt}
                onPostReceipt={handlePostReceipt}
                onVoidReceipt={handleVoidReceipt}
              />
            </TabsContent>

            <TabsContent value="disbursements" className="outline-hidden">
              <CashDisbursementsView
                disbursements={disbursements}
                bankAccounts={bankAccounts}
                onRecordDisbursement={handleRecordDisbursement}
                onPostDisbursement={handlePostDisbursement}
                onVoidDisbursement={handleVoidDisbursement}
              />
            </TabsContent>

            <TabsContent value="petty-cash" className="outline-hidden">
              <PettyCashView
                funds={pettyCashFunds}
                vouchers={pettyCashVouchers}
                onCreateVoucher={handleCreateVoucher}
                onApproveVoucher={handleApproveVoucher}
                onPayVoucher={handlePayVoucher}
                onVoidVoucher={handleVoidVoucher}
                onReplenishFund={handleReplenishFund}
              />
            </TabsContent>

            <TabsContent value="transfers" className="outline-hidden">
              <FundTransfersView
                transfers={fundTransfers}
                bankAccounts={bankAccounts}
                onCreateTransfer={handleCreateTransfer}
                onCompleteTransfer={handleCompleteTransfer}
                onCancelTransfer={handleCancelTransfer}
              />
            </TabsContent>

            <TabsContent value="forecast" className="outline-hidden">
              <CashForecastView
                forecast={initialCashForecast}
                bankAccounts={bankAccounts}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </BaseLayout>
  )
}
