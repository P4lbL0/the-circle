'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Announcement {
  id: string
  title: string
  content: string
  type: string
  created_at: string
  community_id: string | null
  author_id: string | null
  authorName: string
  isRead: boolean
  isGlobal: boolean
}

interface Community {
  id: string
  name: string
  slug: string
  logo_url: string | null
  subscription_tier: string
  inviteToken: string
  community_type: string | null
}

interface Stats {
  members: number
  pending: number
  events:  number
  modules: number
}

const TYPE_META = {
  info:    { icon: 'ℹ️', color: '#4CAF50', label: 'Info'    },
  warning: { icon: '⚠️', color: '#FF9800', label: 'Avertissement' },
  alert:   { icon: '🚨', color: '#FF2344', label: 'Alerte'  },
}

export function DashboardHomeClient({ community, userId, canManage, stats, initialAnnouncements }: {
  community:             Community
  userId:                string
  canManage:             boolean
  stats:                 Stats
  initialAnnouncements:  Announcement[]
}) {
  const supabase = createClient()

  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements)
  const [showForm, setShowForm]           = useState(false)
  const [saving, setSaving]               = useState(false)
  const [toast, setToast]                 = useState<{ msg: string; ok: boolean } | null>(null)
  const [form, setForm]                   = useState({ title: '', content: '', type: 'info' })
  const [copied, setCopied]               = useState(false)

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 2500)
  }

  const markRead = async (id: string) => {
    await supabase.from('announcement_reads').upsert({ announcement_id: id, profile_id: userId })
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a))
  }

  const markAllRead = async () => {
    const unread = announcements.filter(a => !a.isRead)
    await Promise.all(unread.map(a =>
      supabase.from('announcement_reads').upsert({ announcement_id: a.id, profile_id: userId })
    ))
    setAnnouncements(prev => prev.map(a => ({ ...a, isRead: true })))
  }

  const deleteAnn = async (id: string) => {
    const { error } = await supabase.from('announcements').delete().eq('id', id)
    if (!error) {
      setAnnouncements(prev => prev.filter(a => a.id !== id))
      showToast('Annonce supprimée')
    }
  }

  const createAnn = async () => {
    if (!form.title.trim() || !form.content.trim()) return
    setSaving(true)
    const { data, error } = await supabase
      .from('announcements')
      .insert({
        community_id: community.id,
        author_id:    userId,
        title:        form.title.trim(),
        content:      form.content.trim(),
        type:         form.type,
      })
      .select('id, title, content, type, created_at, community_id, author_id, profiles(display_name)')
      .single()

    if (!error && data) {
      setAnnouncements(prev => [{
        ...data,
        isRead:     true,
        isGlobal:   false,
        authorName: (data.profiles as any)?.display_name ?? 'Admin',
      }, ...prev])
      setForm({ title: '', content: '', type: 'info' })
      setShowForm(false)
      showToast('Annonce envoyée à tous les membres ✓')
    } else {
      showToast(error?.message ?? 'Erreur', false)
    }
    setSaving(false)
  }

  const copyInvite = () => {
    navigator.clipboard.writeText(`${window.location.origin}/join/${community.slug}?token=${community.inviteToken}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const unreadCount = announcements.filter(a => !a.isRead).length

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', fontFamily: "'Rajdhani', sans-serif", color: '#e0e0e0', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;600;700&display=swap');

        .dh-stats      { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .dh-actions    { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 4px; }
        .dh-actions::-webkit-scrollbar { display: none; }
        .dh-topbar     { display: flex; }

        @media (max-width: 768px) {
          .dh-stats  { grid-template-columns: repeat(2, 1fr); }
          /* La topbar est déjà fournie par la sidebar mobile — on la masque */
          .dh-topbar { display: none; }
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          background: '#1a1a1a', border: `1px solid ${toast.ok ? '#4CAF50' : '#FF2344'}`,
          color: toast.ok ? '#4CAF50' : '#FF2344',
          padding: '12px 20px', borderRadius: '8px',
          fontFamily: 'Orbitron', fontSize: '0.78rem', letterSpacing: '1px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}>
          {toast.ok ? '✓' : '✗'} {toast.msg}
        </div>
      )}

      {/* ── Topbar page (desktop uniquement) ── */}
      <div className="dh-topbar" style={{
        background: '#0d0d0d', borderBottom: '2px solid #FFC107',
        padding: '14px 24px', alignItems: 'center', gap: '14px',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        {community.logo_url && (
          <img src={community.logo_url} alt="" style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #FFC10740', flexShrink: 0 }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Orbitron', fontSize: '0.88rem', color: 'white', textTransform: 'uppercase', letterSpacing: '1.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {community.name}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#555', marginTop: '1px' }}>
            Dashboard
          </div>
        </div>
        <a href={`/c/${community.slug}`} target="_blank" style={{ flexShrink: 0, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '6px 12px', color: '#555', textDecoration: 'none', fontSize: '0.75rem', fontFamily: 'Rajdhani', display: 'flex', alignItems: 'center', gap: '5px', transition: 'border-color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#FFC107'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#2a2a2a'}>
          🌐 Vitrine ↗
        </a>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px 40px' }}>

        {/* ── Stats ── */}
        <div className="dh-stats" style={{ marginBottom: '24px' }}>
          {[
            { icon: '👥', label: 'Membres actifs', value: stats.members,  color: '#4CAF50', link: `/dashboard/${community.slug}/members` },
            { icon: '⏳', label: 'En attente',      value: stats.pending,  color: '#FF9800', link: `/dashboard/${community.slug}/members` },
            { icon: '📅', label: 'Événements',       value: stats.events,   color: '#2196F3', link: `/dashboard/${community.slug}/events` },
            { icon: '🧩', label: 'Modules actifs',   value: stats.modules,  color: '#9C27B0', link: `/dashboard/${community.slug}/modules` },
          ].map(s => (
            <a key={s.label} href={s.link} style={{ textDecoration: 'none', background: '#141414', border: `1px solid ${s.color}22`, borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', transition: 'border-color 0.15s, transform 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = s.color + '55'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = s.color + '22'; e.currentTarget.style.transform = 'translateY(0)' }}>
              <span style={{ fontSize: '1.4rem' }}>{s.icon}</span>
              <div style={{ fontSize: '1.8rem', fontFamily: 'Orbitron', fontWeight: 700, color: s.color, lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {s.label}
              </div>
            </a>
          ))}
        </div>

        {/* ── Actions rapides ── */}
        <div className="dh-actions" style={{ marginBottom: '28px' }}>
          {[
            { icon: '📨', label: 'Inviter',      action: copyInvite,                                         active: copied },
            { icon: '📅', label: 'Événement',    href: `/dashboard/${community.slug}/events`  },
            { icon: '🏆', label: 'Tournoi',      href: `/dashboard/${community.slug}/tournaments` },
            { icon: '👥', label: 'Membres',      href: `/dashboard/${community.slug}/members` },
            { icon: '🧩', label: 'Modules',      href: `/dashboard/${community.slug}/modules` },
            { icon: '🎨', label: 'Apparence',    href: `/dashboard/${community.slug}/appearance` },
            { icon: '⚙️',  label: 'Paramètres',  href: `/dashboard/${community.slug}/settings` },
          ].map(a => {
            const style: React.CSSProperties = {
              flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
              background: a.active ? 'rgba(255,193,7,0.12)' : '#141414',
              border: `1px solid ${a.active ? '#FFC107' : '#222'}`,
              borderRadius: '10px', padding: '10px 14px', cursor: 'pointer',
              textDecoration: 'none', color: a.active ? '#FFC107' : '#888',
              fontSize: '0.72rem', fontFamily: 'Rajdhani', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.5px',
              transition: 'all 0.15s',
            }
            if (a.href) return (
              <a key={a.label} href={a.href} style={style}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#FFC107'; e.currentTarget.style.color = '#FFC107' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#222'; e.currentTarget.style.color = '#888' }}>
                <span style={{ fontSize: '1.2rem' }}>{a.icon}</span>
                {a.active ? 'Copié !' : a.label}
              </a>
            )
            return (
              <button key={a.label} onClick={a.action} style={style}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#FFC107'; e.currentTarget.style.color = '#FFC107' }}
                onMouseLeave={e => { if (!a.active) { e.currentTarget.style.borderColor = '#222'; e.currentTarget.style.color = '#888' } }}>
                <span style={{ fontSize: '1.2rem' }}>{a.icon}</span>
                {a.active ? 'Copié !' : a.label}
              </button>
            )
          })}
        </div>

        {/* ── Annonces ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontFamily: 'Orbitron', fontSize: '0.82rem', color: 'white', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                📣 Annonces
              </span>
              {unreadCount > 0 && (
                <span style={{ background: '#FF2344', color: 'white', fontSize: '0.65rem', fontFamily: 'Orbitron', padding: '2px 7px', borderRadius: '10px' }}>
                  {unreadCount} non lues
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {unreadCount > 0 && (
                <button onClick={markAllRead} style={{ background: 'none', border: '1px solid #2a2a2a', color: '#555', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'Rajdhani', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#888' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#555' }}>
                  Tout marquer lu
                </button>
              )}
              {canManage && (
                <button onClick={() => setShowForm(!showForm)} style={{
                  background: showForm ? 'rgba(255,193,7,0.15)' : '#1a1a1a',
                  border: `1px solid ${showForm ? '#FFC107' : '#333'}`,
                  color: showForm ? '#FFC107' : '#888',
                  padding: '6px 14px', borderRadius: '6px', cursor: 'pointer',
                  fontSize: '0.78rem', fontFamily: 'Orbitron', letterSpacing: '1px',
                  textTransform: 'uppercase', transition: 'all 0.15s',
                }}>
                  {showForm ? '✕ Annuler' : '+ Nouvelle'}
                </button>
              )}
            </div>
          </div>

          {/* Formulaire création */}
          {showForm && (
            <div style={{ background: '#141414', border: '1px solid #FFC10733', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px', fontFamily: 'Orbitron' }}>
                    Titre *
                  </label>
                  <input
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Titre de l'annonce…"
                    style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#e0e0e0', padding: '10px 14px', borderRadius: '8px', fontSize: '0.88rem', fontFamily: 'Rajdhani', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px', fontFamily: 'Orbitron' }}>
                    Message *
                  </label>
                  <textarea
                    value={form.content}
                    onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                    rows={3}
                    placeholder="Écris ton message pour toute la communauté…"
                    style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#e0e0e0', padding: '10px 14px', borderRadius: '8px', fontSize: '0.88rem', fontFamily: 'Rajdhani', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {(['info', 'warning', 'alert'] as const).map(t => (
                    <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))} style={{
                      padding: '6px 14px', borderRadius: '6px', cursor: 'pointer',
                      fontFamily: 'Orbitron', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px',
                      border: `1px solid ${TYPE_META[t].color}`,
                      background: form.type === t ? TYPE_META[t].color + '25' : 'transparent',
                      color: form.type === t ? TYPE_META[t].color : '#555',
                      transition: 'all 0.15s',
                    }}>
                      {TYPE_META[t].icon} {TYPE_META[t].label}
                    </button>
                  ))}
                  <button
                    onClick={createAnn}
                    disabled={saving || !form.title.trim() || !form.content.trim()}
                    style={{
                      marginLeft: 'auto', background: '#FFC107', color: '#000', border: 'none',
                      padding: '6px 20px', borderRadius: '6px', cursor: 'pointer',
                      fontFamily: 'Orbitron', fontSize: '0.78rem', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '1px',
                      opacity: saving || !form.title.trim() || !form.content.trim() ? 0.5 : 1,
                    }}>
                    {saving ? '…' : 'Envoyer'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Liste annonces */}
          {announcements.length === 0 ? (
            <div style={{ background: '#141414', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '40px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📭</div>
              <p style={{ color: '#444', fontSize: '0.88rem', fontFamily: 'Rajdhani' }}>
                Aucune annonce pour le moment.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {announcements.map(ann => {
                const meta = TYPE_META[ann.type as keyof typeof TYPE_META] ?? TYPE_META.info
                return (
                  <div
                    key={ann.id}
                    onClick={() => !ann.isRead && markRead(ann.id)}
                    style={{
                      background: ann.isRead ? '#0f0f0f' : '#141414',
                      border: `1px solid ${ann.isRead ? '#1a1a1a' : meta.color + '33'}`,
                      borderLeft: `3px solid ${ann.isRead ? '#222' : meta.color}`,
                      borderRadius: '10px', padding: '14px 16px',
                      cursor: ann.isRead ? 'default' : 'pointer',
                      transition: 'all 0.15s',
                    }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      {/* Dot non-lu */}
                      <div style={{ paddingTop: '4px', flexShrink: 0 }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: ann.isRead ? '#222' : meta.color }} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Header ligne */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '5px' }}>
                          <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '0.92rem', color: ann.isRead ? '#888' : '#e0e0e0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                            {ann.title}
                          </span>
                          {ann.isGlobal && (
                            <span style={{ fontSize: '0.6rem', background: '#FFC10715', border: '1px solid #FFC10733', color: '#FFC107', borderRadius: '3px', padding: '1px 6px', fontFamily: 'Orbitron', flexShrink: 0 }}>
                              GLOBAL
                            </span>
                          )}
                          <span style={{ fontSize: '0.6rem', background: meta.color + '15', border: `1px solid ${meta.color}33`, color: meta.color, borderRadius: '3px', padding: '1px 6px', fontFamily: 'Orbitron', flexShrink: 0 }}>
                            {meta.icon} {meta.label}
                          </span>
                        </div>

                        <p style={{ margin: '0 0 6px', fontSize: '0.82rem', color: ann.isRead ? '#555' : '#888', lineHeight: 1.5, fontFamily: 'Rajdhani' }}>
                          {ann.content}
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.7rem', color: '#333', fontFamily: 'Rajdhani' }}>
                            {ann.authorName} · {new Date(ann.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {canManage && !ann.isGlobal && (
                            <button
                              onClick={e => { e.stopPropagation(); deleteAnn(ann.id) }}
                              style={{ background: 'none', border: 'none', color: '#333', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'Rajdhani', padding: '2px 6px', borderRadius: '4px', transition: 'color 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.color = '#FF2344'}
                              onMouseLeave={e => e.currentTarget.style.color = '#333'}>
                              Supprimer
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
