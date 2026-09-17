"use client"

import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { dueInfo, type DueTone } from "../data/disbursement-rules"
import type { LinkedDocument, OperationalArea, PriorityTier } from "../data/mock-data"

export const formatPHP = (val: number, digits = 0) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: digits,
  }).format(val)

export function Money({ value, className = "" }: { value: number; className?: string }) {
  return <span className={`tabular-nums font-mono ${className}`}>{formatPHP(value)}</span>
}

const PRIORITY_STYLES: Record<PriorityTier, string> = {
  Payroll: "bg-rose-500/10 text-rose-600 border-rose-500/30",
  Statutory: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  "Client-site critical": "bg-blue-500/10 text-blue-600 border-blue-500/30",
  Contractual: "bg-slate-500/10 text-slate-600 border-slate-500/30",
  Discretionary: "bg-muted text-muted-foreground border-border",
}

export function PriorityBadge({ tier }: { tier: PriorityTier }) {
  return (
    <Badge variant="outline" className={`text-[10px] py-0 px-1.5 font-semibold ${PRIORITY_STYLES[tier]}`}>
      {tier}
    </Badge>
  )
}

const DUE_STYLES: Record<DueTone, string> = {
  overdue: "bg-rose-500/10 text-rose-600 border-rose-500/30",
  today: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  soon: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  later: "bg-muted text-muted-foreground border-border",
}

export function DueBadge({ dueDate, beforeCutoff = false }: { dueDate: string; beforeCutoff?: boolean }) {
  const info = dueInfo(dueDate)
  return (
    <div className="flex items-center gap-1.5">
      <Badge variant="outline" className={`text-[10px] py-0 px-1.5 ${DUE_STYLES[info.tone]}`}>{info.label}</Badge>
      {beforeCutoff && (
        <Badge variant="outline" className="text-[9px] py-0 px-1 border-rose-500/30 text-rose-600 bg-rose-500/5">
          Before payroll cut-off
        </Badge>
      )}
    </div>
  )
}

export interface RecordContext {
  operationalArea: OperationalArea
  clientSiteName?: string
  contractRef?: string
  deploymentRegion?: string
  payrollCycle?: string
  statutoryPeriod?: string
  headcount?: number
  linkedDocument: LinkedDocument
  fundingSourceName?: string
  dueDate: string
}

function ContextRow({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === undefined || value === null || value === "") return null
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 text-xs border-b border-border/50 last:border-0">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  )
}

export function ContextList({ context }: { context: RecordContext }) {
  return (
    <div className="rounded-lg border bg-card/40 px-3 py-1">
      <ContextRow label="Operational area" value={context.operationalArea} />
      <ContextRow label="Client site" value={context.clientSiteName} />
      <ContextRow label="Contract / JO" value={context.contractRef} />
      <ContextRow label="Deployment region" value={context.deploymentRegion} />
      <ContextRow label="Payroll cycle" value={context.payrollCycle} />
      <ContextRow label="Statutory period" value={context.statutoryPeriod} />
      <ContextRow label="Workforce impacted" value={context.headcount ? `${context.headcount} staff` : undefined} />
      <ContextRow label="Linked document" value={`${context.linkedDocument.type} · ${context.linkedDocument.ref}`} />
      <ContextRow label="Funding source" value={context.fundingSourceName} />
    </div>
  )
}

export function RecordDrawer({
  open,
  onOpenChange,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  subtitle?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="border-b pb-3">
          <SheetTitle className="text-base">{title}</SheetTitle>
          {subtitle && <SheetDescription>{subtitle}</SheetDescription>}
        </SheetHeader>
        <div className="space-y-4 px-4 pb-4">{children}</div>
        {footer && <div className="mt-auto border-t p-4">{footer}</div>}
      </SheetContent>
    </Sheet>
  )
}

export function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</h4>
      {children}
    </div>
  )
}
