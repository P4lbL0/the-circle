import { createClient } from '@/lib/supabase/server'
import { notFound }      from 'next/navigation'
import { ShopPublicClient } from './ShopPublicClient'

interface Props { params: Promise<{ slug: string }> }

export default async function PublicShopPage({ params }: Props) {
  const { slug } = await params
  const supabase  = await createClient()

  const { data: community } = await supabase
    .from('communities').select('*').eq('slug', slug).eq('privacy', 'public').single()
  if (!community) notFound()

  const { data: feature } = await supabase
    .from('features').select('*').eq('community_id', community.id).eq('module', 'shop').eq('enabled', true).single()
  if (!feature) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: items } = await supabase
    .from('shop_items')
    .select('*')
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
    <ShopPublicClient
      community={community}
      items={items ?? []}
      userId={user?.id ?? null}
      memberPoints={memberPoints}
      isMember={isMember}
    />
  )
}
