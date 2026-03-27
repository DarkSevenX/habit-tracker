"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Check, X, Minus } from "lucide-react"
import type { Habit, HabitLog } from "@/lib/types"
import { formatDate } from "@/lib/habits-utils"
import { cn } from "@/lib/utils"

interface HabitCalendarModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  habit: Habit
  habitLogs: HabitLog[]
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]
const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

type DayStatus = "completed" | "missed" | "today_done" | "today_pending" | "future" | "before_creation"

export function HabitCalendarModal({ open, onOpenChange, habit, habitLogs }: HabitCalendarModalProps) {
  const todayDate = new Date()
  const [viewYear, setViewYear] = useState(todayDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(todayDate.getMonth())

  const todayStr = formatDate(todayDate)
  const createdAt = new Date(parseInt(habit.id))
  const createdStr = formatDate(createdAt)
  const completedSet = new Set(habitLogs.filter((l) => l.completed).map((l) => l.date))

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay()

  const isCurrentMonth =
    viewYear === todayDate.getFullYear() && viewMonth === todayDate.getMonth()

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11) }
    else setViewMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0) }
    else setViewMonth((m) => m + 1)
  }

  const getDayStr = (day: number) => {
    return `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  }

  const getDayStatus = (day: number): DayStatus => {
    const dateStr = getDayStr(day)
    if (dateStr < createdStr) return "before_creation"
    if (dateStr > todayStr) return "future"
    if (dateStr === todayStr) return completedSet.has(dateStr) ? "today_done" : "today_pending"
    return completedSet.has(dateStr) ? "completed" : "missed"
  }

  const completedThisMonth = Array.from({ length: daysInMonth }, (_, i) =>
    getDayStatus(i + 1),
  ).filter((s) => s === "completed" || s === "today_done").length

  const missedThisMonth = Array.from({ length: daysInMonth }, (_, i) =>
    getDayStatus(i + 1),
  ).filter((s) => s === "missed").length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm p-5">
        <DialogHeader className="pb-0">
          <div className="flex items-center gap-2.5">
            <div className={cn("w-3 h-3 rounded-full shrink-0", habit.color)} />
            <DialogTitle className="font-space-grotesk text-base leading-tight">{habit.name}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-space-grotesk font-semibold text-sm">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={nextMonth}
              disabled={isCurrentMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 text-center">
            {DAY_NAMES.map((d) => (
              <div key={d} className="text-[10px] font-dm-sans text-muted-foreground py-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`e-${i}`} />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const status = getDayStatus(day)
              return (
                <div
                  key={day}
                  className={cn(
                    "relative h-9 rounded-lg flex flex-col items-center justify-center gap-0.5 select-none transition-colors",
                    (status === "completed" || status === "today_done") &&
                      "bg-accent/15 text-accent",
                    status === "missed" && "bg-destructive/8 text-destructive/70",
                    status === "today_pending" &&
                      "bg-muted ring-2 ring-accent/50 font-semibold text-foreground",
                    (status === "future" || status === "before_creation") &&
                      "text-muted-foreground/35",
                  )}
                >
                  <span className="text-[11px] leading-none font-dm-sans">{day}</span>
                  {(status === "completed" || status === "today_done") && (
                    <Check className="h-2.5 w-2.5 text-accent" strokeWidth={3} />
                  )}
                  {status === "missed" && (
                    <X className="h-2.5 w-2.5 text-destructive/60" strokeWidth={3} />
                  )}
                  {status === "today_pending" && (
                    <Minus className="h-2 w-2 text-accent/60" strokeWidth={3} />
                  )}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground font-dm-sans">
            <span className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm bg-accent/20 flex items-center justify-center">
                <Check className="h-1.5 w-1.5 text-accent" strokeWidth={3} />
              </div>
              Completado
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm bg-destructive/10 flex items-center justify-center">
                <X className="h-1.5 w-1.5 text-destructive/60" strokeWidth={3} />
              </div>
              Fallado
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm ring-1 ring-accent/50 bg-muted" />
              Hoy
            </span>
          </div>

          {/* Monthly summary */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border text-center">
            <div>
              <p className="text-xl font-bold font-space-grotesk text-accent">{completedThisMonth}</p>
              <p className="text-[11px] text-muted-foreground font-dm-sans">Completados</p>
            </div>
            <div>
              <p className="text-xl font-bold font-space-grotesk text-destructive/70">{missedThisMonth}</p>
              <p className="text-[11px] text-muted-foreground font-dm-sans">Fallados</p>
            </div>
            <div>
              <p className="text-xl font-bold font-space-grotesk">{habit.streak}</p>
              <p className="text-[11px] text-muted-foreground font-dm-sans">Racha actual</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
