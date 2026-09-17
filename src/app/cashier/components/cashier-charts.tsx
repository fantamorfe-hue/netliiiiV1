import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar 
} from 'recharts'
import { 
  HOURLY_COLLECTION_DATA, 
  PAYMENT_METHOD_DISTRIBUTION, 
  SUBSYSTEM_COLLECTION_DATA 
} from '../data/cashier-data'
import { Activity, PieChart as PieIcon, BarChart3, Layers } from 'lucide-react'

export function CashierCharts() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Chart 1: Hourly Collection Flow */}
      <Card className="lg:col-span-2 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="size-4 text-emerald-600" />
              Hourly Collection Velocity (Shift #0891)
            </CardTitle>
            <CardDescription className="text-xs">
              Live inflow distribution across Cash vs Digital payment channels
            </CardDescription>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded-full bg-emerald-500"></span> Cash
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded-full bg-blue-500"></span> Digital/Card
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={HOURLY_COLLECTION_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="nonCashGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} tickFormatter={(val) => `₱${val/1000}k`} />
                <Tooltip 
                  formatter={(val: number) => [`₱${val.toLocaleString()}`, '']}
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="cash" name="Cash Collections" stroke="#10b981" fillOpacity={1} fill="url(#cashGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="nonCash" name="Digital / Bank Transfer" stroke="#3b82f6" fillOpacity={1} fill="url(#nonCashGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Chart 2: Payment Method Breakdown */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <PieIcon className="size-4 text-indigo-600" />
            Tender Method Distribution
          </CardTitle>
          <CardDescription className="text-xs">
            Percentage share of shift collections by payment mode
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="flex flex-col items-center">
            <div className="h-[150px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={PAYMENT_METHOD_DISTRIBUTION}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {PAYMENT_METHOD_DISTRIBUTION.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: number) => [`₱${val.toLocaleString()}`, 'Amount']}
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Legend */}
            <div className="grid grid-cols-2 gap-2 w-full mt-2 text-xs">
              {PAYMENT_METHOD_DISTRIBUTION.map((item) => (
                <div key={item.name} className="flex items-center justify-between border rounded-md p-1.5 bg-muted/30">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="truncate text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-semibold text-foreground">{item.percentage}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
