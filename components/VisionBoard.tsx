'use client'
import React, { useState, useRef } from 'react'

export default function VisionBoard() {
  const [images, setImages] = useState<{ [key: number]: string }>({})
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({})

  const boards = [
    { title: 'My Body Goals', bg: 'bg-[#F9F4F0]' },
    { title: 'Dream Life', bg: 'bg-[#EBD9D0]', rowSpan: 'md:row-span-2' },
    { title: 'Career Vision', bg: 'bg-[#F9F4F0]' },
    { title: 'Relationships', bg: 'bg-[#D6DDD0]' },
    { title: 'Financial Freedom', bg: 'bg-[#F4E4E1]' },
    { title: 'Learning & Growth', bg: 'bg-[#F4E4E1]' },
    { title: 'Travel & Adventure', bg: 'bg-[#F9F7F2]', rowSpan: 'md:row-span-2' },
    { title: 'Home Sanctuary', bg: 'bg-[#D6DDD0]' },
    { title: 'Mindfulness & Peace', bg: 'bg-[#F9F4F0]' },
    { title: 'Giving Back', bg: 'bg-[#F4E4E1]' },
  ]

  const handleImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImages(prev => ({ ...prev, [index]: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-2 md:p-4 h-screen flex flex-col justify-center animate-in fade-in duration-1000">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 h-full max-h-[90vh] auto-rows-fr">
        {boards.map((item, i) => (
          <div 
            key={i} 
            onClick={() => fileInputRefs.current[i]?.click()}
            className={`${item.bg} ${item.rowSpan || ''} relative border border-[#D4C3B5]/40 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-solid hover:bg-white transition-all overflow-hidden rounded-sm`}
          >
            <input 
              type="file" 
              ref={el => { fileInputRefs.current[i] = el }}
              className="hidden" 
              accept="image/*"
              onChange={(e) => handleImageUpload(i, e)}
            />

            {/* Слой с загруженным фото */}
            {images[i] && (
              <div className="absolute inset-0 w-full h-full z-0">
                <img src={images[i]} alt={item.title} className="w-full h-full object-cover" />
                
                {/* Оверлей при наведении: показываем и название, и кнопку */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-[2px] z-20 p-4">
                  <h3 className="font-lora italic text-white text-xs md:text-lg mb-2">
                    {item.title}
                  </h3>
                  <span className="text-white text-[8px] font-bold uppercase tracking-widest border border-white/40 px-3 py-1 rounded-full bg-white/10">
                    Сменить фото
                  </span>
                </div>
              </div>
            )}

            {/* Слой для пустой карточки (без фото) */}
            {!images[i] && (
              <div className="relative z-10 p-2 opacity-80 group-hover:opacity-100 transition-opacity">
                <h3 className="font-lora italic text-xs md:text-lg text-[--espresso] leading-tight">
                  {item.title}
                </h3>
                <p className="text-[7px] md:text-[9px] uppercase tracking-widest text-[#A69080] mt-1 opacity-50">
                  Добавить образ
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}