// lib/solaceData.ts
// Универсальный слой данных для Solace:
// - если пользователь залогинен → Supabase
// - если нет → localStorage
//
// Поддерживает: Wheel (history), Habits (daily counts), Goals, Vision (profiles.vision_images)
//
// ВАЖНО: этот файл предполагает, что у тебя есть экспорт supabase из ../lib/supabase
// (если путь другой — поправь импорт ниже)

import { supabase } from './supabase'

/* ----------------------------- helpers ----------------------------- */

export type WheelValues = {
  health: number
  career: number
  finance: number
  relat: number
  growth: number
  spirit: number
  rest: number
  env: number
}

export const DEFAULT_WHEEL: WheelValues = {
  health: 5,
  career: 5,
  finance: 5,
  relat: 5,
  growth: 5,
  spirit: 5,
  rest: 5,
  env: 5,
}

const LS_KEYS = {
  wheel: 'wheel_values', // локально храним одно актуальное состояние
  habits: 'habits', // массив привычек
  habitDaily: 'habitDaily', // { `${habitId}_${YYYY-MM-DD}`: number }
  goals: 'global_goals', // массив целей
  vision: 'vision_images', // массив карточек
} as const

function isBrowser() {
  return typeof window !== 'undefined'
}

function readLS<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeLS<T>(key: string, value: T) {
  if (!isBrowser()) return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

export function toISODate(d: Date) {
  // YYYY-MM-DD
  return d.toISOString().slice(0, 10)
}

/** Возвращает auth пользователя (или null), без исключений */
export async function getAuthedUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error) return null
  return data.user ?? null
}

/** Быстрый флаг "залогинен ли" */
export async function isAuthed() {
  return !!(await getAuthedUser())
}

/* ----------------------------- WHEEL ----------------------------- */
/**
 * Wheel хранится в Supabase как история в wheel_entries.
 * Локально: сохраняем последнее состояние (без истории).
 */
export async function getWheelLatest(): Promise<WheelValues> {
  const user = await getAuthedUser()
  if (!user) {
    return readLS<WheelValues>(LS_KEYS.wheel, DEFAULT_WHEEL)
  }

  const { data, error } = await supabase
    .from('wheel_entries')
    .select('values,created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[getWheelLatest] supabase error:', error.message)
    // fallback to LS if exists
    return readLS<WheelValues>(LS_KEYS.wheel, DEFAULT_WHEEL)
  }

  return (data?.values as WheelValues) ?? DEFAULT_WHEEL
}

/** Сохранить snapshot wheel (Supabase insert) или обновить LS */
export async function saveWheelSnapshot(values: WheelValues): Promise<void> {
  const user = await getAuthedUser()
  if (!user) {
    writeLS(LS_KEYS.wheel, values)
    return
  }

  const { error } = await supabase.from('wheel_entries').insert({
    user_id: user.id,
    values,
  })

  if (error) console.error('[saveWheelSnapshot] supabase error:', error.message)
}

/** Получить историю wheel (для графика), опционально limit */
export async function getWheelHistory(limit = 50): Promise<Array<{ created_at: string; values: WheelValues }>> {
  const user = await getAuthedUser()
  if (!user) return [] // локально историю не ведём

  const { data, error } = await supabase
    .from('wheel_entries')
    .select('created_at,values')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[getWheelHistory] supabase error:', error.message)
    return []
  }

  return (data ?? []).map((r: any) => ({
    created_at: r.created_at,
    values: r.values as WheelValues,
  }))
}

/* ----------------------------- HABITS ----------------------------- */

export type Habit = {
  id: string
  title: string
  color: string
  position: number
  target_per_day: number
  created_at?: string
}

export type HabitDailyMap = Record<string, number> // `${habitId}_${YYYY-MM-DD}` -> count

