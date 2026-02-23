'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ImageIcon, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

const BUCKET = 'vision-board-images'
const LS_KEY = 'vision_board_images'

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

type ImagesMap = Record<number, string>

export default function VisionBoardMasonry() {
  const [images, setImages] = useState<ImagesMap>({})
  const [loading, setLoading] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({})

  // --- helpers
  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.src = base64Str
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 1400 // можно 1200/1400 — норм для качества
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
        resolve(canvas.toDataURL('image/jpeg', 0.75))
      }
    })
  }

  const base64ToBlob = async (base64: string) => {
    const res = await fetch(base64)
    return await res.blob()
  }

  const loadFromLocalStorage = () => {
    const saved = localStorage.getItem(LS_KEY)
    if (!saved) return
    try {
      setImages(JSON.parse(saved))
    } catch {
      // ignore corrupted
    }
  }

  const saveToLocalStorage = (next: ImagesMap) => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(next))
    } catch {
      // memory overflow etc.
    }
  }

  const buildStoragePath = (uid: string, index: number) => `${uid}/board_${index}.jpg`

  // --- load from DB for authed user
  const loadFromDb = async (uid: string) => {
    // 1) get rows
    const { data, error } = await supabase
      .from('vision_board_images')
      .select('board_index, file_path')
      .eq('user_id', uid)

    if (error) {
      console.error('VisionBoard load DB error:', error)
      return
    }

    // 2) build signed urls
    const next: ImagesMap = {}

    await Promise.all(
      (data ?? []).map(async (row: any) => {
        const idx = Number(row.board_index)
        const path = String(row.file_path)

        const { data: signed, error: signedErr } = await supabase
          .storage
          .from(BUCKET)
          .createSignedUrl(path, 60 * 60) // 1 hour

        if (signedErr) {
          console.error('VisionBoard signed url error:', signedErr)
          return
        }

        if (signed?.signedUrl) next[idx] = signed.signedUrl
      })
    )

    setImages(next)
  }

  // initial mount + session check
  useEffect(() => {
    setMounted(true)

    ;(async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) console.error('auth.getUser error:', error)

      if (!user) {
        setUserId(null)
        loadFromLocalStorage()
        return
      }

      setUserId(user.id)
      await loadFromDb(user.id)
    })()
  }, [])

  const handleImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(index)

    try {
      // read file -> base64
      const base64: string = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      // compress -> blob
      const compressed = await compressImage(base64)
      const blob = await base64ToBlob(compressed)

      // GUEST MODE
      if (!userId) {
        const next = { ...images, [index]: compressed }
        setImages(next)
        saveToLocalStorage(next)
        setLoading(null)
        return
      }

      // AUTH MODE: upload to storage
      const path = buildStoragePath(userId, index)

      const uploadRes = await supabase.storage.from(BUCKET).upload(path, blob, {
        contentType: 'image/jpeg',
        upsert: true, // overwrite
      })

      if (uploadRes.error) {
        console.error('VisionBoard upload error:', uploadRes.error)
        setLoading(null)
        return
      }

      // upsert row in table
      const { error: upsertErr } = await supabase
        .from('vision_board_images')
        .upsert(
          {
            user_id: userId,
            board_index: index,
            title: BOARDS[index]?.title ?? null,
            file_path: path,
          },
          { onConflict: 'user_id,board_index' }
        )

      if (upsertErr) {
        console.error('VisionBoard DB upsert error:', upsertErr)
        setLoading(null)
        return
      }

      // refresh signed url just for this image (fast)
      const { data: signed, error: signedErr } = await supabase
        .storage
        .from(BUCKET)
        .createSignedUrl(path, 60 * 60)

      if (signedErr) {
        console.error('VisionBoard signed url error:', signedErr)
        setLoading(null)
        return
      }

      if (signed?.signedUrl) {
        setImages((prev) => ({ ...prev, [index]: signed.signedUrl }))
      }
    } catch (err) {
      console.error('VisionBoard upload flow error:', err)
    } finally {
      setLoading(null)
      // allow uploading same file again
      if (fileInputRefs.current[index]) fileInputRefs.current[index]!.value = ''
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
              ref={(el) => { fileInputRefs.current[i] = el }}
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
                  <div className="hidden md:block px-4 py-2 border border-white/40 rounded-sm bg-white/10 text-white text-[9px] uppercase tracking-widest font-black">
                    Изменить
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="w-full min-h-[120px] md:min-h-[180px] p-4 flex flex-col items-center justify-center text-center"
                style={{ backgroundColor: `${item.bg}60` }}
              >
                <ImageIcon size={18} className="text-[--mocha]/30 mb-3" />
                <h3 className="font-lora italic text-[14px] md:text-lg text-[--espresso] mb-1">{item.title}</h3>
                <p className="text-[8px] md:text-[9px] uppercase tracking-[0.2em] font-black text-[--mocha]/40">
                  Добавить
                </p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}