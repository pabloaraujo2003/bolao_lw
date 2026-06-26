import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()

  const [{ data: pool }, { data: questions }, { data: rawParticipants }] = await Promise.all([
    admin.from('special_pools').select('*, game:games(id, home_team, away_team, game_date, api_fixture_id)').eq('id', id).single(),
    admin.from('special_questions').select('*').eq('pool_id', id).order('order_index'),
    admin.from('special_participants').select('user_id, paid, profiles(name)').eq('pool_id', id),
  ])

  // Count answers per participant and sum points
  const participants = await Promise.all(
    (rawParticipants ?? []).map(async (p: any) => {
      const { data: answers } = await admin
        .from('special_answers')
        .select('points, question_id')
        .in('question_id', (questions ?? []).map((q: any) => q.id))
        .eq('user_id', p.user_id)

      return {
        ...p,
        profile: p.profiles,
        answers_count: answers?.length ?? 0,
        total_points: answers?.reduce((sum: number, a: any) => sum + (a.points ?? 0), 0) ?? 0,
      }
    })
  )

  return NextResponse.json({ pool, questions: questions ?? [], participants })
}
