-- Limita o que cada chave consegue gravar na nuvem.
--
-- A chave pública (anon) fica dentro do app, então qualquer pessoa pode inventar um
-- x-dcast-key e gravar linhas com ele. A RLS impede que leia ou altere dados dos
-- outros, mas não impede encher o banco. Esta migration:
--   1. cria índices por user_key (as consultas e a RLS filtram sempre por ele);
--   2. exige user_key no formato SHA-256 e limita o tamanho dos campos;
--   3. limita a quantidade de linhas por conta em cada tabela.
--
-- As regras valem para gravações novas (NOT VALID): linhas antigas não são checadas.
-- Rode uma vez no SQL Editor do Supabase. Pode ser executado de novo sem problema.

begin;

-- 1. Índices
create index if not exists dcast_watch_progress_user_key_idx on public.dcast_watch_progress (user_key);
create index if not exists dcast_favorites_user_key_idx on public.dcast_favorites (user_key);
create index if not exists dcast_custom_folders_user_key_idx on public.dcast_custom_folders (user_key);
create index if not exists dcast_hidden_items_user_key_idx on public.dcast_hidden_items (user_key);

-- 2. Formato da chave e tamanho dos campos (pg_column_size funciona com qualquer tipo de coluna)
alter table public.dcast_watch_progress drop constraint if exists dcast_watch_progress_limits;
alter table public.dcast_watch_progress add constraint dcast_watch_progress_limits check (
  user_key ~ '^[0-9a-f]{64}$'
  and pg_column_size(content_id) <= 200
  and pg_column_size(series_id) <= 200
  and pg_column_size(title) <= 1000
  and pg_column_size(poster_url) <= 2100
  and pg_column_size(content_type) <= 40
) not valid;

alter table public.dcast_favorites drop constraint if exists dcast_favorites_limits;
alter table public.dcast_favorites add constraint dcast_favorites_limits check (
  user_key ~ '^[0-9a-f]{64}$'
  and pg_column_size(item_id) <= 200
  and pg_column_size(name) <= 1000
  and pg_column_size(poster_url) <= 2100
  and pg_column_size(content_type) <= 40
  and pg_column_size(category_id) <= 200
  and pg_column_size(rating) <= 40
) not valid;

alter table public.dcast_custom_folders drop constraint if exists dcast_custom_folders_limits;
alter table public.dcast_custom_folders add constraint dcast_custom_folders_limits check (
  user_key ~ '^[0-9a-f]{64}$'
  and pg_column_size(folder_id) <= 200
  and pg_column_size(name) <= 400
  and pg_column_size(content_type) <= 40
  and pg_column_size(stream_ids) <= 200000
) not valid;

alter table public.dcast_hidden_items drop constraint if exists dcast_hidden_items_limits;
alter table public.dcast_hidden_items add constraint dcast_hidden_items_limits check (
  user_key ~ '^[0-9a-f]{64}$'
  and pg_column_size(content_type) <= 40
  and pg_column_size(hidden_categories) <= 200000
  and pg_column_size(hidden_streams) <= 1000000
) not valid;

alter table public.dcast_profiles drop constraint if exists dcast_profiles_limits;
alter table public.dcast_profiles add constraint dcast_profiles_limits check (
  user_key ~ '^[0-9a-f]{64}$'
  and pg_column_size(profile_id) <= 100
  and pg_column_size(name) <= 200
  and pg_column_size(color) <= 40
) not valid;

-- 3. Quantidade máxima de linhas por conta (o limite vem no argumento do gatilho).
--    Atualizar uma linha que já existe (upsert) continua liberado no limite.
create or replace function public.dcast_enforce_row_limit()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  max_rows integer := tg_argv[0]::integer;
  other_rows integer;
begin
  execute format(
    'select count(*) from (select 1 from %I.%I where user_key = $1 and id <> $2 limit %s) as limited',
    tg_table_schema, tg_table_name, max_rows
  )
  into other_rows
  using new.user_key, new.id;

  if other_rows >= max_rows then
    raise exception 'Limite de % registros por conta atingido em %', max_rows, tg_table_name
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists dcast_row_limit on public.dcast_watch_progress;
create trigger dcast_row_limit before insert on public.dcast_watch_progress
  for each row execute function public.dcast_enforce_row_limit('20000');

drop trigger if exists dcast_row_limit on public.dcast_favorites;
create trigger dcast_row_limit before insert on public.dcast_favorites
  for each row execute function public.dcast_enforce_row_limit('5000');

drop trigger if exists dcast_row_limit on public.dcast_custom_folders;
create trigger dcast_row_limit before insert on public.dcast_custom_folders
  for each row execute function public.dcast_enforce_row_limit('500');

drop trigger if exists dcast_row_limit on public.dcast_hidden_items;
create trigger dcast_row_limit before insert on public.dcast_hidden_items
  for each row execute function public.dcast_enforce_row_limit('10');

drop trigger if exists dcast_row_limit on public.dcast_profiles;
create trigger dcast_row_limit before insert on public.dcast_profiles
  for each row execute function public.dcast_enforce_row_limit('200');

commit;
