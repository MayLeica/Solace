'use client'
import React from 'react'
import VisionBoard from '../../components/VisionBoard'

export default function VisionPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-1 animate-in fade-in duration-700 pb-20 pt-6 px-4">
      
      {/* HEADER В ОБЩЕМ СТИЛЕ ПРИЛОЖЕНИЯ */}
      <header className="px-4">
        <h1 className="font-lora text-4xl text-[--espresso]">Vision Board</h1>
        <div className="h-1 w-20 bg-[--sand] mt-4" />
        <p className="text-[--mocha] italic text-sm mt-4 opacity-80 leading-relaxed border-l-2 border-[--sand] pl-4 max-w-xl">
          Твое будущее создается тем, что ты делаешь сегодня. Визуализируй свои мечты, чтобы они стали реальностью.
        </p>
      </header>

      {/* ОСНОВНОЙ КОМПОНЕНТ ДОСКИ */}
      <section className="animate-in zoom-in duration-500 delay-200">
        <VisionBoard />
      </section>

      {/* FOOTER */}
      <footer className="text-center pt-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-stone-50/50 rounded-full border border-stone-100">
          <span className="text-[9px] font-bold uppercase tracking-widest text-stone-300">
            Solace — Фокус на важном
          </span>
        </div>
      </footer>
    </div>
  )
}