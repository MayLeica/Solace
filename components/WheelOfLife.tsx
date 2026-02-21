'use client'
import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

const SEGMENTS = [
  { id: 'health', name: 'Здоровье' },
  { id: 'career', name: 'Карьера, работа' },
  { id: 'finance', name: 'Финансы' },
  { id: 'relat', name: 'Отношения' },
  { id: 'growth', name: 'Развитие' },
  { id: 'spirit', name: 'Ментальное состояние' },
  { id: 'rest', name: 'Отдых' },
  { id: 'env', name: 'Окружение (Пространство)' },
]

export default function WheelOfLife({ compact = false }: { compact?: boolean }) {
  const [values, setValues] = useState<{ [key: string]: number }>({
    health: 5, career: 5, finance: 5, relat: 5, growth: 5, spirit: 5, rest: 5, env: 5
  })
  const [loading, setLoading] = useState(true)

  // --- DB: debounce save (чтобы не спамить БД при перетаскивании range)
  const saveTimerRef = useRef<number | null>(null)
  const lastSavedRef = useRef<string>('') // JSON строка последнего сохранения

  // 1. Загрузка последнего снимка из истории wheel_entries
  useEffect(() => {
    async function loadWheelData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('wheel_entries')
          .select('values, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)

        if (error) throw error

        const latest = data?.[0]?.values
        if (latest) {
          setValues(latest)
          lastSavedRef.current = JSON.stringify(latest)
        } else {
          // если записей нет — считаем текущие дефолтные значения "последними сохраненными"
          lastSavedRef.current = JSON.stringify(values)
        }
      } catch (err) {
        console.error('Ошибка загрузки колеса:', err)
      } finally {
        setLoading(false)
      }
    }
    loadWheelData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 2. Сохранение в историю (insert), дебаунс 700мс
  const scheduleSaveSnapshot = async (newValues: { [key: string]: number }) => {
    // чистим прошлый таймер
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current)
    }

    saveTimerRef.current = window.setTimeout(async () => {
      try {
        const serialized = JSON.stringify(newValues)
        // не сохраняем если по факту ничего не изменилось
        if (serialized === lastSavedRef.current) return

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase
          .from('wheel_entries')
          .insert({ user_id: user.id, values: newValues })

        if (error) throw error

        lastSavedRef.current = serialized
      } catch (err: any) {
        console.error('Ошибка сохранения снимка:', err?.message ?? err)
      }
    }, 700)
  }

  // 3. UI update + save
  const updateValue = async (id: string, val: number) => {
    const newValues = { ...values, [id]: val }
    setValues(newValues) // Мгновенное обновление в UI
    await scheduleSaveSnapshot(newValues)
  }

  const max = 10
  const angle = (2 * Math.PI) / SEGMENTS.length
  const radius = 85

  const points = SEGMENTS.map((s, i) => {
    const r = (values[s.id] / max) * radius
    const a = i * angle - Math.PI / 2
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    return `${x},${y}`
  }).join(' ')

  if (loading && !compact) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-[--cappuccino]" />
      </div>
    )
  }

  if (compact) {
    return (
      <div className="w-full bg-white/40 p-4 rounded-[3rem] backdrop-blur-sm shadow-inner transition-all hover:bg-white/60">
        <svg viewBox="-100 -100 200 200" className="w-full h-auto drop-shadow-xl overflow-visible">
          {[0.2, 0.4, 0.6, 0.8, 1].map((step) => (
            <circle key={step} r={step * radius} fill="none" stroke="rgba(166,138,115,0.15)" strokeWidth="0.5" />
          ))}
          <motion.polygon
            points={points}
            animate={{ points }}
            transition={{ type: 'spring', stiffness: 60, damping: 15 }}
            style={{ fill: 'rgba(212,163,115,0.4)', stroke: 'var(--cappuccino)', strokeWidth: 2, strokeLinejoin: 'round' }}
          />
        </svg>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 mb-20 animate-in fade-in duration-1000">
      <header className="mb-2">
        <Link href="/" className="flex items-center gap-2 text-[--mocha]/40 hover:text-[--espresso] transition-all group w-fit">
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">На главную</span>
        </Link>
      </header>

      <div className="flex flex-col items-center">
        <div className="w-full max-w-[420px] flex flex-col items-center">
          <svg viewBox="-120 -120 240 240" className="w-full h-auto drop-shadow-2xl overflow-visible">
            {[0.2, 0.4, 0.6, 0.8, 1].map((step) => (
              <circle key={step} r={step * radius} fill="none" stroke="rgba(166,138,115,0.1)" strokeWidth="0.5" />
            ))}
            {SEGMENTS.map((s, i) => {
              const a = i * angle - Math.PI / 2
              const tx = Math.cos(a) * (radius + 22)
              const ty = Math.sin(a) * (radius + 22)
              return (
                <g key={i}>
                  <line x1="0" y1="0" x2={Math.cos(a) * radius} y2={Math.sin(a) * radius} stroke="rgba(166,138,115,0.15)" strokeWidth="0.5" />
                  <text
                    x={tx} y={ty}
                    fontSize="7.5"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="fill-[--mocha] uppercase tracking-tighter opacity-70 font-sans"
                  >
                    {s.name}
                  </text>
                </g>
              )
            })}
            <motion.polygon
              points={points}
              animate={{ points }}
              transition={{ type: 'spring', stiffness: 40, damping: 12 }}
              style={{ fill: 'rgba(212,163,115,0.35)', stroke: 'var(--cappuccino)', strokeWidth: 1.5, strokeLinejoin: 'round' }}
            />
          </svg>
        </div>

        <div className="w-full mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-2">
            {SEGMENTS.map((s) => (
              <div key={s.id} className="group">
                <div className="flex justify-between items-end mb-1 px-1">
                  <span className="text-[12px] font-bold text-[--espresso] block uppercase tracking-wider">
                    {s.name}
                  </span>
                  <span className="font-lora text-base text-[--espresso] opacity-80">
                    {values[s.id]}
                  </span>
                </div>
                <input
                  type="range" min="1" max="10" step="1"
                  value={values[s.id]}
                  onChange={(e) => updateValue(s.id, parseInt(e.target.value))}
                  className="w-full h-[1px] bg-[#D4C3B5]/40 rounded-full appearance-none cursor-pointer accent-[--cappuccino] hover:bg-[#D4C3B5]/60 transition-colors"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}