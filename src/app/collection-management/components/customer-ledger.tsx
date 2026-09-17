"use client"

import * as React from "react"
import { Users, Search, Filter, Eye, TrendingUp, TrendingDown, Shield, Ban, CircleCheck } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import type { CustomerAccount, CollectionInvoice, PaymentReceipt, DunningStage } from "../data/mock-data"

interface CustomerLedgerProps {
  customers: CustomerAccount[]
  invoices: CollectionInvoice[]
  receipts: PaymentReceipt[]
  onHoldCustomer: (id: string) => void
  onActivateCustomer: (id: string) => void
}

const formatPHP = (val: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(val)

const customerStatusConfig = {
  active: { label: "Active", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" },
  on_hold: { label: "On Hold", className: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
  suspended: { label: "Suspended", className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  closed: { label: "Closed", className: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400" },
}

const dunningBadge: Record<DunningStage, string> = {
  none: "border-emerald-400 text-emerald-600",
  reminder: "border-lime-400 text-lime-600",
  first_notice: "border-amber-400 text-amber-600",
  second_notice: "border-orange-400 text-orange-600",
  final_notice: "border-red-400 text-red-600",
  legal: "border-rose-700 text-rose-700",
}

const dunningLabel: Record<DunningStage, string> = {
  none: "None",
  reminder: "Reminder",
  first_notice: "1st Notice",
  second_notice: "2nd Notice",
  final_notice: "Final Notice",
  legal: "Legal",
}

export function CustomerLedger({ customers, invoices, receipts, onHoldCustomer, onActivateCustomer }: CustomerLedgerProps) {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [selectedCustomer, setSelectedCustomer] = React.useState<CustomerAccount | null>(null)

  const filtered = React.useMemo(() => {
    return customers.filter(c => {
      const matchSearch = c.clientName.toLowerCase().includes(search.toLowerCase()) ||
        c.clientCode.toLowerCase().includes(search.toLowerCase()) ||
        c.industry.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === "all" || c.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [customers, search, statusFilter])

  const getCustomerInvoices = (customerId: string) =>
    invoices.filter(i => i.customerId === customerId)

  const getCustomerReceipts = (customerId: string) =>
    receipts.filter(r => r.customerId === customerId)

  const totalAR = customers.reduce((s, c) => s + c.currentBalance, 0)
  const totalOverdue = customers.reduce((s, c) => s + c.overdueBalance, 0)
  const activeCount = customers.filter(c => c.status === "active").length
  const atRiskCount = customers.filter(c => c.dunningStage !== "none").length

  const selectedInvoices = selectedCustomer ? getCustomerInvoices(selectedCustomer.id) : []
  const selectedReceipts = selectedCustomer ? getCustomerReceipts(selectedCustomer.id) : []

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* KPI Row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card/40"><CardContent className="pt-5">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Clients</p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold">{customers.length}</span>
            <span className="text-xs text-emerald-500">{activeCount} active</span>
          </div>
        </CardContent></Card>
        <Card className="bg-card/40"><CardContent className="pt-5">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total AR Balance</p>
          <p className="text-xl font-bold mt-1">{formatPHP(totalAR)}</p>
        </CardContent></Card>
        <Card className="bg-card/40"><CardContent className="pt-5">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Overdue Exposure</p>
          <p className="text-xl font-bold text-red-500 mt-1">{formatPHP(totalOverdue)}</p>
        </CardContent></Card>
        <Card className="bg-card/40"><CardContent className="pt-5">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">At-Risk Clients</p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold text-amber-500">{atRiskCount}</span>
            <span className="text-xs text-muted-foreground">in dunning</span>
          </div>
        </CardContent></Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search clients..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <Filter className="size-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Customer Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-4 text-primary" /> Customer AR Ledger
          </CardTitle>
          <CardDescription>{filtered.length} client(s) shown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Rep</TableHead>
                  <TableHead>Terms</TableHead>
                  <TableHead className="text-right">Credit Limit</TableHead>
                  <TableHead className="text-right">AR Balance</TableHead>
                  <TableHead className="text-right">Overdue</TableHead>
                  <TableHead>Dunning</TableHead>
                  <TableHead>Account Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">No customers found.</TableCell></TableRow>
                )}
                {filtered.map(c => {
                  const sc = customerStatusConfig[c.status]
                  const utilization = Math.min(100, Math.round((c.currentBalance / c.creditLimit) * 100))
                  return (
                    <TableRow key={c.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div>
                          <p className="text-sm font-semibold">{c.clientName}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{c.clientCode}</p>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{c.industry}</Badge></TableCell>
                      <TableCell className="text-xs">{c.collectionRep}</TableCell>
                      <TableCell className="text-xs">{c.paymentTerms}</TableCell>
                      <TableCell className="text-right text-xs">
                        <div>
                          <p className="font-medium">{formatPHP(c.creditLimit)}</p>
                          <Progress value={utilization} className="h-1 mt-1" />
                          <p className="text-[10px] text-muted-foreground">{utilization}% used</p>
                        </div>
                      </TableCell>
                      <TableCell className={`text-right font-semibold text-sm ${c.currentBalance > 0 ? "" : "text-muted-foreground"}`}>
                        {formatPHP(c.currentBalance)}
                      </TableCell>
                      <TableCell className={`text-right font-semibold text-sm ${c.overdueBalance > 0 ? "text-red-500" : "text-muted-foreground"}`}>
                        {c.overdueBalance > 0 ? formatPHP(c.overdueBalance) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${dunningBadge[c.dunningStage]}`}>
                          {dunningLabel[c.dunningStage]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${sc.className}`}>{sc.label}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setSelectedCustomer(c)}>
                            <Eye className="size-3.5" />
                          </Button>
                          {c.status === "active" && (
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-amber-500 hover:text-amber-600" onClick={() => onHoldCustomer(c.id)}>
                              <Shield className="size-3.5" />
                            </Button>
                          )}
                          {(c.status === "on_hold" || c.status === "suspended") && (
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-emerald-500 hover:text-emerald-600" onClick={() => onActivateCustomer(c.id)}>
                              <CircleCheck className="size-3.5" />
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

      {/* Customer Detail Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCustomer?.clientName}</DialogTitle>
            <DialogDescription>{selectedCustomer?.clientCode} · {selectedCustomer?.industry}</DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4 text-sm">
              {/* Account Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3 space-y-1">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Account Info</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">Contact</span><span>{selectedCustomer.contactPerson}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="truncate max-w-[160px]">{selectedCustomer.contactEmail}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Rep</span><span>{selectedCustomer.collectionRep}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Terms</span><span>{selectedCustomer.paymentTerms}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Subsystem</span><span>{selectedCustomer.subsystem}</span></div>
                  </div>
                </div>
                <div className="rounded-lg border p-3 space-y-1">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">AR Summary</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">Credit Limit</span><span>{formatPHP(selectedCustomer.creditLimit)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Current Balance</span><span className="font-semibold">{formatPHP(selectedCustomer.currentBalance)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Overdue</span><span className="font-semibold text-red-500">{formatPHP(selectedCustomer.overdueBalance)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Last Payment</span><span>{selectedCustomer.lastPaymentDate}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Last Amt</span><span>{formatPHP(selectedCustomer.lastPaymentAmount)}</span></div>
                  </div>
                </div>
              </div>

              {/* Invoices */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Invoice History ({selectedInvoices.length})</p>
                <div className="rounded-lg border divide-y max-h-48 overflow-y-auto">
                  {selectedInvoices.length === 0 && <p className="text-xs text-muted-foreground italic p-3">No invoices.</p>}
                  {selectedInvoices.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between p-2.5 text-xs">
                      <div>
                        <p className="font-mono font-medium">{inv.invoiceNo}</p>
                        <p className="text-muted-foreground">{inv.dueDate} · {inv.paymentTerms}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatPHP(inv.totalAmount)}</p>
                        <p className={`${inv.balanceAmount > 0 ? "text-red-500" : "text-emerald-500"}`}>
                          {inv.balanceAmount > 0 ? `Due: ${formatPHP(inv.balanceAmount)}` : "Paid"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment History */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Payment History ({selectedReceipts.length})</p>
                <div className="rounded-lg border divide-y max-h-40 overflow-y-auto">
                  {selectedReceipts.length === 0 && <p className="text-xs text-muted-foreground italic p-3">No payments.</p>}
                  {selectedReceipts.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-2.5 text-xs">
                      <div>
                        <p className="font-mono font-medium">{r.receiptNo}</p>
                        <p className="text-muted-foreground">{r.paymentMethod} · {r.datePaid}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-emerald-600">{formatPHP(r.amountReceived)}</p>
                        <Badge variant="outline" className="text-[10px]">{r.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
