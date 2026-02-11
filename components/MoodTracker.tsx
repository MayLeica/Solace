'use client'
import React, { useState, useEffect } from 'react'

interface MoodState {
  label: string
  icon: string
  color: string
  textColor: string
}

const MOOD_STATES: MoodState[] = [
  { label: 'Замедление', icon: '🍃', color: '#D6DDD0', textColor: '#5F6D5B' },
  { label: 'Баланс', icon: '⚖️', color: '#EBD9D0', textColor: '#8C7A70' },
  { label: 'Тишина', icon: '☁️', color: '#F0F2F5', textColor: '#707D8C' }, 
  { label: 'Рефлексия', icon: '🌙', color: '#E2E6EF', textColor: '#6B7A8F' },
  { label: 'Поток', icon: '✨', color: '#F4E4E1', textColor: '#A6807A' },
  { label: 'Гармония', icon: '🌸', color: '#F9EBEF', textColor: '#946E77' },
  { label: 'Энергия', icon: '☀️', color: '#F9F1D5', textColor: '#8E8256' },
  { label: 'Уют', icon: '🕯️', color: '#F2E9E1', textColor: '#968475' },
  { label: 'Ясность', icon: '💎', color: '#E0F0F4', textColor: '#5B7D87' },
  { label: 'Творчество', icon: '🎨', color: '#F2E6FF', textColor: '#7E6B8F' },
  { label: 'Принятие', icon: '🌊', color: '#DCEBDE', textColor: '#5C7A63' }
]

export default function MoodTracker() {
  const [mood, setMood] = useState<number | null>(null)

  useEffect(() => {
    const m = localStorage.getItem('todayMood')
    if (m !== null) {
      const savedIndex = Number(m)
      if (savedIndex >= 0 && savedIndex < MOOD_STATES.length) {
        setMood(savedIndex)
      }
    }
  }, [])

  function pick(i: number) {
    setMood(i)
    localStorage.setItem('todayMood', String(i))
  }

  return (
    <section className="p-6 border border-[#D4C3B5]/30 rounded-sm bg-white/50 transition-all hover:bg-white shadow-sm">
      <div className="flex flex-wrap gap-3">
        {MOOD_STATES.map((state, i) => (
          <button
            key={i}
            onClick={() => pick(i)}
            style={{ 
              backgroundColor: mood === i ? state.color : 'transparent',
              borderColor: mood === i ? state.color : 'rgba(212, 195, 181, 0.2)'
            }}
            className={`
              flex items-center gap-3 px-4 py-2 border rounded-sm transition-all duration-300
              ${mood === i ? 'shadow-sm translate-y-[-2px]' : 'hover:border-[#D4C3B5]/60'}
            `}
          >
            <span className="text-sm opacity-80">{state.icon}</span>
            <span 
              style={{ color: mood === i ? state.textColor : 'var(--espresso)' }}
              className={`text-[13px] font-lora italic transition-colors ${mood === i ? 'opacity-100' : 'opacity-60'}`}
            >
              {state.label}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}