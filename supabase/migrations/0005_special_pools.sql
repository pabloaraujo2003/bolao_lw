-- Mini-bolões especiais (ex: jogo do Brasil)
create table public.special_pools (
  id uuid primary key default uuid_generate_v4(),
  game_id integer references public.games(id) on delete set null,
  name text not null,
  entry_fee numeric not null default 10,
  is_open boolean not null default true,
  created_at timestamptz not null default now()
);

-- Perguntas de múltipla escolha do mini-bolão
create table public.special_questions (
  id uuid primary key default uuid_generate_v4(),
  pool_id uuid references public.special_pools(id) on delete cascade,
  question text not null,
  options jsonb not null default '[]',   -- string[]
  metric_type text,                       -- 'score'|'half_score'|'total_goals'|'first_scorer'|'goal_first_half'|'first_goal_minute'|'top_scorer'
  correct_answer text,
  points integer not null default 2,
  order_index integer not null default 0
);

-- Respostas dos usuários
create table public.special_answers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.special_questions(id) on delete cascade,
  answer text not null,
  points integer not null default 0,
  created_at timestamptz not null default now(),
  unique(user_id, question_id)
);

-- Participantes (pagamento por mini-bolão)
create table public.special_participants (
  user_id uuid not null references public.profiles(id) on delete cascade,
  pool_id uuid not null references public.special_pools(id) on delete cascade,
  paid boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (user_id, pool_id)
);

-- RLS
alter table public.special_pools enable row level security;
alter table public.special_questions enable row level security;
alter table public.special_answers enable row level security;
alter table public.special_participants enable row level security;

-- special_pools: autenticados leem, admin gerencia
create policy "autenticados leem special_pools" on public.special_pools
  for select using (auth.role() = 'authenticated');
create policy "admin gerencia special_pools" on public.special_pools
  for all using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- special_questions: autenticados leem, admin gerencia
create policy "autenticados leem special_questions" on public.special_questions
  for select using (auth.role() = 'authenticated');
create policy "admin gerencia special_questions" on public.special_questions
  for all using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- special_answers: usuário vê e edita próprias, admin vê todas
create policy "usuário vê próprias respostas" on public.special_answers
  for select using (auth.uid() = user_id);
create policy "usuário insere resposta" on public.special_answers
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.special_questions sq
      join public.special_pools sp on sp.id = sq.pool_id
      where sq.id = question_id and sp.is_open = true
    )
  );
create policy "usuário atualiza resposta" on public.special_answers
  for update using (
    auth.uid() = user_id
    and exists (
      select 1 from public.special_questions sq
      join public.special_pools sp on sp.id = sq.pool_id
      where sq.id = question_id and sp.is_open = true
    )
  );
create policy "admin vê todas respostas" on public.special_answers
  for select using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));
create policy "admin atualiza respostas" on public.special_answers
  for update using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- special_participants: usuário vê própria, admin vê e gerencia todas
create policy "usuário vê própria participação" on public.special_participants
  for select using (auth.uid() = user_id);
create policy "usuário ingressa" on public.special_participants
  for insert with check (auth.uid() = user_id);
create policy "admin gerencia participantes" on public.special_participants
  for all using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));
