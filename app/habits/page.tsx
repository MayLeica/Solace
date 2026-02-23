'use client'
import React, { useEffect, useState, useMemo, useCallback } from 'react'
import HabitTrackerGrid from '../../components/HabitTrackerGrid'
import { supabase } from '../../lib/supabase'
import { getCurrentWeekDates, weekCompletionPct, streakDays, type LogsMap } from '../../lib/habitStats'
import { downloadWeeklyPdf, type HabitRow, type GoalRow } from '../../lib/weeklyPdfReport'
import { FileDown } from 'lucide-react'

const LS_HABITS = 'habits'
const LS_LOGS = 'habitLogs'
const LS_GOALS = 'solace_goals_v1'

type HabitForStats = { id: string; title: string }

function weekRangeLabel(weekDates: string[]) {
  if (!weekDates.length) return ''
  const first = new Date(weekDates[0])
  const last = new Date(weekDates[6])
  const m1 = first.toLocaleDateString('ru-RU', { month: 'short' })
  const m2 = last.toLocaleDateString('ru-RU', { month: 'short' })
  const y = last.getFullYear()
  if (m1 === m2) return `${first.getDate()}–${last.getDate()} ${m2} ${y}`
  return `${first.getDate()} ${m1} – ${last.getDate()} ${m2} ${y}`
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<HabitForStats[]>([])
  const [logs, setLogs] = useState<LogsMap>({})
  const [loading, setLoading] = useState(true)
  const [pdfLoading, setPdfLoading] = useState(false)

  useEffect(() => {
    let alive = true
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!alive) return
      if (!user) {
        const rawH = localStorage.getItem(LS_HABITS)
        const rawL = localStorage.getItem(LS_LOGS)
        const parsed = rawH ? (JSON.parse(rawH) as { id: string; name?: string }[]) : []
        setHabits(parsed.map((h) => ({ id: h.id, title: h.name ?? 'Привычка' })))
        setLogs(rawL ? (JSON.parse(rawL) as LogsMap) : {})
        setLoading(false)
        return
      }
      const [hRes, lRes] = await Promise.all([
        supabase.from('habits').select('id, title').eq('user_id', user.id).order('position').order('created_at'),
        supabase.from('habit_logs').select('habit_id, date, completed')
      ])
      if (!alive) return
      if (hRes.error) {
        setLoading(false)
        return
      }
      const habitList = (hRes.data ?? []).map((h: { id: string; title?: string }) => ({ id: h.id, title: h.title ?? '' }))
      setHabits(habitList)
      const logMap: LogsMap = {}
      ;(lRes.data ?? []).forEach((l: { habit_id?: string; date?: string; completed?: boolean }) => {
        if (l?.habit_id && l?.date) logMap[`${l.habit_id}_${l.date}`] = !!l.completed
      })
      setLogs(logMap)
      setLoading(false)
    }
    load()
    return () => { alive = false }
  }, [])

  const weekDates = useMemo(() => getCurrentWeekDates(0), [])
  const habitIds = useMemo(() => habits.map(h => h.id), [habits])
  const pct = useMemo(() => weekCompletionPct(habitIds, logs, weekDates), [habitIds, logs, weekDates])
  const streak = useMemo(() => streakDays(habitIds, logs), [habitIds, logs])
  const activeCount = habits.length

  const weekTotalForHabit = useCallback((habitId: string) => weekDates.filter((d) => !!logs[`${habitId}_${d}`]).length, [weekDates, logs])

  const handleDownloadReport = useCallback(async () => {
    setPdfLoading(true)
    try {
      const weekLabel = weekRangeLabel(weekDates)
      const habitRows: HabitRow[] = habits.map((h) => ({
        title: h.title,
        completed: weekTotalForHabit(h.id),
        total: 7
      }))
      let goals: GoalRow[] = []
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('global_goals')
          .select('title, progress, is_completed')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        goals = (data ?? []).map((g: { title?: string; progress?: number; is_completed?: boolean }) => ({
          title: g.title ?? '',
          progress: typeof g.progress === 'number' ? g.progress : 0,
          isCompleted: !!g.is_completed
        }))
      } else {
        const raw = localStorage.getItem(LS_GOALS)
        if (raw) {
          try {
            const arr = JSON.parse(raw) as { title: string; progress?: number; completed?: boolean }[]
            goals = arr.map((g) => ({ title: g.title ?? '', progress: g.progress ?? 0, isCompleted: !!g.completed }))
          } catch {}
        }
      }
      await downloadWeeklyPdf({
        weekLabel,
        habits: habitRows,
        goals,
        summary: { weekPct: pct, activeHabits: activeCount, goalsCount: goals.length }
      })
    } catch (e) {
      console.error('Ошибка генерации PDF:', e)
    } finally {
      setPdfLoading(false)
    }
  }, [weekDates, habits, weekTotalForHabit, pct, activeCount])

  const habitStats = useMemo(() => [
    { label: 'Сила воли', value: String(pct), sub: '% выполнений за неделю', color: 'bg-[#D6DDD0]', isPct: true },
    { label: 'Дисциплина', value: String(streak), sub: 'дней подряд без пропусков', color: 'bg-[#EBD9D0]', isPct: false },
    { label: 'Фокус', value: String(activeCount), sub: 'активные привычки', color: 'bg-[#F4E4E1]', isPct: false }
  ], [pct, streak, activeCount])

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20 pt-6 px-4">
      
      {/* HEADER — Полная синхронизация с Vision Board */}
      <header className="px-4">
        <h1 className="font-lora text-4xl text-[--espresso]">Привычки</h1>
        <div className="h-1 w-20 bg-[--sand] mt-4" />
        <p className="text-[--mocha] italic text-sm mt-4 opacity-80 leading-relaxed border-l-2 border-[--sand] pl-4 max-w-xl">
          «Дисциплина — это не ограничение свободы, а отсечение всего лишнего». С каждым маленьким шагом ты создаешь новую версию себя.
        </p>
      </header>

      {/* STATS — реальные данные из Supabase или localStorage */}
      <section className="px-4 space-y-3">
        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[--mocha]/60">Статистика</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {habitStats.map((stat) => (
          <div key={stat.label} className="group relative p-6 border border-[#D4C3B5]/30 rounded-sm bg-white/50 transition-all hover:bg-white flex flex-col items-center text-center">
            <span className="text-[12px] font-black uppercase tracking-[0.3em] text-[--mocha]/40 mb-3">{stat.label}</span>
            <div className="flex items-baseline gap-1">
              {loading ? (
                <span className="text-[--mocha]/40 italic text-sm">—</span>
              ) : (
                <>
                  <span className="text-3xl font-lora text-[--espresso] opacity-80">{stat.value}</span>
                  {(stat as { isPct?: boolean }).isPct && <span className="text-sm text-[--cappuccino] italic">%</span>}
                </>
              )}
            </div>
            <div className="w-full mt-4 space-y-2">
              <div className="h-[2px] w-full bg-stone-100 rounded-full overflow-hidden">
                <div
                  className={`${stat.color} h-full transition-all duration-[1500ms] ease-out`}
                  style={{ width: (stat as { isPct?: boolean }).isPct ? `${stat.value}%` : '100%' }}
                />
              </div>
              <p className="text-[8px] uppercase tracking-widest text-[--mocha]/30 font-bold">
                {stat.sub}
              </p>
            </div>
          </div>
        ))}
        </div>
      </section>

      {/* MAIN TRACKER GRID — Основной контент */}
      <section className="animate-in zoom-in duration-500 delay-200 px-4 space-y-4">
        <div className="border border-[#D4C3B5]/20 rounded-sm overflow-hidden bg-white/30 backdrop-blur-sm">
           <HabitTrackerGrid />
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleDownloadReport}
            disabled={pdfLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#D4C3B5]/50 rounded-sm text-[11px] uppercase tracking-widest font-bold text-[--espresso] hover:bg-white/60 transition-all disabled:opacity-50"
          >
            <FileDown size={16} />
            {pdfLoading ? 'Формируем…' : 'Скачать отчёт за неделю'}
          </button>
        </div>
      </section>

      {/* ГАЙД — В стиле дополнительных блоков Vision Board */}
      <section className="max-w-4xl mx-auto space-y-16 pt-10 px-4">
        <div className="text-center space-y-6">
          <h2 className="font-lora text-2xl text-[--espresso] italic opacity-80">Искусство маленьких шагов</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[--espresso]/70 text-[13px] leading-relaxed text-left">
            <div className="space-y-3">
               <h3 className="font-bold text-[--mocha] uppercase tracking-[0.2em] text-[12px] opacity-60">Философия</h3>
               <p>Стабильность важнее интенсивности. Десять минут чтения каждый день эффективнее, чем три часа раз в неделю.</p>
            </div>
            <div className="grid grid-cols-1 gap-y-2 italic text-[--mocha]/60 border-l border-[#D4C3B5]/30 pl-6">
              <p>— связывай новое со старым</p>
              <p>— готовь среду заранее</p>
              <p>— не пропускай дважды</p>
              <p>— празднуй малые победы</p>
            </div>
          </div>
        </div>

        {/* ПРАВИЛО 2 МИНУТ — Дизайн как у "Affirmations" */}
        <div className="border-2 border-dashed border-[#D4C3B5]/40 p-10 text-center space-y-6 bg-[#F9F7F2]/40 rounded-sm">
          <span className="text-[14px] font-black uppercase tracking-[0.4em] text-[--espresso]/40">Правило двух минут</span>
          <p className="font-lora text-lg text-[--mocha] italic max-w-lg mx-auto leading-relaxed">
            «Любая новая привычка должна занимать не более двух минут. Цель — просто начать».
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-6 pt-4">
            {[
              { l: 'Упрощай', q: 'Надень кроссовки' },
              { l: 'Автоматизируй', q: 'Вода у кровати' },
              { l: 'Отслеживай', q: 'Визуальный дофамин' }
            ].map((item, i) => (
              <div key={i} className="space-y-1">
                <p className="text-[12px] font-bold text-[--espresso] uppercase tracking-widest">{item.l}</p>
                <p className="text-[10px] text-espresso-400 italic font-lora">{item.q}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER — Копия VisionPage */}
      <footer className="text-center pt-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-stone-50/50 rounded-full border border-stone-100">
          <span className="text-[9px] font-bold uppercase tracking-widest text-stone-300">
            Solace — Твой ритуал дисциплины
          </span>
        </div>
      </footer>
    </div>
  )
}