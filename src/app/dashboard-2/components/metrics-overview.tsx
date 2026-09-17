"use client"

import { 
  TrendingUp, 
  TrendingDown, 
  Banknote, 
  Users, 
  ClipboardList, 
  UserCheck 
} from "lucide-react"
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const metrics = [
  {
    title: "Total Billing / Revenue",
    value: "₱4,850,200",
    description: "Monthly client billing",
    change: "+12.4%",
    trend: "up",
    icon: Banknote,
    footer: "Management fees",
    subfooter: "Trending up this month"
  },
  {
    title: "Active Deployed Staff",
    value: "2,350",
    description: "Total deployed headcount",
    change: "+5.2%", 
    trend: "up",
    icon: Users,
    footer: "Across client sites",
    subfooter: "Consistently growing"
  },
  {
    title: "Open Job Orders",
    value: "342",
    description: "Active client requisitions",
    change: "88%",
    trend: "up", 
    icon: ClipboardList,
    footer: "88% fulfillment rate",
    subfooter: "Strong demand from retail"
  },
  {
    title: "Placement Rate",
    value: "94.2%",
    description: "Successful endorsements",
    change: "+4.1%",
    trend: "up",
    icon: UserCheck,
    footer: "High deployment rate",
    subfooter: "Meets SLA projections"
  },
]

export function MetricsOverview() {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs grid gap-4 sm:grid-cols-2 @5xl:grid-cols-4">
      {metrics.map((metric) => {
        const TrendIcon = metric.trend === "up" ? TrendingUp : TrendingDown
        
        return (
          <Card key={metric.title} className=" cursor-pointer">
            <CardHeader>
              <CardDescription>{metric.title}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {metric.value}
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <TrendIcon className="h-4 w-4" />
                  {metric.change}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                {metric.footer} <TrendIcon className="size-4" />
              </div>
              <div className="text-muted-foreground">
                {metric.subfooter}
              </div>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
