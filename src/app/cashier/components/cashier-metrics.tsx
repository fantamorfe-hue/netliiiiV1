import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Vault, 
  Receipt, 
  Clock, 
  CreditCard, 
  Banknote, 
  ShieldCheck,
  Building2
} from 'lucide-react'

interface CashierMetricsProps {
  totalCollections: number
  cashCollections: number
  nonCashCollections: number
  totalOutflow: number
  drawerCashBalance: number
  pendingCount: number
  pendingTotalAmount: number
}

export function CashierMetrics({
  totalCollections,
  cashCollections,
  nonCashCollections,
  totalOutflow,
  drawerCashBalance,
  pendingCount,
  pendingTotalAmount,
}: CashierMetricsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Card 1: Today's Total Collections */}
      <Card className="relative overflow-hidden border bg-gradient-to-br from-card to-emerald-500/5 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Today Collections
            </span>
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <TrendingUp className="size-5" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
              ₱{totalCollections.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <ArrowUpRight className="size-3.5" /> +14.2% shift avg
              </span>
              <span>7 Transactions</span>
            </div>
          </div>

          <div className="mt-3 border-t pt-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Cash: <strong className="font-mono text-foreground">₱{cashCollections.toLocaleString()}</strong></span>
            <span>Digital/Card: <strong className="font-mono text-foreground">₱{nonCashCollections.toLocaleString()}</strong></span>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Cash Drawer Balance */}
      <Card className="relative overflow-hidden border bg-gradient-to-br from-card to-blue-500/5 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Till Drawer Cash Balance
            </span>
            <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
              <Vault className="size-5" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
              ₱{drawerCashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1 text-blue-600 font-medium">
                <ShieldCheck className="size-3.5" /> Zero Variance
              </span>
              <span>Shift #0891</span>
            </div>
          </div>

          <div className="mt-3 border-t pt-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Opening: <strong className="font-mono text-foreground">₱15,000</strong></span>
            <span>Net Inflow: <strong className="font-mono text-emerald-600">+₱40,050</strong></span>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Outflow & Petty Cash */}
      <Card className="relative overflow-hidden border bg-gradient-to-br from-card to-amber-500/5 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Disbursements & Petty Cash
            </span>
            <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <Banknote className="size-5" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
              ₱{totalOutflow.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1 text-amber-600 font-medium">
                <ArrowDownRight className="size-3.5" /> 2 Vouchers Paid
              </span>
              <span>Fleet & HR</span>
            </div>
          </div>

          <div className="mt-3 border-t pt-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Pending Liquidation: <strong className="font-mono text-amber-600">1 Item</strong></span>
            <span>Max Limit: <strong className="font-mono text-foreground">₱20,000</strong></span>
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Pending Invoices Queue */}
      <Card className="relative overflow-hidden border bg-gradient-to-br from-card to-purple-500/5 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pending Queue (ISMERS)
            </span>
            <div className="flex size-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
              <Receipt className="size-5" />
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {pendingCount}
              </div>
              <span className="text-xs text-muted-foreground">Invoices ready</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-mono font-medium text-foreground">
                ₱{pendingTotalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <Badge variant="secondary" className="text-[10px] py-0 px-1.5 bg-purple-500/10 text-purple-600">
                Action Required
              </Badge>
            </div>
          </div>

          <div className="mt-3 border-t pt-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Modules: <strong className="text-foreground">HR, Fleet, CRM, SCM</strong></span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
