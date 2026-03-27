"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Pause, RotateCcw, Settings, SkipForward, Link } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Habit } from "@/lib/types"

type TimerState = "idle" | "running" | "paused"
type SessionType = "work" | "break"

type PomodoroConfig = {
  work: number
  rest: number
}

const DEFAULT_CONFIG: PomodoroConfig = { work: 25, rest: 5 }
const POMODORO_CONFIG_STORAGE_KEY = "habitflow.pomodoro.config.v2"

interface PomodoroTimerProps {
  habits: Habit[]
  onSessionComplete: (habitId: string | undefined, focusMinutes: number) => void
}

export function PomodoroTimer({ habits = [], onSessionComplete }: PomodoroTimerProps) {
  const [config, setConfig] = useState<PomodoroConfig>(DEFAULT_CONFIG)
  const [draftConfig, setDraftConfig] = useState<PomodoroConfig>(DEFAULT_CONFIG)
  const [timeLeft, setTimeLeft] = useState(DEFAULT_CONFIG.work * 60)
  const [timerState, setTimerState] = useState<TimerState>("idle")
  const [sessionType, setSessionType] = useState<SessionType>("work")
  const [completedSessions, setCompletedSessions] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [selectedHabitId, setSelectedHabitId] = useState<string>("none")

  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const sessionDurations: Record<SessionType, number> = {
    work: config.work * 60,
    break: config.rest * 60,
  }

  useEffect(() => {
    try {
      const storedConfig = localStorage.getItem(POMODORO_CONFIG_STORAGE_KEY)
      if (storedConfig) {
        const parsed = JSON.parse(storedConfig) as Partial<PomodoroConfig>
        const sanitized: PomodoroConfig = {
          work: Number.isFinite(parsed.work) ? Math.min(Math.max(Number(parsed.work), 1), 180) : 25,
          rest: Number.isFinite(parsed.rest) ? Math.min(Math.max(Number(parsed.rest), 1), 60) : 5,
        }
        setConfig(sanitized)
        setDraftConfig(sanitized)
        setTimeLeft(sanitized.work * 60)
      }
    } catch (error) {
      console.error("No se pudo leer la configuracion de Pomodoro:", error)
    } finally {
      setIsHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!isHydrated) return
    try {
      localStorage.setItem(POMODORO_CONFIG_STORAGE_KEY, JSON.stringify(config))
    } catch (error) {
      console.error("No se pudo guardar la configuracion de Pomodoro:", error)
    }
  }, [config, isHydrated])

  useEffect(() => {
    if (timerState === "running" && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [timerState, timeLeft])

  useEffect(() => {
    if (timeLeft === 0 && timerState === "running") {
      handleSessionComplete()
    }
  }, [timeLeft, timerState])

  const handleSessionComplete = () => {
    setTimerState("idle")
    if (sessionType === "work") {
      setCompletedSessions((prev) => prev + 1)
      onSessionComplete(selectedHabitId === "none" ? undefined : selectedHabitId, config.work)
      setSessionType("break")
      setTimeLeft(sessionDurations.break)
    } else {
      setSessionType("work")
      setTimeLeft(sessionDurations.work)
    }
  }

  const skipToBreak = () => {
    setTimerState("idle")
    setCompletedSessions((prev) => prev + 1)
    onSessionComplete(selectedHabitId === "none" ? undefined : selectedHabitId, config.work)
    setSessionType("break")
    setTimeLeft(sessionDurations.break)
  }

  const toggleTimer = () => {
    setTimerState((prev) => (prev === "running" ? "paused" : "running"))
  }

  const resetTimer = () => {
    setTimerState("idle")
    setTimeLeft(sessionDurations[sessionType])
  }

  const updateDraftValue = (key: keyof PomodoroConfig, value: string, min: number, max: number) => {
    const parsed = Number.parseInt(value, 10)
    const safeValue = Number.isFinite(parsed) ? Math.min(Math.max(parsed, min), max) : min
    setDraftConfig((prev) => ({ ...prev, [key]: safeValue }))
  }

  const saveSettings = () => {
    setConfig(draftConfig)
    setTimerState("idle")
    setTimeLeft((sessionType === "work" ? draftConfig.work : draftConfig.rest) * 60)
    setShowSettings(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const progress = ((sessionDurations[sessionType] - timeLeft) / sessionDurations[sessionType]) * 100
  const linkedHabit = habits.find((h) => h.id === selectedHabitId)

  return (
    <Card className="animate-scale-in">
      <CardContent className="p-6 space-y-6">
        {/* Session Type */}
        <div className="text-center">
          <h3 className="text-lg font-semibold font-space-grotesk mb-2">
            {sessionType === "work" ? "Trabajo" : "Descanso"}
          </h3>
          <div className="flex justify-center gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={cn("w-2 h-2 rounded-full", i < completedSessions % 4 ? "bg-accent" : "bg-muted")}
              />
            ))}
          </div>
        </div>

        {/* Timer */}
        <div className="text-center space-y-4">
          <div
            className={cn(
              "text-6xl font-bold font-space-grotesk transition-all duration-300",
              timerState === "running" && "animate-pulse-gentle",
              sessionType === "work" ? "text-accent" : "text-chart-2",
            )}
          >
            {formatTime(timeLeft)}
          </div>
          <Progress
            value={progress}
            className={cn("h-2 transition-all duration-300", sessionType === "work" ? "[&>div]:bg-accent" : "[&>div]:bg-chart-2")}
          />
        </div>

        {/* Habit linker (only in work sessions) */}
        {sessionType === "work" && habits.length > 0 && (
          <div className="space-y-1.5">
            <Label className="text-xs font-dm-sans flex items-center gap-1.5 text-muted-foreground">
              <Link className="h-3 w-3" />
              Vincular sesión a hábito
            </Label>
            <Select value={selectedHabitId} onValueChange={setSelectedHabitId}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Sin vincular" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin vincular</SelectItem>
                {habits.map((h) => (
                  <SelectItem key={h.id} value={h.id}>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", h.color)} />
                      {h.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {linkedHabit && (
              <p className="text-xs text-muted-foreground font-dm-sans">
                Esta sesión contará para <span className="text-accent font-medium">{linkedHabit.name}</span>
              </p>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center gap-3 flex-wrap">
          <Button variant="outline" size="lg" onClick={resetTimer} className="bg-transparent" title="Reiniciar">
            <RotateCcw className="h-5 w-5" />
          </Button>

          <Button
            size="lg"
            onClick={toggleTimer}
            className={cn("px-8 transition-all duration-300", timerState === "running" && "animate-pulse-gentle")}
          >
            {timerState === "running" ? <Pause className="h-5 w-5 mr-2" /> : <Play className="h-5 w-5 mr-2" />}
            {timerState === "running" ? "Pausar" : "Iniciar"}
          </Button>

          {sessionType === "work" && (
            <Button variant="outline" size="lg" onClick={skipToBreak} className="bg-transparent" title="Pasar al descanso">
              <SkipForward className="h-5 w-5" />
            </Button>
          )}

          {sessionType === "break" && (
            <Button
              variant="outline"
              size="lg"
              onClick={() => { setTimerState("idle"); setSessionType("work"); setTimeLeft(sessionDurations.work) }}
              className="bg-transparent"
              title="Volver al trabajo"
            >
              <SkipForward className="h-5 w-5" />
            </Button>
          )}

          <Button
            variant="outline"
            size="lg"
            onClick={() => { setDraftConfig(config); setShowSettings((prev) => !prev) }}
            className={cn("bg-transparent", showSettings && "ring-2 ring-accent/40")}
            title="Configuración"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="rounded-lg border border-border p-4 space-y-4">
            <h4 className="font-space-grotesk font-semibold text-sm">Configurar tiempos (minutos)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="work-duration" className="text-sm">Trabajo</Label>
                <Input
                  id="work-duration"
                  type="number"
                  min={1}
                  max={180}
                  value={draftConfig.work}
                  onChange={(e) => updateDraftValue("work", e.target.value, 1, 180)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="break-duration" className="text-sm">Descanso</Label>
                <Input
                  id="break-duration"
                  type="number"
                  min={1}
                  max={60}
                  value={draftConfig.rest}
                  onChange={(e) => updateDraftValue("rest", e.target.value, 1, 60)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowSettings(false)}>Cancelar</Button>
              <Button size="sm" onClick={saveSettings}>Guardar</Button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="text-center text-sm text-muted-foreground font-dm-sans">
          Sesiones completadas hoy: <span className="font-semibold text-foreground">{completedSessions}</span>
        </div>
      </CardContent>
    </Card>
  )
}
