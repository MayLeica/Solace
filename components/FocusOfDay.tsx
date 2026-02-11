'use client'
import React, { useState, useEffect, useRef } from 'react'

export default function FocusOfDay() {
  const [focus, setFocus] = useState('')
  const textareaRef = useRef(null)

  useEffect(() => {
    const stored = localStorage.getItem('focusOfDay') || ''
    setFocus(stored)
  }, [])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [focus])

  function save(v) {
    setFocus(v)
    localStorage.setItem('focusOfDay', v)
  }

  const handleInput = (e) => {
    const target = e.target
    target.style.height = 'auto'
    target.style.height = target.scrollHeight + 'px'
    save(target.value)
  }

  return (
    <section className="h-full flex flex-col justify-between p-6 border border-[#D4C3B5]/30 rounded-sm bg-white/50 transition-all hover:bg-white shadow-sm">
      <div>
        {/* Метка — в точном соответствии с HabitsPage и Мыслями в моменте */}
        <h3 className="font-black text-[12px] uppercase tracking-[0.3em] text-[--mocha]/40 mb-6 flex items-center gap-2">
          Внутренний компас
        </h3>

        <div className="space-y-4">
          <label className="font-lora text-lg text-[--espresso] italic opacity-80 block">
            На чём сегодня фокус?
          </label>
          
          <div className="relative group">
            <textarea
              ref={textareaRef}
              className="w-full bg-transparent border-b border-[#D4C3B5]/20 py-2 text-base font-lora text-[--espresso] outline-none focus:border-[--sand] transition-all placeholder:text-stone-600 placeholder: resize-none overflow-hidden min-h-[40px]"
              placeholder="Одна важная мысль или фраза..."
              value={focus}
              rows={1}
              onChange={handleInput}
            />
          </div>
        </div>
      </div>

      {/* Нижний текст — выровнен по нижней границе как в других блоках */}
      <div className="mt-8">
        <p className="text-[9px] uppercase tracking-[0.2em] text-[--cappuccino] font-bold opacity-60">
          Напиши это, чтобы не потерять себя в суете
        </p>
      </div>
    </section>
  )
}