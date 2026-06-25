import { redis } from './redis'
import { createAdminClient } from './supabase/admin'
import type { Game, RankingRow } from './types'

const TTL = {
  settings: 300,
  games: 60,
  ranking: 60,
  profiles: 60,
  profile: 300,
}

async function cached<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
  try {
    const hit = await redis.get(key)
    if (hit) return JSON.parse(hit) as T
  } catch {}

  const data = await fn()

  try {
    await redis.setex(key, ttl, JSON.stringify(data))
  } catch {}

  return data
}

export function invalidate(...keys: string[]) {
  return redis.del(...keys).catch(() => {})
}

export function getCachedSettings(): Promise<Record<string, string>> {
  return cached('settings', TTL.settings, async () => {
    const admin = createAdminClient()
    const { data } = await admin.from('settings').select('key, value')
    const s: Record<string, string> = {}
    data?.forEach((r) => (s[r.key] = r.value))
    return s
  })
}

export function getCachedGames(): Promise<Game[]> {
  return cached('games', TTL.games, async () => {
    const admin = createAdminClient()
    const { data } = await admin
      .from('games')
      .select('*')
      .order('game_date', { ascending: true })
    return (data as Game[]) ?? []
  })
}

export function getCachedRanking(): Promise<RankingRow[]> {
  return cached('ranking', TTL.ranking, async () => {
    const admin = createAdminClient()
    const { data } = await admin.from('ranking').select('*')
    return (data as RankingRow[]) ?? []
  })
}

export function getCachedTotalPaid(): Promise<number> {
  return cached('total-paid', TTL.profiles, async () => {
    const admin = createAdminClient()
    const { count } = await admin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('paid', true)
    return count ?? 0
  })
}

export function getCachedProfile(
  userId: string
): Promise<{ name: string; is_admin: boolean } | null> {
  return cached(`profile:${userId}`, TTL.profile, async () => {
    const admin = createAdminClient()
    const { data } = await admin
      .from('profiles')
      .select('name, is_admin')
      .eq('id', userId)
      .single()
    return data as { name: string; is_admin: boolean } | null
  })
}
