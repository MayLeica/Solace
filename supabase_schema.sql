-- =============================================================================
-- Solace — полная схема Supabase
-- Принцип: Supabase = источник истины + история + аналитика.
-- localStorage = буфер (гость, черновики mood/reflections до "Сохранить день").
-- =============================================================================
-- Выполните в SQL Editor вашего проекта Supabase одним запуском.
-- Если таблицы уже есть и нужно пересоздать: раскомментируйте блок DROP внизу.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Привычки (список) — сохраняем сразу в БД
-- Редактирование названия/цвета — сразу в БД (редкое действие).
-- -----------------------------------------------------------------------------
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  color text,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_habits_user_id on public.habits(user_id);
create index if not exists idx_habits_user_position on public.habits(user_id, position);

-- -----------------------------------------------------------------------------
-- 2. Отметки привычек "сделано/нет" (1 раз в день)
-- Ключ на фронте: habitId_YYYY-MM-DD. В БД: upsert по (habit_id, date).
-- date хранить как date (YYYY-MM-DD).
-- -----------------------------------------------------------------------------
create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  date date not null,
  completed boolean not null default false,
  constraint habit_logs_habit_date_unique unique (habit_id, date)
);

create index if not exists idx_habit_logs_user_id on public.habit_logs(user_id);
create index if not exists idx_habit_logs_habit_id on public.habit_logs(habit_id);
create index if not exists idx_habit_logs_date on public.habit_logs(date);

-- -----------------------------------------------------------------------------
-- 3. Цели и подзадачи (глобальные) — сохраняем сразу в БД
-- Подзадачи в jsonb для MVP; при желании позже вынести в goal_tasks.
-- -----------------------------------------------------------------------------
create table if not exists public.global_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  period text,
  deadline date,
  progress int not null default 0,
  is_completed boolean not null default false,
  subtasks jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create index if not exists idx_global_goals_user_id on public.global_goals(user_id);
create index if not exists idx_global_goals_user_created on public.global_goals(user_id, created_at desc);

-- -----------------------------------------------------------------------------
-- 4. Колесо жизни (снимки оценок по сегментам)
-- -----------------------------------------------------------------------------
create table if not exists public.wheel_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  values jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_wheel_entries_user_created on public.wheel_entries(user_id, created_at desc);

-- -----------------------------------------------------------------------------
-- 5. Дневные записи ("Сохранить день")
-- Синк из localStorage: mood_draft + reflections_draft → одна запись на день.
-- Один раз в день при нажатии "Сохранить день"; после успеха — очистить черновики.
-- -----------------------------------------------------------------------------
create table if not exists public.day_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  mood_index smallint,
  gratitude text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint day_entries_user_date_unique unique (user_id, date)
);

create index if not exists idx_day_entries_user_id on public.day_entries(user_id);
create index if not exists idx_day_entries_date on public.day_entries(date);

-- -----------------------------------------------------------------------------
-- RLS (Row Level Security)
-- Единая точка истины для авторизованного пользователя — Supabase.
-- -----------------------------------------------------------------------------

alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.global_goals enable row level security;
alter table public.wheel_entries enable row level security;
alter table public.day_entries enable row level security;

-- habits: только свой user_id
create policy "habits_select_own" on public.habits for select using (auth.uid() = user_id);
create policy "habits_insert_own" on public.habits for insert with check (auth.uid() = user_id);
create policy "habits_update_own" on public.habits for update using (auth.uid() = user_id);
create policy "habits_delete_own" on public.habits for delete using (auth.uid() = user_id);

-- habit_logs: только свои (user_id = auth.uid())
create policy "habit_logs_select_own" on public.habit_logs for select using (auth.uid() = user_id);
create policy "habit_logs_insert_own" on public.habit_logs for insert with check (auth.uid() = user_id);
create policy "habit_logs_update_own" on public.habit_logs for update using (auth.uid() = user_id);
create policy "habit_logs_delete_own" on public.habit_logs for delete using (auth.uid() = user_id);

-- global_goals
create policy "global_goals_select_own" on public.global_goals for select using (auth.uid() = user_id);
create policy "global_goals_insert_own" on public.global_goals for insert with check (auth.uid() = user_id);
create policy "global_goals_update_own" on public.global_goals for update using (auth.uid() = user_id);
create policy "global_goals_delete_own" on public.global_goals for delete using (auth.uid() = user_id);

-- wheel_entries
create policy "wheel_entries_select_own" on public.wheel_entries for select using (auth.uid() = user_id);
create policy "wheel_entries_insert_own" on public.wheel_entries for insert with check (auth.uid() = user_id);
create policy "wheel_entries_update_own" on public.wheel_entries for update using (auth.uid() = user_id);
create policy "wheel_entries_delete_own" on public.wheel_entries for delete using (auth.uid() = user_id);

-- day_entries (mood + gratitude/notes после "Сохранить день")
create policy "day_entries_select_own" on public.day_entries for select using (auth.uid() = user_id);
create policy "day_entries_insert_own" on public.day_entries for insert with check (auth.uid() = user_id);
create policy "day_entries_update_own" on public.day_entries for update using (auth.uid() = user_id);
create policy "day_entries_delete_own" on public.day_entries for delete using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Триггер: обновлять updated_at в day_entries
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists day_entries_updated_at on public.day_entries;
create trigger day_entries_updated_at
  before update on public.day_entries
  for each row execute function public.set_updated_at();

-- =============================================================================
-- Краткая шпаргалка по логике приложения
-- =============================================================================
-- • При открытии: supabase.auth.getUser() → нет user: грузим из localStorage (гость);
--   есть user: грузим из Supabase.
-- • Привычки (авторизован): создание/редактирование/удаление → БД; тоггл дня → upsert habit_logs
--   с onConflict: 'habit_id,date'. Ключ на фронте: habitId_YYYY-MM-DD.
-- • Цели (авторизован): CRUD в global_goals; прогресс от subtasks или ручной.
-- • "Сохранить день": mood_draft + reflections_draft → insert/upsert в day_entries (user_id, date);
--   после успеха очистить локальные черновики за этот день.
-- • Гость: habits_guest, habitLogs_guest, goals_guest в localStorage; при логине — миграция
--   гостя в Supabase (перенос привычек с маппингом id, логов, целей) и очистка guest-ключей.
-- =============================================================================
-- При необходимости пересоздать таблицы (осторожно, данные удалятся):
-- =============================================================================
-- drop table if exists public.day_entries, public.habit_logs, public.habits,
--   public.wheel_entries, public.global_goals cascade;
-- drop function if exists public.set_updated_at();
-- Затем выполните этот скрипт с начала.
