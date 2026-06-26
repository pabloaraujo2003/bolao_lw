import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SpecialPoolClient } from './SpecialPoolClient'

export default async function SpecialPoolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) redirect('/login')

  const [{ data: pool }, { data: questions }, { data: part }, { data: myAnswers }] = await Promise.all([
    supabase
      .from('special_pools')
      .select('*, game:games(id, home_team, away_team, game_date, home_flag, away_flag, is_finished)')
      .eq('id', id)
      .single(),
    supabase
      .from('special_questions')
      .select('*')
      .eq('pool_id', id)
      .order('order_index'),
    supabase
      .from('special_participants')
      .select('paid')
      .eq('user_id', session.user.id)
      .eq('pool_id', id)
      .single(),
    supabase
      .from('special_answers')
      .select('question_id, answer, points')
      .eq('user_id', session.user.id)
      .in(
        'question_id',
        ((await supabase.from('special_questions').select('id').eq('pool_id', id)).data ?? []).map((q: any) => q.id)
      ),
  ])

  if (!pool) redirect('/boloes')

  const answerMap = new Map(myAnswers?.map((a: any) => [a.question_id, a]) ?? [])

  return (
    <SpecialPoolClient
      pool={pool}
      questions={questions ?? []}
      participation={part ?? null}
      answerMap={Object.fromEntries(answerMap)}
      userId={session.user.id}
    />
  )
}
