-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: walls
create table walls (
  id uuid primary key default uuid_generate_v4(),
  image_url text not null,
  is_active boolean default true,
  version text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: routes
create table routes (
  id uuid primary key default uuid_generate_v4(),
  wall_id uuid references walls(id) on delete cascade not null,
  name text not null,
  author_id uuid not null, -- Supabase Auth User ID
  holds jsonb not null, -- Array of {x, y, type, note}
  grade_color text not null, -- Orange, Rose, Vert, Jaune, Bleu, Rouge, Blanc, Projet
  style_tags text[], -- Array of strings
  is_pinned boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: user_activity
create table user_activity (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  route_id uuid references routes(id) on delete cascade not null,
  type text check (type in ('like', 'send')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, route_id, type)
);

-- Table: votes
create table votes (
  id uuid primary key default uuid_generate_v4(),
  route_id uuid references routes(id) on delete cascade not null,
  user_id uuid not null,
  suggested_color text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(route_id, user_id)
);

-- RLS (Row Level Security) - Minimal setup for now
alter table walls enable row level security;
alter table routes enable row level security;
alter table user_activity enable row level security;
alter table votes enable row level security;

-- Public read access
create policy "Allow public read walls" on walls for select using (true);
create policy "Allow public read routes" on routes for select using (true);
create policy "Allow public read activity" on user_activity for select using (true);
create policy "Allow public read votes" on votes for select using (true);

-- Auth user access
create policy "Allow authenticated insert routes" on routes for insert with check (auth.role() = 'authenticated');
create policy "Allow authenticated activity insert" on user_activity for insert with check (auth.role() = 'authenticated');
create policy "Allow authenticated votes insert" on votes for insert with check (auth.role() = 'authenticated');
