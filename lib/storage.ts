import type { Habit, HabitLog, Achievement, PomodoroStat } from "./types"

export const STORAGE_KEYS = {
  HABITS_V2: "habitflow.habits.v2",
  HABITS_V1: "habitflow.habits.v1",
  LOGS: "habitflow.logs.v1",
  ACHIEVEMENTS: "habitflow.achievements.v1",
  POMODORO_CONFIG: "habitflow.pomodoro.config.v2",
  POMODORO_STATS: "habitflow.pomodoro.stats.v1",
  LAST_ACTIVE_DATE: "habitflow.lastActiveDate",
} as const

function migrateV1toV2(v1Habits: Record<string, unknown>[]): Habit[] {
  return v1Habits.map((h) => ({
    id: String(h.id ?? Date.now()),
    name: String(h.name ?? ""),
    description: String(h.description ?? ""),
    streak: Number(h.streak ?? 0),
    completedToday: Boolean(h.completedToday ?? false),
    color: String(h.color ?? "bg-accent"),
    target: Number(h.target ?? 30),
    completed: Number(h.completed ?? 0),
    frequency: { type: "daily" as const },
    baseTarget: Number(h.target ?? 30),
    progressiveEnabled: false,
    xp: Math.max(0, Number(h.streak ?? 0) * 10),
    linkedPomodoroCount: 0,
  }))
}

export function loadHabits(): Habit[] {
  try {
    const v2 = localStorage.getItem(STORAGE_KEYS.HABITS_V2)
    if (v2) {
      const parsed = JSON.parse(v2)
      if (Array.isArray(parsed)) return parsed as Habit[]
    }
    const v1 = localStorage.getItem(STORAGE_KEYS.HABITS_V1)
    if (v1) {
      const parsed = JSON.parse(v1)
      if (Array.isArray(parsed)) {
        const migrated = migrateV1toV2(parsed)
        saveHabits(migrated)
        return migrated
      }
    }
  } catch (e) {
    console.error("Error cargando hábitos:", e)
  }
  return []
}

export function saveHabits(habits: Habit[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HABITS_V2, JSON.stringify(habits))
  } catch (e) {
    console.error("Error guardando hábitos:", e)
  }
}

export function loadLogs(): HabitLog[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LOGS)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) return parsed as HabitLog[]
    }
  } catch (e) {
    console.error("Error cargando logs:", e)
  }
  return []
}

export function saveLogs(logs: HabitLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs))
  } catch (e) {
    console.error("Error guardando logs:", e)
  }
}

export function loadAchievements(): Achievement[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) return parsed as Achievement[]
    }
  } catch (e) {
    console.error("Error cargando logros:", e)
  }
  return []
}

export function saveAchievements(achievements: Achievement[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements))
  } catch (e) {
    console.error("Error guardando logros:", e)
  }
}

export function loadPomodoroStats(): PomodoroStat[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.POMODORO_STATS)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) return parsed as PomodoroStat[]
    }
  } catch (e) {
    console.error("Error cargando estadísticas Pomodoro:", e)
  }
  return []
}

export function savePomodoroStats(stats: PomodoroStat[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.POMODORO_STATS, JSON.stringify(stats))
  } catch (e) {
    console.error("Error guardando estadísticas Pomodoro:", e)
  }
}
