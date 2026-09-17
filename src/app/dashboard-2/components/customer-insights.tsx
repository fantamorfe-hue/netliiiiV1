"use client"

import { useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Users, MapPin, TrendingUp, Target, ArrowUpIcon, UserIcon } from "lucide-react"

const customerGrowthData = [
  { month: "Jan", new: 245, returning: 890, churn: 45 },
  { month: "Feb", new: 312, returning: 934, churn: 52 },
  { month: "Mar", new: 289, returning: 1023, churn: 38 },
  { month: "Apr", new: 456, returning: 1156, churn: 61 },
  { month: "May", new: 523, returning: 1298, churn: 47 },
  { month: "Jun", new: 634, returning: 1445, churn: 55 },
]

const chartConfig = {
  new: {
    label: "New Hires",
    color: "var(--chart-1)",
  },
  returning: {
    label: "Active Contracts",
    color: "var(--chart-2)",
  },
  churn: {
    label: "Turnovers",
    color: "var(--chart-3)",
  },
}

const demographicsData = [
  { ageGroup: "18-24", customers: 2847, percentage: "18.0%", growth: "+15.2%", growthColor: "text-green-600" },
  { ageGroup: "25-34", customers: 4521, percentage: "28.5%", growth: "+8.7%", growthColor: "text-green-600" },
  { ageGroup: "35-44", customers: 3982, percentage: "25.1%", growth: "+3.4%", growthColor: "text-blue-600" },
  { ageGroup: "45-54", customers: 2734, percentage: "17.2%", growth: "+1.2%", growthColor: "text-orange-600" },
  { ageGroup: "55+", customers: 1763, percentage: "11.2%", growth: "-2.1%", growthColor: "text-red-600" },
]

const regionsData = [
  { region: "Makati & BGC", customers: 1120, revenue: "₱2,350,000", growth: "+12.3%", growthColor: "text-green-600" },
  { region: "Ortigas & Pasig", customers: 580, revenue: "₱1,180,000", growth: "+9.7%", growthColor: "text-green-600" },
  { region: "Caloocan & Quezon City", customers: 410, revenue: "₱820,000", growth: "+18.4%", growthColor: "text-blue-600" },
  { region: "Cavite & Laguna Industrial", customers: 240, revenue: "₱500,000", growth: "+15.8%", growthColor: "text-green-600" },
]

export function CustomerInsights() {
  const [activeTab, setActiveTab] = useState("growth")

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Client & Candidate Deployment Insights</CardTitle>
        <CardDescription>Manpower trends, demographics, and regional distribution</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-lg h-12">
            <TabsTrigger
              value="growth"
              className="cursor-pointer flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground"
            >
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Deployment Trends</span>
            </TabsTrigger>
            <TabsTrigger
              value="demographics"
              className="cursor-pointer flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground"
            >
              <UserIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Candidate Demographics</span>
            </TabsTrigger>
            <TabsTrigger
              value="regions"
              className="cursor-pointer flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground"
            >
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Client Distribution</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="growth" className="mt-8 space-y-6">
            <div className="grid gap-6">
              {/* Chart and Key Metrics Side by Side */}
              <div className="grid grid-cols-10 gap-6">
                {/* Chart Area - 70% */}
                <div className="col-span-10 xl:col-span-7">
                  <h3 className="text-sm font-medium text-muted-foreground mb-6">Manpower Deployment Trends</h3>
                  <ChartContainer config={chartConfig} className="h-[375px] w-full">
                    <BarChart data={customerGrowthData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="month"
                        className="text-xs"
                        tick={{ fontSize: 12 }}
                        tickLine={{ stroke: 'var(--border)' }}
                        axisLine={{ stroke: 'var(--border)' }}
                      />
                      <YAxis
                        className="text-xs"
                        tick={{ fontSize: 12 }}
                        tickLine={{ stroke: 'var(--border)' }}
                        axisLine={{ stroke: 'var(--border)' }}
                        domain={[0, 'dataMax']}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="new" fill="var(--color-new)" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="returning" fill="var(--color-returning)" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="churn" fill="var(--color-churn)" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </div>

                {/* Key Metrics - 30% */}
                <div className="col-span-10 xl:col-span-3 space-y-5">
                  <h3 className="text-sm font-medium text-muted-foreground mb-6">Key Metrics</h3>
                  <div className="grid grid-cols-3 gap-5">
                    <div className="p-4 rounded-lg max-lg:col-span-3 xl:col-span-3 border">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Active Personnel</span>
                      </div>
                      <div className="text-2xl font-bold">2,350</div>
                      <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                        <ArrowUpIcon className="h-3 w-3" />
                        +5.2% from last month
                      </div>
                    </div>

                    <div className="p-4 rounded-lg max-lg:col-span-3 xl:col-span-3 border">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Retention Rate</span>
                      </div>
                      <div className="text-2xl font-bold">94.2%</div>
                      <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                        <ArrowUpIcon className="h-3 w-3" />
                        +2.1% improvement
                      </div>
                    </div>

                    <div className="p-4 rounded-lg max-lg:col-span-3 xl:col-span-3 border">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Avg. Monthly Billing</span>
                      </div>
                      <div className="text-2xl font-bold">₱4,850,200</div>
                      <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                        <ArrowUpIcon className="h-3 w-3" />
                        +12.4% growth
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="demographics" className="mt-8">
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead className="py-5 px-6 font-semibold">Age Group</TableHead>
                    <TableHead className="text-right py-5 px-6 font-semibold">Candidates</TableHead>
                    <TableHead className="text-right py-5 px-6 font-semibold">Percentage</TableHead>
                    <TableHead className="text-right py-5 px-6 font-semibold">Growth</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {demographicsData.map((row, index) => (
                    <TableRow key={index} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium py-5 px-6">{row.ageGroup}</TableCell>
                      <TableCell className="text-right py-5 px-6">{row.customers.toLocaleString()}</TableCell>
                      <TableCell className="text-right py-5 px-6">{row.percentage}</TableCell>
                      <TableCell className="text-right py-5 px-6">
                        <span className={`font-medium ${row.growthColor}`}>{row.growth}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-6">
              <div className="text-muted-foreground text-sm hidden sm:block">
                0 of {demographicsData.length} row(s) selected.
              </div>
              <div className="space-x-2 space-y-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Next
                </Button>
              </div>
            </div>
          </TabsContent>


          <TabsContent value="regions" className="mt-8">
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead className="py-5 px-6 font-semibold">Region</TableHead>
                    <TableHead className="text-right py-5 px-6 font-semibold">Active Personnel</TableHead>
                    <TableHead className="text-right py-5 px-6 font-semibold">Billing</TableHead>
                    <TableHead className="text-right py-5 px-6 font-semibold">Growth</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regionsData.map((row, index) => (
                    <TableRow key={index} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium py-5 px-6">{row.region}</TableCell>
                      <TableCell className="text-right py-5 px-6">{row.customers.toLocaleString()}</TableCell>
                      <TableCell className="text-right py-5 px-6">{row.revenue}</TableCell>
                      <TableCell className="text-right py-5 px-6">
                        <span className={`font-medium ${row.growthColor}`}>{row.growth}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-6">
              <div className="text-muted-foreground text-sm hidden sm:block">
                0 of {regionsData.length} row(s) selected.
              </div>
              <div className="space-x-2 space-y-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Next
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
