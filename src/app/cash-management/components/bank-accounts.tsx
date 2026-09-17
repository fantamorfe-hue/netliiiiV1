"use client"

import * as React from "react"
import { Landmark, Search } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { CashBankAccount } from "../data/mock-data"

interface BankAccountsViewProps {
  bankAccounts: CashBankAccount[]
}

const formatPHP = (val: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(val)

const accountTypeBadge: Record<string, string> = {
  checking: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  savings: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  petty_cash: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  payroll: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  trust: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
}

export function BankAccountsView({ bankAccounts }: BankAccountsViewProps) {
  const [search, setSearch] = React.useState("")
  const [typeFilter, setTypeFilter] = React.useState("all")

  const filtered = React.useMemo(() => {
    return bankAccounts.filter(a => {
      const matchSearch =
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.accountNo.toLowerCase().includes(search.toLowerCase()) ||
        a.bankName.toLowerCase().includes(search.toLowerCase())
      const matchType = typeFilter === "all" || a.accountType === typeFilter
      return matchSearch && matchType
    })
  }, [bankAccounts, search, typeFilter])

  const totalLedger = bankAccounts.filter(a => a.isActive).reduce((s, a) => s + a.ledgerBalance, 0)
  const totalBank = bankAccounts.filter(a => a.isActive).reduce((s, a) => s + a.bankBalance, 0)

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Ledger Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPHP(totalLedger)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Bank Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPHP(totalBank)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bankAccounts.filter(a => a.isActive).length}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pb-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Landmark className="size-4" />
              Treasury Account Registry
            </CardTitle>
            <CardDescription>
              All bank, payroll, savings, and petty cash accounts across ISMERS subsystems
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center border rounded-lg p-0.5 bg-muted/30">
              {["all", "checking", "savings", "payroll", "petty_cash"].map(type => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium capitalize cursor-pointer transition-colors ${
                    typeFilter === type
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {type === "all" ? "All" : type.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search accounts..."
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Account No.</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Subsystem</TableHead>
                  <TableHead className="text-right">Ledger Balance</TableHead>
                  <TableHead className="text-right">Bank Balance</TableHead>
                  <TableHead className="text-right">Min. Balance</TableHead>
                  <TableHead>Last Reconciled</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(account => {
                  const variance = account.ledgerBalance - account.bankBalance
                  const belowMin = account.ledgerBalance < account.minimumBalance
                  return (
                    <TableRow key={account.id}>
                      <TableCell>
                        <div className="font-medium">{account.name}</div>
                        <div className="text-xs text-muted-foreground">{account.bankName}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{account.accountNo}</TableCell>
                      <TableCell>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${accountTypeBadge[account.accountType]}`}>
                          {account.accountType.replace("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{account.subsystem}</TableCell>
                      <TableCell className="text-right font-medium">{formatPHP(account.ledgerBalance)}</TableCell>
                      <TableCell className="text-right">
                        <span>{formatPHP(account.bankBalance)}</span>
                        {variance !== 0 && (
                          <div className="text-[10px] text-amber-600">Δ {formatPHP(Math.abs(variance))}</div>
                        )}
                      </TableCell>
                      <TableCell className={`text-right text-sm ${belowMin ? "text-red-500 font-medium" : ""}`}>
                        {formatPHP(account.minimumBalance)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{account.lastReconciled}</TableCell>
                      <TableCell>
                        {account.isActive ? (
                          <Badge variant="outline" className="text-emerald-600 border-emerald-300">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
