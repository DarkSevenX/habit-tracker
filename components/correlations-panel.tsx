"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GitMerge } from "lucide-react"
import type { Habit, HabitLog } from "@/lib/types"
import { calculateCorrelations } from "@/lib/habits-utils"

interface CorrelationsPanelProps {
  logs: HabitLog[]
  habits: Habit[]
}

export function CorrelationsPanel({ logs, habits }: CorrelationsPanelProps) {
  const correlations = useMemo(() => calculateCorrelations(habits, logs), [habits, logs])

  const totalLogs = useMemo(
    () => new Set(logs.filter((l) => l.completed).map((l) => l.habitId + l.date)).size,
    [logs],
  )

  const hasEnoughData = totalLogs >= 7 * habits.length && habits.length >= 2

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-space-grotesk flex items-center gap-2">
          <GitMerge className="h-5 w-5 text-accent" />
          Correlaciones
        </CardTitle>
        <p className="text-sm text-muted-foreground font-dm-sans">Hábitos que se completan juntos</p>
      </CardHeader>
      <CardContent>
        {habits.length < 2 ? (
          <p className="text-sm text-muted-foreground font-dm-sans text-center py-4">
            Necesitas al menos 2 hábitos para ver correlaciones
          </p>
        ) : !hasEnoughData ? (
          <p className="text-sm text-muted-foreground font-dm-sans text-center py-4">
            Sigue completando hábitos. Las correlaciones aparecerán cuando haya suficientes datos (mínimo 7 días por hábito)
          </p>
        ) : correlations.length === 0 ? (
          <p className="text-sm text-muted-foreground font-dm-sans text-center py-4">
            Aún no hay correlaciones significativas entre tus hábitos
          </p>
        ) : (
          <div className="space-y-3">
            {correlations.map((corr, i) => (
              <div key={i} className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${corr.habitA.color}`} />
                      <span className="text-sm font-medium font-dm-sans">{corr.habitA.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">+</span>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${corr.habitB.color}`} />
                      <span className="text-sm font-medium font-dm-sans">{corr.habitB.name}</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="font-space-grotesk text-accent shrink-0">
                    {corr.percentage}%
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-dm-sans">
                  Cuando completas <strong>{corr.habitA.name}</strong>, también completas{" "}
                  <strong>{corr.habitB.name}</strong> el {corr.percentage}% de las veces
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
