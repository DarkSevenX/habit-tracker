"use client"

import type React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Check, Flame, Edit2, Trash2, MoreVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

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

interface HabitCardProps {
  habit: Habit
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  style?: React.CSSProperties
}

export function HabitCard({ habit, onToggle, onEdit, onDelete, style }: HabitCardProps) {
  const progressPercentage = (habit.completed / habit.target) * 100

  return (
    <Card
      className={cn(
        "animate-slide-up transition-all duration-300 hover:shadow-lg",
        habit.completedToday && "ring-2 ring-accent/20",
      )}
      style={style}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <div className={cn("w-3 h-3 rounded-full", habit.color)} />
              <h3 className="font-semibold font-space-grotesk text-lg">{habit.name}</h3>
              {habit.streak > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Flame className="h-3 w-3" />
                  {habit.streak}
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground font-dm-sans">{habit.description}</p>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-dm-sans">Progreso del mes</span>
                <span className="font-dm-sans">
                  {habit.completed}/{habit.target}
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
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

            <Button
              variant={habit.completedToday ? "default" : "outline"}
              size="lg"
              onClick={onToggle}
              className={cn("transition-all duration-300", habit.completedToday && "animate-pulse-gentle")}
            >
              <Check className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
