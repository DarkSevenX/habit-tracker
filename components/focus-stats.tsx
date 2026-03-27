"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Clock } from "lucide-react"
import type { Habit, PomodoroStat } from "@/lib/types"
import { getStartOfWeek, formatDate } from "@/lib/habits-utils"

interface FocusStatsProps {
  pomodoroStats: PomodoroStat[]
  habits: Habit[]
}

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

export function FocusStats({ pomodoroStats, habits }: FocusStatsProps) {
  const weekStart = useMemo(() => getStartOfWeek(), [])
  const weekStartStr = useMemo(() => formatDate(weekStart), [weekStart])

  const thisWeekStats = useMemo(
    () => pomodoroStats.filter((s) => s.date >= weekStartStr),
    [pomodoroStats, weekStartStr],
  )

  const totalMinutes = useMemo(() => thisWeekStats.reduce((acc, s) => acc + s.focusMinutes, 0), [thisWeekStats])
  const totalHours = Math.floor(totalMinutes / 60)
  const remainingMinutes = totalMinutes % 60

  const dailyData = useMemo(() => {
    return DAY_NAMES.map((name, i) => {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      const dateStr = formatDate(date)
      const minutes = thisWeekStats.filter((s) => s.date === dateStr).reduce((acc, s) => acc + s.focusMinutes, 0)
      return { name, minutes }
    })
  }, [thisWeekStats, weekStart])

  const byHabit = useMemo(() => {
    return habits
      .map((habit) => {
        const minutes = thisWeekStats.filter((s) => s.habitId === habit.id).reduce((acc, s) => acc + s.focusMinutes, 0)
        return { name: habit.name, minutes, color: habit.color }
      })
      .filter((h) => h.minutes > 0)
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 5)
  }, [thisWeekStats, habits])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-space-grotesk flex items-center gap-2">
          <Clock className="h-5 w-5 text-accent" />
          Estadísticas de Foco
        </CardTitle>
        <p className="text-sm text-muted-foreground font-dm-sans">Esta semana</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-end gap-1">
          <span className="text-3xl font-bold font-space-grotesk text-accent">
            {totalHours}h {remainingMinutes}m
          </span>
          <span className="text-sm text-muted-foreground font-dm-sans mb-1">de concentración</span>
        </div>

        {totalMinutes === 0 ? (
          <p className="text-sm text-muted-foreground font-dm-sans text-center py-4">
            Inicia sesiones Pomodoro vinculadas a hábitos para ver estadísticas
          </p>
        ) : (
          <>
            <div>
              <p className="text-xs font-medium font-dm-sans text-muted-foreground mb-2">Minutos por día</p>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={dailyData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: "var(--font-dm-sans)" }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: 12 }}
                    formatter={(val) => [`${val} min`, ""]}
                  />
                  <Bar dataKey="minutes" fill="var(--color-chart-2)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {byHabit.length > 0 && (
              <div>
                <p className="text-xs font-medium font-dm-sans text-muted-foreground mb-2">Por hábito</p>
                <div className="space-y-2">
                  {byHabit.map((h, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm font-dm-sans truncate max-w-[150px]">{h.name}</span>
                      <span className="text-sm font-medium font-space-grotesk text-accent">{h.minutes} min</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
