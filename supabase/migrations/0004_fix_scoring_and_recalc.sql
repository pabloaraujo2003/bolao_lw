-- Atualiza settings com os valores corretos de pontuação
insert into public.settings (key, value) values
  ('points_exact', '5'),
  ('points_draw', '3'),
  ('points_winner', '1')
on conflict (key) do update set value = excluded.value;

-- Recalcula pontos de todos os palpites com base nos jogos encerrados
-- Regra: exato = 5 pts, empate correto = 3 pts, vitória correta = 1 pt, errado = 0
update public.predictions p
set points = case
  when p.predicted_home = g.home_score and p.predicted_away = g.away_score then 5
  when sign(p.predicted_home - p.predicted_away) = sign(g.home_score - g.away_score)
       and sign(g.home_score - g.away_score) = 0 then 3
  when sign(p.predicted_home - p.predicted_away) = sign(g.home_score - g.away_score) then 1
  else 0
end
from public.games g
where p.game_id = g.id
  and g.is_finished = true
  and g.home_score is not null
  and g.away_score is not null;

-- Corrige ranking view: exact_scores conta points = 5,
-- correct_results conta vitórias (1 pt) e empates (3 pts) sem exatos
create or replace view public.ranking as
select
  p.id as user_id,
  p.name,
  coalesce(sum(pr.points), 0) as total_points,
  count(*) filter (where pr.points = 5) as exact_scores,
  count(*) filter (where pr.points in (1, 3)) as correct_results,
  count(pr.id) as predictions_count
from public.profiles p
left join public.predictions pr on pr.user_id = p.id
group by p.id, p.name
order by total_points desc, exact_scores desc, correct_results desc;
