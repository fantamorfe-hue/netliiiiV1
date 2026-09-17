"use client"

import * as React from "react"
import { toast } from "sonner"
import { FileText, Plus, Search, Filter, Eye, SendHorizonal, X, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { CollectionInvoice, CustomerAccount, InvoiceStatus, SubsystemSource } from "../data/mock-data"

interface InvoiceManagementProps {
  invoices: CollectionInvoice[]
  customers: CustomerAccount[]
  onIssueInvoice: (inv: Omit<CollectionInvoice, "id" | "invoiceNo" | "paidAmount" | "balanceAmount" | "status" | "agingBucket" | "dunningStage">) => void
  onVoidInvoice: (id: string) => void
  onMarkDisputed: (id: string) => void
}

const formatPHP = (val: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(val)

const statusConfig: Record<InvoiceStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  issued: { label: "Issued", className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  partially_paid: { label: "Partial", className: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
  paid: { label: "Paid", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" },
  overdue: { label: "Overdue", className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  void: { label: "Void", className: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400" },
  disputed: { label: "Disputed", className: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" },
}

const agingBadge: Record<string, string> = {
  current: "border-emerald-400 text-emerald-600",
  "1-30": "border-amber-400 text-amber-600",
  "31-60": "border-orange-400 text-orange-600",
  "61-90": "border-red-400 text-red-600",
  over_90: "border-rose-700 text-rose-700",
}

const SUBSYSTEMS: SubsystemSource[] = [
  "Client Acquisition", "HRIS Payroll", "Regional Deployment", "Client Site Operations",
  "Supply Chain", "CRM", "Governance & Admin", "Benefits & Compliance"
]

export function InvoiceManagement({ invoices, customers, onIssueInvoice, onVoidInvoice, onMarkDisputed }: InvoiceManagementProps) {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [showCreate, setShowCreate] = React.useState(false)
  const [selectedInvoice, setSelectedInvoice] = React.useState<CollectionInvoice | null>(null)

  // New invoice form
  const [form, setForm] = React.useState({
    customerId: "", subsystem: "Client Site Operations" as SubsystemSource,
    description: "", issueDate: new Date().toISOString().split("T")[0],
    dueDate: "", grossAmount: "", taxRate: "12",
    paymentTerms: "Net 30",
  })

  const filtered = React.useMemo(() => {
    return invoices.filter(inv => {
      const matchSearch = inv.clientName.toLowerCase().includes(search.toLowerCase()) ||
        inv.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
        inv.description.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === "all" || inv.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [invoices, search, statusFilter])

  const gross = parseFloat(form.grossAmount) || 0
  const tax = gross * (parseFloat(form.taxRate) / 100)
  const total = gross + tax

  const handleSubmit = () => {
    if (!form.customerId || !form.dueDate || gross <= 0) {
      toast.error("Please fill all required fields.")
      return
    }
    const customer = customers.find(c => c.id === form.customerId)!
    onIssueInvoice({
      customerId: form.customerId,
      clientName: customer.clientName,
      subsystem: form.subsystem,
      description: form.description,
      issueDate: form.issueDate,
      dueDate: form.dueDate,
      grossAmount: gross,
      taxAmount: tax,
      totalAmount: total,
      paymentTerms: form.paymentTerms,
    })
    setShowCreate(false)
    setForm({ customerId: "", subsystem: "Facilities", description: "", issueDate: new Date().toISOString().split("T")[0], dueDate: "", grossAmount: "", taxRate: "12", paymentTerms: "Net 30" })
  }

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search invoices..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <Filter className="size-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="issued">Issued</SelectItem>
              <SelectItem value="partially_paid">Partial</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="disputed">Disputed</SelectItem>
              <SelectItem value="void">Void</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="size-4" /> New Invoice
        </Button>
      </div>

      {/* Invoice Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            Service Invoices
          </CardTitle>
          <CardDescription>{filtered.length} invoice(s) shown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Subsystem</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Aging</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">No invoices found.</TableCell></TableRow>
                )}
                {filtered.map(inv => {
                  const sc = statusConfig[inv.status]
                  return (
                    <TableRow key={inv.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs font-medium">{inv.invoiceNo}</TableCell>
                      <TableCell className="text-sm font-medium">{inv.clientName}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{inv.subsystem}</Badge></TableCell>
                      <TableCell className="text-xs">{inv.issueDate}</TableCell>
                      <TableCell className="text-xs">{inv.dueDate}</TableCell>
                      <TableCell className="text-right font-medium text-sm">{formatPHP(inv.totalAmount)}</TableCell>
                      <TableCell className={`text-right font-semibold text-sm ${inv.balanceAmount > 0 ? "text-red-500" : "text-emerald-500"}`}>
                        {formatPHP(inv.balanceAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${agingBadge[inv.agingBucket]}`}>
                          {inv.agingBucket === "over_90" ? ">90d" : inv.agingBucket}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${sc.className}`}>
                          {sc.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setSelectedInvoice(inv)}>
                            <Eye className="size-3.5" />
                          </Button>
                          {(inv.status === "issued" || inv.status === "overdue") && (
                            <>
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-amber-600 hover:text-amber-700" onClick={() => onMarkDisputed(inv.id)}>
                                <SendHorizonal className="size-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-red-500 hover:text-red-600" onClick={() => onVoidInvoice(inv.id)}>
                                <X className="size-3.5" />
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

      {/* Create Invoice Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
            <DialogDescription>Issue a service invoice linked to an ISMERS subsystem.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-4 grid-cols-2">
              <div className="col-span-2 space-y-1.5">
                <Label>Client *</Label>
                <Select value={form.customerId} onValueChange={v => setForm(f => ({ ...f, customerId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>
                    {customers.filter(c => c.status !== "closed").map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.clientName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Subsystem *</Label>
                <Select value={form.subsystem} onValueChange={v => setForm(f => ({ ...f, subsystem: v as SubsystemSource }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SUBSYSTEMS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Payment Terms</Label>
                <Select value={form.paymentTerms} onValueChange={v => setForm(f => ({ ...f, paymentTerms: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Net 15", "Net 30", "Net 45", "Net 60", "COD"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Issue Date *</Label>
                <Input type="date" value={form.issueDate} onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Due Date *</Label>
                <Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Gross Amount (PHP) *</Label>
                <Input type="number" placeholder="0.00" value={form.grossAmount} onChange={e => setForm(f => ({ ...f, grossAmount: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>VAT Rate (%)</Label>
                <Input type="number" value={form.taxRate} onChange={e => setForm(f => ({ ...f, taxRate: e.target.value }))} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Description</Label>
                <Textarea rows={2} placeholder="Service description..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
            {gross > 0 && (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Gross</span><span>{formatPHP(gross)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">VAT ({form.taxRate}%)</span><span>{formatPHP(tax)}</span></div>
                <div className="flex justify-between font-semibold border-t pt-1 mt-1"><span>Total</span><span>{formatPHP(total)}</span></div>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleSubmit} className="gap-2"><CheckCircle2 className="size-4" /> Issue Invoice</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedInvoice?.invoiceNo}</DialogTitle>
            <DialogDescription>{selectedInvoice?.clientName}</DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-3 text-sm">
              <div className="rounded-lg border bg-muted/20 p-4 space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Subsystem</span><span>{selectedInvoice.subsystem}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Description</span><span className="text-right max-w-[200px] text-xs">{selectedInvoice.description}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Issue Date</span><span>{selectedInvoice.issueDate}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Due Date</span><span>{selectedInvoice.dueDate}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Payment Terms</span><span>{selectedInvoice.paymentTerms}</span></div>
              </div>
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Gross</span><span>{formatPHP(selectedInvoice.grossAmount)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">VAT</span><span>{formatPHP(selectedInvoice.taxAmount)}</span></div>
                <div className="flex justify-between font-semibold border-t pt-2 mt-1"><span>Total Amount</span><span>{formatPHP(selectedInvoice.totalAmount)}</span></div>
                <div className="flex justify-between text-emerald-600"><span>Paid</span><span>{formatPHP(selectedInvoice.paidAmount)}</span></div>
                <div className="flex justify-between font-bold text-red-500"><span>Balance Due</span><span>{formatPHP(selectedInvoice.balanceAmount)}</span></div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusConfig[selectedInvoice.status].className}`}>
                  {statusConfig[selectedInvoice.status].label}
                </span>
                <Badge variant="outline" className={agingBadge[selectedInvoice.agingBucket]}>
                  {selectedInvoice.agingBucket === "over_90" ? ">90 Days" : selectedInvoice.agingBucket}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
