"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Trophy } from "lucide-react"
import type { Habit, Achievement } from "@/lib/types"
import { ACHIEVEMENT_DEFINITIONS, calculateLevel, calculateXpProgress, LEVELS } from "@/lib/habits-utils"
import { cn } from "@/lib/utils"

interface AchievementsPanelProps {
  habits: Habit[]
  achievements: Achievement[]
}

const ACHIEVEMENT_TYPES = Object.keys(ACHIEVEMENT_DEFINITIONS) as (keyof typeof ACHIEVEMENT_DEFINITIONS)[]

export function AchievementsPanel({ habits, achievements }: AchievementsPanelProps) {
  const totalAchievements = useMemo(() => achievements.length, [achievements])

  const achievementsByHabit = useMemo(() => {
    return habits.map((habit) => {
      const habitAchievements = achievements.filter((a) => a.habitId === habit.id)
      const unlockedTypes = new Set(habitAchievements.map((a) => a.type))
      const level = calculateLevel(habit.xp)
      const xpProgress = calculateXpProgress(habit.xp)
      const nextLevel = LEVELS.find((l) => l.level === level.level + 1)
      return { habit, habitAchievements, unlockedTypes, level, xpProgress, nextLevel }
    })
  }, [habits, achievements])

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="font-space-grotesk flex items-center gap-2">
            <Trophy className="h-5 w-5 text-accent" />
            Panel de Logros
          </CardTitle>
          <p className="text-sm text-muted-foreground font-dm-sans">
            {totalAchievements} logro{totalAchievements !== 1 ? "s" : ""} desbloqueado{totalAchievements !== 1 ? "s" : ""}
          </p>
        </CardHeader>
      </Card>

      {habits.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground font-dm-sans text-sm">
            Agrega hábitos para desbloquear logros
          </CardContent>
        </Card>
      ) : (
        achievementsByHabit.map(({ habit, unlockedTypes, level, xpProgress, nextLevel }) => (
          <Card key={habit.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className={cn("w-3 h-3 rounded-full", habit.color)} />
                  <h3 className="font-semibold font-space-grotesk">{habit.name}</h3>
                  <Badge variant="outline" className="font-dm-sans text-accent border-accent/30">
                    {level.name}
                  </Badge>
                </div>
                <span className="text-sm font-space-grotesk font-bold text-accent">{habit.xp} XP</span>
              </div>

              {/* XP Progress bar */}
              <div className="space-y-1 mt-2">
                <div className="flex justify-between text-xs text-muted-foreground font-dm-sans">
                  <span>Nivel {level.level}</span>
                  {nextLevel ? (
                    <span>
                      {habit.xp} / {level.maxXp + 1} XP para {nextLevel.name}
                    </span>
                  ) : (
                    <span>Nivel máximo alcanzado</span>
                  )}
                </div>
                <Progress value={xpProgress} className="h-1.5" />
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {ACHIEVEMENT_TYPES.map((type) => {
                  const def = ACHIEVEMENT_DEFINITIONS[type]
                  const isUnlocked = unlockedTypes.has(type)
                  const unlocked = achievements.find((a) => a.habitId === habit.id && a.type === type)
                  return (
                    <div
                      key={type}
                      className={cn(
                        "rounded-lg border p-3 text-center space-y-1.5 transition-all",
                        isUnlocked
                          ? "border-accent/30 bg-accent/5"
                          : "border-border opacity-40 grayscale",
                      )}
                    >
                      <div className="text-2xl">{def.icon}</div>
                      <p className="text-xs font-semibold font-space-grotesk leading-tight">{def.label}</p>
                      <p className="text-[10px] text-muted-foreground font-dm-sans leading-tight">{def.description}</p>
                      {isUnlocked && unlocked && (
                        <p className="text-[10px] text-accent font-dm-sans">
                          {new Date(unlocked.unlockedAt + "T12:00:00").toLocaleDateString("es-ES", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
