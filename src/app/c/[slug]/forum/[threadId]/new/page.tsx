'use client'

import { useState }    from 'react'
import { useRouter }   from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { use }         from 'react'

// Note: [threadId] ici contient en réalité le categoryId (même segment de route)
interface Props { params: Promise<{ slug: string; threadId: string }> }

export default function NewThreadPage({ params }: Props) {
  const { slug, threadId: catId } = use(params)
  const router   = useRouter()
  const supabase = createClient()

  const [title, setTitle]       = useState('')
  const [content, setContent]   = useState('')
  const [posting, setPosting]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const submit = async () => {
    if (!title.trim()) { setError('Le titre est requis'); return }
    setPosting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push(`/login?redirect=/c/${slug}/forum`); return }

    const { data: community } = await supabase.from('communities').select('id').eq('slug', slug).single()
    if (!community) { setError('Communauté introuvable'); setPosting(false); return }

    const { data: thread, error: err } = await supabase
      .from('forum_threads')
      .insert({ category_id: catId, community_id: community.id, author_id: user.id, title: title.trim(), content: content.trim() || null, pinned: false, locked: false })
      .select('id').single()

    if (err) { setError('Erreur lors de la création'); setPosting(false); return }
    router.push(`/c/${slug}/forum/${thread.id}`)
  }

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'Rajdhani', sans-serif", color: '#e0e0e0' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Rajdhani:wght@400;600;700&display=swap');`}</style>
      <div style={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '36px', width: '100%', maxWidth: '600px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button onClick={() => router.back()} style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', fontSize: '1.2rem' }}>←</button>
          <h1 style={{ margin: 0, fontFamily: 'Orbitron', fontSize: '0.9rem', color: 'white', textTransform: 'uppercase', letterSpacing: '2px' }}>Nouveau thread</h1>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Titre *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Sujet de la discussion..."
              style={{ width: '100%', background: '#0a0a0a', border: '1px solid #2a2a2a', color: '#e0e0e0', padding: '10px 14px', borderRadius: '6px', fontFamily: 'Rajdhani', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' as const }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Contenu</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={6} placeholder="Développe ton sujet..."
              style={{ width: '100%', background: '#0a0a0a', border: '1px solid #2a2a2a', color: '#e0e0e0', padding: '10px 14px', borderRadius: '6px', fontFamily: 'Rajdhani', fontSize: '1rem', outline: 'none', resize: 'vertical' as const, lineHeight: 1.5, boxSizing: 'border-box' as const }} />
          </div>
          {error && <div style={{ background: 'rgba(255,35,68,0.08)', border: '1px solid #FF234433', borderRadius: '6px', padding: '10px 14px', color: '#FF2344', fontSize: '0.88rem' }}>{error}</div>}
          <button onClick={submit} disabled={posting || !title.trim()}
            style={{ background: '#FFC107', color: '#000', border: 'none', padding: '12px', borderRadius: '6px', cursor: posting || !title.trim() ? 'not-allowed' : 'pointer', fontFamily: 'Orbitron', fontWeight: 'bold', fontSize: '0.82rem', textTransform: 'uppercase', opacity: !title.trim() ? 0.5 : 1 }}>
            {posting ? 'Publication...' : 'Publier le thread'}
          </button>
        </div>
      </div>
    </div>
  )
}
