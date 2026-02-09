'use client'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2 } from 'lucide-react'

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)
const COLORS = ['#A68A73', '#8A9A5B', '#B66A50', '#E29578', '#7D8491']

export default function HabitTrackerGrid() {
  const [habits, setHabits] = useState<any[]>([])
  const [logs, setLogs] = useState<Record<string, boolean>>({})
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedHabits = localStorage.getItem('habits')
    const savedLogs = localStorage.getItem('habitLogs')
    if (savedHabits) setHabits(JSON.parse(savedHabits))
    else setHabits([
      { id: '1', name: 'Утренняя медитация', color: '#A68A73' },
      { id: '2', name: 'Норма воды 2л', color: '#8A9A5B' }
    ])
    if (savedLogs) setLogs(JSON.parse(savedLogs))
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('habits', JSON.stringify(habits))
      localStorage.setItem('habitLogs', JSON.stringify(logs))
    }
  }, [habits, logs, mounted])

  const toggle = (habitId: string, day: number) => {
    const key = `${habitId}_${day}`
    setLogs(prev => ({ ...prev, [key]: !prev[key] }))
  }

  if (!mounted) return null

  return (
    <div className="glass p-6 md:p-10 bg-white/40 border border-white/20 w-full overflow-hidden shadow-sm">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="font-lora text-3xl text-[--espresso] italic leading-none">Трекер привычек</h3>
          <p className="text-[--cappuccino] text-[11px] uppercase tracking-[0.2em] font-bold mt-3">Февраль • 2026</p>
        </div>
        <button 
          onClick={() => setHabits([...habits, { id: Date.now().toString(), name: 'Новая привычка', color: COLORS[habits.length % COLORS.length] }])}
          className="flex items-center justify-center w-12 h-12 bg-[--espresso] text-white rounded-full hover:opacity-90 transition-all shadow-lg active:scale-95"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="relative overflow-x-auto pb-6 custom-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
        <div className="min-w-[1000px] md:w-full">
          
          {/* Шапка дней - Крупно и Четко */}
          <div className="flex items-center mb-4 border-b border-stone-200 pb-3">
            <div className="w-48 sticky left-0 z-20 bg-[#F9F7F2] text-[12px] font-bold text-[--espresso] uppercase tracking-widest pl-2">
              Привычка
            </div>
            <div className="flex-1 grid grid-cols-31 gap-1">
              {DAYS.map(d => (
                <div key={d} className="text-center text-[14px] font-black text-[--espresso] w-full">
                  {d}
                </div>
              ))}
            </div>
            <div className="w-16 text-right text-[12px] font-bold text-[--espresso] uppercase tracking-widest pr-2">Итог</div>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {habits.map((h) => (
                <motion.div 
                  key={h.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="group flex items-center hover:bg-white/30 transition-all rounded-lg py-1"
                >
                  <div className="w-48 sticky left-0 z-20 bg-[#F9F7F2]/90 backdrop-blur-md flex items-center gap-3 pl-2 pr-4">
                    <button 
                      onClick={() => setHabits(habits.filter(item => item.id !== h.id))}
                      className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500 transition-all shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                    <input 
                      className="bg-transparent outline-none text-[15px] w-full text-[--espresso] font-bold focus:border-b-2 border-[--cappuccino]"
                      value={h.name}
                      onChange={(e) => setHabits(habits.map(item => item.id === h.id ? {...item, name: e.target.value} : item))}
                    />
                  </div>

                  {/* Сетка - Повышенная контрастность */}
                  <div className="flex-1 grid grid-cols-31 gap-1">
                    {DAYS.map(d => {
                      const key = `${h.id}_${d}`
                      const active = !!logs[key]
                      return (
                        <button
                          key={key}
                          onClick={() => toggle(h.id, d)}
                          className="aspect-square w-full rounded-md border-2 transition-all duration-200"
                          style={{ 
                            backgroundColor: active ? `${h.color}99` : 'rgba(231, 229, 228, 0.5)', // 99 это ~60% прозрачности
                            borderColor: active ? h.color : '#d6d3d1' // Контрастный серый контур stone-300
                          }}
                        />
                      )
                    })}
                  </div>

                  <div className="w-16 text-right pr-2">
                    <span className="text-[15px] font-black text-[--espresso] font-mono">
                      {DAYS.filter(d => logs[`${h.id}_${d}`]).length}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}