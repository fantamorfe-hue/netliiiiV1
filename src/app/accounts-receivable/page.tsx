import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react"
import { useSearchParams } from "react-router-dom"
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  ClipboardList,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  FileText,
  Filter,
  HandCoins,
  Loader2,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react"

import { BaseLayout } from "@/components/layouts/base-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  cancelArPayment,
  createArInvoice,
  createArPayment,
  exportArReport,
  getArAgingReport,
  getArCustomers,
  getArDashboard,
  getArInvoice,
  getArInvoices,
  getArPayment,
  getArPayments,
} from "@/lib/pms-data"
import type {
  ArAgingRow,
  ArDashboard,
  ArInvoice,
  ArInvoiceDetail,
  ArPayment,
  ArPaymentAllocation,
  ArReportScope,
  Customer,
  Paginated,
  PaginationMeta,
} from "@/lib/pms-data"

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value)

const round2 = (value: number) => Math.round(value * 100) / 100

const statusBadgeVariant = (status: string): "secondary" | "destructive" | "outline" => {
  if (status === "Collected") return "secondary"
  if (status === "Overdue" || status === "Critical") return "destructive"
  return "outline"
}

const priorityBadgeVariant = (priority: string): "secondary" | "destructive" | "outline" => {
  if (priority === "High") return "destructive"
  if (priority === "Medium") return "secondary"
  return "outline"
}

const priorityBadgeClass = (priority: string) =>
  priority === "Medium" ? "bg-amber-500/10 text-amber-700 dark:text-amber-400" : ""

const paymentTermDays: Record<string, number> = { net15: 15, net30: 30, net60: 60, cod: 0 }

const computeDueDate = (invoiceDate: string, terms: string): string => {
  if (!invoiceDate) return ""
  const base = new Date(`${invoiceDate}T00:00:00`)
  base.setDate(base.getDate() + (paymentTermDays[terms] ?? 30))
  return base.toISOString().slice(0, 10)
}

function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

