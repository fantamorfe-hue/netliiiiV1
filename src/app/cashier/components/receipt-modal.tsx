import type { TransactionRecord } from '../data/cashier-data'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Printer, QrCode, ShieldCheck } from 'lucide-react'

interface ReceiptModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: TransactionRecord | null
}

export function ReceiptModal({ open, onOpenChange, transaction }: ReceiptModalProps) {
  if (!transaction) return null

  const handlePrint = () => {
    window.print()
  }

  const vatableSales = transaction.vatBreakdown?.vatableSales || (transaction.amount / 1.12)
  const vatAmount = transaction.vatBreakdown?.vatAmount || (vatableSales * 0.12)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-4 bg-muted/60 border-b flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-emerald-600" />
            <DialogTitle className="text-sm font-bold">
              Official Receipt Viewer
            </DialogTitle>
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
            BIR COMPLIANT O.R.
          </Badge>
        </DialogHeader>

        {/* RECEIPT PAPER CONTAINER */}
        <div id="printable-receipt" className="p-6 bg-card text-foreground font-mono text-xs space-y-4">
          {/* Header & Logo */}
          <div className="text-center space-y-1">
            <div className="font-bold text-sm tracking-wider text-foreground">
              INTEGRATED SERVICE MANAGEMENT & ENTERPRISE RESOURCE SYSTEM
            </div>
            <div className="text-[11px] text-muted-foreground">
              ISMERS Financial Services & Collections Hub
            </div>
            <div className="text-[10px] text-muted-foreground">
              VAT REG TIN: 009-882-104-000 • BIR PERMIT #: 2026-089-T04
            </div>
          </div>

          <Separator className="border-dashed" />

          {/* O.R. Meta Info */}
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between font-bold">
              <span>OFFICIAL RECEIPT NO:</span>
              <span className="text-emerald-600">{transaction.orNo}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Date & Time:</span>
              <span>2026-07-31 {transaction.timestamp}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Cashier / Terminal:</span>
              <span>{transaction.cashierName} (T04)</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>ISMERS Module:</span>
              <span className="font-semibold text-foreground">{transaction.subsystem}</span>
            </div>
          </div>

          <Separator className="border-dashed" />

          {/* Payee Info */}
          <div className="space-y-1">
            <div className="text-[10px] text-muted-foreground uppercase font-bold">Received From:</div>
            <div className="font-bold text-sm text-foreground">{transaction.clientName}</div>
          </div>

          <Separator className="border-dashed" />

          {/* Line Items & Tax Breakdown */}
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between text-muted-foreground">
              <span>Vatable Sales (Net 12%):</span>
              <span>₱{vatableSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Value Added Tax (12% VAT):</span>
              <span>₱{vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>VAT-Exempt / Zero-Rated:</span>
              <span>₱0.00</span>
            </div>

            <Separator className="my-1 border-dashed" />

            <div className="flex justify-between text-sm font-bold text-foreground pt-1">
              <span>TOTAL AMOUNT PAID:</span>
              <span className="text-emerald-600 font-bold text-base">
                ₱{transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <Separator className="border-dashed" />

          {/* Payment Method details */}
          <div className="bg-muted/40 p-2.5 rounded-md space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tender Type:</span>
              <span className="font-semibold">{transaction.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reference / Auth #:</span>
              <span className="font-mono">{transaction.referenceNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="text-emerald-600 font-bold">PAID & POSTED TO GL</span>
            </div>
          </div>

          {/* QR Code & Footer */}
          <div className="pt-2 flex flex-col items-center justify-center text-center space-y-1.5">
            <div className="p-2 border rounded-lg bg-white inline-block">
              <QrCode className="size-16 text-slate-800" />
            </div>
            <div className="text-[10px] text-muted-foreground">
              Scan QR for BIR E-Invoice Audit Verification
            </div>
            <div className="text-[9px] text-muted-foreground italic">
              "This serves as an Official Receipt for tax deductible expense verification."
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 bg-muted/40 border-t flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Close
          </Button>
          <Button size="sm" onClick={handlePrint} className="bg-primary text-primary-foreground text-xs">
            <Printer className="mr-1.5 size-3.5" />
            Print Receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
