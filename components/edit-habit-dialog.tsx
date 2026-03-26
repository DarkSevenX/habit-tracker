"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

interface EditHabitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  habit: Habit | null
  onEditHabit: (id: string, updatedHabit: Partial<Habit>) => void
}

const colorOptions = [
  { value: "bg-chart-1", label: "Naranja", color: "bg-chart-1" },
  { value: "bg-chart-2", label: "Verde", color: "bg-chart-2" },
  { value: "bg-accent", label: "Púrpura", color: "bg-accent" },
  { value: "bg-chart-3", label: "Azul", color: "bg-chart-3" },
  { value: "bg-chart-4", label: "Rosa", color: "bg-chart-4" },
]

export function EditHabitDialog({ open, onOpenChange, habit, onEditHabit }: EditHabitDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [target, setTarget] = useState(30)
  const [color, setColor] = useState("bg-accent")

  useEffect(() => {
    if (habit) {
      setName(habit.name)
      setDescription(habit.description)
      setTarget(habit.target)
      setColor(habit.color)
    }
  }, [habit])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!habit) return

    onEditHabit(habit.id, {
      name,
      description,
      target,
      color,
    })

    onOpenChange(false)
  }

  if (!habit) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-space-grotesk">Editar Hábito</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="font-dm-sans">
              Nombre del hábito
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Ejercicio matutino"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="font-dm-sans">
              Descripción
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe tu hábito..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target" className="font-dm-sans">
              Meta mensual
            </Label>
            <Input
              id="target"
              type="number"
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              min={1}
              max={31}
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="font-dm-sans">Color</Label>
            <Select value={color} onValueChange={setColor}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {colorOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${option.color}`} />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
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
