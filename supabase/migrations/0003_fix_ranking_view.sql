-- Corrige correct_results para contar apenas acertos de resultado (1 pt)
-- sem incluir placares exatos (3 pts), que já são contados em exact_scores
create or replace view public.ranking as
select
  p.id as user_id,
  p.name,
  coalesce(sum(pr.points), 0) as total_points,
  count(*) filter (where pr.points = 3) as exact_scores,
  count(*) filter (where pr.points = 1) as correct_results,
  count(pr.id) as predictions_count
from public.profiles p
left join public.predictions pr on pr.user_id = p.id
group by p.id, p.name
order by total_points desc, exact_scores desc, correct_results desc;
