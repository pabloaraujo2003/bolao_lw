import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wayoyfsqqolecbdpjjnm.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndheW95ZnNxcW9sZWNiZHBqam5tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjMxNzA2MSwiZXhwIjoyMDk3ODkzMDYxfQ.O2OF8vljbuVlqkQiFw-HSbKkDDWrMvWAFFJDaGdcctk'
const FOOTBALL_DATA_TOKEN = '5964679282af488bba728cf7adb5510c'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

function mapStage(stage) {
  const map = {
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

function mapGroup(group) {
  if (!group) return null
  return group.replace('GROUP_', 'Group ')
}

async function fetchAllMatches() {
  const res = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
    headers: { 'X-Auth-Token': FOOTBALL_DATA_TOKEN },
  })
  if (!res.ok) throw new Error(`football-data.org erro: ${res.status} ${await res.text()}`)
  const data = await res.json()
  if (data.errorCode) throw new Error(data.message)
  return data.matches ?? []
}

function mapMatch(m) {
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

async function main() {
  console.log('Buscando jogos da Copa 2026 no football-data.org...')
  const matches = await fetchAllMatches()

  if (!matches.length) {
    console.error('Nenhum jogo retornado.')
    process.exit(1)
  }

  console.log(`${matches.length} jogos recebidos. Inserindo no Supabase...`)
  const games = matches
    .filter(m => m.homeTeam?.name && m.awayTeam?.name)
    .map(mapMatch)

  const { error } = await supabase.from('games').upsert(games, { onConflict: 'api_fixture_id' })
  if (error) {
    console.error('Erro ao inserir:', error.message)
    process.exit(1)
  }

  const finished = games.filter(g => g.is_finished).length
  const pending = games.filter(g => !g.is_finished).length
  console.log(`✅ ${games.length} jogos importados!`)
  console.log(`   ${finished} encerrados | ${pending} agendados`)

  // Mostra amostra
  console.log('\nPrimeiros 3 jogos:')
  games.slice(0, 3).forEach(g => {
    console.log(`  ${g.home_team} × ${g.away_team} — ${new Date(g.game_date).toLocaleDateString('pt-BR')} [${g.stage}${g.group_name ? ' · ' + g.group_name : ''}]${g.is_finished ? ` → ${g.home_score}×${g.away_score}` : ''}`)
  })
}

main().catch(err => {
  console.error('Erro:', err.message)
  process.exit(1)
})
