"use client"

import {
  ArrowUpRight,
  BadgeDollarSign,
  CalendarDays,
  FileCheck2,
  Landmark,
  ReceiptText,
  ShieldCheck,
} from "lucide-react"

import { BaseLayout } from "@/components/layouts/base-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const summaryCards = [
  {
    title: "Estimated Tax Payable",
    amount: 2845000,
    change: "+6.2%",
    icon: Landmark,
    tone: "text-emerald-600",
  },
  {
    title: "VAT Compliance",
    amount: 926500,
    change: "+2.8%",
    icon: ReceiptText,
    tone: "text-sky-600",
  },
  {
    title: "Withholding / Employer Tax",
    amount: 589000,
    change: "+4.1%",
    icon: BadgeDollarSign,
    tone: "text-violet-600",
  },
  {
    title: "Compliance Status",
    amount: "92%",
    change: "On track",
    icon: ShieldCheck,
    tone: "text-amber-600",
  },
]

const taxBreakdown = [
  { type: "Corporate Income Tax", jurisdiction: "Philippines", amount: 1425000, due: "2026-08-15", status: "Pending Review" },
  { type: "Value Added Tax", jurisdiction: "National", amount: 926500, due: "2026-07-25", status: "Ready to File" },
  { type: "Withholding Tax", jurisdiction: "Payroll & Contractors", amount: 589000, due: "2026-07-10", status: "Scheduled" },
  { type: "Local Business Tax", jurisdiction: "Metro Manila", amount: 255000, due: "2026-07-31", status: "Drafted" },
]

const upcomingDeadlines = [
  { label: "Quarterly VAT Return", date: "July 25, 2026", owner: "Finance Ops" },
  { label: "Payroll Withholding Filing", date: "July 10, 2026", owner: "HR & Payroll" },
  { label: "Annual Audit Support Pack", date: "August 15, 2026", owner: "Compliance Team" },
]

const recentFilings = [
  { filing: "Q2 Income Tax Return", period: "Apr - Jun 2026", status: "Filed", amount: 1425000 },
  { filing: "June Withholding Tax", period: "Jun 2026", status: "Approved", amount: 185000 },
  { filing: "Service Revenue VAT", period: "May 2026", status: "Pending", amount: 316200 },
]

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value)

export default function TaxManagementPage() {
  return (
    <BaseLayout
      title="Tax Management"
      description="Monitor tax obligations, filings, and compliance for the ISMERS financial ecosystem."
    >
      <div className="space-y-6 px-4 lg:px-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon
            return (
              <Card key={card.title}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-semibold">{card.amount}</span>
                        <span className={`flex items-center gap-1 text-sm ${card.tone}`}>
                          <ArrowUpRight className="size-3.5" />
                          {card.change}
                        </span>
                      </div>
                    </div>
                    <div className="rounded-lg border bg-muted/40 p-2.5">
                      <Icon className="size-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Tax Liability Breakdown</CardTitle>
              <CardDescription>Cross-module tax exposure spanning manpower deployment, payroll, procurement, and client services.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tax Type</TableHead>
                      <TableHead>Jurisdiction</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taxBreakdown.map((item) => (
                      <TableRow key={item.type}>
                        <TableCell className="font-medium">{item.type}</TableCell>
                        <TableCell>{item.jurisdiction}</TableCell>
                        <TableCell>{formatCurrency(item.amount)}</TableCell>
                        <TableCell>{item.due}</TableCell>
                        <TableCell>{item.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Deadlines</CardTitle>
              <CardDescription>Critical filing and review dates for the current month.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingDeadlines.map((item) => (
                <div key={item.label} className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-muted-foreground">Owner: {item.owner}</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-sm">
                      <CalendarDays className="size-4" />
                      {item.date}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
          <Card>
            <CardHeader>
              <CardTitle>Recent Filings</CardTitle>
              <CardDescription>Latest tax submissions and their approval state.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Filing</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentFilings.map((item) => (
                      <TableRow key={item.filing}>
                        <TableCell className="font-medium">{item.filing}</TableCell>
                        <TableCell>{item.period}</TableCell>
                        <TableCell>{item.status}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Compliance Snapshot</CardTitle>
              <CardDescription>Operational controls that keep the tax module audit-ready.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FileCheck2 className="size-4 text-emerald-600" />
                  18 documents reviewed
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Vendor certificates, payroll tax records, and monthly financial reports are current.
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ShieldCheck className="size-4 text-sky-600" />
                  3 exceptions flagged
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  One contractor withholding issue and two delayed invoice entries need follow-up.
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm font-medium">Tax strategy note</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  This module supports tax planning for client acquisition, recruitment and deployment, workforce operations, procurement, and regional-office activities.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </BaseLayout>
  )
}
