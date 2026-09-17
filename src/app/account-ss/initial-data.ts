import type { Accountant, Subsystem } from "./types"

export const initialAccountants: Accountant[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    avatar: "SJ",
    title: "Senior Financial Accountant",
    status: "Active"
  },
  {
    id: 2,
    name: "Michael Chen",
    email: "michael.chen@example.com",
    avatar: "MC",
    title: "Cost Accounting Specialist",
    status: "Active"
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    email: "emily.rodriguez@example.com",
    avatar: "ER",
    title: "Forensic Auditor",
    status: "Pending"
  },
  {
    id: 4,
    name: "David Thompson",
    email: "david.thompson@example.com",
    avatar: "DT",
    title: "Senior Treasury Analyst",
    status: "Active"
  },
  {
    id: 5,
    name: "Jessica Parker",
    email: "jessica.parker@example.com",
    avatar: "JP",
    title: "Junior Bookkeeper",
    status: "Inactive"
  },
  {
    id: 6,
    name: "Robert Wilson",
    email: "robert.wilson@example.com",
    avatar: "RW",
    title: "Lead Financial Auditor",
    status: "Active"
  },
  {
    id: 7,
    name: "Amanda Foster",
    email: "amanda.foster@example.com",
    avatar: "AF",
    title: "Corporate Tax Specialist",
    status: "Active"
  },
  {
    id: 8,
    name: "Christopher Lee",
    email: "christopher.lee@example.com",
    avatar: "CL",
    title: "Accounts Payable Manager",
    status: "Active"
  },
  {
    id: 9,
    name: "Lisa Martinez",
    email: "lisa.martinez@example.com",
    avatar: "LM",
    title: "Accounts Receivable Lead",
    status: "Pending"
  },
  {
    id: 10,
    name: "James Anderson",
    email: "james.anderson@example.com",
    avatar: "JA",
    title: "Senior Payroll Accountant",
    status: "Active"
  },
  {
    id: 11,
    name: "Maria Garcia",
    email: "maria.garcia@example.com",
    avatar: "MG",
    title: "Fixed Asset Specialist",
    status: "Active"
  },
  {
    id: 12,
    name: "Kevin Taylor",
    email: "kevin.taylor@example.com",
    avatar: "KT",
    title: "Treasury Accountant",
    status: "Inactive"
  },
  {
    id: 13,
    name: "Rachel Brown",
    email: "rachel.brown@example.com",
    avatar: "RB",
    title: "CFO & Finance Director",
    status: "Active"
  },
  {
    id: 14,
    name: "Daniel Kim",
    email: "daniel.kim@example.com",
    avatar: "DK",
    title: "Budget & Planning Analyst",
    status: "Active"
  },
  {
    id: 15,
    name: "Ashley White",
    email: "ashley.white@example.com",
    avatar: "AW",
    title: "Billing Clerk",
    status: "Active"
  }
]

