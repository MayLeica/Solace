'use client'
import React, { useState, useEffect } from 'react'

export default function FocusOfDay() {
  const [focus, setFocus] = useState('')
  useEffect(() => {
    const stored = localStorage.getItem('focusOfDay') || ''
    setFocus(stored)
  }, [])
  function save(v: string) {
    setFocus(v)
    localStorage.setItem('focusOfDay', v)
  }
  return (
    <div className="glass p-6 rounded-3xl">
      <h2 className="font-serif text-2xl mb-2">Focus of the day</h2>
      <input
        className="w-full bg-transparent placeholder-coffee/60 text-coffee text-lg no-outline"
        placeholder="Одна фраза, на что хочешь сосредоточиться сегодня..."
        value={focus}
        onChange={(e) => save(e.target.value)}
      />
    </div>
  )
}
