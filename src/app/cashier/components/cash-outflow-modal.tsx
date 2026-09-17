import React, { useState } from 'react'
import type { TransactionRecord } from '../data/cashier-data'
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
import { MinusCircle, Banknote, ShieldAlert } from 'lucide-react'

interface CashOutflowModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRecordOutflow: (newTxn: TransactionRecord) => void
}

export function CashOutflowModal({ open, onOpenChange, onRecordOutflow }: CashOutflowModalProps) {
  const [payee, setPayee] = useState('')
  const [subsystem, setSubsystem] = useState<any>('Fleet & Transport')
  const [amount, setAmount] = useState<number>(0)
  const [referenceNo, setReferenceNo] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!payee || amount <= 0) return

    const voucherNo = `VOU-2026-${Math.floor(1000 + Math.random() * 9000)}`
    const now = new Date()
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

    const newTxn: TransactionRecord = {
      id: `TXN-${Date.now()}`,
      orNo: voucherNo,
      type: 'DISBURSEMENT',
      clientName: payee,
      subsystem: subsystem,
      amount: amount,
      paymentMethod: 'Cash',
      referenceNo: referenceNo || `PETTY-VOU-${voucherNo.slice(-4)}`,
      timestamp: timeStr,
      cashierName: 'Maria Santos',
      status: 'COMPLETED'
    }

    onRecordOutflow(newTxn)
    setPayee('')
    setAmount(0)
    setReferenceNo('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-5 bg-gradient-to-r from-amber-600 to-orange-700 text-white">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/10 rounded-lg">
              <MinusCircle className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-white">
                Record Petty Cash & Outflow Voucher
              </DialogTitle>
              <DialogDescription className="text-xs text-amber-100">
                Disburse cash directly from terminal till drawer
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Purpose / Payee Name</Label>
            <Input
              required
              placeholder="e.g. Driver Fuel Reimbursement, Emergency Office Supplies"
              value={payee}
              onChange={(e) => setPayee(e.target.value)}
              className="text-xs h-9"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">ISMERS Subsystem</Label>
              <Select value={subsystem} onValueChange={setSubsystem}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fleet & Transport">Fleet & Transport</SelectItem>
                  <SelectItem value="HRIS & Recruitment">HRIS & Recruitment</SelectItem>
                  <SelectItem value="Facilities & Admin">Facilities & Admin</SelectItem>
                  <SelectItem value="Client Management">Client Management</SelectItem>
                  <SelectItem value="Supply Chain">Supply Chain</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Disbursement Amount (₱)</Label>
              <Input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={amount || ''}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="text-xs font-mono h-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Voucher / Liquidation Reference #</Label>
            <Input
              placeholder="e.g. VOU-HR-04, PETTY-FLEET-10"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              className="text-xs font-mono h-9"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="text-xs">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!payee || amount <= 0}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium"
            >
              <Banknote className="mr-1.5 size-4" />
              Disburse Cash & Post Voucher
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
