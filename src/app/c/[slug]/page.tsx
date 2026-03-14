import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { MemberCard } from './MemberCard'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function CommunityVitrinePage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: community } = await supabase
    .from('communities')
    .select('*')
    .eq('slug', slug)
    .eq('privacy', 'public')
    .single()

  if (!community) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const isAdmin = !!user && user.id === community.owner_id

  const theme = community.theme_json as {
    primaryColor: string
    accentColor:  string
    font:         string
    darkMode:     boolean
  }

  const bg          = theme.darkMode ? '#0a0a0a' : '#f5f5f5'
  const panel       = theme.darkMode ? '#141414' : '#ffffff'
  const text        = theme.darkMode ? '#e0e0e0' : '#1a1a1a'
  const muted       = theme.darkMode ? '#666'    : '#999'
  const primaryColor = theme.primaryColor

  // Membres publics actifs
  const { data: members } = await supabase
    .from('community_members')
    .select('*, profiles(display_name, avatar_url, email)')
    .eq('community_id', community.id)
    .eq('is_public', true)
    .in('role', ['owner', 'moderator', 'member'])
    .order('points', { ascending: false })

  // Modules publics actifs
  const { data: features } = await supabase
    .from('features')
    .select('*')
    .eq('community_id', community.id)
    .eq('enabled', true)

  // Stat schema
  const { data: statSchema } = await supabase
    .from('stat_schemas')
    .select('fields, formula_config')
    .eq('community_id', community.id)
    .single()

  const activeModules   = features?.map(f => f.module) ?? []
  const publicModules   = features?.filter(f => f.visibility === 'public').map(f => f.module) ?? []
  const statFields      = (statSchema?.fields as any[] ?? []).filter((f: any) => f.visible_public)
  const formulaConfig   = statSchema?.formula_config as any

  // Calcul du score global pour chaque membre
  const membersWithScore = (members ?? []).map(member => {
    let score = member.points
    if (formulaConfig?.expression && statFields.length > 0) {
      try {
        const stats = member.custom_stats as Record<string, number> ?? {}
        const keys  = Object.keys(stats)
        const vals  = Object.values(stats)
        // eslint-disable-next-line no-new-func
        const fn    = new Function(...keys, `return ${formulaConfig.expression}`)
        score = Math.round(fn(...vals) * 100) / 100
      } catch { /* garder points si formule invalide */ }
    }
    return { ...member, computed_score: score }
  }).sort((a, b) => b.computed_score - a.computed_score)

  const showPodium = membersWithScore.length >= 3 && activeModules.includes('scores')
  const showModuleNav = publicModules.length >= 2

  // Podium order: #2, #1, #3
  const podiumOrder = showPodium
    ? [membersWithScore[1], membersWithScore[0], membersWithScore[2]]
    : []
  const podiumRanks = [2, 1, 3]

  return (
    <div style={{ backgroundColor: bg, minHeight: '100vh', fontFamily: `'Rajdhani', sans-serif`, color: text }}>

      {/* ── FONTS & GLOBAL STYLES ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;500;600;700&family=Oswald:wght@400;600;700&family=Montserrat:wght@400;600;700&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }

        .vit-nav-link {
          font-family: 'Rajdhani', sans-serif;
          font-size: 0.88rem;
          color: ${muted};
          text-decoration: none;
          padding: 14px 20px;
          text-transform: uppercase;
          letter-spacing: 1px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          border-bottom: 2px solid transparent;
          transition: color 0.2s, border-color 0.2s;
        }
        .vit-nav-link:hover {
          color: ${primaryColor};
          border-bottom-color: ${primaryColor};
        }

        .vit-header-link {
          font-size: 0.75rem;
          color: ${muted};
          text-decoration: none;
          padding: 8px 14px;
          border-radius: 4px;
          position: relative;
          transition: color 0.2s;
          font-family: 'Rajdhani', sans-serif;
          text-transform: uppercase;
          letter-spacing: 1px;
          display: inline-block;
        }
        .vit-header-link::after {
          content: '';
          position: absolute;
          bottom: 2px; left: 14px; right: 14px;
          height: 1px;
          background: ${primaryColor};
          transform: scaleX(0);
          transition: transform 0.2s;
        }
        .vit-header-link:hover { color: ${primaryColor}; }
        .vit-header-link:hover::after { transform: scaleX(1); }

        .vit-join-btn {
          display: inline-block;
          background: ${primaryColor};
          color: #000;
          font-family: 'Orbitron', sans-serif;
          font-weight: bold;
          padding: 14px 32px;
          border-radius: 6px;
          text-decoration: none;
          text-transform: uppercase;
          font-size: 0.82rem;
          letter-spacing: 2px;
          box-shadow: 0 0 20px ${primaryColor}40;
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .vit-join-btn:hover {
          box-shadow: 0 0 36px ${primaryColor}70;
          transform: translateY(-1px);
        }

        .vit-stat-pill {
          background: ${theme.darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)'};
          border: 1px solid ${primaryColor}33;
          border-radius: 20px;
          padding: 8px 18px;
          font-size: 0.82rem;
          color: ${muted};
          white-space: nowrap;
        }
        .vit-stat-pill span {
          color: ${primaryColor};
          font-family: 'Orbitron', sans-serif;
          font-weight: 700;
          margin-right: 4px;
        }

        .vit-podium-card {
          background: ${theme.darkMode ? '#141414' : '#fff'};
          border: 1px solid ${theme.darkMode ? '#2a2a2a' : '#ddd'};
          border-radius: 12px;
          padding: 24px 16px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          transition: transform 0.2s;
        }
        .vit-podium-card:hover { transform: translateY(-2px); }
        .vit-podium-card.rank-1 {
          border-color: ${primaryColor};
          box-shadow: 0 0 24px ${primaryColor}30;
          transform: translateY(-10px);
        }
        .vit-podium-card.rank-1:hover { transform: translateY(-12px); }

        @media (max-width: 768px) {
          .vit-hero-title { font-size: 2rem !important; }
          .vit-hero-desc { display: none; }
          .vit-stat-pills { flex-wrap: wrap !important; justify-content: center !important; }
          .vit-podium { grid-template-columns: 1fr !important; }
          .vit-members-grid { grid-template-columns: 1fr !important; }
          .vit-header-nav { display: none !important; }
          .vit-module-nav-scroll { overflow-x: auto; }
        }
      `}</style>

      {/* ── HEADER (sticky) ── */}
      <header style={{
        backgroundColor: theme.darkMode ? '#080808' : '#fff',
        borderBottom: `2px solid ${primaryColor}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 30px', position: 'sticky', top: 0, zIndex: 1000,
        minHeight: '60px',
      }}>
        {/* Left: logo + name + badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {community.logo_url && (
            <img
              src={community.logo_url}
              alt={community.name}
              style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', border: `1px solid ${primaryColor}` }}
            />
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              fontFamily: `'Orbitron', sans-serif`,
              fontSize: '1rem', fontWeight: 700,
              color: theme.darkMode ? 'white' : '#111',
              textTransform: 'uppercase', letterSpacing: '2px',
            }}>
              {community.name}
            </span>
            <span style={{
              fontSize: '0.6rem', color: primaryColor,
              border: `1px solid ${primaryColor}`,
              padding: '2px 6px', borderRadius: '3px',
              fontFamily: 'Orbitron', letterSpacing: '1px',
            }}>
              {community.subscription_tier.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Right: nav links + login */}
        <div className="vit-header-nav" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {publicModules.includes('scores') && (
            <a href={`/c/${slug}/leaderboard`} className="vit-header-link">🏆 Classement</a>
          )}
          {publicModules.includes('calendar') && (
            <a href={`/c/${slug}/events`} className="vit-header-link">📅 Événements</a>
          )}
          {publicModules.includes('tournaments') && (
            <a href={`/c/${slug}/tournaments`} className="vit-header-link">🥊 Tournois</a>
          )}
          {publicModules.includes('bets') && (
            <a href={`/c/${slug}/bets`} className="vit-header-link">🎲 Paris</a>
          )}
          {publicModules.includes('forum') && (
            <a href={`/c/${slug}/forum`} className="vit-header-link">💬 Forum</a>
          )}
          {publicModules.includes('shop') && (
            <a href={`/c/${slug}/shop`} className="vit-header-link">🛍️ Boutique</a>
          )}
          <a href="/login" style={{
            marginLeft: '12px',
            fontFamily: `'Orbitron', sans-serif`, fontSize: '0.72rem',
            color: primaryColor, border: `1px solid ${primaryColor}`,
            padding: '8px 16px', borderRadius: '4px', textDecoration: 'none',
            textTransform: 'uppercase', letterSpacing: '1px',
            transition: 'background 0.2s',
          }}>
            Connexion
          </a>
        </div>
      </header>

      {/* ── HERO (full-width) ── */}
      <section style={{
        position: 'relative',
        minHeight: '400px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        backgroundColor: theme.darkMode ? '#1a1a1a' : '#f0f0f0',
      }}>
        {/* Background image or pattern */}
        {community.banner_url ? (
          <>
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${community.banner_url})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
              opacity: 0.3,
            }} />
            <div style={{
              position: 'absolute', inset: 0,
              background: `linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, ${bg} 100%)`,
            }} />
          </>
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `radial-gradient(${primaryColor}11 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }} />
        )}

        {/* Hero content */}
        <div style={{
          position: 'relative', zIndex: 1,
          maxWidth: '900px', width: '100%',
          margin: '0 auto', padding: '80px 30px',
          textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px',
        }}>
          {/* Logo */}
          {community.logo_url && (
            <img
              src={community.logo_url}
              alt={community.name}
              style={{
                width: '100px', height: '100px',
                borderRadius: '16px', objectFit: 'cover',
                border: `3px solid ${primaryColor}`,
                boxShadow: `0 0 30px ${primaryColor}50`,
              }}
            />
          )}

          {/* Name */}
          <h1
            className="vit-hero-title"
            style={{
              fontFamily: `'Orbitron', sans-serif`,
              fontSize: 'clamp(2rem, 5vw, 4rem)',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: theme.darkMode ? 'white' : '#111',
              margin: 0,
              textShadow: `0 0 40px ${primaryColor}60`,
              letterSpacing: '3px',
            }}
          >
            {community.name}
          </h1>

          {/* Description */}
          {community.description && (
            <p
              className="vit-hero-desc"
              style={{
                fontStyle: 'italic',
                color: muted,
                maxWidth: '600px',
                margin: 0,
                fontSize: '1.05rem',
                lineHeight: 1.6,
              }}
            >
              {community.description}
            </p>
          )}

          {/* Stat pills */}
          <div className="vit-stat-pills" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
            <div className="vit-stat-pill">
              <span>{membersWithScore.length}</span>Membres
            </div>
            <div className="vit-stat-pill">
              <span>{activeModules.length}</span>Modules
            </div>
            {activeModules.includes('tournaments') && (
              <div className="vit-stat-pill">⚔️ Tournois</div>
            )}
            {activeModules.includes('bets') && (
              <div className="vit-stat-pill">🎲 Paris</div>
            )}
            {activeModules.includes('forum') && (
              <div className="vit-stat-pill">💬 Forum</div>
            )}
            {activeModules.includes('shop') && (
              <div className="vit-stat-pill">🛍️ Boutique</div>
            )}
          </div>

          {/* Join button */}
          {publicModules.includes('applications') && (
            <a href={`/c/${slug}/apply`} className="vit-join-btn">
              Rejoindre la communauté
            </a>
          )}
        </div>
      </section>

      {/* ── MODULE NAV (sticky under hero, if 2+ public modules) ── */}
      {showModuleNav && (
        <nav style={{
          position: 'sticky',
          top: '60px',
          zIndex: 999,
          backgroundColor: theme.darkMode ? '#0d0d0d' : '#f8f8f8',
          borderBottom: `1px solid ${primaryColor}33`,
        }}>
          <div className="vit-module-nav-scroll" style={{ display: 'flex', maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
            {publicModules.includes('scores') && (
              <a href={`/c/${slug}/leaderboard`} className="vit-nav-link">🏆 Classement</a>
            )}
            {publicModules.includes('calendar') && (
              <a href={`/c/${slug}/events`} className="vit-nav-link">📅 Événements</a>
            )}
            {publicModules.includes('tournaments') && (
              <a href={`/c/${slug}/tournaments`} className="vit-nav-link">🥊 Tournois</a>
            )}
            {publicModules.includes('bets') && (
              <a href={`/c/${slug}/bets`} className="vit-nav-link">🎲 Paris</a>
            )}
            {publicModules.includes('forum') && (
              <a href={`/c/${slug}/forum`} className="vit-nav-link">💬 Forum</a>
            )}
            {publicModules.includes('shop') && (
              <a href={`/c/${slug}/shop`} className="vit-nav-link">🛍️ Boutique</a>
            )}
          </div>
        </nav>
      )}

      {/* ── MEMBRES ── */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 30px' }}>
        {/* Section title */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '40px',
          borderLeft: `4px solid ${primaryColor}`,
          paddingLeft: '16px',
        }}>
          <h2 style={{
            fontFamily: `'${theme.font}', sans-serif`,
            color: theme.darkMode ? 'white' : '#111',
            margin: 0, fontSize: '1.6rem',
            textTransform: 'uppercase', letterSpacing: '2px',
          }}>
            Membres
          </h2>
          <span style={{ fontSize: '0.75rem', color: muted, fontFamily: 'Rajdhani', letterSpacing: '1px' }}>
            {membersWithScore.length} MEMBRE{membersWithScore.length > 1 ? 'S' : ''}
          </span>
        </div>

        {/* PODIUM TOP 3 */}
        {showPodium && (
          <div style={{ marginBottom: '48px' }}>
            <div style={{
              fontSize: '0.72rem', color: muted, fontFamily: 'Orbitron',
              textTransform: 'uppercase', letterSpacing: '2px',
              marginBottom: '20px', textAlign: 'center',
            }}>
              Top 3
            </div>
            <div
              className="vit-podium"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1.15fr 1fr',
                gap: '16px',
                alignItems: 'flex-end',
                maxWidth: '700px',
                margin: '0 auto',
              }}
            >
              {podiumOrder.map((member, idx) => {
                const rank = podiumRanks[idx]
                const isFirst = rank === 1
                const profile = member.profiles as any
                const displayName = profile?.display_name ?? profile?.email?.split('@')[0] ?? 'Membre'
                const initial = displayName[0]?.toUpperCase() ?? '?'
                return (
                  <div
                    key={member.id}
                    className={`vit-podium-card${isFirst ? ' rank-1' : ''}`}
                  >
                    {/* Rank badge */}
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: isFirst ? primaryColor : (theme.darkMode ? '#2a2a2a' : '#eee'),
                      color: isFirst ? '#000' : muted,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Orbitron', fontWeight: 700, fontSize: '0.75rem',
                    }}>
                      #{rank}
                    </div>
                    {/* Avatar */}
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={displayName}
                        style={{
                          width: isFirst ? '72px' : '56px',
                          height: isFirst ? '72px' : '56px',
                          borderRadius: '10px',
                          objectFit: 'cover',
                          border: `${isFirst ? '3px' : '1px'} solid ${isFirst ? primaryColor : (theme.darkMode ? '#333' : '#ddd')}`,
                          boxShadow: isFirst ? `0 0 16px ${primaryColor}40` : 'none',
                        }}
                      />
                    ) : (
                      <div style={{
                        width: isFirst ? '72px' : '56px',
                        height: isFirst ? '72px' : '56px',
                        borderRadius: '10px',
                        background: theme.darkMode ? '#2a2a2a' : '#eee',
                        border: `${isFirst ? '3px' : '1px'} solid ${isFirst ? primaryColor : (theme.darkMode ? '#333' : '#ddd')}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: `'${theme.font}', sans-serif`,
                        color: isFirst ? primaryColor : muted,
                        fontSize: isFirst ? '1.8rem' : '1.4rem',
                        fontWeight: 700,
                        boxShadow: isFirst ? `0 0 16px ${primaryColor}40` : 'none',
                      }}>
                        {initial}
                      </div>
                    )}
                    {/* Name */}
                    <div style={{
                      fontFamily: `'${theme.font}', sans-serif`,
                      fontSize: isFirst ? '0.95rem' : '0.85rem',
                      color: theme.darkMode ? 'white' : '#111',
                      fontWeight: 700,
                      textAlign: 'center',
                    }}>
                      {displayName}
                    </div>
                    {/* Score */}
                    <div style={{
                      fontFamily: 'Orbitron',
                      fontSize: isFirst ? '1.1rem' : '0.9rem',
                      color: primaryColor,
                      fontWeight: 700,
                    }}>
                      {member.computed_score}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: muted }}>
                      {formulaConfig?.label ?? 'Score'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* All members grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '20px',
        }}>
          {membersWithScore.map((member, idx) => (
            <MemberCard
              key={member.id}
              member={member}
              rank={idx + 1}
              theme={theme}
              statFields={statFields}
              formulaLabel={formulaConfig?.label ?? 'Score'}
              currentUserId={user?.id}
              isAdmin={isAdmin}
              slug={slug}
            />
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        backgroundColor: theme.darkMode ? '#080808' : '#f0f0f0',
        textAlign: 'center',
        padding: '40px',
        color: theme.darkMode ? '#333' : '#bbb',
        fontSize: '0.82rem',
        borderTop: `1px solid ${theme.darkMode ? '#1a1a1a' : '#ddd'}`,
      }}>
        Propulsé par{' '}
        <a href="/" style={{
          color: primaryColor, textDecoration: 'none',
          fontFamily: `'Orbitron', sans-serif`, fontSize: '0.78rem',
          letterSpacing: '2px',
        }}>
          THE CIRCLE
        </a>
      </footer>
    </div>
  )
}
