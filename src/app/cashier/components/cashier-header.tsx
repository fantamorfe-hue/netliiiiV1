import React, { useState, useEffect } from 'react'
import type { ShiftInfo } from '../data/cashier-data'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CreditCard, 
  MinusCircle, 
  Lock, 
  Clock, 
  UserCheck, 
  Printer, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

interface CashierHeaderProps {
  shiftInfo: ShiftInfo
  onOpenPaymentModal: () => void
  onOpenOutflowModal: () => void
  onOpenReconciliationModal: () => void
  onOpenSummaryModal: () => void
}

export function CashierHeader({
  shiftInfo,
  onOpenPaymentModal,
  onOpenOutflowModal,
  onOpenReconciliationModal,
  onOpenSummaryModal,
}: CashierHeaderProps) {
  const [time, setTime] = useState<string>('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Left Side: Cashier & Shift Badge */}
        <div className="flex items-start gap-4">
          <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UserCheck className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Cashier Terminal & Collection Portal
              </h1>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-medium">
                <CheckCircle2 className="mr-1 size-3" /> Shift Active
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              ISMERS Cashier: <span className="font-semibold text-foreground">{shiftInfo.cashierName}</span> • Terminal: <span className="font-semibold text-foreground">{shiftInfo.terminalId}</span> • Shift ID: <span className="font-mono text-foreground">{shiftInfo.shiftId}</span>
            </p>
          </div>
        </div>

        {/* Right Side: Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            onClick={onOpenPaymentModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
          >
            <CreditCard className="mr-2 size-4" />
            Process Payment
          </Button>

          <Button 
            variant="outline"
            onClick={onOpenOutflowModal}
            className="border-amber-500/30 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
          >
            <MinusCircle className="mr-2 size-4 text-amber-600" />
            Cash Outflow
          </Button>

          <Button 
            variant="outline"
            onClick={onOpenReconciliationModal}
            className="border-indigo-500/30 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
          >
            <Lock className="mr-2 size-4 text-indigo-600" />
            Close Shift / Drawer
          </Button>

          <Button 
            variant="ghost" 
            size="icon"
            onClick={onOpenSummaryModal}
            title="Print Shift Summary"
          >
            <Printer className="size-4" />
          </Button>
        </div>
      </div>

      {/* Footer Info Bar inside Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5 text-primary" />
            <span>Shift Started: <strong className="text-foreground">{shiftInfo.startTime}</strong></span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 border-l pl-4">
            <span>Opening Drawer Cash: <strong className="text-foreground font-mono">₱{shiftInfo.openingCash.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Live Clock: <strong className="text-foreground">{time}</strong></span>
        </div>
      </div>
    </div>
  )
}
