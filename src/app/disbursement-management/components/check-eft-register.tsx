"use client"

import * as React from "react"
import { CheckCircle2, FileCode, ListChecks, Printer, Trash2 } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { canVoidCheck } from "../data/disbursement-rules"
import type { BankAccount, CheckRecord, CheckStatus, EFTBatch, EftStatus, PaymentRun, PaymentRunStatus } from "../data/mock-data"

interface CheckEftRegisterProps {
  checks: CheckRecord[]
  eftBatches: EFTBatch[]
  paymentRuns: PaymentRun[]
  bankAccounts?: BankAccount[]
  onVoidCheck: (id: string) => void
}

const formatPHP = (val: number) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(val)
}

const CHECK_STATUS_STYLES: Record<CheckStatus, string> = {
  draft: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  printed: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  issued: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  cleared: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  voided: "bg-red-500/10 text-red-500 border-red-500/20",
}

const EFT_STATUS_STYLES: Record<EftStatus, string> = {
  draft: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  approved: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  transmitted: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  settled: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-500 border-red-500/20",
}

const RUN_STATUS_STYLES: Record<PaymentRunStatus, string> = {
  draft: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  for_approval: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  approved: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  transmitted: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  settled: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  cancelled: "bg-rose-500/10 text-rose-500 border-rose-500/20",
}

function amountToWords(amount: number): string {
  const to19 = [
    "Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
  ]
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

  const numToWords = (n: number): string => {
    if (n < 20) return to19[n]
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + to19[n % 10] : "")
    if (n < 1000) return to19[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + numToWords(n % 100) : "")
    if (n < 1000000) return numToWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + numToWords(n % 1000) : "")
    return n.toString()
  }

  const whole = Math.floor(amount)
  const cents = Math.round((amount - whole) * 100)

  let result = numToWords(whole) + " Pesos"
  if (cents > 0) {
    result += ` and ${cents}/100`
  } else {
    result += " Only"
  }
  return result
}

