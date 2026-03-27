"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Habit, HabitLog } from "@/lib/types"
import { formatDate } from "@/lib/habits-utils"

interface HeatMapProps {
  logs: HabitLog[]
  habits: Habit[]
}

interface DayCell {
  date: string
  count: number
  isFuture: boolean
}

const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
// Only show labels on Mon, Wed, Fri (indices 1, 3, 5)
const DAY_LABELS = ["", "Lun", "", "Mié", "", "Vie", ""]

const CELL = 12   // px width/height of each cell
const GAP = 2     // px gap
const STEP = CELL + GAP  // 14px per column

function buildCompletionMap(logs: HabitLog[], selectedHabitId: string) {
  const map = new Map<string, number>()
  const filtered =
    selectedHabitId === "all"
      ? logs.filter((l) => l.completed)
      : logs.filter((l) => l.habitId === selectedHabitId && l.completed)
  filtered.forEach((l) => map.set(l.date, (map.get(l.date) || 0) + 1))
  return map
}

function generateWeeks(logs: HabitLog[], selectedHabitId: string): DayCell[][] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Start at Sunday 52 weeks ago
  const start = new Date(today)
  start.setDate(today.getDate() - 52 * 7)
  start.setDate(start.getDate() - start.getDay())

  const completionMap = buildCompletionMap(logs, selectedHabitId)
  const weeks: DayCell[][] = []
  const current = new Date(start)

  while (current <= today) {
    const week: DayCell[] = []
    for (let d = 0; d < 7; d++) {
      const dateStr = formatDate(current)
      const isFuture = current > today
      week.push({ date: dateStr, count: isFuture ? -1 : (completionMap.get(dateStr) || 0) })
      current.setDate(current.getDate() + 1)
    }
    weeks.push(week)
  }

  return weeks
}

function getIntensityClass(count: number, maxCount: number): string {
  if (count <= 0) return "bg-muted"
  const ratio = count / maxCount
  if (ratio <= 0.25) return "bg-accent/25"
  if (ratio <= 0.5) return "bg-accent/50"
  if (ratio <= 0.75) return "bg-accent/75"
  return "bg-accent"
}

function parseDateLocal(dateStr: string): Date {
  // Parse "YYYY-MM-DD" as local time (avoids UTC offset issues)
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function HeatMap({ logs, habits }: HeatMapProps) {
  const [selectedHabitId, setSelectedHabitId] = useState("all")

  const weeks = useMemo(() => generateWeeks(logs, selectedHabitId), [logs, selectedHabitId])

  const maxCount = useMemo(() => {
    let max = 1
    weeks.forEach((week) => week.forEach((day) => { if (day.count > max) max = day.count }))
    return max
  }, [weeks])

  const totalActiveDays = useMemo(
    () => weeks.flat().filter((d) => d.count > 0).length,
    [weeks],
  )

  // Month label for each week column (only shown when month changes)
  const weekMonthLabels = useMemo(() => {
    return weeks.map((week, i) => {
      if (!week[0]) return null
      const thisDate = parseDateLocal(week[0].date)
      const prevDate = i > 0 && weeks[i - 1][0] ? parseDateLocal(weeks[i - 1][0].date) : null
      if (!prevDate || thisDate.getMonth() !== prevDate.getMonth()) {
        return MONTH_NAMES[thisDate.getMonth()]
      }
      return null
    })
  }, [weeks])

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="font-space-grotesk">Mapa de Actividad Anual</CardTitle>
            <p className="text-sm text-muted-foreground font-dm-sans mt-1">
              {totalActiveDays} día{totalActiveDays !== 1 ? "s" : ""} activo{totalActiveDays !== 1 ? "s" : ""} en el último año
            </p>
          </div>
          <Select value={selectedHabitId} onValueChange={setSelectedHabitId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los hábitos</SelectItem>
              {habits.map((h) => (
                <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {habits.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 font-dm-sans text-sm">
            Agrega hábitos para ver tu actividad aquí
          </p>
        ) : (
          <div className="overflow-x-auto pb-2">
            <div className="inline-flex flex-col gap-0.5" style={{ minWidth: `${weeks.length * STEP + 30}px` }}>

              {/* Month labels row */}
              <div className="flex" style={{ marginLeft: 28 }}>
                {weeks.map((_, wi) => (
                  <div key={wi} style={{ width: STEP, minWidth: STEP }} className="overflow-visible relative h-4">
                    {weekMonthLabels[wi] && (
                      <span className="absolute left-0 text-[10px] text-muted-foreground font-dm-sans whitespace-nowrap">
                        {weekMonthLabels[wi]}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Grid: day-of-week labels + week columns */}
              <div className="flex gap-0.5">
                {/* Day-of-week labels (left side) */}
                <div className="flex flex-col" style={{ width: 26, marginRight: 2 }}>
                  {DAY_LABELS.map((label, i) => (
                    <div key={i} style={{ height: CELL, marginBottom: GAP }} className="flex items-center justify-end pr-1">
                      {label && <span className="text-[10px] text-muted-foreground font-dm-sans">{label}</span>}
                    </div>
                  ))}
                </div>

                {/* Week columns */}
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-0.5">
                    {week.map((day, di) => (
                      <div
                        key={di}
                        title={
                          day.isFuture
                            ? undefined
                            : `${day.date}: ${day.count > 0 ? `${day.count} completación${day.count !== 1 ? "es" : ""}` : "sin actividad"}`
                        }
                        style={{ width: CELL, height: CELL }}
                        className={`rounded-sm transition-colors cursor-default ${
                          day.isFuture ? "opacity-0" : getIntensityClass(day.count, maxCount)
                        }`}
                      />
                    ))}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-1 mt-2 justify-end">
                <span className="text-[10px] text-muted-foreground font-dm-sans mr-1">Menos</span>
                {(["bg-muted", "bg-accent/25", "bg-accent/50", "bg-accent/75", "bg-accent"] as const).map((cls, i) => (
                  <div key={i} style={{ width: CELL, height: CELL }} className={`rounded-sm ${cls}`} />
                ))}
                <span className="text-[10px] text-muted-foreground font-dm-sans ml-1">Más</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
