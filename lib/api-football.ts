const BASE_URL = 'https://api.football-data.org/v4'

async function apiFetch(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_TOKEN! },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`football-data.org error: ${res.status}`)
  return res.json()
}

export async function fetchAllFixtures() {
  return apiFetch('/competitions/WC/matches')
}

export async function fetchMatchDetail(fixtureId: number) {
  return apiFetch(`/matches/${fixtureId}`)
}

export type MetricAnswers = Record<string, string>

export function deriveAnswersFromMatch(match: any): MetricAnswers {
  const goals: any[] = match.goals ?? []
  const fullTime = match.score?.fullTime ?? {}
  const halfTime = match.score?.halfTime ?? {}
  const firstGoal = goals[0]

  const scorerMap: Record<string, number> = {}
  goals.forEach((g) => {
    const name = g.scorer?.name ?? ''
    if (name) scorerMap[name] = (scorerMap[name] ?? 0) + 1
  })
  const topScorer = Object.entries(scorerMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''

  const firstHalfGoal = goals.find((g) => g.minute <= 45 && !g.extraTime)

  const minuteRanges = ['1-15', '16-30', '31-45', '46-60', '61-75', '76-90', '90+']
  function minuteRange(m: number) {
    if (m <= 15) return '1-15'
    if (m <= 30) return '16-30'
    if (m <= 45) return '31-45'
    if (m <= 60) return '46-60'
    if (m <= 75) return '61-75'
    if (m <= 90) return '76-90'
    return '90+'
  }

  return {
    score: fullTime.home != null ? `${fullTime.home}-${fullTime.away}` : '',
    half_score: halfTime.home != null ? `${halfTime.home}-${halfTime.away}` : '',
    total_goals: String(goals.length),
    first_scorer: firstGoal?.scorer?.name ?? '',
    goal_first_half: firstHalfGoal ? 'Sim' : 'Não',
    first_goal_minute: firstGoal ? minuteRange(firstGoal.minute) : '',
    top_scorer: topScorer,
  }
}

export async function fetchFinishedFixturesSince(_since: string) {
  // football-data.org retorna todos os jogos; filtramos os FINISHED no caller
  return apiFetch('/competitions/WC/matches')
}

function mapStage(stage: string): string {
  const map: Record<string, string> = {
    GROUP_STAGE: 'Group Stage',
    LAST_32: 'Round of 32',
    LAST_16: 'Round of 16',
    QUARTER_FINALS: 'Quarter Finals',
    SEMI_FINALS: 'Semi Finals',
    THIRD_PLACE: 'Third Place',
    FINAL: 'Final',
  }
  return map[stage] ?? stage
}

function mapGroup(group: string | null): string | null {
  if (!group) return null
  return group.replace('GROUP_', 'Group ')
}

type ScoreEntry = { home: number | null; away: number | null }

export type ApiFixture = {
  id: number
  utcDate: string
  status: string
  stage: string
  group: string | null
  homeTeam: { name: string; crest: string }
  awayTeam: { name: string; crest: string }
  score: {
    duration?: 'REGULAR' | 'EXTRA_TIME' | 'PENALTY_SHOOTOUT'
    fullTime: ScoreEntry
    regularTime?: ScoreEntry | null
    extraTime?: ScoreEntry | null
    penalties?: ScoreEntry | null
  }
}

export function mapFixtureToGame(m: ApiFixture) {
  const isFinished = m.status === 'FINISHED'

  // Para partidas que vão à prorrogação ou pênaltis, a API retorna o placar
  // dos 90 min em `regularTime`. Usamos `fullTime` apenas para partidas normais.
  const isKnockoutDecider =
    m.score?.duration === 'EXTRA_TIME' || m.score?.duration === 'PENALTY_SHOOTOUT'
  const ninetyMinScore =
    isKnockoutDecider && m.score?.regularTime != null
      ? m.score.regularTime
      : m.score?.fullTime

  return {
    id: m.id,
    api_fixture_id: m.id,
    home_team: m.homeTeam.name,
    away_team: m.awayTeam.name,
    home_flag: m.homeTeam.crest ?? '',
    away_flag: m.awayTeam.crest ?? '',
    game_date: m.utcDate,
    stage: mapStage(m.stage),
    group_name: mapGroup(m.group),
    home_score: isFinished ? (ninetyMinScore?.home ?? null) : null,
    away_score: isFinished ? (ninetyMinScore?.away ?? null) : null,
    is_finished: isFinished,
  }
}
