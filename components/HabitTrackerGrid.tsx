'use client'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2 } from 'lucide-react'

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)
const COLORS = ['#D6DDD0', '#EBD9D0', '#F4E4E1', '#F9F4F0', '#D4C3B5']

export default function HabitTrackerGrid() {
  const [habits, setHabits] = useState([])
  const [logs, setLogs] = useState({})
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedHabits = localStorage.getItem('habits')
    const savedLogs = localStorage.getItem('habitLogs')
    if (savedHabits) {
      setHabits(JSON.parse(savedHabits))
    } else {
      setHabits([
        { id: '1', name: 'Медитация', color: '#D6DDD0' },
        { id: '2', name: 'Чтение', color: '#EBD9D0' }
      ])
    }
    if (savedLogs) setLogs(JSON.parse(savedLogs))
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('habits', JSON.stringify(habits))
      localStorage.setItem('habitLogs', JSON.stringify(logs))
    }
  }, [habits, logs, mounted])

  const toggle = (habitId, day) => {
    const key = `${habitId}_${day}`
    setLogs(prev => ({ ...prev, [key]: !prev[key] }))
  }

  if (!mounted) return null

  return (
    <div className="w-full bg-white/20 backdrop-blur-sm p-4 md:p-8 rounded-sm border border-stone-50">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h3 className="font-lora text-2xl md:text-3xl text-[--espresso] opacity-90">Трекер привычек</h3>
          <p className="text-[--mocha] text-[9px] uppercase tracking-[0.3em] font-bold mt-2 opacity-50">Февраль • 2026</p>
        </div>
        <button 
          onClick={() => setHabits([...habits, { id: Date.now().toString(), name: 'Новая привычка', color: COLORS[habits.length % COLORS.length] }])}
          className="group flex items-center gap-2 px-4 py-2 border border-[#D4C3B5]/40 rounded-full hover:bg-[--espresso] hover:text-white transition-all duration-300"
        >
          <Plus size={14} className="group-hover:rotate-90 transition-transform duration-300" />
          <span className="text-[10px] uppercase tracking-widest font-bold">Добавить</span>
        </button>
      </div>

      <div className="w-full">
        <div className="grid grid-cols-[120px_1fr_40px] md:grid-cols-[180px_1fr_60px] items-center mb-6 border-b border-[#D4C3B5]/30 pb-4">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[--mocha]/60">Привычка</span>
          <div className="grid grid-cols-[repeat(31,minmax(0,1fr))] gap-[2px] md:gap-1 px-2">
            {DAYS.map(d => (
              <span key={d} className="text-center text-[8px] md:text-[10px] font-bold text-[--espresso]/60">
                {d}
              </span>
            ))}
          </div>
          <span className="text-right text-[9px] font-black uppercase tracking-[0.2em] text-[--mocha]/60">Итог</span>
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {habits.map((h) => (
              <motion.div 
                key={h.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="grid grid-cols-[120px_1fr_40px] md:grid-cols-[180px_1fr_60px] items-center group"
              >
                <div className="flex items-center gap-2 pr-4">
                  <button 
                    onClick={() => setHabits(habits.filter(item => item.id !== h.id))}
                    className="opacity-0 group-hover:opacity-100 text-[#D4C3B5] hover:text-red-400 transition-all shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                  <input 
                    className="bg-transparent outline-none text-[12px] md:text-[14px] w-full text-[--espresso] font-lora italic border-b border-transparent focus:border-[#D4C3B5]/40 transition-colors"
                    value={h.name}
                    onChange={(e) => setHabits(habits.map(item => item.id === h.id ? {...item, name: e.target.value} : item))}
                  />
                </div>

                <div className="grid grid-cols-[repeat(31,minmax(0,1fr))] gap-[2px] md:gap-1 px-2">
                  {DAYS.map(d => {
                    const key = `${h.id}_${d}`
                    const active = !!logs[key]
                    return (
                      <button
                        key={key}
                        onClick={() => toggle(h.id, d)}
                        className={`aspect-square w-full rounded-sm border transition-all duration-300 ${
                          active 
                            ? 'border-[#D4C3B5]/60 scale-105 shadow-sm' 
                            : 'border-[#D4C3B5]/50 bg-stone-50/20 hover:border-[#D4C3B5]/80'
                        }`}
                        style={{ 
                          backgroundColor: active ? `${h.color}cc` : '' 
                        }}
                      />
                    )
                  })}
                </div>

                <div className="text-right">
                  <span className="text-[12px] md:text-[14px] font-lora italic text-[--espresso]/80">
                    {DAYS.filter(d => logs[`${h.id}_${d}`]).length}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}