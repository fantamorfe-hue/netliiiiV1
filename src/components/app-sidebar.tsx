"use client"

import * as React from "react"
import {
  LayoutPanelLeft,
  LayoutDashboard,
  Users,
  BadgeDollarSign,
  Banknote,
  HandCoins,
  PieChart,
  Wallet,
  Landmark,
  BarChart3,
  CirclePercent,
  BookOpen,
  Receipt,
} from "lucide-react"
import { Link } from "react-router-dom"
import { Logo } from "@/components/logo"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "ADMIIN",
    email: "admin@primepower.com",
    avatar: "",
  },
  navGroups: [
    {
      label: "Dashboards",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard-2",
          icon: LayoutPanelLeft,
        },
      ],
    },

    {
      label: "Sub Modules",
      items: [
        {
          title: "General Ledger",
          url: "/general-ledger",
          icon: BookOpen,
        },
        {
          title: "Accounts Payable (AP)",
          url: "/accounts-payable",
          icon: Receipt,
          items: [
            {
              title: "Overview",
              url: "/accounts-payable",
            },
            {
              title: "Payroll",
              url: "/accounts-payable",
            },

          ],
        },
        {
          title: "Accounts Receivable (AR)",
          url: "/accounts-receivable",
          icon: BadgeDollarSign,
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            {
              title: "Overview",
              url: "/accounts-receivable",
            },
            {
              title: "Invoices",
              url: "/accounts-receivable?tab=execution",
            },
            {
              title: "Collections",
              url: "/accounts-receivable?tab=requests",
            },
            {
              title: "Payments",
              url: "/accounts-receivable?tab=payments",
            },
          ],
        },
        {
          title: "Disbursement Management",
          url: "/disbursement-management",
          icon: Banknote,
          color: "text-red-600 dark:text-red-400",
        },
        {
          title: "Collection Management",
          url: "/collection-management",
          icon: HandCoins,
          color: "text-violet-600 dark:text-violet-400",
        },
        {
          title: "Budget Management",
          url: "/budget-management",
          icon: PieChart,
          color: "text-amber-600 dark:text-amber-400",
        },
        {
          title: "Cash Management",
          url: "/cash-management",
          icon: Wallet,
          color: "text-teal-600 dark:text-teal-400",
        },
        {
          title: "Cashier Terminal",
          url: "/cashier",
          icon: Landmark,
          color: "text-pink-600 dark:text-pink-400",
        },
        {
          title: "Financial Reporting & Analytics",
          url: "/financial-reporting-analytics",
          icon: BarChart3,
          color: "text-indigo-600 dark:text-indigo-400",
        },
        {
          title: "Tax Management",
          url: "/tax-management",
          icon: CirclePercent,
          color: "text-cyan-600 dark:text-cyan-400",
        },
        {
          title: "Account",
          url: "/account-ss",
          icon: Users,
          color: "text-rose-600 dark:text-rose-400",
        },
      ],
    },

  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground border-none ring-0 shadow-none">
                  <Logo size={24} className="text-current" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">FINANCE</span>
                  <span className="truncate text-xs">Admin Dashboard</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {data.navGroups.map((group) => (
          <NavMain key={group.label} label={group.label} items={group.items} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
