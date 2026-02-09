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
    <div className="space-y-6 animate-in pb-4">
      <header>
        <h1 className="font-lora text-3xl md:text-4xl font-medium text-[--espresso] leading-tight">
          Привет — сегодня <span className="text-[--cappuccino]">{today}</span>
        </h1>
        <div className="mt-4 max-w-xl">
          <p className="text-[--mocha] text-sm md:text-base italic border-l-2 border-[--cappuccino] pl-4 py-1">
            «{quoteData.text}»
          </p>
          <span className="text-[10px] uppercase tracking-widest text-[--cappuccino] ml-5 opacity-70">
            — {quoteData.author}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ЛЕВАЯ КОЛОНКА */}
        <div className="lg:col-span-7 space-y-6">
          <section className="glass p-6 bg-[--cream]">
            <h3 className="font-lora text-xl text-[--espresso] mb-4 italic">Мысли в моменте</h3>
            <div className="space-y-4">
              <label className="text-base text-[--espresso] font-medium block">За что ты благодарна сейчас?</label>
              <textarea 
                className="w-full bg-transparent border-b border-stone-200 focus:border-[--cappuccino] outline-none py-2 text-sm transition-colors resize-none"
                placeholder="Начни писать здесь..."
                rows={2}
              />
            </div>
          </section>

          <section className="glass p-6 bg-[--cream]">
            <h3 className="font-lora text-xl text-[--espresso] mb-6 italic">Состояние</h3>
            <MoodTracker />
          </section>

          <div className="glass bg-[--cream] overflow-hidden">
             <FocusOfDay />
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА */}
        <div className="lg:col-span-5 space-y-6">
          <section className="glass p-6 bg-[--cream]">
            <h3 className="font-lora text-xl text-[--espresso] mb-6 italic">Главное на сегодня</h3>
            <div className="space-y-4">
              {[1, 2, 3].map(num => (
                <div key={num} className="flex items-center gap-4 border-b border-stone-50 pb-1">
                  <span className="font-lora text-lg italic text-[--cappuccino] opacity-50">{num}.</span>
                  <input type="text" placeholder="Напиши цель..." className="bg-transparent w-full text-sm outline-none" />
                </div>
              ))}
              {/* ТА САМАЯ НАДПИСЬ */}
              <p className="text-[9px] uppercase tracking-[0.2em] text-[--cappuccino] font-bold mt-2 opacity-80">
                Фокус на важном, а не на срочном
              </p>
            </div>
          </section>

          <section className="glass p-6 bg-[--cream] flex flex-col items-center">
            <h3 className="font-lora text-xl text-[--espresso] mb-4 italic self-start">Баланс</h3>
            <div className="w-full max-w-[200px]">
              <WheelOfLife compact={true} />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}