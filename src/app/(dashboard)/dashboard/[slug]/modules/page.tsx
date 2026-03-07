import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ModulesClient } from './ModulesClient'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ModulesPage({ params }: Props) {
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

  const { data: features } = await supabase
    .from('features')
    .select('*')
    .eq('community_id', community.id)
    .order('module')

  return (
    <ModulesClient
      community={community}
      initialFeatures={features ?? []}
    />
  )
}