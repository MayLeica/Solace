'use client'
import React, { useState, useEffect } from 'react'

const QUESTIONS = {
  morning: 'За что ты благодарен(на) этим утром?',
  evening: 'Что сегодня получилось хорошо?',
  deep: 'Что мешает тебе сейчас быть в покое?'
}

export default function MindfulnessBox() {
  const [category, setCategory] = useState<'morning'|'evening'|'deep'>('morning')
  const [text, setText] = useState('')

  useEffect(()=> {
    const key = 'reflection_'+category
    const stored = localStorage.getItem(key) || ''
    setText(stored)
  },[category])

  function save(v:string){
    setText(v)
    const key = 'reflection_'+category
    localStorage.setItem(key, v)
  }

  return (
    <div className="glass p-6 rounded-3xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-serif text-xl">Рефлексия</h3>
        <div className="flex gap-2">
          <button onClick={()=>setCategory('morning')} className={'px-2 py-1 rounded-md text-sm ' + (category==='morning' ? 'bg-sand/40' : '')}>Утро</button>
          <button onClick={()=>setCategory('evening')} className={'px-2 py-1 rounded-md text-sm ' + (category==='evening' ? 'bg-sand/40' : '')}>Вечер</button>
          <button onClick={()=>setCategory('deep')} className={'px-2 py-1 rounded-md text-sm ' + (category==='deep' ? 'bg-sand/40' : '')}>Глубина</button>
        </div>
      </div>

      <div>
        <div className="text-sm mb-2">{QUESTIONS[category]}</div>
        <textarea
          rows={4}
          value={text}
          onChange={(e)=>save(e.target.value)}
          onBlur={(e)=>save(e.target.value)}
          className="w-full bg-transparent resize-none no-outline"
          placeholder="Напиши сюда своё размышление..."
        />
      </div>
    </div>
  )
}