export function CheckEftRegister({ checks, eftBatches, paymentRuns, bankAccounts = [], onVoidCheck }: CheckEftRegisterProps) {
  const [selectedCheck, setSelectedCheck] = React.useState<CheckRecord | null>(null)
  const [showCheckDialog, setShowCheckDialog] = React.useState(false)

  const handlePrintCheck = (check: CheckRecord) => {
    setSelectedCheck(check)
    setShowCheckDialog(true)
  }

  const handleDownloadACH = (batch: EFTBatch) => {
    const xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${batch.batchRef}</MsgId>
      <CreDtTm>${new Date().toISOString()}</CreDtTm>
      <NbOfTxs>${batch.voucherCount}</NbOfTxs>
      <CtrlSum>${batch.totalAmount}</CtrlSum>
      <InitgPty><Nm>ISMERS Enterprise Systems Inc.</Nm></InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>PMT-${batch.id}</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <Dbtr><Nm>ISMERS Primary Account</Nm></Dbtr>
      <DbtrAgt><FinInstnId><Nm>${batch.bankName}</Nm></FinInstnId></DbtrAgt>
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`

    const blob = new Blob([xmlContent], { type: "text/xml" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${batch.batchRef}_ISO20022.xml`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <Tabs defaultValue="checks" className="w-full">
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <TabsList className="bg-muted/40 p-0.5">
            <TabsTrigger value="checks" className="cursor-pointer text-xs">Check Register</TabsTrigger>
            <TabsTrigger value="eft" className="cursor-pointer text-xs">EFT/ACH Batch Log</TabsTrigger>
            <TabsTrigger value="runs" className="cursor-pointer text-xs">Payment Run Register</TabsTrigger>
          </TabsList>
        </div>

        {/* 1. CHECK REGISTER */}
        <TabsContent value="checks" className="space-y-4 outline-hidden">
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle>Physical Checks Registry</CardTitle>
              <CardDescription>Lifecycle: draft → printed → issued → cleared / voided. Cleared checks cannot be voided.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs font-semibold text-muted-foreground/80 bg-muted/10">
                      <th className="py-3 px-4">Check Number</th>
                      <th className="py-3 px-4">Payee</th>
                      <th className="py-3 px-4">Issuing Bank</th>
                      <th className="py-3 px-4">Issue Date</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {checks.map((check) => {
                      const isVoided = check.status === "voided"
                      const verdict = canVoidCheck(check)
                      return (
                        <tr key={check.id} className="hover:bg-muted/10 transition-colors">
                          <td className="py-3 px-4 font-mono font-semibold">{check.checkNo}</td>
                          <td className="py-3 px-4">{check.payee}</td>
                          <td className="py-3 px-4 text-xs text-muted-foreground">{check.bankName}</td>
                          <td className="py-3 px-4 text-xs">{check.date}</td>
                          <td className={`py-3 px-4 font-bold ${isVoided ? "line-through text-muted-foreground" : ""}`}>{formatPHP(check.amount)}</td>
                          <td className="py-3 px-4 text-center">
                            <Badge className={`text-[10px] capitalize px-2 py-0.5 border ${CHECK_STATUS_STYLES[check.status]}`}>{check.status}</Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!isVoided && (
                                <>
                                  <Button variant="outline" size="sm" onClick={() => handlePrintCheck(check)} className="h-7 text-xs flex items-center gap-1 cursor-pointer">
                                    <Printer className="size-3" /> View / Print
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!verdict.allowed}
                                    title={verdict.reason}
                                    onClick={() => onVoidCheck(check.id)}
                                    className="h-7 text-xs text-rose-500 border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    <Trash2 className="size-3" /> Void
                                  </Button>
                                </>
                              )}
                              {isVoided && <span className="text-xs text-muted-foreground italic">Reversed / audit logged</span>}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. EFT BATCH LOG */}
        <TabsContent value="eft" className="space-y-4 outline-hidden">
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle>Electronic Funds Transfer (EFT) Runs</CardTitle>
              <CardDescription>Lifecycle: draft → approved → transmitted → settled / rejected</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs font-semibold text-muted-foreground/80 bg-muted/10">
                      <th className="py-3 px-4">Batch Reference</th>
                      <th className="py-3 px-4">Debit Bank</th>
                      <th className="py-3 px-4 text-center">Transactions</th>
                      <th className="py-3 px-4">Run Date</th>
                      <th className="py-3 px-4">Total Amount</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {eftBatches.map((batch) => (
                      <tr key={batch.id} className="hover:bg-muted/10 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold">{batch.batchRef}</td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">{batch.bankName}</td>
                        <td className="py-3 px-4 text-center tabular-nums">{batch.voucherCount}</td>
                        <td className="py-3 px-4 text-xs">{batch.date}</td>
                        <td className="py-3 px-4 font-bold">{formatPHP(batch.totalAmount)}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge className={`text-[10px] capitalize px-2 py-0.5 border ${EFT_STATUS_STYLES[batch.status]}`}>{batch.status}</Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button variant="outline" size="sm" onClick={() => handleDownloadACH(batch)} className="h-8 text-xs flex items-center gap-1.5 ml-auto cursor-pointer">
                            <FileCode className="size-3.5 text-blue-500" /> Export ISO-20022 XML
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. PAYMENT RUN REGISTER */}
        <TabsContent value="runs" className="space-y-4 outline-hidden">
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2"><ListChecks className="size-4 text-primary" /> Payment Run Register</CardTitle>
              <CardDescription>
                Consolidated maker → approver → transmission → settlement trail
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs font-semibold text-muted-foreground/80 bg-muted/10">
                      <th className="py-3 px-4">Run No.</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Method</th>
                      <th className="py-3 px-4">Source Bank</th>
                      <th className="py-3 px-4">Maker / Approver</th>
                      <th className="py-3 px-4">Created</th>
                      <th className="py-3 px-4">Total</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {paymentRuns.map((run) => {
                      const bank = bankAccounts.find((b) => b.id === run.sourceBankId)
                      return (
                        <tr key={run.id} className="hover:bg-muted/10 transition-colors">
                          <td className="py-3 px-4 font-mono font-semibold">{run.runNo}</td>
                          <td className="py-3 px-4 text-xs capitalize">{run.runType.replace("_", " ")}</td>
                          <td className="py-3 px-4 text-xs">{run.paymentMethod}</td>
                          <td className="py-3 px-4 text-xs text-muted-foreground">{bank?.name ?? run.sourceBankId}</td>
                          <td className="py-3 px-4 text-xs">
                            <div>{run.maker}</div>
                            <div className="text-muted-foreground">{run.approver ?? "Pending approver"}</div>
                          </td>
                          <td className="py-3 px-4 text-xs">{run.createdAt}</td>
                          <td className="py-3 px-4 font-bold">{formatPHP(run.total)}</td>
                          <td className="py-3 px-4 text-center">
                            <Badge className={`text-[10px] capitalize px-2 py-0.5 border ${RUN_STATUS_STYLES[run.status]}`}>
                              {run.status.replace("_", " ")}
                            </Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* CHECK PRINT PREVIEW DIALOG */}
      <Dialog open={showCheckDialog} onOpenChange={setShowCheckDialog}>
        <DialogContent className="max-w-2xl bg-card border border-border p-6 shadow-2xl">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-md font-semibold flex items-center gap-2">
              <Printer className="size-4 text-primary" /> Physical Check Print Queue Preview
            </DialogTitle>
            <DialogDescription>Check document layout aligned with standard MICR-check stock formats</DialogDescription>
          </DialogHeader>

          {selectedCheck && (
            <div className="space-y-6 pt-4">
              <div className="relative border-4 border-dashed border-muted-foreground/30 p-5 rounded-lg bg-amber-500/5 text-slate-800 dark:text-slate-200 overflow-hidden font-sans border-box shadow-inner">
                <div className="absolute inset-0 border border-slate-600/10 pointer-events-none rounded-sm" />
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm tracking-tight text-primary">ISMERS ENTERPRISE SYSTEMS</h4>
                    <p className="text-[10px] text-muted-foreground leading-tight">Service Management and Enterprise Resource System</p>
                    <p className="text-[9px] text-muted-foreground leading-tight">Financial Treasury Domain - Disbursement Unit</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold mb-1">CHECK NO. <span className="font-mono text-sm text-red-600 font-bold">{selectedCheck.checkNo}</span></div>
                    <div className="text-[10px] border-b pb-0.5 border-dashed">Date: <span className="font-medium font-mono">{selectedCheck.date}</span></div>
                  </div>
                </div>

                <div className="mt-4 flex justify-between items-center text-xs">
                  <div className="font-bold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="size-4 text-blue-600" /> {selectedCheck.bankName}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Disbursement Clearing Unit</div>
                </div>

                <div className="mt-6 flex items-baseline gap-3 border-b border-slate-500 pb-1.5">
                  <span className="text-xs font-bold text-slate-500">PAY TO THE ORDER OF:</span>
                  <span className="text-sm font-semibold flex-1 font-serif underline decoration-dotted">{selectedCheck.payee}</span>
                  <div className="border-2 border-slate-600 px-2.5 py-1 bg-background text-sm font-bold font-mono rounded-xs">
                    PHP {formatPHP(selectedCheck.amount).replace("₱", "")}
                  </div>
                </div>

                <div className="mt-4 flex items-baseline gap-3 border-b border-slate-500 pb-1.5 text-xs">
                  <span className="font-bold text-slate-500">PESOS:</span>
                  <span className="font-serif italic flex-1 truncate">{amountToWords(selectedCheck.amount)}</span>
                </div>

                <div className="mt-8 flex justify-between items-end">
                  <div className="text-[10px] max-w-[200px]">
                    <span className="font-semibold block">MEMO:</span>
                    <span className="text-muted-foreground italic font-serif">Settlement of Voucher #{selectedCheck.voucherId ?? "N/A"}</span>
                  </div>
                  <div className="text-center w-[160px]">
                    <div className="font-serif italic text-md text-blue-700 select-none pb-1 font-bold">A. Dela Cruz</div>
                    <div className="border-t border-slate-500 text-[9px] font-semibold text-muted-foreground uppercase pt-1">Authorized Signatory</div>
                  </div>
                </div>

                <div className="mt-6 pt-2 text-center border-t border-slate-500/10">
                  <span className="font-mono text-sm tracking-widest text-slate-700/80 dark:text-slate-300/80">
                    ⑆010300022⑆  {selectedCheck.checkNo}⑈  98312940
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button variant="outline" onClick={() => setShowCheckDialog(false)} className="cursor-pointer">Close Preview</Button>
                <Button onClick={() => window.print()} className="cursor-pointer">
                  <Printer className="size-4 mr-1.5" /> Print Check Document
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
