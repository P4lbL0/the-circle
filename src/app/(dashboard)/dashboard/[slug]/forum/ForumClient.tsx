'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getSoftLimit } from '@/lib/plan-limits'

interface Thread {
  id:         string
  title:      string
  created_at: string
  pinned:     boolean
  locked:     boolean
  author_id:  string
  profiles?:  { display_name: string } | null
}

interface Category {
  id:            string
  name:          string
  position:      number
  visibility:    'public' | 'members_only'
  forum_threads: Thread[]
}

export function ForumClient({ community, initialCategories }: { community: any; initialCategories: Category[] }) {
  const supabase = createClient()
  const [categories, setCategories]     = useState<Category[]>(initialCategories)
  const [showCatForm, setShowCatForm]   = useState(false)
  const [catName, setCatName]           = useState('')
  const [catPublic, setCatPublic]       = useState(true)
  const [savingCat, setSavingCat]       = useState(false)
  const [toast, setToast]               = useState<string | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  const S = {
    input: (): React.CSSProperties => ({
      background: '#0a0a0a', border: '1px solid #2a2a2a', color: '#e0e0e0',
      padding: '9px 14px', borderRadius: '6px', fontFamily: 'Rajdhani',
      fontSize: '0.95rem', outline: 'none', width: '100%', boxSizing: 'border-box' as const,
    }),
    btn: (active?: boolean): React.CSSProperties => ({
      background: active ? '#FFC107' : '#1a1a1a', color: active ? '#000' : '#888',
      border: `1px solid ${active ? '#FFC107' : '#2a2a2a'}`,
      padding: '8px 18px', borderRadius: '6px', cursor: 'pointer',
      fontFamily: 'Orbitron', fontSize: '0.72rem', textTransform: 'uppercase' as const,
      letterSpacing: '1px', transition: 'all 0.15s',
    }),
  }

  const createCategory = async () => {
    if (!catName.trim()) return

    const limit = getSoftLimit(community.subscription_tier, 'forum_categories')
    if (limit !== Infinity && categories.length >= limit) {
      showToast(`Limite de ${limit} catégories (plan Free) — passez au Starter`)
      return
    }

    setSavingCat(true)
    const { data, error } = await supabase.from('forum_categories').insert({
      community_id: community.id,
      name: catName.trim(),
      position: categories.length,
      visibility: catPublic ? 'public' : 'members_only',
    }).select('*, forum_threads(id, title, created_at, pinned, locked, author_id)').single()
    if (!error && data) {
      setCategories(prev => [...prev, { ...data, forum_threads: [] }])
      setCatName('')
      setShowCatForm(false)
      showToast('Catégorie créée')
    } else if (error) {
      showToast(`Erreur: ${error.message}`)
    }
    setSavingCat(false)
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('Supprimer cette catégorie et tous ses threads ?')) return
    const { error } = await supabase.from('forum_categories').delete().eq('id', id)
    if (!error) {
      setCategories(prev => prev.filter(c => c.id !== id))
      showToast('Catégorie supprimée')
    }
  }

  const toggleCategoryVisibility = async (cat: Category) => {
    const newVisibility = cat.visibility === 'public' ? 'members_only' : 'public'
    const { error } = await supabase.from('forum_categories').update({ visibility: newVisibility }).eq('id', cat.id)
    if (!error) {
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, visibility: newVisibility } : c))
    }
  }

  const toggleThread = async (threadId: string, field: 'pinned' | 'locked', current: boolean, catId: string) => {
    const { error } = await supabase.from('forum_threads').update({ [field]: !current }).eq('id', threadId)
    if (!error) {
      setCategories(prev => prev.map(c =>
        c.id === catId
          ? { ...c, forum_threads: c.forum_threads.map(t => t.id === threadId ? { ...t, [field]: !current } : t) }
          : c
      ))
    }
  }

  const deleteThread = async (threadId: string, catId: string) => {
    if (!confirm('Supprimer ce thread ?')) return
    const { error } = await supabase.from('forum_threads').delete().eq('id', threadId)
    if (!error) {
      setCategories(prev => prev.map(c =>
        c.id === catId ? { ...c, forum_threads: c.forum_threads.filter(t => t.id !== threadId) } : c
      ))
      showToast('Thread supprimé')
    }
  }

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', fontFamily: "'Rajdhani', sans-serif", color: '#e0e0e0' }}>
      <style>{`
        .forum-header { padding: 14px 30px !important; }
        .forum-content { max-width: 900px; margin: 0 auto; padding: 30px; }
        .forum-cat-header { padding: 14px 20px; border-bottom: 1px solid #1a1a1a; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .forum-thread-row { padding: 12px 20px; border-bottom: 1px solid #1a1a1a; display: flex; align-items: center; gap: 12px; }
        .forum-cat-form-row { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; }
        @media (max-width: 768px) {
          .forum-header { padding: 12px 16px !important; }
          .forum-header-title { font-size: 0.75rem !important; }
          .forum-content { padding: 16px !important; }
          .forum-cat-header { gap: 8px; padding: 12px 14px; }
          .forum-cat-header .forum-toggle-btn { font-size: 0.6rem !important; padding: 3px 8px !important; }
          .forum-thread-row { padding: 10px 14px; gap: 8px; }
          .forum-cat-form-row { flex-direction: column; align-items: stretch; }
        }
        @media (max-width: 480px) {
          .forum-thread-row { flex-wrap: wrap; }
          .forum-thread-actions { flex-shrink: 0; display: flex; gap: 4px; }
        }
      `}</style>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: '#1a1a1a', border: '1px solid #4CAF50', color: '#4CAF50', padding: '12px 20px', borderRadius: '8px', fontFamily: 'Orbitron', fontSize: '0.8rem' }}>
          ✓ {toast}
        </div>
      )}

      <div className="forum-header" style={{ background: '#0d0d0d', borderBottom: '2px solid #FFC107', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="forum-header-title" style={{ fontFamily: 'Orbitron', fontSize: '0.9rem', color: 'white', textTransform: 'uppercase', letterSpacing: '2px' }}>Forum</span>
          <a href={`/c/${community.slug}/forum`} target="_blank" style={{ color: '#444', fontSize: '0.72rem', textDecoration: 'none', border: '1px solid #222', padding: '4px 10px', borderRadius: '4px', fontFamily: 'Orbitron', textTransform: 'uppercase' }}>
            Voir ↗
          </a>
        </div>
        <button onClick={() => setShowCatForm(!showCatForm)} style={S.btn(showCatForm)}>+ Catégorie</button>
      </div>

      <div className="forum-content">
        {/* Formulaire nouvelle catégorie */}
        {showCatForm && (
          <div style={{ background: '#141414', border: '1px solid #FFC107', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
            <h3 style={{ fontFamily: 'Orbitron', fontSize: '0.82rem', color: '#FFC107', textTransform: 'uppercase', margin: '0 0 16px' }}>Nouvelle catégorie</h3>
            <div className="forum-cat-form-row">
              <input value={catName} onChange={e => setCatName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createCategory()} placeholder="Nom de la catégorie..." style={{ ...S.input(), flex: 1 }} autoFocus />
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#888', fontSize: '0.88rem', whiteSpace: 'nowrap' as const }}>
                <input type="checkbox" checked={catPublic} onChange={e => setCatPublic(e.target.checked)} style={{ accentColor: '#FFC107' }} />
                Publique
              </label>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowCatForm(false)} style={S.btn()}>Annuler</button>
              <button onClick={createCategory} disabled={savingCat} style={{ ...S.btn(true), opacity: savingCat ? 0.6 : 1 }}>
                {savingCat ? 'Création...' : 'Créer'}
              </button>
            </div>
          </div>
        )}

        {categories.length === 0 && !showCatForm ? (
          <div style={{ textAlign: 'center', padding: '80px 40px', border: '1px dashed #222', borderRadius: '12px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💬</div>
            <h3 style={{ fontFamily: 'Orbitron', color: '#444', fontSize: '0.9rem', textTransform: 'uppercase', margin: '0 0 10px' }}>Aucune catégorie</h3>
            <p style={{ color: '#333', fontSize: '0.88rem', margin: '0 0 20px' }}>Crée des catégories pour organiser les discussions.</p>
            <button onClick={() => setShowCatForm(true)} style={S.btn(true)}>+ Créer une catégorie</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {categories.map(cat => {
              const isPublic = cat.visibility === 'public'
              return (
                <div key={cat.id} style={{ background: '#141414', border: '1px solid #222', borderRadius: '12px', overflow: 'hidden' }}>
                  {/* Header catégorie */}
                  <div className="forum-cat-header">
                    <span style={{ fontFamily: 'Orbitron', fontSize: '0.82rem', color: '#FFC107', textTransform: 'uppercase', flex: 1 }}>{cat.name}</span>
                    <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '3px', border: `1px solid ${isPublic ? '#4CAF5055' : '#2196F355'}`, color: isPublic ? '#4CAF5099' : '#2196F399' }}>
                      {isPublic ? '🌍 Publique' : '🔒 Membres'}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#444' }}>{cat.forum_threads.length} thread{cat.forum_threads.length > 1 ? 's' : ''}</span>
                    <button className="forum-toggle-btn" onClick={() => toggleCategoryVisibility(cat)} style={{ ...S.btn(), padding: '4px 10px', fontSize: '0.65rem' }}>
                      {isPublic ? '🔒 Rendre privée' : '🌍 Rendre publique'}
                    </button>
                    <button onClick={() => deleteCategory(cat.id)} style={{ background: 'transparent', border: '1px solid #2a2a2a', color: '#555', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                      onMouseEnter={e => { (e.currentTarget).style.color = '#FF2344'; (e.currentTarget).style.borderColor = '#FF2344' }}
                      onMouseLeave={e => { (e.currentTarget).style.color = '#555'; (e.currentTarget).style.borderColor = '#2a2a2a' }}
                    >🗑</button>
                  </div>
                  {/* Threads */}
                  {cat.forum_threads.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#333', fontSize: '0.82rem' }}>Aucun thread dans cette catégorie</div>
                  ) : (
                    <div>
                      {[...cat.forum_threads]
                        .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
                        .map(thread => (
                          <div key={thread.id} className="forum-thread-row">
                            {thread.pinned && <span style={{ fontSize: '0.7rem', color: '#FFC107' }}>📌</span>}
                            {thread.locked && <span style={{ fontSize: '0.7rem', color: '#666' }}>🔒</span>}
                            <div style={{ flex: 1 }}>
                              <span style={{ fontSize: '0.9rem', color: thread.locked ? '#666' : '#ccc' }}>{thread.title}</span>
                              <span style={{ fontSize: '0.72rem', color: '#444', marginLeft: '8px' }}>
                                {new Date(thread.created_at).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button onClick={() => toggleThread(thread.id, 'pinned', thread.pinned, cat.id)}
                                style={{ background: thread.pinned ? 'rgba(255,193,7,0.1)' : 'transparent', border: `1px solid ${thread.pinned ? '#FFC107' : '#2a2a2a'}`, color: thread.pinned ? '#FFC107' : '#555', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}
                                title={thread.pinned ? 'Désépingler' : 'Épingler'}
                              >📌</button>
                              <button onClick={() => toggleThread(thread.id, 'locked', thread.locked, cat.id)}
                                style={{ background: thread.locked ? 'rgba(100,100,100,0.1)' : 'transparent', border: `1px solid ${thread.locked ? '#666' : '#2a2a2a'}`, color: thread.locked ? '#aaa' : '#555', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}
                                title={thread.locked ? 'Déverrouiller' : 'Verrouiller'}
                              >🔒</button>
                              <button onClick={() => deleteThread(thread.id, cat.id)}
                                style={{ background: 'transparent', border: '1px solid #2a2a2a', color: '#555', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}
                                onMouseEnter={e => { (e.currentTarget).style.color = '#FF2344'; (e.currentTarget).style.borderColor = '#FF2344' }}
                                onMouseLeave={e => { (e.currentTarget).style.color = '#555'; (e.currentTarget).style.borderColor = '#2a2a2a' }}
                              >✕</button>
                            </div>
                          </div>
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
