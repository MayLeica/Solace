'use client'
import React from 'react'
import WheelOfLife from '../../components/WheelOfLife'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function WheelPage() {
  return (
    <main className="min-h-screen bg-[#FDFCFB] pb-20">
      <div className="max-w-5xl mx-auto py-12 px-4 space-y-16 animate-in fade-in duration-1000">
        
        {/* ГРАФИК КОЛЕСА */}
        <section>
          <WheelOfLife compact={false} />
        </section>

        {/* ОПИСАНИЕ И ПСИХОЛОГИЯ */}
        <section className="max-w-3xl mx-auto space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-3">
              <h2 className="font-black uppercase tracking text-xl text-[--espresso] ">Что такое «Колесо баланса»?</h2>
              <div className="h-1 w-16 bg-[--sand]" />
              <p className="text-[13px] text-[--espresso]/70 leading-relaxed">
                Колесо баланса жизни — это простой психологический инструмент, который показывает, насколько гармонично распределено ваше внимание между ключевыми сферами жизни.
              </p>
            </div>
            
            <div className="bg-[#F9F7F2]/60 p-8 border-l-2 border-[--sand] space-y-4">
              <span className="text-[12px] font-black uppercase tracking-[0.3em] text-[--mocha]/40">С точки зрения психологии:</span>
              <ul className="space-y-3 italic text-[13px] text-[--mocha]">
                <li>— увидеть реальность, а не иллюзию занятости</li>
                <li>— понять, где энергия утекает</li>
                <li>— заметить внутренний конфликт («работа 9, здоровье 3»)</li>
              </ul>
            </div>
          </div>
        </section>

        {/* МИНИ-ГАЙД */}
        <section className="border-2 border-dashed border-[#D4C3B5]/40 p-10 bg-[#F9F7F2]/30 rounded-sm">
          <div className="text-center mb-10">
            <span className="text-[12px] font-black uppercase tracking-[0.4em] text-[--espresso]/40">Мини-гайд по работе</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { n: '01', t: '', d: 'Оцените сферы честно, а не «как должно быть».' },
              { n: '02', t: '', d: 'Не ищите идеальные десятки — ищите дисбаланс.' },
              { n: '03', t: '', d: 'Выберите 1–2 зоны для фокуса на ближайшие 30 дней.' },
              { n: '04', t: '', d: 'Задайте вопрос: «Что конкретно поднимет сферу на +1 балл?»' }
            ].map((item, i) => (
              <div key={i} className="space-y-2">
                <p className="text-[11px] font-black text-[--espresso] uppercase tracking-widest opacity-30">{item.n}</p>
                <p className="font-lora italic text-[14px] text-[--espresso]">{item.t}</p>
                <p className="text-[12px] text-[--mocha]/60 leading-snug">{item.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* КРИТЕРИИ ОЦЕНКИ */}
        <section className="max-w-3xl mx-auto space-y-10 pt-10">
          <h3 className="font-black text-[11px] uppercase tracking-[0.3em] text-[--mocha]/40 text-center">Критерии оценки по шкале</h3>
          
          <div className="grid grid-cols-1 gap-y-2">
            {[
              { name: 'Здоровье', r1: 'Я живу в режиме усталости и игнорирую сигналы тела.', r2: 'Я функционирую нормально, но не всегда забочусь о себе системно.', r3: 'Моё тело — источник энергии, а забота о нём стала образом жизни.' },
              { name: 'Финансы', r1: 'Деньги вызывают тревогу и ощущение нестабильности.', r2: 'У меня есть финансовая опора, но нет полной уверенности в будущем.', r3: 'Деньги работают на меня и дают ощущение свободы.' },
              { name: 'Развитие', r1: 'Я чувствую застой и не вижу роста.', r2: 'Я развиваюсь периодически, но без глубокой системы.', r3: 'Я постоянно расширяю себя и ощущаю прогресс.' },
              { name: 'Отдых', r1: 'Я не умею отдыхать и чувствую хроническое напряжение.', r2: 'Я отдыхаю, но не всегда по-настоящему восстанавливаюсь.', r3: 'Отдых наполняет меня и возвращает ресурс.' },
              { name: 'Карьера / Работа', r1: 'Работа не приносит смысла и забирает энергию.', r2: 'Я стабильно работаю, но не всегда чувствую вдохновение.', r3: 'Моя работа отражает мои ценности и даёт ощущение реализации.' },
              { name: 'Отношения', r1: 'Я чувствую дистанцию, холод или конфликты.', r2: 'В отношениях есть тепло, но не всегда глубина.', r3: 'Я ощущаю эмоциональную безопасность и взаимную поддержку.' },
              { name: 'Ментальное состояние', r1: 'Мои мысли и эмоции часто управляют мной.', r2: 'Я в целом стабилен(на), но иногда теряю внутренний баланс.', r3: 'Я осознанно управляю своим состоянием и сохраняю спокойствие.' },
              { name: 'Окружение', r1: 'Беспорядок дома, некомфортный район, отсутствие уюта.', r2: 'В целом комфортно, но есть раздражающие факторы.', r3: 'Мой дом — мое место силы. Мне нравится эстетика вещей вокруг.' },
            ].map((item, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start border-t border-[#D4C3B5]/10 pt-8 group">
                <div className="md:col-span-1">
                  <span className="text-[11px] font-black text-[--espresso] uppercase tracking-wider">{item.name}</span>
                </div>
                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-tighter text-red-800/30">1—3</p>
                    <p className="text-[12px] text-[--mocha]/70 italic leading-snug">{item.r1}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-tighter text-[--sand]">4—7</p>
                    <p className="text-[12px] text-[--mocha]/70 italic leading-snug">{item.r2}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-tighter text-green-800/30">8—10</p>
                    <p className="text-[12px] text-[--mocha]/70 italic leading-snug">{item.r3}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="text-center pt-20">
          <div className="inline-flex items-center gap-2 px-6 py-2 bg-stone-50/50 rounded-full border border-stone-100 shadow-sm">
             <span className="text-[9px] font-bold uppercase tracking-widest text-stone-300">Баланс — это не цель, а способ движения</span>
          </div>
        </footer>

      </div>
    </main>
  )
}