function TableStateRows({
  columns,
  loading,
  isEmpty,
  empty,
  children,
}: {
  columns: number
  loading: boolean
  isEmpty: boolean
  empty: string
  children: ReactNode
}) {
  if (loading) {
    return (
      <>
        {Array.from({ length: 3 }).map((_, rowIndex) => (
          <TableRow key={rowIndex}>
            {Array.from({ length: columns }).map((_, cellIndex) => (
              <TableCell key={cellIndex}>
                <Skeleton className="h-4 w-full" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </>
    )
  }

  if (isEmpty) {
    return (
      <TableRow>
        <TableCell colSpan={columns} className="py-6 text-center text-muted-foreground">
          {empty}
        </TableCell>
      </TableRow>
    )
  }

  return <>{children}</>
}

function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-6 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      {action}
    </div>
  )
}

function Pagination({
  meta,
  onPageChange,
}: {
  meta: PaginationMeta | undefined
  onPageChange: (page: number) => void
}) {
  if (!meta || meta.last_page <= 1) {
    return null
  }

  return (
    <div className="flex flex-col items-center justify-between gap-2 pt-4 text-sm sm:flex-row">
      <p className="text-muted-foreground">
        Page {meta.current_page} of {meta.last_page} · {meta.total} records
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={meta.current_page <= 1}
          onClick={() => onPageChange(meta.current_page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={meta.current_page >= meta.last_page}
          onClick={() => onPageChange(meta.current_page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

const metricTone: Record<string, string> = {
  default: "bg-primary/10 text-primary",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
}

function MetricCard({
  label,
  value,
  icon,
  secondary,
  tone = "default",
  warning = false,
  loading = false,
  onClick,
}: {
  label: string
  value: ReactNode
  icon: ReactNode
  secondary: ReactNode
  tone?: keyof typeof metricTone
  warning?: boolean
  loading?: boolean
  onClick?: () => void
}) {
  return (
    <Card
      className={cn(
        warning && "border-amber-500/40 bg-amber-500/5",
        onClick &&
          "cursor-pointer transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
      )}
      {...(onClick
        ? {
            role: "button",
            tabIndex: 0,
            onClick,
            onKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                onClick()
              }
            },
          }
        : {})}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>
            {loading ? (
              <Skeleton className="mt-3 h-7 w-28" />
            ) : (
              <p className="mt-2 text-2xl font-semibold whitespace-nowrap tabular-nums">{value}</p>
            )}
          </div>
          <div className={cn("rounded-lg p-2", metricTone[tone])}>{icon}</div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>{secondary}</span>
          {onClick ? <ChevronRight className="size-3.5 shrink-0" aria-hidden /> : null}
        </div>
      </CardContent>
    </Card>
  )
}

function SortableHead({
  label,
  field,
  sortBy,
  sortDir,
  onSort,
  className,
}: {
  label: string
  field: string
  sortBy: string
  sortDir: "asc" | "desc"
  onSort: (field: string) => void
  className?: string
}) {
  const active = sortBy === field

  return (
    <TableHead className={className}>
      <button
        type="button"
        className="inline-flex items-center gap-1 font-medium hover:text-foreground"
        onClick={() => onSort(field)}
      >
        {label}
        {active ? (
          sortDir === "asc" ? (
            <ArrowUp className="size-3.5" aria-hidden />
          ) : (
            <ArrowDown className="size-3.5" aria-hidden />
          )
        ) : null}
      </button>
    </TableHead>
  )
}

interface PaymentPrefill {
  customerId: number | null
  invoiceId: number | null
}

export default function AccountsReceivablePage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [dashboard, setDashboard] = useState<ArDashboard | null>(null)
  const [agingRows, setAgingRows] = useState<ArAgingRow[]>([])
  const [invoices, setInvoices] = useState<Paginated<ArInvoice> | null>(null)
  const [customers, setCustomers] = useState<Paginated<Customer> | null>(null)
  const [payments, setPayments] = useState<Paginated<ArPayment> | null>(null)
  const [allCustomers, setAllCustomers] = useState<Customer[]>([])

  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [invoicesLoading, setInvoicesLoading] = useState(true)
  const [customersLoading, setCustomersLoading] = useState(true)
  const [paymentsLoading, setPaymentsLoading] = useState(true)

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [exporting, setExporting] = useState(false)
  const [exportScope, setExportScope] = useState<ArReportScope>("collection_totals")

  const [customerSearch, setCustomerSearch] = useState("")
  const [customerPage, setCustomerPage] = useState(1)

  const [paymentSearch, setPaymentSearch] = useState("")
  const [paymentStatus, setPaymentStatus] = useState("all")
  const [paymentPage, setPaymentPage] = useState(1)

  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false)
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null)
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null)
  const [cancelTarget, setCancelTarget] = useState<ArPayment | null>(null)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentPrefill, setPaymentPrefill] = useState<PaymentPrefill | null>(null)

  const activeTab = searchParams.get("tab") ?? "overview"

  const invoiceSearch = searchParams.get("q") ?? ""
  const invoiceStatus = searchParams.get("status") ?? "all"
  const invoiceOverdue = searchParams.get("overdue") === "true"
  const invoiceOutstanding = searchParams.get("outstanding") === "true"
  const invoiceBucket = searchParams.get("bucket") ?? "all"
  const invoiceCustomer = searchParams.get("customer") ?? "all"
  const invoiceFrom = searchParams.get("from") ?? ""
  const invoiceTo = searchParams.get("to") ?? ""
  const invoiceSortBy = searchParams.get("sort_by") ?? "due_date"
  const invoiceSortDir: "asc" | "desc" = searchParams.get("sort_dir") === "desc" ? "desc" : "asc"
  const invoicePage = Number(searchParams.get("page") ?? "1")

  const debouncedInvoiceSearch = useDebouncedValue(invoiceSearch)
  const debouncedCustomerSearch = useDebouncedValue(customerSearch)
  const debouncedPaymentSearch = useDebouncedValue(paymentSearch)

  const updateParams = useCallback(
    (
      updates: Record<string, string | number | boolean | null>,
      options?: { replace?: boolean },
    ) => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous)
          Object.entries(updates).forEach(([key, value]) => {
            if (value === null || value === "" || value === false) {
              next.delete(key)
            } else {
              next.set(key, String(value))
            }
          })
          return next
        },
        { replace: options?.replace ?? false },
      )
    },
    [setSearchParams],
  )

  const setTab = useCallback((tab: string) => updateParams({ tab }), [updateParams])

  const openOverdueInvoices = useCallback(
    () => updateParams({ tab: "execution", overdue: true, bucket: null, page: null }),
    [updateParams],
  )

  const openAgingBucket = useCallback(
    (bucket: string) => updateParams({ tab: "execution", bucket, overdue: null, page: null }),
    [updateParams],
  )

  const loadDashboard = useCallback(async () => {
    setDashboardLoading(true)
    try {
      const [summary, aging] = await Promise.all([getArDashboard(), getArAgingReport()])
      setDashboard(summary.data)
      setAgingRows(aging.data)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load AR dashboard.")
    } finally {
      setDashboardLoading(false)
    }
  }, [])

  const loadInvoices = useCallback(async () => {
    setInvoicesLoading(true)
    try {
      const result = await getArInvoices({
        search: debouncedInvoiceSearch,
        status: invoiceStatus === "all" ? undefined : invoiceStatus,
        overdue: invoiceOverdue,
        outstanding: invoiceOutstanding,
        bucket: invoiceBucket === "all" ? undefined : invoiceBucket,
        customer_id: invoiceCustomer === "all" ? undefined : Number(invoiceCustomer),
        from: invoiceFrom || undefined,
        to: invoiceTo || undefined,
        sort_by: invoiceSortBy,
        sort_dir: invoiceSortDir,
        page: invoicePage,
        per_page: 10,
      })
      setInvoices(result)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load invoices.")
    } finally {
      setInvoicesLoading(false)
    }
  }, [
    debouncedInvoiceSearch,
    invoiceStatus,
    invoiceOverdue,
    invoiceOutstanding,
    invoiceBucket,
    invoiceCustomer,
    invoiceFrom,
    invoiceTo,
    invoiceSortBy,
    invoiceSortDir,
    invoicePage,
  ])

  const loadCustomers = useCallback(async () => {
    setCustomersLoading(true)
    try {
      const result = await getArCustomers({
        search: debouncedCustomerSearch,
        page: customerPage,
        per_page: 10,
      })
      setCustomers(result)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load customers.")
    } finally {
      setCustomersLoading(false)
    }
  }, [debouncedCustomerSearch, customerPage])

  const loadPayments = useCallback(async () => {
    setPaymentsLoading(true)
    try {
      const result = await getArPayments({
        search: debouncedPaymentSearch,
        status: paymentStatus === "all" ? undefined : paymentStatus,
        page: paymentPage,
        per_page: 10,
      })
      setPayments(result)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load collections.")
    } finally {
      setPaymentsLoading(false)
    }
  }, [debouncedPaymentSearch, paymentStatus, paymentPage])

  const loadAllCustomers = useCallback(async () => {
    try {
      const result = await getArCustomers({ per_page: 100, status: "active" })
      setAllCustomers(result.data)
    } catch {
      setAllCustomers([])
    }
  }, [])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  useEffect(() => {
    void loadInvoices()
  }, [loadInvoices])

  useEffect(() => {
    void loadCustomers()
  }, [loadCustomers])

  useEffect(() => {
    void loadPayments()
  }, [loadPayments])

  useEffect(() => {
    void loadAllCustomers()
  }, [loadAllCustomers])

  const handleInvoiceCreated = useCallback(
    async (invoice: ArInvoice) => {
      setSuccess(`Invoice ${invoice.invoice_number} created.`)
      await Promise.all([loadDashboard(), loadInvoices(), loadCustomers(), loadAllCustomers()])
    },
    [loadDashboard, loadInvoices, loadCustomers, loadAllCustomers],
  )

  const handleRecorded = useCallback(
    async (message: string) => {
      setSuccess(message)
      await Promise.all([loadDashboard(), loadInvoices(), loadPayments(), loadCustomers()])
    },
    [loadDashboard, loadInvoices, loadPayments, loadCustomers],
  )

  const handleExport = useCallback(async () => {
    setExporting(true)
    setError("")
    setSuccess("")
    try {
      const { blob, filename } = await exportArReport({
        report: exportScope,
        search: debouncedInvoiceSearch || undefined,
        customer_id: invoiceCustomer === "all" ? undefined : Number(invoiceCustomer),
        bucket: invoiceBucket === "all" ? undefined : invoiceBucket,
        from: invoiceFrom || undefined,
        to: invoiceTo || undefined,
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setSuccess(`Report exported as ${filename}.`)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to export the report.")
    } finally {
      setExporting(false)
    }
  }, [exportScope, debouncedInvoiceSearch, invoiceCustomer, invoiceBucket, invoiceFrom, invoiceTo])

  const handleSort = useCallback(
    (field: string) => {
      const nextDir = invoiceSortBy === field && invoiceSortDir === "asc" ? "desc" : "asc"
      updateParams({ sort_by: field, sort_dir: nextDir, page: null })
    },
    [invoiceSortBy, invoiceSortDir, updateParams],
  )

  const clearInvoiceFilters = useCallback(() => {
    updateParams({
      q: null,
      status: null,
      overdue: null,
      outstanding: null,
      bucket: null,
      customer: null,
      from: null,
      to: null,
      page: null,
    })
  }, [updateParams])

  const activeInvoiceFilters = useMemo(
    () =>
      [
        invoiceSearch,
        invoiceStatus !== "all" ? invoiceStatus : "",
        invoiceOverdue ? "overdue" : "",
        invoiceOutstanding ? "outstanding" : "",
        invoiceBucket !== "all" ? invoiceBucket : "",
        invoiceCustomer !== "all" ? invoiceCustomer : "",
        invoiceFrom,
        invoiceTo,
      ].filter(Boolean).length,
    [
      invoiceSearch,
      invoiceStatus,
      invoiceOverdue,
      invoiceOutstanding,
      invoiceBucket,
      invoiceCustomer,
      invoiceFrom,
      invoiceTo,
    ],
  )

  const openRecordPaymentFromInvoice = useCallback((detail: ArInvoiceDetail) => {
    setSelectedInvoiceId(null)
    setPaymentPrefill({ customerId: detail.customer?.id ?? null, invoiceId: detail.id })
    setPaymentDialogOpen(true)
  }, [])

  const totalOutstanding = dashboard?.total_outstanding ?? 0
  const overdueAmount = dashboard?.overdue_total ?? 0
  const collectionRate = dashboard?.collection_rate ?? 0
  const openInvoiceCount = dashboard?.open_invoices_count ?? 0

  const agingBuckets = useMemo(
    () =>
      dashboard
        ? [
            {
              key: "0-30",
              label: "0-30 days",
              amount: dashboard.aging.days_0_30,
              count: agingRows.filter((row) => row.bucket === "0-30").length,
              barClass: "bg-emerald-500",
              critical: false,
            },
            {
              key: "31-60",
              label: "31-60 days",
              amount: dashboard.aging.days_31_60,
              count: agingRows.filter((row) => row.bucket === "31-60").length,
              barClass: "bg-amber-500",
              critical: false,
            },
            {
              key: "61-90",
              label: "61-90 days",
              amount: dashboard.aging.days_61_90,
              count: agingRows.filter((row) => row.bucket === "61-90").length,
              barClass: "bg-orange-500",
              critical: false,
            },
            {
              key: ">90",
              label: "Over 90 days",
              amount: dashboard.aging.over_90,
              count: agingRows.filter((row) => row.bucket === ">90").length,
              barClass: "bg-destructive",
              critical: true,
            },
          ]
        : [],
    [dashboard, agingRows],
  )

  const followUps = useMemo(
    () =>
      agingRows
        .filter((row) => row.days_overdue > 0)
        .sort((left, right) => right.days_overdue - left.days_overdue)
        .slice(0, 4),
    [agingRows],
  )

  const totalReceivables = dashboard?.total_receivables ?? 0
  const collectedReceivables = dashboard?.collected_receivables ?? 0
  const overdueCount = dashboard?.overdue_count ?? 0

  const oldestActiveBucket = useMemo(
    () => [...agingBuckets].reverse().find((bucket) => bucket.amount > 0) ?? null,
    [agingBuckets],
  )

  const kpiLoading = dashboardLoading && !dashboard
  const overdueForSummary = invoiceOverdue ? invoices?.meta.total ?? 0 : overdueCount

  return (
    <BaseLayout
      title="Accounts Receivable (AR)"
      description="Manage invoices, aging, collections, and reporting for the ISMERS financial module."
    >
      <div className="space-y-6 px-4 lg:px-6">
        {error && (
          <div className="flex items-start justify-between gap-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <span className="flex items-start gap-2">
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{error}</span>
            </span>
            <Button variant="ghost" size="sm" aria-label="Dismiss error" onClick={() => setError("")}>
              Dismiss
            </Button>
          </div>
        )}
        {success && (
          <div className="flex items-start justify-between gap-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
            <span className="flex items-start gap-2">
              <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{success}</span>
            </span>
            <Button variant="ghost" size="sm" aria-label="Dismiss notice" onClick={() => setSuccess("")}>
              Dismiss
            </Button>
          </div>
        )}

        <div className="flex flex-col gap-4 rounded-xl border bg-background/70 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary">Receivables workspace</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Track client balances, aging, and collections.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setInvoiceDialogOpen(true)}>
              <Plus className="size-4" />
              New invoice
            </Button>
            <Button
              onClick={() => {
                setPaymentPrefill(null)
                setPaymentDialogOpen(true)
              }}
            >
              <HandCoins className="size-4" />
              Record payment
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Outstanding receivables"
            value={formatCurrency(totalOutstanding)}
            icon={<DollarSign className="size-5" />}
            secondary={`${openInvoiceCount} open invoices`}
            loading={kpiLoading}
            onClick={() => updateParams({ tab: "execution", outstanding: true, overdue: null, bucket: null, page: null })}
          />
          <MetricCard
            label="Overdue exposure"
            value={formatCurrency(overdueAmount)}
            icon={<AlertTriangle className="size-5" />}
            secondary={`${overdueCount} invoices past due`}
            tone="amber"
            warning={overdueAmount > 0}
            loading={kpiLoading}
            onClick={openOverdueInvoices}
          />
          <MetricCard
            label="Collection rate"
            value={`${collectionRate}%`}
            icon={<CheckCircle2 className="size-5" />}
            secondary={`${formatCurrency(collectedReceivables)} collected of ${formatCurrency(totalReceivables)}`}
            tone="emerald"
            loading={kpiLoading}
            onClick={() => setTab("requests")}
          />
          <MetricCard
            label="Open invoices"
            value={openInvoiceCount}
            icon={<FileText className="size-5" />}
            secondary={`${overdueCount} of ${openInvoiceCount} past due`}
            tone="sky"
            loading={kpiLoading}
            onClick={() => updateParams({ tab: "execution", overdue: null, outstanding: true, bucket: null, page: null })}
          />
        </div>

        <Tabs value={activeTab} onValueChange={setTab} className="w-full">
          <TabsList className="flex w-full items-center justify-start gap-1 overflow-x-auto border bg-muted/30 p-1">
            <TabsTrigger value="overview" className="flex-none cursor-pointer gap-1.5 text-xs">
              <Activity className="size-3.5" /> Overview
            </TabsTrigger>
            <TabsTrigger value="execution" className="flex-none cursor-pointer gap-1.5 text-xs">
              <FileText className="size-3.5" /> Invoices
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex-none cursor-pointer gap-1.5 text-xs">
              <ClipboardList className="size-3.5" /> Collections
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex-none cursor-pointer gap-1.5 text-xs">
              <Users className="size-3.5" /> Customers
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex-none cursor-pointer gap-1.5 text-xs">
              <CreditCard className="size-3.5" /> Payments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 outline-hidden">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <Card>
                <CardHeader>
                  <CardTitle>Aging exposure</CardTitle>
                  <CardDescription>Outstanding balance by days past due. Select a bucket to filter invoices.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dashboardLoading && agingBuckets.length === 0
                    ? Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                          <Skeleton className="h-2 w-full" />
                        </div>
                      ))
                    : agingBuckets.map((bucket) => {
                        const share =
                          totalOutstanding > 0
                            ? Math.round((bucket.amount / totalOutstanding) * 100)
                            : 0

                        return (
                          <button
                            key={bucket.key}
                            type="button"
                            className={cn(
                              "w-full space-y-2 rounded-lg border p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                              bucket.critical && bucket.amount > 0 && "border-destructive/30 bg-destructive/5",
                            )}
                            onClick={() => openAgingBucket(bucket.key)}
                            aria-label={`Show invoices in the ${bucket.label} aging bucket`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className={cn("size-2 rounded-full", bucket.barClass)} aria-hidden />
                                <p className="font-medium">{bucket.label}</p>
                                <Badge variant="outline">{bucket.count} invoices</Badge>
                              </div>
                              <p className={cn("font-semibold tabular-nums", bucket.critical && "text-destructive")}>
                                {formatCurrency(bucket.amount)}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                  className={cn("h-full rounded-full transition-all", bucket.barClass)}
                                  style={{ width: `${share}%` }}
                                />
                              </div>
                              <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                                {share}%
                              </span>
                            </div>
                          </button>
                        )
                      })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Priority follow-up</CardTitle>
                  <CardDescription>Oldest overdue invoices needing collection.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dashboardLoading && followUps.length === 0 ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="space-y-2 rounded-lg border p-3">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                    ))
                  ) : followUps.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-6 text-center">
                      <CircleCheck className="size-5 text-emerald-600" aria-hidden />
                      <p className="text-sm text-muted-foreground">
                        No overdue accounts — all invoices are within terms.
                      </p>
                    </div>
                  ) : (
                    followUps.map((row) => (
                      <div key={row.id} className="rounded-lg border p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{row.customer ?? row.invoice_number}</p>
                            <p className="text-xs text-muted-foreground">{row.invoice_number}</p>
                          </div>
                          <Badge
                            variant={priorityBadgeVariant(row.priority)}
                            className={priorityBadgeClass(row.priority)}
                          >
                            {row.priority}
                          </Badge>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <p className="text-sm">
                            <span className="font-medium text-destructive">{row.days_overdue} days</span>
                            <span className="text-muted-foreground"> · {formatCurrency(row.balance_due)}</span>
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            aria-label={`View invoice ${row.invoice_number}`}
                            onClick={() => setSelectedInvoiceId(row.id)}
                          >
                            View invoice
                            <ChevronRight className="size-3.5" aria-hidden />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="execution" className="mt-6 outline-hidden">
            <Card>
              <CardHeader>
                <CardTitle>Invoice register</CardTitle>
                <CardDescription>Service-based billing records awaiting settlement.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex flex-col gap-3">
                  <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
                    <Input
                      className="w-full md:max-w-sm"
                      placeholder="Search invoice, client, or service"
                      value={invoiceSearch}
                      onChange={(event) => updateParams({ q: event.target.value, page: null }, { replace: true })}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <Select
                        value={invoiceStatus}
                        onValueChange={(value) => updateParams({ status: value === "all" ? null : value, page: null })}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All statuses</SelectItem>
                          <SelectItem value="issued">Issued</SelectItem>
                          <SelectItem value="partially_paid">Partially paid</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="voided">Voided</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={invoiceBucket}
                        onValueChange={(value) => updateParams({ bucket: value === "all" ? null : value, page: null })}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="All aging" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All aging</SelectItem>
                          <SelectItem value="0-30">0-30 days</SelectItem>
                          <SelectItem value="31-60">31-60 days</SelectItem>
                          <SelectItem value="61-90">61-90 days</SelectItem>
                          <SelectItem value=">90">Over 90 days</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={invoiceCustomer}
                        onValueChange={(value) => updateParams({ customer: value === "all" ? null : value, page: null })}
                      >
                        <SelectTrigger className="w-44">
                          <SelectValue placeholder="All customers" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All customers</SelectItem>
                          {allCustomers.map((customer) => (
                            <SelectItem key={customer.id} value={String(customer.id)}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant={invoiceOverdue ? "default" : "outline"}
                        onClick={() => updateParams({ overdue: !invoiceOverdue, page: null })}
                      >
                        Overdue only
                      </Button>
                      <Button
                        variant={invoiceOutstanding ? "default" : "outline"}
                        onClick={() => updateParams({ outstanding: !invoiceOutstanding, page: null })}
                      >
                        Outstanding
                      </Button>
                      <Button variant="outline" disabled={invoicesLoading} onClick={() => void loadInvoices()}>
                        {invoicesLoading ? <Loader2 className="size-4 animate-spin" /> : null}
                        Refresh
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="invoice-from" className="text-xs text-muted-foreground">
                        From
                      </Label>
                      <Input
                        id="invoice-from"
                        type="date"
                        className="w-40"
                        value={invoiceFrom}
                        onChange={(event) => updateParams({ from: event.target.value, page: null }, { replace: true })}
                      />
                      <Label htmlFor="invoice-to" className="text-xs text-muted-foreground">
                        To
                      </Label>
                      <Input
                        id="invoice-to"
                        type="date"
                        className="w-40"
                        value={invoiceTo}
                        onChange={(event) => updateParams({ to: event.target.value, page: null }, { replace: true })}
                      />
                    </div>
                    <div className="flex items-center gap-2 sm:ml-auto">
                      <Badge variant="outline" className="gap-1">
                        <Filter className="size-3" aria-hidden />
                        {activeInvoiceFilters} active
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1"
                        disabled={activeInvoiceFilters === 0}
                        onClick={clearInvoiceFilters}
                      >
                        <X className="size-3.5" />
                        Clear filters
                      </Button>
                    </div>
                  </div>
                </div>
                <p className="mb-3 text-sm text-muted-foreground">
                  {invoices?.meta.total ?? 0} invoices · {overdueForSummary} overdue
                </p>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <SortableHead
                          label="Invoice"
                          field="invoice_number"
                          sortBy={invoiceSortBy}
                          sortDir={invoiceSortDir}
                          onSort={handleSort}
                        />
                        <TableHead>Client</TableHead>
                        <TableHead>Service</TableHead>
                        <SortableHead
                          label="Amount"
                          field="balance_due"
                          sortBy={invoiceSortBy}
                          sortDir={invoiceSortDir}
                          onSort={handleSort}
                          className="text-right"
                        />
                        <SortableHead
                          label="Due Date"
                          field="due_date"
                          sortBy={invoiceSortBy}
                          sortDir={invoiceSortDir}
                          onSort={handleSort}
                        />
                        <SortableHead
                          label="Status"
                          field="status"
                          sortBy={invoiceSortBy}
                          sortDir={invoiceSortDir}
                          onSort={handleSort}
                        />
                        <TableHead className="w-8" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableStateRows
                        columns={7}
                        loading={invoicesLoading}
                        isEmpty={(invoices?.data.length ?? 0) === 0}
                        empty="No invoices match these filters."
                      >
                        {invoices?.data.map((invoice) => (
                          <TableRow
                            key={invoice.id}
                            tabIndex={0}
                            className="cursor-pointer hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset focus-visible:outline-none"
                            onClick={() => setSelectedInvoiceId(invoice.id)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault()
                                setSelectedInvoiceId(invoice.id)
                              }
                            }}
                          >
                            <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                            <TableCell>{invoice.customer?.name ?? "—"}</TableCell>
                            <TableCell className="text-muted-foreground">{invoice.service ?? "—"}</TableCell>
                            <TableCell className="text-right font-medium tabular-nums">
                              {formatCurrency(invoice.balance_due)}
                            </TableCell>
                            <TableCell>
                              <span className={cn(invoice.days_overdue > 0 && "font-medium text-destructive")}>
                                {invoice.due_date}
                                {invoice.days_overdue > 0 ? ` · ${invoice.days_overdue}d` : ""}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusBadgeVariant(invoice.display_status)}>
                                {invoice.display_status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableStateRows>
                    </TableBody>
                  </Table>
                </div>
                {(invoices?.data.length ?? 0) === 0 && !invoicesLoading ? (
                  <div className="mt-4">
                    <EmptyState
                      message="No invoices to show."
                      action={
                        <Button size="sm" onClick={() => setInvoiceDialogOpen(true)}>
                          <Plus className="size-4" />
                          New invoice
                        </Button>
                      }
                    />
                  </div>
                ) : null}
                <Pagination
                  meta={invoices?.meta}
                  onPageChange={(page) => updateParams({ page })}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="mt-6 outline-hidden">
            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Collections performance</h2>
                  <p className="text-sm text-muted-foreground">Collection results and remaining exposure.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={exportScope} onValueChange={(value) => setExportScope(value as ArReportScope)}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Report scope" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="collection_totals">Collection totals</SelectItem>
                      <SelectItem value="aging_summary">Aging summary</SelectItem>
                      <SelectItem value="overdue_invoices">Overdue invoices</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button className="gap-2" disabled={exporting} onClick={() => void handleExport()}>
                    {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                    {exporting ? "Exporting…" : "Export report"}
                  </Button>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Receivables summary</CardTitle>
                  <CardDescription>Billed, collected, and remaining balances.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Total receivables</p>
                    {kpiLoading ? (
                      <Skeleton className="mt-2 h-7 w-28" />
                    ) : (
                      <p className="mt-1 text-xl font-semibold tabular-nums">{formatCurrency(totalReceivables)}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Collected receivables</p>
                    {kpiLoading ? (
                      <Skeleton className="mt-2 h-7 w-28" />
                    ) : (
                      <p className="mt-1 text-xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(collectedReceivables)}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Remaining outstanding</p>
                    {kpiLoading ? (
                      <Skeleton className="mt-2 h-7 w-28" />
                    ) : (
                      <p className="mt-1 text-xl font-semibold tabular-nums">{formatCurrency(totalOutstanding)}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">{overdueCount} invoices past due</p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Collection rate</CardTitle>
                    <CardDescription>Share of billed receivables already collected.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-end justify-between gap-3">
                      <span className="text-3xl font-semibold tabular-nums">{collectionRate}%</span>
                      <span className="text-right text-sm text-muted-foreground">
                        {formatCurrency(collectedReceivables)} of {formatCurrency(totalReceivables)}
                      </span>
                    </div>
                    <Progress value={collectionRate} />
                  </CardContent>
                </Card>

                <Card className={cn(oldestActiveBucket?.critical && "border-destructive/30 bg-destructive/5")}>
                  <CardHeader>
                    <CardTitle>Oldest exposure</CardTitle>
                    <CardDescription>Aging-to-action signal for collections.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {kpiLoading ? (
                      <Skeleton className="h-16 w-full" />
                    ) : oldestActiveBucket ? (
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "rounded-lg p-2",
                            oldestActiveBucket.critical
                              ? "bg-destructive/10 text-destructive"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                          )}
                        >
                          <AlertTriangle className="size-5" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {oldestActiveBucket.label} holds {formatCurrency(oldestActiveBucket.amount)}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Across {oldestActiveBucket.count} invoices — prioritize these collections first.
                          </p>
                          <Button
                            variant="link"
                            className="mt-1 h-auto p-0"
                            onClick={() => openAgingBucket(oldestActiveBucket.key)}
                          >
                            View invoices
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No outstanding balances to age.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="customers" className="mt-6 outline-hidden">
            <Card>
              <CardHeader>
                <CardTitle>Client accounts</CardTitle>
                <CardDescription>Customers with their outstanding receivable balances.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    className="w-full sm:max-w-sm"
                    placeholder="Search customer name or code"
                    value={customerSearch}
                    onChange={(event) => {
                      setCustomerSearch(event.target.value)
                      setCustomerPage(1)
                    }}
                  />
                  <Button variant="outline" disabled={customersLoading} onClick={() => void loadCustomers()}>
                    {customersLoading ? <Loader2 className="size-4 animate-spin" /> : null}
                    Refresh
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Terms</TableHead>
                        <TableHead className="text-right">Credit Limit</TableHead>
                        <TableHead className="text-right">Outstanding</TableHead>
                        <TableHead className="text-right">Invoices</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableStateRows
                        columns={7}
                        loading={customersLoading}
                        isEmpty={(customers?.data.length ?? 0) === 0}
                        empty="No customers match this search."
                      >
                        {customers?.data.map((customer) => {
                          const outstanding = customer.outstanding_balance ?? 0
                          const isActive = customer.status === "active"

                          return (
                            <TableRow
                              key={customer.id}
                              className={cn(!isActive && "bg-muted/30 text-muted-foreground")}
                            >
                              <TableCell className="font-medium">{customer.name}</TableCell>
                              <TableCell>{customer.code}</TableCell>
                              <TableCell className="uppercase">{customer.payment_terms ?? "—"}</TableCell>
                              <TableCell className="text-right tabular-nums">
                                {formatCurrency(customer.credit_limit)}
                              </TableCell>
                              <TableCell
                                className={cn(
                                  "text-right tabular-nums",
                                  outstanding > 0 && "font-semibold text-amber-700 dark:text-amber-400",
                                )}
                              >
                                {formatCurrency(outstanding)}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">{customer.invoices_count ?? 0}</TableCell>
                              <TableCell>
                                <Badge variant={isActive ? "secondary" : "outline"}>{customer.status}</Badge>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableStateRows>
                    </TableBody>
                  </Table>
                </div>
                <Pagination meta={customers?.meta} onPageChange={setCustomerPage} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="mt-6 outline-hidden">
            <Card>
              <CardHeader>
                <CardTitle>Customer collections</CardTitle>
                <CardDescription>Recorded payments applied against client invoices.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    className="w-full sm:max-w-sm"
                    placeholder="Search reference or customer"
                    value={paymentSearch}
                    onChange={(event) => {
                      setPaymentSearch(event.target.value)
                      setPaymentPage(1)
                    }}
                  />
                  <Select
                    value={paymentStatus}
                    onValueChange={(value) => {
                      setPaymentStatus(value)
                      setPaymentPage(1)
                    }}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" disabled={paymentsLoading} onClick={() => void loadPayments()}>
                    {paymentsLoading ? <Loader2 className="size-4 animate-spin" /> : null}
                    Refresh
                  </Button>
                  <Button
                    className="gap-2 sm:ml-auto"
                    onClick={() => {
                      setPaymentPrefill(null)
                      setPaymentDialogOpen(true)
                    }}
                  >
                    <HandCoins className="size-4" />
                    Record payment
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reference</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableStateRows
                        columns={7}
                        loading={paymentsLoading}
                        isEmpty={(payments?.data.length ?? 0) === 0}
                        empty="No collections recorded yet."
                      >
                        {payments?.data.map((payment) => (
                          <TableRow
                            key={payment.id}
                            tabIndex={0}
                            className="cursor-pointer hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset focus-visible:outline-none"
                            onClick={() => setSelectedPaymentId(payment.id)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault()
                                setSelectedPaymentId(payment.id)
                              }
                            }}
                          >
                            <TableCell className="font-medium">{payment.reference_number}</TableCell>
                            <TableCell>{payment.customer?.name ?? "—"}</TableCell>
                            <TableCell>{payment.payment_date}</TableCell>
                            <TableCell className="capitalize text-muted-foreground">
                              {payment.method.replace("_", " ")}
                            </TableCell>
                            <TableCell className="text-right font-medium tabular-nums">
                              {formatCurrency(payment.total_amount)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={payment.status === "completed" ? "secondary" : "outline"}>
                                {payment.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`View collection ${payment.reference_number}`}
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    setSelectedPaymentId(payment.id)
                                  }}
                                >
                                  <Eye className="size-4" />
                                </Button>
                                {payment.status === "completed" ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    aria-label={`Cancel collection ${payment.reference_number}`}
                                    onClick={(event) => {
                                      event.stopPropagation()
                                      setCancelTarget(payment)
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                ) : null}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableStateRows>
                    </TableBody>
                  </Table>
                </div>
                {(payments?.data.length ?? 0) === 0 && !paymentsLoading ? (
                  <div className="mt-4">
                    <EmptyState
                      message="No collections recorded yet."
                      action={
                        <Button
                          size="sm"
                          onClick={() => {
                            setPaymentPrefill(null)
                            setPaymentDialogOpen(true)
                          }}
                        >
                          <HandCoins className="size-4" />
                          Record payment
                        </Button>
                      }
                    />
                  </div>
                ) : null}
                <Pagination meta={payments?.meta} onPageChange={setPaymentPage} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <InvoiceFormDialog
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
        customers={allCustomers}
        onCreated={handleInvoiceCreated}
      />

      <InvoiceDetailDialog
        invoiceId={selectedInvoiceId}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedInvoiceId(null)
          }
        }}
        onRecordPayment={openRecordPaymentFromInvoice}
      />

      <PaymentDetailDialog
        paymentId={selectedPaymentId}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPaymentId(null)
          }
        }}
      />

      <CancelPaymentDialog
        payment={cancelTarget}
        onOpenChange={(open) => {
          if (!open) {
            setCancelTarget(null)
          }
        }}
        onCancelled={async (message) => {
          setCancelTarget(null)
          await handleRecorded(message)
        }}
      />

      <PaymentFormDialog
        open={paymentDialogOpen}
        onOpenChange={(open) => {
          setPaymentDialogOpen(open)
          if (!open) {
            setPaymentPrefill(null)
          }
        }}
        customers={allCustomers}
        prefill={paymentPrefill}
        onRecorded={async (message) => {
          await handleRecorded(message)
        }}
      />
    </BaseLayout>
  )
}

interface DraftLineItem {
  key: number
  description: string
  quantity: string
  unitPrice: string
}

function InvoiceFormDialog({
  open,
  onOpenChange,
  customers,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  customers: Customer[]
  onCreated: (invoice: ArInvoice) => Promise<void>
}) {
  const [customerId, setCustomerId] = useState("")
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10))
  const [dueDate, setDueDate] = useState("")
  const [dueDateTouched, setDueDateTouched] = useState(false)
  const [paymentTerms, setPaymentTerms] = useState("net30")
  const [service, setService] = useState("")
  const [referenceSo, setReferenceSo] = useState("")
  const [notes, setNotes] = useState("")
  const [taxAmount, setTaxAmount] = useState("")
  const [lineItems, setLineItems] = useState<DraftLineItem[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const lineKey = useRef(0)

  const newLineItem = useCallback((): DraftLineItem => {
    lineKey.current += 1
    return { key: lineKey.current, description: "", quantity: "1", unitPrice: "" }
  }, [])

  useEffect(() => {
    if (!open) {
      return
    }
    setCustomerId("")
    setInvoiceDate(new Date().toISOString().slice(0, 10))
    setPaymentTerms("net30")
    setDueDate(computeDueDate(new Date().toISOString().slice(0, 10), "net30"))
    setDueDateTouched(false)
    setService("")
    setReferenceSo("")
    setNotes("")
    setTaxAmount("")
    setLineItems([newLineItem()])
    setError("")
    setSubmitting(false)
  }, [open, newLineItem])

  const updateLineItem = (key: number, patch: Partial<DraftLineItem>) => {
    setLineItems((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)))
  }

  const lineAmount = (item: DraftLineItem) =>
    round2((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))

  const subtotal = useMemo(
    () => round2(lineItems.reduce((sum, item) => sum + lineAmount(item), 0)),
    [lineItems],
  )
  const tax = round2(Number(taxAmount) || 0)
  const total = round2(subtotal + tax)

  const lineItemsValid =
    lineItems.length > 0 &&
    lineItems.every(
      (item) => item.description.trim().length > 0 && Number(item.quantity) > 0 && Number(item.unitPrice) >= 0,
    )

  const formValid = Boolean(customerId) && Boolean(invoiceDate) && Boolean(dueDate) && lineItemsValid && total > 0

  const handleSubmit = async () => {
    if (!formValid) {
      setError("Complete the customer, dates, and at least one valid line item.")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      const response = await createArInvoice({
        customer_id: Number(customerId),
        invoice_date: invoiceDate,
        due_date: dueDate,
        payment_terms: paymentTerms as "net15" | "net30" | "net60" | "cod",
        service: service || undefined,
        reference_so: referenceSo || undefined,
        notes: notes || undefined,
        tax_amount: tax,
        line_items: lineItems.map((item) => ({
          description: item.description.trim(),
          quantity: Number(item.quantity),
          unit_price: Number(item.unitPrice),
        })),
      })
      onOpenChange(false)
      await onCreated(response.data)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create the invoice.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!submitting) {
          onOpenChange(nextOpen)
        }
      }}
    >
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>New invoice</DialogTitle>
          <DialogDescription>Create an issued receivable invoice with itemized billing.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {error && (
            <p className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={String(customer.id)}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Payment terms</Label>
              <Select
                value={paymentTerms}
                onValueChange={(value) => {
                  setPaymentTerms(value)
                  setDueDate(computeDueDate(invoiceDate, value))
                  setDueDateTouched(false)
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="net15">Net 15</SelectItem>
                  <SelectItem value="net30">Net 30</SelectItem>
                  <SelectItem value="net60">Net 60</SelectItem>
                  <SelectItem value="cod">Cash on delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice-date">Invoice date</Label>
              <Input
                id="invoice-date"
                type="date"
                value={invoiceDate}
                onChange={(event) => {
                  setInvoiceDate(event.target.value)
                  if (!dueDateTouched) {
                    setDueDate(computeDueDate(event.target.value, paymentTerms))
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice-due-date">Due date</Label>
              <Input
                id="invoice-due-date"
                type="date"
                value={dueDate}
                onChange={(event) => {
                  setDueDate(event.target.value)
                  setDueDateTouched(true)
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice-service">Service</Label>
              <Input
                id="invoice-service"
                value={service}
                onChange={(event) => setService(event.target.value)}
                placeholder="Summary of billed service"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice-so">SO reference</Label>
              <Input
                id="invoice-so"
                value={referenceSo}
                onChange={(event) => setReferenceSo(event.target.value)}
                placeholder="Optional sales order reference"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Line items</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => setLineItems((current) => [...current, newLineItem()])}
              >
                <Plus className="size-3.5" />
                Add line
              </Button>
            </div>
            <div className="space-y-2">
              {lineItems.map((item, index) => (
                <div
                  key={item.key}
                  className="grid grid-cols-12 items-end gap-2 rounded-lg border p-3"
                >
                  <div className="col-span-12 space-y-1 sm:col-span-5">
                    <Label className="text-xs text-muted-foreground">Description #{index + 1}</Label>
                    <Input
                      value={item.description}
                      onChange={(event) => updateLineItem(item.key, { description: event.target.value })}
                      placeholder="Service description"
                    />
                  </div>
                  <div className="col-span-4 space-y-1 sm:col-span-2">
                    <Label className="text-xs text-muted-foreground">Qty</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.quantity}
                      onChange={(event) => updateLineItem(item.key, { quantity: event.target.value })}
                    />
                  </div>
                  <div className="col-span-4 space-y-1 sm:col-span-2">
                    <Label className="text-xs text-muted-foreground">Unit price</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(event) => updateLineItem(item.key, { unitPrice: event.target.value })}
                    />
                  </div>
                  <div className="col-span-3 space-y-1 sm:col-span-2">
                    <Label className="text-xs text-muted-foreground">Amount</Label>
                    <p className="py-2 text-sm font-medium tabular-nums">{formatCurrency(lineAmount(item))}</p>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove line item ${index + 1}`}
                      disabled={lineItems.length === 1}
                      onClick={() =>
                        setLineItems((current) => current.filter((line) => line.key !== item.key))
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="invoice-notes">Notes</Label>
              <Textarea
                id="invoice-notes"
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional billing notes"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium tabular-nums">{formatCurrency(subtotal)}</span>
              </div>
              <div className="space-y-1">
                <Label htmlFor="invoice-tax" className="text-xs text-muted-foreground">
                  Tax amount
                </Label>
                <Input
                  id="invoice-tax"
                  type="number"
                  min={0}
                  step="0.01"
                  value={taxAmount}
                  onChange={(event) => setTaxAmount(event.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="flex items-center justify-between border-t pt-2 text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="text-lg font-semibold tabular-nums">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={submitting || !formValid}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Create invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function InvoiceDetailDialog({
  invoiceId,
  onOpenChange,
  onRecordPayment,
}: {
  invoiceId: number | null
  onOpenChange: (open: boolean) => void
  onRecordPayment: (detail: ArInvoiceDetail) => void
}) {
  const [detail, setDetail] = useState<ArInvoiceDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (invoiceId === null) {
      return
    }

    let active = true
    setLoading(true)
    setError("")
    setDetail(null)

    getArInvoice(invoiceId)
      .then((response) => {
        if (active) {
          setDetail(response.data)
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : "Unable to load the invoice.")
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [invoiceId])

  return (
    <Dialog open={invoiceId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{detail ? detail.invoice_number : "Invoice details"}</DialogTitle>
          <DialogDescription>
            {detail ? detail.service ?? "Invoice line items and collection history." : "Loading invoice information."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : error ? (
          <p className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        ) : detail ? (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Customer</p>
                <p className="font-medium">{detail.customer?.name ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <Badge variant={statusBadgeVariant(detail.display_status)}>{detail.display_status}</Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Invoice date</p>
                <p className="font-medium">{detail.invoice_date}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Due date</p>
                <p className="font-medium">
                  {detail.due_date}
                  {detail.days_overdue > 0 ? ` · ${detail.days_overdue} days overdue` : ""}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Total amount</p>
                <p className="font-medium">{formatCurrency(detail.total_amount)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Balance due</p>
                <p className="font-medium">{formatCurrency(detail.balance_due)}</p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Line items</p>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Unit price</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.line_items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-4 text-center text-muted-foreground">
                          No line items recorded.
                        </TableCell>
                      </TableRow>
                    ) : (
                      detail.line_items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                          <TableCell>{formatCurrency(item.amount)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Collection history</p>
              {detail.payment_allocations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No collections applied to this invoice yet.</p>
              ) : (
                <div className="space-y-2">
                  {detail.payment_allocations.map((allocation) => (
                    <div
                      key={allocation.id}
                      className="flex items-center justify-between rounded-lg border p-3 text-sm"
                    >
                      <span>{allocation.invoice_number ?? `Invoice #${allocation.ar_invoice_id}`}</span>
                      <span className="font-medium">{formatCurrency(allocation.allocated_amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {detail.balance_due > 0 && detail.status !== "voided" ? (
              <div className="flex justify-end">
                <Button className="gap-2" onClick={() => onRecordPayment(detail)}>
                  <HandCoins className="size-4" />
                  Record payment
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function PaymentDetailDialog({
  paymentId,
  onOpenChange,
}: {
  paymentId: number | null
  onOpenChange: (open: boolean) => void
}) {
  const [payment, setPayment] = useState<ArPayment | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (paymentId === null) {
      return
    }

    let active = true
    setLoading(true)
    setError("")
    setPayment(null)

    getArPayment(paymentId)
      .then((response) => {
        if (active) {
          setPayment(response.data)
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : "Unable to load the collection.")
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [paymentId])

  const allocations: ArPaymentAllocation[] = payment?.allocations ?? []

  return (
    <Dialog open={paymentId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{payment ? payment.reference_number : "Collection details"}</DialogTitle>
          <DialogDescription>Payment allocations and recorded notes.</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : error ? (
          <p className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        ) : payment ? (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground">Customer</p>
                <p className="font-medium">{payment.customer?.name ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <Badge variant={payment.status === "completed" ? "secondary" : "outline"}>{payment.status}</Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Payment date</p>
                <p className="font-medium">{payment.payment_date}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Method</p>
                <p className="font-medium capitalize">{payment.method.replace("_", " ")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total amount</p>
                <p className="font-medium">{formatCurrency(payment.total_amount)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Recorded by</p>
                <p className="font-medium">{payment.creator?.name ?? "—"}</p>
              </div>
            </div>

            <div>
              <p className="mb-2 font-medium">Allocations</p>
              {allocations.length === 0 ? (
                <p className="text-muted-foreground">No allocations recorded.</p>
              ) : (
                <div className="space-y-2">
                  {allocations.map((allocation) => (
                    <div key={allocation.id} className="flex items-center justify-between rounded-lg border p-3">
                      <span>{allocation.invoice_number ?? `Invoice #${allocation.ar_invoice_id}`}</span>
                      <span className="font-medium tabular-nums">
                        {formatCurrency(allocation.allocated_amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-muted-foreground">Notes</p>
              <p className="mt-1 whitespace-pre-wrap">{payment.notes || "No notes recorded."}</p>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function CancelPaymentDialog({
  payment,
  onOpenChange,
  onCancelled,
}: {
  payment: ArPayment | null
  onOpenChange: (open: boolean) => void
  onCancelled: (message: string) => Promise<void>
}) {
  const [effects, setEffects] = useState<{ id: number; invoiceNumber: string; allocated: number; restored: number }[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!payment) {
      return
    }

    let active = true
    setLoading(true)
    setError("")
    setEffects([])

    Promise.all(
      (payment.allocations ?? []).map(async (allocation) => {
        const response = await getArInvoice(allocation.ar_invoice_id)
        return {
          id: allocation.ar_invoice_id,
          invoiceNumber: response.data.invoice_number,
          allocated: allocation.allocated_amount,
          restored: round2(response.data.balance_due + allocation.allocated_amount),
        }
      }),
    )
      .then((results) => {
        if (active) {
          setEffects(results)
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : "Unable to load invoice balances.")
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [payment])

  const handleConfirm = async () => {
    if (!payment) {
      return
    }

    setSubmitting(true)
    setError("")

    try {
      await cancelArPayment(payment.id)
      await onCancelled(`Collection ${payment.reference_number} cancelled.`)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to cancel the collection.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={payment !== null} onOpenChange={(open) => !submitting && onOpenChange(open)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cancel collection</DialogTitle>
          <DialogDescription>
            Cancelling {payment?.reference_number} restores the allocated amounts to the affected invoices.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <p className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          )}

          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : effects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invoice balances will change.</p>
          ) : (
            <div className="space-y-2">
              {effects.map((effect) => (
                <div key={effect.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{effect.invoiceNumber}</span>
                    <span className="text-muted-foreground">
                      +{formatCurrency(effect.allocated)} restored
                    </span>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    New balance: <span className="font-medium text-foreground">{formatCurrency(effect.restored)}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Keep collection
          </Button>
          <Button
            variant="destructive"
            onClick={() => void handleConfirm()}
            disabled={submitting || loading}
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Cancel collection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PaymentFormDialog({
  open,
  onOpenChange,
  customers,
  prefill,
  onRecorded,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  customers: Customer[]
  prefill: PaymentPrefill | null
  onRecorded: (message: string) => Promise<void>
}) {
  const [customerId, setCustomerId] = useState("")
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10))
  const [method, setMethod] = useState<"bank_transfer" | "check" | "online" | "cash">("bank_transfer")
  const [notes, setNotes] = useState("")
  const [invoices, setInvoices] = useState<ArInvoice[]>([])
  const [amounts, setAmounts] = useState<Record<number, string>>({})
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) {
      return
    }

    setError("")
    setNotes("")
    setMethod("bank_transfer")
    setPaymentDate(new Date().toISOString().slice(0, 10))
    setCustomerId(prefill?.customerId ? String(prefill.customerId) : "")
  }, [open, prefill])

  useEffect(() => {
    if (!open || !customerId) {
      setInvoices([])
      setAmounts({})
      return
    }

    let active = true
    setLoadingInvoices(true)
    getArInvoices({ customer_id: Number(customerId), outstanding: true, per_page: 100 })
      .then((response) => {
        if (!active) {
          return
        }
        setInvoices(response.data)

        const onlyInvoiceId = prefill?.invoiceId
        setAmounts(
          Object.fromEntries(
            response.data.map((invoice) => [
              invoice.id,
              onlyInvoiceId
                ? invoice.id === onlyInvoiceId
                  ? invoice.balance_due.toFixed(2)
                  : ""
                : invoice.balance_due.toFixed(2),
            ]),
          ),
        )
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : "Unable to load open invoices.")
        }
      })
      .finally(() => {
        if (active) {
          setLoadingInvoices(false)
        }
      })

    return () => {
      active = false
    }
  }, [open, customerId, prefill])

  const allocationError = (invoice: ArInvoice): string | undefined => {
    const raw = amounts[invoice.id]
    if (raw === undefined || raw === "") {
      return undefined
    }
    const value = Number(raw)
    if (Number.isNaN(value) || value < 0) {
      return "Amount cannot be negative."
    }
    if (round2(value) > round2(invoice.balance_due)) {
      return `Exceeds the ${formatCurrency(invoice.balance_due)} balance.`
    }
    return undefined
  }

  const hasError = invoices.some((invoice) => allocationError(invoice) !== undefined)

  const total = round2(
    invoices.reduce((sum, invoice) => {
      const value = Number(amounts[invoice.id])
      return sum + (Number.isNaN(value) || value < 0 ? 0 : value)
    }, 0),
  )

  const allocations = useMemo(
    () =>
      invoices
        .map((invoice) => ({
          ar_invoice_id: invoice.id,
          allocated_amount: round2(Number(amounts[invoice.id]) || 0),
        }))
        .filter((allocation) => allocation.allocated_amount > 0),
    [invoices, amounts],
  )

  const formValid = Boolean(customerId) && !hasError && allocations.length > 0 && total > 0

  const handleSubmit = async () => {
    if (!customerId) {
      setError("Select a customer before recording a payment.")
      return
    }

    if (hasError) {
      setError("Resolve the highlighted allocation amounts before saving.")
      return
    }

    if (allocations.length === 0) {
      setError("Enter an amount for at least one invoice.")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      await createArPayment({
        customer_id: Number(customerId),
        payment_date: paymentDate,
        method,
        notes: notes || undefined,
        allocations,
      })
      onOpenChange(false)
      await onRecorded(
        prefill?.invoiceId
          ? "Payment recorded and applied to the selected invoice."
          : "Payment recorded and applied to the selected invoices.",
      )
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to record the payment.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !submitting && onOpenChange(nextOpen)}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Record customer payment</DialogTitle>
          <DialogDescription>
            {prefill?.invoiceId
              ? "Apply a collection to the selected invoice."
              : "Apply a collection to one or more outstanding invoices for a customer."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <p className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={String(customer.id)}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-date">Payment date</Label>
              <Input
                id="payment-date"
                type="date"
                value={paymentDate}
                onChange={(event) => setPaymentDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Method</Label>
              <Select value={method} onValueChange={(value) => setMethod(value as typeof method)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="payment-notes">Notes</Label>
              <Textarea
                id="payment-notes"
                rows={2}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional collection reference or remarks"
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Apply to invoices</p>
            {!customerId ? (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Select a customer to load their outstanding invoices.
              </p>
            ) : loadingInvoices ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : invoices.length === 0 ? (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                This customer has no outstanding invoices.
              </p>
            ) : (
              <div className="space-y-2">
                {invoices.map((invoice) => {
                  const rowError = allocationError(invoice)

                  return (
                    <div key={invoice.id} className="rounded-lg border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{invoice.invoice_number}</p>
                          <p className="text-xs text-muted-foreground">
                            Due {invoice.due_date} · Balance {formatCurrency(invoice.balance_due)}
                          </p>
                        </div>
                        <Input
                          className={cn("w-32", rowError && "border-destructive focus-visible:ring-destructive")}
                          type="number"
                          min={0}
                          max={invoice.balance_due}
                          step="0.01"
                          aria-label={`Allocation for ${invoice.invoice_number}`}
                          value={amounts[invoice.id] ?? ""}
                          onChange={(event) =>
                            setAmounts((current) => ({ ...current, [invoice.id]: event.target.value }))
                          }
                        />
                      </div>
                      {rowError ? <p className="mt-2 text-xs text-destructive">{rowError}</p> : null}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3 text-sm">
            <span className="text-muted-foreground">Total collection</span>
            <span className="text-lg font-semibold tabular-nums">{formatCurrency(total)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={submitting || !formValid}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Record payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
