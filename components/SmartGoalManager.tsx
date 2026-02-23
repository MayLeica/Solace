'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, ChevronUp, Check, ListTodo, ChevronDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'

type GoalPeriod = 'месяц' | 'год' | '5 лет' | 'все'

interface SubTask {
  id: string
  title: string
  completed: boolean
}

export interface Goal {
  id: string
  title: string
  date: string
  progress: number
  period: GoalPeriod
  completed: boolean
  subtasks: SubTask[]
}

const LS_KEY = 'solace_goals_v1'

type Props = {
  onSelectGoal: (id: string) => void
  goals: Goal[]
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>
}

export default function SmartGoalManager({ onSelectGoal, goals, setGoals }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<GoalPeriod>('все')
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null)

  const [userId, setUserId] = useState<string | null>(null)
  const isAuthed = !!userId

  // поля формы
  const [formTitle, setFormTitle] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formPeriod, setFormPeriod] = useState<Exclude<GoalPeriod, 'все'>>('месяц')

  // --- helpers: localStorage
  const loadFromLocalStorage = () => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (!raw) return null
      return JSON.parse(raw) as Goal[]
    } catch {
      return null
    }
  }

  const saveToLocalStorage = (data: Goal[]) => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(data))
    } catch {}
  }

  // --- helpers: mapping <-> supabase
  const fromDb = (row: any): Goal => ({
    id: row.id,
    title: row.title ?? '',
    date: row.deadline ? String(row.deadline) : '',
    progress: typeof row.progress === 'number' ? row.progress : 0,
    period: (row.period as GoalPeriod) ?? 'месяц',
    completed: !!row.is_completed,
    subtasks: Array.isArray(row.subtasks) ? row.subtasks : [],
  })

  const toDb = (g: Goal) => ({
    title: g.title,
    period: g.period === 'все' ? 'месяц' : g.period,
    deadline: g.date || null,
    progress: g.progress ?? 0,
    is_completed: !!g.completed,
    subtasks: g.subtasks ?? [],
  })

  // 1) определить user + загрузить цели
  useEffect(() => {
    let alive = true

    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!alive) return
      setUserId(user?.id ?? null)

      // если нет юзера — из localStorage (или пусто)
      if (!user) {
        const ls = loadFromLocalStorage()
        setGoals(ls ?? [])
        return
      }

      // если есть юзер — из Supabase
      const { data, error } = await supabase
        .from('global_goals')
        .select('id,title,period,deadline,progress,is_completed,subtasks,created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!alive) return
      if (error) {
        console.error('Ошибка загрузки целей:', error.message)
        return
      }
      setGoals((data ?? []).map(fromDb))
    }

    init()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 2) если не авторизован — сохраняем в localStorage при изменениях
  useEffect(() => {
    if (!isAuthed) saveToLocalStorage(goals)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goals])

  // --- DB ops
  const dbInsertGoal = async (g: Goal) => {
    if (!userId) return null
    const { data, error } = await supabase
      .from('global_goals')
      .insert({ user_id: userId, ...toDb(g) })
      .select('id,title,period,deadline,progress,is_completed,subtasks,created_at')
      .single()

    if (error) {
      console.error('Ошибка добавления цели:', error.message)
      return null
    }
    return data ? fromDb(data) : null
  }

  const dbUpdateGoal = async (id: string, patch: Partial<Goal>) => {
    if (!userId) return
    const current = goals.find((x) => x.id === id)
    if (!current) return

    const merged: Goal = { ...current, ...patch }
    const { error } = await supabase
      .from('global_goals')
      .update(toDb(merged))
      .eq('id', id)
      .eq('user_id', userId)

    if (error) console.error('Ошибка обновления цели:', error.message)
  }

  const dbDeleteGoal = async (id: string) => {
    if (!userId) return
    const { error } = await supabase.from('global_goals').delete().eq('id', id).eq('user_id', userId)

    if (error) console.error('Ошибка удаления цели:', error.message)
  }

  // --- logic (UI unchanged)
  const updateSubtasks = async (goalId: string, newSubtasks: SubTask[]) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          const completedCount = newSubtasks.filter((s) => s.completed).length
          const total = newSubtasks.length
          const newProgress = total > 0 ? Math.round((completedCount / total) * 100) : g.progress
          return {
            ...g,
            subtasks: newSubtasks,
            progress: newProgress,
            completed: total > 0 ? newProgress === 100 : g.completed,
          }
        }
        return g
      })
    )

    const g = goals.find((x) => x.id === goalId)
    if (!g) return

    const completedCount = newSubtasks.filter((s) => s.completed).length
    const total = newSubtasks.length
    const newProgress = total > 0 ? Math.round((completedCount / total) * 100) : g.progress
    const newCompleted = total > 0 ? newProgress === 100 : g.completed

    if (isAuthed) {
      await dbUpdateGoal(goalId, { subtasks: newSubtasks, progress: newProgress, completed: newCompleted })
    }
  }

  const toggleComplete = async (id: string) => {
    const target = goals.find((g) => g.id === id)
    if (!target) return

    const nextCompleted = !target.completed
    const nextProgress = nextCompleted ? 100 : 0

    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, completed: nextCompleted, progress: nextProgress } : g)))

    if (isAuthed) {
      await dbUpdateGoal(id, { completed: nextCompleted, progress: nextProgress })
    }
  }

  const addGoalFromForm = async () => {
    const title = formTitle.trim()
    if (!title) return

    const tempGoal: Goal = {
      id: `tmp_${Date.now()}`,
      title,
      date: formDate || '',
      progress: 0,
      period: formPeriod,
      completed: false,
      subtasks: [],
    }

    // optimistic UI
    setGoals((prev) => [tempGoal, ...prev])

    setFormTitle('')
    setFormDate('')
    setFormPeriod('месяц')
    setShowForm(false)

    if (!isAuthed) return

    const saved = await dbInsertGoal(tempGoal)
    if (!saved) return

    // заменить temp на настоящий id
    setGoals((prev) => prev.map((g) => (g.id === tempGoal.id ? saved : g)))
  }

  const deleteGoal = async (id: string) => {
    setGoals((prev) => prev.filter((item) => item.id !== id))
    if (isAuthed) await dbDeleteGoal(id)
  }

  const filteredGoals = useMemo(() => {
    return filter === 'все' ? goals : goals.filter((g) => g.period === filter)
  }, [filter, goals])

  return (
    <div className="p-6 md:p-8 space-y-8 bg-white/20 backdrop-blur-sm">
      {/* ПАНЕЛЬ УПРАВЛЕНИЯ */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex p-1 border border-[#D4C3B5]/30 rounded-sm bg-white/40 w-full md:w-auto">
          {(['все', 'месяц', 'год', '5 лет'] as GoalPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setFilter(p)}
              className={`px-4 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                filter === p ? 'bg-[--espresso] text-white shadow-sm' : 'text-[--mocha]/40 hover:text-[--mocha]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full md:w-auto border border-[--espresso] text-[--espresso] hover:bg-[--espresso] hover:text-white px-6 py-2 rounded-sm flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-[0.3em] transition-all active:scale-95"
        >
          {showForm ? <ChevronUp size={12} /> : <Plus size={12} />}
          {showForm ? 'Закрыть' : 'Новая цель'}
        </button>
      </div>

      {/* ФОРМА */}
      {showForm && (
        <div className="border border-[#D4C3B5]/30 rounded-sm p-6 bg-white/60 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[--mocha]/40">Намерение</label>
              <input
                className="w-full bg-white/80 p-4 rounded-sm border border-[#D4C3B5]/20 outline-none focus:border-[--sand] transition-all font-lora italic text-[--espresso] placeholder:text-stone-300 shadow-sm"
                placeholder="Напиши цель..."
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[--mocha]/40">Дедлайн</label>
                <input
                  type="date"
                  className="w-full bg-white/80 p-4 rounded-sm border border-[#D4C3B5]/20 text-[13px] text-[--espresso] outline-none shadow-sm focus:border-[--sand]"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[--mocha]/40">Горизонт</label>
                <select
                  className="w-full bg-white/80 p-4 rounded-sm border border-[#D4C3B5]/20 text-[13px] text-[--espresso] outline-none cursor-pointer shadow-sm focus:border-[--sand] appearance-none"
                  value={formPeriod}
                  onChange={(e) => setFormPeriod(e.target.value as any)}
                >
                  <option>месяц</option>
                  <option>год</option>
                  <option>5 лет</option>
                </select>
              </div>
            </div>

            <button
              onClick={addGoalFromForm}
              className="w-full py-4 bg-[--espresso] text-white rounded-sm font-black uppercase text-[10px] tracking-[0.3em] transition-all hover:bg-[--espresso]/90 mt-2 shadow-sm"
            >
              Утвердить цель
            </button>
          </div>
        </div>
      )}

      {/* СПИСОК ЦЕЛЕЙ */}
      <div className="grid gap-6">
        {filteredGoals.map((g) => (
          <div
            key={g.id}
            onClick={() => {
              setExpandedGoal(expandedGoal === g.id ? null : g.id)
              onSelectGoal(g.id)
            }}
            className={`group flex flex-col border border-[#D4C3B5]/30 bg-white/40 rounded-sm overflow-hidden transition-all shadow-sm cursor-pointer hover:bg-white/80 ${
              expandedGoal === g.id ? 'border-[--sand]' : ''
            }`}
          >
            <div className={`p-6 flex flex-col md:flex-row justify-between items-center gap-6 ${g.completed ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-6 flex-1 min-w-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleComplete(g.id)
                  }}
                  className={`w-6 h-6 rounded-sm border flex items-center justify-center shrink-0 transition-all ${
                    g.completed
                      ? 'bg-[#D6DDD0] border-[#D6DDD0] text-white'
                      : 'border-[#D4C3B5]/40 bg-white text-transparent hover:border-[--sand]'
                  }`}
                >
                  <Check size={14} strokeWidth={4} className={g.completed ? 'opacity-100' : 'opacity-0'} />
                </button>

                <div className="flex-1 min-w-0">
                  <h4 className={`font-lora text-lg italic leading-tight transition-all ${g.completed ? 'line-through text-stone-400' : 'text-[--espresso]'}`}>
                    {g.title}
                  </h4>
                  <div className="flex gap-4 mt-3 items-center">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[--mocha]/40">{g.period}</span>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[--cappuccino]/60">
                      до {g.date ? new Date(g.date).toLocaleDateString('ru-RU') : '—'}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[--sand] flex items-center gap-1.5">
                      <ListTodo size={10} />
                      {g.subtasks.length > 0 ? `${g.subtasks.filter((s) => s.completed).length}/${g.subtasks.length}` : 'план'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8 w-full md:w-auto">
                <div className="flex-1 md:w-40 space-y-2">
                  <div className="h-[2px] w-full bg-stone-100 overflow-hidden">
                    <div className={`h-full transition-all duration-1000 ${g.completed ? 'bg-[#D6DDD0]' : 'bg-[--sand]'}`} style={{ width: `${g.progress}%` }} />
                  </div>
                  <div className="text-[8px] font-black text-latte-300 uppercase tracking-widest text-right">{g.progress}%</div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteGoal(g.id)
                    }}
                    className="p-2 text-espresso-200 hover:text-red-300 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className={`transition-transform duration-300 text-latte-300 ${expandedGoal === g.id ? 'rotate-180 text-[--espresso]' : ''}`}>
                    <ChevronDown size={18} />
                  </div>
                </div>
              </div>
            </div>

            {/* План подзадач */}
            {expandedGoal === g.id && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="px-12 md:px-20 pb-10 pt-4 space-y-4 animate-in slide-in-from-top-2 duration-200 bg-stone-50/30 border-t border-[#D4C3B5]/40"
              >
                {g.subtasks.map((sub) => (
                  <div key={sub.id} className="flex items-center gap-3 group/task">
                    <button
                      onClick={() => {
                        const updated = g.subtasks.map((s) => (s.id === sub.id ? { ...s, completed: !s.completed } : s))
                        updateSubtasks(g.id, updated)
                      }}
                      className={`w-5 h-5 rounded-sm border flex items-center justify-center transition-all ${
                        sub.completed ? 'bg-[#D6DDD0] border-[#D6DDD0] text-mocha' : 'border-stone-200 bg-white group-hover/task:border-[--espresso]'
                      }`}
                    >
                      {sub.completed && <Check size={12} strokeWidth={4} />}
                    </button>
                    <span className={`font-lora italic text-[14px] transition-all ${sub.completed ? 'text-mocha-300 line-through' : 'text-[--espresso]/80'}`}>
                      {sub.title}
                    </span>
                  </div>
                ))}

                <div className="flex items-center gap-4 pt-6 mt-4 border-t border-[#D4C3B5]/10">
                  <Plus size={12} className="text-mocha" />
                  <input
                    className="text-[13px] font-lora italic outline-none flex-1 py-1 placeholder:text-mocha text-[--espresso]"
                    placeholder="Добавить новый шаг..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value) {
                        const newSub = { id: Date.now().toString(), title: e.currentTarget.value, completed: false }
                        updateSubtasks(g.id, [...g.subtasks, newSub])
                        e.currentTarget.value = ''
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}