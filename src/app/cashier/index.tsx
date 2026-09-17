import { useState } from 'react'
import { BaseLayout } from '@/components/layouts/base-layout'
import { CashierHeader } from './components/cashier-header'
import { CashierMetrics } from './components/cashier-metrics'
import { CashierCharts } from './components/cashier-charts'
import { CashierTransactionsTable } from './components/cashier-transactions-table'
import { PaymentModal } from './components/payment-modal'
import { ReceiptModal } from './components/receipt-modal'
import { TillReconciliationModal } from './components/till-reconciliation-modal'
import { CashOutflowModal } from './components/cash-outflow-modal'
import { 
  INITIAL_SHIFT_INFO, 
  INITIAL_PENDING_INVOICES, 
  INITIAL_TRANSACTIONS
} from './data/cashier-data'
import type { 
  InvoiceItem, 
  TransactionRecord, 
  ShiftInfo 
} from './data/cashier-data'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'

export default function CashierPage() {
  const [shiftInfo, setShiftInfo] = useState<ShiftInfo>(INITIAL_SHIFT_INFO)
  const [pendingInvoices, setPendingInvoices] = useState<InvoiceItem[]>(INITIAL_PENDING_INVOICES)
  const [transactions, setTransactions] = useState<TransactionRecord[]>(INITIAL_TRANSACTIONS)

  // Modals state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [outflowModalOpen, setOutflowModalOpen] = useState(false)
  const [reconciliationModalOpen, setReconciliationModalOpen] = useState(false)
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)

  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null)
  const [selectedReceipt, setSelectedReceipt] = useState<TransactionRecord | null>(null)

  // Derived Metrics
  const collections = transactions.filter((t) => t.type === 'COLLECTION')
  const disbursements = transactions.filter((t) => t.type === 'DISBURSEMENT')

  const totalCollections = collections.reduce((sum, t) => sum + t.amount, 0)
  const cashCollections = collections
    .filter((t) => t.paymentMethod === 'Cash')
    .reduce((sum, t) => sum + t.amount, 0)
  const nonCashCollections = totalCollections - cashCollections

  const totalOutflow = disbursements.reduce((sum, t) => sum + t.amount, 0)
  const drawerCashBalance = shiftInfo.openingCash + cashCollections - totalOutflow

  const pendingTotalAmount = pendingInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)

  // Trigger Payment Modal for specific invoice
  const handleOpenPaymentForInvoice = (invoice: InvoiceItem) => {
    setSelectedInvoice(invoice)
    setPaymentModalOpen(true)
  }

  // Trigger Payment Modal for generic payment
  const handleOpenGenericPayment = () => {
    setSelectedInvoice(null)
    setPaymentModalOpen(true)
  }

  // Process Completed Payment
  const handleProcessPayment = (newTxn: TransactionRecord, invoiceIdToRemove?: string) => {
    setTransactions((prev) => [newTxn, ...prev])

    if (invoiceIdToRemove) {
      setPendingInvoices((prev) => prev.filter((i) => i.id !== invoiceIdToRemove))
    }

    // Auto open printable receipt modal
    setSelectedReceipt(newTxn)
    setReceiptModalOpen(true)

    toast.success(`Payment Processed Successfully! Official Receipt ${newTxn.orNo} generated.`, {
      description: `Amount ₱${newTxn.amount.toLocaleString()} received via ${newTxn.paymentMethod}`
    })
  }

  // Process Outflow / Disbursement
  const handleRecordOutflow = (newTxn: TransactionRecord) => {
    setTransactions((prev) => [newTxn, ...prev])

    toast.warning(`Cash Outflow Recorded! Voucher ${newTxn.orNo}`, {
      description: `Disbursed ₱${newTxn.amount.toLocaleString()} to ${newTxn.clientName}`
    })
  }

  // Handle Shift Close / Reconciliation
  const handleCloseShift = (reconciledEndingCash: number, variance: number, vaultDrop: number) => {
    setShiftInfo((prev) => ({
      ...prev,
      actualEndingCash: reconciledEndingCash,
      variance: variance,
      status: 'CLOSED'
    }))

    toast.success(`Shift #0891 Successfully Reconciled & Closed!`, {
      description: `Till Count: ₱${reconciledEndingCash.toLocaleString()} | Vault Drop: ₱${vaultDrop.toLocaleString()} | Variance: ₱${variance.toLocaleString()}`
    })
  }

  // Open Receipt Print View
  const handleOpenReceiptView = (txn: TransactionRecord) => {
    setSelectedReceipt(txn)
    setReceiptModalOpen(true)
  }

  return (
    <BaseLayout 
      title="ISMERS Cashier Terminal" 
      description="Integrated Service Management & Enterprise Resource Financial Collection Portal"
    >
      <Toaster position="top-right" />

      <div className="@container/main px-4 lg:px-6 space-y-6">
        {/* Header & Terminal Info */}
        <CashierHeader
          shiftInfo={{
            ...shiftInfo,
            totalCollectionsCash: cashCollections,
            totalCollectionsNonCash: nonCashCollections,
            totalDisbursementsCash: totalOutflow,
            expectedEndingCash: drawerCashBalance
          }}
          onOpenPaymentModal={handleOpenGenericPayment}
          onOpenOutflowModal={() => setOutflowModalOpen(true)}
          onOpenReconciliationModal={() => setReconciliationModalOpen(true)}
          onOpenSummaryModal={() => {
            if (transactions.length > 0) {
              setSelectedReceipt(transactions[0])
              setReceiptModalOpen(true)
            }
          }}
        />

        {/* Metric Cards */}
        <CashierMetrics
          totalCollections={totalCollections}
          cashCollections={cashCollections}
          nonCashCollections={nonCashCollections}
          totalOutflow={totalOutflow}
          drawerCashBalance={drawerCashBalance}
          pendingCount={pendingInvoices.length}
          pendingTotalAmount={pendingTotalAmount}
        />

        {/* Analytics Charts */}
        <CashierCharts />

        {/* Transactions Table & Pending Queue */}
        <CashierTransactionsTable
          pendingInvoices={pendingInvoices}
          transactions={transactions}
          onSelectPaymentInvoice={handleOpenPaymentForInvoice}
          onSelectPrintReceipt={handleOpenReceiptView}
        />
      </div>

      {/* Interactive Modals */}
      <PaymentModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        selectedInvoice={selectedInvoice}
        pendingInvoices={pendingInvoices}
        onProcessPayment={handleProcessPayment}
      />

      <ReceiptModal
        open={receiptModalOpen}
        onOpenChange={setReceiptModalOpen}
        transaction={selectedReceipt}
      />

      <TillReconciliationModal
        open={reconciliationModalOpen}
        onOpenChange={setReconciliationModalOpen}
        shiftInfo={{
          ...shiftInfo,
          totalCollectionsCash: cashCollections,
          totalCollectionsNonCash: nonCashCollections,
          totalDisbursementsCash: totalOutflow,
          expectedEndingCash: drawerCashBalance
        }}
        onCloseShift={handleCloseShift}
      />

      <CashOutflowModal
        open={outflowModalOpen}
        onOpenChange={setOutflowModalOpen}
        onRecordOutflow={handleRecordOutflow}
      />
    </BaseLayout>
  )
}
