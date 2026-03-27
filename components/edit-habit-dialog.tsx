"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import type { Habit } from "@/lib/types"
import { getToday } from "@/lib/habits-utils"

interface EditHabitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  habit: Habit | null
  onEditHabit: (id: string, updatedHabit: Partial<Habit>) => void
  habits: Habit[]
}

const COLOR_OPTIONS = [
  { name: "Púrpura", value: "bg-accent" },
  { name: "Verde", value: "bg-chart-2" },
  { name: "Azul", value: "bg-chart-5" },
  { name: "Rojo", value: "bg-chart-3" },
  { name: "Naranja", value: "bg-chart-1" },
]

const DAY_OPTIONS = [
  { label: "Dom", value: 0 },
  { label: "Lun", value: 1 },
  { label: "Mar", value: 2 },
  { label: "Mié", value: 3 },
  { label: "Jue", value: 4 },
  { label: "Vie", value: 5 },
  { label: "Sáb", value: 6 },
]

type FrequencyType = "daily" | "weekdays" | "specific_days" | "times_per_week"

function calcTarget(type: FrequencyType, days: number[], count: number): number {
  switch (type) {
    case "daily": return 30
    case "weekdays": return 22
    case "specific_days": return Math.max(1, days.length) * 4
    case "times_per_week": return count * 4
  }
}

export function EditHabitDialog({ open, onOpenChange, habit, onEditHabit, habits }: EditHabitDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [color, setColor] = useState("bg-accent")
  const [frequencyType, setFrequencyType] = useState<FrequencyType>("daily")
  const [frequencyDays, setFrequencyDays] = useState<number[]>([])
  const [frequencyCount, setFrequencyCount] = useState(3)
  const [prerequisiteId, setPrerequisiteId] = useState("")
  const [progressiveEnabled, setProgressiveEnabled] = useState(false)
  const [challengeEnabled, setChallengeEnabled] = useState(false)
  const [challengeGoal, setChallengeGoal] = useState(30)

  useEffect(() => {
    if (!habit) return
    setName(habit.name)
    setDescription(habit.description)
    setColor(habit.color)
    setFrequencyType(habit.frequency.type as FrequencyType)
    setFrequencyDays(habit.frequency.type === "specific_days" ? habit.frequency.days : [])
    setFrequencyCount(habit.frequency.type === "times_per_week" ? habit.frequency.count : 3)
    setPrerequisiteId(habit.prerequisiteId || "")
    setProgressiveEnabled(habit.progressiveEnabled)
    setChallengeEnabled(!!habit.challengeGoal)
    setChallengeGoal(habit.challengeGoal || 30)
  }, [habit])

  if (!habit) return null

  const target = calcTarget(frequencyType, frequencyDays, frequencyCount)

  const toggleDay = (day: number) => {
    setFrequencyDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
    )
  }

  const handleFrequencyTypeChange = (type: FrequencyType) => {
    setFrequencyType(type)
    setFrequencyDays([])
    setFrequencyCount(3)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    let frequency: Habit["frequency"]
    if (frequencyType === "specific_days") {
      frequency = { type: "specific_days", days: frequencyDays }
    } else if (frequencyType === "times_per_week") {
      frequency = { type: "times_per_week", count: frequencyCount }
    } else {
      frequency = { type: frequencyType }
    }

    onEditHabit(habit.id, {
      name: name.trim(),
      description: description.trim(),
      color,
      target,
      baseTarget: target,
      frequency,
      prerequisiteId: prerequisiteId || undefined,
      progressiveEnabled,
      challengeGoal: challengeEnabled ? challengeGoal : undefined,
      challengeStartDate:
        challengeEnabled && !habit.challengeStartDate ? getToday() : habit.challengeStartDate,
    })

    onOpenChange(false)
  }

  const otherHabits = habits.filter((h) => h.id !== habit.id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-space-grotesk">Editar Hábito</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="edit-name" className="font-dm-sans">Nombre del hábito</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Ejercicio matutino"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-description" className="font-dm-sans">Descripción</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe tu hábito..."
              rows={2}
            />
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label className="font-dm-sans">Color</Label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-8 h-8 rounded-full ${c.value} border-2 transition-all ${
                    color === c.value ? "border-foreground scale-110" : "border-transparent"
                  }`}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div className="space-y-3 rounded-lg border border-border p-4">
            <Label className="font-dm-sans font-medium">Frecuencia</Label>
            <Select value={frequencyType} onValueChange={(v) => handleFrequencyTypeChange(v as FrequencyType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diario</SelectItem>
                <SelectItem value="weekdays">Días laborables (Lun–Vie)</SelectItem>
                <SelectItem value="specific_days">Días específicos</SelectItem>
                <SelectItem value="times_per_week">N veces por semana</SelectItem>
              </SelectContent>
            </Select>

            {frequencyType === "specific_days" && (
              <div className="flex flex-wrap gap-3 pt-1">
                {DAY_OPTIONS.map((day) => (
                  <div key={day.value} className="flex items-center gap-1.5">
                    <Checkbox
                      id={`edit-day-${day.value}`}
                      checked={frequencyDays.includes(day.value)}
                      onCheckedChange={() => toggleDay(day.value)}
                    />
                    <Label htmlFor={`edit-day-${day.value}`} className="text-sm font-dm-sans cursor-pointer">
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
            )}

            {frequencyType === "times_per_week" && (
              <div className="flex items-center gap-3 pt-1">
                <Input
                  type="number"
                  min={1}
                  max={7}
                  value={frequencyCount}
                  onChange={(e) =>
                    setFrequencyCount(Math.min(7, Math.max(1, parseInt(e.target.value) || 1)))
                  }
                  className="w-20"
                />
                <span className="text-sm font-dm-sans text-muted-foreground">veces por semana</span>
              </div>
            )}

            <p className="text-xs text-muted-foreground font-dm-sans">
              Meta mensual calculada: <span className="font-semibold text-foreground">{target} completaciones</span>
            </p>
          </div>

          {/* Prerequisite */}
          {otherHabits.length > 0 && (
            <div className="space-y-2">
              <Label className="font-dm-sans">Hábito prerequisito (cadena)</Label>
              <Select
                value={prerequisiteId || "none"}
                onValueChange={(v) => setPrerequisiteId(v === "none" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ninguno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguno</SelectItem>
                  {otherHabits.map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${h.color}`} />
                        {h.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Progressive difficulty */}
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium font-dm-sans">Dificultad progresiva</p>
              <p className="text-xs text-muted-foreground font-dm-sans">La meta sube 10% cada 30 días de racha</p>
            </div>
            <Switch checked={progressiveEnabled} onCheckedChange={setProgressiveEnabled} />
          </div>

          {/* Challenge mode */}
          <div className="space-y-3 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium font-dm-sans">Modo reto</p>
                <p className="text-xs text-muted-foreground font-dm-sans">Comprométete a completarlo X días</p>
              </div>
              <Switch checked={challengeEnabled} onCheckedChange={setChallengeEnabled} />
            </div>
            {challengeEnabled && (
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={challengeGoal}
                  onChange={(e) => setChallengeGoal(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24"
                />
                <span className="text-sm font-dm-sans text-muted-foreground">días de reto</span>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Guardar Cambios</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
