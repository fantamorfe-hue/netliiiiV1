import React, { useState } from 'react'
import type { InvoiceItem, TransactionRecord } from '../data/cashier-data'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Search, 
  Filter, 
  CreditCard, 
  Printer, 
  AlertCircle,
  Layers
} from 'lucide-react'

interface CashierTransactionsTableProps {
  pendingInvoices: InvoiceItem[]
  transactions: TransactionRecord[]
  onSelectPaymentInvoice: (invoice: InvoiceItem) => void
  onSelectPrintReceipt: (transaction: TransactionRecord) => void
}

export function CashierTransactionsTable({
  pendingInvoices,
  transactions,
  onSelectPaymentInvoice,
  onSelectPrintReceipt,
}: CashierTransactionsTableProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'collections' | 'disbursements'>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [subsystemFilter, setSubsystemFilter] = useState('ALL')

  // Filter Pending Invoices
  const filteredPending = pendingInvoices.filter((item) => {
    const matchesSearch = 
      item.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.jobOrderNo && item.jobOrderNo.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesSubsystem = subsystemFilter === 'ALL' || item.subsystem === subsystemFilter

    return matchesSearch && matchesSubsystem
  })

  // Filter Collections
  const collections = transactions.filter((t) => t.type === 'COLLECTION')
  const filteredCollections = collections.filter((item) => {
    const matchesSearch = 
      item.orNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.referenceNo.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesSubsystem = subsystemFilter === 'ALL' || item.subsystem === subsystemFilter

    return matchesSearch && matchesSubsystem
  })

  // Filter Disbursements
  const disbursements = transactions.filter((t) => t.type === 'DISBURSEMENT')
  const filteredDisbursements = disbursements.filter((item) => {
    const matchesSearch = 
      item.orNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.referenceNo.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesSubsystem = subsystemFilter === 'ALL' || item.subsystem === subsystemFilter

    return matchesSearch && matchesSubsystem
  })

  const getSubsystemBadgeColor = (subsystem: string) => {
    switch (subsystem) {
      case 'HRIS & Recruitment':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20'
      case 'Fleet & Transport':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
      case 'Facilities & Admin':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20'
      case 'Client Management':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
      case 'Supply Chain':
        return 'bg-rose-500/10 text-rose-600 border-rose-500/20'
      default:
        return 'bg-secondary text-secondary-foreground'
    }
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Layers className="size-5 text-primary" />
              Cashier Transaction & Queue Management
            </CardTitle>
            <CardDescription className="text-xs">
              Process incoming ISMERS client billing, view issued Official Receipts, and verify cash disbursements
            </CardDescription>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search Invoice, OR#, Client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>

            <Select value={subsystemFilter} onValueChange={setSubsystemFilter}>
              <SelectTrigger className="w-[180px] text-xs h-9">
                <Filter className="mr-1.5 size-3.5 text-muted-foreground" />
                <SelectValue placeholder="All Subsystems" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Subsystems</SelectItem>
                <SelectItem value="HRIS & Recruitment">HRIS & Recruitment</SelectItem>
                <SelectItem value="Fleet & Transport">Fleet & Transport</SelectItem>
                <SelectItem value="Facilities & Admin">Facilities & Admin</SelectItem>
                <SelectItem value="Client Management">Client Management</SelectItem>
                <SelectItem value="Supply Chain">Supply Chain</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)}>
          <div className="flex items-center justify-between border-b pb-3 mb-4">
            <TabsList className="grid w-full sm:w-auto grid-cols-3">
              <TabsTrigger value="pending" className="text-xs">
                Pending Queue ({pendingInvoices.length})
              </TabsTrigger>
              <TabsTrigger value="collections" className="text-xs">
                Official Receipts ({collections.length})
              </TabsTrigger>
              <TabsTrigger value="disbursements" className="text-xs">
                Disbursements ({disbursements.length})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: Pending Invoices Queue */}
          <TabsContent value="pending" className="m-0">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs font-semibold">Invoice & Job Order</TableHead>
                    <TableHead className="text-xs font-semibold">Client / Payee</TableHead>
                    <TableHead className="text-xs font-semibold">ISMERS Subsystem</TableHead>
                    <TableHead className="text-xs font-semibold">Due Date</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Tax (VAT/EWT)</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Total Payable</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPending.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                        No pending invoices match your search or filter criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPending.map((invoice) => (
                      <TableRow key={invoice.id} className="hover:bg-muted/30">
                        <TableCell className="font-mono text-xs font-medium">
                          <div>{invoice.invoiceNo}</div>
                          {invoice.jobOrderNo && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              Ref: {invoice.jobOrderNo}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-medium max-w-[200px]">
                          <div className="truncate text-foreground font-semibold">{invoice.clientName}</div>
                          <div className="text-[11px] text-muted-foreground truncate">{invoice.description}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] ${getSubsystemBadgeColor(invoice.subsystem)}`}>
                            {invoice.subsystem}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {invoice.status === 'OVERDUE' ? (
                            <span className="text-rose-600 font-medium flex items-center gap-1">
                              <AlertCircle className="size-3" /> Overdue ({invoice.dueDate})
                            </span>
                          ) : (
                            invoice.dueDate
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-right text-muted-foreground">
                          <div>VAT: ₱{invoice.vatAmount.toLocaleString()}</div>
                          <div className="text-[10px] text-emerald-600">EWT: -₱{invoice.ewtAmount.toLocaleString()}</div>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-right font-bold text-emerald-600">
                          ₱{invoice.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            onClick={() => onSelectPaymentInvoice(invoice)}
                            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
                          >
                            <CreditCard className="mr-1.5 size-3.5" />
                            Collect
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* TAB 2: Completed Collections (Official Receipts) */}
          <TabsContent value="collections" className="m-0">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs font-semibold">Official Receipt (O.R. #)</TableHead>
                    <TableHead className="text-xs font-semibold">Client Name</TableHead>
                    <TableHead className="text-xs font-semibold">ISMERS Subsystem</TableHead>
                    <TableHead className="text-xs font-semibold">Tender Method</TableHead>
                    <TableHead className="text-xs font-semibold">Time</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Amount Collected</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Receipt Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCollections.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                        No collection receipts found for current search parameters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCollections.map((txn) => (
                      <TableRow key={txn.id} className="hover:bg-muted/30">
                        <TableCell className="font-mono text-xs font-semibold text-primary">
                          {txn.orNo}
                          <span className="block text-[10px] text-muted-foreground font-normal">
                            Ref: {txn.referenceNo}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {txn.clientName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] ${getSubsystemBadgeColor(txn.subsystem)}`}>
                            {txn.subsystem}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="secondary" className="text-[11px] font-mono">
                            {txn.paymentMethod}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {txn.timestamp}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-right font-bold text-emerald-600">
                          ₱{txn.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onSelectPrintReceipt(txn)}
                              className="h-7 text-xs px-2"
                              title="Reprint Official Receipt"
                            >
                              <Printer className="mr-1 size-3 text-primary" />
                              O.R. View
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* TAB 3: Disbursements & Vouchers */}
          <TabsContent value="disbursements" className="m-0">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs font-semibold">Voucher #</TableHead>
                    <TableHead className="text-xs font-semibold">Purpose / Payee</TableHead>
                    <TableHead className="text-xs font-semibold">ISMERS Subsystem</TableHead>
                    <TableHead className="text-xs font-semibold">Method</TableHead>
                    <TableHead className="text-xs font-semibold">Time</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Disbursed Amount</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDisbursements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                        No cash disbursements recorded for this shift.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDisbursements.map((txn) => (
                      <TableRow key={txn.id} className="hover:bg-muted/30">
                        <TableCell className="font-mono text-xs font-semibold text-amber-600">
                          {txn.orNo}
                          <span className="block text-[10px] text-muted-foreground font-normal">
                            Ref: {txn.referenceNo}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {txn.clientName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] ${getSubsystemBadgeColor(txn.subsystem)}`}>
                            {txn.subsystem}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          {txn.paymentMethod}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {txn.timestamp}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-right font-bold text-amber-600">
                          -₱{txn.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                            Disbursed
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
