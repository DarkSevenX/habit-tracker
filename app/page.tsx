"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { PomodoroTimer } from "@/components/pomodoro-timer"
import { HabitCard } from "@/components/habit-card"
import { AddHabitDialog } from "@/components/add-habit-dialog"
import { EditHabitDialog } from "@/components/edit-habit-dialog"
import { HeatMap } from "@/components/heat-map"
import { TrendChart } from "@/components/trend-chart"
import { CorrelationsPanel } from "@/components/correlations-panel"
import { AchievementsPanel } from "@/components/achievements-panel"
import { FocusStats } from "@/components/focus-stats"
import { Moon, Plus, Sun, Target, TrendingUp } from "lucide-react"
import type { Habit, HabitLog, Achievement, PomodoroStat, NewHabitInput } from "@/lib/types"
import {
  loadHabits, saveHabits,
  loadLogs, saveLogs,
  loadAchievements, saveAchievements,
  loadPomodoroStats, savePomodoroStats,
  STORAGE_KEYS,
} from "@/lib/storage"
import {
  calculateXpGain,
  getProgressiveTarget,
  checkNewAchievements,
  isHabitScheduledToday,
  getToday,
} from "@/lib/habits-utils"

export default function HabitTracker() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [logs, setLogs] = useState<HabitLog[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [pomodoroStats, setPomodoroStats] = useState<PomodoroStat[]>([])
  const [isHydrated, setIsHydrated] = useState(false)
  const { theme, setTheme } = useTheme()

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)

  const achievementsRef = useRef(achievements)
  useEffect(() => { achievementsRef.current = achievements }, [achievements])

  // Load all data on mount
  useEffect(() => {
    try {
      const loadedHabits = loadHabits()
      const loadedLogs = loadLogs()
      const loadedAchievements = loadAchievements()
      const loadedStats = loadPomodoroStats()

      // Daily reset check
      const today = getToday()
      const lastActive = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVE_DATE)
      const habitsToSet =
        lastActive && lastActive !== today
          ? loadedHabits.map((h) => ({ ...h, completedToday: false }))
          : loadedHabits

      localStorage.setItem(STORAGE_KEYS.LAST_ACTIVE_DATE, today)
      setHabits(habitsToSet)
      setLogs(loadedLogs)
      setAchievements(loadedAchievements)
      setPomodoroStats(loadedStats)
    } catch (error) {
      console.error("Error al cargar datos:", error)
    } finally {
      setIsHydrated(true)
    }
  }, [])

  useEffect(() => { if (isHydrated) saveHabits(habits) }, [habits, isHydrated])
  useEffect(() => { if (isHydrated) saveLogs(logs) }, [logs, isHydrated])
  useEffect(() => { if (isHydrated) saveAchievements(achievements) }, [achievements, isHydrated])
  useEffect(() => { if (isHydrated) savePomodoroStats(pomodoroStats) }, [pomodoroStats, isHydrated])

  // Achievement checker — runs after habits/logs change
  useEffect(() => {
    if (!isHydrated || habits.length === 0) return
    const today = getToday()
    const currentAchievements = achievementsRef.current
    const toAdd: Achievement[] = []

    habits.forEach((habit) => {
      const newTypes = checkNewAchievements(habit, currentAchievements, logs)
      newTypes.forEach((type) => {
        const id = `${habit.id}-${type}`
        if (!currentAchievements.find((a) => a.id === id)) {
          toAdd.push({ id, habitId: habit.id, type, unlockedAt: today })
        }
      })
    })

    if (toAdd.length > 0) {
      setAchievements((prev) => {
        const existingIds = new Set(prev.map((a) => a.id))
        const unique = toAdd.filter((a) => !existingIds.has(a.id))
        return unique.length > 0 ? [...prev, ...unique] : prev
      })
    }
  }, [habits, logs, isHydrated])

  const toggleHabit = (id: string) => {
    const today = getToday()
    const habit = habits.find((h) => h.id === id)
    if (!habit) return

    const willBeCompleted = !habit.completedToday
    const newStreak = willBeCompleted ? habit.streak + 1 : Math.max(0, habit.streak - 1)
    const newCompleted = willBeCompleted ? habit.completed + 1 : Math.max(0, habit.completed - 1)
    const xpGain = willBeCompleted ? calculateXpGain(newStreak) : -10
    const newXp = Math.max(0, habit.xp + xpGain)
    const newTarget = willBeCompleted && habit.progressiveEnabled
      ? getProgressiveTarget({ ...habit, streak: newStreak })
      : habit.target

    const updatedHabit: Habit = {
      ...habit,
      completedToday: willBeCompleted,
      streak: newStreak,
      completed: newCompleted,
      xp: newXp,
      target: newTarget,
    }

    setHabits(habits.map((h) => (h.id === id ? updatedHabit : h)))

    const existingLog = logs.find((l) => l.habitId === id && l.date === today)
    if (existingLog) {
      setLogs(logs.map((l) => (l.habitId === id && l.date === today ? { ...l, completed: willBeCompleted } : l)))
    } else {
      setLogs([...logs, { habitId: id, date: today, completed: willBeCompleted, pomodoroSessions: 0 }])
    }
  }

  const addHabit = (newHabit: NewHabitInput) => {
    const habit: Habit = {
      ...newHabit,
      id: Date.now().toString(),
      streak: 0,
      completedToday: false,
      completed: 0,
      xp: 0,
      linkedPomodoroCount: 0,
    }
    setHabits([...habits, habit])
  }

  const editHabit = (id: string, updatedHabit: Partial<Habit>) => {
    setHabits(habits.map((h) => (h.id === id ? { ...h, ...updatedHabit } : h)))
  }

  const deleteHabit = (id: string) => {
    setHabits(
      habits
        .filter((h) => h.id !== id)
        .map((h) => (h.prerequisiteId === id ? { ...h, prerequisiteId: undefined } : h)),
    )
    setLogs(logs.filter((l) => l.habitId !== id))
    setAchievements(achievements.filter((a) => a.habitId !== id))
  }

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit)
    setShowEditDialog(true)
  }

  const handlePomodoroSessionComplete = (habitId: string | undefined, focusMinutes: number) => {
    const today = getToday()
    setPomodoroStats((prev) => [...prev, { date: today, habitId, focusMinutes }])

    if (habitId) {
      setHabits((prev) =>
        prev.map((h) => (h.id === habitId ? { ...h, linkedPomodoroCount: h.linkedPomodoroCount + 1 } : h)),
      )
      setLogs((prev) => {
        const existing = prev.find((l) => l.habitId === habitId && l.date === today)
        if (existing) {
          return prev.map((l) =>
            l.habitId === habitId && l.date === today ? { ...l, pomodoroSessions: l.pomodoroSessions + 1 } : l,
          )
        }
        return [...prev, { habitId, date: today, completed: false, pomodoroSessions: 1 }]
      })
    }
  }

  const completedToday = habits.filter((h) => h.completedToday).length
  const totalHabits = habits.length
  const completionRate = totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0
  const avgStreak = totalHabits > 0 ? Math.round(habits.reduce((acc, h) => acc + h.streak, 0) / totalHabits) : 0

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between animate-slide-up">
          <div className="flex-1 text-center space-y-2">
            <h1 className="text-2xl font-bold font-space-grotesk text-foreground">Megara - Habit tracker</h1>
            <p className="text-muted-foreground font-dm-sans">Construye hábitos consistentes con la técnica Pomodoro</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="shrink-0 mt-1"
            aria-label="Cambiar tema"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="habits">
          <TabsList className="w-full">
            <TabsTrigger value="habits" className="flex-1">Hábitos</TabsTrigger>
            <TabsTrigger value="stats" className="flex-1">Estadísticas</TabsTrigger>
            <TabsTrigger value="achievements" className="flex-1">Logros</TabsTrigger>
          </TabsList>

          {/* ── Tab: Hábitos ── */}
          <TabsContent value="habits" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

              {/* Left: stats + habit list */}
              <div className="lg:col-span-2 space-y-6">
                {/* Stats cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">
                  <Card className="animate-scale-in">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium font-dm-sans">Hábitos Completados Hoy</CardTitle>
                      <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold font-space-grotesk">
                        {completedToday}/{totalHabits}
                      </div>
                      <Progress value={completionRate} className="mt-2" />
                    </CardContent>
                  </Card>

                  <Card className="animate-scale-in" style={{ animationDelay: "0.1s" }}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium font-dm-sans">Racha Promedio</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold font-space-grotesk">{avgStreak} días</div>
                      <p className="text-xs text-muted-foreground mt-1 font-dm-sans">Mantén la consistencia</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Habit list */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold font-space-grotesk">Mis Hábitos</h2>
                    <Button onClick={() => setShowAddDialog(true)} className="animate-scale-in">
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Hábito
                    </Button>
                  </div>

                  <div className="grid gap-4">
                    {habits.map((habit, index) => {
                      const isLocked = habit.prerequisiteId
                        ? !habits.find((h) => h.id === habit.prerequisiteId)?.completedToday
                        : false
                      const prerequisiteName = habit.prerequisiteId
                        ? habits.find((h) => h.id === habit.prerequisiteId)?.name
                        : undefined
                      const scheduledToday = isHabitScheduledToday(habit)
                      const habitLogs = logs.filter((l) => l.habitId === habit.id)

                      let challengeProgress: { current: number; goal: number } | undefined
                      if (habit.challengeGoal && habit.challengeStartDate) {
                        const current = habitLogs.filter(
                          (l) => l.completed && l.date >= habit.challengeStartDate!,
                        ).length
                        challengeProgress = { current, goal: habit.challengeGoal }
                      }

                      return (
                        <HabitCard
                          key={habit.id}
                          habit={habit}
                          habitLogs={habitLogs}
                          isLocked={isLocked}
                          isScheduledToday={scheduledToday}
                          prerequisiteName={prerequisiteName}
                          challengeProgress={challengeProgress}
                          onToggle={() => toggleHabit(habit.id)}
                          onEdit={() => handleEditHabit(habit)}
                          onDelete={() => deleteHabit(habit.id)}
                          style={{ animationDelay: `${0.1 * index}s` }}
                        />
                      )
                    })}

                    {habits.length === 0 && (
                      <div className="text-center text-muted-foreground py-12 font-dm-sans">
                        No tienes hábitos aún. ¡Agrega uno para empezar!
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right sidebar: Pomodoro */}
              <div className="lg:sticky lg:top-6 space-y-4">
                <PomodoroTimer habits={habits} onSessionComplete={handlePomodoroSessionComplete} />
              </div>
            </div>
          </TabsContent>

          {/* ── Tab: Estadísticas ── */}
          <TabsContent value="stats" className="space-y-6 mt-6">
            <HeatMap logs={logs} habits={habits} />
            <TrendChart logs={logs} habits={habits} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FocusStats pomodoroStats={pomodoroStats} habits={habits} />
              <CorrelationsPanel logs={logs} habits={habits} />
            </div>
          </TabsContent>

          {/* ── Tab: Logros ── */}
          <TabsContent value="achievements" className="space-y-6 mt-6">
            <AchievementsPanel habits={habits} achievements={achievements} />
          </TabsContent>
        </Tabs>

        <AddHabitDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onAddHabit={addHabit}
          habits={habits}
        />
        <EditHabitDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          habit={editingHabit}
          onEditHabit={editHabit}
          habits={habits.filter((h) => h.id !== editingHabit?.id)}
        />

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-border">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground font-dm-sans">
              Desarrollado con ❤️ por{" "}
              <a
                href="https://github.com/DarkSevenX"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:text-accent/80 transition-colors duration-200 font-medium"
              >
                Nelson Argumedo
              </a>
            </p>
            <p className="text-xs text-muted-foreground/70 font-dm-sans">
              Megara - Tu compañero para construir hábitos consistentes
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
