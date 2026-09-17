"use client"

import * as React from "react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Calendar } from "@/components/ui/calendar"

interface PeriodToggleProps {
  value?: string
  onChange?: (value: string) => void
  onCustomDateChange?: (date: { from?: Date | null; to?: Date | null } | null) => void
  className?: string
}

export function PeriodToggle({ value: valueProp, onChange, onCustomDateChange, className }: PeriodToggleProps) {
  const [value, setValue] = React.useState<string>(valueProp || "current")

  React.useEffect(() => {
    if (valueProp !== undefined) setValue(valueProp)
  }, [valueProp])

  const [showCalendar, setShowCalendar] = React.useState(false)
  const now = new Date()
  const currentYear = now.getFullYear()

  // From/To selection state
  const [fromDate, setFromDate] = React.useState<Date | null>(null)
  const [toDate, setToDate] = React.useState<Date | null>(null)

  // Month shown in each calendar (controls visible month/year)
  const [fromMonth, setFromMonth] = React.useState<Date>(new Date(currentYear, now.getMonth(), 1))
  const [toMonth, setToMonth] = React.useState<Date>(new Date(currentYear, now.getMonth(), 1))

  const handleChange = (val: string | null) => {
    const v = val ?? "current"
    setValue(v)
    onChange?.(v)
    // keep hover behavior: only show calendar while hovering; don't programmatically open here
  }

  return (
    <div className="relative inline-flex items-center">
      <ToggleGroup type="single" value={value} onValueChange={handleChange} className={className} data-variant="outline">
        <ToggleGroupItem value="current">Current</ToggleGroupItem>
        <ToggleGroupItem value="last-month">Last month</ToggleGroupItem>
        <ToggleGroupItem
          value="custom"
          onMouseEnter={() => setShowCalendar(true)}
          onMouseLeave={() => setShowCalendar(false)}
        >
          Custom
        </ToggleGroupItem>
      </ToggleGroup>

      {showCalendar && (
        <div className="absolute z-50 mt-4 right-0" onMouseEnter={() => setShowCalendar(true)} onMouseLeave={() => setShowCalendar(false)}>
          <div className="bg-popover border rounded-md shadow-md p-3">
            <div className="flex gap-3">
              {/* From calendar */}
              <div className="w-[18rem]">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">From</div>
                  <select
                    value={fromMonth.getFullYear()}
                    onChange={(e) => {
                      const y = Number(e.target.value)
                      setFromMonth(new Date(y, fromMonth.getMonth(), 1))
                    }}
                    className="rounded-md border px-2 py-1 text-sm"
                  >
                    {Array.from({ length: 21 }).map((_, i) => {
                      const y = currentYear - 10 + i
                      return (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      )
                    })}
                  </select>
                </div>
                <Calendar
                  month={fromMonth}
                  mode="single"
                  onMonthChange={(m) => setFromMonth(m)}
                    onSelect={(date) => {
                      const d = date as Date | null
                      setFromDate(d)
                      onCustomDateChange?.({ from: d, to: toDate })
                      if (typeof window !== "undefined") {
                        window.dispatchEvent(new CustomEvent("periodToggleChange", { detail: { from: d, to: toDate } }))
                      }
                    }}
                />
              </div>

              {/* To calendar */}
              <div className="w-[18rem]">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">To</div>
                  <select
                    value={toMonth.getFullYear()}
                    onChange={(e) => {
                      const y = Number(e.target.value)
                      setToMonth(new Date(y, toMonth.getMonth(), 1))
                    }}
                    className="rounded-md border px-2 py-1 text-sm"
                  >
                    {Array.from({ length: 21 }).map((_, i) => {
                      const y = currentYear - 10 + i
                      return (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      )
                    })}
                  </select>
                </div>
                <Calendar
                  month={toMonth}
                  mode="single"
                  onMonthChange={(m) => setToMonth(m)}
                  onSelect={(date) => {
                    const d = date as Date | null
                    setToDate(d)
                    onCustomDateChange?.({ from: fromDate, to: d })
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(new CustomEvent("periodToggleChange", { detail: { from: fromDate, to: d } }))
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PeriodToggle
