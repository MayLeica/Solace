'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import FocusOfDay from '../components/FocusOfDay'
import MoodTracker from '../components/MoodTracker'
import WheelOfLife from '../components/WheelOfLife'
import { getRandomQuote } from '../lib/quotes'

export default function Page() {
  const [quoteData, setQuoteData] = useState({ text: "", author: "" })
  const today = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
  
  // --- ЛОГИКА LOCALSTORAGE ---
  
  // Состояния для главной
  const [gratitude, setGratitude] = useState("")
  const [completed, setCompleted] = useState([false, false, false])
  const [goals, setGoals] = useState(["", "", ""])

  // 1. Инициализация при загрузке
  useEffect(() => {
    setQuoteData(getRandomQuote())
    
    const savedDate = localStorage.getItem('solace_last_visit')
    const currentDate = new Date().toDateString()

    // ПРОВЕРКА: Если наступил новый день — обнуляем всё
    if (savedDate !== currentDate) {
      localStorage.removeItem('solace_gratitude')
      localStorage.removeItem('solace_goals')
      localStorage.removeItem('solace_completed')
      localStorage.setItem('solace_last_visit', currentDate)
    } else {
      // Иначе загружаем сохраненное
      setGratitude(localStorage.getItem('solace_gratitude') || "")
      const savedGoals = localStorage.getItem('solace_goals')
      if (savedGoals) setGoals(JSON.parse(savedGoals))
      const savedComp = localStorage.getItem('solace_completed')
      if (savedComp) setCompleted(JSON.parse(savedComp))
    }
  }, [])

  // 2. Сохранение при каждом изменении
  useEffect(() => {
    if (gratitude) localStorage.setItem('solace_gratitude', gratitude)
    localStorage.setItem('solace_goals', JSON.stringify(goals))
    localStorage.setItem('solace_completed', JSON.stringify(completed))
  }, [gratitude, goals, completed])

  const toggleTask = (index: number) => {
    const newCompleted = [...completed];
    newCompleted[index] = !newCompleted[index];
    setCompleted(newCompleted);
  };

  const updateGoal = (index: number, value: string) => {
    const newGoals = [...goals];
    newGoals[index] = value;
    setGoals(newGoals);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20 pt-6 px-4">
      
      {/* HEADER */}
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-4">
        
        {/* ЛЕВАЯ КОЛОНКА */}
        <div className="lg:col-span-7 space-y-6">
          <section className="p-6 border border-[#D4C3B5]/30 rounded-sm bg-white/50 transition-all hover:bg-white shadow-sm">
            <h3 className="font-black text-[12px] uppercase tracking-[0.3em] text-[--mocha]/40 mb-6 flex items-center gap-2">
               Мысли в моменте
            </h3>
            <div className="space-y-4">
              <label className="font-lora text-lg text-[--espresso] italic opacity-80 block">
                За что ты благодарен(-на) сейчас?
              </label>
              <textarea
                value={gratitude}
                onChange={(e) => setGratitude(e.target.value)}
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

          <section className="p-6 border border-[#D4C3B5]/30 rounded-sm bg-white/50 transition-all hover:bg-white shadow-sm">
            <h3 className="font-black text-[12px] uppercase tracking-[0.3em] text-[--mocha]/40 mb-6">
              Состояние
            </h3>
            <MoodTracker />
          </section>

          <div className="border border-[#D4C3B5]/20 rounded-sm overflow-hidden bg-white/30 backdrop-blur-sm shadow-sm">
             <FocusOfDay />
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА */}
        <div className="lg:col-span-5 space-y-6">
          <section className="p-6 border border-[#D4C3B5]/30 rounded-sm bg-white/50 transition-all hover:bg-white shadow-sm">
            <h3 className="font-black text-[12px] uppercase tracking-[0.3em] text-[--mocha]/40 mb-6">
              Главное на сегодня
            </h3>
            <div className="space-y-6">
              {[0, 1, 2].map(idx => (
                <div key={idx} className="flex items-start gap-4 border-b border-[#D4C3B5]/10 pb-2 group">
                  <span className="font-lora text-[--cappuccino] opacity-50 mt-1">{idx + 1}.</span>
                  
                  <textarea 
                    value={goals[idx]}
                    onChange={(e) => updateGoal(idx, e.target.value)}
                    placeholder="Напиши цель..." 
                    rows={1}
                    className={`flex-1 bg-transparent text-[14px] text-[--espresso] outline-none resize-none overflow-hidden pt-1.5 font-lora transition-all duration-500 ${completed[idx] ? 'line-through opacity-40' : 'opacity-100'}`}
                    onInput={(e) => {
                      e.currentTarget.style.height = 'auto';
                      e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                    }}
                  />

                  <div 
                    onClick={() => toggleTask(idx)}
                    className={`w-4 h-4 mt-2 border rounded-sm cursor-pointer flex items-center justify-center transition-all duration-300 ${completed[idx] ? 'bg-[#D6DDD0]/40 border-[#D6DDD0]' : 'border-[#D4C3B5]'}`}
                  >
                    <svg 
                      className={`w-3.5 h-3.5 text-[--espresso] transition-all duration-500 transform ${completed[idx] ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor" 
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              ))}
              <p className="text-[9px] uppercase tracking-[0.2em] text-[--cappuccino] font-bold mt-4 opacity-60">
                Фокус на важном, а не на срочном
              </p>
            </div>
          </section>

          <section className="p-6 border border-[#D4C3B5]/30 rounded-sm bg-white/50 transition-all hover:bg-white shadow-sm flex flex-col items-center">
            <h3 className="font-black text-[12px] uppercase tracking-[0.3em] text-[--mocha]/40 mb-8 self-start">
              Колесо баланса
            </h3>
            <Link 
              href="/wheel" 
              className="w-full max-w-[200px] pb-4 opacity-90 transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <WheelOfLife compact={true} />
            </Link>
          </section>
        </div>
      </div>

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