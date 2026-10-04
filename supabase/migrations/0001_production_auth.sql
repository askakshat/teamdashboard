-- Production auth and row-level security for EUMIND.
-- Apply after supabase_schema.sql. This migration is safe to re-run.

create or replace function public.current_user_group_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select group_id from public.profiles where id = auth.uid();
$$;

create or replace function public.current_user_is_leader()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select role = 'leader' from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, role, group_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', split_part(coalesce(new.email, 'Member'), '@', 1)),
    'team_member',
    nullif(new.raw_user_meta_data->>'group_id', '')::uuid
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Remove the initial demo policies before adding scoped policies.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('groups', 'profiles', 'milestones', 'roles_responsibilities', 'blueprint', 'expert_interviews', 'prototype_specs', 'marketing_plans', 'individual_reflections', 'competences', 'ai_logs')
  loop
    execute format('drop policy if exists %I on %I.%I', policy_record.policyname, policy_record.schemaname, policy_record.tablename);
  end loop;
end $$;

create policy "members can view their group" on public.groups
for select to authenticated
using (id = public.current_user_group_id());

create policy "leaders can manage their group" on public.groups
for all to authenticated
using (id = public.current_user_group_id() and public.current_user_is_leader())
with check (id = public.current_user_group_id() and public.current_user_is_leader());

create policy "members can view group profiles" on public.profiles
for select to authenticated
using (group_id = public.current_user_group_id());

create policy "members can update their own profile" on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid() and group_id = public.current_user_group_id());

create policy "leaders can manage group profiles" on public.profiles
for all to authenticated
using (group_id = public.current_user_group_id() and public.current_user_is_leader())
with check (group_id = public.current_user_group_id() and public.current_user_is_leader());

create policy "members can collaborate on group milestones" on public.milestones
for all to authenticated
using (group_id = public.current_user_group_id())
with check (group_id = public.current_user_group_id());

create policy "members can collaborate on group submissions" on public.roles_responsibilities
for all to authenticated
using (group_id = public.current_user_group_id())
with check (group_id = public.current_user_group_id() and submitted_by = auth.uid());

create policy "members can collaborate on group submissions" on public.blueprint
for all to authenticated
using (group_id = public.current_user_group_id())
with check (group_id = public.current_user_group_id() and submitted_by = auth.uid());

create policy "members can collaborate on group submissions" on public.expert_interviews
for all to authenticated
using (group_id = public.current_user_group_id())
with check (group_id = public.current_user_group_id() and submitted_by = auth.uid());

create policy "members can collaborate on group submissions" on public.prototype_specs
for all to authenticated
using (group_id = public.current_user_group_id())
with check (group_id = public.current_user_group_id() and submitted_by = auth.uid());

create policy "members can collaborate on group submissions" on public.marketing_plans
for all to authenticated
using (group_id = public.current_user_group_id())
with check (group_id = public.current_user_group_id() and submitted_by = auth.uid());

create policy "members can manage own reflections" on public.individual_reflections
for all to authenticated
using (group_id = public.current_user_group_id() and (user_id = auth.uid() or public.current_user_is_leader()))
with check (group_id = public.current_user_group_id() and (user_id = auth.uid() or public.current_user_is_leader()));

create policy "members can collaborate on competences" on public.competences
for all to authenticated
using (group_id = public.current_user_group_id())
with check (group_id = public.current_user_group_id() and submitted_by = auth.uid());

create policy "members can collaborate on ai logs" on public.ai_logs
for all to authenticated
using (group_id = public.current_user_group_id())
with check (group_id = public.current_user_group_id() and submitted_by = auth.uid());
