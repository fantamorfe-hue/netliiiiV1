"use client"

import * as React from "react"
import { toast } from "sonner"
import { ArrowLeftRight, Plus, Search } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import type { FundTransfer, CashBankAccount } from "../data/mock-data"

interface FundTransfersViewProps {
  transfers: FundTransfer[]
  bankAccounts: CashBankAccount[]
  onCreateTransfer: (transfer: Omit<FundTransfer, "id" | "transferNo" | "status">) => void
  onCompleteTransfer: (id: string) => void
  onCancelTransfer: (id: string) => void
}

const formatPHP = (val: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(val)

const statusBadge: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
}

export function FundTransfersView({
  transfers, bankAccounts, onCreateTransfer, onCompleteTransfer, onCancelTransfer,
}: FundTransfersViewProps) {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [showCreate, setShowCreate] = React.useState(false)

  const [form, setForm] = React.useState({
    date: new Date().toISOString().split("T")[0],
    fromAccountId: "cash-1",
    toAccountId: "cash-3",
    amount: "",
    reason: "",
    requestedBy: "",
  })

  const filtered = React.useMemo(() => {
    return transfers.filter(t => {
      const matchSearch =
        t.transferNo.toLowerCase().includes(search.toLowerCase()) ||
        t.reason.toLowerCase().includes(search.toLowerCase()) ||
        t.requestedBy.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === "all" || t.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [transfers, search, statusFilter])

  const getAccountName = (id: string) => bankAccounts.find(a => a.id === id)?.name ?? id

  const handleSubmit = () => {
    const amount = parseFloat(form.amount)
    if (!form.reason || !form.requestedBy || amount <= 0) {
      toast.error("Please fill all required fields.")
      return
    }
    if (form.fromAccountId === form.toAccountId) {
      toast.error("Source and destination accounts must be different.")
      return
    }
    const source = bankAccounts.find(a => a.id === form.fromAccountId)
    if (source && source.ledgerBalance < amount) {
      toast.error(`Insufficient balance in ${source.name}. Available: ${formatPHP(source.ledgerBalance)}`)
      return
    }
    onCreateTransfer({
      date: form.date,
      fromAccountId: form.fromAccountId,
      toAccountId: form.toAccountId,
      amount,
      reason: form.reason,
      requestedBy: form.requestedBy,
    })
    setShowCreate(false)
    setForm({ date: new Date().toISOString().split("T")[0], fromAccountId: "cash-1", toAccountId: "cash-3", amount: "", reason: "", requestedBy: "" })
  }

  const pendingTotal = transfers.filter(t => t.status === "pending").reduce((s, t) => s + t.amount, 0)
  const completedTotal = transfers.filter(t => t.status === "completed").reduce((s, t) => s + t.amount, 0)

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Transfers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatPHP(pendingTotal)}</div>
            <div className="text-xs text-muted-foreground mt-1">{transfers.filter(t => t.status === "pending").length} awaiting execution</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed Transfers (Jul)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatPHP(completedTotal)}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pb-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ArrowLeftRight className="size-4 text-primary" />
              Inter-Fund Transfers
            </CardTitle>
            <CardDescription>
              Move funds between treasury accounts — operating, payroll, savings, and petty cash
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center border rounded-lg p-0.5 bg-muted/30">
              {["all", "pending", "completed", "cancelled"].map(status => (
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
              <Plus className="size-4 mr-1.5" /> New Transfer
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input placeholder="Search transfers..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transfer No.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>From Account</TableHead>
                  <TableHead>To Account</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(transfer => (
                  <TableRow key={transfer.id}>
                    <TableCell className="font-mono text-xs font-medium">{transfer.transferNo}</TableCell>
                    <TableCell className="text-sm">{transfer.date}</TableCell>
                    <TableCell className="text-sm max-w-[150px] truncate">{getAccountName(transfer.fromAccountId)}</TableCell>
                    <TableCell className="text-sm max-w-[150px] truncate">{getAccountName(transfer.toAccountId)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatPHP(transfer.amount)}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{transfer.reason}</TableCell>
                    <TableCell className="text-sm">{transfer.requestedBy}</TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusBadge[transfer.status]}`}>
                        {transfer.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {transfer.status === "pending" && (
                          <>
                            <Button size="sm" variant="outline" className="h-7 text-xs cursor-pointer" onClick={() => onCompleteTransfer(transfer.id)}>
                              Execute
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500 cursor-pointer" onClick={() => onCancelTransfer(transfer.id)}>
                              Cancel
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Initiate Fund Transfer</DialogTitle>
            <DialogDescription>Transfer funds between treasury accounts. Requires execution to update balances.</DialogDescription>
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
              <Label>From Account</Label>
              <Select value={form.fromAccountId} onValueChange={v => setForm(f => ({ ...f, fromAccountId: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {bankAccounts.filter(b => b.isActive).map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name} ({formatPHP(b.ledgerBalance)})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>To Account</Label>
              <Select value={form.toAccountId} onValueChange={v => setForm(f => ({ ...f, toAccountId: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {bankAccounts.filter(b => b.isActive).map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Requested By</Label>
              <Input placeholder="Name of requestor" value={form.requestedBy} onChange={e => setForm(f => ({ ...f, requestedBy: e.target.value }))} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Reason</Label>
              <Textarea placeholder="Purpose of transfer..." value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="cursor-pointer" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button className="cursor-pointer" onClick={handleSubmit}>Create Transfer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
