create table if not exists public.feedback_email_logs (
    user_id uuid references auth.users(id) on delete cascade primary key,
    sent_at timestamptz default now()
);

alter table public.feedback_email_logs enable row level security;

-- Function to get candidates securely
create or replace function public.get_feedback_candidates()
returns table (id uuid, email varchar)
security definer
set search_path = public, auth
language plpgsql
as $$
begin
  return query
  select 
    au.id, 
    au.email::varchar
  from auth.users au
  left join public.feedback_email_logs fel on au.id = fel.user_id
  where 
    -- Users created more than 7 days ago
    au.created_at < (now() - interval '7 days') 
    -- But less than 30 days ago (so we don't spam ancient users on first run)
    and au.created_at > (now() - interval '30 days')
    -- And haven't been sent an email yet
    and fel.user_id is null;
end;
$$;

revoke execute on function public.get_feedback_candidates() from public;
revoke execute on function public.get_feedback_candidates() from anon;
grant execute on function public.get_feedback_candidates() to service_role;
