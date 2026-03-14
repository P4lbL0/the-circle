import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SuperAdminClient } from './SuperAdminClient'

export default async function SuperAdminPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Vérifier que l'utilisateur est superadmin
  const { data: profile } = await supabase
    .from('profiles')
    .select('global_role, display_name, email')
    .eq('id', user.id)
    .single()

  if (profile?.global_role !== 'super_admin') {
    redirect('/dashboard')
  }

  // Récupérer toutes les communautés avec stats
  const { data: communities } = await supabase
    .from('communities')
    .select(`
      id, name, slug, subscription_tier, privacy, community_type, created_at, logo_url,
      community_members(count)
    `)
    .order('created_at', { ascending: false })

  // Statistiques globales
  const { count: totalUsers }       = await supabase.from('profiles').select('*', { count: 'exact', head: true })
  const { count: totalCommunities } = await supabase.from('communities').select('*', { count: 'exact', head: true })
  const { count: totalEvents }      = await supabase.from('events').select('*', { count: 'exact', head: true })

  return (
    <SuperAdminClient
      adminName={profile.display_name ?? profile.email ?? 'Admin'}
      communities={communities ?? []}
      stats={{ totalUsers: totalUsers ?? 0, totalCommunities: totalCommunities ?? 0, totalEvents: totalEvents ?? 0 }}
    />
  )
}
