"use client"

import * as React from "react"
import { toast } from "sonner"
import { ReceiptText, Plus, Search, CheckCircle2, Pencil } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import type { CreditNote, CustomerAccount, CollectionInvoice } from "../data/mock-data"

interface CreditNotesProps {
  creditNotes: CreditNote[]
  customers: CustomerAccount[]
  invoices: CollectionInvoice[]
  onCreateCreditNote: (cn: Omit<CreditNote, "id" | "creditNoteNo" | "status">) => void
  onApplyCreditNote: (cnId: string, invoiceId: string) => void
  onVoidCreditNote: (cnId: string) => void
}

const formatPHP = (val: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(val)

const REASONS: CreditNote["reason"][] = [
  "Price Adjustment", "Service Failure", "Overpayment", "Discount", "Write-off", "Contract Dispute"
]

const statusConfig = {
  draft: { label: "Draft", className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
  applied: { label: "Applied", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" },
  voided: { label: "Voided", className: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300" },
}

export function CreditNotes({ creditNotes, customers, invoices, onCreateCreditNote, onApplyCreditNote, onVoidCreditNote }: CreditNotesProps) {
  const [search, setSearch] = React.useState("")
  const [showCreate, setShowCreate] = React.useState(false)
  const [applyDialog, setApplyDialog] = React.useState<{ cn: CreditNote; open: boolean } | null>(null)
  const [applyInvoiceId, setApplyInvoiceId] = React.useState("")

  const [form, setForm] = React.useState({
    customerId: "", invoiceId: "",
    reason: "Price Adjustment" as CreditNote["reason"],
    amount: "", date: new Date().toISOString().split("T")[0],
  })

  const handleCreate = () => {
    const amount = parseFloat(form.amount)
    if (!form.customerId || amount <= 0) {
      toast.error("Fill all required fields.")
      return
    }
    const customer = customers.find(c => c.id === form.customerId)!
    onCreateCreditNote({
      customerId: form.customerId,
      clientName: customer.clientName,
      invoiceId: form.invoiceId || undefined,
      reason: form.reason,
      amount,
      date: form.date,
    })
    setShowCreate(false)
    setForm({ customerId: "", invoiceId: "", reason: "Price Adjustment", amount: "", date: new Date().toISOString().split("T")[0] })
    toast.success("Credit note drafted.")
  }

  const handleApply = () => {
    if (!applyDialog || !applyInvoiceId) {
      toast.error("Select an invoice to apply this credit note.")
      return
    }
    onApplyCreditNote(applyDialog.cn.id, applyInvoiceId)
    setApplyDialog(null)
    setApplyInvoiceId("")
    toast.success(`Credit note ${applyDialog.cn.creditNoteNo} applied.`)
  }

  const filtered = creditNotes.filter(cn =>
    cn.clientName.toLowerCase().includes(search.toLowerCase()) ||
    cn.creditNoteNo.toLowerCase().includes(search.toLowerCase())
  )

  const totalDrafted = creditNotes.filter(cn => cn.status === "draft").reduce((s, cn) => s + cn.amount, 0)
  const totalApplied = creditNotes.filter(cn => cn.status === "applied").reduce((s, cn) => s + cn.amount, 0)

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Summary */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card/40"><CardContent className="pt-5">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Credit Notes</p>
          <p className="text-2xl font-bold mt-1">{creditNotes.length}</p>
        </CardContent></Card>
        <Card className="bg-card/40"><CardContent className="pt-5">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Draft (Unapplied)</p>
          <p className="text-2xl font-bold text-amber-500 mt-1">{formatPHP(totalDrafted)}</p>
        </CardContent></Card>
        <Card className="bg-card/40"><CardContent className="pt-5">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Applied This Period</p>
          <p className="text-2xl font-bold text-emerald-500 mt-1">{formatPHP(totalApplied)}</p>
        </CardContent></Card>
        <Card className="bg-card/40"><CardContent className="pt-5">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Voided</p>
          <p className="text-2xl font-bold text-muted-foreground mt-1">{creditNotes.filter(cn => cn.status === "voided").length}</p>
        </CardContent></Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search credit notes..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="size-4" /> New Credit Note
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ReceiptText className="size-4 text-primary" /> Credit Notes
          </CardTitle>
          <CardDescription>{filtered.length} record(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Credit Note #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Applied To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No credit notes found.</TableCell></TableRow>
                )}
                {filtered.map(cn => {
                  const sc = statusConfig[cn.status]
                  const appliedInv = cn.appliedToInvoiceId ? invoices.find(i => i.id === cn.appliedToInvoiceId) : null
                  return (
                    <TableRow key={cn.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs font-medium">{cn.creditNoteNo}</TableCell>
                      <TableCell className="text-sm font-medium">{cn.clientName}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{cn.reason}</Badge></TableCell>
                      <TableCell className="text-xs">{cn.date}</TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600">{formatPHP(cn.amount)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">{appliedInv ? appliedInv.invoiceNo : "—"}</TableCell>
                      <TableCell>
                        <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${sc.className}`}>{sc.label}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        {cn.status === "draft" && (
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-emerald-600 border-emerald-200" onClick={() => { setApplyDialog({ cn, open: true }); setApplyInvoiceId("") }}>
                              <Pencil className="size-3" /> Apply
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs text-red-500 border-red-200" onClick={() => onVoidCreditNote(cn.id)}>
                              Void
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Credit Note</DialogTitle>
            <DialogDescription>Issue a credit adjustment against a customer account.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Client *</Label>
              <Select value={form.customerId} onValueChange={v => setForm(f => ({ ...f, customerId: v, invoiceId: "" }))}>
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.clientName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {form.customerId && (
              <div className="space-y-1.5">
                <Label>Related Invoice (optional)</Label>
                <Select value={form.invoiceId} onValueChange={v => setForm(f => ({ ...f, invoiceId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select invoice (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {invoices.filter(i => i.customerId === form.customerId).map(i => (
                      <SelectItem key={i.id} value={i.id}>{i.invoiceNo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Reason *</Label>
                <Select value={form.reason} onValueChange={v => setForm(f => ({ ...f, reason: v as CreditNote["reason"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Credit Amount (PHP) *</Label>
                <Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} className="gap-2"><ReceiptText className="size-4" /> Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Apply Dialog */}
      <Dialog open={!!applyDialog?.open} onOpenChange={() => setApplyDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Apply Credit Note</DialogTitle>
            <DialogDescription>{applyDialog?.cn.creditNoteNo} — {applyDialog ? formatPHP(applyDialog.cn.amount) : ""}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Apply to Invoice *</Label>
              <Select value={applyInvoiceId} onValueChange={setApplyInvoiceId}>
                <SelectTrigger><SelectValue placeholder="Select invoice" /></SelectTrigger>
                <SelectContent>
                  {invoices.filter(i => i.customerId === applyDialog?.cn.customerId && i.balanceAmount > 0).map(i => (
                    <SelectItem key={i.id} value={i.id}>{i.invoiceNo} — {formatPHP(i.balanceAmount)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setApplyDialog(null)}>Cancel</Button>
              <Button onClick={handleApply} className="gap-2"><CheckCircle2 className="size-4" /> Apply Credit</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