/** Список привычек */
export async function getHabits(): Promise<Habit[]> {
  const user = await getAuthedUser()
  if (!user) {
    // legacy support: {id,name,color} → преобразуем
    const raw = readLS<any[]>(LS_KEYS.habits, [])
    const normalized = raw.map((h, idx) => ({
      id: String(h.id),
      title: h.title ?? h.name ?? 'Привычка',
      color: h.color ?? '#D4C3B5',
      position: Number(h.position ?? idx),
      target_per_day: Number(h.target_per_day ?? 1),
    })) as Habit[]
    return normalized.sort((a, b) => a.position - b.position)
  }

  const { data, error } = await supabase
    .from('habits')
    .select('id,title,color,position,target_per_day,created_at')
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[getHabits] supabase error:', error.message)
    return []
  }

  return (data ?? []) as Habit[]
}

/** Создать привычку */
export async function createHabit(input: Pick<Habit, 'title' | 'color' | 'position'> & Partial<Pick<Habit, 'target_per_day'>>): Promise<Habit | null> {
  const user = await getAuthedUser()
  if (!user) {
    const habits = await getHabits()
    const newHabit: Habit = {
      id: String(Date.now()),
      title: input.title,
      color: input.color ?? '#D4C3B5',
      position: input.position ?? habits.length,
      target_per_day: input.target_per_day ?? 1,
    }
    const next = [...habits, newHabit]
    writeLS(LS_KEYS.habits, next)
    return newHabit
  }

  const { data, error } = await supabase
    .from('habits')
    .insert({
      title: input.title,
      color: input.color ?? '#D4C3B5',
      position: input.position ?? 0,
      target_per_day: input.target_per_day ?? 1,
      user_id: user.id,
    })
    .select('id,title,color,position,target_per_day,created_at')
    .single()

  if (error) {
    console.error('[createHabit] supabase error:', error.message)
    return null
  }

  return data as Habit
}

/** Обновить привычку (название/цвет/позиция/target_per_day) */
export async function updateHabit(habitId: string, patch: Partial<Pick<Habit, 'title' | 'color' | 'position' | 'target_per_day'>>): Promise<void> {
  const user = await getAuthedUser()
  if (!user) {
    const habits = await getHabits()
    const next = habits.map(h => (h.id === habitId ? { ...h, ...patch } : h))
    writeLS(LS_KEYS.habits, next)
    return
  }

  const { error } = await supabase
    .from('habits')
    .update(patch)
    .eq('id', habitId)

  if (error) console.error('[updateHabit] supabase error:', error.message)
}

/** Удалить привычку */
export async function deleteHabit(habitId: string): Promise<void> {
  const user = await getAuthedUser()
  if (!user) {
    const habits = await getHabits()
    writeLS(LS_KEYS.habits, habits.filter(h => h.id !== habitId))

    // Также подчистим daily
    const daily = readLS<HabitDailyMap>(LS_KEYS.habitDaily, {})
    const next: HabitDailyMap = {}
    Object.entries(daily).forEach(([k, v]) => {
      if (!k.startsWith(`${habitId}_`)) next[k] = v
    })
    writeLS(LS_KEYS.habitDaily, next)
    return
  }

  const { error } = await supabase.from('habits').delete().eq('id', habitId)
  if (error) console.error('[deleteHabit] supabase error:', error.message)
}

/**
 * Получить дневные значения в диапазоне дат (включительно).
 * Возвращает map: `${habitId}_${YYYY-MM-DD}` -> count
 */
export async function getHabitDailyRange(fromISO: string, toISO: string): Promise<HabitDailyMap> {
  const user = await getAuthedUser()
  if (!user) {
    // локально просто возвращаем всё (или можно фильтровать)
    const all = readLS<HabitDailyMap>(LS_KEYS.habitDaily, {})
    const out: HabitDailyMap = {}
    for (const [k, v] of Object.entries(all)) {
      const [, day] = k.split('_')
      if (day >= fromISO && day <= toISO) out[k] = v
    }
    return out
  }

  // Получаем все habit_daily за период и формируем map
  const { data, error } = await supabase
    .from('habit_daily')
    .select('habit_id,day,count')
    .gte('day', fromISO)
    .lte('day', toISO)

  if (error) {
    console.error('[getHabitDailyRange] supabase error:', error.message)
    return {}
  }

  const out: HabitDailyMap = {}
  ;(data ?? []).forEach((r: any) => {
    const key = `${r.habit_id}_${r.day}`
    out[key] = Number(r.count ?? 0)
  })
  return out
}

