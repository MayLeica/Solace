'use client'
import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ImageIcon, Loader2 } from 'lucide-react'

const BOARDS = [
  { title: 'My Body Goals', bg: '#F9F4F0' },
  { title: 'Dream Life', bg: '#EBD9D0' },
  { title: 'Career Vision', bg: '#F9F4F0' },
  { title: 'Relationships', bg: '#D6DDD0' },
  { title: 'Financial Freedom', bg: '#F4E4E1' },
  { title: 'Learning & Growth', bg: '#F4E4E1' },
  { title: 'Travel & Adventure', bg: '#F9F7F2' },
  { title: 'Home Sanctuary', bg: '#D6DDD0' },
  { title: 'Mindfulness & Peace', bg: '#F9F4F0' },
  { title: 'Giving Back', bg: '#F4E4E1' },
]

export default function VisionBoardMasonry() {
  const [images, setImages] = useState<{ [key: number]: string }>({})
  const [loading, setLoading] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({})

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('vision_board_images')
    if (saved) {
      try { setImages(JSON.parse(saved)) } catch (e) { console.error("Data corrupted") }
    }
  }, [])

  // Функция сжатия изображения
  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.src = base64Str
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 1200 // Оптимально для четкости и веса
        let width = img.width
        let height = img.height

        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width
          width = MAX_WIDTH
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        // Сжимаем в JPEG с качеством 0.7
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      }
    })
  }

  const handleImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLoading(index)
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = reader.result as string
        const compressed = await compressImage(base64)
        
        const newImages = { ...images, [index]: compressed }
        
        try {
          localStorage.setItem('vision_board_images', JSON.stringify(newImages))
          setImages(newImages)
        } catch (error) {
          alert("Память переполнена. Попробуйте удалить другие фото.")
        }
        setLoading(null)
      }
      reader.readAsDataURL(file)
    }
  }

  if (!mounted) return null

  return (
    <div className="max-w-6xl mx-auto p-3 md:p-8 mb-20">

      <div className="columns-2 lg:columns-3 gap-3 md:gap-4 space-y-3 md:space-y-4">
        {BOARDS.map((item, i) => (
          <motion.div
            layout
            key={i}
            onClick={() => !loading && fileInputRefs.current[i]?.click()}
            className="break-inside-avoid relative overflow-hidden rounded-sm border border-[#D4C3B5]/30 group cursor-pointer bg-white/40 transition-all hover:border-[#D4C3B5]/80 shadow-sm"
          >
            <input
              type="file"
              ref={el => { fileInputRefs.current[i] = el }}
              className="hidden"
              accept="image/*"
              onChange={(e) => handleImageUpload(i, e)}
            />

            {loading === i && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/60 backdrop-blur-sm">
                <Loader2 className="animate-spin text-[--mocha]" size={24} />
              </div>
            )}

            {images[i] ? (
              <div className="relative w-full">
                <img src={images[i]} alt={item.title} className="w-full h-auto block" />
                <div className="md:absolute md:inset-0 md:bg-black/20 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 md:backdrop-blur-[2px] flex flex-col items-center justify-center p-3 md:p-6 text-center bg-white/95 md:bg-transparent">
                  <h3 className="font-lora italic text-[--espresso] md:text-white text-[12px] md:text-xl md:mb-3">
                    {item.title}
                  </h3>
                  {/* Кнопка "Изменить" */}
                  <div className="hidden md:block px-4 py-2 border border-white/40 rounded-sm bg-white/10 text-white text-[9px] uppercase tracking-widest font-black">
                    Изменить
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full min-h-[120px] md:min-h-[180px] p-4 flex flex-col items-center justify-center text-center"
                   style={{ backgroundColor: `${item.bg}60` }}>
                <ImageIcon size={18} className="text-[--mocha]/30 mb-3" />
                <h3 className="font-lora italic text-[14px] md:text-lg text-[--espresso] mb-1">{item.title}</h3>
                <p className="text-[8px] md:text-[9px] uppercase tracking-[0.2em] font-black text-[--mocha]/40">Добавить</p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}