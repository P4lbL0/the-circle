import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardSidebar } from './DashboardSidebar'

interface Props {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export default async function DashboardLayout({ children, params }: Props) {
  const { slug } = await params
  const supabase  = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Récupérer la communauté (sans contrainte owner pour les modos)
  const { data: community } = await supabase
    .from('communities')
    .select('id, name, slug, logo_url, subscription_tier, owner_id')
    .eq('slug', slug)
    .single()

  if (!community) redirect('/dashboard')

  const isOwner = community.owner_id === user.id

  // Si pas owner, vérifier s'il est modérateur actif
  if (!isOwner) {
    const { data: membership } = await supabase
      .from('community_members')
      .select('role')
      .eq('community_id', community.id)
      .eq('profile_id', user.id)
      .in('role', ['moderator'])
      .single()

    if (!membership) redirect('/dashboard')
  }

  // Auto-ajoute l'owner dans community_members (nécessaire pour RLS annonces etc.)
  if (isOwner) {
    const { data: ownerMember } = await supabase
      .from('community_members')
      .select('id')
      .eq('community_id', community.id)
      .eq('profile_id', user.id)
      .single()

    if (!ownerMember) {
      await supabase.from('community_members').insert({
        community_id: community.id,
        profile_id:   user.id,
        role:         'owner',
      })
    }
  }

  return (
    <>
      <style>{`
        .tc-main {
          flex: 1;
          margin-left: 240px;
          min-height: 100vh;
          max-width: calc(100vw - 240px);
          overflow-x: hidden;
        }
        @media (max-width: 768px) {
          .tc-main {
            margin-left: 0 !important;
            max-width: 100vw;
            padding-top: 52px;
            padding-bottom: 60px;
          }
        }
      `}</style>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0a' }}>
        <DashboardSidebar community={community} />
        <main className="tc-main">
          {children}
        </main>
      </div>
    </>
  )
}
