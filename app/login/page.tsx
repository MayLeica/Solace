'use client'
import React, { useState } from 'react'
import Image from 'next/image'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        alert('Регистрация успешна! Теперь вы можете войти.')
        setIsSignUp(false)
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/') // Перенаправляем на главную после входа
      }
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* LOGO */}
      <div className="mb-6 flex flex-col items-center">
        <Image 
          src="/logo.png" 
          alt="Solace Logo" 
          width={120} 
          height={120} 
          className="object-contain opacity-90"
          priority
        />
        <p className="text-[10px] uppercase tracking-[0.4em] text-[--cappuccino] font-bold mt-[-20px]">
          Твой островок покоя
        </p>
      </div>

      {/* AUTH CARD */}
      <div className="w-full max-w-sm p-8 bg-white/40 backdrop-blur-xl rounded-sm border border-[#D4C3B5]/30 shadow-sm">
        <h2 className="font-uppercase tracking-[0.3em] text-[16px] text-[--espresso] mb-8 text-center">
          {isSignUp ? 'Регистрация' : 'Авторизация'}
        </h2>
        
        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-2">
            <label className="font-black text-[10px] uppercase tracking-[0.3em] text-[--cappuccino] block">
              Почта
            </label>
            <input 
              type="email" 
              required
              className="w-full bg-white/10 border border-[#D4C3B5]/20 rounded-sm p-3 outline-none focus:border-[--cappuccino] transition-all text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Введите вашу почту"
            />
          </div>
          
          <div className="space-y-2">
            <label className="font-black text-[10px] uppercase tracking-[0.3em] text-[--cappuccino] block">
              Пароль
            </label>
            <input 
              type="password" 
              required
              className="w-full bg-white/10 border border-[#D4C3B5]/20 rounded-sm p-3 outline-none focus:border-[--cappuccino] transition-all text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            disabled={loading}
            className="w-full mt-4 py-3 bg-[--espresso]/5 border border-[--espresso] text-[--espresso] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-[--espresso] hover:text-white transition-all duration-500 rounded-sm flex items-center justify-center"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : (isSignUp ? 'Зарегистрироваться' : 'Войти')}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#D4C3B5]/20 text-center">
          <p 
            className="text-[11px] text-[--cappuccino] cursor-pointer hover:text-[--espresso] transition-colors uppercase tracking-widest font-bold"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? 'Уже есть аккаунт? Войти' : 'Впервые здесь? Создать аккаунт'}
          </p>
        </div>
      </div>
    </div>
  )
}