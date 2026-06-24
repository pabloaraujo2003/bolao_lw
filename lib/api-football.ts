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

export type ApiFixture = {
  id: number
  utcDate: string
  status: string
  stage: string
  group: string | null
  homeTeam: { name: string; crest: string }
  awayTeam: { name: string; crest: string }
  score: { fullTime: { home: number | null; away: number | null } }
}

export function mapFixtureToGame(m: ApiFixture) {
  const isFinished = m.status === 'FINISHED'
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
    home_score: isFinished ? (m.score?.fullTime?.home ?? null) : null,
    away_score: isFinished ? (m.score?.fullTime?.away ?? null) : null,
    is_finished: isFinished,
  }
}
