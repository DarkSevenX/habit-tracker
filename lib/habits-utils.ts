import type { Habit, HabitLog, Achievement, AchievementType, LevelInfo } from "./types"

export const LEVELS: LevelInfo[] = [
  { level: 1, name: "Principiante", minXp: 0, maxXp: 99 },
  { level: 2, name: "Aprendiz", minXp: 100, maxXp: 299 },
  { level: 3, name: "Practicante", minXp: 300, maxXp: 599 },
  { level: 4, name: "Experto", minXp: 600, maxXp: 999 },
  { level: 5, name: "Maestro", minXp: 1000, maxXp: Number.MAX_SAFE_INTEGER },
]

export function calculateLevel(xp: number): LevelInfo {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) return LEVELS[i]
  }
  return LEVELS[0]
}

export function calculateXpProgress(xp: number): number {
  const level = calculateLevel(xp)
  if (level.level === LEVELS.length) return 100
  const range = level.maxXp - level.minXp + 1
  const progress = xp - level.minXp
  return Math.min(100, Math.round((progress / range) * 100))
}

export function calculateXpGain(streak: number): number {
  return 10 + Math.min(streak * 2, 50)
}

export function getProgressiveTarget(habit: Habit): number {
  if (!habit.progressiveEnabled) return habit.target
  const milestones = Math.floor(habit.streak / 30)
  return Math.ceil(habit.baseTarget * Math.pow(1.1, milestones))
}

export function isHabitScheduledToday(habit: Habit): boolean {
  const today = new Date().getDay()
  const freq = habit.frequency
  switch (freq.type) {
    case "daily":
      return true
    case "weekdays":
      return today >= 1 && today <= 5
    case "specific_days":
      return freq.days.includes(today)
    case "times_per_week":
      return true
    default:
      return true
  }
}

export function getFrequencyLabel(habit: Habit): string {
  const freq = habit.frequency
  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
  switch (freq.type) {
    case "daily":
      return "Diario"
    case "weekdays":
      return "Lun–Vie"
    case "specific_days":
      if (freq.days.length === 0) return "Sin días"
      return freq.days.map((d) => dayNames[d]).join(", ")
    case "times_per_week":
      return `${freq.count}x / sem`
    default:
      return "Diario"
  }
}

export interface HabitCorrelation {
  habitA: Habit
  habitB: Habit
  percentage: number
}

export function calculateCorrelations(habits: Habit[], logs: HabitLog[]): HabitCorrelation[] {
  if (habits.length < 2 || logs.length === 0) return []
  const correlations: HabitCorrelation[] = []

  for (let i = 0; i < habits.length; i++) {
    for (let j = i + 1; j < habits.length; j++) {
      const habitA = habits[i]
      const habitB = habits[j]
      const daysA = new Set(logs.filter((l) => l.habitId === habitA.id && l.completed).map((l) => l.date))
      const daysB = new Set(logs.filter((l) => l.habitId === habitB.id && l.completed).map((l) => l.date))

      if (daysA.size < 7) continue

      let bothCompleted = 0
      daysA.forEach((date) => {
        if (daysB.has(date)) bothCompleted++
      })

      const percentage = Math.round((bothCompleted / daysA.size) * 100)
      if (percentage >= 60) {
        correlations.push({ habitA, habitB, percentage })
      }
    }
  }

  return correlations.sort((a, b) => b.percentage - a.percentage)
}

export const ACHIEVEMENT_DEFINITIONS: Record<AchievementType, { label: string; description: string; icon: string }> = {
  streak_7: { label: "Primera Racha", description: "Racha de 7 días consecutivos", icon: "🔥" },
  streak_30: { label: "Mes Imparable", description: "Racha de 30 días consecutivos", icon: "⚡" },
  streak_100: { label: "Centurión", description: "Racha de 100 días consecutivos", icon: "💎" },
  total_30: { label: "30 Completados", description: "30 completaciones en total", icon: "🌱" },
  total_100: { label: "Centenario", description: "100 completaciones en total", icon: "🏆" },
  level_maestro: { label: "Maestro", description: "Alcanzaste el nivel Maestro", icon: "👑" },
  challenge_complete: { label: "Reto Completado", description: "Completaste un modo reto", icon: "🎯" },
}

export function checkNewAchievements(
  habit: Habit,
  existingAchievements: Achievement[],
  logs?: HabitLog[],
): AchievementType[] {
  const alreadyUnlocked = new Set(
    existingAchievements.filter((a) => a.habitId === habit.id).map((a) => a.type),
  )
  const newTypes: AchievementType[] = []
  const level = calculateLevel(habit.xp)

  const checks: { type: AchievementType; condition: boolean }[] = [
    { type: "streak_7", condition: habit.streak >= 7 },
    { type: "streak_30", condition: habit.streak >= 30 },
    { type: "streak_100", condition: habit.streak >= 100 },
    { type: "total_30", condition: habit.completed >= 30 },
    { type: "total_100", condition: habit.completed >= 100 },
    { type: "level_maestro", condition: level.level >= 5 },
  ]

  if (logs && habit.challengeGoal && habit.challengeStartDate) {
    const completedDays = logs.filter(
      (l) => l.habitId === habit.id && l.completed && l.date >= habit.challengeStartDate!,
    ).length
    checks.push({ type: "challenge_complete", condition: completedDays >= habit.challengeGoal })
  }

  checks.forEach(({ type, condition }) => {
    if (condition && !alreadyUnlocked.has(type)) {
      newTypes.push(type)
    }
  })

  return newTypes
}

export function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function getToday(): string {
  return formatDate(new Date())
}

export function getStartOfWeek(): Date {
  const today = new Date()
  const day = today.getDay()
  const start = new Date(today)
  start.setDate(today.getDate() - day)
  start.setHours(0, 0, 0, 0)
  return start
}
