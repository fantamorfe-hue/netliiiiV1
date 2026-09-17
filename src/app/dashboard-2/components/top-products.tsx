"use client"

import { Eye, Star, TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

const products = [
  {
    id: 1,
    name: "Retail Merchandiser & Cashier",
    sales: 680,
    revenue: "₱1,250,000",
    growth: "+23%",
    rating: "High",
    stock: 95,
    category: "Retail",
  },
  {
    id: 2,
    name: "F&B Service Crew & Barista",
    sales: 490,
    revenue: "₱980,000",
    growth: "+18%",
    rating: "High",
    stock: 90,
    category: "Hospitality",
  },
  {
    id: 3,
    name: "Warehouse & Inventory Associate",
    sales: 420,
    revenue: "₱840,000",
    growth: "+12%",
    rating: "Medium",
    stock: 60,
    category: "Logistics",
  },
  {
    id: 4,
    name: "Hotel Housekeeping Attendant",
    sales: 310,
    revenue: "₱620,000",
    growth: "+8%",
    rating: "High",
    stock: 85,
    category: "Hospitality",
  },
  {
    id: 5,
    name: "Production Machine Operator",
    sales: 250,
    revenue: "₱500,000",
    growth: "+31%",
    rating: "Medium",
    stock: 55,
    category: "Manufacturing",
  },
]

export function TopProducts() {
  return (
    <Card className="cursor-pointer">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>In-Demand Job Roles & Staffing Contracts</CardTitle>
          <CardDescription>Best performing contracts this month</CardDescription>
        </div>
        <Button variant="outline" size="sm" className="cursor-pointer">
          <Eye className="h-4 w-4 mr-2" />
          View All
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {products.map((product, index) => (
          <div key={product.id} className="flex items-center p-3 rounded-lg border gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                #{index + 1}
              </div>
            <div className="flex gap-2 items-center justify-between space-x-3 flex-1 flex-wrap">
              <div className="">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <Badge variant="outline" className="text-xs">
                    {product.category}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs text-muted-foreground">Demand: {product.rating}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">{product.sales} deployed</span>
                </div>
              </div>
              <div className="text-right space-y-1">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium">{product.revenue}</p>
                  <Badge
                    variant="outline"
                    className="text-green-600 border-green-200 cursor-pointer"
                  >
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {product.growth}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">Fulfillment: {product.stock}%</span>
                  <Progress
                    value={product.stock > 100 ? 100 : (product.stock / 100) * 100}
                    className="w-12 h-1"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
