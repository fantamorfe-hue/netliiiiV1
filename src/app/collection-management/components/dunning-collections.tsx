"use client"

import * as React from "react"
import { toast } from "sonner"
import { Bell, Phone, Mail, MessageSquare, FileText, UserCheck, Plus, Search, AlertTriangle, CheckCircle2, XCircle, Clock, ArrowUpRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import type { DunningActivity, PromiseToPay, CustomerAccount, CollectionInvoice, DunningStage } from "../data/mock-data"

interface DunningCollectionsProps {
  dunningActivities: DunningActivity[]
  promisesToPay: PromiseToPay[]
  customers: CustomerAccount[]
  invoices: CollectionInvoice[]
  onAddDunning: (act: Omit<DunningActivity, "id">) => void
  onAddPromise: (ptp: Omit<PromiseToPay, "id" | "createdDate">) => void
  onMarkPtpKept: (id: string) => void
  onMarkPtpBroken: (id: string) => void
  onEscalate: (customerId: string) => void
}

const formatPHP = (val: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(val)

const dunningStageConfig: Record<DunningStage, { label: string; className: string }> = {
  none: { label: "No Action", className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
  reminder: { label: "Reminder", className: "bg-lime-100 text-lime-700 dark:bg-lime-900 dark:text-lime-300" },
  first_notice: { label: "1st Notice", className: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
  second_notice: { label: "2nd Notice", className: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
  final_notice: { label: "Final Notice", className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  legal: { label: "Legal", className: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300" },
}

const outcomeConfig: Record<string, { icon: React.ElementType; className: string }> = {
  no_response: { icon: XCircle, className: "text-red-500" },
  promised_payment: { icon: Clock, className: "text-amber-500" },
  dispute_raised: { icon: AlertTriangle, className: "text-purple-500" },
  paid: { icon: CheckCircle2, className: "text-emerald-500" },
  escalated: { icon: ArrowUpRight, className: "text-rose-600" },
  pending: { icon: Clock, className: "text-muted-foreground" },
}

const methodIcons: Record<string, React.ElementType> = {
  Email: Mail,
  "Phone Call": Phone,
  SMS: MessageSquare,
  Letter: FileText,
  Visit: UserCheck,
  "Legal Notice": AlertTriangle,
}

const REPS = ["Jenny Cruz", "Mark Reyes", "Paul Villar"]

export function DunningCollections({ dunningActivities, promisesToPay, customers, invoices, onAddDunning, onAddPromise, onMarkPtpKept, onMarkPtpBroken, onEscalate }: DunningCollectionsProps) {
  const [tab, setTab] = React.useState<"activity" | "ptp">("activity")
  const [search, setSearch] = React.useState("")
  const [showDunning, setShowDunning] = React.useState(false)
  const [showPtp, setShowPtp] = React.useState(false)

  const [dunForm, setDunForm] = React.useState({
    customerId: "", invoiceId: "", stage: "reminder" as DunningStage,
    method: "Email" as DunningActivity["method"],
    sentDate: new Date().toISOString().split("T")[0],
    assignedTo: "Jenny Cruz", response: "",
    outcome: "pending" as DunningActivity["outcome"],
  })

  const [ptpForm, setPtpForm] = React.useState({
    customerId: "", invoiceId: "",
    promisedAmount: "", promisedDate: "",
    collectionRep: "Jenny Cruz", notes: "",
  })

  const handleAddDunning = () => {
    if (!dunForm.customerId || !dunForm.invoiceId) {
      toast.error("Select a customer and invoice.")
      return
    }
    const customer = customers.find(c => c.id === dunForm.customerId)!
    onAddDunning({
      customerId: dunForm.customerId,
      clientName: customer.clientName,
      invoiceId: dunForm.invoiceId,
      stage: dunForm.stage,
      method: dunForm.method,
      sentDate: dunForm.sentDate,
      assignedTo: dunForm.assignedTo,
      response: dunForm.response || undefined,
      outcome: dunForm.outcome,
    })
    setShowDunning(false)
    toast.success("Dunning activity logged.")
  }

  const handleAddPtp = () => {
    const amount = parseFloat(ptpForm.promisedAmount)
    if (!ptpForm.customerId || !ptpForm.invoiceId || amount <= 0 || !ptpForm.promisedDate) {
      toast.error("Fill all required fields.")
      return
    }
    const customer = customers.find(c => c.id === ptpForm.customerId)!
    onAddPromise({
      customerId: ptpForm.customerId,
      clientName: customer.clientName,
      invoiceId: ptpForm.invoiceId,
      promisedAmount: amount,
      promisedDate: ptpForm.promisedDate,
      status: "pending",
      collectionRep: ptpForm.collectionRep,
      notes: ptpForm.notes || undefined,
    })
    setShowPtp(false)
    toast.success("Promise to Pay recorded.")
  }

  const filteredDunning = dunningActivities.filter(d =>
    d.clientName.toLowerCase().includes(search.toLowerCase())
  )
  const filteredPtp = promisesToPay.filter(p =>
    p.clientName.toLowerCase().includes(search.toLowerCase())
  )

  const customerInvoicesByCustomer = (customerId: string) =>
    invoices.filter(i => i.customerId === customerId && i.balanceAmount > 0)

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Tab Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <Button variant={tab === "activity" ? "default" : "outline"} size="sm" onClick={() => setTab("activity")} className="gap-2">
            <Bell className="size-4" /> Dunning Activity
          </Button>
          <Button variant={tab === "ptp" ? "default" : "outline"} size="sm" onClick={() => setTab("ptp")} className="gap-2">
            <Clock className="size-4" /> Promises to Pay
          </Button>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-9 w-48" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {tab === "activity" ? (
            <Button size="sm" onClick={() => setShowDunning(true)} className="gap-2"><Plus className="size-4" /> Log Activity</Button>
          ) : (
            <Button size="sm" onClick={() => setShowPtp(true)} className="gap-2"><Plus className="size-4" /> Add Promise</Button>
          )}
        </div>
      </div>

      {/* Customer Risk Overview */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {customers.filter(c => c.dunningStage !== "none" && c.overdueBalance > 0).map(c => {
          const sc = dunningStageConfig[c.dunningStage]
          return (
            <Card key={c.id} className="border-l-4 transition-all hover:shadow-sm" style={{ borderLeftColor: c.dunningStage === "final_notice" ? "#ef4444" : c.dunningStage === "second_notice" ? "#f97316" : c.dunningStage === "first_notice" ? "#eab308" : "#84cc16" }}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{c.clientName}</p>
                    <p className="text-xs text-muted-foreground">{c.contactPerson} · {c.collectionRep}</p>
                    <p className="text-lg font-bold text-red-500 mt-1">{formatPHP(c.overdueBalance)}</p>
                    <p className="text-[10px] text-muted-foreground">overdue · {c.agingBucket}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${sc.className}`}>{sc.label}</span>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => onEscalate(c.id)}>
                      <ArrowUpRight className="size-3" /> Escalate
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Activity Log */}
      {tab === "activity" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="size-4 text-primary" /> Dunning Activity Log
            </CardTitle>
            <CardDescription>All collection communication records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Response</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Outcome</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDunning.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No activity logged.</TableCell></TableRow>
                  )}
                  {filteredDunning.map(act => {
                    const sc = dunningStageConfig[act.stage]
                    const oc = outcomeConfig[act.outcome]
                    const OIcon = oc.icon
                    const MIcon = methodIcons[act.method] ?? Mail
                    return (
                      <TableRow key={act.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium text-sm">{act.clientName}</TableCell>
                        <TableCell>
                          <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${sc.className}`}>{sc.label}</span>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1.5 text-xs"><MIcon className="size-3.5 text-muted-foreground" />{act.method}</span>
                        </TableCell>
                        <TableCell className="text-xs">{act.sentDate}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate">{act.response ?? "—"}</TableCell>
                        <TableCell className="text-xs">{act.assignedTo}</TableCell>
                        <TableCell>
                          <span className={`flex items-center gap-1 text-xs font-medium ${oc.className}`}>
                            <OIcon className="size-3.5" />{act.outcome.replace(/_/g, " ")}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Promises to Pay */}
      {tab === "ptp" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-4 text-primary" /> Promises to Pay
            </CardTitle>
            <CardDescription>Track client payment commitments and adherence</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead className="text-right">Promised Amount</TableHead>
                    <TableHead>Promised Date</TableHead>
                    <TableHead>Rep</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPtp.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No promises recorded.</TableCell></TableRow>
                  )}
                  {filteredPtp.map(p => (
                    <TableRow key={p.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium text-sm">{p.clientName}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{p.invoiceId}</TableCell>
                      <TableCell className="text-right font-semibold">{formatPHP(p.promisedAmount)}</TableCell>
                      <TableCell className="text-xs">{p.promisedDate}</TableCell>
                      <TableCell className="text-xs">{p.collectionRep}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${p.status === "kept" ? "border-emerald-400 text-emerald-600" : p.status === "broken" ? "border-red-400 text-red-600" : p.status === "rescheduled" ? "border-amber-400 text-amber-600" : "border-blue-400 text-blue-600"}`}
                        >
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {p.status === "pending" && (
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-600 border-emerald-200" onClick={() => onMarkPtpKept(p.id)}>
                              <CheckCircle2 className="size-3 mr-1" /> Kept
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs text-red-500 border-red-200" onClick={() => onMarkPtpBroken(p.id)}>
                              <XCircle className="size-3 mr-1" /> Broken
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Log Dunning Dialog */}
      <Dialog open={showDunning} onOpenChange={setShowDunning}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Dunning Activity</DialogTitle>
            <DialogDescription>Record a collection communication action.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Client *</Label>
              <Select value={dunForm.customerId} onValueChange={v => setDunForm(f => ({ ...f, customerId: v, invoiceId: "" }))}>
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.clientName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {dunForm.customerId && (
              <div className="space-y-1.5">
                <Label>Invoice *</Label>
                <Select value={dunForm.invoiceId} onValueChange={v => setDunForm(f => ({ ...f, invoiceId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select invoice" /></SelectTrigger>
                  <SelectContent>
                    {customerInvoicesByCustomer(dunForm.customerId).map(i => (
                      <SelectItem key={i.id} value={i.id}>{i.invoiceNo} — {formatPHP(i.balanceAmount)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Stage</Label>
                <Select value={dunForm.stage} onValueChange={v => setDunForm(f => ({ ...f, stage: v as DunningStage }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["reminder", "first_notice", "second_notice", "final_notice", "legal"] as DunningStage[]).map(s => (
                      <SelectItem key={s} value={s}>{dunningStageConfig[s].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Method</Label>
                <Select value={dunForm.method} onValueChange={v => setDunForm(f => ({ ...f, method: v as DunningActivity["method"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Email", "Phone Call", "SMS", "Letter", "Visit", "Legal Notice"].map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Date Sent</Label>
                <Input type="date" value={dunForm.sentDate} onChange={e => setDunForm(f => ({ ...f, sentDate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Assigned To</Label>
                <Select value={dunForm.assignedTo} onValueChange={v => setDunForm(f => ({ ...f, assignedTo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{REPS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Outcome</Label>
                <Select value={dunForm.outcome} onValueChange={v => setDunForm(f => ({ ...f, outcome: v as DunningActivity["outcome"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["pending", "no_response", "promised_payment", "dispute_raised", "paid", "escalated"].map(o => (
                      <SelectItem key={o} value={o}>{o.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Response Notes</Label>
                <Textarea rows={2} placeholder="Client response..." value={dunForm.response} onChange={e => setDunForm(f => ({ ...f, response: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDunning(false)}>Cancel</Button>
              <Button onClick={handleAddDunning} className="gap-2"><Bell className="size-4" /> Log Activity</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add PTP Dialog */}
      <Dialog open={showPtp} onOpenChange={setShowPtp}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Promise to Pay</DialogTitle>
            <DialogDescription>Record a client commitment to settle an invoice.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Client *</Label>
              <Select value={ptpForm.customerId} onValueChange={v => setPtpForm(f => ({ ...f, customerId: v, invoiceId: "" }))}>
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.clientName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {ptpForm.customerId && (
              <div className="space-y-1.5">
                <Label>Invoice *</Label>
                <Select value={ptpForm.invoiceId} onValueChange={v => setPtpForm(f => ({ ...f, invoiceId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select invoice" /></SelectTrigger>
                  <SelectContent>
                    {customerInvoicesByCustomer(ptpForm.customerId).map(i => (
                      <SelectItem key={i.id} value={i.id}>{i.invoiceNo} — {formatPHP(i.balanceAmount)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Promised Amount (PHP) *</Label>
                <Input type="number" value={ptpForm.promisedAmount} onChange={e => setPtpForm(f => ({ ...f, promisedAmount: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Promised Date *</Label>
                <Input type="date" value={ptpForm.promisedDate} onChange={e => setPtpForm(f => ({ ...f, promisedDate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Collection Rep</Label>
                <Select value={ptpForm.collectionRep} onValueChange={v => setPtpForm(f => ({ ...f, collectionRep: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{REPS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Notes</Label>
                <Textarea rows={2} value={ptpForm.notes} onChange={e => setPtpForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowPtp(false)}>Cancel</Button>
              <Button onClick={handleAddPtp} className="gap-2"><CheckCircle2 className="size-4" /> Record Promise</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
