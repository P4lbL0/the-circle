import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import { ShopClient }   from './ShopClient'

interface Props { params: Promise<{ slug: string }> }

export default async function ShopDashboardPage({ params }: Props) {
  const { slug } = await params
  const supabase  = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: community } = await supabase
    .from('communities').select('id, name, slug, subscription_tier')
    .eq('slug', slug).eq('owner_id', user.id).single()
  if (!community) redirect('/dashboard')

  const { data: items } = await supabase
    .from('shop_items')
    .select('*')
    .eq('community_id', community.id)
    .order('created_at', { ascending: false })

  const { data: orders } = await supabase
    .from('shop_orders')
    .select('*, shop_items(name, type), profiles(display_name, email)')
    .eq('community_id', community.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return <ShopClient community={community} initialItems={items ?? []} initialOrders={orders ?? []} />
}
