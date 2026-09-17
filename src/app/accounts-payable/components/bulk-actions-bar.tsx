"use client"

import * as React from "react"
import {
  CheckCircle2,
  CalendarClock,
  Flag,
  Building2,
  Download,
  X,
  ChevronDown,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"

import type { Task } from "../data/schema"
import { branches, priorities } from "../data/data"
import {
  getDisabledReason,
  getEligibleInvoices,
  exportInvoicesCSV,
} from "../utils/bulk-actions"
import type { BulkActionType, BulkActionPayload } from "../utils/bulk-actions"
import { BulkActionConfirmDialog } from "./bulk-action-confirm-dialog"

const money = (amount = 0) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount)

interface BulkActionsBarProps {
  selectedInvoices: Task[]
  onAction: (payload: BulkActionPayload) => void
  onClearSelection: () => void
}

interface PendingAction {
  type: BulkActionType
  detail?: string
  payload: BulkActionPayload
}

export function BulkActionsBar({
  selectedInvoices,
  onAction,
  onClearSelection,
}: BulkActionsBarProps) {
  const [pendingAction, setPendingAction] = React.useState<PendingAction | null>(
    null
  )

  const count = selectedInvoices.length
  const selectedTotal = selectedInvoices.reduce(
    (sum, inv) => sum + (inv.amount ?? 0),
    0
  )

  // Pre-compute disabled reasons
  const approveDisabled = getDisabledReason(selectedInvoices, "approve")
  const scheduleDisabled = getDisabledReason(selectedInvoices, "schedule")
  const priorityDisabled = getDisabledReason(selectedInvoices, "change-priority")

  // Count of eligible for each action
  const approveEligible = getEligibleInvoices(selectedInvoices, "approve").length
  const scheduleEligible = getEligibleInvoices(selectedInvoices, "schedule").length

  const requestAction = (action: PendingAction) => {
    // export doesn't need a dialog
    if (action.type === "export") {
      exportInvoicesCSV(selectedInvoices)
      return
    }
    setPendingAction(action)
  }

  const handleConfirm = () => {
    if (!pendingAction) return
    onAction(pendingAction.payload)
    setPendingAction(null)
  }

  return (
    <>
      {/* Accessible live region */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {count} invoice{count !== 1 ? "s" : ""} selected.
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 shadow-sm">
        {/* Selection summary */}
        <div className="flex items-center gap-3 text-sm">
          <span className="font-semibold text-primary">
            {count} invoice{count !== 1 ? "s" : ""} selected
          </span>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-muted-foreground">
            {money(selectedTotal)} selected
          </span>
        </div>

        <Separator orientation="vertical" className="mx-1 hidden h-6 md:block" />

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Approve */}
          <ActionButton
            icon={<CheckCircle2 className="h-4 w-4" />}
            label={
              approveEligible > 0 && approveEligible < count
                ? `Approve (${approveEligible})`
                : "Approve"
            }
            disabled={!!approveDisabled}
            tooltip={approveDisabled ?? undefined}
            onClick={() =>
              requestAction({
                type: "approve",
                payload: { type: "approve" },
              })
            }
            variant="default"
          />

          {/* Schedule Payment */}
          <ActionButton
            icon={<CalendarClock className="h-4 w-4" />}
            label={
              scheduleEligible > 0 && scheduleEligible < count
                ? `Schedule (${scheduleEligible})`
                : "Schedule Payment"
            }
            disabled={!!scheduleDisabled}
            tooltip={scheduleDisabled ?? undefined}
            onClick={() =>
              requestAction({
                type: "schedule",
                payload: { type: "schedule" },
              })
            }
            variant="outline"
          />

          {/* Change Priority */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!!priorityDisabled}
                    className="cursor-pointer gap-1.5"
                    aria-label="Change priority"
                  >
                    <Flag className="h-4 w-4" />
                    <span className="hidden md:inline">Priority</span>
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              {priorityDisabled && (
                <TooltipContent side="top">
                  <p>{priorityDisabled}</p>
                </TooltipContent>
              )}
            </Tooltip>
            <DropdownMenuContent align="start">
              {priorities.map((p) => (
                <DropdownMenuItem
                  key={p.value}
                  className="cursor-pointer"
                  onClick={() =>
                    requestAction({
                      type: "change-priority",
                      detail: p.label,
                      payload: {
                        type: "change-priority",
                        priority: p.value,
                      },
                    })
                  }
                >
                  {p.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Assign Branch */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer gap-1.5"
                aria-label="Assign branch"
              >
                <Building2 className="h-4 w-4" />
                <span className="hidden md:inline">Branch</span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
              {branches.map((b) => (
                <DropdownMenuItem
                  key={b.value}
                  className="cursor-pointer"
                  onClick={() =>
                    requestAction({
                      type: "assign-branch",
                      detail: b.label,
                      payload: {
                        type: "assign-branch",
                        branch: b.value,
                      },
                    })
                  }
                >
                  {b.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export */}
          <ActionButton
            icon={<Download className="h-4 w-4" />}
            label="Export"
            disabled={false}
            onClick={() =>
              requestAction({
                type: "export",
                payload: { type: "export" },
              })
            }
            variant="outline"
          />
        </div>

        {/* Spacer + Clear */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onClearSelection}
            className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            aria-label="Clear selection"
          >
            Clear selection
          </button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClearSelection}
            className="h-7 w-7 cursor-pointer"
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {pendingAction && (
        <BulkActionConfirmDialog
          open={!!pendingAction}
          onOpenChange={(open) => {
            if (!open) setPendingAction(null)
          }}
          action={pendingAction.type}
          selectedInvoices={selectedInvoices}
          detail={pendingAction.detail}
          onConfirm={handleConfirm}
        />
      )}
    </>
  )
}

// ─── Helper sub-component ────────────────────────────────────────────────────

interface ActionButtonProps {
  icon: React.ReactNode
  label: string
  disabled: boolean
  tooltip?: string
  onClick: () => void
  variant?: "default" | "outline" | "ghost"
}

function ActionButton({
  icon,
  label,
  disabled,
  tooltip,
  onClick,
  variant = "outline",
}: ActionButtonProps) {
  const btn = (
    <Button
      variant={variant}
      size="sm"
      disabled={disabled}
      onClick={onClick}
      className="cursor-pointer gap-1.5"
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </Button>
  )

  if (disabled && tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {/* Wrap in span so tooltip works on disabled button */}
          <span className="inline-flex">{btn}</span>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return btn
}
