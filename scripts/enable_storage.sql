
-- ENABLE STORAGE FOR WALLS
insert into storage.buckets (id, name, public) 
values ('walls', 'walls', true)
on conflict (id) do update set public = true;

-- POLICIES FOR STORAGE
create policy "Public Access" on storage.objects for select using (bucket_id = 'walls');
create policy "Admin Upload" on storage.objects for insert with check (bucket_id = 'walls');
create policy "Admin Update" on storage.objects for update with check (bucket_id = 'walls');
create policy "Admin Delete" on storage.objects for delete using (bucket_id = 'walls');
