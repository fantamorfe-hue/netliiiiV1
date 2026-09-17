"use client"

import * as React from "react"
import { toast } from "sonner"
import { ArrowUpFromLine, Plus, Search, CheckCircle2, Clock, XCircle } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import type { CashDisbursement, CashBankAccount, CashDisbursementCategory, SubsystemSource } from "../data/mock-data"

interface CashDisbursementsViewProps {
  disbursements: CashDisbursement[]
  bankAccounts: CashBankAccount[]
  onRecordDisbursement: (disbursement: Omit<CashDisbursement, "id" | "voucherNo" | "status" | "glPosted">) => void
  onPostDisbursement: (id: string) => void
  onVoidDisbursement: (id: string) => void
}

const formatPHP = (val: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(val)

const statusConfig = {
  pending: { label: "Pending", icon: Clock, className: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
  posted: { label: "Posted", icon: CheckCircle2, className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" },
  reconciled: { label: "Reconciled", icon: CheckCircle2, className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  voided: { label: "Voided", icon: XCircle, className: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400" },
}

const CATEGORIES: CashDisbursementCategory[] = [
  "Payroll", "Vendor Payment", "Tax Remittance", "Loan Payment",
  "Petty Cash Replenishment", "Inter-fund Transfer", "Operating Expense",
]
const SUBSYSTEMS: SubsystemSource[] = [
  "Client Acquisition", "HRIS Payroll", "Fleet & Transport", "Facilities", "Supply Chain",
  "CRM", "Governance & Admin", "Benefits & Compliance", "Financial Management",
]

export function CashDisbursementsView({
  disbursements, bankAccounts, onRecordDisbursement, onPostDisbursement, onVoidDisbursement,
}: CashDisbursementsViewProps) {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [showCreate, setShowCreate] = React.useState(false)

  const [form, setForm] = React.useState({
    date: new Date().toISOString().split("T")[0],
    category: "Operating Expense" as CashDisbursementCategory,
    subsystem: "Governance & Admin" as SubsystemSource,
    payee: "",
    description: "",
    amount: "",
    paymentMethod: "Check" as CashDisbursement["paymentMethod"],
    referenceNo: "",
    bankAccountId: "cash-1",
  })

  const filtered = React.useMemo(() => {
    return disbursements.filter(d => {
      const matchSearch =
        d.voucherNo.toLowerCase().includes(search.toLowerCase()) ||
        d.payee.toLowerCase().includes(search.toLowerCase()) ||
        d.description.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === "all" || d.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [disbursements, search, statusFilter])

  const handleSubmit = () => {
    const amount = parseFloat(form.amount)
    if (!form.payee || !form.description || amount <= 0 || !form.bankAccountId) {
      toast.error("Please fill all required fields.")
      return
    }
    onRecordDisbursement({
      date: form.date,
      category: form.category,
      subsystem: form.subsystem,
      payee: form.payee,
      description: form.description,
      amount,
      paymentMethod: form.paymentMethod,
      referenceNo: form.referenceNo,
      bankAccountId: form.bankAccountId,
    })
    setShowCreate(false)
    setForm({
      date: new Date().toISOString().split("T")[0],
      category: "Operating Expense",
      subsystem: "Governance & Admin",
      payee: "",
      description: "",
      amount: "",
      paymentMethod: "Check",
      referenceNo: "",
      bankAccountId: "cash-1",
    })
  }

  const totalPosted = disbursements.filter(d => d.status === "posted" || d.status === "reconciled").reduce((s, d) => s + d.amount, 0)
  const totalPending = disbursements.filter(d => d.status === "pending").reduce((s, d) => s + d.amount, 0)

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Posted Disbursements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{formatPHP(totalPosted)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Execution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatPHP(totalPending)}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pb-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpFromLine className="size-4 text-red-500" />
              Cash Disbursements Journal
            </CardTitle>
            <CardDescription>
              Track all cash outflows — payroll, vendor payments, tax remittances, and operating expenses
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center border rounded-lg p-0.5 bg-muted/30">
              {["all", "pending", "posted", "reconciled", "voided"].map(status => (
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
            <Button size="sm" className="cursor-pointer" onClick={() => setShowCreate(true)}>
              <Plus className="size-4 mr-1.5" /> Record Disbursement
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input placeholder="Search disbursements..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Voucher No.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Payee</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(disbursement => {
                  const cfg = statusConfig[disbursement.status]
                  const StatusIcon = cfg.icon
                  const bank = bankAccounts.find(b => b.id === disbursement.bankAccountId)
                  return (
                    <TableRow key={disbursement.id}>
                      <TableCell className="font-mono text-xs font-medium">{disbursement.voucherNo}</TableCell>
                      <TableCell className="text-sm">{disbursement.date}</TableCell>
                      <TableCell>
                        <div className="text-sm">{disbursement.category}</div>
                        <div className="text-[10px] text-muted-foreground">{disbursement.subsystem}</div>
                      </TableCell>
                      <TableCell className="text-sm">{disbursement.payee}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{disbursement.description}</TableCell>
                      <TableCell className="text-right font-semibold text-red-500">{formatPHP(disbursement.amount)}</TableCell>
                      <TableCell>
                        <div className="text-xs">{disbursement.paymentMethod}</div>
                        <div className="text-[10px] text-muted-foreground">{bank?.name.split(" ")[0]}</div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.className}`}>
                          <StatusIcon className="size-3" /> {cfg.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {disbursement.status === "pending" && (
                            <Button size="sm" variant="outline" className="h-7 text-xs cursor-pointer" onClick={() => onPostDisbursement(disbursement.id)}>
                              Execute
                            </Button>
                          )}
                          {disbursement.status !== "voided" && disbursement.status !== "reconciled" && (
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500 cursor-pointer" onClick={() => onVoidDisbursement(disbursement.id)}>
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

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Cash Disbursement</DialogTitle>
            <DialogDescription>Enter cash outflow details. Pending vouchers require execution before bank deduction.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Amount (PHP)</Label>
              <Input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v as CashDisbursementCategory }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Subsystem</Label>
              <Select value={form.subsystem} onValueChange={v => setForm(f => ({ ...f, subsystem: v as SubsystemSource }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUBSYSTEMS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Payee</Label>
              <Input placeholder="Vendor, employee, or entity name" value={form.payee} onChange={e => setForm(f => ({ ...f, payee: e.target.value }))} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Description</Label>
              <Textarea placeholder="Disbursement description..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <Select value={form.paymentMethod} onValueChange={v => setForm(f => ({ ...f, paymentMethod: v as CashDisbursement["paymentMethod"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Cash", "Check", "EFT", "Wire"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Source Account</Label>
              <Select value={form.bankAccountId} onValueChange={v => setForm(f => ({ ...f, bankAccountId: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {bankAccounts.filter(b => b.isActive).map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Reference No.</Label>
              <Input placeholder="Voucher ref, check no., etc." value={form.referenceNo} onChange={e => setForm(f => ({ ...f, referenceNo: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="cursor-pointer" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button className="cursor-pointer" onClick={handleSubmit}>Record Disbursement</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
