import {
  CheckCircle2,
  Circle,
  Clock,
  PlayCircle,
} from "lucide-react"

export const categories = [
  {
    value: "invoice-review",
    label: "Invoice Review",
  },
  {
    value: "expense-approval",
    label: "Expense Approval",
  },
  {
    value: "vendor-setup",
    label: "Vendor Setup",
  },
  {
    value: "payment-run",
    label: "Payment Run",
  },
  {
    value: "tax-compliance",
    label: "BIR Tax Compliance",
  },
  {
    value: "reconciliation",
    label: "Reconciliation",
  },
]

export const statuses = [
  {
    value: "pending-review",
    label: "Pending Review",
    icon: Clock,
  },
  {
    value: "approved",
    label: "Approved",
    icon: Circle,
  },
  {
    value: "scheduled",
    label: "Scheduled",
    icon: PlayCircle,
  },
  {
    value: "paid",
    label: "Paid",
    icon: CheckCircle2,
  },
]

export const priorities = [
  {
    label: "Low",
    value: "low",
  },
  {
    label: "Medium",
    value: "medium",
  },
  {
    label: "High",
    value: "high",
  },
  {
    label: "Urgent",
    value: "urgent",
  },
]

export const branches = [
  { label: "Makati HQ", value: "makati" },
  { label: "Cebu Regional", value: "cebu" },
  { label: "Davao Site", value: "davao" },
  { label: "Baguio", value: "baguio" },
  { label: "El Nido", value: "el-nido" },
  { label: "Boracay", value: "boracay" },
  { label: "Bataan", value: "bataan" },
  { label: "Cagayan de Oro", value: "cdo" },
]

export const paymentMethods = [
  { label: "PESONet", value: "pesonet" },
  { label: "Corporate Check", value: "check" },
  { label: "Bank Transfer", value: "bank-transfer" },
  { label: "PhilPaSS", value: "philpass" },
]
