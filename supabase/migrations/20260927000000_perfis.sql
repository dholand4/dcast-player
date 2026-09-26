-- Perfis por conta (ex.: você e a família), sincronizados entre aparelhos.
-- O histórico e os favoritos de cada perfil ficam nas tabelas que já existem,
-- com um user_key próprio do perfil, então elas não mudam.
-- Rode uma vez no SQL Editor do Supabase. Pode ser executado de novo sem problema.

begin;

create table if not exists public.dcast_profiles (
  id text primary key,
  user_key text not null,
  profile_id text not null,
  name text not null,
  color text,
  created_at bigint not null default 0,
  updated_at bigint not null default 0,
  deleted boolean not null default false
);

create index if not exists dcast_profiles_user_key_idx on public.dcast_profiles (user_key);

alter table public.dcast_profiles enable row level security;

drop policy if exists dcast_owner_only on public.dcast_profiles;
create policy dcast_owner_only on public.dcast_profiles
  for all to anon, authenticated
  using (user_key = public.dcast_request_key())
  with check (user_key = public.dcast_request_key());

commit;
