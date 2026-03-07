import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { MemberCard } from './MemberCard'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function CommunityVitrinePage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  // Récupère la communauté
  const { data: community } = await supabase
    .from('communities')
    .select('*')
    .eq('slug', slug)
    .eq('privacy', 'public')
    .single()

  if (!community) notFound()

  // Récupère les membres publics actifs
  const { data: members } = await supabase
    .from('community_members')
    .select('*, profiles(display_name, avatar_url, email)')
    .eq('community_id', community.id)
    .eq('is_public', true)
    .in('role', ['owner', 'moderator', 'member'])
    .order('points', { ascending: false })

  // Récupère les modules publics actifs
  const { data: features } = await supabase
    .from('features')
    .select('*')
    .eq('community_id', community.id)
    .eq('enabled', true)
    .eq('visibility', 'public')

  const activeModules = features?.map(f => f.module) ?? []
  const theme = community.theme_json as any

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', fontFamily: "'Rajdhani', sans-serif", color: '#e0e0e0' }}>

      {/* ── HEADER ── */}
      <header style={{
        backgroundColor: '#0d0d0d',
        borderBottom: '2px solid #FFC107',
        padding: '15px 30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxSizing: 'border-box',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {community.logo_url && (
            <img
              src={community.logo_url}
              alt={community.name}
              style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #333' }}
            />
          )}
          <div>
            <h1 style={{
              margin: 0,
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '1.3rem',
              color: 'white',
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}>
              {community.name}
              <span style={{
                fontSize: '0.55em',
                color: '#FFC107',
                border: '1px solid #FFC107',
                padding: '2px 5px',
                borderRadius: '3px',
                marginLeft: '8px',
                verticalAlign: 'middle',
              }}>
                {community.subscription_tier.toUpperCase()}
              </span>
            </h1>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>
              thecircle.app/c/{community.slug}
            </p>
          </div>
        </div>
        
          <a href={`/login`}
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '0.75rem',
            color: '#FFC107',
            border: '1px solid #FFC107',
            padding: '8px 16px',
            borderRadius: '4px',
            textDecoration: 'none',
            textTransform: 'uppercase',
            transition: 'all 0.2s',
          }}
        >
          Connexion
        </a>
      </header>

      {/* ── HERO ── */}
      <section style={{
        backgroundColor: '#1e1e1e',
        textAlign: 'center',
        padding: '80px 30px',
        borderBottom: '5px solid #FFC107',
        boxShadow: '0 0 30px rgba(255,193,7,0.1)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Fond radial subtil */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(255,193,7,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {community.banner_url && (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${community.banner_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.15,
          }} />
        )}

        <div style={{
          position: 'relative',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'inline-block',
          padding: '30px 50px',
          borderRadius: '8px',
          maxWidth: '800px',
        }}>
          {community.logo_url && (
            <img
              src={community.logo_url}
              alt={community.name}
              style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', marginBottom: '20px', border: '2px solid #FFC107' }}
            />
          )}
          <h2 style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '2.5rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'white',
            margin: '0 0 15px 0',
          }}>
            Bienvenue dans{' '}
            <span style={{ color: '#FFC107', textShadow: '0 0 10px rgba(255,193,7,0.7)' }}>
              {community.name}
            </span>
          </h2>
          {community.description && (
            <p style={{ fontSize: '1.1rem', color: '#ccc', maxWidth: '600px', margin: '0 auto 25px auto', lineHeight: 1.6 }}>
              {community.description}
            </p>
          )}

          {/* Stats rapides */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '0',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.06))',
            border: '1px solid rgba(255,193,7,0.15)',
            borderRadius: '10px',
            padding: '14px 20px',
            marginTop: '20px',
            width: 'fit-content',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            {[
              { value: members?.length ?? 0, label: 'Membres' },
              { value: activeModules.length, label: 'Modules actifs' },
            ].map((stat, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                {i > 0 && <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.08)', margin: '0 20px' }} />}
                <div style={{ textAlign: 'center', minWidth: '100px' }}>
                  <div style={{ fontFamily: "'Orbitron', sans-serif", color: '#FFC107', fontSize: '1.6rem', fontWeight: 700, lineHeight: 1 }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#aaa', marginTop: '5px' }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

            {activeModules.includes('applications') && (
            
              <a href={`/c/${slug}/apply`}
              style={{
                display: 'inline-block',
                marginTop: '25px',
                background: '#FFC107',
                color: '#121212',
                fontFamily: "'Orbitron', sans-serif",
                fontWeight: 'bold',
                padding: '12px 28px',
                borderRadius: '4px',
                textDecoration: 'none',
                textTransform: 'uppercase',
                fontSize: '0.85rem',
                letterSpacing: '1px',
              }}
            >
              Rejoindre la communauté
            </a>
          )}
        </div>
      </section>

      {/* ── MEMBRES ── */}
      {activeModules.includes('scores') || true ? (
        <section style={{ padding: '50px 30px', maxWidth: '1200px', margin: '0 auto' }}>
          <h3 style={{
            fontFamily: "'Orbitron', sans-serif",
            color: 'white',
            borderLeft: '4px solid #FFC107',
            paddingLeft: '15px',
            marginBottom: '30px',
            fontSize: '1.6rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            Membres
            <span style={{ fontSize: '0.75rem', color: '#666', fontFamily: "'Rajdhani', sans-serif", letterSpacing: '1px' }}>
              {members?.length ?? 0} MEMBRE{(members?.length ?? 0) > 1 ? 'S' : ''}
            </span>
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '25px',
          }}>
            {members?.map((member: any, idx: number) => (
              <MemberCard key={member.id} member={member} rank={idx + 1} />
            ))}
          </div>
        </section>
      ) : null}

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: '1px solid #222',
        textAlign: 'center',
        padding: '30px',
        color: '#444',
        fontSize: '0.85rem',
        fontFamily: "'Rajdhani', sans-serif",
      }}>
        Propulsé par{' '}
        <a href="/" style={{ color: '#FFC107', textDecoration: 'none', fontFamily: "'Orbitron', sans-serif", fontSize: '0.8rem' }}>
          THE CIRCLE
        </a>
      </footer>
    </div>
  )
}