import { lazy } from 'react'
import { Navigate } from 'react-router-dom'

// Lazy load components for better performance
const Landing = lazy(() => import('@/app/landing/page'))
const Dashboard = lazy(() => import('@/app/dashboard/page'))
const Dashboard2 = lazy(() => import('@/app/dashboard-2/page'))
const Mail = lazy(() => import('@/app/mail/page'))
const Tasks = lazy(() => import('@/app/tasks/page'))
const Chat = lazy(() => import('@/app/chat/page'))
const Calendar = lazy(() => import('@/app/calendar/page'))
const Users = lazy(() => import('@/app/users/page'))
const FAQs = lazy(() => import('@/app/faqs/page'))
const Pricing = lazy(() => import('@/app/pricing/page'))
const GeneralLedger = lazy(() => import('@/app/general-ledger/page'))
const AccountsPayable = lazy(() => import('@/app/accounts-payable/page'))
const AccountsReceivable = lazy(() => import('@/app/accounts-receivable/page'))
const DisbursementManagement = lazy(() => import('@/app/disbursement-management/page'))
const CollectionManagement = lazy(() => import('@/app/collection-management/page'))
const BudgetManagement = lazy(() => import('@/app/budget-management/page'))
const CashManagement = lazy(() => import('@/app/cash-management/page'))
const Cashier = lazy(() => import('@/app/cashier/index'))
const Accountant = lazy(() => import('@/app/accountant/index'))
const Admin = lazy(() => import('@/app/admin/index'))
const AccountSs = lazy(() => import('@/app/account-ss/page'))
const FinancialReportingAnalytics = lazy(() => import('@/app/financial-reporting-analytics/page'))
const TaxManagement = lazy(() => import('@/app/tax-management/page'))

// Auth pages
const SignIn = lazy(() => import('@/app/auth/sign-in/page'))
const SignIn2 = lazy(() => import('@/app/auth/sign-in-2/page'))
const SignIn3 = lazy(() => import('@/app/auth/sign-in-3/page'))
const SignUp = lazy(() => import('@/app/auth/sign-up/page'))
const SignUp2 = lazy(() => import('@/app/auth/sign-up-2/page'))
const SignUp3 = lazy(() => import('@/app/auth/sign-up-3/page'))
const ForgotPassword = lazy(() => import('@/app/auth/forgot-password/page'))
const ForgotPassword2 = lazy(() => import('@/app/auth/forgot-password-2/page'))
const ForgotPassword3 = lazy(() => import('@/app/auth/forgot-password-3/page'))

// Error pages
const Unauthorized = lazy(() => import('@/app/errors/unauthorized/page'))
const Forbidden = lazy(() => import('@/app/errors/forbidden/page'))
const NotFound = lazy(() => import('@/app/errors/not-found/page'))
const InternalServerError = lazy(() => import('@/app/errors/internal-server-error/page'))
const UnderMaintenance = lazy(() => import('@/app/errors/under-maintenance/page'))

// Settings pages
const UserSettings = lazy(() => import('@/app/settings/user/page'))
const AccountSettings = lazy(() => import('@/app/settings/account/page'))
const BillingSettings = lazy(() => import('@/app/settings/billing/page'))
const AppearanceSettings = lazy(() => import('@/app/settings/appearance/page'))
const NotificationSettings = lazy(() => import('@/app/settings/notifications/page'))
const ConnectionSettings = lazy(() => import('@/app/settings/connections/page'))

export interface RouteConfig {
  path: string
  element: React.ReactNode
  children?: RouteConfig[]
}

export const routes: RouteConfig[] = [
  // Default route - redirect to the sign-in page
  {
    path: "/",
    element: <Navigate to="sign-in-3" replace />
  },

  // Landing Page
  {
    path: "/landing",
    element: <Landing />
  },

  // Dashboard Routes
  {
    path: "/dashboard",
    element: <Dashboard />
  },
  {
    path: "/dashboard-2",
    element: <Dashboard2 />
  },

  // Application Routes
  {
    path: "/mail",
    element: <Mail />
  },
  {
    path: "/tasks",
    element: <Tasks />
  },
  {
    path: "/chat",
    element: <Chat />
  },
  {
    path: "/calendar",
    element: <Calendar />
  },

  // Content Pages
  {
    path: "/users",
    element: <Users />
  },
  {
    path: "/faqs",
    element: <FAQs />
  },
  {
    path: "/pricing",
    element: <Pricing />
  },
  {
    path: "/general-ledger",
    element: <GeneralLedger />
  },
  {
    path: "/accounts-payable",
    element: <AccountsPayable />
  },
  {
    path: "/accounts-receivable",
    element: <AccountsReceivable />
  },
  {
    path: "/disbursement-management",
    element: <DisbursementManagement />
  },
  {
    path: "/collection-management",
    element: <CollectionManagement />
  },
  {
    path: "/budget-management",
    element: <BudgetManagement />
  },
  {
    path: "/cash-management",
    element: <CashManagement />
  },
  {
    path: "/cashier",
    element: <Cashier />
  },
  {
    path: "/accountant",
    element: <Accountant />
  },
  {
    path: "/admin",
    element: <Admin />
  },
  {
    path: "/account-ss",
    element: <AccountSs />
  },
  {
    path: "/financial-reporting-analytics",
    element: <FinancialReportingAnalytics />
  },
  {
    path: "/tax-management",
    element: <TaxManagement />
  },

  // Authentication Routes
  {
    path: "/sign-in-3",
    element: <SignIn3 />
  },
  {
    path: "/auth/sign-in",
    element: <SignIn />
  },
  {
    path: "/auth/sign-in-2",
    element: <SignIn2 />
  },
  {
    path: "/auth/sign-in-3",
    element: <SignIn3 />
  },
  {
    path: "/sign-up-3",
    element: <SignUp3 />
  },
  {
    path: "/auth/sign-up",
    element: <SignUp />
  },
  {
    path: "/auth/sign-up-2",
    element: <SignUp2 />
  },
  {
    path: "/auth/sign-up-3",
    element: <SignUp3 />
  },
  {
    path: "/auth/forgot-password",
    element: <ForgotPassword />
  },
  {
    path: "/auth/forgot-password-2",
    element: <ForgotPassword2 />
  },
  {
    path: "/auth/forgot-password-3",
    element: <ForgotPassword3 />
  },

  // Error Pages
  {
    path: "/errors/unauthorized",
    element: <Unauthorized />
  },
  {
    path: "/errors/forbidden",
    element: <Forbidden />
  },
  {
    path: "/errors/not-found",
    element: <NotFound />
  },
  {
    path: "/errors/internal-server-error",
    element: <InternalServerError />
  },
  {
    path: "/errors/under-maintenance",
    element: <UnderMaintenance />
  },

  // Settings Routes
  {
    path: "/settings/user",
    element: <UserSettings />
  },
  {
    path: "/settings/account",
    element: <AccountSettings />
  },
  {
    path: "/settings/billing",
    element: <BillingSettings />
  },
  {
    path: "/settings/appearance",
    element: <AppearanceSettings />
  },
  {
    path: "/settings/notifications",
    element: <NotificationSettings />
  },
  {
    path: "/settings/connections",
    element: <ConnectionSettings />
  },

  // Catch-all route for 404
  {
    path: "*",
    element: <NotFound />
  }
]
