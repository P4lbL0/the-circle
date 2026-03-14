'use client'

interface StatField {
  key:           string
  label:         string
  type:          string
  visible_public: boolean
}

interface Theme {
  primaryColor: string
  accentColor:  string
  font:         string
  darkMode:     boolean
}

export function MemberCard({ member, rank, theme, statFields, formulaLabel, currentUserId, isAdmin, slug }: {
  member:        any
  rank:          number
  theme:         Theme
  statFields:    StatField[]
  formulaLabel:  string
  currentUserId?: string
  isAdmin?:      boolean
  slug?:         string
}) {
  const profile     = member.profiles
  const displayName = profile?.display_name ?? profile?.email?.split('@')[0] ?? '???'
  const initial     = displayName[0]?.toUpperCase()

  const roleColors: Record<string, string> = {
    owner:     theme.primaryColor,
    moderator: '#00bcd4',
    member:    '#4CAF50',
  }
  const roleColor = roleColors[member.role] ?? '#888'

  const numericStats = statFields.filter(f => f.type === 'number' || f.type === 'percentage')

  return (
    <div
      style={{
        background: theme.darkMode ? 'linear-gradient(145deg, #1a1a1a, #0d0d0d)' : 'linear-gradient(145deg, #ffffff, #f8f8f8)',
        border: `1px solid ${theme.darkMode ? '#333' : '#e0e0e0'}`,
        position: 'relative', overflow: 'hidden', transition: 'all 0.3s',
        clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = theme.primaryColor
        el.style.transform = 'translateY(-5px)'
        el.style.boxShadow = `0 10px 30px rgba(0,0,0,0.5)`
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = theme.darkMode ? '#333' : '#e0e0e0'
        el.style.transform = 'translateY(0)'
        el.style.boxShadow = 'none'
      }}
    >
      {/* Ligne top couleur principale */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '2px',
        background: `linear-gradient(90deg, transparent, ${theme.primaryColor}, transparent)`,
      }} />

      {/* Rang */}
      <div style={{
        position: 'absolute', top: '10px', right: '10px',
        fontFamily: `'${theme.font}', sans-serif`,
        fontSize: '0.7rem', color: theme.darkMode ? '#444' : '#ccc',
      }}>
        #{rank}
      </div>

      {/* Header */}
      <div style={{
        padding: '20px', display: 'flex', alignItems: 'center', gap: '14px',
        background: theme.darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
      }}>
        <div style={{
          width: '58px', height: '58px', background: theme.darkMode ? '#222' : '#eee',
          border: `1px solid ${roleColor}`, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontFamily: `'${theme.font}', sans-serif`,
          fontSize: '1.4rem', color: theme.primaryColor, borderRadius: '4px',
          overflow: 'hidden', flexShrink: 0,
        }}>
          {profile?.avatar_url
            ? <img src={profile.avatar_url} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : initial
          }
        </div>
        <div>
          <h3 style={{
            margin: 0, fontFamily: `'${theme.font}', sans-serif`, fontSize: '0.95rem',
            color: theme.darkMode ? 'white' : '#111', letterSpacing: '1px', textTransform: 'uppercase',
          }}>
            {displayName}
          </h3>
          <span style={{ fontSize: '0.72rem', color: roleColor, textTransform: 'uppercase', letterSpacing: '1px' }}>
            {member.role}
          </span>
        </div>
      </div>

      {/* Badges */}
      {member.badges?.length > 0 && (
        <div style={{ padding: '0 18px 10px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {member.badges.map((badge: any, i: number) => (
            <span key={i} style={{
              fontSize: '0.6rem', padding: '2px 6px', borderRadius: '2px', fontWeight: 'bold',
              border: `1px solid ${badge.color ?? theme.primaryColor}`,
              color: badge.color ?? theme.primaryColor,
              background: `${badge.color ?? theme.primaryColor}18`,
              textTransform: 'uppercase',
            }}>
              {badge.name ?? badge}
            </span>
          ))}
        </div>
      )}

      {/* Bouton admin (visible uniquement pour l'owner sur sa propre carte) */}
      {isAdmin && currentUserId && member.profile_id === currentUserId && slug && (
        <div style={{ padding: '12px 18px', borderTop: `1px solid ${theme.darkMode ? '#222' : '#eee'}` }}>
          <a
            href={`/dashboard/${slug}`}
            style={{
              display: 'block',
              textAlign: 'center',
              padding: '8px 12px',
              background: `${theme.primaryColor}18`,
              border: `1px solid ${theme.primaryColor}`,
              borderRadius: '4px',
              color: theme.primaryColor,
              fontFamily: `'Orbitron', sans-serif`,
              fontSize: '0.68rem',
              fontWeight: 700,
              textDecoration: 'none',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${theme.primaryColor}35` }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${theme.primaryColor}18` }}
          >
            ⚙ Administrer
          </a>
        </div>
      )}

      {/* Stats dynamiques */}
      {numericStats.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(numericStats.length + 1, 4)}, 1fr)`,
          borderTop: `1px solid ${theme.darkMode ? '#222' : '#eee'}`,
        }}>
          {/* Score calculé */}
          <div style={{
            padding: '13px 8px', textAlign: 'center',
            borderRight: `1px solid ${theme.darkMode ? '#222' : '#eee'}`,
            background: `${theme.primaryColor}08`,
          }}>
            <span style={{ display: 'block', fontFamily: `'${theme.font}', sans-serif`, fontSize: '1.1rem', color: theme.primaryColor, fontWeight: 700 }}>
              {member.computed_score}
            </span>
            <span style={{ fontSize: '0.62rem', color: theme.darkMode ? '#555' : '#bbb', textTransform: 'uppercase' }}>
              {formulaLabel}
            </span>
          </div>
          {/* Champs dynamiques */}
          {numericStats.slice(0, 3).map((field, i) => (
            <div key={field.key} style={{
              padding: '13px 8px', textAlign: 'center',
              borderRight: i < numericStats.slice(0, 3).length - 1 ? `1px solid ${theme.darkMode ? '#222' : '#eee'}` : 'none',
            }}>
              <span style={{ display: 'block', fontFamily: `'${theme.font}', sans-serif`, fontSize: '1.1rem', color: theme.darkMode ? 'white' : '#111' }}>
                {member.custom_stats?.[field.key] ?? 0}
              </span>
              <span style={{ fontSize: '0.62rem', color: theme.darkMode ? '#555' : '#bbb', textTransform: 'uppercase' }}>
                {field.label}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          borderTop: `1px solid ${theme.darkMode ? '#222' : '#eee'}`,
        }}>
          <div style={{ padding: '13px', textAlign: 'center', borderRight: `1px solid ${theme.darkMode ? '#222' : '#eee'}` }}>
            <span style={{ display: 'block', fontFamily: `'${theme.font}', sans-serif`, fontSize: '1.1rem', color: theme.darkMode ? 'white' : '#111' }}>
              {member.points}
            </span>
            <span style={{ fontSize: '0.62rem', color: theme.darkMode ? '#555' : '#bbb', textTransform: 'uppercase' }}>Points</span>
          </div>
          <div style={{ padding: '13px', textAlign: 'center' }}>
            <span style={{ display: 'block', fontFamily: `'${theme.font}', sans-serif`, fontSize: '1.1rem', color: theme.darkMode ? 'white' : '#111' }}>
              {member.badges?.length ?? 0}
            </span>
            <span style={{ fontSize: '0.62rem', color: theme.darkMode ? '#555' : '#bbb', textTransform: 'uppercase' }}>Badges</span>
          </div>
        </div>
      )}
    </div>
  )
}