/**
 * Инкремент/декремент дневного счётчика (delta может быть -1).
 * Supabase: RPC increment_habit_day()
 * Local: обновление map в LS
 */
export async function incrementHabitDay(habitId: string, dayISO: string, delta = 1): Promise<number> {
  const user = await getAuthedUser()

  if (!user) {
    const daily = readLS<HabitDailyMap>(LS_KEYS.habitDaily, {})
    const key = `${habitId}_${dayISO}`
    const nextVal = Math.max((daily[key] ?? 0) + delta, 0)
    daily[key] = nextVal
    writeLS(LS_KEYS.habitDaily, daily)
    return nextVal
  }

  const { error } = await supabase.rpc('increment_habit_day', {
    p_habit_id: habitId,
    p_day: dayISO,
    p_delta: delta,
  })
  if (error) console.error('[incrementHabitDay] supabase error:', error.message)

  // Вернуть актуальное значение (дешево: один select конкретной строки)
  const { data } = await supabase
    .from('habit_daily')
    .select('count')
    .eq('habit_id', habitId)
    .eq('day', dayISO)
    .maybeSingle()

  return Number((data as any)?.count ?? 0)
}

/* ----------------------------- GOALS ----------------------------- */

export type GoalPeriod = 'месяц' | 'год' | '5 лет' | 'все'

export type SubTask = {
  id: string
  title: string
  completed: boolean
}

export type Goal = {
  id: string
  title: string
  deadline: string | null
  progress: number
  period: Exclude<GoalPeriod, 'все'> | null
  is_completed: boolean
  subtasks: SubTask[]
  created_at?: string
  updated_at?: string
}

export async function getGoals(): Promise<Goal[]> {
  const user = await getAuthedUser()
  if (!user) {
    return readLS<Goal[]>(LS_KEYS.goals, [])
  }

  const { data, error } = await supabase
    .from('global_goals')
    .select('id,title,deadline,progress,period,is_completed,subtasks,created_at,updated_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getGoals] supabase error:', error.message)
    return []
  }

  return (data ?? []) as Goal[]
}

export async function createGoal(input: Omit<Goal, 'id' | 'is_completed' | 'progress'> & Partial<Pick<Goal, 'progress' | 'is_completed'>>): Promise<Goal | null> {
  const user = await getAuthedUser()
  if (!user) {
    const goals = readLS<Goal[]>(LS_KEYS.goals, [])
    const newGoal: Goal = {
      id: String(Date.now()),
      title: input.title,
      deadline: input.deadline ?? null,
      progress: input.progress ?? 0,
      period: (input.period ?? null) as any,
      is_completed: input.is_completed ?? false,
      subtasks: input.subtasks ?? [],
    }
    writeLS(LS_KEYS.goals, [newGoal, ...goals])
    return newGoal
  }

  const { data, error } = await supabase
    .from('global_goals')
    .insert({
      user_id: user.id,
      title: input.title,
      deadline: input.deadline ?? null,
      progress: input.progress ?? 0,
      period: input.period ?? null,
      is_completed: input.is_completed ?? false,
      subtasks: input.subtasks ?? [],
    })
    .select('id,title,deadline,progress,period,is_completed,subtasks,created_at,updated_at')
    .single()

  if (error) {
    console.error('[createGoal] supabase error:', error.message)
    return null
  }

  return data as Goal
}

export async function updateGoal(goalId: string, patch: Partial<Pick<Goal, 'title' | 'deadline' | 'progress' | 'period' | 'is_completed' | 'subtasks'>>): Promise<void> {
  const user = await getAuthedUser()
  if (!user) {
    const goals = readLS<Goal[]>(LS_KEYS.goals, [])
    writeLS(
      LS_KEYS.goals,
      goals.map(g => (g.id === goalId ? { ...g, ...patch } : g))
    )
    return
  }

  const { error } = await supabase.from('global_goals').update(patch).eq('id', goalId)
  if (error) console.error('[updateGoal] supabase error:', error.message)
}

