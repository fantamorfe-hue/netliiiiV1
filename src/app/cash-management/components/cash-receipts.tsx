"use client"

import * as React from "react"
import { toast } from "sonner"
import { ArrowDownToLine, Plus, Search, CheckCircle2, Clock, XCircle } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import type { CashReceipt, CashBankAccount, CashReceiptSource, SubsystemSource } from "../data/mock-data"

interface CashReceiptsViewProps {
  receipts: CashReceipt[]
  bankAccounts: CashBankAccount[]
  onRecordReceipt: (receipt: Omit<CashReceipt, "id" | "receiptNo" | "status" | "glPosted">) => void
  onPostReceipt: (id: string) => void
  onVoidReceipt: (id: string) => void
}

const formatPHP = (val: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(val)

const statusConfig = {
  pending: { label: "Pending", icon: Clock, className: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
  posted: { label: "Posted", icon: CheckCircle2, className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" },
  reconciled: { label: "Reconciled", icon: CheckCircle2, className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  voided: { label: "Voided", icon: XCircle, className: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400" },
}

const SOURCES: CashReceiptSource[] = [
  "Collection Management", "Accounts Receivable", "Payroll Recovery", "Loan Repayment", "Inter-fund Transfer", "Other Income",
]
const SUBSYSTEMS: SubsystemSource[] = [
  "Client Acquisition", "HRIS Payroll", "Fleet & Transport", "Facilities", "Supply Chain",
  "CRM", "Governance & Admin", "Benefits & Compliance", "Financial Management",
]

export function CashReceiptsView({ receipts, bankAccounts, onRecordReceipt, onPostReceipt, onVoidReceipt }: CashReceiptsViewProps) {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [showCreate, setShowCreate] = React.useState(false)

  const [form, setForm] = React.useState({
    date: new Date().toISOString().split("T")[0],
    source: "Collection Management" as CashReceiptSource,
    subsystem: "Client Acquisition" as SubsystemSource,
    payer: "",
    description: "",
    amount: "",
    paymentMethod: "Bank Transfer" as CashReceipt["paymentMethod"],
    referenceNo: "",
    bankAccountId: "cash-1",
  })

  const filtered = React.useMemo(() => {
    return receipts.filter(r => {
      const matchSearch =
        r.receiptNo.toLowerCase().includes(search.toLowerCase()) ||
        r.payer.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === "all" || r.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [receipts, search, statusFilter])

  const handleSubmit = () => {
    const amount = parseFloat(form.amount)
    if (!form.payer || !form.description || amount <= 0 || !form.bankAccountId) {
      toast.error("Please fill all required fields.")
      return
    }
    onRecordReceipt({
      date: form.date,
      source: form.source,
      subsystem: form.subsystem,
      payer: form.payer,
      description: form.description,
      amount,
      paymentMethod: form.paymentMethod,
      referenceNo: form.referenceNo,
      bankAccountId: form.bankAccountId,
    })
    setShowCreate(false)
    setForm({
      date: new Date().toISOString().split("T")[0],
      source: "Collection Management",
      subsystem: "Client Acquisition",
      payer: "",
      description: "",
      amount: "",
      paymentMethod: "Bank Transfer",
      referenceNo: "",
      bankAccountId: "cash-1",
    })
  }

  const totalPosted = receipts.filter(r => r.status === "posted" || r.status === "reconciled").reduce((s, r) => s + r.amount, 0)
  const totalPending = receipts.filter(r => r.status === "pending").reduce((s, r) => s + r.amount, 0)

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Posted Receipts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatPHP(totalPosted)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Clearance</CardTitle>
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
              <ArrowDownToLine className="size-4 text-emerald-500" />
              Cash Receipts Journal
            </CardTitle>
            <CardDescription>
              Record and post all cash inflows from Collection, AR, payroll recoveries, and other sources
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
              <Plus className="size-4 mr-1.5" /> Record Receipt
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input placeholder="Search receipts..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt No.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Payer</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(receipt => {
                  const cfg = statusConfig[receipt.status]
                  const StatusIcon = cfg.icon
                  const bank = bankAccounts.find(b => b.id === receipt.bankAccountId)
                  return (
                    <TableRow key={receipt.id}>
                      <TableCell className="font-mono text-xs font-medium">{receipt.receiptNo}</TableCell>
                      <TableCell className="text-sm">{receipt.date}</TableCell>
                      <TableCell>
                        <div className="text-sm">{receipt.source}</div>
                        <div className="text-[10px] text-muted-foreground">{receipt.subsystem}</div>
                      </TableCell>
                      <TableCell className="text-sm">{receipt.payer}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{receipt.description}</TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600">{formatPHP(receipt.amount)}</TableCell>
                      <TableCell>
                        <div className="text-xs">{receipt.paymentMethod}</div>
                        <div className="text-[10px] text-muted-foreground">{bank?.name.split(" ")[0]}</div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.className}`}>
                          <StatusIcon className="size-3" /> {cfg.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {receipt.status === "pending" && (
                            <Button size="sm" variant="outline" className="h-7 text-xs cursor-pointer" onClick={() => onPostReceipt(receipt.id)}>
                              Post
                            </Button>
                          )}
                          {receipt.status !== "voided" && receipt.status !== "reconciled" && (
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500 cursor-pointer" onClick={() => onVoidReceipt(receipt.id)}>
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
            <DialogTitle>Record Cash Receipt</DialogTitle>
            <DialogDescription>Enter cash inflow details. Pending receipts require posting before GL integration.</DialogDescription>
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
              <Label>Source</Label>
              <Select value={form.source} onValueChange={v => setForm(f => ({ ...f, source: v as CashReceiptSource }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
              <Label>Payer</Label>
              <Input placeholder="Client or entity name" value={form.payer} onChange={e => setForm(f => ({ ...f, payer: e.target.value }))} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Description</Label>
              <Textarea placeholder="Receipt description..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <Select value={form.paymentMethod} onValueChange={v => setForm(f => ({ ...f, paymentMethod: v as CashReceipt["paymentMethod"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Cash", "Check", "Bank Transfer", "Online"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Deposit Account</Label>
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
              <Input placeholder="Check no., transfer ref, etc." value={form.referenceNo} onChange={e => setForm(f => ({ ...f, referenceNo: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="cursor-pointer" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button className="cursor-pointer" onClick={handleSubmit}>Record Receipt</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
