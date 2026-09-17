"use client"

import * as React from "react"
import { AlertTriangle } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

import type { Task } from "../data/schema"
import { getEligibleInvoices } from "../utils/bulk-actions"
import type { BulkActionType } from "../utils/bulk-actions"

const money = (amount = 0) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount)

const ACTION_LABELS: Record<BulkActionType, string> = {
  approve: "Approve",
  schedule: "Schedule Payment",
  "change-priority": "Change Priority",
  "assign-branch": "Assign Branch",
  export: "Export",
}

const ACTION_DESCRIPTIONS: Record<BulkActionType, string> = {
  approve: "approve",
  schedule: "schedule payment for",
  "change-priority": "change priority of",
  "assign-branch": "reassign the branch of",
  export: "export",
}

interface BulkActionConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  action: BulkActionType
  selectedInvoices: Task[]
  /** Extra detail, e.g. new priority or branch name */
  detail?: string
  onConfirm: () => void
}

export function BulkActionConfirmDialog({
  open,
  onOpenChange,
  action,
  selectedInvoices,
  detail,
  onConfirm,
}: BulkActionConfirmDialogProps) {
  const eligible = getEligibleInvoices(selectedInvoices, action)
  const skipped = selectedInvoices.length - eligible.length
  const total = eligible.reduce((sum, inv) => sum + (inv.amount ?? 0), 0)

  const label = ACTION_LABELS[action] ?? action
  const verb = ACTION_DESCRIPTIONS[action] ?? action

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {label} {eligible.length} invoice{eligible.length !== 1 ? "s" : ""}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3 pt-1">
              <p>
                You are about to{" "}
                <span className="font-medium text-foreground">
                  {verb} {eligible.length} invoice
                  {eligible.length !== 1 ? "s" : ""}
                </span>
                {detail ? (
                  <span>
                    {" "}
                    to{" "}
                    <span className="font-medium text-foreground">{detail}</span>
                  </span>
                ) : null}
                {" "}totaling{" "}
                <span className="font-medium text-foreground">
                  {money(total)}
                </span>
                .
              </p>

              {skipped > 0 && (
                <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    <span className="font-semibold">
                      {skipped} invoice{skipped !== 1 ? "s" : ""} will be
                      skipped
                    </span>{" "}
                    — they are not eligible for this action and will remain
                    unchanged.
                  </p>
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
            className="cursor-pointer"
            disabled={eligible.length === 0}
          >
            {label} {eligible.length > 0 ? eligible.length : ""} invoice
            {eligible.length !== 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
