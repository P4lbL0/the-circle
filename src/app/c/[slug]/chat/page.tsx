import { createClient } from '@/lib/supabase/server'
import { notFound }     from 'next/navigation'

interface Props { params: Promise<{ slug: string }> }

export default async function PublicChatPage({ params }: Props) {
  const { slug }   = await params
  const supabase   = await createClient()

  const { data: community } = await supabase
    .from('communities').select('*').eq('slug', slug).eq('privacy', 'public').single()
  if (!community) notFound()

  const { data: feature } = await supabase
    .from('features').select('id')
    .eq('community_id', community.id).eq('module', 'forum').eq('enabled', true).single()
  if (!feature) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  let isMember = false
  if (user) {
    const { data: m } = await supabase.from('community_members')
      .select('id').eq('community_id', community.id).eq('profile_id', user.id)
      .in('role', ['owner', 'moderator', 'member']).single()
    isMember = !!m
  }

  const { data: groups } = await supabase
    .from('chat_groups')
    .select('id, name, is_public, created_at')
    .eq('community_id', community.id)
    .order('created_at', { ascending: true })

  const visibleGroups = (groups ?? []).filter(g => g.is_public || isMember)

  const theme  = community.theme_json as { primaryColor: string; accentColor: string; font: string; darkMode: boolean }
  const bg     = theme.darkMode ? '#0a0a0a' : '#f5f5f5'
  const panel  = theme.darkMode ? '#141414' : '#ffffff'
  const text   = theme.darkMode ? '#e0e0e0' : '#1a1a1a'
  const muted  = theme.darkMode ? '#666'    : '#999'
  const bord   = theme.darkMode ? '#222'    : '#e0e0e0'

  return (
    <div style={{ background: bg, minHeight: '100vh', fontFamily: "'Rajdhani', sans-serif", color: text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Rajdhani:wght@400;600;700&display=swap');`}</style>

      <header style={{ background: theme.darkMode ? '#0d0d0d' : '#fff', borderBottom: `2px solid ${theme.primaryColor}`, padding: '15px 30px', display: 'flex', alignItems: 'center', gap: '16px', position: 'sticky', top: 0, zIndex: 100 }}>
        <a href={`/c/${community.slug}`} style={{ color: muted, textDecoration: 'none', fontSize: '1.2rem' }}>←</a>
        {community.logo_url && <img src={community.logo_url} alt="" style={{ width: '34px', height: '34px', borderRadius: '6px', objectFit: 'cover' }} />}
        <h1 style={{ margin: 0, fontFamily: `'${theme.font}', sans-serif`, fontSize: '1rem', color: theme.darkMode ? 'white' : '#111', textTransform: 'uppercase', letterSpacing: '2px' }}>
          {community.name} — Chat
        </h1>
        {!user && (
          <a href={`/login?redirect=/c/${community.slug}/chat`} style={{ marginLeft: 'auto', background: theme.primaryColor, color: '#000', fontFamily: `'${theme.font}', sans-serif`, fontWeight: 'bold', padding: '7px 16px', borderRadius: '4px', textDecoration: 'none', fontSize: '0.78rem', textTransform: 'uppercase' }}>
            Connexion
          </a>
        )}
      </header>

      <style>{`
        .chat-group-link {
          display: flex; align-items: center; gap: 16px;
          background: ${panel}; border: 1px solid ${bord}; border-radius: 12px;
          padding: 18px 22px; text-decoration: none; transition: border-color 0.15s;
        }
        .chat-group-link:hover { border-color: ${theme.primaryColor}; }
      `}</style>

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 24px' }}>
        {visibleGroups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', color: muted }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💬</div>
            <p style={{ fontFamily: `'${theme.font}', sans-serif`, textTransform: 'uppercase', fontSize: '0.88rem', letterSpacing: '1px' }}>
              Aucun groupe de discussion disponible
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {visibleGroups.map(group => (
              <a
                key={group.id}
                href={`/c/${community.slug}/chat/${group.id}`}
                className="chat-group-link"
              >
                <div style={{
                  width: '44px', height: '44px', borderRadius: '10px',
                  background: `${theme.primaryColor}18`, border: `1px solid ${theme.primaryColor}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.3rem', flexShrink: 0,
                }}>
                  💬
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: `'${theme.font}', sans-serif`, fontSize: '1rem', color: text, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {group.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: muted, marginTop: '3px' }}>
                    {group.is_public ? '🌍 Public' : '🔒 Membres uniquement'}
                  </div>
                </div>
                <span style={{ color: muted, fontSize: '1.2rem' }}>→</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
