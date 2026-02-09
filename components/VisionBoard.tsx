'use client'
import React, { useState } from 'react'

type Card = { id:string, url:string, title:string }

export default function VisionBoard(){
  const [cards, setCards] = useState<Card[]>([
    {id:'1', url:'https://picsum.photos/seed/1/200/120', title:'Путешествие'},
    {id:'2', url:'https://picsum.photos/seed/2/200/120', title:'Карьера'},
    {id:'3', url:'https://picsum.photos/seed/3/200/120', title:'Навыки'}
  ])

  return (
    <div>
      <h3 className="font-serif text-lg mb-2">Vision Board (2026)</h3>
      <div className="grid grid-cols-1 gap-3">
        <div className="grid grid-cols-3 gap-2">
          {cards.map(c=>(
            <div key={c.id} className="rounded-lg overflow-hidden shadow-sm">
              <img src={c.url} alt={c.title} className="w-full h-24 object-cover" />
              <div className="p-2 text-sm">{c.title}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
