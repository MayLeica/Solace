'use client'
import React, { useState, useEffect } from 'react'

const MOODS = ['😔','😐','🙂','😊','🤩']

export default function MoodTracker(){
  const [mood, setMood] = useState<number|null>(null)
  useEffect(()=> {
    const m = localStorage.getItem('todayMood')
    if (m) setMood(Number(m))
  },[])
  function pick(i:number){
    setMood(i)
    localStorage.setItem('todayMood', String(i))
  }
  return (
    <div>
      <h3 className="font-serif text-lg mb-2">Mood Tracker</h3>
      <div className="flex gap-2">
        {MOODS.map((mo, i)=>(
          <button key={i} onClick={()=>pick(i)} className={"px-3 py-2 rounded-xl text-lg no-outline " + (mood===i ? 'scale-105' : '')} aria-pressed={mood===i}>
            {mo}
          </button>
        ))}
      </div>
    </div>
  )
}
