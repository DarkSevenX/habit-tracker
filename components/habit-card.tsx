"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Check, Flame, Edit2, Trash2, MoreVertical, Lock, Zap, Target, CalendarDays } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { HabitCalendarModal } from "@/components/habit-calendar-modal"
import { cn } from "@/lib/utils"
import { calculateLevel, calculateXpProgress, formatDate } from "@/lib/habits-utils"
import type { Habit, HabitLog } from "@/lib/types"

interface HabitCardProps {
  habit: Habit
  habitLogs: HabitLog[]
  isLocked: boolean
  isScheduledToday: boolean
  prerequisiteName?: string
  challengeProgress?: { current: number; goal: number }
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  style?: React.CSSProperties
}

export function HabitCard({
  habit,
  habitLogs,
  isLocked,
  isScheduledToday,
  prerequisiteName,
  challengeProgress,
  onToggle,
  onEdit,
  onDelete,
  style,
}: HabitCardProps) {
  const [showCalendar, setShowCalendar] = useState(false)

  const todayStr = formatDate(new Date())
  const level = calculateLevel(habit.xp)
  const xpProgress = calculateXpProgress(habit.xp)
  const isDisabled = isLocked || !isScheduledToday

  // Last 28 days strip
  const dayStrip = useMemo(() => {
    return Array.from({ length: 28 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (27 - i))
      const dateStr = formatDate(d)
      const log = habitLogs.find((l) => l.date === dateStr)
      const isToday = dateStr === todayStr
      const completed = log?.completed ?? (isToday && habit.completedToday)
      return { date: dateStr, completed, isToday }
    })
  }, [habitLogs, habit.completedToday, todayStr])

  const recentCompletions = dayStrip.filter((d) => d.completed).length

  return (
    <>
      <Card
        className={cn(
          "animate-slide-up transition-all duration-300 hover:shadow-lg",
          habit.completedToday && "ring-2 ring-accent/20",
          isLocked && "opacity-70",
        )}
        style={style}
      >
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3 min-w-0">

              {/* Title row */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className={cn("w-3 h-3 rounded-full shrink-0", habit.color)} />
                <h3 className="font-semibold font-space-grotesk text-lg">{habit.name}</h3>
                {habit.streak > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1 shrink-0">
                    <Flame className="h-3 w-3" />
                    {habit.streak}
                  </Badge>
                )}
                {isLocked && (
                  <Badge variant="outline" className="text-xs font-dm-sans shrink-0 border-amber-500/40 text-amber-600 dark:text-amber-400">
                    <Lock className="h-3 w-3 mr-1" />
                    Bloqueado
                  </Badge>
                )}
                {!isScheduledToday && !isLocked && (
                  <Badge variant="outline" className="text-xs font-dm-sans shrink-0 text-muted-foreground/60">
                    No programado hoy
                  </Badge>
                )}
              </div>

              {habit.description && (
                <p className="text-sm text-muted-foreground font-dm-sans">{habit.description}</p>
              )}

              {/* Challenge progress */}
              {challengeProgress && (
                <div className="flex items-center gap-2 text-sm">
                  <Target className="h-3.5 w-3.5 text-accent shrink-0" />
                  <span className="font-dm-sans text-sm">
                    Reto: {challengeProgress.current}/{challengeProgress.goal} días
                  </span>
                  <div className="flex-1 max-w-[100px]">
                    <Progress value={(challengeProgress.current / challengeProgress.goal) * 100} className="h-1.5" />
                  </div>
                </div>
              )}

              {/* 28-day activity strip */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-dm-sans">
                    {recentCompletions} de 28 días
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCalendar(true)}
                    className="text-xs text-accent hover:text-accent/70 font-dm-sans transition-colors flex items-center gap-1"
                  >
                    <CalendarDays className="h-3 w-3" />
                    Ver historial
                  </button>
                </div>
                <div className="flex gap-0.5">
                  {dayStrip.map((day, i) => (
                    <div
                      key={i}
                      title={`${day.date}${day.completed ? " ✓" : ""}`}
                      className={cn(
                        "h-3 flex-1 rounded-sm transition-colors",
                        day.completed ? "bg-accent" : "bg-muted",
                        day.isToday && !day.completed && "ring-1 ring-accent/60 bg-muted",
                        day.isToday && day.completed && "ring-1 ring-accent/80",
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* XP / Level */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span className="font-dm-sans flex items-center gap-1">
                    <Zap className="h-3 w-3 text-accent" />
                    <span className="text-accent font-medium">{level.name}</span>
                    <span>· {habit.xp} XP</span>
                  </span>
                  <span className="font-dm-sans">Nv. {level.level}</span>
                </div>
                <Progress value={xpProgress} className="h-1 [&>div]:bg-chart-4" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0 mt-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
                    <Edit2 className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onDelete} className="cursor-pointer text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        variant={habit.completedToday ? "default" : "outline"}
                        size="lg"
                        onClick={onToggle}
                        disabled={isDisabled}
                        className={cn(
                          "transition-all duration-300",
                          habit.completedToday && "animate-pulse-gentle",
                          isDisabled && "cursor-not-allowed opacity-50",
                        )}
                      >
                        {isLocked ? <Lock className="h-5 w-5" /> : <Check className="h-5 w-5" />}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {isLocked && prerequisiteName && (
                    <TooltipContent>
                      <p>Primero completa: {prerequisiteName}</p>
                    </TooltipContent>
                  )}
                  {!isScheduledToday && !isLocked && (
                    <TooltipContent>
                      <p>No programado para hoy</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardContent>
      </Card>

      <HabitCalendarModal
        open={showCalendar}
        onOpenChange={setShowCalendar}
        habit={habit}
        habitLogs={habitLogs}
      />
    </>
  )
}
