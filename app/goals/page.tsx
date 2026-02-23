'use client'
import React, { useEffect, useMemo, useState } from 'react'
import SmartGoalManager from '../../components/SmartGoalManager'
import { supabase } from '../../lib/supabase'

type GoalPeriod = 'месяц' | 'год' | '5 лет' | 'все'

interface SubTask {
  id: string
  title: string
  completed: boolean
}

interface Goal {
  id: string
  title: string
  date: string
  progress: number
  period: GoalPeriod
  completed: boolean
  subtasks: SubTask[]
}

const LS_KEY = 'solace_goals_v1'

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [mounted, setMounted] = useState(false)

  // 1) Загрузка: если есть user -> Supabase, иначе -> пусто (или localStorage, если нужно)
  useEffect(() => {
    let alive = true
    setMounted(true)

    async function loadGoals() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!alive) return

        // НЕ залогинен → показываем пусто (без демо-целей)
        if (!user) {
          const raw = localStorage.getItem(LS_KEY)
          setGoals(raw ? JSON.parse(raw) : [])
          return
        }

        // Залогинен → Supabase (ВАЖНО: только его записи)
        const { data, error } = await supabase
          .from('global_goals')
          .select('id, title, period, deadline, progress, is_completed, subtasks, created_at, user_id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (!alive) return
        if (error) throw error

        const mapped: Goal[] = (data ?? []).map((g: any) => ({
          id: g.id,
          title: g.title ?? '',
          date: g.deadline ? String(g.deadline) : '',
          progress: typeof g.progress === 'number' ? g.progress : 0,
          period: (g.period as GoalPeriod) ?? 'год',
          completed: !!g.is_completed,
          subtasks: Array.isArray(g.subtasks) ? g.subtasks : [],
        }))

        setGoals(mapped)
      } catch (e) {
        console.error('Ошибка загрузки целей:', e)
        const raw = localStorage.getItem(LS_KEY)
        setGoals(raw ? JSON.parse(raw) : [])
      }
    }

    loadGoals()

    return () => {
      alive = false
    }
  }, [])

  // 2) Сохранение в localStorage только для гостей
  useEffect(() => {
    if (!mounted) return

    let alive = true

    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!alive) return

      if (!user) {
        localStorage.setItem(LS_KEY, JSON.stringify(goals))
      }
    })()

    return () => {
      alive = false
    }
  }, [goals, mounted])

  const stats = useMemo(() => {
    const periods = [
      { key: 'месяц', label: 'Этот месяц', color: 'bg-[#D6DDD0]' },
      { key: 'год', label: 'Текущий год', color: 'bg-[#EBD9D0]' },
      { key: '5 лет', label: 'Горизонт 5 лет', color: 'bg-[#F4E4E1]' },
    ]

    return periods.map((p) => {
      const filtered = goals.filter((g) => g.period === (p.key as GoalPeriod))
      const done = filtered.filter((g) => g.completed).length
      const total = filtered.length
      return {
        label: p.label,
        done,
        total,
        color: p.color,
        percent: total > 0 ? Math.round((done / total) * 100) : 0,
      }
    })
  }, [goals])

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20 pt-6 px-4">
      {/* HEADER — Синхронизирован с Habits/Vision */}
      <header className="px-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex-1">
          <h1 className="font-lora text-4xl text-[--espresso]">Намерения</h1>
          <div className="h-1 w-20 bg-[--sand] mt-4" />
          <p className="text-[--mocha] italic text-sm mt-4 opacity-80 leading-relaxed border-l-2 border-[--sand] pl-4 max-w-xl">
            «Большие перемены начинаются с маленьких, но осознанных шагов в плане действий».
          </p>
        </div>
        <div className="pb-1 px-4 md:px-0">
          <div className="text-left md:text-right space-y-1">
            <span className="text-[10px] font-black tracking-[0.3em] text-[--mocha]/40 uppercase">
              Активных целей
            </span>
            <p className="text-3xl font-lora text-[--espresso] opacity-80">
              {goals.filter((g) => !g.completed).length}
            </p>
          </div>
        </div>
      </header>

      {/* STATS — Карточки в стиле минимализма */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="group p-6 border border-[#D4C3B5]/30 rounded-sm bg-white/50 transition-all hover:bg-white flex flex-col items-center text-center shadow-sm"
          >
            <span className="text-[12px] font-black uppercase tracking-[0.3em] text-[--mocha]/40 mb-3">
              {stat.label}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-lora text-[--espresso] opacity-80">{stat.percent}</span>
              <span className="text-sm text-[--cappuccino] italic">%</span>
            </div>
            <div className="w-full mt-4 space-y-2">
              <div className="h-[2px] w-full bg-stone-100 rounded-full overflow-hidden">
                <div
                  className={`${stat.color} h-full transition-all duration-[1500ms] ease-out`}
                  style={{ width: `${stat.percent}%` }}
                />
              </div>
              <p className="text-[8px] uppercase tracking-widest text-[--mocha]/30 font-bold">
                {stat.done} из {stat.total} завершено
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* MAIN COMPONENT — В стандартном контейнере */}
      <main className="px-4">
        <div className="border border-[#D4C3B5]/20 rounded-sm overflow-hidden bg-white/30 backdrop-blur-sm shadow-sm">
          <SmartGoalManager onSelectGoal={() => {}} goals={goals} setGoals={setGoals} />
        </div>
      </main>

      {/* ГАЙД ПО ФОРМУЛИРОВАНИЮ — В стиле Vision Board */}
      <section className="max-w-4xl mx-auto space-y-16 pt-16 px-4">
        <div className="text-center space-y-8">
          <h2 className="font-lora text-3xl text-[--espresso] italic opacity-80">
            Как правильно формулировать цели и реально достигать их
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
            <div className="space-y-4">
              <h3 className="font-black text-[12px] uppercase tracking-[0.3em] text-[--mocha]/40">
                1. Почему важно уметь ставить цели
              </h3>
              <p className="text-[13px] text-[--espresso]/70 leading-relaxed">
                Цели — это не просто список желаний. Это навигатор, который помогает понять, куда двигаться и какие
                действия имеют смысл.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-y-2 italic text-[--mocha]/60 border-l border-[#D4C3B5]/30 pl-6 text-[13px]">
              <p>— становится легче принимать решения</p>
              <p>— появляется мотивация</p>
              <p>— повышается уверенность</p>
              <p>— результат достигается быстрее</p>
            </div>
          </div>
        </div>

        <div className="border-2 border-dashed border-[#D4C3B5]/40 p-10 bg-[#F9F7F2]/40 rounded-sm space-y-8">
          <div className="text-center">
            <span className="text-[14px] font-black uppercase tracking-[0.4em] text-[--espresso]/40">Метод SMART</span>
            <p className="text-[13px] text-[--mocha] italic mt-4 max-w-lg mx-auto leading-relaxed">
              SMART — это метод, помогающий превратить расплывчатые желания в понятные, выполнимые цели.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { l: 'Specific', q: 'Что именно ты хочешь получить?' },
              { l: 'Measurable', q: 'Как ты поймёшь, что достиг результата?' },
              { l: 'Achievable', q: 'Реалистично ли это сейчас?' },
              { l: 'Relevant', q: 'Зачем тебе это? Почему важно?' },
              { l: 'Time-bound', q: 'Какой конкретный срок?' },
            ].map((item, i) => (
              <div key={i} className="space-y-2 text-center md:text-left">
                <p className="text-[13px] font-black text-[--espresso] uppercase tracking-widest">{item.l}</p>
                <p className="text-[12px] text-[--mocha]/60 semibold font-lora leading-tight">{item.q}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-12 pt-6">
          <div className="space-y-6">
            <h3 className="font-black text-[12px] uppercase tracking-[0.3em] text-[--mocha]/40 text-center">
              Как составить цель по SMART за 5 шагов
            </h3>
            <div className="max-w-2xl mx-auto space-y-4 text-[13px] text-[--espresso]/70 border-y border-[#D4C3B5]/10 py-8">
              <p>
                <span className="font-black text-[--espresso] mr-2">01.</span> Назови желаемый результат. Например:
                «хочу больше зарабатывать».
              </p>
              <p>
                <span className="font-black text-[--espresso] mr-2">02.</span> Сделай конкретным. «Хочу увеличить доход».
              </p>
              <p>
                <span className="font-black text-[--espresso] mr-2">03.</span> Добавь измеримость. «Увеличить доход на
                20%».
              </p>
              <p>
                <span className="font-black text-[--espresso] mr-2">04.</span> Проверь достижимость. Например: повышение,
                новые навыки, поиск новых клиентов — это реально?
              </p>
              <p>
                <span className="font-black text-[--espresso] mr-2">05.</span> Добавь срок. «...в течение 3 месяцев».
              </p>
            </div>
          </div>

          <div className="bg-[--espresso] text-white/90 p-10 rounded-sm text-center space-y-4 shadow-xl">
            <span className="text-[10px] uppercase tracking-[0.4em] opacity-50 font-black">Готовая SMART-цель</span>
            <p className="font-lora text-2xl italic leading-relaxed">
              «Увеличить доход на 20% в течение 3 месяцев, улучшив навыки и расширив базу клиентов».
            </p>
          </div>
        </div>

        <div className="space-y-8 pt-10 border-t border-[#D4C3B5]/20">
          <h3 className="font-black text-[12px] uppercase tracking-[0.3em] text-[--mocha]/40 text-center">
            План и контроль
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-[13px] text-[--espresso]/70 leading-relaxed">
            <p>
              После формулировки цели — следующий шаг: разбить её на задачи. План должен включать конкретные шаги, сроки,
              необходимые ресурсы и критерии прогресса.
            </p>
            <p>
              Чтобы цели достигались, важно отслеживать движение. Методы контроля: трекер привычек, еженедельный отчёт
              самому себе, приложение для планирования или визуальная доска.
            </p>
          </div>
          <div className="pt-8 text-center">
            <p className="font-lora text-2xl text-[--espresso] italic opacity-80">
              Главное правило: измеряешь — значит управляешь.
            </p>
          </div>
        </div>
      </section>

      <footer className="text-center pt-20">
        <div className="inline-flex items-center gap-2 px-6 py-2 bg-stone-50/50 rounded-full border border-stone-100 shadow-sm">
          <span className="text-[9px] font-bold uppercase tracking-widest text-stone-300">
            Solace — Твой навигатор в мире целей
          </span>
        </div>
      </footer>
    </div>
  )
}