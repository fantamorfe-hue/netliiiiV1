"use client"

import * as React from "react"
import { toast } from "sonner"
import { Banknote, Check, Plus, Search, Wallet } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import type { PettyCashFund, PettyCashVoucher } from "../data/mock-data"

interface PettyCashViewProps {
  funds: PettyCashFund[]
  vouchers: PettyCashVoucher[]
  onCreateVoucher: (voucher: Omit<PettyCashVoucher, "id" | "voucherNo" | "status">) => void
  onApproveVoucher: (id: string) => void
  onPayVoucher: (id: string) => void
  onVoidVoucher: (id: string) => void
  onReplenishFund: (fundId: string, amount: number) => void
}

const formatPHP = (val: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(val)

const voucherStatusBadge: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  approved: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  voided: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
}

export function PettyCashView({
  funds, vouchers, onCreateVoucher, onApproveVoucher, onPayVoucher, onVoidVoucher, onReplenishFund,
}: PettyCashViewProps) {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [showCreate, setShowCreate] = React.useState(false)
  const [showReplenish, setShowReplenish] = React.useState(false)
  const [replenishFundId, setReplenishFundId] = React.useState("")
  const [replenishAmount, setReplenishAmount] = React.useState("")

  const [form, setForm] = React.useState({
    fundId: "pcf-1",
    date: new Date().toISOString().split("T")[0],
    payee: "",
    purpose: "",
    amount: "",
    expenseAccount: "6100 — Office Supplies",
  })

  const filtered = React.useMemo(() => {
    return vouchers.filter(v => {
      const matchSearch =
        v.voucherNo.toLowerCase().includes(search.toLowerCase()) ||
        v.payee.toLowerCase().includes(search.toLowerCase()) ||
        v.purpose.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === "all" || v.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [vouchers, search, statusFilter])

  const handleSubmit = () => {
    const amount = parseFloat(form.amount)
    if (!form.payee || !form.purpose || amount <= 0) {
      toast.error("Please fill all required fields.")
      return
    }
    const fund = funds.find(f => f.id === form.fundId)
    if (fund && amount > fund.currentBalance) {
      toast.error(`Insufficient petty cash balance. Available: ${formatPHP(fund.currentBalance)}`)
      return
    }
    onCreateVoucher({
      fundId: form.fundId,
      date: form.date,
      payee: form.payee,
      purpose: form.purpose,
      amount,
      expenseAccount: form.expenseAccount,
    })
    setShowCreate(false)
    setForm({ fundId: "pcf-1", date: new Date().toISOString().split("T")[0], payee: "", purpose: "", amount: "", expenseAccount: "6100 — Office Supplies" })
  }

  const handleReplenish = () => {
    const amount = parseFloat(replenishAmount)
    if (!replenishFundId || amount <= 0) {
      toast.error("Please select a fund and enter a valid amount.")
      return
    }
    onReplenishFund(replenishFundId, amount)
    setShowReplenish(false)
    setReplenishAmount("")
  }

  const totalFundBalance = funds.filter(f => f.status === "active").reduce((s, f) => s + f.currentBalance, 0)
  const totalFundLimit = funds.filter(f => f.status === "active").reduce((s, f) => s + f.fundLimit, 0)

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Fund Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {funds.filter(f => f.status === "active").map(fund => {
          const pct = Math.round((fund.currentBalance / fund.fundLimit) * 100)
          const isLow = pct < 30
          return (
            <Card key={fund.id} className={isLow ? "border-amber-300" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{fund.department}</CardTitle>
                  <Badge variant="outline" className="text-xs">{fund.subsystem}</Badge>
                </div>
                <CardDescription>Custodian: {fund.custodian}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPHP(fund.currentBalance)}</div>
                <div className="mt-1 text-xs text-muted-foreground">Limit: {formatPHP(fund.fundLimit)}</div>
                <Progress value={pct} className="mt-3 h-2" />
                <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                  <span>{pct}% utilized</span>
                  {isLow && <span className="text-amber-600 font-medium">Low balance</span>}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="size-4" /> Total Petty Cash on Hand
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPHP(totalFundBalance)}</div>
            <div className="text-xs text-muted-foreground mt-1">of {formatPHP(totalFundLimit)} total fund limits</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Banknote className="size-4" /> Open Vouchers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vouchers.filter(v => v.status === "draft" || v.status === "approved").length}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {formatPHP(vouchers.filter(v => v.status === "draft" || v.status === "approved").reduce((s, v) => s + v.amount, 0))} pending payout
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pb-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="size-4 text-amber-500" />
              Petty Cash Vouchers
            </CardTitle>
            <CardDescription>
              Manage imprest fund disbursements, approvals, and replenishment requests
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center border rounded-lg p-0.5 bg-muted/30">
              {["all", "draft", "approved", "paid", "voided"].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium capitalize cursor-pointer transition-colors ${
                    statusFilter === status ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => setShowReplenish(true)}>
              Replenish Fund
            </Button>
            <Button size="sm" className="cursor-pointer" onClick={() => setShowCreate(true)}>
              <Plus className="size-4 mr-1.5" /> New Voucher
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input placeholder="Search vouchers..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Voucher No.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Fund</TableHead>
                  <TableHead>Payee</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Expense Account</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(voucher => {
                  const fund = funds.find(f => f.id === voucher.fundId)
                  return (
                    <TableRow key={voucher.id}>
                      <TableCell className="font-mono text-xs font-medium">{voucher.voucherNo}</TableCell>
                      <TableCell className="text-sm">{voucher.date}</TableCell>
                      <TableCell className="text-sm">{fund?.department}</TableCell>
                      <TableCell className="text-sm">{voucher.payee}</TableCell>
                      <TableCell className="max-w-[180px] truncate text-sm text-muted-foreground">{voucher.purpose}</TableCell>
                      <TableCell className="text-xs">{voucher.expenseAccount}</TableCell>
                      <TableCell className="text-right font-semibold">{formatPHP(voucher.amount)}</TableCell>
                      <TableCell>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${voucherStatusBadge[voucher.status]}`}>
                          {voucher.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {voucher.status === "draft" && (
                            <Button size="sm" variant="outline" className="h-7 text-xs cursor-pointer" onClick={() => onApproveVoucher(voucher.id)}>
                              <Check className="size-3 mr-1" /> Approve
                            </Button>
                          )}
                          {voucher.status === "approved" && (
                            <Button size="sm" variant="outline" className="h-7 text-xs cursor-pointer" onClick={() => onPayVoucher(voucher.id)}>
                              Pay
                            </Button>
                          )}
                          {voucher.status !== "paid" && voucher.status !== "voided" && (
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500 cursor-pointer" onClick={() => onVoidVoucher(voucher.id)}>
                              Void
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Voucher Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Petty Cash Voucher</DialogTitle>
            <DialogDescription>File a petty cash disbursement request against an imprest fund.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <Label>Petty Cash Fund</Label>
              <Select value={form.fundId} onValueChange={v => setForm(f => ({ ...f, fundId: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {funds.filter(f => f.status === "active").map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.department} — {f.custodian} ({formatPHP(f.currentBalance)})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Amount (PHP)</Label>
              <Input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Payee</Label>
              <Input placeholder="Vendor or recipient" value={form.payee} onChange={e => setForm(f => ({ ...f, payee: e.target.value }))} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Purpose</Label>
              <Input placeholder="Expense purpose" value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Expense Account</Label>
              <Select value={form.expenseAccount} onValueChange={v => setForm(f => ({ ...f, expenseAccount: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["6100 — Office Supplies", "6200 — Fleet Fuel", "6300 — Recruitment Expense", "6400 — Travel & Transport", "6500 — Miscellaneous"].map(a => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="cursor-pointer" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button className="cursor-pointer" onClick={handleSubmit}>Create Voucher</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Replenish Dialog */}
      <Dialog open={showReplenish} onOpenChange={setShowReplenish}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Replenish Petty Cash Fund</DialogTitle>
            <DialogDescription>Transfer funds from treasury to restore imprest balance.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Fund</Label>
              <Select value={replenishFundId} onValueChange={setReplenishFundId}>
                <SelectTrigger><SelectValue placeholder="Select fund" /></SelectTrigger>
                <SelectContent>
                  {funds.filter(f => f.status === "active").map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.department} — {formatPHP(f.currentBalance)} / {formatPHP(f.fundLimit)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Replenishment Amount (PHP)</Label>
              <Input type="number" placeholder="0.00" value={replenishAmount} onChange={e => setReplenishAmount(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="cursor-pointer" onClick={() => setShowReplenish(false)}>Cancel</Button>
            <Button className="cursor-pointer" onClick={handleReplenish}>Replenish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
