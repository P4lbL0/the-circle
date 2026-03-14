import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { JoinClient } from './JoinClient'
import { getMemberLimit } from '@/lib/plan-limits'

interface Props {
  params:      Promise<{ slug: string }>
  searchParams: Promise<{ token?: string }>
}

export default async function JoinPage({ params, searchParams }: Props) {
  const { slug }  = await params
  const { token } = await searchParams
  const supabase  = await createClient()

  if (!token) notFound()

  const { data: community } = await supabase
    .from('communities')
    .select('id, name, slug, logo_url, description, theme_json, subscription_tier')
    .eq('slug', slug)
    .single()

  if (!community) notFound()

  // Vérifier si l'user est déjà connecté
  const { data: { user } } = await supabase.auth.getUser()

  // Si connecté → vérifier s'il est déjà membre
  if (user) {
    const { data: existing } = await supabase
      .from('community_members')
      .select('id, role')
      .eq('community_id', community.id)
      .eq('profile_id', user.id)
      .single()

    if (existing) {
      // Déjà membre → rediriger vers la vitrine
      redirect(`/c/${slug}`)
    }

    // Vérifier la limite de membres avant d'ajouter
    const { count } = await supabase
      .from('community_members')
      .select('*', { count: 'exact', head: true })
      .eq('community_id', community.id)

    const limit = getMemberLimit(community.subscription_tier)
    if ((count ?? 0) >= limit) {
      return (
        <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Rajdhani, sans-serif', color: '#e0e0e0' }}>
          <div style={{ textAlign: 'center', padding: '40px', background: '#141414', border: '1px solid #FF2344', borderRadius: '16px', maxWidth: '400px' }}>
            <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🚫</div>
            <h2 style={{ fontFamily: 'Orbitron, sans-serif', color: '#FF2344', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 12px' }}>Communauté complète</h2>
            <p style={{ color: '#666', fontSize: '0.9rem', margin: '0 0 20px' }}>Cette communauté a atteint sa limite de {limit} membres.</p>
            <a href={`/c/${slug}`} style={{ color: '#FFC107', fontSize: '0.85rem' }}>Voir la vitrine →</a>
          </div>
        </div>
      )
    }

    // Pas encore membre → l'ajouter directement
    await supabase
      .from('community_members')
      .insert({
        community_id: community.id,
        profile_id:   user.id,
        role:         'member',
      })

    redirect(`/c/${slug}`)
  }

  // Non connecté → afficher page d'accueil du lien
  return <JoinClient community={community} token={token} />
}