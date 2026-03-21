import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardHomeClient } from './DashboardHomeClient'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function DashboardHomePage({ params }: Props) {
  const { slug }  = await params
  const supabase  = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: community } = await supabase
    .from('communities')
    .select('id, name, slug, logo_url, subscription_tier, owner_id, invite_token, description, community_type')
    .eq('slug', slug)
    .single()

  if (!community) redirect('/dashboard')

  const isOwner = community.owner_id === user.id
  let isModerator = false

  if (!isOwner) {
    const { data: membership } = await supabase
      .from('community_members')
      .select('role')
      .eq('community_id', community.id)
      .eq('profile_id', user.id)
      .in('role', ['moderator'])
      .single()
    if (!membership) redirect('/dashboard')
    isModerator = true
  }

  const canManage = isOwner || isModerator

  // ── Stats ────────────────────────────────────────────────────────────────
  const [
    { count: activeMembers },
    { count: pendingMembers },
    { count: upcomingEvents },
    { data: features },
  ] = await Promise.all([
    supabase.from('community_members').select('*', { count: 'exact', head: true })
      .eq('community_id', community.id).in('role', ['owner','moderator','member']),
    supabase.from('community_members').select('*', { count: 'exact', head: true })
      .eq('community_id', community.id).eq('role', 'pending'),
    supabase.from('events').select('*', { count: 'exact', head: true })
      .eq('community_id', community.id).gte('start_at', new Date().toISOString()),
    supabase.from('features').select('module').eq('community_id', community.id).eq('enabled', true),
  ])

  // ── Annonces ─────────────────────────────────────────────────────────────
  const { data: rawAnnouncements } = await supabase
    .from('announcements')
    .select('id, title, content, type, created_at, community_id, author_id, profiles(display_name)')
    .or(`community_id.eq.${community.id},community_id.is.null`)
    .order('created_at', { ascending: false })
    .limit(30)

  const { data: reads } = await supabase
    .from('announcement_reads')
    .select('announcement_id')
    .eq('profile_id', user.id)

  const readIds = new Set(reads?.map(r => r.announcement_id) ?? [])

  const announcements = (rawAnnouncements ?? []).map(a => ({
    ...a,
    isRead:   readIds.has(a.id),
    isGlobal: a.community_id === null,
    authorName: (a.profiles as any)?.display_name ?? 'Admin',
  }))

  return (
    <DashboardHomeClient
      community={{ ...community, inviteToken: community.invite_token ?? community.slug }}
      userId={user.id}
      canManage={canManage}
      stats={{
        members:  activeMembers  ?? 0,
        pending:  pendingMembers ?? 0,
        events:   upcomingEvents ?? 0,
        modules:  features?.length ?? 0,
      }}
      initialAnnouncements={announcements}
    />
  )
}
