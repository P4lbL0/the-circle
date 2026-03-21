import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { safeEval } from '@/lib/safe-eval'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function LeaderboardPage({ params }: Props) {
  const { slug } = await params
  const supabase  = await createClient()

  const { data: community } = await supabase
    .from('communities')
    .select('*')
    .eq('slug', slug)
    .eq('privacy', 'public')
    .single()


  if (!community) notFound()

  const { data: scoresFeature } = await supabase
    .from('features')
    .select('id')
    .eq('community_id', community.id)
    .eq('module', 'scores')
    .eq('enabled', true)
    .single()
  if (!scoresFeature) notFound()

  const theme = community.theme_json as {
    primaryColor: string
    accentColor:  string
    font:         string
    darkMode:     boolean
  }

  const bg    = theme.darkMode ? '#0a0a0a' : '#f5f5f5'
  const panel = theme.darkMode ? '#141414' : '#ffffff'
  const text  = theme.darkMode ? '#e0e0e0' : '#1a1a1a'
  const muted = theme.darkMode ? '#666'    : '#999'

  const { data: members } = await supabase
    .from('community_members')
    .select('*, profiles(display_name, avatar_url)')
    .eq('community_id', community.id)
    .eq('is_public', true)
    .in('role', ['owner', 'moderator', 'member'])
    .order('points', { ascending: false })

  const { data: statSchema } = await supabase
    .from('stat_schemas')
    .select('fields, formula_config')
    .eq('community_id', community.id)
    .single()

  const statFields     = (statSchema?.fields as any[] ?? []).filter((f: any) => f.visible_public)
  const formulaConfig  = statSchema?.formula_config as any

  const ranked = (members ?? []).map(member => {
    let score = member.points ?? 0
    if (formulaConfig?.expression && statFields.length > 0) {
      try {
        const stats = member.custom_stats as Record<string, number> ?? {}
        score = safeEval(formulaConfig.expression, stats)
      } catch { /* garder points si formule invalide */ }
    }
    return { ...member, computed_score: score }
  }).sort((a, b) => b.computed_score - a.computed_score)

  const MEDAL = ['🥇', '🥈', '🥉']

  return (
    <div style={{ backgroundColor: bg, minHeight: '100vh', fontFamily: `'Rajdhani', sans-serif`, color: text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;500;600;700&display=swap'); * { box-sizing: border-box; }`}</style>

      {/* Header */}
      <header style={{
        backgroundColor: theme.darkMode ? '#0d0d0d' : '#fff',
        borderBottom: `2px solid ${theme.primaryColor}`,
        padding: '15px 30px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 1000,
      }}>
        <Link href={`/c/${slug}`} style={{
          display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none',
        }}>
          {community.logo_url && (
            <img src={community.logo_url} alt={community.name}
              style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover', border: `1px solid ${theme.primaryColor}` }}
            />
          )}
          <span style={{
            fontFamily: `'${theme.font}', sans-serif`, fontSize: '1rem',
            color: theme.darkMode ? 'white' : '#111', textTransform: 'uppercase', letterSpacing: '2px',
          }}>
            {community.name}
          </span>
        </Link>
        <Link href={`/c/${slug}`} style={{
          fontFamily: `'${theme.font}', sans-serif`, fontSize: '0.72rem',
          color: muted, border: `1px solid ${theme.darkMode ? '#333' : '#ddd'}`,
          padding: '7px 14px', borderRadius: '4px', textDecoration: 'none',
        }}>
          ← Retour à la vitrine
        </Link>
      </header>

      {/* Title */}
      <div style={{ textAlign: 'center', padding: '50px 20px 30px' }}>
        <h1 style={{
          fontFamily: `'${theme.font}', sans-serif`, fontSize: '2rem',
          color: theme.primaryColor, textTransform: 'uppercase',
          letterSpacing: '4px', margin: '0 0 8px',
        }}>
          Classement
        </h1>
        <p style={{ color: muted, fontSize: '0.9rem', margin: 0 }}>
          {ranked.length} membre{ranked.length !== 1 ? 's' : ''} classé{ranked.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Leaderboard */}
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 20px 60px' }}>
        {ranked.length === 0 ? (
          <div style={{
            background: panel, border: `1px solid ${theme.darkMode ? '#1a1a1a' : '#e0e0e0'}`,
            borderRadius: '12px', padding: '60px', textAlign: 'center', color: muted,
          }}>
            Aucun membre public pour l'instant.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {ranked.map((member, index) => {
              const profile = member.profiles as any
              const isTop3  = index < 3
              return (
                <div key={member.id} style={{
                  background: isTop3
                    ? `linear-gradient(135deg, ${panel}, ${theme.primaryColor}0a)`
                    : panel,
                  border: `1px solid ${isTop3 ? theme.primaryColor + '44' : (theme.darkMode ? '#1a1a1a' : '#e0e0e0')}`,
                  borderRadius: '10px',
                  padding: '14px 20px',
                  display: 'flex', alignItems: 'center', gap: '16px',
                  transition: 'transform 0.15s',
                }}>
                  {/* Rank */}
                  <div style={{
                    width: '36px', textAlign: 'center', flexShrink: 0,
                    fontFamily: 'Orbitron', fontSize: isTop3 ? '1.4rem' : '0.85rem',
                    color: isTop3 ? theme.primaryColor : muted,
                  }}>
                    {isTop3 ? MEDAL[index] : `#${index + 1}`}
                  </div>

                  {/* Avatar */}
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '50%',
                    background: theme.darkMode ? '#1a1a1a' : '#eee',
                    border: `2px solid ${isTop3 ? theme.primaryColor : (theme.darkMode ? '#2a2a2a' : '#ddd')}`,
                    overflow: 'hidden', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Orbitron', fontSize: '1rem', color: theme.primaryColor,
                  }}>
                    {profile?.avatar_url
                      ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : (profile?.display_name?.[0] ?? '?').toUpperCase()
                    }
                  </div>

                  {/* Name + role */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: `'${theme.font}', sans-serif`,
                      fontSize: '1rem', fontWeight: 700,
                      color: theme.darkMode ? 'white' : '#111',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {profile?.display_name ?? 'Membre'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: muted, textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {member.role}
                    </div>
                  </div>

                  {/* Score */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{
                      fontFamily: 'Orbitron', fontSize: '1.1rem',
                      color: isTop3 ? theme.primaryColor : text,
                    }}>
                      {member.computed_score.toLocaleString('fr-FR')}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: muted, textTransform: 'uppercase', letterSpacing: '1px' }}>
                      pts
                    </div>
                  </div>

                  {/* Stat fields */}
                  {statFields.length > 0 && (
                    <div style={{
                      display: 'flex', gap: '12px', borderLeft: `1px solid ${theme.darkMode ? '#2a2a2a' : '#e0e0e0'}`,
                      paddingLeft: '16px', flexShrink: 0,
                    }}>
                      {statFields.slice(0, 3).map((field: any) => {
                        const val = (member.custom_stats as any)?.[field.id] ?? '-'
                        return (
                          <div key={field.id} style={{ textAlign: 'center' }}>
                            <div style={{ fontFamily: 'Orbitron', fontSize: '0.85rem', color: text }}>
                              {typeof val === 'number' ? val.toLocaleString('fr-FR') : val}
                              {field.type === 'percentage' ? '%' : ''}
                            </div>
                            <div style={{ fontSize: '0.62rem', color: muted, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>
                              {field.label}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '20px', color: muted, fontSize: '0.72rem', letterSpacing: '2px' }}>
        PROPULSÉ PAR{' '}
        <Link href="/" style={{ color: theme.primaryColor, textDecoration: 'none', fontFamily: 'Orbitron', fontSize: '0.72rem' }}>
          THE CIRCLE
        </Link>
      </div>
    </div>
  )
}
