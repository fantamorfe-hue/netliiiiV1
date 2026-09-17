"use client"

import * as React from "react"
import { AlertCircle, Check, Info, Landmark, Link, RefreshCw, Sparkles } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { evaluateMatch, type MatchConfidence } from "../data/disbursement-rules"
import type { BankAccount, BankStatementItem, ReconciliationItem } from "../data/mock-data"

interface BankReconciliationProps {
  bankAccounts: BankAccount[]
  reconciliationItems: ReconciliationItem[]
  bankStatementItems: BankStatementItem[]
  onMatch: (ledgerId: string, statementId: string) => void
  onAutoMatch: () => void
}

const formatPHP = (val: number) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(val)
}

const CONFIDENCE_LABELS: Record<MatchConfidence, string> = {
  exact: "Exact match (account + reference + amount + date)",
  probable: "Possible match (account + amount + date; verify reference)",
  none: "No match under current rules",
}

export function BankReconciliation({
  bankAccounts,
  reconciliationItems,
  bankStatementItems,
  onMatch,
  onAutoMatch,
}: BankReconciliationProps) {
  const [selectedLedgerId, setSelectedLedgerId] = React.useState<string | null>(null)
  const [selectedStatementId, setSelectedStatementId] = React.useState<string | null>(null)

  const bankName = React.useCallback(
    (id: string) => bankAccounts.find((b) => b.id === id)?.name ?? id,
    [bankAccounts],
  )

  const unmatchedLedger = React.useMemo(
    () => reconciliationItems.filter((item) => !item.matched && item.amount < 0),
    [reconciliationItems],
  )

  const unmatchedStatement = React.useMemo(
    () => bankStatementItems.filter((item) => !item.matched && item.amount < 0),
    [bankStatementItems],
  )

  const possibleMatches = React.useMemo(() => {
    const results: { ledger: ReconciliationItem; statement: BankStatementItem; confidence: MatchConfidence }[] = []
    unmatchedLedger.forEach((ledger) => {
      unmatchedStatement.forEach((statement) => {
        const confidence = evaluateMatch(ledger, statement)
        if (confidence !== "none") {
          results.push({ ledger, statement, confidence })
        }
      })
    })
    return results
  }, [unmatchedLedger, unmatchedStatement])

  const selectedLedgerItem = reconciliationItems.find((item) => item.id === selectedLedgerId)
  const selectedStatementItem = bankStatementItems.find((item) => item.id === selectedStatementId)

  const selectionConfidence: MatchConfidence =
    selectedLedgerItem && selectedStatementItem ? evaluateMatch(selectedLedgerItem, selectedStatementItem) : "none"

  const stats = React.useMemo(() => {
    const totalCount = reconciliationItems.length
    const matchedCount = reconciliationItems.filter((i) => i.matched).length
    const percent = totalCount > 0 ? Math.round((matchedCount / totalCount) * 100) : 100
    const unmatchedLedgerSum = unmatchedLedger.reduce((sum, item) => sum + Math.abs(item.amount), 0)
    const unmatchedStatementSum = unmatchedStatement.reduce((sum, item) => sum + Math.abs(item.amount), 0)
    return { totalCount, matchedCount, percent, unmatchedLedgerSum, unmatchedStatementSum }
  }, [reconciliationItems, unmatchedLedger, unmatchedStatement])

  const handleMatchSelected = () => {
    if (selectedLedgerId && selectedStatementId && selectionConfidence !== "none") {
      onMatch(selectedLedgerId, selectedStatementId)
      setSelectedLedgerId(null)
      setSelectedStatementId(null)
    }
  }

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Scoreboard */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-card/50 backdrop-blur-sm flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Reconciliation Progress</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-4 flex-1">
            <div className="relative flex items-center justify-center mb-2">
              <svg className="w-28 h-28 transform -rotate-90">
                <circle cx="56" cy="56" r="48" className="stroke-muted-foreground/10" strokeWidth="8" fill="transparent" />
                <circle
                  cx="56" cy="56" r="48"
                  className="stroke-primary transition-all duration-500"
                  strokeWidth="8" fill="transparent"
                  strokeDasharray={2 * Math.PI * 48}
                  strokeDashoffset={2 * Math.PI * 48 * (1 - stats.percent / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center text-center">
                <span className="text-2xl font-bold tracking-tight">{stats.percent}%</span>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Matched</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              {stats.matchedCount} of {stats.totalCount} ledger entries cleared
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Unreconciled Variances</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs text-muted-foreground block font-medium">Unmatched Book Items</span>
                <span className="text-lg font-bold font-mono tracking-tight text-rose-500">{formatPHP(stats.unmatchedLedgerSum)}</span>
              </div>
              <Badge variant="outline" className="border-rose-500/20 bg-rose-500/5 text-rose-500 text-[10px]">{unmatchedLedger.length} Items</Badge>
            </div>
            <div className="flex justify-between items-center border-t pt-3">
              <div>
                <span className="text-xs text-muted-foreground block font-medium">Unmatched Bank Items</span>
                <span className="text-lg font-bold font-mono tracking-tight text-amber-500">{formatPHP(stats.unmatchedStatementSum)}</span>
              </div>
              <Badge variant="outline" className="border-amber-500/20 bg-amber-500/5 text-amber-500 text-[10px]">{unmatchedStatement.length} Items</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Treasury Auto-Match Engine</CardTitle>
            <CardDescription className="text-xs">
              Matches only on bank account + reference + amount + date tolerance. Never amount alone.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 flex-1 flex flex-col justify-end gap-3">
            <div className="flex items-center gap-2 rounded-lg border py-2.5 px-3 bg-blue-500/10 text-blue-500 border-blue-500/30">
              <Info className="size-4 text-blue-500 shrink-0" />
              <span className="text-[10px] leading-tight">
                {possibleMatches.length} possible match(es) require manual confirmation.
              </span>
            </div>
            <Button onClick={onAutoMatch} disabled={unmatchedLedger.length === 0} className="w-full cursor-pointer h-10 flex items-center justify-center gap-2">
              <RefreshCw className="size-4" /> Run Exact Auto-Match
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Possible matches */}
      {possibleMatches.length > 0 && (
        <Card className="border bg-card/40">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="size-4 text-amber-500" /> Possible Matches
            </CardTitle>
            <CardDescription>Suggested pairs (not auto-applied). Review before reconciling.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-2">
            {possibleMatches.map(({ ledger, statement, confidence }) => (
              <div key={`${ledger.id}-${statement.id}`} className="flex items-center justify-between rounded-lg border bg-background/60 px-3 py-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <Badge className={`text-[10px] border ${confidence === "exact" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : "bg-amber-500/10 text-amber-600 border-amber-500/30"}`}>
                    {confidence}
                  </Badge>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">
                      {ledger.reference} <Link className="size-3 inline text-muted-foreground" /> {statement.reference ?? statement.description}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {bankName(ledger.bankAccountId)} • {formatPHP(Math.abs(ledger.amount))}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs cursor-pointer shrink-0"
                  onClick={() => { setSelectedLedgerId(ledger.id); setSelectedStatementId(statement.id) }}
                >
                  Review
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Manual Matching Workspace */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border bg-card/40">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Unmatched Book Items</span>
              <Badge variant="secondary" className="text-[10px] py-0 px-2 font-normal">General Ledger</Badge>
            </CardTitle>
            <CardDescription>Outbound payments recorded in ISMERS GL</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {unmatchedLedger.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <Check className="size-8 text-emerald-500 mb-2" />
                <p className="font-semibold text-xs text-foreground">Book is Fully Reconciled</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {unmatchedLedger.map((item) => {
                  const isSelected = selectedLedgerId === item.id
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedLedgerId(isSelected ? null : item.id)}
                      className={`p-3 border rounded-lg transition-all duration-150 cursor-pointer ${isSelected ? "border-blue-500 bg-blue-500/5 shadow-xs" : "border-border hover:border-muted-foreground/30 bg-card/40"}`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-xs text-foreground truncate">{item.description}</div>
                          <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                            {item.reference} • {item.date} • {bankName(item.bankAccountId)}
                          </div>
                        </div>
                        <span className="font-bold text-xs tabular-nums text-rose-500">{formatPHP(Math.abs(item.amount))}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border bg-card/40">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Unmatched Bank Items</span>
              <Badge variant="secondary" className="text-[10px] py-0 px-2 font-normal">Bank Feed</Badge>
            </CardTitle>
            <CardDescription>Uncleared charges reported on bank statements</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {unmatchedStatement.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <Check className="size-8 text-emerald-500 mb-2" />
                <p className="font-semibold text-xs text-foreground">Bank Feed Cleared</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {unmatchedStatement.map((item) => {
                  const isSelected = selectedStatementId === item.id
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedStatementId(isSelected ? null : item.id)}
                      className={`p-3 border rounded-lg transition-all duration-150 cursor-pointer ${isSelected ? "border-amber-500 bg-amber-500/5 shadow-xs" : "border-border hover:border-muted-foreground/30 bg-card/40"}`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-xs text-foreground truncate">{item.description}</div>
                          <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                            {item.date} • {bankName(item.bankAccountId)}
                          </div>
                        </div>
                        <span className="font-bold text-xs tabular-nums text-rose-500">{formatPHP(Math.abs(item.amount))}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Matching confirmation workspace */}
      {(selectedLedgerItem || selectedStatementItem) && (
        <Card className="border bg-muted/20">
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4 text-xs">
                {selectedLedgerItem ? (
                  <div className="rounded-lg border bg-background/80 p-2.5 flex items-center gap-2">
                    <Landmark className="size-3.5 text-blue-500" />
                    <div>
                      <span className="text-[10px] text-muted-foreground block leading-tight">Book Entry</span>
                      <span className="font-medium text-foreground">{selectedLedgerItem.reference}</span>
                      <span className="font-mono ml-2 font-bold text-rose-500">{formatPHP(Math.abs(selectedLedgerItem.amount))}</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground italic">Select a book item</span>
                )}

                <Link className="size-4 text-muted-foreground shrink-0 hidden md:block" />

                {selectedStatementItem ? (
                  <div className="rounded-lg border bg-background/80 p-2.5 flex items-center gap-2">
                    <Landmark className="size-3.5 text-amber-500" />
                    <div>
                      <span className="text-[10px] text-muted-foreground block leading-tight">Bank Item</span>
                      <span className="font-medium text-foreground truncate max-w-[140px] inline-block">{selectedStatementItem.reference ?? selectedStatementItem.description}</span>
                      <span className="font-mono ml-2 font-bold text-rose-500">{formatPHP(Math.abs(selectedStatementItem.amount))}</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground italic">Select a bank item</span>
                )}
              </div>

              {selectedLedgerItem && selectedStatementItem && (
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-semibold ${selectionConfidence === "exact" ? "text-emerald-600" : selectionConfidence === "probable" ? "text-amber-600" : "text-rose-600"}`}>
                    {CONFIDENCE_LABELS[selectionConfidence]}
                  </span>
                  {selectionConfidence !== "none" ? (
                    <Button onClick={handleMatchSelected} className="cursor-pointer font-medium h-9 text-xs">
                      <Check className="size-3.5 mr-1" /> Reconcile Selected
                    </Button>
                  ) : (
                    <div className="flex items-center gap-1.5 rounded-lg border py-1.5 px-3 bg-rose-500/10 text-rose-600 border-rose-500/30">
                      <AlertCircle className="size-4 text-rose-600 shrink-0" />
                      <span className="text-[10px] font-semibold">Rules not satisfied</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
