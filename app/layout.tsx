'use client'

import './globals.css'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CheckSquare, Target, Heart, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'

async function handleLogout() {
  await supabase.auth.signOut()
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/login'
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const navLinks = [
    { href: '/', icon: <LayoutDashboard size={20} />, label: 'Главная' },
    { href: '/habits', icon: <CheckSquare size={20} />, label: 'Привычки' },
    { href: '/goals', icon: <Target size={20} />, label: 'Цели' },
    { href: '/vision', icon: <Heart size={20} />, label: 'Vision' },
  ]

  return (
    <html lang="ru">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..600;1,400..600&family=Manrope:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>

      <body className="bg-[--latte] text-[--mocha] font-['Manrope'] min-h-screen flex flex-col md:flex-row">

        {/* MOBILE HEADER */}
        {!isLoginPage && (
          <header className="md:hidden fixed top-0 left-0 right-0 h-10 bg-white/40 backdrop-blur-md border-b border-stone-200/20 z-50">
            <div className="relative h-full px-4 flex items-center">

              {/* LEFT: avatar + logout or login */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {user ? (
                  <>
                    <span className="px-2 py-1 border border-[#3E322B]/10 rounded-sm bg-white/10 text-[9px] text-[--espresso] truncate max-w-[120px]">
                      {user.email}
                    </span>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="p-1.5 border border-[#3E322B]/20 rounded-sm text-[--mocha] hover:bg-white/20 transition-all"
                      aria-label="Выйти"
                    >
                      <LogOut size={14} />
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="px-3 py-1.5 border border-[#3E322B]/20 rounded-sm text-[9px] uppercase tracking-[0.3em] font-black text-[--espresso] bg-white/10 hover:bg-white/20 transition-all duration-300"
                  >
                    Войти
                  </Link>
                )}
              </div>

              {/* CENTER: logo */}
              <div className="mx-auto flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  width={80}
                  height={80}
                  className="object-contain opacity-90"
                  priority
                />
              </div>

            </div>
          </header>
        )}

        {/* DESKTOP SIDEBAR */}
        {!isLoginPage && (
          <aside className="hidden md:flex w-64 p-8 flex-col h-screen sticky top-0 bg-white/20 backdrop-blur-xl border-r border-stone-200/20">
            <div className="mb-10">
              <Image
                src="/logo.png"
                alt="Solace"
                width={200}
                height={60}
                className="object-contain -mt-5 -ml-12"
                priority
              />
              <p className="text-[9px] uppercase tracking-[0.3em] text-[--cappuccino] -mt-8 ml-2 font-bold">
                Твой островок покоя
              </p>
            </div>

            <nav className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex items-center space-x-3 p-3 rounded-xl transition-all hover:bg-white/40"
                >
                  <span className="text-[--cappuccino] group-hover:text-[--espresso] transition">
                    {link.icon}
                  </span>
                  <span className="text-sm font-medium">
                    {link.label}
                  </span>
                </Link>
              ))}
            </nav>

            {/* НИЖНИЙ БЛОК: Войти / email + Выйти */}
            <div className="mt-auto space-y-2">
              {user ? (
                <>
                  <div className="py-2 px-3 border border-[#3E322B]/40 rounded-sm text-center">
                    <p className="text-[11px] font-medium text-[--espresso] truncate" title={user.email}>
                      {user.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="block w-full py-2.5 border border-[#3E322B]/40 rounded-sm text-center font-bold text-[10px] uppercase tracking-widest text-[--espresso] hover:bg-[#3E322B]/10 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <LogOut size={14} />
                    Выйти
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="block w-full py-3 border border-[#3E322B] rounded-sm text-center font-black text-[10px] uppercase tracking-[0.3em] text-[--espresso] hover:bg-[#3E322B] hover:text-white transition-all duration-300 shadow-sm"
                >
                  Войти
                </Link>
              )}
            </div>
          </aside>
        )}

        {/* MOBILE NAVIGATION */}
        {!isLoginPage && (
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-stone-200 z-50 px-6 py-3 flex justify-between items-center">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="flex flex-col items-center space-y-1">
                <span className="text-[--cappuccino]">
                  {link.icon}
                </span>
                <span className="text-[10px] font-medium">
                  {link.label}
                </span>
              </Link>
            ))}
          </nav>
        )}

        {/* MAIN CONTENT */}
        <main className={`flex-1 overflow-y-auto ${!isLoginPage ? 'p-6 pt-20 md:p-12 md:pt-12 pb-24 md:pb-12' : 'flex items-center justify-center'}`}>
          <div className={!isLoginPage ? "max-w-4xl mx-auto" : "w-full"}>
            {children}
          </div>
        </main>

      </body>
    </html>
  )
}