import { createClient } from '@/lib/supabase/server'
import { notFound }     from 'next/navigation'
import { ChatClient }   from './ChatClient'

interface Props { params: Promise<{ slug: string; groupId: string }> }

export default async function ChatRoomPage({ params }: Props) {
  const { slug, groupId } = await params
  const supabase          = await createClient()

  const { data: community } = await supabase
    .from('communities').select('*').eq('slug', slug).eq('privacy', 'public').single()
  if (!community) notFound()

  const { data: feature } = await supabase
    .from('features').select('id')
    .eq('community_id', community.id).eq('module', 'forum').eq('enabled', true).single()
  if (!feature) notFound()

  const { data: group } = await supabase
    .from('chat_groups').select('id, name, is_public, created_at')
    .eq('id', groupId).eq('community_id', community.id).single()
  if (!group) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  let isMember    = false
  let isModerator = false
  let userProfile: { display_name: string; avatar_url: string | null } | null = null

  if (user) {
    const { data: m } = await supabase.from('community_members')
      .select('role').eq('community_id', community.id).eq('profile_id', user.id)
      .in('role', ['owner', 'moderator', 'member']).single()
    isMember    = !!m
    isModerator = m?.role === 'owner' || m?.role === 'moderator'

    if (isMember) {
      const { data: p } = await supabase
        .from('profiles').select('display_name, avatar_url').eq('id', user.id).single()
      userProfile = p
    }
  }

  // Groupe privé : accès membres seulement
  if (!group.is_public && !isMember) notFound()

  // 50 derniers messages (les plus récents)
  const { data: messages } = await supabase
    .from('chat_messages')
    .select('id, content, author_id, created_at, profiles(display_name, avatar_url)')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .limit(50)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const initialMessages = (messages ?? []).reverse() as any[]

  return (
    <ChatClient
      community={community}
      group={group}
      initialMessages={initialMessages}
      userId={user?.id ?? null}
      isMember={isMember}
      isModerator={isModerator}
      userProfile={userProfile}
    />
  )
}
