"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts"
import type { Habit, HabitLog } from "@/lib/types"
import { formatDate } from "@/lib/habits-utils"

interface TrendChartProps {
  logs: HabitLog[]
  habits: Habit[]
}

function getWeeklyData(logs: HabitLog[], habits: Habit[]) {
  const weeks = []
  const today = new Date()

  for (let i = 11; i >= 0; i--) {
    const weekEnd = new Date(today)
    weekEnd.setDate(today.getDate() - i * 7)
    const weekStart = new Date(weekEnd)
    weekStart.setDate(weekEnd.getDate() - 6)

    const weekStartStr = formatDate(weekStart)
    const weekEndStr = formatDate(weekEnd)

    const completions = logs.filter((l) => l.completed && l.date >= weekStartStr && l.date <= weekEndStr).length

    const scheduledDays = 7 * habits.length
    const rate = scheduledDays > 0 ? Math.round((completions / scheduledDays) * 100) : 0

    const label = weekStart.toLocaleDateString("es-ES", { month: "short", day: "numeric" })
    weeks.push({ label, completions, rate })
  }

  return weeks
}

function getMonthlyData(logs: HabitLog[], habits: Habit[]) {
  const months = []
  const today = new Date()

  for (let i = 5; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const monthStart = formatDate(date)
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    const monthEnd = formatDate(lastDay)

    const completions = logs.filter((l) => l.completed && l.date >= monthStart && l.date <= monthEnd).length

    const daysInMonth = lastDay.getDate()
    const scheduledDays = daysInMonth * habits.length
    const rate = scheduledDays > 0 ? Math.round((completions / scheduledDays) * 100) : 0

    const label = date.toLocaleDateString("es-ES", { month: "short", year: "2-digit" })
    months.push({ label, completions, rate })
  }

  return months
}

export function TrendChart({ logs, habits }: TrendChartProps) {
  const [view, setView] = useState<"weekly" | "monthly">("weekly")

  const data = useMemo(
    () => (view === "weekly" ? getWeeklyData(logs, habits) : getMonthlyData(logs, habits)),
    [logs, habits, view],
  )

  const hasData = logs.length > 0

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="font-space-grotesk">Tendencia de Progreso</CardTitle>
          <Tabs value={view} onValueChange={(v) => setView(v as "weekly" | "monthly")}>
            <TabsList>
              <TabsTrigger value="weekly">Semanal</TabsTrigger>
              <TabsTrigger value="monthly">Mensual</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="text-center text-muted-foreground py-8 font-dm-sans text-sm">
            Completa algunos hábitos para ver tus tendencias aquí
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium font-dm-sans mb-3 text-muted-foreground">Completaciones totales</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fontFamily: "var(--font-dm-sans)" }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px" }}
                    labelStyle={{ fontFamily: "var(--font-space-grotesk)", fontWeight: 600 }}
                    formatter={(val) => [`${val} completaciones`, ""]}
                  />
                  <Bar dataKey="completions" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div>
              <p className="text-sm font-medium font-dm-sans mb-3 text-muted-foreground">Tasa de cumplimiento (%)</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fontFamily: "var(--font-dm-sans)" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px" }}
                    labelStyle={{ fontFamily: "var(--font-space-grotesk)", fontWeight: 600 }}
                    formatter={(val) => [`${val}%`, "Cumplimiento"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="var(--color-accent)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-accent)", r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