export async function deleteGoal(goalId: string): Promise<void> {
  const user = await getAuthedUser()
  if (!user) {
    const goals = readLS<Goal[]>(LS_KEYS.goals, [])
    writeLS(LS_KEYS.goals, goals.filter(g => g.id !== goalId))
    return
  }

  const { error } = await supabase.from('global_goals').delete().eq('id', goalId)
  if (error) console.error('[deleteGoal] supabase error:', error.message)
}

export type GoalEvent = {
  id: string
  goal_id: string
  user_id: string
  action: 'insert' | 'update' | 'delete'
  old_data: any | null
  new_data: any | null
  created_at: string
}

/** История изменений конкретной цели (только для authed) */
export async function getGoalHistory(goalId: string): Promise<GoalEvent[]> {
  const user = await getAuthedUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('goal_events')
    .select('id,goal_id,user_id,action,old_data,new_data,created_at')
    .eq('goal_id', goalId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getGoalHistory] supabase error:', error.message)
    return []
  }
  return (data ?? []) as GoalEvent[]
}

/* ----------------------------- VISION (profiles.vision_images) ----------------------------- */

export type VisionImage = {
  path: string // storage path: `${user.id}/file.jpg`
  caption?: string
  order?: number
  created_at?: string
}

export async function getVisionImages(): Promise<VisionImage[]> {
  const user = await getAuthedUser()
  if (!user) {
    return readLS<VisionImage[]>(LS_KEYS.vision, [])
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('vision_images')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('[getVisionImages] supabase error:', error.message)
    return []
  }

  const arr = (data?.vision_images ?? []) as VisionImage[]
  return Array.isArray(arr) ? arr : []
}

export async function setVisionImages(images: VisionImage[]): Promise<void> {
  const user = await getAuthedUser()
  if (!user) {
    writeLS(LS_KEYS.vision, images)
    return
  }

  const { error } = await supabase
    .from('profiles')
    .update({ vision_images: images })
    .eq('id', user.id)

  if (error) console.error('[setVisionImages] supabase error:', error.message)
}

/**
 * Удобный helper: добавить картинку в список (после загрузки в Storage)
 */
export async function addVisionImage(image: VisionImage): Promise<VisionImage[]> {
  const current = await getVisionImages()
  const next = [...current, image].map((img, idx) => ({ ...img, order: img.order ?? idx }))
  await setVisionImages(next)
  return next
}

/**
 * Supabase Storage:
 * - загрузка файла в bucket 'vision'
 * - возвращает path, который можно положить в profiles.vision_images
 */
export async function uploadVisionFile(file: File): Promise<string | null> {
  const user = await getAuthedUser()
  if (!user) return null

  const safeName = file.name.replace(/\s+/g, '_')
  const path = `${user.id}/${Date.now()}_${safeName}`

  const { error } = await supabase.storage.from('vision').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) {
    console.error('[uploadVisionFile] storage error:', error.message)
    return null
  }

  return path
}

/**
 * Получить временную ссылку на картинку (bucket должен быть private)
 */
export async function getVisionSignedUrl(path: string, expiresInSeconds = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage.from('vision').createSignedUrl(path, expiresInSeconds)
  if (error) {
    console.error('[getVisionSignedUrl] storage error:', error.message)
    return null
  }
  return data?.signedUrl ?? null
}

/**
 * Удалить файл из storage и убрать из списка
 */
export async function removeVisionImage(path: string): Promise<void> {
  const user = await getAuthedUser()
  if (!user) {
    const current = readLS<VisionImage[]>(LS_KEYS.vision, [])
    writeLS(LS_KEYS.vision, current.filter(i => i.path !== path))
    return
  }

  // 1) remove from storage
  const { error: storageError } = await supabase.storage.from('vision').remove([path])
  if (storageError) console.error('[removeVisionImage] storage error:', storageError.message)

  // 2) remove from profiles
  const current = await getVisionImages()
  const next = current.filter(i => i.path !== path)
  await setVisionImages(next)
}