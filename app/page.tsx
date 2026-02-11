'use client'
import React, { useState, useEffect } from 'react'
import FocusOfDay from '../components/FocusOfDay'
import MoodTracker from '../components/MoodTracker'
import WheelOfLife from '../components/WheelOfLife'
import { getRandomQuote } from '../lib/quotes'

export default function Page() {
  const [quoteData, setQuoteData] = useState({ text: "", author: "" })
  const today = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })

  useEffect(() => {
    setQuoteData(getRandomQuote())
  }, [])

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20 pt-6 px-4">
      
      {/* HEADER — Идентичен HabitsPage */}
      <header className="px-4">
        <h1 className="font-lora text-4xl text-[--espresso]">
          Привет — сегодня <span className="text-[--cappuccino]">{today}</span>
        </h1>
        <div className="h-1 w-20 bg-[--sand] mt-4" />
        <div className="mt-4 max-w-xl">
          <p className="text-[--mocha] italic text-sm mt-4 opacity-80 leading-relaxed border-l-2 border-[--sand] pl-4">
            «{quoteData.text}»
          </p>
          <p className="text-[10px] uppercase tracking-widest text-[--cappuccino] mt-3 ml-6 font-bold opacity-70">
            — {quoteData.author}
          </p>
        </div>
      </header>

      {/* ОСНОВНОЙ КОНТЕНТ — Сетка блоков */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-4">
        
        {/* ЛЕВАЯ КОЛОНКА (70%) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Мысли в моменте — стиль карточек HabitsPage */}
          <section className="p-6 border border-[#D4C3B5]/30 rounded-sm bg-white/50 transition-all hover:bg-white shadow-sm">
            <h3 className="font-black text-[12px] uppercase tracking-[0.3em] text-[--mocha]/40 mb-6 flex items-center gap-2">
               Мысли в моменте
            </h3>
            <div className="space-y-4">
              <label className="font-lora text-lg text-[--espresso] italic opacity-80 block">
                За что ты благодарен(-на) сейчас?
              </label>
              <textarea
                className="w-full bg-transparent border-b border-[#D4C3B5]/20 focus:border-[--sand] outline-none py-2 text-[14px] text-[--espresso] transition-all resize-none min-h-[40px]"
                placeholder="Начни писать здесь..."
                rows={1}
                onInput={(e) => {
                  e.currentTarget.style.height = 'auto';
                  e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                }}
              />
            </div>
          </section>

          {/* Состояние */}
          <section className="p-6 border border-[#D4C3B5]/30 rounded-sm bg-white/50 transition-all hover:bg-white shadow-sm">
            <h3 className="font-black text-[12px] uppercase tracking-[0.3em] text-[--mocha]/40 mb-6">
              Состояние
            </h3>
            <MoodTracker />
          </section>

          {/* FocusOfDay — Контейнер для выравнивания */}
          <div className="border border-[#D4C3B5]/20 rounded-sm overflow-hidden bg-white/30 backdrop-blur-sm shadow-sm">
             <FocusOfDay />
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА (50%) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Главное на сегодня */}
          <section className="p-6 border border-[#D4C3B5]/30 rounded-sm bg-white/50 transition-all hover:bg-white shadow-sm">
            <h3 className="font-black text-[12px] uppercase tracking-[0.3em] text-[--mocha]/40 mb-6">
              Главное на сегодня
            </h3>
            <div className="space-y-6">
              {[1, 2, 3].map(num => (
                <div key={num} className="flex items-start gap-4 border-b border-[#D4C3B5]/10 pb-2 group">
                  <span className="font-lora text-[--cappuccino] opacity-50 mt-1">{num}.</span>
                  <textarea 
                    placeholder="Напиши цель..." 
                    rows={1}
                    className="bg-transparent w-full text-[14px] text-[--espresso] outline-none resize-none overflow-hidden pt-1.5 font-lora"
                    onInput={(e) => {
                      e.currentTarget.style.height = 'auto';
                      e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                    }}
                  />
                </div>
              ))}
              <p className="text-[9px] uppercase tracking-[0.2em] text-[--cappuccino] font-bold mt-4 opacity-60">
                Фокус на важном, а не на срочном
              </p>
            </div>
          </section>

          {/* Баланс */}
          <section className="p-6 border border-[#D4C3B5]/30 rounded-sm bg-white/50 transition-all hover:bg-white shadow-sm flex flex-col items-center">
            <h3 className="font-black text-[12px] uppercase tracking-[0.3em] text-[--mocha]/40 mb-8 self-start">
              Колесо баланса
            </h3>
            <div className="w-full max-w-[200px] pb-4 opacity-90">
              <WheelOfLife compact={true} />
            </div>
          </section>

        </div>
      </div>

      {/* FOOTER — Копия HabitsPage/VisionPage */}
      <footer className="text-center pt-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-stone-50/50 rounded-full border border-stone-100">
          <span className="text-[9px] font-bold uppercase tracking-widest text-stone-300">
            Solace — Твой ритуал осознанности
          </span>
        </div>
      </footer>
    </div>
  )
}