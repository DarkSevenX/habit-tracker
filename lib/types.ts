export type HabitFrequency =
  | { type: "daily" }
  | { type: "weekdays" }
  | { type: "specific_days"; days: number[] }
  | { type: "times_per_week"; count: number }

export interface Habit {
  id: string
  name: string
  description: string
  streak: number
  completedToday: boolean
  color: string
  target: number
  completed: number
  frequency: HabitFrequency
  prerequisiteId?: string
  baseTarget: number
  progressiveEnabled: boolean
  xp: number
  linkedPomodoroCount: number
  challengeGoal?: number
  challengeStartDate?: string
}

export interface HabitLog {
  habitId: string
  date: string
  completed: boolean
  pomodoroSessions: number
}

export type AchievementType =
  | "streak_7"
  | "streak_30"
  | "streak_100"
  | "total_30"
  | "total_100"
  | "level_maestro"
  | "challenge_complete"

export interface Achievement {
  id: string
  habitId: string
  type: AchievementType
  unlockedAt: string
}

export interface PomodoroStat {
  date: string
  habitId?: string
  focusMinutes: number
}

export interface LevelInfo {
  level: number
  name: string
  minXp: number
  maxXp: number
}

export type NewHabitInput = Omit<Habit, "id" | "streak" | "completedToday" | "completed" | "xp" | "linkedPomodoroCount">
