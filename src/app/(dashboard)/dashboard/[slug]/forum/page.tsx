import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import { ForumClient }  from './ForumClient'

interface Props { params: Promise<{ slug: string }> }

export default async function ForumDashboardPage({ params }: Props) {
  const { slug } = await params
  const supabase  = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: community } = await supabase
    .from('communities').select('id, name, slug')
    .eq('slug', slug).eq('owner_id', user.id).single()
  if (!community) redirect('/dashboard')

  const { data: categories } = await supabase
    .from('forum_categories')
    .select('*, forum_threads(id, title, created_at, pinned, locked, author_id, profiles(display_name))')
    .eq('community_id', community.id)
    .order('position', { ascending: true })

  return <ForumClient community={community} initialCategories={categories ?? []} />
}
