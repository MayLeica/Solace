'use client'
import React, { useState } from 'react'
import { motion } from 'framer-motion'

const SEGMENTS = [
  { name: 'Здоровье', desc: 'Сон, питание, энергия' },
  { name: 'Работа', desc: 'Продуктивность и цели' },
  { name: 'Отношения', desc: 'Близкие и друзья' },
  { name: 'Финансы', desc: 'Доходы и траты' },
  { name: 'Развитие', desc: 'Обучение и хобби' },
  { name: 'Отдых', desc: 'Досуг и ментальное' }
]

interface WheelProps {
  compact?: boolean;
}

export default function WheelOfLife({ compact = false }: WheelProps) {
  const [levels, setLevels] = useState<number[]>([6, 5, 7, 4, 6, 5])

  const setLevel = (i: number, v: number) => {
    const next = [...levels]
    next[i] = v
    setLevels(next)
  }

  const max = 10
  const angle = (2 * Math.PI) / SEGMENTS.length
  const radius = 85 // Увеличили для четкости

  // Расчет точек полигона
  const points = levels.map((lv, i) => {
    const r = (lv / max) * radius
    const a = i * angle - Math.PI / 2
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    return `${x},${y}`
  }).join(' ')

  return (
    <div className={`${compact ? 'w-full' : 'space-y-8 animate-in'}`}>
      {!compact && (
        <h3 className="font-lora text-2xl text-[--espresso] mb-6 italic text-center md:text-left">
          Колесо жизненного баланса
        </h3>
      )}

      <div className={`flex flex-col ${compact ? 'items-center' : 'md:flex-row md:items-start'} gap-8`}>
        
        {/* Визуальная часть (SVG) */}
        <div className={`relative ${compact ? 'w-full max-w-[240px]' : 'w-full max-w-[320px] mx-auto md:mx-0'} bg-white/40 p-4 rounded-[3rem] backdrop-blur-sm shadow-inner`}>
          <svg viewBox="-100 -100 200 200" className="w-full h-auto drop-shadow-xl">
            {/* Сетка уровней (круги) */}
            {[0.2, 0.4, 0.6, 0.8, 1].map((step) => (
              <circle
                key={step}
                r={step * radius}
                fill="none"
                stroke="rgba(166,138,115,0.15)"
                strokeWidth="0.5"
              />
            ))}
            
            {/* Оси */}
            {SEGMENTS.map((_, i) => {
              const a = i * angle - Math.PI / 2
              return (
                <line
                  key={i}
                  x1="0" y1="0"
                  x2={Math.cos(a) * radius}
                  y2={Math.sin(a) * radius}
                  stroke="rgba(166,138,115,0.2)"
                  strokeWidth="0.5"
                />
              )
            })}

            {/* Активная область (Полигон) */}
            <motion.polygon
              points={points}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{ 
                fill: 'rgba(212,163,115,0.4)', 
                stroke: 'var(--cappuccino)', 
                strokeWidth: 2,
                strokeLinejoin: 'round'
              }}
            />

            {/* Подписи категорий (только если не компактный вид) */}
            {!compact && SEGMENTS.map((s, i) => {
              const a = i * angle - Math.PI / 2
              const x = Math.cos(a) * (radius + 12)
              const y = Math.sin(a) * (radius + 12)
              return (
                <text
                  key={i}
                  x={x} y={y}
                  fontSize="7"
                  fontWeight="bold"
                  textAnchor="middle"
                  className="fill-[--espresso] font-['Manrope'] uppercase tracking-tighter"
                >
                  {s.name}
                </text>
              )
            })}
          </svg>
        </div>

        {/* Настройки (Ползунки) — скрыты в компактном виде */}
        {!compact && (
          <div className="flex-1 w-full space-y-5 bg-white/30 p-8 rounded-[2.5rem] border border-white/50">
            {SEGMENTS.map((s, i) => (
              <div key={i} className="group">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <span className="text-sm font-bold text-[--espresso] block leading-none">{s.name}</span>
                    <span className="text-[10px] text-[--cappuccino] italic">{s.desc}</span>
                  </div>
                  <span className="text-sm font-bold text-[--espresso]">{levels[i]}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={levels[i]}
                  onChange={(e) => setLevel(i, Number(e.target.value))}
                  className="w-full h-1.5 bg-[--latte] rounded-lg appearance-none cursor-pointer accent-[--cappuccino]"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}