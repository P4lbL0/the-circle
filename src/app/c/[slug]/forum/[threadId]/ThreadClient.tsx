'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Post {
  id:         string
  content:    string
  author_id:  string
  created_at: string
  profiles?:  { display_name: string; avatar_url: string | null } | null
}

export function ThreadClient({ community, thread, initialPosts, userId, isMember, userProfile }: {
  community:    any
  thread:       any
  initialPosts: Post[]
  userId:       string | null
  isMember:     boolean
  userProfile:  any
}) {
  const supabase = createClient()
  const theme = community.theme_json as { primaryColor: string; accentColor: string; font: string; darkMode: boolean }
  const bg    = theme.darkMode ? '#0a0a0a' : '#f5f5f5'
  const panel = theme.darkMode ? '#141414' : '#ffffff'
  const text  = theme.darkMode ? '#e0e0e0' : '#1a1a1a'
  const muted = theme.darkMode ? '#666'    : '#999'
  const bord  = theme.darkMode ? '#222'    : '#e0e0e0'

  const [posts, setPosts]       = useState<Post[]>(initialPosts)
  const [content, setContent]   = useState('')
  const [posting, setPosting]   = useState(false)
  const [toast, setToast]       = useState<string | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  const submitPost = async () => {
    if (!content.trim() || !userId) return
    if (thread.locked) { showToast('Ce thread est verrouillé'); return }
    setPosting(true)
    const { data, error } = await supabase
      .from('forum_posts')
      .insert({ thread_id: thread.id, community_id: community.id, author_id: userId, content: content.trim() })
      .select('*, profiles(display_name, avatar_url)')
      .single()
    if (!error && data) {
      setPosts(prev => [...prev, data])
      setContent('')
      showToast('Message publié')
    } else { showToast('Erreur lors de l\'envoi') }
    setPosting(false)
  }

  const deletePost = async (postId: string) => {
    if (!confirm('Supprimer ce message ?')) return
    const { error } = await supabase.from('forum_posts').delete().eq('id', postId)
    if (!error) setPosts(prev => prev.filter(p => p.id !== postId))
  }

  const inputStyle: React.CSSProperties = {
    background: theme.darkMode ? '#0a0a0a' : '#f8f8f8', border: `1px solid ${bord}`, color: text,
    padding: '10px 14px', borderRadius: '6px', fontFamily: 'Rajdhani', fontSize: '1rem',
    outline: 'none', width: '100%', boxSizing: 'border-box', resize: 'vertical' as const, lineHeight: 1.5,
  }

  return (
    <div style={{ background: bg, minHeight: '100vh', fontFamily: "'Rajdhani', sans-serif", color: text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Rajdhani:wght@400;600;700&family=Oswald:wght@600&family=Montserrat:wght@600&family=Inter:wght@500;600&display=swap');`}</style>

      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: panel, border: `1px solid ${theme.primaryColor}`, color: theme.primaryColor, padding: '12px 20px', borderRadius: '8px', fontFamily: `'${theme.font}', sans-serif`, fontSize: '0.82rem' }}>
          {toast}
        </div>
      )}

      <header style={{ background: theme.darkMode ? '#0d0d0d' : '#fff', borderBottom: `2px solid ${theme.primaryColor}`, padding: '15px 30px', display: 'flex', alignItems: 'center', gap: '16px', position: 'sticky', top: 0, zIndex: 100 }}>
        <a href={`/c/${community.slug}/forum`} style={{ color: muted, textDecoration: 'none', fontSize: '1.2rem' }}>←</a>
        {community.logo_url && <img src={community.logo_url} alt="" style={{ width: '34px', height: '34px', borderRadius: '6px', objectFit: 'cover' }} />}
        <h1 style={{ margin: 0, fontFamily: `'${theme.font}', sans-serif`, fontSize: '0.95rem', color: theme.darkMode ? 'white' : '#111', textTransform: 'uppercase', letterSpacing: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {thread.title}
        </h1>
        {thread.locked && <span style={{ flexShrink: 0, fontSize: '0.7rem', padding: '2px 8px', borderRadius: '3px', border: '1px solid #555', color: '#666' }}>🔒 Verrouillé</span>}
      </header>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Premier post (le thread lui-même) */}
        <div style={{ background: panel, border: `2px solid ${theme.primaryColor}22`, borderRadius: '12px', padding: '24px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: theme.darkMode ? '#2a2a2a' : '#eee', border: `1px solid ${theme.primaryColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: `'${theme.font}', sans-serif`, color: theme.primaryColor, fontSize: '1rem', flexShrink: 0 }}>
              {thread.profiles?.display_name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <div style={{ fontFamily: `'${theme.font}', sans-serif`, fontSize: '0.88rem', color: text, fontWeight: 600 }}>{thread.profiles?.display_name ?? 'Anonyme'}</div>
              <div style={{ fontSize: '0.72rem', color: muted }}>{new Date(thread.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
            </div>
            {thread.pinned && <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#FFC107' }}>📌 Épinglé</span>}
          </div>
          <h2 style={{ margin: '0 0 12px', fontFamily: `'${theme.font}', sans-serif`, fontSize: '1.2rem', color: text, textTransform: 'uppercase', letterSpacing: '1px' }}>{thread.title}</h2>
          {thread.content && <p style={{ margin: 0, lineHeight: 1.7, color: text, fontSize: '1rem', whiteSpace: 'pre-wrap' }}>{thread.content}</p>}
        </div>

        {/* Réponses */}
        <div style={{ margin: '16px 0', fontSize: '0.72rem', color: muted, textTransform: 'uppercase', letterSpacing: '2px', paddingLeft: '4px' }}>
          {posts.length} réponse{posts.length > 1 ? 's' : ''}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
          {posts.map((post, idx) => {
            const canDelete = userId === post.author_id
            return (
              <div key={post.id} style={{ background: panel, border: `1px solid ${bord}`, borderRadius: '10px', padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: theme.darkMode ? '#2a2a2a' : '#eee', border: `1px solid ${bord}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: `'${theme.font}', sans-serif`, color: muted, fontSize: '0.9rem', flexShrink: 0 }}>
                    {post.profiles?.display_name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ fontFamily: `'${theme.font}', sans-serif`, fontSize: '0.85rem', color: text, fontWeight: 600 }}>{post.profiles?.display_name ?? 'Anonyme'}</span>
                      <span style={{ fontSize: '0.72rem', color: muted }}>{new Date(post.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      {canDelete && (
                        <button onClick={() => deletePost(post.id)} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#333', cursor: 'pointer', fontSize: '0.75rem', padding: '2px 6px' }}
                          onMouseEnter={e => (e.currentTarget).style.color = '#FF2344'}
                          onMouseLeave={e => (e.currentTarget).style.color = '#333'}
                          title="Supprimer"
                        >🗑</button>
                      )}
                    </div>
                    <p style={{ margin: 0, lineHeight: 1.6, color: text, fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>{post.content}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Zone de réponse */}
        {!thread.locked && isMember && userId && (
          <div style={{ background: panel, border: `1px solid ${bord}`, borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: theme.darkMode ? '#2a2a2a' : '#eee', border: `1px solid ${theme.primaryColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: `'${theme.font}', sans-serif`, color: theme.primaryColor, fontSize: '0.9rem', flexShrink: 0 }}>
                {userProfile?.display_name?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div style={{ flex: 1 }}>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Ta réponse..."
                  rows={4}
                  style={inputStyle}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button
                    onClick={submitPost}
                    disabled={posting || !content.trim()}
                    style={{
                      background: theme.primaryColor, color: '#000', border: 'none',
                      padding: '9px 22px', borderRadius: '6px', cursor: posting || !content.trim() ? 'not-allowed' : 'pointer',
                      fontFamily: `'${theme.font}', sans-serif`, fontWeight: 'bold', fontSize: '0.82rem',
                      textTransform: 'uppercase', opacity: !content.trim() ? 0.5 : 1,
                    }}
                  >
                    {posting ? 'Envoi...' : 'Répondre'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!userId && (
          <div style={{ background: `${theme.primaryColor}10`, border: `1px solid ${theme.primaryColor}33`, borderRadius: '10px', padding: '16px 20px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 12px', color: muted, fontSize: '0.9rem' }}>Connecte-toi pour participer à la discussion</p>
            <a href={`/login?redirect=/c/${community.slug}/forum/${thread.id}`} style={{ background: theme.primaryColor, color: '#000', fontFamily: `'${theme.font}', sans-serif`, fontWeight: 'bold', padding: '8px 20px', borderRadius: '4px', textDecoration: 'none', fontSize: '0.82rem', textTransform: 'uppercase' }}>
              Connexion
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
