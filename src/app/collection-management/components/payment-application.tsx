"use client"

import * as React from "react"
import { toast } from "sonner"
import { CreditCard, Plus, Search, CheckCircle2, Clock, AlertCircle, DollarSign } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import type { PaymentReceipt, CollectionInvoice, CustomerAccount, CollectionBankAccount, PaymentMethod } from "../data/mock-data"

interface PaymentApplicationProps {
  receipts: PaymentReceipt[]
  invoices: CollectionInvoice[]
  customers: CustomerAccount[]
  bankAccounts: CollectionBankAccount[]
  onApplyPayment: (receipt: Omit<PaymentReceipt, "id" | "receiptNo" | "status">) => void
  onBounceReceipt: (id: string) => void
  onClearReceipt: (id: string) => void
}

const formatPHP = (val: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(val)

const receiptStatusConfig = {
  pending: { label: "Pending", icon: Clock, className: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
  cleared: { label: "Cleared", icon: CheckCircle2, className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" },
  bounced: { label: "Bounced", icon: AlertCircle, className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  reversed: { label: "Reversed", icon: AlertCircle, className: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400" },
}

const PAYMENT_METHODS: PaymentMethod[] = ["Cash", "Check", "Bank Transfer", "Online", "Credit Card", "PDC"]

export function PaymentApplication({ receipts, invoices, customers, bankAccounts, onApplyPayment, onBounceReceipt, onClearReceipt }: PaymentApplicationProps) {
  const [search, setSearch] = React.useState("")
  const [showCreate, setShowCreate] = React.useState(false)

  const [form, setForm] = React.useState({
    customerId: "",
    selectedInvoiceIds: [] as string[],
    paymentMethod: "Bank Transfer" as PaymentMethod,
    referenceNo: "",
    amountReceived: "",
    datePaid: new Date().toISOString().split("T")[0],
    bankDepositDate: "",
    bankAccountId: "",
    notes: "",
  })

  const customerInvoices = React.useMemo(() => {
    if (!form.customerId) return []
    return invoices.filter(i =>
      i.customerId === form.customerId &&
      i.status !== "paid" &&
      i.status !== "void" &&
      i.balanceAmount > 0
    )
  }, [invoices, form.customerId])

  const selectedTotal = React.useMemo(() => {
    return invoices
      .filter(i => form.selectedInvoiceIds.includes(i.id))
      .reduce((s, i) => s + i.balanceAmount, 0)
  }, [invoices, form.selectedInvoiceIds])

  const toggleInvoice = (id: string) => {
    setForm(f => ({
      ...f,
      selectedInvoiceIds: f.selectedInvoiceIds.includes(id)
        ? f.selectedInvoiceIds.filter(i => i !== id)
        : [...f.selectedInvoiceIds, id],
    }))
  }

  const handleSubmit = () => {
    const amount = parseFloat(form.amountReceived)
    if (!form.customerId || form.selectedInvoiceIds.length === 0 || amount <= 0 || !form.bankAccountId) {
      toast.error("Please fill all required fields and select at least one invoice.")
      return
    }
    const customer = customers.find(c => c.id === form.customerId)!
    onApplyPayment({
      customerId: form.customerId,
      clientName: customer.clientName,
      invoiceIds: form.selectedInvoiceIds,
      paymentMethod: form.paymentMethod,
      referenceNo: form.referenceNo,
      amountReceived: amount,
      datePaid: form.datePaid,
      bankDepositDate: form.bankDepositDate || undefined,
      bankAccountId: form.bankAccountId,
      notes: form.notes,
    })
    setShowCreate(false)
    setForm({ customerId: "", selectedInvoiceIds: [], paymentMethod: "Bank Transfer", referenceNo: "", amountReceived: "", datePaid: new Date().toISOString().split("T")[0], bankDepositDate: "", bankAccountId: "", notes: "" })
  }

  const filtered = receipts.filter(r =>
    r.clientName.toLowerCase().includes(search.toLowerCase()) ||
    r.receiptNo.toLowerCase().includes(search.toLowerCase()) ||
    r.referenceNo.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search receipts..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="size-4" /> Record Payment
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Received", value: formatPHP(receipts.reduce((s,r) => s + r.amountReceived, 0)), color: "text-emerald-500" },
          { label: "Cleared", value: formatPHP(receipts.filter(r => r.status === "cleared").reduce((s,r) => s + r.amountReceived, 0)), color: "text-emerald-500" },
          { label: "Pending / PDC", value: formatPHP(receipts.filter(r => r.status === "pending").reduce((s,r) => s + r.amountReceived, 0)), color: "text-amber-500" },
          { label: "Bounced", value: formatPHP(receipts.filter(r => r.status === "bounced").reduce((s,r) => s + r.amountReceived, 0)), color: "text-red-500" },
        ].map(c => (
          <Card key={c.label} className="bg-card/40">
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{c.label}</p>
              <p className={`text-xl font-bold mt-1 ${c.color}`}>{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="size-4 text-primary" />
            Payment Receipts
          </CardTitle>
          <CardDescription>{filtered.length} receipt(s) on file</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt No.</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Date Paid</TableHead>
                  <TableHead>Deposit Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No receipts found.</TableCell></TableRow>
                )}
                {filtered.map(rec => {
                  const sc = receiptStatusConfig[rec.status]
                  const Icon = sc.icon
                  return (
                    <TableRow key={rec.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs font-medium">{rec.receiptNo}</TableCell>
                      <TableCell className="text-sm font-medium">{rec.clientName}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{rec.paymentMethod}</Badge></TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{rec.referenceNo}</TableCell>
                      <TableCell className="text-xs">{rec.datePaid}</TableCell>
                      <TableCell className="text-xs">{rec.bankDepositDate ?? <span className="text-muted-foreground italic">Not yet</span>}</TableCell>
                      <TableCell className="text-right font-semibold text-sm text-emerald-600">{formatPHP(rec.amountReceived)}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${sc.className}`}>
                          <Icon className="size-2.5" /> {sc.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {rec.status === "pending" && (
                            <>
                              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => onClearReceipt(rec.id)}>
                                <CheckCircle2 className="size-3" /> Clear
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-red-500 border-red-200 hover:bg-red-50" onClick={() => onBounceReceipt(rec.id)}>
                                <AlertCircle className="size-3" /> Bounce
                              </Button>
                            </>
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

      {/* Record Payment Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Payment Receipt</DialogTitle>
            <DialogDescription>Apply an incoming payment against outstanding invoices.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Client *</Label>
              <Select value={form.customerId} onValueChange={v => setForm(f => ({ ...f, customerId: v, selectedInvoiceIds: [] }))}>
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>
                  {customers.filter(c => c.status !== "closed").map(c => <SelectItem key={c.id} value={c.id}>{c.clientName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {form.customerId && customerInvoices.length > 0 && (
              <div className="space-y-1.5">
                <Label>Apply to Invoices *</Label>
                <div className="rounded-lg border divide-y max-h-36 overflow-y-auto">
                  {customerInvoices.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between p-2.5 hover:bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={inv.id}
                          checked={form.selectedInvoiceIds.includes(inv.id)}
                          onCheckedChange={() => toggleInvoice(inv.id)}
                        />
                        <label htmlFor={inv.id} className="cursor-pointer">
                          <p className="text-xs font-medium">{inv.invoiceNo}</p>
                          <p className="text-[10px] text-muted-foreground">{inv.dueDate}</p>
                        </label>
                      </div>
                      <span className="text-xs font-semibold text-red-500">{formatPHP(inv.balanceAmount)}</span>
                    </div>
                  ))}
                </div>
                {form.selectedInvoiceIds.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Selected balance: <strong className="text-foreground">{formatPHP(selectedTotal)}</strong>
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Payment Method *</Label>
                <Select value={form.paymentMethod} onValueChange={v => setForm(f => ({ ...f, paymentMethod: v as PaymentMethod }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Collection Account *</Label>
                <Select value={form.bankAccountId} onValueChange={v => setForm(f => ({ ...f, bankAccountId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                  <SelectContent>{bankAccounts.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Reference No.</Label>
                <Input placeholder="Check #, bank ref..." value={form.referenceNo} onChange={e => setForm(f => ({ ...f, referenceNo: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Amount Received (PHP) *</Label>
                <Input type="number" placeholder="0.00" value={form.amountReceived} onChange={e => setForm(f => ({ ...f, amountReceived: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Date Paid *</Label>
                <Input type="date" value={form.datePaid} onChange={e => setForm(f => ({ ...f, datePaid: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Deposit Date</Label>
                <Input type="date" value={form.bankDepositDate} onChange={e => setForm(f => ({ ...f, bankDepositDate: e.target.value }))} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Notes</Label>
                <Textarea rows={2} placeholder="Optional notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleSubmit} className="gap-2">
                <DollarSign className="size-4" /> Apply Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
