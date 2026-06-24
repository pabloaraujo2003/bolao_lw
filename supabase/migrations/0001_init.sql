-- Extensão UUID
create extension if not exists "uuid-ossp";

-- Tabela de perfis
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  paid boolean not null default false,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Trigger: cria profile ao registrar usuário
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Tabela de jogos
create table public.games (
  id integer primary key,
  home_team text not null,
  away_team text not null,
  home_flag text not null default '',
  away_flag text not null default '',
  game_date timestamptz not null,
  stage text not null default 'Group Stage',
  group_name text,
  home_score integer,
  away_score integer,
  is_finished boolean not null default false,
  api_fixture_id integer unique not null
);

-- Tabela de palpites
create table public.predictions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_id integer not null references public.games(id) on delete cascade,
  predicted_home integer not null,
  predicted_away integer not null,
  points integer not null default 0,
  created_at timestamptz not null default now(),
  unique(user_id, game_id)
);

-- Tabela de configurações
create table public.settings (
  key text primary key,
  value text not null
);

insert into public.settings (key, value) values
  ('entry_fee', '50.00'),
  ('prize_1st_pct', '60'),
  ('prize_2nd_pct', '30'),
  ('prize_3rd_pct', '10'),
  ('pix_key', 'SEU_PIX_AQUI'),
  ('pool_name', 'Bolão da Copa 2026'),
  ('points_exact', '3'),
  ('points_winner', '1');

-- Log de sincronização
create table public.sync_log (
  id uuid primary key default uuid_generate_v4(),
  synced_at timestamptz not null default now(),
  games_updated integer not null default 0,
  status text not null check (status in ('success', 'error')),
  error_msg text
);

-- View de ranking
create or replace view public.ranking as
select
  p.id as user_id,
  p.name,
  coalesce(sum(pr.points), 0) as total_points,
  count(*) filter (where pr.points = 3) as exact_scores,
  count(*) filter (where pr.points >= 1) as correct_results,
  count(pr.id) as predictions_count
from public.profiles p
left join public.predictions pr on pr.user_id = p.id
group by p.id, p.name
order by total_points desc, exact_scores desc, correct_results desc;

-- RLS
alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.predictions enable row level security;
alter table public.settings enable row level security;
alter table public.sync_log enable row level security;

-- Policies: profiles
create policy "usuário vê próprio perfil" on public.profiles
  for select using (auth.uid() = id);

create policy "admin vê todos perfis" on public.profiles
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "usuário atualiza próprio nome" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "admin atualiza qualquer perfil" on public.profiles
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Policies: games
create policy "autenticados leem jogos" on public.games
  for select using (auth.role() = 'authenticated');

create policy "admin gerencia jogos" on public.games
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Policies: settings
create policy "autenticados leem settings" on public.settings
  for select using (auth.role() = 'authenticated');

create policy "admin gerencia settings" on public.settings
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Policies: sync_log
create policy "autenticados leem sync_log" on public.sync_log
  for select using (auth.role() = 'authenticated');

-- Policies: predictions
create policy "usuário vê próprios palpites" on public.predictions
  for select using (auth.uid() = user_id);

create policy "usuário insere palpite em jogo aberto" on public.predictions
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.games g
      where g.id = game_id
        and g.game_date - interval '30 minutes' > now()
        and not g.is_finished
    )
  );

create policy "usuário atualiza palpite em jogo aberto" on public.predictions
  for update using (
    auth.uid() = user_id
    and exists (
      select 1 from public.games g
      where g.id = game_id
        and g.game_date - interval '30 minutes' > now()
        and not g.is_finished
    )
  );
