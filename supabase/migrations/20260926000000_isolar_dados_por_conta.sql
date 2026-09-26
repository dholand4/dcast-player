-- Isola os dados de cada conta na nuvem.
--
-- Antes: o app usava a chave pública (anon) e separava os usuários só pelo filtro
-- user_key = "<usuario>_<host>", que qualquer pessoa consegue adivinhar. Além disso,
-- dcast_watch_progress.stream_url guardava a URL do stream com usuário e senha do IPTV.
--
-- Depois: o app envia no cabeçalho x-dcast-key um hash SHA-256 derivado de
-- servidor + usuário + senha, e as políticas abaixo só liberam as linhas cujo
-- user_key é igual a esse cabeçalho. Sem o cabeçalho, nenhuma linha é visível.
--
-- Rode este arquivo uma vez no SQL Editor do Supabase. Ele pode ser executado de novo sem problema.

begin;

-- 1. Chave enviada pelo app na requisição atual
create or replace function public.dcast_request_key()
returns text
language sql
stable
as $$
  select nullif(
    coalesce(current_setting('request.headers', true), '{}')::json ->> 'x-dcast-key',
    ''
  )
$$;

-- 2. Remove os dados no formato antigo (user_key previsível e stream_url com senha).
--    O app reenvia para a nuvem o que ainda tiver salvo no aparelho.
delete from public.dcast_watch_progress where user_key !~ '^[0-9a-f]{64}$';
delete from public.dcast_favorites where user_key !~ '^[0-9a-f]{64}$';
delete from public.dcast_custom_folders where user_key !~ '^[0-9a-f]{64}$';
delete from public.dcast_hidden_items where user_key !~ '^[0-9a-f]{64}$';

alter table public.dcast_watch_progress drop column if exists stream_url;

-- 3. Item removido do "Continuar Assistindo" sem apagar o histórico de assistidos
alter table public.dcast_watch_progress
  add column if not exists hidden_from_continue boolean not null default false;

-- 4. Troca as políticas existentes por uma única política por dono da chave
do $$
declare
  r record;
begin
  for r in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'dcast_watch_progress',
        'dcast_favorites',
        'dcast_custom_folders',
        'dcast_hidden_items'
      )
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end
$$;

alter table public.dcast_watch_progress enable row level security;
alter table public.dcast_favorites enable row level security;
alter table public.dcast_custom_folders enable row level security;
alter table public.dcast_hidden_items enable row level security;

create policy dcast_owner_only on public.dcast_watch_progress
  for all to anon, authenticated
  using (user_key = public.dcast_request_key())
  with check (user_key = public.dcast_request_key());

create policy dcast_owner_only on public.dcast_favorites
  for all to anon, authenticated
  using (user_key = public.dcast_request_key())
  with check (user_key = public.dcast_request_key());

create policy dcast_owner_only on public.dcast_custom_folders
  for all to anon, authenticated
  using (user_key = public.dcast_request_key())
  with check (user_key = public.dcast_request_key());

create policy dcast_owner_only on public.dcast_hidden_items
  for all to anon, authenticated
  using (user_key = public.dcast_request_key())
  with check (user_key = public.dcast_request_key());

commit;
