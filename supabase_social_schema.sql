-- Create ASCENTS table (Carnet de croix)
create table ascents (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  route_id uuid references routes(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  suggested_grade text, -- User's opinion on the grade
  quality_rating int, -- 1 to 5 stars
  comment text, -- "Flash", "Hard for the grade", etc.
  
  -- Unique constraint: A user can only log a send once per route (simplification for now)
  -- Or allow multiple but maybe we just want to know IF they sent it. 
  -- Let's allow multiple for training logs, but usually 'sent' status is unique.
  -- Let's generic unique constraint for now to avoid duplicates.
  unique(route_id, user_id) 
);

-- Policies for Ascents
alter table ascents enable row level security;

create policy "Ascents are viewable by everyone"
  on ascents for select
  using ( true );

create policy "Users can enable ascents"
  on ascents for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own ascents"
  on ascents for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own ascents"
  on ascents for delete
  using ( auth.uid() = user_id );


-- Create LIKES table
create table likes (
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  route_id uuid references routes(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  
  primary key (route_id, user_id)
);

-- Policies for Likes
alter table likes enable row level security;

create policy "Likes are viewable by everyone"
  on likes for select
  using ( true );

create policy "Users can toggle likes"
  on likes for insert
  with check ( auth.uid() = user_id );

create policy "Users can remove likes"
  on likes for delete
  using ( auth.uid() = user_id );

-- Create saved_training_categories (Training Folders support)
create table user_lists (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null, -- e.g "Échauffement", "Projets 7A"
  color text default '#ffffff'
);

create table user_list_items (
    list_id uuid references user_lists(id) on delete cascade not null,
    route_id uuid references routes(id) on delete cascade not null,
    added_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (list_id, route_id)
);

alter table user_lists enable row level security;
alter table user_list_items enable row level security;

create policy "Users can view own lists" on user_lists for select using (auth.uid() = user_id);
create policy "Users can manage own lists" on user_lists for all using (auth.uid() = user_id);

create policy "Users can view own list items" on user_list_items for select using (
    exists ( select 1 from user_lists where id = user_list_items.list_id and user_id = auth.uid() )
);
create policy "Users can manage own list items" on user_list_items for all using (
    exists ( select 1 from user_lists where id = user_list_items.list_id and user_id = auth.uid() )
);

-- OPTIONAL: View for easier querying of stats (Run this if you want sorting by popularity)
create or replace view routes_with_stats as
select 
  r.*,
  count(distinct l.user_id) as likes_count,
  count(distinct a.user_id) as ascents_count
from routes r
left join likes l on r.id = l.route_id
left join ascents a on r.id = a.route_id
group by r.id;
