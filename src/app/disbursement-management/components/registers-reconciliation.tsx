"use client"

import * as React from "react"
import { AlertTriangle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { detectExceptions } from "../data/disbursement-rules"
import type {
  BankAccount,
  BankStatementItem,
  CheckRecord,
  DisbursementRequest,
  EFTBatch,
  PaymentRun,
  ReconciliationItem,
} from "../data/mock-data"
import { CheckEftRegister } from "./check-eft-register"
import { BankReconciliation } from "./bank-reconciliation"

interface RegistersReconciliationProps {
  bankAccounts: BankAccount[]
  checks: CheckRecord[]
  eftBatches: EFTBatch[]
  paymentRuns: PaymentRun[]
  requests: DisbursementRequest[]
  reconciliationItems: ReconciliationItem[]
  bankStatementItems: BankStatementItem[]
  onVoidCheck: (id: string) => void
  onMatch: (ledgerId: string, statementId: string) => void
  onAutoMatch: () => void
}

export function RegistersReconciliation({
  bankAccounts,
  checks,
  eftBatches,
  paymentRuns,
  requests,
  reconciliationItems,
  bankStatementItems,
  onVoidCheck,
  onMatch,
  onAutoMatch,
}: RegistersReconciliationProps) {
  const exceptions = React.useMemo(
    () => detectExceptions({ requests, eftBatches, reconciliationItems }),
    [requests, eftBatches, reconciliationItems],
  )

  return (
    <div className="space-y-5">
      <div className="px-4 lg:px-6">
        <Card className="bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-500" /> Exception Lens
            </CardTitle>
            <CardDescription>Overdue approvals, failed EFTs, rejected requests, and unreconciled outflows</CardDescription>
          </CardHeader>
          <CardContent>
            {exceptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open exceptions.</p>
            ) : (
              <div className="grid gap-2 md:grid-cols-2">
                {exceptions.map((exception) => (
                  <div key={exception.id} className="flex items-start gap-2 rounded-lg border bg-card/40 px-3 py-2">
                    <span className={`mt-1 h-1.5 w-1.5 rounded-full shrink-0 ${exception.severity === "high" ? "bg-rose-500" : "bg-amber-500"}`} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{exception.label}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{exception.detail}</p>
                    </div>
                    <Badge variant="outline" className={`ml-auto shrink-0 text-[9px] ${exception.severity === "high" ? "border-rose-500/30 text-rose-600" : "border-amber-500/30 text-amber-600"}`}>
                      {exception.kind.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CheckEftRegister
        checks={checks}
        eftBatches={eftBatches}
        paymentRuns={paymentRuns}
        bankAccounts={bankAccounts}
        onVoidCheck={onVoidCheck}
      />

      <BankReconciliation
        bankAccounts={bankAccounts}
        reconciliationItems={reconciliationItems}
        bankStatementItems={bankStatementItems}
        onMatch={onMatch}
        onAutoMatch={onAutoMatch}
      />
    </div>
  )
}
