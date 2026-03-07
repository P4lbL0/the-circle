import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MembersClient } from './MembersClient'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function MembersPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: community } = await supabase
    .from('communities')
    .select('id, name, slug, subscription_tier')
    .eq('slug', slug)
    .eq('owner_id', user.id)
    .single()

  if (!community) redirect('/dashboard')

  const { data: members } = await supabase
    .from('community_members')
    .select('*, profiles(id, display_name, avatar_url, email)')
    .eq('community_id', community.id)
    .order('joined_at', { ascending: false })

  const { data: statSchema } = await supabase
    .from('stat_schemas')
    .select('fields')
    .eq('community_id', community.id)
    .single()

  return (
    <MembersClient
      community={community}
      initialMembers={members ?? []}
      statFields={(statSchema?.fields as any[]) ?? []}
    />
  )
}