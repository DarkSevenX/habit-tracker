"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import type { Habit, NewHabitInput } from "@/lib/types"
import { getToday } from "@/lib/habits-utils"

interface AddHabitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddHabit: (habit: NewHabitInput) => void
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

const DEFAULT_FORM = {
  name: "",
  description: "",
  color: "bg-accent",
  frequencyType: "daily" as FrequencyType,
  frequencyDays: [] as number[],
  frequencyCount: 3,
  prerequisiteId: "",
  progressiveEnabled: false,
  challengeEnabled: false,
  challengeGoal: 30,
}

export function AddHabitDialog({ open, onOpenChange, onAddHabit, habits }: AddHabitDialogProps) {
  const [form, setForm] = useState(DEFAULT_FORM)

  const target = calcTarget(form.frequencyType, form.frequencyDays, form.frequencyCount)

  const toggleDay = (day: number) => {
    setForm((prev) => ({
      ...prev,
      frequencyDays: prev.frequencyDays.includes(day)
        ? prev.frequencyDays.filter((d) => d !== day)
        : [...prev.frequencyDays, day].sort(),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return

    let frequency: NewHabitInput["frequency"]
    if (form.frequencyType === "specific_days") {
      frequency = { type: "specific_days", days: form.frequencyDays }
    } else if (form.frequencyType === "times_per_week") {
      frequency = { type: "times_per_week", count: form.frequencyCount }
    } else {
      frequency = { type: form.frequencyType }
    }

    onAddHabit({
      name: form.name.trim(),
      description: form.description.trim(),
      color: form.color,
      target,
      baseTarget: target,
      frequency,
      prerequisiteId: form.prerequisiteId || undefined,
      progressiveEnabled: form.progressiveEnabled,
      challengeGoal: form.challengeEnabled ? form.challengeGoal : undefined,
      challengeStartDate: form.challengeEnabled ? getToday() : undefined,
    })

    setForm(DEFAULT_FORM)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md animate-scale-in max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-space-grotesk">Agregar Nuevo Hábito</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="add-name" className="font-dm-sans">Nombre del hábito</Label>
            <Input
              id="add-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej: Ejercicio matutino"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="add-description" className="font-dm-sans">Descripción</Label>
            <Textarea
              id="add-description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe tu hábito..."
              rows={2}
            />
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label className="font-dm-sans">Color</Label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setForm({ ...form, color: color.value })}
                  className={`w-8 h-8 rounded-full ${color.value} border-2 transition-all ${
                    form.color === color.value ? "border-foreground scale-110" : "border-transparent"
                  }`}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div className="space-y-3 rounded-lg border border-border p-4">
            <Label className="font-dm-sans font-medium">Frecuencia</Label>
            <Select
              value={form.frequencyType}
              onValueChange={(v) =>
                setForm({ ...form, frequencyType: v as FrequencyType, frequencyDays: [], frequencyCount: 3 })
              }
            >
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

            {form.frequencyType === "specific_days" && (
              <div className="flex flex-wrap gap-3 pt-1">
                {DAY_OPTIONS.map((day) => (
                  <div key={day.value} className="flex items-center gap-1.5">
                    <Checkbox
                      id={`add-day-${day.value}`}
                      checked={form.frequencyDays.includes(day.value)}
                      onCheckedChange={() => toggleDay(day.value)}
                    />
                    <Label htmlFor={`add-day-${day.value}`} className="text-sm font-dm-sans cursor-pointer">
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
            )}

            {form.frequencyType === "times_per_week" && (
              <div className="flex items-center gap-3 pt-1">
                <Input
                  type="number"
                  min={1}
                  max={7}
                  value={form.frequencyCount}
                  onChange={(e) =>
                    setForm({ ...form, frequencyCount: Math.min(7, Math.max(1, parseInt(e.target.value) || 1)) })
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
          {habits.length > 0 && (
            <div className="space-y-2">
              <Label className="font-dm-sans">Hábito prerequisito (cadena)</Label>
              <Select
                value={form.prerequisiteId || "none"}
                onValueChange={(v) => setForm({ ...form, prerequisiteId: v === "none" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ninguno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguno</SelectItem>
                  {habits.map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${h.color}`} />
                        {h.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.prerequisiteId && (
                <p className="text-xs text-muted-foreground font-dm-sans">
                  Se desbloquea solo después de completar el anterior
                </p>
              )}
            </div>
          )}

          {/* Progressive difficulty */}
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium font-dm-sans">Dificultad progresiva</p>
              <p className="text-xs text-muted-foreground font-dm-sans">La meta sube 10% cada 30 días de racha</p>
            </div>
            <Switch
              checked={form.progressiveEnabled}
              onCheckedChange={(v) => setForm({ ...form, progressiveEnabled: v })}
            />
          </div>

          {/* Challenge mode */}
          <div className="space-y-3 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium font-dm-sans">Modo reto</p>
                <p className="text-xs text-muted-foreground font-dm-sans">Comprométete a completarlo X días</p>
              </div>
              <Switch
                checked={form.challengeEnabled}
                onCheckedChange={(v) => setForm({ ...form, challengeEnabled: v })}
              />
            </div>
            {form.challengeEnabled && (
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={form.challengeGoal}
                  onChange={(e) => setForm({ ...form, challengeGoal: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-24"
                />
                <span className="text-sm font-dm-sans text-muted-foreground">días de reto</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Agregar Hábito
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
