import { createClient } from '@/lib/supabase/server'
import { notFound }      from 'next/navigation'
import { BetsPublicClient } from './BetsPublicClient'

interface Props { params: Promise<{ slug: string }> }

export default async function PublicBetsPage({ params }: Props) {
  const { slug } = await params
  const supabase  = await createClient()

  const { data: community } = await supabase
    .from('communities').select('*').eq('slug', slug).eq('privacy', 'public').single()
  if (!community) notFound()

  const { data: feature } = await supabase
    .from('features').select('*').eq('community_id', community.id).eq('module', 'bets').eq('enabled', true).single()
  if (!feature) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: bets } = await supabase
    .from('bets')
    .select('*, bet_entries(id, profile_id, chosen_option_id, points_wagered)')
    .eq('community_id', community.id)
    .order('created_at', { ascending: false })

  // Points du membre connecté
  let memberPoints = 0
  let isMember = false
  if (user) {
    const { data: member } = await supabase
      .from('community_members')
      .select('points, role')
      .eq('community_id', community.id)
      .eq('profile_id', user.id)
      .single()
    if (member) {
      memberPoints = member.points ?? 0
      isMember = true
    }
  }

  return (
    <BetsPublicClient
      community={community}
      bets={bets ?? []}
      userId={user?.id ?? null}
      memberPoints={memberPoints}
      isMember={isMember}
    />
  )
}
