import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import { BetsClient }   from './BetsClient'

interface Props { params: Promise<{ slug: string }> }

export default async function BetsPage({ params }: Props) {
  const { slug } = await params
  const supabase  = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: community } = await supabase
    .from('communities').select('id, name, slug')
    .eq('slug', slug).eq('owner_id', user.id).single()
  if (!community) redirect('/dashboard')

  const { data: bets } = await supabase
    .from('bets')
    .select('*, bet_entries(id, profile_id, chosen_option_id, points_wagered)')
    .eq('community_id', community.id)
    .order('created_at', { ascending: false })

  return <BetsClient community={community} initialBets={bets ?? []} />
}
