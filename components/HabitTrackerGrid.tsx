'use client'
import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'

const COLORS = ['#D6DDD0', '#EBD9D0', '#F4E4E1', '#F9F4F0', '#D4C3B5']

const LS_HABITS = 'habits'
const LS_LOGS = 'habitLogs'

type Habit = { id: string; name: string; color: string }
type LogsMap = Record<string, boolean>

export type WeekDay = { date: string; num: number; label: string }

export default function HabitTrackerGrid() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [logs, setLogs] = useState<LogsMap>({})
  const [mounted, setMounted] = useState(false)
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0)

  const normalizeDate = (d: Date) => d.toISOString().slice(0, 10) // YYYY-MM-DD

  /** Неделя Пн–Вс; currentWeekOffset: 0 = текущая, -1 = прошлая, +1 = следующая */
  const getWeekDays = (): WeekDay[] => {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setHours(0, 0, 0, 0)
    const day = startOfWeek.getDay()
    const mondayOffset = (day + 6) % 7
    startOfWeek.setDate(startOfWeek.getDate() - mondayOffset + currentWeekOffset * 7)

    const days: WeekDay[] = []
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

  /** Подпись для шапки: "12–18 янв. 2026" */
  const getWeekRangeLabel = (weekDays: WeekDay[]) => {
    if (!weekDays.length) return ''
    const first = weekDays[0]
    const last = weekDays[6]
    const dFirst = new Date(first.date)
    const dLast = new Date(last.date)
    const monthFirst = dFirst.toLocaleDateString('ru-RU', { month: 'short' })
    const monthLast = dLast.toLocaleDateString('ru-RU', { month: 'short' })
    const year = dLast.getFullYear()
    if (monthFirst === monthLast) return `${first.num}–${last.num} ${monthFirst} ${year}`
    return `${first.num} ${monthFirst} – ${last.num} ${monthLast} ${year}`
  }

  /** На десктопе: 2 полные недели (Пн–Вс, Пн–Вс) от той же начальной недели, что и на мобилке */
  const getDesktopDays = (): WeekDay[] => {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setHours(0, 0, 0, 0)
    const day = startOfWeek.getDay()
    const mondayOffset = (day + 6) % 7
    startOfWeek.setDate(startOfWeek.getDate() - mondayOffset + currentWeekOffset * 7)
    const days: WeekDay[] = []
    for (let i = 0; i < 14; i++) {
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

  /** Подпись диапазона для десктопа: "9–22 март 2026" (14 дней) */
  const getDesktopRangeLabel = (desktopDays: WeekDay[]) => {
    if (desktopDays.length < 14) return ''
    const first = desktopDays[0]
    const last = desktopDays[13]
    const dFirst = new Date(first.date)
    const dLast = new Date(last.date)
    const monthFirst = dFirst.toLocaleDateString('ru-RU', { month: 'short' })
    const monthLast = dLast.toLocaleDateString('ru-RU', { month: 'short' })
    const year = dLast.getFullYear()
    if (monthFirst === monthLast) return `${first.num}–${last.num} ${monthFirst} ${year}`
    return `${first.num} ${monthFirst} – ${last.num} ${monthLast} ${year}`
  }

  /** Дней в месяце (28 / 29 / 30 / 31) по первой дате из диапазона */
  const getDaysInMonthForRange = (firstDateStr: string) => {
    const d = new Date(firstDateStr)
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
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

  // =========================
  // ✅ FIX: не сохраняем title в БД на каждый символ
  // =========================
  const updateHabitLocal = (habitId: string, name: string) => {
    setHabits((prev) => prev.map((h) => (h.id === habitId ? { ...h, name } : h)))
  }

  const saveHabitTitle = async (habitId: string, title: string) => {
    const clean = title.trim()
    if (!clean) return

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('habits')
      .update({ title: clean })
      .eq('id', habitId)
      .eq('user_id', user.id)

    if (error) console.error('Ошибка сохранения названия:', error)
  }
  // =========================

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

  const weekDays = getWeekDays()
  const desktopDays = getDesktopDays()
  const headerLabel = getWeekRangeLabel(weekDays)
  const desktopHeaderLabel = getDesktopRangeLabel(desktopDays)
  const desktopMonth = desktopDays[0] ? new Date(desktopDays[0].date) : null
  const daysInMonth = desktopMonth ? getDaysInMonthForRange(desktopDays[0].date) : 31
  const monthKey = desktopMonth ? `${desktopMonth.getFullYear()}-${String(desktopMonth.getMonth() + 1).padStart(2, '0')}` : ''

  const mobileMonth = weekDays[0] ? new Date(weekDays[0].date) : null
  const daysInMonthMobile = mobileMonth ? getDaysInMonthForRange(weekDays[0].date) : 31
  const monthKeyMobile = mobileMonth ? `${mobileMonth.getFullYear()}-${String(mobileMonth.getMonth() + 1).padStart(2, '0')}` : ''

  if (!mounted) return null

  const weekTotal = (habitId: string) => weekDays.filter((d) => !!logs[`${habitId}_${d.date}`]).length
  const desktopTwoWeeksTotal = (habitId: string) => desktopDays.filter((d) => !!logs[`${habitId}_${d.date}`]).length
  const monthTotal = (habitId: string) => {
    if (!monthKey) return 0
    let count = 0
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${monthKey}-${String(day).padStart(2, '0')}`
      if (logs[`${habitId}_${dateStr}`]) count++
    }
    return count
  }
  const monthTotalMobile = (habitId: string) => {
    if (!monthKeyMobile) return 0
    let count = 0
    for (let day = 1; day <= daysInMonthMobile; day++) {
      const dateStr = `${monthKeyMobile}-${String(day).padStart(2, '0')}`
      if (logs[`${habitId}_${dateStr}`]) count++
    }
    return count
  }

  return (
    <div className="w-full bg-white/20 backdrop-blur-sm p-4 md:p-8 rounded-sm border border-stone-50">
      {/* Мобилка: одна строка — заголовок, справа стрелки и +; снизу дата */}
      <div className="md:hidden mb-6">
        <div className="flex justify-between items-center gap-3">
          <h3 className="font-lora text-xl text-[--espresso] opacity-90 shrink-0">Трекер привычек</h3>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex border border-[#D4C3B5]/30 rounded-full p-1">
              <button onClick={() => setCurrentWeekOffset((v) => v - 1)} className="p-1" aria-label="Предыдущая неделя">
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => setCurrentWeekOffset((v) => v + 1)} className="p-1" aria-label="Следующая неделя">
                <ChevronRight size={14} />
              </button>
            </div>
            <button
              onClick={createHabit}
              className="p-2 border border-[#D4C3B5]/40 rounded-full hover:bg-[--espresso] hover:text-white transition-all"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
        <p className="text-[--mocha] text-[9px] uppercase tracking-[0.3em] font-bold mt-2 opacity-50">{headerLabel}</p>
      </div>

      {/* Десктоп: заголовок, дата (2 недели), справа стрелки и + */}
      <div className="hidden md:flex justify-between items-end mb-10">
        <div>
          <h3 className="font-lora text-2xl md:text-3xl text-[--espresso] opacity-90">Трекер привычек</h3>
          <p className="text-[--mocha] text-[9px] uppercase tracking-[0.3em] font-bold mt-2 opacity-50">{desktopHeaderLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex border border-[#D4C3B5]/30 rounded-full p-1 mr-2">
            <button onClick={() => setCurrentWeekOffset((v) => v - 1)} className="p-1 hover:bg-[#D4C3B5]/20 rounded-full" aria-label="Предыдущие 2 недели">
              <ChevronLeft size={14} />
            </button>
            <button onClick={() => setCurrentWeekOffset((v) => v + 1)} className="p-1 hover:bg-[#D4C3B5]/20 rounded-full" aria-label="Следующие 2 недели">
              <ChevronRight size={14} />
            </button>
          </div>
          <button
            onClick={createHabit}
            className="group flex items-center gap-2 px-3 md:px-4 py-2 border border-[#D4C3B5]/40 rounded-full hover:bg-[--espresso] hover:text-white transition-all duration-300"
          >
            <Plus size={14} className="group-hover:rotate-90 transition-transform duration-300" />
            <span className="text-[10px] uppercase tracking-widest font-bold">Добавить</span>
          </button>
        </div>
      </div>

      <div className="w-full">
        <div className="hidden md:grid grid-cols-[180px_auto_72px] items-center mb-6 border-b border-[#D4C3B5]/30 pb-4 gap-2">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[--mocha]/60">Привычка</span>
          <div className="grid gap-2 w-fit" style={{ gridTemplateColumns: 'repeat(14, 2.25rem)' }}>
            {desktopDays.map((d) => (
              <span key={d.date} className="w-9 h-9 flex items-center justify-center text-[10px] font-bold text-[--espresso]/60" title={d.date}>
                {d.label}
              </span>
            ))}
          </div>
          <span className="text-right text-[9px] font-black uppercase tracking-[0.2em] text-[--mocha]/60">Месяц</span>
        </div>

        <div className="space-y-8 md:space-y-4">
          <AnimatePresence>
            {habits.map((h) => (
              <motion.div
                key={h.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col md:grid md:grid-cols-[180px_auto_72px] md:items-center group gap-2"
              >
                <div className="flex items-center gap-2 mb-3 md:mb-0 md:pr-4">
                  <button
                    onClick={() => deleteHabit(h.id)}
                    className="md:opacity-0 group-hover:opacity-100 text-[#D4C3B5] hover:text-red-400 transition-all shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>

                  {/* ✅ FIXED INPUT BLOCK */}
                  <input
                    className="bg-transparent outline-none text-[14px] w-full text-[--espresso] font-lora italic border-b border-transparent focus:border-[#D4C3B5]/40 transition-colors"
                    value={h.name}
                    onChange={(e) => updateHabitLocal(h.id, e.target.value)}
                    onBlur={async () => {
                      await saveHabitTitle(h.id, h.name)
                    }}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur()
                      }
                    }}
                  />

                  <span className="md:hidden text-[12px] font-lora italic text-[--espresso]/40 tabular-nums" title="За месяц">
                    {monthTotalMobile(h.id)}/{daysInMonthMobile}
                  </span>
                </div>

                <div className="relative">
                  <div className="grid grid-cols-7 gap-2 md:hidden">
                    {weekDays.map((day) => {
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

                  <div className="hidden md:grid gap-2 w-fit" style={{ gridTemplateColumns: 'repeat(14, 2.25rem)' }}>
                    {desktopDays.map((day) => {
                      const key = `${h.id}_${day.date}`
                      const active = !!logs[key]
                      return (
                        <button
                          key={key}
                          onClick={() => toggle(h.id, day.num, day.date)}
                          className={`w-9 h-9 flex items-center justify-center rounded-sm border transition-all duration-300 ${
                            active
                              ? 'border-[#D4C3B5]/60 scale-105 shadow-sm'
                              : 'border-[#D4C3B5]/50 bg-stone-50/20 hover:border-[#D4C3B5]/80'
                          }`}
                          style={{ backgroundColor: active ? `${h.color}cc` : '' }}
                          title={`${day.date} ${day.label}`}
                        >
                          <span className={`text-[11px] font-medium tabular-nums ${active ? 'text-[--espresso]' : 'text-[--espresso]/20'}`}>
                            {day.num}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="hidden md:block text-right">
                  <span className="text-[13px] font-lora italic text-[--espresso]/80 tabular-nums" title="За месяц">{monthTotal(h.id)}/{daysInMonth}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}