"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Habit {
  name: string
  description: string
  color: string
  target: number
}

interface AddHabitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddHabit: (habit: Habit) => void
}

const colorOptions = [
  { name: "Púrpura", value: "bg-accent", class: "bg-accent" },
  { name: "Verde", value: "bg-chart-2", class: "bg-chart-2" },
  { name: "Azul", value: "bg-chart-5", class: "bg-chart-5" },
  { name: "Rojo", value: "bg-chart-3", class: "bg-chart-3" },
  { name: "Gris", value: "bg-chart-4", class: "bg-chart-4" },
]

export function AddHabitDialog({ open, onOpenChange, onAddHabit }: AddHabitDialogProps) {
  const [formData, setFormData] = useState<Habit>({
    name: "",
    description: "",
    color: "bg-accent",
    target: 30,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name.trim()) {
      onAddHabit(formData)
      setFormData({
        name: "",
        description: "",
        color: "bg-accent",
        target: 30,
      })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md animate-scale-in">
        <DialogHeader>
          <DialogTitle className="font-space-grotesk">Agregar Nuevo Hábito</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="font-dm-sans">
              Nombre del hábito
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe tu hábito..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label className="font-dm-sans">Color</Label>
            <div className="flex gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`w-8 h-8 rounded-full ${color.class} border-2 transition-all ${
                    formData.color === color.value ? "border-foreground scale-110" : "border-transparent"
                  }`}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target" className="font-dm-sans">
              Meta mensual
            </Label>
            <Input
              id="target"
              type="number"
              value={formData.target}
              onChange={(e) => setFormData({ ...formData, target: Number.parseInt(e.target.value) || 30 })}
              min="1"
              max="31"
            />
          </div>

          <div className="flex gap-3 pt-4">
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
