/**
 * Расчёт статистики привычек: % за неделю, streak, количество активных привычек.
 * Используется на странице /habits (из Supabase или localStorage).
 */

export type LogsMap = Record<string, boolean>

function normalizeDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

/** Даты понедельник–воскресенье для недели (offset: 0 = текущая, -1 = прошлая) */
export function getCurrentWeekDates(weekOffset = 0): string[] {
  const today = new Date()
  const start = new Date(today)
  start.setHours(0, 0, 0, 0)
  const day = start.getDay()
  const mondayOffset = (day + 6) % 7
  start.setDate(start.getDate() - mondayOffset + weekOffset * 7)
  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    dates.push(normalizeDate(d))
  }
  return dates
}

/** % выполнений за неделю: (completed true / всего слотов) * 100 */
export function weekCompletionPct(habitIds: string[], logs: LogsMap, weekDates: string[]): number {
  if (habitIds.length === 0) return 0
  const total = habitIds.length * weekDates.length
  let completed = 0
  for (const id of habitIds) {
    for (const date of weekDates) {
      if (logs[`${id}_${date}`]) completed++
    }
  }
  return total ? Math.round((completed / total) * 100) : 0
}

/** Дней подряд без пропусков: от вчера назад, день считается если все привычки отмечены */
export function streakDays(habitIds: string[], logs: LogsMap): number {
  if (habitIds.length === 0) return 0
  const today = normalizeDate(new Date())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  let checkDate = normalizeDate(yesterday)
  let count = 0
  while (true) {
    let allDone = true
    for (const id of habitIds) {
      if (!logs[`${id}_${checkDate}`]) {
        allDone = false
        break
      }
    }
    if (!allDone) break
    count++
    const d = new Date(checkDate)
    d.setDate(d.getDate() - 1)
    checkDate = normalizeDate(d)
  }
  return count
}
