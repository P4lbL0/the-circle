import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EventsClient } from './EventsClient'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function EventsPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: community } = await supabase
    .from('communities')
    .select('id, name, slug')
    .eq('slug', slug)
    .eq('owner_id', user.id)
    .single()

  if (!community) redirect('/dashboard')

  const { data: events } = await supabase
    .from('events')
    .select('*, event_rsvps(id, status, profile_id)')
    .eq('community_id', community.id)
    .order('start_at', { ascending: true })

  return (
    <EventsClient
      community={community}
      initialEvents={events ?? []}
    />
  )
}