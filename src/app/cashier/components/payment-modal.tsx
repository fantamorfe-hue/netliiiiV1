import React, { useState, useEffect } from 'react'
import type { InvoiceItem, TransactionRecord } from '../data/cashier-data'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { 
  CreditCard, 
  Banknote, 
  Receipt
} from 'lucide-react'

interface PaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedInvoice: InvoiceItem | null
  pendingInvoices: InvoiceItem[]
  onProcessPayment: (newTxn: TransactionRecord, invoiceIdToRemove?: string) => void
}

export function PaymentModal({
  open,
  onOpenChange,
  selectedInvoice,
  pendingInvoices,
  onProcessPayment,
}: PaymentModalProps) {
  const [invoiceId, setInvoiceId] = useState<string>('')
  const [clientName, setClientName] = useState<string>('')
  const [subsystem, setSubsystem] = useState<any>('Client Management')
  const [baseAmount, setBaseAmount] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Credit Card' | 'QR Ph / E-Wallet' | 'Check' | 'Bank Transfer'>('Cash')
  const [referenceNo, setReferenceNo] = useState<string>('')
  const [cashTendered, setCashTendered] = useState<string>('')

  // Sync when selectedInvoice changes
  useEffect(() => {
    if (selectedInvoice) {
      setInvoiceId(selectedInvoice.id)
      setClientName(selectedInvoice.clientName)
      setSubsystem(selectedInvoice.subsystem)
      setBaseAmount(selectedInvoice.amount)
    } else {
      setInvoiceId('')
      setClientName('')
      setBaseAmount(0)
    }
    setCashTendered('')
    setReferenceNo('')
  }, [selectedInvoice, open])

  // Invoice selection dropdown handler
  const handleSelectInvoice = (id: string) => {
    const inv = pendingInvoices.find((i) => i.id === id)
    if (inv) {
      setInvoiceId(inv.id)
      setClientName(inv.clientName)
      setSubsystem(inv.subsystem)
      setBaseAmount(inv.amount)
    }
  }

  // Tax calculations (Philippine BIR 12% VAT standard for enterprise systems)
  const vatableSales = baseAmount / 1.12
  const vatAmount = vatableSales * 0.12
  const ewtAmount = vatableSales * 0.02 // 2% EWT standard withholding tax
  const netTotalPayable = vatableSales + vatAmount - ewtAmount

  const cashReceivedNum = parseFloat(cashTendered) || 0
  const changeDue = Math.max(0, cashReceivedNum - netTotalPayable)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientName || baseAmount <= 0) return

    const generatedOR = `OR-2026-${Math.floor(10000 + Math.random() * 90000)}`
    const now = new Date()
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

    const newTxn: TransactionRecord = {
      id: `TXN-${Date.now()}`,
      orNo: generatedOR,
      type: 'COLLECTION',
      clientName: clientName,
      subsystem: subsystem,
      amount: netTotalPayable,
      paymentMethod: paymentMethod,
      referenceNo: referenceNo || (paymentMethod === 'Cash' ? `CASH-POS-${generatedOR.slice(-4)}` : `REF-${Math.floor(100000 + Math.random() * 900000)}`),
      timestamp: timeStr,
      cashierName: 'Maria Santos',
      status: 'COMPLETED',
      vatBreakdown: {
        vatableSales: parseFloat(vatableSales.toFixed(2)),
        vatAmount: parseFloat(vatAmount.toFixed(2)),
        vatExempt: 0,
        zeroRated: 0
      }
    }

    onProcessPayment(newTxn, invoiceId || undefined)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden">
        <DialogHeader className="p-6 bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/10 rounded-lg">
              <CreditCard className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white">
                Process Collection Payment & Issue O.R.
              </DialogTitle>
              <DialogDescription className="text-xs text-emerald-100">
                ISMERS Enterprise Financial Terminal • Point of Collection
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Quick Invoice Picker */}
          {pendingInvoices.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Select Pending Invoice (Optional)</Label>
              <Select value={invoiceId} onValueChange={handleSelectInvoice}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="Choose from Pending Queue..." />
                </SelectTrigger>
                <SelectContent>
                  {pendingInvoices.map((inv) => (
                    <SelectItem key={inv.id} value={inv.id} className="text-xs">
                      {inv.invoiceNo} — {inv.clientName} (₱{inv.totalAmount.toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Client / Payee Name</Label>
              <Input
                required
                placeholder="Client or Company Name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">ISMERS Subsystem</Label>
              <Select value={subsystem} onValueChange={setSubsystem}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Client Management">Client Management</SelectItem>
                  <SelectItem value="HRIS & Recruitment">HRIS & Recruitment</SelectItem>
                  <SelectItem value="Fleet & Transport">Fleet & Transport</SelectItem>
                  <SelectItem value="Facilities & Admin">Facilities & Admin</SelectItem>
                  <SelectItem value="Supply Chain">Supply Chain</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Gross Invoice Amount (₱)</Label>
              <Input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={baseAmount || ''}
                onChange={(e) => setBaseAmount(parseFloat(e.target.value) || 0)}
                className="text-xs font-mono h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Payment Tender Method</Label>
              <Select value={paymentMethod} onValueChange={(val: any) => setPaymentMethod(val)}>
                <SelectTrigger className="text-xs h-9 font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">💵 Cash Payment</SelectItem>
                  <SelectItem value="Credit Card">💳 Credit / Debit Card</SelectItem>
                  <SelectItem value="QR Ph / E-Wallet">📱 QR Ph / GCash / Maya</SelectItem>
                  <SelectItem value="Bank Transfer">🏦 Bank Online Transfer</SelectItem>
                  <SelectItem value="Check">📜 Bank Check</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Payment Method Specific Inputs */}
          {paymentMethod === 'Cash' ? (
            <div className="rounded-lg border bg-emerald-500/5 p-3.5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                  <Banknote className="size-4" /> Cash Tender Calculator
                </span>
                <span className="text-[11px] text-muted-foreground">Drawer Till Active</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] text-muted-foreground">Cash Received (₱)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="text-xs font-mono font-bold h-9 bg-background"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Change Due (₱)</Label>
                  <div className="h-9 flex items-center px-3 rounded-md border bg-background font-mono font-bold text-emerald-600 text-sm">
                    ₱{changeDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Reference / Authorization / Check Number</Label>
              <Input
                placeholder="e.g. Card Ref, GCash Ref#, Check #, Bank Txn ID"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                className="text-xs font-mono h-9"
              />
            </div>
          )}

          {/* BIR Tax & Net Payable Summary Box */}
          <div className="rounded-lg border bg-muted/40 p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Vatable Sales (Base 12%):</span>
              <span className="font-mono">₱{vatableSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>12% Value Added Tax (VAT):</span>
              <span className="font-mono">₱{vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex items-center justify-between text-emerald-600">
              <span>Less: 2% Expanded Withholding Tax (EWT):</span>
              <span className="font-mono">-₱{ewtAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between pt-1 text-sm font-bold text-foreground">
              <span>NET PAYABLE TOTAL:</span>
              <span className="font-mono text-emerald-600 text-base">
                ₱{netTotalPayable.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="text-xs">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!clientName || baseAmount <= 0 || (paymentMethod === 'Cash' && cashReceivedNum < netTotalPayable)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
            >
              <Receipt className="mr-1.5 size-4" />
              Complete & Print Official Receipt
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
