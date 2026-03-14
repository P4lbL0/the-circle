import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { EventsPublicClient } from './EventsPublicClient'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function PublicEventsPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: community } = await supabase
    .from('communities')
    .select('*')
    .eq('slug', slug)
    .eq('privacy', 'public')
    .single()

  if (!community) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: events } = await supabase
    .from('events')
    .select('*, event_rsvps(id, status, profile_id)')
    .eq('community_id', community.id)
    .eq('visibility', 'public')
    .gte('start_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('start_at', { ascending: true })

  // RSVP de l'user connecté
  const userRsvps = user
    ? (events ?? []).reduce((acc, e) => {
        const rsvp = e.event_rsvps?.find((r: any) => r.profile_id === user.id)
        if (rsvp) acc[e.id] = rsvp.status
        return acc
      }, {} as Record<string, string>)
    : {}

  return (
    <EventsPublicClient
      community={community}
      events={events ?? []}
      userId={user?.id ?? null}
      initialRsvps={userRsvps}
    />
  )
}