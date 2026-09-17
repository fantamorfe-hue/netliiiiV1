import { useState } from 'react'
import type { ShiftInfo } from '../data/cashier-data'
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
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Lock, 
  AlertTriangle, 
  CheckCircle2, 
  Calculator, 
  Vault
} from 'lucide-react'

interface TillReconciliationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shiftInfo: ShiftInfo
  onCloseShift: (reconciledEndingCash: number, variance: number, vaultDrop: number) => void
}

export function TillReconciliationModal({
  open,
  onOpenChange,
  shiftInfo,
  onCloseShift,
}: TillReconciliationModalProps) {
  const [denom1000, setDenom1000] = useState<number>(45)
  const [denom500, setDenom500] = useState<number>(16)
  const [denom200, setDenom200] = useState<number>(5)
  const [denom100, setDenom100] = useState<number>(8)
  const [denom50, setDenom50] = useState<number>(5)
  const [denom20] = useState<number>(0)
  const [coins, setCoins] = useState<number>(0)
  const [vaultDrop, setVaultDrop] = useState<number>(40000)

  const physicalCashCount = 
    (denom1000 * 1000) + 
    (denom500 * 500) + 
    (denom200 * 200) + 
    (denom100 * 100) + 
    (denom50 * 50) + 
    (denom20 * 20) + 
    coins

  const expectedCash = shiftInfo.expectedEndingCash
  const variance = physicalCashCount - expectedCash

  const handleConfirmClose = () => {
    onCloseShift(physicalCashCount, variance, vaultDrop)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden">
        <DialogHeader className="p-6 bg-gradient-to-r from-indigo-900 to-slate-900 text-white">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/10 rounded-lg">
              <Lock className="size-5 text-indigo-300" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white">
                Cash Drawer Reconciliation & Shift Close
              </DialogTitle>
              <DialogDescription className="text-xs text-indigo-200">
                Audit physical cash drawer till against system expected ledger
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Shift Summary Banner */}
          <div className="grid grid-cols-3 gap-2 rounded-lg border bg-muted/40 p-3 text-xs">
            <div>
              <span className="text-muted-foreground block text-[10px]">Opening Till</span>
              <strong className="font-mono text-foreground text-sm">₱{shiftInfo.openingCash.toLocaleString()}</strong>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">Cash Collections</span>
              <strong className="font-mono text-emerald-600 text-sm">+₱{shiftInfo.totalCollectionsCash.toLocaleString()}</strong>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">Cash Outflow</span>
              <strong className="font-mono text-amber-600 text-sm">-₱{shiftInfo.totalDisbursementsCash.toLocaleString()}</strong>
            </div>
          </div>

          {/* Physical Denomination Counter Grid */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold flex items-center gap-1">
              <Calculator className="size-3.5 text-primary" /> Physical Bill & Coin Denomination Count
            </Label>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between border rounded-md p-2 bg-card">
                <span>₱1,000 Bill ×</span>
                <Input
                  type="number"
                  min="0"
                  value={denom1000}
                  onChange={(e) => setDenom1000(parseInt(e.target.value) || 0)}
                  className="w-20 text-xs font-mono h-7 text-right"
                />
              </div>

              <div className="flex items-center justify-between border rounded-md p-2 bg-card">
                <span>₱500 Bill ×</span>
                <Input
                  type="number"
                  min="0"
                  value={denom500}
                  onChange={(e) => setDenom500(parseInt(e.target.value) || 0)}
                  className="w-20 text-xs font-mono h-7 text-right"
                />
              </div>

              <div className="flex items-center justify-between border rounded-md p-2 bg-card">
                <span>₱200 Bill ×</span>
                <Input
                  type="number"
                  min="0"
                  value={denom200}
                  onChange={(e) => setDenom200(parseInt(e.target.value) || 0)}
                  className="w-20 text-xs font-mono h-7 text-right"
                />
              </div>

              <div className="flex items-center justify-between border rounded-md p-2 bg-card">
                <span>₱100 Bill ×</span>
                <Input
                  type="number"
                  min="0"
                  value={denom100}
                  onChange={(e) => setDenom100(parseInt(e.target.value) || 0)}
                  className="w-20 text-xs font-mono h-7 text-right"
                />
              </div>

              <div className="flex items-center justify-between border rounded-md p-2 bg-card">
                <span>₱50 Bill ×</span>
                <Input
                  type="number"
                  min="0"
                  value={denom50}
                  onChange={(e) => setDenom50(parseInt(e.target.value) || 0)}
                  className="w-20 text-xs font-mono h-7 text-right"
                />
              </div>

              <div className="flex items-center justify-between border rounded-md p-2 bg-card">
                <span>Loose Coins (₱)</span>
                <Input
                  type="number"
                  min="0"
                  value={coins}
                  onChange={(e) => setCoins(parseFloat(e.target.value) || 0)}
                  className="w-20 text-xs font-mono h-7 text-right"
                />
              </div>
            </div>
          </div>

          {/* Audit Comparison & Variance Alert Box */}
          <div className="rounded-lg border bg-card p-4 space-y-2 text-xs">
            <div className="flex justify-between items-center text-muted-foreground">
              <span>System Expected Cash:</span>
              <span className="font-mono text-sm font-semibold">₱{expectedCash.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Physical Count Total:</span>
              <span className="font-mono text-sm font-bold text-foreground">₱{physicalCashCount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>

            <Separator className="my-1" />

            <div className="flex justify-between items-center pt-1 font-bold">
              <span>Till Variance:</span>
              {variance === 0 ? (
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs font-mono">
                  <CheckCircle2 className="mr-1 size-3" /> PERFECT MATCH (₱0.00)
                </Badge>
              ) : variance > 0 ? (
                <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs font-mono">
                  OVERAGE (+₱{variance.toLocaleString()})
                </Badge>
              ) : (
                <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-xs font-mono">
                  <AlertTriangle className="mr-1 size-3" /> SHORTAGE (-₱{Math.abs(variance).toLocaleString()})
                </Badge>
              )}
            </div>
          </div>

          {/* Vault Drop Input */}
          <div className="space-y-1.5 rounded-lg border bg-slate-900/5 dark:bg-white/5 p-3">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Vault className="size-4 text-indigo-600" /> Bank Safe Vault Drop Amount (₱)
            </Label>
            <Input
              type="number"
              step="0.01"
              value={vaultDrop}
              onChange={(e) => setVaultDrop(parseFloat(e.target.value) || 0)}
              className="text-xs font-mono font-bold h-9 bg-background"
            />
            <p className="text-[10px] text-muted-foreground">
              Remaining till cash for next shift: <strong className="font-mono text-foreground">₱{(physicalCashCount - vaultDrop).toLocaleString()}</strong>
            </p>
          </div>
        </div>

        <DialogFooter className="p-4 bg-muted/40 border-t flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Cancel
          </Button>
          <Button size="sm" onClick={handleConfirmClose} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium">
            <Lock className="mr-1.5 size-3.5" />
            Post Audit & Close Cashier Shift
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
