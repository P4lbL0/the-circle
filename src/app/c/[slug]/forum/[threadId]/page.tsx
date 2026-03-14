import { createClient }  from '@/lib/supabase/server'
import { notFound }      from 'next/navigation'
import { ThreadClient }  from './ThreadClient'

interface Props { params: Promise<{ slug: string; threadId: string }> }

export default async function ThreadPage({ params }: Props) {
  const { slug, threadId } = await params
  const supabase = await createClient()

  const { data: community } = await supabase
    .from('communities').select('*').eq('slug', slug).eq('privacy', 'public').single()
  if (!community) notFound()

  const { data: thread } = await supabase
    .from('forum_threads')
    .select('*, profiles(display_name, avatar_url)')
    .eq('id', threadId).single()
  if (!thread) notFound()

  const { data: posts } = await supabase
    .from('forum_posts')
    .select('*, profiles(display_name, avatar_url)')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })

  const { data: { user } } = await supabase.auth.getUser()

  let isMember = false
  let userProfile = null
  if (user) {
    const { data: m } = await supabase.from('community_members')
      .select('role').eq('community_id', community.id).eq('profile_id', user.id)
      .in('role', ['owner', 'moderator', 'member']).single()
    isMember = !!m

    const { data: p } = await supabase.from('profiles').select('display_name, avatar_url').eq('id', user.id).single()
    userProfile = p
  }

  return (
    <ThreadClient
      community={community}
      thread={thread}
      initialPosts={posts ?? []}
      userId={user?.id ?? null}
      isMember={isMember}
      userProfile={userProfile}
    />
  )
}
