"use client"

import * as React from "react"
import { toast } from "sonner"
import { Landmark, Plus, Search, CheckCircle2, Clock, ClipboardCheck } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import type { BankDeposit, PaymentReceipt, CollectionBankAccount } from "../data/mock-data"

interface BankDepositsProps {
  deposits: BankDeposit[]
  receipts: PaymentReceipt[]
  bankAccounts: CollectionBankAccount[]
  onCreateDeposit: (dep: Omit<BankDeposit, "id" | "depositSlipNo">) => void
  onConfirmDeposit: (id: string) => void
  onReconcileDeposit: (id: string) => void
}

const formatPHP = (val: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(val)

const depositStatusConfig = {
  pending: { label: "Pending", icon: Clock, className: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
  confirmed: { label: "Confirmed", icon: CheckCircle2, className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  reconciled: { label: "Reconciled", icon: ClipboardCheck, className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" },
}

export function BankDeposits({ deposits, receipts, bankAccounts, onCreateDeposit, onConfirmDeposit, onReconcileDeposit }: BankDepositsProps) {
  const [search, setSearch] = React.useState("")
  const [showCreate, setShowCreate] = React.useState(false)

  const [form, setForm] = React.useState({
    bankAccountId: "",
    selectedReceiptIds: [] as string[],
    depositDate: new Date().toISOString().split("T")[0],
  })

  const eligibleReceipts = React.useMemo(() => {
    const depositedIds = new Set(deposits.flatMap(d => d.receipts))
    return receipts.filter(r =>
      (r.status === "cleared" || r.status === "pending") &&
      !depositedIds.has(r.id)
    )
  }, [receipts, deposits])

  const toggleReceipt = (id: string) => {
    setForm(f => ({
      ...f,
      selectedReceiptIds: f.selectedReceiptIds.includes(id)
        ? f.selectedReceiptIds.filter(r => r !== id)
        : [...f.selectedReceiptIds, id],
    }))
  }

  const selectedTotal = receipts
    .filter(r => form.selectedReceiptIds.includes(r.id))
    .reduce((s, r) => s + r.amountReceived, 0)

  const handleCreate = () => {
    if (!form.bankAccountId || form.selectedReceiptIds.length === 0) {
      toast.error("Select a bank account and at least one receipt.")
      return
    }
    const bank = bankAccounts.find(b => b.id === form.bankAccountId)!
    onCreateDeposit({
      bankAccountId: form.bankAccountId,
      bankName: bank.name,
      receipts: form.selectedReceiptIds,
      totalAmount: selectedTotal,
      depositDate: form.depositDate,
      status: "pending",
    })
    setShowCreate(false)
    setForm({ bankAccountId: "", selectedReceiptIds: [], depositDate: new Date().toISOString().split("T")[0] })
    toast.success("Deposit slip created and pending confirmation.")
  }

  const filtered = deposits.filter(d =>
    d.depositSlipNo.toLowerCase().includes(search.toLowerCase()) ||
    d.bankName.toLowerCase().includes(search.toLowerCase())
  )

  const totalPending = deposits.filter(d => d.status === "pending").reduce((s, d) => s + d.totalAmount, 0)
  const totalConfirmed = deposits.filter(d => d.status === "confirmed").reduce((s, d) => s + d.totalAmount, 0)
  const totalReconciled = deposits.filter(d => d.status === "reconciled").reduce((s, d) => s + d.totalAmount, 0)

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Summary */}
      <div className="grid gap-4 grid-cols-3">
        <Card className="bg-card/40"><CardContent className="pt-5">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Pending Deposits</p>
          <p className="text-xl font-bold text-amber-500 mt-1">{formatPHP(totalPending)}</p>
        </CardContent></Card>
        <Card className="bg-card/40"><CardContent className="pt-5">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Confirmed</p>
          <p className="text-xl font-bold text-blue-500 mt-1">{formatPHP(totalConfirmed)}</p>
        </CardContent></Card>
        <Card className="bg-card/40"><CardContent className="pt-5">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Reconciled</p>
          <p className="text-xl font-bold text-emerald-500 mt-1">{formatPHP(totalReconciled)}</p>
        </CardContent></Card>
      </div>

      {/* Bank Account Balances */}
      <div className="grid gap-4 md:grid-cols-3">
        {bankAccounts.map(bank => (
          <Card key={bank.id} className="bg-card/40 border-l-4 border-l-primary/30">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs font-semibold text-muted-foreground truncate">{bank.name}</p>
              <p className="text-lg font-bold mt-1">{formatPHP(bank.balance)}</p>
              {bank.pendingDeposits > 0 && (
                <p className="text-xs text-amber-500 mt-0.5">+ {formatPHP(bank.pendingDeposits)} pending</p>
              )}
              <p className="text-[10px] text-muted-foreground font-mono mt-1">{bank.accountNo}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search deposits..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="size-4" /> New Deposit Slip
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="size-4 text-primary" /> Bank Deposit Register
          </CardTitle>
          <CardDescription>{filtered.length} deposit slip(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deposit Slip #</TableHead>
                  <TableHead>Bank Account</TableHead>
                  <TableHead className="text-right">Receipts</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead>Deposit Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No deposits found.</TableCell></TableRow>
                )}
                {filtered.map(dep => {
                  const sc = depositStatusConfig[dep.status]
                  const Icon = sc.icon
                  return (
                    <TableRow key={dep.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs font-medium">{dep.depositSlipNo}</TableCell>
                      <TableCell className="text-sm">{dep.bankName}</TableCell>
                      <TableCell className="text-right text-sm">{dep.receipts.length}</TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600">{formatPHP(dep.totalAmount)}</TableCell>
                      <TableCell className="text-xs">{dep.depositDate}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${sc.className}`}>
                          <Icon className="size-2.5" /> {sc.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {dep.status === "pending" && (
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-blue-600 border-blue-200" onClick={() => onConfirmDeposit(dep.id)}>
                              <CheckCircle2 className="size-3" /> Confirm
                            </Button>
                          )}
                          {dep.status === "confirmed" && (
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-emerald-600 border-emerald-200" onClick={() => onReconcileDeposit(dep.id)}>
                              <ClipboardCheck className="size-3" /> Reconcile
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

      {/* Create Deposit Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Deposit Slip</DialogTitle>
            <DialogDescription>Bundle cleared receipts into a bank deposit.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Collection Bank Account *</Label>
                <Select value={form.bankAccountId} onValueChange={v => setForm(f => ({ ...f, bankAccountId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select bank account" /></SelectTrigger>
                  <SelectContent>{bankAccounts.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Deposit Date *</Label>
                <Input type="date" value={form.depositDate} onChange={e => setForm(f => ({ ...f, depositDate: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Select Receipts *</Label>
              {eligibleReceipts.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No eligible receipts available.</p>
              ) : (
                <div className="rounded-lg border divide-y max-h-48 overflow-y-auto">
                  {eligibleReceipts.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-2.5 hover:bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`dep-${r.id}`}
                          checked={form.selectedReceiptIds.includes(r.id)}
                          onCheckedChange={() => toggleReceipt(r.id)}
                        />
                        <label htmlFor={`dep-${r.id}`} className="cursor-pointer">
                          <p className="text-xs font-medium">{r.receiptNo} — {r.clientName}</p>
                          <p className="text-[10px] text-muted-foreground">{r.paymentMethod} · {r.datePaid}</p>
                        </label>
                      </div>
                      <span className="text-xs font-semibold text-emerald-600">{formatPHP(r.amountReceived)}</span>
                    </div>
                  ))}
                </div>
              )}
              {form.selectedReceiptIds.length > 0 && (
                <p className="text-xs text-muted-foreground">Total: <strong className="text-foreground">{formatPHP(selectedTotal)}</strong> from {form.selectedReceiptIds.length} receipt(s)</p>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} className="gap-2"><Landmark className="size-4" /> Create Deposit Slip</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
