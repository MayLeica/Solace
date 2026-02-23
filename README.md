Solace — это минималистичное и уютное пространство для осознанности и продуктивности. Проект построен на современной базе Next.js 14 и оформлен в мягких, природных тонах для снижения визуального шума.

Основные функции
Habit Tracker: Интуитивная сетка для отслеживания ежедневных привычек.
Vision Board: Визуализация желаний с загрузкой изображений.
Wheel of Life: Интерактивное колесо баланса для анализа ключевых сфер жизни.
Smart Goal Manager: Управление целями.
Weekly PDF Report: Генерация отчетов за неделю с полной поддержкой кириллицы (Noto Sans).

Технологический стек
Framework: Next.js 14 (App Router)
Styling: Tailwind CSS (Custom Palette: Paper, Sand, Rose-dust, Coffee)
Database: Supabase (Auth + PostgreSQL)
PDF Generation: jsPDF с внедрением шрифтов Base64.

Дизайн-система
Карточки: white/40 backdrop-blur с мягкими границами border-[#D4C3B5]/30.
Типографика: font-lora italic для заголовков и  uppercase tracking-[0.3em] для ярлыков.
Цвета: Мягкие переходы и пастельные тона (например, #D6DDD0 для выполненных задач).


Клонирование и установка:
npm install

Настройка окружения:
Создайте файл .env.local и добавьте ваши ключи от Supabase:
NEXT_PUBLIC_SUPABASE_URL=ваш_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=ваш_ключ

База данных:
Выполните SQL-запрос из файла supabase_schema.sql в консоли Supabase для создания необходимых таблиц.

Запуск:
npm run dev
