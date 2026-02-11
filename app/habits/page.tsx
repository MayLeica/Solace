'use client'
import React, { useMemo } from 'react'
import HabitTrackerGrid from '../../components/HabitTrackerGrid'

export default function HabitsPage() {
  const habitStats = useMemo(() => [
    { label: 'Сила воли', value: '85', sub: 'средний прогресс', color: 'bg-[#D6DDD0]' },
    { label: 'Дисциплина', value: '12', sub: 'дней без пропусков', color: 'bg-[#EBD9D0]' },
    { label: 'Фокус', value: '4', sub: 'активные привычки', color: 'bg-[#F4E4E1]' }
  ], [])

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20 pt-6 px-4">
      
      {/* HEADER — Полная синхронизация с Vision Board */}
      <header className="px-4">
        <h1 className="font-lora text-4xl text-[--espresso]">Привычки</h1>
        <div className="h-1 w-20 bg-[--sand] mt-4" />
        <p className="text-[--mocha] italic text-sm mt-4 opacity-80 leading-relaxed border-l-2 border-[--sand] pl-4 max-w-xl">
          «Дисциплина — это не ограничение свободы, а отсечение всего лишнего». С каждым маленьким шагом ты создаешь новую версию себя.
        </p>
      </header>

      {/* STATS — Карточки в стиле минимализма мудборда */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4">
        {habitStats.map((stat) => (
          <div key={stat.label} className="group relative p-6 border border-[#D4C3B5]/30 rounded-sm bg-white/50 transition-all hover:bg-white flex flex-col items-center text-center">
            <span className="text-[12px] font-black uppercase tracking-[0.3em] text-[--mocha]/40 mb-3">{stat.label}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-lora text-[--espresso] opacity-80">{stat.value}</span>
              {stat.label === 'Сила воли' && <span className="text-sm text-[--cappuccino] italic">%</span>}
            </div>
            <div className="w-full mt-4 space-y-2">
              <div className="h-[2px] w-full bg-stone-100 rounded-full overflow-hidden">
                <div 
                  className={`${stat.color} h-full transition-all duration-[1500ms] ease-out`} 
                  style={{ width: stat.label === 'Сила воли' ? `${stat.value}%` : '100%' }} 
                />
              </div>
              <p className="text-[8px] uppercase tracking-widest text-[--mocha]/30 font-bold">
                {stat.sub}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* MAIN TRACKER GRID — Основной контент */}
      <section className="animate-in zoom-in duration-500 delay-200 px-4">
        <div className="border border-[#D4C3B5]/20 rounded-sm overflow-hidden bg-white/30 backdrop-blur-sm">
           <HabitTrackerGrid />
        </div>
      </section>

      {/* ГАЙД — В стиле дополнительных блоков Vision Board */}
      <section className="max-w-4xl mx-auto space-y-16 pt-10 px-4">
        <div className="text-center space-y-6">
          <h2 className="font-lora text-2xl text-[--espresso] italic opacity-80">Искусство маленьких шагов</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[--espresso]/70 text-[13px] leading-relaxed text-left">
            <div className="space-y-3">
               <h3 className="font-bold text-[--mocha] uppercase tracking-[0.2em] text-[12px] opacity-60">Философия</h3>
               <p>Стабильность важнее интенсивности. Десять минут чтения каждый день эффективнее, чем три часа раз в неделю.</p>
            </div>
            <div className="grid grid-cols-1 gap-y-2 italic text-[--mocha]/60 border-l border-[#D4C3B5]/30 pl-6">
              <p>— связывай новое со старым</p>
              <p>— готовь среду заранее</p>
              <p>— не пропускай дважды</p>
              <p>— празднуй малые победы</p>
            </div>
          </div>
        </div>

        {/* ПРАВИЛО 2 МИНУТ — Дизайн как у "Affirmations" */}
        <div className="border-2 border-dashed border-[#D4C3B5]/40 p-10 text-center space-y-6 bg-[#F9F7F2]/40 rounded-sm">
          <span className="text-[14px] font-black uppercase tracking-[0.4em] text-[--espresso]/40">Правило двух минут</span>
          <p className="font-lora text-lg text-[--mocha] italic max-w-lg mx-auto leading-relaxed">
            «Любая новая привычка должна занимать не более двух минут. Цель — просто начать».
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-6 pt-4">
            {[
              { l: 'Упрощай', q: 'Надень кроссовки' },
              { l: 'Автоматизируй', q: 'Вода у кровати' },
              { l: 'Отслеживай', q: 'Визуальный дофамин' }
            ].map((item, i) => (
              <div key={i} className="space-y-1">
                <p className="text-[12px] font-bold text-[--espresso] uppercase tracking-widest">{item.l}</p>
                <p className="text-[10px] text-espresso-400 italic font-lora">{item.q}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER — Копия VisionPage */}
      <footer className="text-center pt-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-stone-50/50 rounded-full border border-stone-100">
          <span className="text-[9px] font-bold uppercase tracking-widest text-stone-300">
            Solace — Твой ритуал дисциплины
          </span>
        </div>
      </footer>
    </div>
  )
}