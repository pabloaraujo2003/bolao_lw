# Bolão Copa 2026 — Design Spec

**Data:** 2026-06-24  
**Status:** Aprovado

---

## Visão Geral

Site de bolão interno para colegas de trabalho acompanharem a Copa do Mundo 2026. Participantes fazem login, registram palpites de placar e acompanham o ranking em tempo real. Resultados são sincronizados automaticamente via API-Football. Admin gerencia participantes e configurações.

---

## Stack

- **Next.js 15** (App Router, TypeScript)
- **Supabase** — Postgres + Auth + RLS
- **API-Football** (RapidAPI) — calendário e resultados da Copa 2026
- **Vercel Cron** — sync automático a cada 5 min
- **Tailwind CSS** — paleta navy/dourado fiel ao design de referência

---

## Variáveis de Ambiente

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RAPIDAPI_KEY
CRON_SECRET
```

---

## Arquitetura

### Fluxo API-Football

1. **Import inicial** — Admin clica "Importar Copa 2026" no painel. Chama `/api/admin/import-games`, busca todos os fixtures da competição, faz `upsert` em `games` usando `api_fixture_id` como chave (idempotente).
2. **Cron automático** — `/api/cron/sync-results` roda a cada 5 min. Busca fixtures com status `FT` atualizados desde o último sync, atualiza `games`, dispara recálculo de pontos, registra em `sync_log`.
3. **Override manual** — Admin pode corrigir qualquer placar pelo painel `/admin/resultados`.

---

## Schema do Banco

### `profiles`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid PK | FK → auth.users.id |
| name | text | |
| paid | boolean | default false |
| is_admin | boolean | default false |
| created_at | timestamptz | default now() |

Criado automaticamente por trigger em `auth.users`.

### `games`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | integer PK | ID da API-Football |
| home_team | text | |
| away_team | text | |
| home_flag | text | URL da bandeira |
| away_flag | text | URL da bandeira |
| game_date | timestamptz | |
| stage | text | ex: 'Group Stage', 'Final' |
| group_name | text null | ex: 'Group A' |
| home_score | int null | null até finalizar |
| away_score | int null | null até finalizar |
| is_finished | boolean | default false |
| api_fixture_id | integer unique | chave de upsert |

### `predictions`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid PK | |
| user_id | uuid | FK → profiles.id |
| game_id | integer | FK → games.id |
| predicted_home | int | |
| predicted_away | int | |
| points | int | default 0, calculado server-side |
| created_at | timestamptz | |

Constraint: UNIQUE (user_id, game_id)

### `settings`
| Campo | Tipo |
|-------|------|
| key | text PK |
| value | text |

Seeds: `entry_fee=50.00`, `prize_1st_pct=60`, `prize_2nd_pct=30`, `prize_3rd_pct=10`, `pix_key=SEU_PIX`, `pool_name=Bolão da Copa 2026`, `points_exact=3`, `points_winner=1`

### `sync_log`
| Campo | Tipo |
|-------|------|
| id | uuid PK |
| synced_at | timestamptz |
| games_updated | int |
| status | text ('success' \| 'error') |
| error_msg | text null |

### View `ranking`
```sql
SELECT
  p.user_id,
  p.name,
  COALESCE(SUM(pr.points), 0) AS total_points,
  COUNT(*) FILTER (WHERE pr.points = 3) AS exact_scores,
  COUNT(*) FILTER (WHERE pr.points >= 1) AS correct_results,
  COUNT(pr.id) AS predictions_count
FROM profiles p
LEFT JOIN predictions pr ON pr.user_id = p.id
GROUP BY p.user_id, p.name
ORDER BY total_points DESC, exact_scores DESC, correct_results DESC
```

---

## RLS

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| games | autenticados | admin | admin | admin |
| settings | autenticados | admin | admin | admin |
| sync_log | autenticados | service_role | — | — |
| profiles | próprio / admin | trigger | próprio (name) / admin (paid) | — |
| predictions | próprio | próprio + jogo aberto | próprio + jogo aberto | — |

Jogo "aberto" = `game_date - interval '30 min' > now() AND NOT is_finished`

---

## Pontuação (`lib/scoring.ts`)

```
placar exato → 3 pontos
acertou vencedor ou empate (placar errado) → 1 ponto
errou resultado → 0 pontos
```

Função pura: `calcPoints(predictedHome, predictedAway, actualHome, actualAway): number`

Recálculo disparado automaticamente pelo cron e pelo override manual. Usa `service_role` key para escrita em lote.

---

## Páginas

### Públicas / Autenticadas
| Rota | Descrição |
|------|-----------|
| `/` | Hero + próximos jogos + ranking top 5 |
| `/login` | Login email/senha |
| `/cadastro` | Registro (cria profile via trigger) |
| `/palpites` | Lista jogos; inputs para abertos, read-only para bloqueados/finalizados |
| `/ranking` | Tabela completa com medalhas e estatísticas |
| `/premiacao` | Cota, total arrecadado, divisão, Pix, status do usuário |

### Admin (`/admin/*`)
| Rota | Descrição |
|------|-----------|
| `/admin` | Dashboard: participantes, total pago, último sync |
| `/admin/jogos` | Jogos importados + botão "Importar Copa 2026" |
| `/admin/resultados` | Override manual de placar + recalcular pontos |
| `/admin/participantes` | Lista + toggle de pagamento |
| `/admin/configuracoes` | Editar settings |

### Proteção de Rotas
- Middleware verifica sessão para `/palpites`, `/ranking`, `/premiacao`, `/admin/*`
- Admin verificado no middleware + checagem dupla em Server Actions
- Não-admin em `/admin/*` → redirect para `/`

---

## Cron

- **Rota:** `GET /api/cron/sync-results`
- **Schedule:** `*/5 * * * *`
- **Auth:** header `Authorization: Bearer {CRON_SECRET}`
- **Fluxo:** busca fixtures FT na API-Football → upsert em `games` → recalcula pontos → grava `sync_log`
- **Erro:** grava `sync_log` com `status = 'error'`, não derruba o processo

---

## Visual

- **Paleta:** navy `#0D1B2A` / `#162233` / `#1E2F45`, dourado `#FFD700` / `#C9A800`, verde `#00C853`, vermelho `#F44336`, texto `#F0F4F8`, neutro `#7A8FA6`
- **Fonte:** Inter
- **Cards:** border-radius 16px, badges pill, gradientes sutis dourado/navy

---

## Ordem de Implementação

1. Migration SQL (schema + RLS + seeds + trigger + view)
2. Setup Next.js + Supabase (server/client)
3. Auth (login, cadastro, middleware)
4. Palpites + ranking
5. Integração API-Football (import + cron)
6. Admin (jogos, resultados, participantes, configurações)
7. Polish visual (home, premiação, responsivo)
