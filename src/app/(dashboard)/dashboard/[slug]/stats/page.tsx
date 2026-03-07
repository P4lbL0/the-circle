import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StatsSchemaClient } from './StatsSchemaClient'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function StatsSchemaPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: community } = await supabase
    .from('communities')
    .select('id, name, slug, community_type')
    .eq('slug', slug)
    .eq('owner_id', user.id)
    .single()

  if (!community) redirect('/dashboard')

  const { data: schema } = await supabase
    .from('stat_schemas')
    .select('*')
    .eq('community_id', community.id)
    .single()

  return (
    <StatsSchemaClient
      community={community}
      initialSchema={schema}
    />
  )
}