export const initialSubsystems: Subsystem[] = [
  {
    id: "finance-sub-modules",
    name: "Financial Sub Modules",
    description: "Covers the core accounting sub-modules: general ledger, payables, receivables, disbursements, collections, budget, cash, cashier, reporting, tax, and account.",
    icon: "BookOpen",
    color: "slate",
    modules: [
      { id: "fsm-general-ledger", name: "General Ledger", assignedAccountantId: 1 },
      { id: "fsm-ap", name: "Accounts Payable (AP)", assignedAccountantId: 8 },
      { id: "fsm-ar", name: "Accounts Receivable (AR)", assignedAccountantId: 9 },
      { id: "fsm-disbursement", name: "Disbursement Management", assignedAccountantId: 4 },
      { id: "fsm-collection", name: "Collection Management", assignedAccountantId: 15 },
      { id: "fsm-budget", name: "Budget Management", assignedAccountantId: 14 },
      { id: "fsm-cash", name: "Cash Management", assignedAccountantId: 2 },
      { id: "fsm-cashier", name: "Cashier Terminal", assignedAccountantId: 5 },
      { id: "fsm-financial-reporting", name: "Financial Reporting & Analytics", assignedAccountantId: 6 },
      { id: "fsm-tax", name: "Tax Management", assignedAccountantId: 7 },
      { id: "fsm-account", name: "Account", assignedAccountantId: 13 }
    ]
  },
  {
    id: "client-acq",
    name: "Client Acquisition, Recruitment & Deployment",
    description: "Covers the lifecycle from initial client management to recruitment processes, job orders, and candidate deployment.",
    icon: "Users2",
    color: "blue",
    modules: [
      { id: "client-mgmt", name: "Client Management", assignedAccountantId: 1 },
      { id: "applicant-reg", name: "Applicant Registration", assignedAccountantId: null },
      { id: "recruitment", name: "Recruitment", assignedAccountantId: 5 },
      { id: "job-order", name: "Job Order", assignedAccountantId: 1 },
      { id: "deployment", name: "Deployment", assignedAccountantId: null }
    ]
  },
  {
    id: "hris",
    name: "Human Resource Information & Operations (HRIS)",
    description: "Governs core personnel tracking, time sheets, leave logs, payroll calculations, and annual appraisals.",
    icon: "FolderGit",
    color: "indigo",
    modules: [
      { id: "emp-info", name: "Employee Information", assignedAccountantId: 10 },
      { id: "timekeeping", name: "Timekeeping", assignedAccountantId: 10 },
      { id: "leave", name: "Leave Management", assignedAccountantId: null },
      { id: "payroll", name: "Payroll Operations", assignedAccountantId: 10 },
      { id: "performance-mgmt", name: "Performance Management", assignedAccountantId: null }
    ]
  },
  {
    id: "emp-dev",
    name: "Employee Development, Compliance & Benefits",
    description: "Manages employee training portals, contract storage, government submissions, loan facilities, and separations.",
    icon: "Award",
    color: "violet",
    modules: [
      { id: "training", name: "Training & Development", assignedAccountantId: null },
      { id: "doc-contract", name: "Document & Contract Management", assignedAccountantId: 11 },
      { id: "gov-compliance", name: "Government Compliance", assignedAccountantId: 7 },
      { id: "benefits-loans", name: "Benefits & Loans", assignedAccountantId: 7 },
      { id: "separation", name: "Separation Operations", assignedAccountantId: null }
    ]
  },
  {
    id: "gov-safety",
    name: "Governance, Safety & System Administration",
    description: "Handles occupational health, legal templates, global settings, compliance auditing, and asset configurations.",
    icon: "ShieldAlert",
    color: "rose",
    modules: [
      { id: "health-safety", name: "Health & Safety", assignedAccountantId: null },
      { id: "legal-gov", name: "Legal Compliance", assignedAccountantId: 13 },
      { id: "sys-admin", name: "System Administration", assignedAccountantId: null },
      { id: "reports-analytics-gov", name: "Reports & Analytics", assignedAccountantId: 6 },
      { id: "asset-tracking", name: "Asset Tracking", assignedAccountantId: 11 }
    ]
  },
  {
    id: "finance",
    name: "Financial Management",
    description: "Manages the ledger book, payables, receivables, cash operations, taxes, and high-level financial planning.",
    icon: "LineChart",
    color: "emerald",
    modules: [
      { id: "general-ledger", name: "General Ledger", assignedAccountantId: 1 },
      { id: "ap", name: "Accounts Payable (AP)", assignedAccountantId: 8 },
      { id: "ar", name: "Accounts Receivable (AR)", assignedAccountantId: 9 },
      { id: "disbursement", name: "Disbursement Management", assignedAccountantId: 8 },
      { id: "collection", name: "Collection Management", assignedAccountantId: 9 },
      { id: "budget", name: "Budget Planning", assignedAccountantId: 14 },
      { id: "cash", name: "Cash Operations", assignedAccountantId: 4 },
      { id: "financial-reporting", name: "Financial Reporting", assignedAccountantId: 6 },
      { id: "tax", name: "Tax Management", assignedAccountantId: 7 }
    ]
  },
  {
    id: "supply-chain",
    name: "Supply Chain & Inventory",
    description: "Monitors warehouse bins, inventory valuations, supplier communications, and purchase trackers.",
    icon: "Package",
    color: "amber",
    modules: [
      { id: "smart-warehousing", name: "Smart Warehousing", assignedAccountantId: 2 },
      { id: "inventory", name: "Inventory Management", assignedAccountantId: 2 },
      { id: "procurement", name: "Procurement", assignedAccountantId: 2 },
      { id: "supplier-vendor", name: "Supplier & Vendor Management", assignedAccountantId: null },
      { id: "purchase-order", name: "Purchase Order", assignedAccountantId: null },
      { id: "doc-tracking-sc", name: "Document Tracking", assignedAccountantId: null }
    ]
  },
  {
    id: "fleet",
    name: "Fleet & Transportation",
    description: "Tracks vehicles, logistics bookings, driver statuses, transport expenses, and smart routing algorithms.",
    icon: "Truck",
    color: "cyan",
    modules: [
      { id: "fleet-vehicle", name: "Fleet/Vehicle Management", assignedAccountantId: 2 },
      { id: "reservation-dispatch", name: "Reservation & Dispatch", assignedAccountantId: null },
      { id: "driver-trip", name: "Driver & Trip Monitoring", assignedAccountantId: null },
      { id: "fuel", name: "Fuel Tracking", assignedAccountantId: 2 },
      { id: "transport-cost", name: "Transport Cost Analysis", assignedAccountantId: 4 },
      { id: "route-opt", name: "Route Optimization", assignedAccountantId: null },
      { id: "mobile-fleet", name: "Mobile Fleet App", assignedAccountantId: null }
    ]
  },
  {
    id: "facilities",
    name: "Facilities & Administrative Management",
    description: "Manages conference bookings, guest logs, physical archives, records retention, and contract templates.",
    icon: "Building",
    color: "sky",
    modules: [
      { id: "reservations-fac", name: "Facilities Reservations", assignedAccountantId: null },
      { id: "visitor", name: "Visitor Pass Management", assignedAccountantId: null },
      { id: "doc-archiving", name: "Document Archiving", assignedAccountantId: 11 },
      { id: "records-retention", name: "Records Retention", assignedAccountantId: null },
      { id: "legal-fac", name: "Legal Document Management", assignedAccountantId: 13 },
      { id: "contract-mgmt-fac", name: "Contract Management", assignedAccountantId: 13 }
    ]
  },
  {
    id: "bi",
    name: "Business Intelligence & Analytics",
    description: "Aggregates key metadata, performance widgets, custom reports, and predictive models.",
    icon: "PieChart",
    color: "teal",
    modules: [
      { id: "dashboards-bi", name: "Dashboards", assignedAccountantId: 6 },
      { id: "kpi-monitoring", name: "KPI Monitoring", assignedAccountantId: 6 },
      { id: "predictive-analytics", name: "Predictive Analytics", assignedAccountantId: 14 },
      { id: "custom-reports", name: "Custom Reports", assignedAccountantId: null },
      { id: "data-aggregation", name: "Data Aggregation", assignedAccountantId: null },
      { id: "decision-support", name: "Decision Support Systems", assignedAccountantId: 14 }
    ]
  },
  {
    id: "crm",
    name: "Customer Relationship Management",
    description: "Monitors client leads, communication archives, CSAT surveys, pipelines, and reminders.",
    icon: "HeartHandshake",
    color: "pink",
    modules: [
      { id: "lead-client", name: "Lead & Client Tracking", assignedAccountantId: 15 },
      { id: "comm-history", name: "Communication History", assignedAccountantId: null },
      { id: "satisfaction-surveys", name: "Satisfaction Surveys", assignedAccountantId: null },
      { id: "follow-up-reminders", name: "Follow-up Reminders", assignedAccountantId: 15 },
      { id: "opportunity-pipeline", name: "Opportunity Pipeline", assignedAccountantId: null }
    ]
  }
]
