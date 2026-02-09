-- Supabase schema (Postgres)
create table profiles (
  id uuid primary key default gen_random_uuid(),
  email text,
  full_name text,
  created_at timestamptz default now(),
  vision_board jsonb,
  wheel_levels jsonb
);

create table habits (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id),
  name text not null,
  color text,
  icon text,
  created_at timestamptz default now()
);

create table logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references habits(id),
  date date not null,
  status boolean default false
);

create table reflections (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id),
  category text,
  question text,
  answer text,
  created_at timestamptz default now()
);
