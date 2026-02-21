'use client'
import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)
const COLORS = ['#D6DDD0', '#EBD9D0', '#F4E4E1', '#F9F4F0', '#D4C3B5']

const LS_HABITS = 'habits'
const LS_LOGS = 'habitLogs'

type Habit = { id: string; name: string; color: string }
type LogsMap = Record<string, boolean>

export default function HabitTrackerGrid() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [logs, setLogs] = useState<LogsMap>({})
  const [mounted, setMounted] = useState(false)
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0)

  // helpers
  const normalizeDate = (d: Date) => d.toISOString().slice(0, 10) // YYYY-MM-DD

  const getMonthLabel = (date: Date) => {
    const month = date.toLocaleDateString('ru-RU', { month: 'long' })
    const year = date.getFullYear()
    const capMonth = month.charAt(0).toUpperCase() + month.slice(1)
    return `${capMonth} • ${year}`
  }

  const getCurrentMonthDateISO = (day: number) => {
    const now = new Date()
    const d = new Date(now.getFullYear(), now.getMonth(), day)
    return normalizeDate(d)
  }

  const getMobileWeekDays = () => {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setHours(0, 0, 0, 0)

    // Monday start
    const day = startOfWeek.getDay() // 0..6 (Sun..Sat)
    const mondayOffset = (day + 6) % 7
    startOfWeek.setDate(startOfWeek.getDate() - mondayOffset + currentWeekOffset * 7)

    const days: { date: string; num: number; label: string }[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      days.push({
        date: normalizeDate(d),
        num: d.getDate(),
        label: d.toLocaleDateString('ru-RU', { weekday: 'short' }),
      })
    }
    return days
  }

  const lsLoad = () => {
    const savedHabits = localStorage.getItem(LS_HABITS)
    const savedLogs = localStorage.getItem(LS_LOGS)

    if (savedHabits) setHabits(JSON.parse(savedHabits))
    else setHabits([])

    if (savedLogs) setLogs(JSON.parse(savedLogs))
    else setLogs({})
  }

  const lsSave = (nextHabits: Habit[], nextLogs: LogsMap) => {
    localStorage.setItem(LS_HABITS, JSON.stringify(nextHabits))
    localStorage.setItem(LS_LOGS, JSON.stringify(nextLogs))
  }

  // --- единственная функция загрузки из БД (и мы ее переиспользуем)
  const loadFromDb = async () => {
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser()

    if (userErr) console.error('auth.getUser error:', userErr)
    if (!user) return { ok: false as const }

    const [habitsRes, logsRes] = await Promise.all([
      supabase
        .from('habits')
        .select('id, title, color, position, created_at')
        .eq('user_id', user.id) // ✅ важно
        .order('position', { ascending: true })
        .order('created_at', { ascending: true }),
      supabase.from('habit_logs').select('habit_id, date, completed'),
    ])

    if (habitsRes.error) {
      console.error('Ошибка загрузки habits:', habitsRes.error)
      return { ok: false as const }
    }
    if (logsRes.error) {
      console.error('Ошибка загрузки habit_logs:', logsRes.error)
      return { ok: false as const }
    }

    const mappedHabits: Habit[] = (habitsRes.data ?? []).map((h: any) => ({
      id: h.id,
      name: h.title ?? '',
      color: h.color ?? '#D4C3B5',
    }))

    const mappedLogs: LogsMap = {}
    ;(logsRes.data ?? []).forEach((l: any) => {
      if (!l?.habit_id || !l?.date) return
      const key = `${l.habit_id}_${String(l.date)}`
      mappedLogs[key] = !!l.completed
    })

    setHabits(mappedHabits)
    setLogs(mappedLogs)
    return { ok: true as const }
  }

  // initial load
  useEffect(() => {
    setMounted(true)

    ;(async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          lsLoad()
          return
        }

        const res = await loadFromDb()
        if (!res.ok) lsLoad()
      } catch (e) {
        console.error('Ошибка загрузки привычек:', e)
        lsLoad()
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // save localStorage only for guests
  useEffect(() => {
    if (!mounted) return
    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) lsSave(habits, logs)
    })()
  }, [habits, logs, mounted])

  const createHabit = async () => {
    const tempId = `tmp_${Date.now()}`
    const optimistic: Habit = {
      id: tempId,
      name: 'Новая привычка',
      color: COLORS[habits.length % COLORS.length],
    }
    setHabits((prev) => [...prev, optimistic])

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('habits').insert({
      user_id: user.id, // ✅ важно
      title: optimistic.name,
      color: optimistic.color,
      position: habits.length,
    })

    if (error) {
      console.error('Ошибка создания привычки:', error)
      setHabits((prev) => prev.filter((h) => h.id !== tempId))
      return
    }

    // перечитать из БД — чтобы получить настоящий uuid и корректную сортировку
    await loadFromDb()
  }

  const deleteHabit = async (habitId: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== habitId))
    setLogs((prev) => {
      const next = { ...prev }
      Object.keys(next).forEach((k) => {
        if (k.startsWith(`${habitId}_`)) delete next[k]
      })
      return next
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('habits').delete().eq('id', habitId).eq('user_id', user.id)
    if (error) console.error('Ошибка удаления привычки:', error)

    await loadFromDb()
  }

  const renameHabit = async (habitId: string, name: string) => {
    setHabits((prev) => prev.map((h) => (h.id === habitId ? { ...h, name } : h)))

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('habits').update({ title: name }).eq('id', habitId).eq('user_id', user.id)
    if (error) console.error('Ошибка сохранения названия:', error)
  }

  // toggle (save to habit_logs)
  const toggle = async (habitId: string, day: number, dateISO?: string) => {
    const dateToSave =
      dateISO ??
      (() => {
        const now = new Date()
        const d = new Date(now.getFullYear(), now.getMonth(), day)
        return normalizeDate(d)
      })()

    const key = `${habitId}_${dateToSave}`
    const nextVal = !logs[key]

    // optimistic
    setLogs((prev) => ({ ...prev, [key]: nextVal }))

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    // ✅ Сначала пробуем upsert с user_id (если колонка есть)
    const tryWithUserId = async () => {
      return supabase
        .from('habit_logs')
        .upsert(
          { user_id: user.id, habit_id: habitId, date: dateToSave, completed: nextVal } as any,
          { onConflict: 'habit_id,date' }
        )
    }

    const tryWithoutUserId = async () => {
      return supabase
        .from('habit_logs')
        .upsert({ habit_id: habitId, date: dateToSave, completed: nextVal } as any, { onConflict: 'habit_id,date' })
    }

    // 1) пробуем с user_id
    let res = await tryWithUserId()

    // 2) если ошибка “column user_id does not exist” — повторяем без user_id
    if (res.error && String(res.error.message || '').toLowerCase().includes('user_id')) {
      res = await tryWithoutUserId()
    }

    if (res.error) {
      console.error('Ошибка сохранения отметки:', res.error)
      // rollback
      setLogs((prev) => ({ ...prev, [key]: !nextVal }))
      return
    }
  }

  const mobileWeek = getMobileWeekDays()
  const headerLabel = (() => {
    const base = mobileWeek[0]?.date ? new Date(mobileWeek[0].date) : new Date()
    return getMonthLabel(base)
  })()

  if (!mounted) return null

  // totals
  const monthTotal = (habitId: string) => DAYS.filter((d) => !!logs[`${habitId}_${getCurrentMonthDateISO(d)}`]).length
  const weekTotal = (habitId: string) => mobileWeek.filter((d) => !!logs[`${habitId}_${d.date}`]).length

  return (
    <div className="w-full bg-white/20 backdrop-blur-sm p-4 md:p-8 rounded-sm border border-stone-50">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h3 className="font-lora text-2xl md:text-3xl text-[--espresso] opacity-90">Трекер привычек</h3>
          <p className="text-[--mocha] text-[9px] uppercase tracking-[0.3em] font-bold mt-2 opacity-50">{headerLabel}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex md:hidden border border-[#D4C3B5]/30 rounded-full p-1 mr-2">
            <button onClick={() => setCurrentWeekOffset((v) => v - 1)} className="p-1">
              <ChevronLeft size={14} />
            </button>
            <button onClick={() => setCurrentWeekOffset((v) => v + 1)} className="p-1">
              <ChevronRight size={14} />
            </button>
          </div>

          <button
            onClick={createHabit}
            className="group flex items-center gap-2 px-3 md:px-4 py-2 border border-[#D4C3B5]/40 rounded-full hover:bg-[--espresso] hover:text-white transition-all duration-300"
          >
            <Plus size={14} className="group-hover:rotate-90 transition-transform duration-300" />
            <span className="text-[10px] uppercase tracking-widest font-bold hidden sm:inline">Добавить</span>
          </button>
        </div>
      </div>

      <div className="w-full">
        <div className="hidden md:grid grid-cols-[180px_1fr_60px] items-center mb-6 border-b border-[#D4C3B5]/30 pb-4">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[--mocha]/60">Привычка</span>
          <div className="grid grid-cols-[repeat(31,minmax(0,1fr))] gap-1 px-2">
            {DAYS.map((d) => (
              <span key={d} className="text-center text-[10px] font-bold text-[--espresso]/60">
                {d}
              </span>
            ))}
          </div>
          <span className="text-right text-[9px] font-black uppercase tracking-[0.2em] text-[--mocha]/60">Итог</span>
        </div>

        <div className="space-y-8 md:space-y-4">
          <AnimatePresence>
            {habits.map((h) => (
              <motion.div
                key={h.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col md:grid md:grid-cols-[180px_1fr_60px] md:items-center group"
              >
                <div className="flex items-center gap-2 mb-3 md:mb-0 md:pr-4">
                  <button
                    onClick={() => deleteHabit(h.id)}
                    className="md:opacity-0 group-hover:opacity-100 text-[#D4C3B5] hover:text-red-400 transition-all shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>

                  <input
                    className="bg-transparent outline-none text-[14px] w-full text-[--espresso] font-lora italic border-b border-transparent focus:border-[#D4C3B5]/40 transition-colors"
                    value={h.name}
                    onChange={(e) => renameHabit(h.id, e.target.value)}
                  />

                  <span className="md:hidden text-[12px] font-lora italic text-[--espresso]/40">
                    {weekTotal(h.id)}/{monthTotal(h.id)}
                  </span>
                </div>

                <div className="relative">
                  <div className="grid grid-cols-7 gap-2 md:hidden">
                    {mobileWeek.map((day) => {
                      const key = `${h.id}_${day.date}`
                      const active = !!logs[key]
                      return (
                        <div key={day.date} className="flex flex-col items-center gap-1">
                          <span className="text-[8px] uppercase font-bold text-[--mocha]/40">{day.label}</span>
                          <button
                            onClick={() => toggle(h.id, day.num, day.date)}
                            className={`aspect-square w-full rounded-sm border transition-all duration-300 ${
                              active ? 'border-[#D4C3B5]/60 scale-105 shadow-sm' : 'border-[#D4C3B5]/50 bg-stone-50/20'
                            }`}
                            style={{ backgroundColor: active ? `${h.color}cc` : '' }}
                          >
                            <span className={`text-[9px] ${active ? 'text-[--espresso]' : 'text-[--espresso]/20'}`}>
                              {day.num}
                            </span>
                          </button>
                        </div>
                      )
                    })}
                  </div>

                  <div className="hidden md:grid grid-cols-[repeat(31,minmax(0,1fr))] gap-1 px-2">
                    {DAYS.map((d) => {
                      const dateISO = getCurrentMonthDateISO(d)
                      const key = `${h.id}_${dateISO}`
                      const active = !!logs[key]
                      return (
                        <button
                          key={key}
                          onClick={() => toggle(h.id, d, dateISO)}
                          className={`aspect-square w-full rounded-sm border transition-all duration-300 ${
                            active
                              ? 'border-[#D4C3B5]/60 scale-105 shadow-sm'
                              : 'border-[#D4C3B5]/50 bg-stone-50/20 hover:border-[#D4C3B5]/80'
                          }`}
                          style={{ backgroundColor: active ? `${h.color}cc` : '' }}
                        />
                      )
                    })}
                  </div>
                </div>

                <div className="hidden md:block text-right">
                  <span className="text-[14px] font-lora italic text-[--espresso]/80">{monthTotal(h.id)}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}