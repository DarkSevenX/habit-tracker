"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { PomodoroTimer } from "@/components/pomodoro-timer"
import { HabitCard } from "@/components/habit-card"
import { AddHabitDialog } from "@/components/add-habit-dialog"
import { EditHabitDialog } from "@/components/edit-habit-dialog"
import { Plus, Target, TrendingUp } from "lucide-react"

interface Habit {
  id: string
  name: string
  description: string
  streak: number
  completedToday: boolean
  color: string
  target: number
  completed: number
}

const HABITS_STORAGE_KEY = "habitflow.habits.v1"

export default function HabitTracker() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)

  useEffect(() => {
    try {
      const storedHabits = localStorage.getItem(HABITS_STORAGE_KEY)
      if (storedHabits) {
        const parsedHabits: Habit[] = JSON.parse(storedHabits)
        if (Array.isArray(parsedHabits)) {
          setHabits(parsedHabits)
        }
      }
    } catch (error) {
      console.error("No se pudieron leer los habitos guardados:", error)
    } finally {
      setIsHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!isHydrated) return

    try {
      localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(habits))
    } catch (error) {
      console.error("No se pudieron guardar los habitos:", error)
    }
  }, [habits, isHydrated])

  const toggleHabit = (id: string) => {
    setHabits(
      habits.map((habit) =>
        habit.id === id
          ? {
              ...habit,
              completedToday: !habit.completedToday,
              streak: !habit.completedToday ? habit.streak + 1 : Math.max(0, habit.streak - 1),
              completed: !habit.completedToday ? habit.completed + 1 : Math.max(0, habit.completed - 1),
            }
          : habit,
      ),
    )
  }

  const addHabit = (newHabit: Omit<Habit, "id" | "streak" | "completedToday" | "completed">) => {
    const habit: Habit = {
      ...newHabit,
      id: Date.now().toString(),
      streak: 0,
      completedToday: false,
      completed: 0,
    }
    setHabits([...habits, habit])
  }

  const editHabit = (id: string, updatedHabit: Partial<Habit>) => {
    setHabits(habits.map((habit) => (habit.id === id ? { ...habit, ...updatedHabit } : habit)))
  }

  const deleteHabit = (id: string) => {
    setHabits(habits.filter((habit) => habit.id !== id))
  }

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit)
    setShowEditDialog(true)
  }

  const completedToday = habits.filter((h) => h.completedToday).length
  const totalHabits = habits.length
  const completionRate = totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 animate-slide-up">
          <h1 className="text-4xl font-bold font-space-grotesk text-foreground">HabitFlow</h1>
          <p className="text-muted-foreground font-dm-sans">Construye hábitos consistentes con la técnica Pomodoro</p>
        </div>

        {/* Layout principal: contenido izquierda + sidebar derecha */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* Columna izquierda: stats + hábitos */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats */}
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
                  <div className="text-2xl font-bold font-space-grotesk">
                    {totalHabits > 0 ? Math.round(habits.reduce((acc, h) => acc + h.streak, 0) / totalHabits) : 0} días
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 font-dm-sans">Mantén la consistencia</p>
                </CardContent>
              </Card>
            </div>

            {/* Hábitos */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold font-space-grotesk">Mis Hábitos</h2>
                <Button onClick={() => setShowAddDialog(true)} className="animate-scale-in">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Hábito
                </Button>
              </div>

              <div className="grid gap-4">
                {habits.map((habit, index) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    onToggle={() => toggleHabit(habit.id)}
                    onEdit={() => handleEditHabit(habit)}
                    onDelete={() => deleteHabit(habit.id)}
                    style={{ animationDelay: `${0.1 * index}s` }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar derecha: Pomodoro */}
          <div className="lg:sticky lg:top-6 space-y-4">
            {/* <h2 className="text-2xl font-bold font-space-grotesk">Contador Pomodoro</h2> */}
            <PomodoroTimer />
          </div>

        </div>

        <AddHabitDialog open={showAddDialog} onOpenChange={setShowAddDialog} onAddHabit={addHabit} />
        <EditHabitDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          habit={editingHabit}
          onEditHabit={editHabit}
        />

        {/* Footer with developer credits */}
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
              HabitFlow - Tu compañero para construir hábitos consistentes
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
