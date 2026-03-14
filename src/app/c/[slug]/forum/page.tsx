import { createClient } from '@/lib/supabase/server'
import { notFound }     from 'next/navigation'

interface Props { params: Promise<{ slug: string }> }

export default async function PublicForumPage({ params }: Props) {
  const { slug } = await params
  const supabase  = await createClient()

  const { data: community } = await supabase
    .from('communities').select('*').eq('slug', slug).eq('privacy', 'public').single()
  if (!community) notFound()

  const { data: feature } = await supabase
    .from('features').select('*').eq('community_id', community.id).eq('module', 'forum').eq('enabled', true).single()
  if (!feature) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  let isMember = false
  if (user) {
    const { data: m } = await supabase.from('community_members')
      .select('id').eq('community_id', community.id).eq('profile_id', user.id).in('role', ['owner', 'moderator', 'member']).single()
    isMember = !!m
  }

  const { data: categories } = await supabase
    .from('forum_categories')
    .select('id, name, visibility, forum_threads(id, title, created_at, pinned, locked, author_id, profiles(display_name))')
    .eq('community_id', community.id)
    .order('position', { ascending: true })

  // Filtrer les catégories selon visibilité
  const visibleCategories = (categories ?? []).filter(c => c.visibility === 'public' || isMember)

  const theme = community.theme_json as { primaryColor: string; accentColor: string; font: string; darkMode: boolean }
  const bg    = theme.darkMode ? '#0a0a0a' : '#f5f5f5'
  const panel = theme.darkMode ? '#141414' : '#ffffff'
  const text  = theme.darkMode ? '#e0e0e0' : '#1a1a1a'
  const muted = theme.darkMode ? '#666'    : '#999'
  const bord  = theme.darkMode ? '#222'    : '#e0e0e0'

  return (
    <div style={{ background: bg, minHeight: '100vh', fontFamily: "'Rajdhani', sans-serif", color: text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Rajdhani:wght@400;600;700&family=Oswald:wght@600&family=Montserrat:wght@600&family=Inter:wght@500;600&display=swap');`}</style>

      <header style={{ background: theme.darkMode ? '#0d0d0d' : '#fff', borderBottom: `2px solid ${theme.primaryColor}`, padding: '15px 30px', display: 'flex', alignItems: 'center', gap: '16px', position: 'sticky', top: 0, zIndex: 100 }}>
        <a href={`/c/${community.slug}`} style={{ color: muted, textDecoration: 'none', fontSize: '1.2rem' }}>←</a>
        {community.logo_url && <img src={community.logo_url} alt="" style={{ width: '34px', height: '34px', borderRadius: '6px', objectFit: 'cover' }} />}
        <h1 style={{ margin: 0, fontFamily: `'${theme.font}', sans-serif`, fontSize: '1rem', color: theme.darkMode ? 'white' : '#111', textTransform: 'uppercase', letterSpacing: '2px' }}>
          {community.name} — Forum
        </h1>
        {!user && (
          <a href={`/login?redirect=/c/${community.slug}/forum`} style={{ marginLeft: 'auto', background: theme.primaryColor, color: '#000', fontFamily: `'${theme.font}', sans-serif`, fontWeight: 'bold', padding: '7px 16px', borderRadius: '4px', textDecoration: 'none', fontSize: '0.78rem', textTransform: 'uppercase' }}>
            Connexion
          </a>
        )}
      </header>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 24px' }}>
        {visibleCategories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', color: muted }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💬</div>
            <p style={{ fontFamily: `'${theme.font}', sans-serif`, textTransform: 'uppercase', fontSize: '0.88rem' }}>Aucune discussion pour le moment</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {visibleCategories.map(cat => {
              const threads = [...(cat.forum_threads ?? [])].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
              return (
                <div key={cat.id} style={{ background: panel, border: `1px solid ${bord}`, borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ padding: '14px 20px', borderBottom: `1px solid ${bord}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 style={{ margin: 0, fontFamily: `'${theme.font}', sans-serif`, fontSize: '1rem', color: text, textTransform: 'uppercase', letterSpacing: '1px' }}>{cat.name}</h2>
                    <span style={{ fontSize: '0.72rem', color: muted }}>{threads.length} discussion{threads.length > 1 ? 's' : ''}</span>
                  </div>

                  {isMember && (
                    <div style={{ padding: '10px 20px', borderBottom: `1px solid ${bord}` }}>
                      <a href={`/c/${community.slug}/forum/${cat.id}/new`} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        background: `${theme.primaryColor}15`, border: `1px solid ${theme.primaryColor}44`,
                        color: theme.primaryColor, padding: '6px 14px', borderRadius: '6px',
                        textDecoration: 'none', fontSize: '0.8rem', fontFamily: `'${theme.font}', sans-serif`,
                        textTransform: 'uppercase',
                      }}>
                        + Nouveau thread
                      </a>
                    </div>
                  )}

                  {threads.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: muted, fontSize: '0.88rem' }}>Sois le premier à poster ici</div>
                  ) : (
                    <div>
                      {threads.map(thread => (
                        <a key={thread.id} href={`/c/${community.slug}/forum/${thread.id}`}
                          style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px', borderBottom: `1px solid ${bord}`, textDecoration: 'none', transition: 'background 0.1s' }}
                          onMouseEnter={e => (e.currentTarget).style.background = theme.darkMode ? '#1a1a1a' : '#f8f8f8'}
                          onMouseLeave={e => (e.currentTarget).style.background = 'transparent'}
                        >
                          <span style={{ fontSize: '1rem', flexShrink: 0 }}>{thread.pinned ? '📌' : thread.locked ? '🔒' : '💬'}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.95rem', color: thread.locked ? muted : text, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {thread.title}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: muted, marginTop: '2px' }}>
                              {(thread.profiles as any)?.display_name ?? 'Anonyme'} · {new Date(thread.created_at).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                          <span style={{ color: muted, fontSize: '1rem', flexShrink: 0 }}>→</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
