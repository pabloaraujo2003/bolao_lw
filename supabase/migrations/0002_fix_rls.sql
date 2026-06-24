-- Drop todas as policies existentes (antigas e novas) antes de recriar
drop policy if exists "admin vê todos perfis" on public.profiles;
drop policy if exists "usuário vê próprio perfil" on public.profiles;
drop policy if exists "usuário atualiza próprio nome" on public.profiles;
drop policy if exists "admin atualiza qualquer perfil" on public.profiles;
drop policy if exists "perfil: select próprio ou admin" on public.profiles;
drop policy if exists "perfil: update próprio" on public.profiles;
drop policy if exists "perfil: update admin" on public.profiles;

drop policy if exists "autenticados leem jogos" on public.games;
drop policy if exists "admin gerencia jogos" on public.games;
drop policy if exists "games: leitura pública" on public.games;
drop policy if exists "games: escrita admin" on public.games;

drop policy if exists "autenticados leem settings" on public.settings;
drop policy if exists "admin gerencia settings" on public.settings;
drop policy if exists "settings: leitura pública" on public.settings;
drop policy if exists "settings: escrita admin" on public.settings;

drop policy if exists "autenticados leem sync_log" on public.sync_log;
drop policy if exists "sync_log: leitura pública" on public.sync_log;

drop policy if exists "usuário vê próprios palpites" on public.predictions;
drop policy if exists "usuário insere palpite em jogo aberto" on public.predictions;
drop policy if exists "usuário atualiza palpite em jogo aberto" on public.predictions;
drop policy if exists "predictions: select próprio" on public.predictions;
drop policy if exists "predictions: insert em jogo aberto" on public.predictions;
drop policy if exists "predictions: update em jogo aberto" on public.predictions;

-- Função security definer: verifica admin sem recursão (bypassa RLS)
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  )
$$ language sql security definer stable;

-- ===== PROFILES =====
create policy "perfil: select próprio ou admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

create policy "perfil: update próprio" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "perfil: update admin" on public.profiles
  for update using (public.is_admin());

-- ===== GAMES (leitura pública) =====
create policy "games: leitura pública" on public.games
  for select using (true);

create policy "games: escrita admin" on public.games
  for all using (public.is_admin());

-- ===== SETTINGS (leitura pública) =====
create policy "settings: leitura pública" on public.settings
  for select using (true);

create policy "settings: escrita admin" on public.settings
  for all using (public.is_admin());

-- ===== SYNC_LOG (leitura pública) =====
create policy "sync_log: leitura pública" on public.sync_log
  for select using (true);

-- ===== PREDICTIONS =====
create policy "predictions: select próprio" on public.predictions
  for select using (auth.uid() = user_id);

create policy "predictions: insert em jogo aberto" on public.predictions
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.games g
      where g.id = game_id
        and g.game_date - interval '30 minutes' > now()
        and not g.is_finished
    )
  );

create policy "predictions: update em jogo aberto" on public.predictions
  for update using (
    auth.uid() = user_id
    and exists (
      select 1 from public.games g
      where g.id = game_id
        and g.game_date - interval '30 minutes' > now()
        and not g.is_finished
    )
  );
