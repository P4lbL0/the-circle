import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TournamentsClient } from './TournamentsClient'

interface Props { params: Promise<{ slug: string }> }

export default async function TournamentsPage({ params }: Props) {
  const { slug } = await params
  const supabase  = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: community } = await supabase
    .from('communities').select('id, name, slug')
    .eq('slug', slug).eq('owner_id', user.id).single()
  if (!community) redirect('/dashboard')

  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('*, tournament_participants(id, name, score, rank, profile_id)')
    .eq('community_id', community.id)
    .order('created_at', { ascending: false })

  return (
    <TournamentsClient
      community={community}
      initialTournaments={tournaments ?? []}
    />
  )
}
