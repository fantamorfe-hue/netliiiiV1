"use client"

import { Eye, MoreHorizontal } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { assetUrl } from "@/lib/utils"

const transactions = [
  {
    id: "TXN-001",
    customer: {
      name: "Ayala Circuit Retail Hub",
      email: "Contract Billing",
      avatar: assetUrl("https://notion-avatars.netlify.app/api/avatar/?preset=female-"),
    },
    amount: "₱145,200.00",
    status: "completed",
    date: "2 hours ago",
  },
  {
    id: "TXN-002",
    customer: {
      name: "Makati Commercial Corp",
      email: "Bi-Monthly Staff Payroll",
      avatar: assetUrl("https://notion-avatars.netlify.app/api/avatar/?preset=male-1"),
    },
    amount: "₱289,500.00",
    status: "processing",
    date: "5 hours ago",
  },
  {
    id: "TXN-003",
    customer: {
      name: "BGC Hospitality Group",
      email: "Deployment Fees",
      avatar: assetUrl("https://notion-avatars.netlify.app/api/avatar/?preset=female-2"),
    },
    amount: "₱78,400.00",
    status: "completed",
    date: "1 day ago",
  },
  {
    id: "TXN-004",
    customer: {
      name: "Pasig Logistics Warehouse",
      email: "Overtime & Premium Pay",
      avatar: assetUrl("https://notion-avatars.netlify.app/api/avatar/?preset=male-5"),
    },
    amount: "₱34,900.00",
    status: "pending",
    date: "2 days ago",
  },
  {
    id: "TXN-005",
    customer: {
      name: "Taguig Manufacturing Corp",
      email: "Sourcing & Onboarding",
      avatar: assetUrl("https://notion-avatars.netlify.app/api/avatar/?preset=female-4"),
    },
    amount: "₱112,000.00",
    status: "completed",
    date: "3 days ago",
  },
]

export function RecentTransactions() {
  return (
    <Card className="cursor-pointer">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Recent Client Billables & Contract Disbursements</CardTitle>
          <CardDescription>Latest client transactions</CardDescription>
        </div>
        <Button variant="outline" size="sm" className="cursor-pointer">
          <Eye className="h-4 w-4 mr-2" />
          View All
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {transactions.map((transaction) => (
          <div key={transaction.id} >
            <div className="flex p-3 rounded-lg border gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={transaction.customer.avatar} alt={transaction.customer.name} />
                <AvatarFallback>{transaction.customer.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
              </Avatar>
              <div className="flex flex-1 items-center flex-wrap justify-between gap-1">
                <div className="flex items-center space-x-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{transaction.customer.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{transaction.customer.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge
                    variant={
                      transaction.status === "completed" ? "default" :
                      (transaction.status === "pending" || transaction.status === "processing") ? "secondary" : "destructive"
                    }
                    className="cursor-pointer"
                  >
                    {transaction.status}
                  </Badge>
                  <div className="text-right">
                    <p className="text-sm font-medium">{transaction.amount}</p>
                    <p className="text-xs text-muted-foreground">{transaction.date}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 cursor-pointer">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="cursor-pointer">View Details</DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer">Download Receipt</DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer">Contact Customer</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
