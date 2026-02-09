'use client'
import HabitTrackerGrid from '../../components/HabitTrackerGrid'

export default function HabitsPage() {
  return (
    <div className="space-y-8 animate-in">
      <header>
        <h1 className="font-lora text-4xl font-medium text-[--espresso]">Мои привычки</h1>
        <p className="text-[--mocha] italic border-l-2 border-[--cappuccino] pl-4 mt-2">
          Дисциплина — это форма заботы о себе.
        </p>
      </header>

      {/* Вызываем наш компонент */}
      <HabitTrackerGrid />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
        <div className="glass p-6 bg-[--cream]/50">
          <h4 className="text-[--espresso] font-bold text-xs uppercase tracking-widest mb-2">Совет</h4>
          <p className="text-sm text-[--mocha]">Не старайся внедрить всё сразу. Начни с малого, но делай это каждый день.</p>
        </div>
        <div className="glass p-6 bg-[--cream]/50">
          <h4 className="text-[--espresso] font-bold text-xs uppercase tracking-widest mb-2">Статистика</h4>
          <p className="text-sm text-[--mocha]">Твоя самая стабильная привычка на этой неделе: <span className="text-[--cappuccino] font-bold">Вода</span></p>
        </div>
      </div>
    </div>
  )
}