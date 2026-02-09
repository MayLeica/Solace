# Aesthetic Self-Care Hub — Starter

Это готовый шаблон проекта **Next.js 14 (App Router)** + **Tailwind CSS** + **Supabase** по ТЗ "Aesthetic Self-Care Hub".

Что внутри:
- Bento dashboard (главная) с компонентами: Habit tracker, Mindfulness/reflections, Wheel of Life, Vision Board, Mood tracker, Focus of day.
- Tailwind theme с палитрой (paper / sand / rose-dust / coffee).
- Примеры компонентов с локальным сохранением (localStorage) и заготовкой для интеграции с Supabase.
- Файл `supabase_schema.sql` с таблицами.

## Быстрый старт (локально)
1. Склонируй или распакуй проект.
2. Установи зависимости:
   ```bash
   npm install
   ```
3. Создай проект в Supabase и используй `supabase_schema.sql` чтобы создать таблицы.
4. Создай `.env.local` с переменными:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
5. Запусти dev-сервер:
   ```bash
   npm run dev
   ```
6. Для деплоя: связать репозиторий с Vercel, добавить env-переменные в настройках проекта, и нажать Deploy.

## Примечания и доработка
- Сейчас компоненты используют localStorage как fallback. Для полной реализации замени локальную логику на запросы к Supabase (используя `lib/supabaseClient.ts`).
- Колесо баланса и сетка привычек имеют базовую визуализацию — можно улучшить анимации с `framer-motion`.
- Шрифты подключены через Google Fonts — при желании можно локально внедрить их через `next/font`.

Если хочешь — я могу:
- Добавить полноценную интеграцию Supabase (Auth + CRUD) прямо в проект.
- Сделать адаптивную верстку ещё точнее и добавить тестовые seed-данные.
- Сделать CI/CD и конфигурацию Vercel (environment presets).
