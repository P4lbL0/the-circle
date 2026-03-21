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

  return (
    <>
      <style>{`
        .tc-main {
          flex: 1;
          margin-left: 240px;
          min-height: 100vh;
        }
        @media (max-width: 768px) {
          .tc-main {
            margin-left: 0 !important;
            padding-top: 52px;
            padding-bottom: 60px;
          }
        }
      `}</style>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0a' }}>
        <DashboardSidebar community={community} currentSlug={slug} />
        <main className="tc-main">
          {children}
        </main>
      </div>
    </>
  )
}
