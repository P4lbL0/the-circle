'use client'

export function MemberCard({ member, rank }: { member: any, rank: number }) {
  const profile = member.profiles
  const displayName = profile?.display_name ?? profile?.email?.split('@')[0] ?? '???'
  const initial = displayName[0]?.toUpperCase()

  const roleColors: Record<string, string> = {
    owner: '#FFC107',
    moderator: '#00bcd4',
    member: '#4CAF50',
  }
  const roleColor = roleColors[member.role] ?? '#888'

  return (
    <div
      style={{
        background: 'linear-gradient(145deg, #1a1a1a, #0d0d0d)',
        border: '1px solid #333',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s',
        clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = '#FFC107'
        el.style.transform = 'translateY(-5px)'
        el.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = '#333'
        el.style.transform = 'translateY(0)'
        el.style.boxShadow = 'none'
      }}
    >
      {/* Ligne jaune top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '2px',
        background: 'linear-gradient(90deg, transparent, #FFC107, transparent)',
      }} />

      {/* Rang */}
      <div style={{
        position: 'absolute', top: '10px', right: '10px',
        fontFamily: "'Orbitron', sans-serif",
        fontSize: '0.7rem', color: '#444',
      }}>
        #{rank}
      </div>

      {/* Header card */}
      <div style={{
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        background: 'rgba(255,255,255,0.02)',
      }}>
        <div style={{
          width: '60px', height: '60px',
          background: '#222',
          border: `1px solid ${roleColor}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Orbitron', sans-serif",
          fontSize: '1.5rem',
          color: '#FFC107',
          borderRadius: '4px',
          boxShadow: '0 0 10px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          {profile?.avatar_url
            ? <img src={profile.avatar_url} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : initial
          }
        </div>
        <div>
          <h3 style={{
            margin: 0,
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '1rem',
            color: 'white',
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }}>
            {displayName}
          </h3>
          <span style={{
            fontSize: '0.75rem',
            color: roleColor,
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            {member.role}
          </span>
        </div>
      </div>

      {/* Badges */}
      {member.badges && member.badges.length > 0 && (
        <div style={{ padding: '0 20px 10px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {member.badges.map((badge: any, i: number) => (
            <span key={i} style={{
              fontSize: '0.62rem',
              textTransform: 'uppercase',
              fontWeight: 'bold',
              padding: '2px 6px',
              borderRadius: '2px',
              border: '1px solid #FFC107',
              color: '#FFC107',
              background: 'rgba(255,193,7,0.1)',
            }}>
              {badge.name ?? badge}
            </span>
          ))}
        </div>
      )}

      {/* Stats footer */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid #222' }}>
        <div style={{ padding: '14px', textAlign: 'center', borderRight: '1px solid #222' }}>
          <span style={{ display: 'block', fontFamily: "'Orbitron', sans-serif", fontSize: '1.1rem', color: 'white' }}>
            {member.points}
          </span>
          <span style={{ fontSize: '0.68rem', color: '#666', textTransform: 'uppercase' }}>Points</span>
        </div>
        <div style={{ padding: '14px', textAlign: 'center' }}>
          <span style={{ display: 'block', fontFamily: "'Orbitron', sans-serif", fontSize: '1.1rem', color: 'white' }}>
            {member.badges?.length ?? 0}
          </span>
          <span style={{ fontSize: '0.68rem', color: '#666', textTransform: 'uppercase' }}>Badges</span>
        </div>
      </div>
    </div>
  )
}
