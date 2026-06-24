export type Profile = {
  id: string
  name: string
  paid: boolean
  is_admin: boolean
  created_at: string
}

export type Game = {
  id: number
  home_team: string
  away_team: string
  home_flag: string
  away_flag: string
  game_date: string
  stage: string
  group_name: string | null
  home_score: number | null
  away_score: number | null
  is_finished: boolean
  api_fixture_id: number
}

export type Prediction = {
  id: string
  user_id: string
  game_id: number
  predicted_home: number
  predicted_away: number
  points: number
  created_at: string
}

export type RankingRow = {
  user_id: string
  name: string
  total_points: number
  exact_scores: number
  correct_results: number
  predictions_count: number
}

export type Settings = Record<string, string>

export type SyncLog = {
  id: string
  synced_at: string
  games_updated: number
  status: 'success' | 'error'
  error_msg: string | null
}

export type GameWithPrediction = Game & {
  prediction?: Pick<Prediction, 'predicted_home' | 'predicted_away' | 'points'>
}
