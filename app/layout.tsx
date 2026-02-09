import './globals.css'
import React from 'react'
import Link from 'next/link'
import { LayoutDashboard, CheckSquare, Target, Heart } from 'lucide-react'

export const metadata = {
  title: 'Solace — Digital Sanctuary',
  description: 'Soft minimalist journaling'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const navLinks = [
    { href: '/', icon: <LayoutDashboard size={20} />, label: 'Главная' },
    { href: '/habits', icon: <CheckSquare size={20} />, label: 'Привычки' },
    { href: '/goals', icon: <Target size={20} />, label: 'Цели' },
    { href: '/vision', icon: <Heart size={20} />, label: 'Vision' },
  ]

  return (
    <html lang="ru">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..600;1,400..600&family=Manrope:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[--latte] text-[--mocha] font-['Manrope'] min-h-screen flex flex-col md:flex-row">
        
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden md:flex w-64 p-8 flex-col h-screen sticky top-0 bg-white/20 backdrop-blur-xl border-r border-stone-200/20">
          <div className="mb-12">
            <h1 className="font-lora text-3xl font-medium text-[--espresso]">Solace</h1>
            <p className="text-[9px] uppercase tracking-[0.3em] text-[--cappuccino] mt-1 font-bold">Твой островок покоя</p>
          </div>
          
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="group flex items-center space-x-3 p-3 rounded-xl transition-all hover:bg-white/40">
                <span className="text-[--cappuccino]">{link.icon}</span>
                <span className="text-sm font-medium">{link.label}</span>
              </Link>
            ))}
          </nav>
          <div className="mt-auto pt-4 opacity-30 text-[9px] uppercase tracking-widest">Coffee Edition</div>
        </aside>

        {/* MOBILE NAVIGATION (BOTTOM) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-stone-200 z-50 px-6 py-3 flex justify-between items-center">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="flex flex-col items-center space-y-1">
              <span className="text-[--cappuccino]">{link.icon}</span>
              <span className="text-[10px] font-medium">{link.label}</span>
            </Link>
          ))}
        </nav>

        {/* MAIN CONTENT */}
        <main className="flex-1 p-6 md:p-12 pb-24 md:pb-12 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            {children}
          </div>
        </main>
      </body>
    </html>
  )
}