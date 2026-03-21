'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Message {
  id:         string
  content:    string
  author_id:  string
  created_at: string
  profiles?:  { display_name: string; avatar_url: string | null } | null
}

interface Group {
  id:        string
  name:      string
  is_public: boolean
}

interface Props {
  community:       any
  group:           Group
  initialMessages: Message[]
  userId:          string | null
  isMember:        boolean
  isModerator:     boolean
  userProfile:     { display_name: string; avatar_url: string | null } | null
}

export function ChatClient({ community, group, initialMessages, userId, isMember, isModerator, userProfile }: Props) {
  const supabase = createClient()
  const theme    = community.theme_json as { primaryColor: string; accentColor: string; font: string; darkMode: boolean }

  const bg      = theme.darkMode ? '#0a0a0a' : '#f0f2f5'
  const panel   = theme.darkMode ? '#1a1a1a' : '#ffffff'
  const text    = theme.darkMode ? '#e0e0e0' : '#1a1a1a'
  const muted   = theme.darkMode ? '#555'    : '#999'
  const bord    = theme.darkMode ? '#1e1e1e' : '#e8e8e8'
  const inputBg = theme.darkMode ? '#0d0d0d' : '#f8f8f8'

  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [content, setContent]   = useState('')
  const [sending, setSending]   = useState(false)
  const bottomRef               = useRef<HTMLDivElement>(null)
  const inputRef                = useRef<HTMLTextAreaElement>(null)
  const containerRef            = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior })
  }, [])

  // Scroll initial (instantané)
  useEffect(() => { scrollToBottom('instant') }, [])

  // Scroll auto sur nouveau message
  useEffect(() => {
    if (messages.length === 0) return
    // Ne scroll que si on était déjà en bas
    const el = containerRef.current
    if (!el) return
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150
    if (isNearBottom) scrollToBottom()
  }, [messages.length])

  // ── Supabase Realtime ──────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel(`chat-group-${group.id}`)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'chat_messages',
        filter: `group_id=eq.${group.id}`,
      }, async (payload) => {
        const { data } = await supabase
          .from('chat_messages')
          .select('id, content, author_id, created_at, profiles(display_name, avatar_url)')
          .eq('id', (payload.new as { id: string }).id)
          .single()
        if (data) {
          const msg = data as unknown as Message
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev
            return [...prev, msg]
          })
        }
      })
      .on('postgres_changes', {
        event:  'DELETE',
        schema: 'public',
        table:  'chat_messages',
      }, (payload) => {
        setMessages(prev => prev.filter(m => m.id !== (payload.old as { id: string }).id))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [group.id])

  // ── Envoi de message ───────────────────────────────────────
  const sendMessage = async () => {
    const trimmed = content.trim()
    if (!trimmed || !userId || sending) return

    setSending(true)
    setContent('')
    // Reset textarea height
    if (inputRef.current) inputRef.current.style.height = 'auto'

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({ group_id: group.id, community_id: community.id, author_id: userId, content: trimmed })
      .select('id, content, author_id, created_at, profiles(display_name, avatar_url)')
      .single()

    if (!error && data) {
      const msg = data as unknown as Message
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
    }
    setSending(false)
    inputRef.current?.focus()
  }

  const deleteMessage = async (msgId: string) => {
    if (!confirm('Supprimer ce message ?')) return
    const { error } = await supabase.from('chat_messages').delete().eq('id', msgId)
    if (!error) setMessages(prev => prev.filter(m => m.id !== msgId))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const autoResize = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  const formatTime = (ts: string) => {
    const d   = new Date(ts)
    const now = new Date()
    return d.toDateString() === now.toDateString()
      ? d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  const initials = (name?: string | null) => name?.[0]?.toUpperCase() ?? '?'

  const AvatarImg = ({ src, name, own }: { src?: string | null; name?: string | null; own: boolean }) => (
    <div style={{
      width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
      background: own ? `${theme.primaryColor}33` : (theme.darkMode ? '#2a2a2a' : '#e0e0e0'),
      border: `1px solid ${own ? theme.primaryColor + '66' : bord}`,
      overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: `'${theme.font}', sans-serif`,
      color: own ? theme.primaryColor : muted, fontSize: '0.75rem',
    }}>
      {src
        ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : initials(name)
      }
    </div>
  )

  // Regroupe les messages consécutifs du même auteur
  const isGroupedWith = (i: number) =>
    i > 0 && messages[i].author_id === messages[i - 1].author_id

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: bg, fontFamily: "'Rajdhani', sans-serif", color: text, overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Rajdhani:wght@400;600;700&display=swap');
        .msg-row:hover .msg-del { opacity: 1 !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        @media (max-width: 640px) {
          .chat-header-inner { padding: 10px 12px !important; }
          .chat-input-area   { padding: 8px 10px !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <header className="chat-header-inner" style={{ background: theme.darkMode ? '#0d0d0d' : '#fff', borderBottom: `2px solid ${theme.primaryColor}`, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0, zIndex: 10 }}>
        <Link href={`/c/${community.slug}/chat`} style={{ color: muted, textDecoration: 'none', fontSize: '1.3rem', lineHeight: 1 }}>←</Link>
        <div style={{ width: '38px', height: '38px', borderRadius: '9px', background: `${theme.primaryColor}18`, border: `1px solid ${theme.primaryColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
          💬
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: `'${theme.font}', sans-serif`, fontSize: '0.92rem', color: theme.darkMode ? 'white' : '#111', textTransform: 'uppercase', letterSpacing: '1.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {group.name}
          </div>
          {!group.is_public && (
            <div style={{ fontSize: '0.65rem', color: muted, marginTop: '1px' }}>🔒 Membres uniquement</div>
          )}
        </div>
        {!userId && (
          <Link href={`/login?redirect=/c/${community.slug}/chat/${group.id}`} style={{ background: theme.primaryColor, color: '#000', fontFamily: `'${theme.font}', sans-serif`, fontWeight: 'bold', padding: '6px 14px', borderRadius: '4px', textDecoration: 'none', fontSize: '0.75rem', textTransform: 'uppercase', flexShrink: 0 }}>
            Connexion
          </Link>
        )}
      </header>

      {/* ── Zone messages ── */}
      <div ref={containerRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 4px' }}>
        {messages.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: muted, textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '2.8rem', marginBottom: '12px' }}>💬</div>
            <p style={{ fontFamily: `'${theme.font}', sans-serif`, textTransform: 'uppercase', fontSize: '0.82rem', letterSpacing: '1px' }}>
              Sois le premier à écrire dans ce groupe
            </p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isOwn    = msg.author_id === userId
          const canDel   = isOwn || isModerator
          const grouped  = isGroupedWith(idx)
          const name     = msg.profiles?.display_name ?? 'Anonyme'
          const avatar   = msg.profiles?.avatar_url ?? null

          return (
            <div
              key={msg.id}
              className="msg-row"
              style={{
                display: 'flex',
                flexDirection: isOwn ? 'row-reverse' : 'row',
                alignItems: 'flex-end',
                gap: '8px',
                marginTop: grouped ? '3px' : '12px',
              }}
            >
              {/* Avatar (masqué si message groupé) */}
              <div style={{ visibility: grouped ? 'hidden' : 'visible', flexShrink: 0 }}>
                <AvatarImg src={isOwn ? userProfile?.avatar_url : avatar} name={isOwn ? userProfile?.display_name : name} own={isOwn} />
              </div>

              <div style={{ maxWidth: 'min(70%, 480px)', display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
                {/* Nom (premier message du groupe, côté gauche) */}
                {!grouped && !isOwn && (
                  <span style={{ fontSize: '0.68rem', color: muted, marginBottom: '4px', paddingLeft: '4px' }}>
                    {name}
                  </span>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexDirection: isOwn ? 'row-reverse' : 'row' }}>
                  {/* Bulle */}
                  <div style={{
                    background:    isOwn ? theme.primaryColor : panel,
                    color:         isOwn ? '#000' : text,
                    border:        isOwn ? 'none' : `1px solid ${bord}`,
                    borderRadius:  isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    padding:       '9px 14px',
                    fontSize:      '0.95rem',
                    lineHeight:    1.45,
                    wordBreak:     'break-word',
                    whiteSpace:    'pre-wrap',
                  }}>
                    {msg.content}
                  </div>

                  {/* Bouton supprimer (visible au hover) */}
                  {canDel && (
                    <button
                      className="msg-del"
                      onClick={() => deleteMessage(msg.id)}
                      style={{ opacity: 0, background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', fontSize: '0.8rem', padding: '3px 6px', borderRadius: '4px', transition: 'opacity 0.15s, color 0.15s', flexShrink: 0 }}
                      onMouseEnter={e => (e.currentTarget).style.color = '#FF2344'}
                      onMouseLeave={e => (e.currentTarget).style.color = '#555'}
                      title="Supprimer"
                    >🗑</button>
                  )}
                </div>

                {/* Timestamp (dernier message du groupe) */}
                {(!messages[idx + 1] || messages[idx + 1]?.author_id !== msg.author_id) && (
                  <span style={{ fontSize: '0.62rem', color: muted, marginTop: '4px', paddingLeft: isOwn ? 0 : '4px', paddingRight: isOwn ? '4px' : 0 }}>
                    {formatTime(msg.created_at)}
                  </span>
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} style={{ height: '4px' }} />
      </div>

      {/* ── Zone de saisie ── */}
      <div className="chat-input-area" style={{ borderTop: `1px solid ${bord}`, padding: '10px 16px', background: theme.darkMode ? '#0d0d0d' : '#fff', flexShrink: 0 }}>
        {isMember && userId ? (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <div style={{ flexShrink: 0 }}>
              <AvatarImg src={userProfile?.avatar_url} name={userProfile?.display_name} own />
            </div>
            <textarea
              ref={inputRef}
              value={content}
              onChange={e => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              onInput={autoResize}
              placeholder="Envoyer un message… (Entrée pour envoyer, Maj+Entrée pour saut de ligne)"
              rows={1}
              style={{
                flex: 1, background: inputBg, border: `1px solid ${bord}`, color: text,
                padding: '10px 14px', borderRadius: '20px',
                fontFamily: 'Rajdhani', fontSize: '0.95rem',
                outline: 'none', resize: 'none', lineHeight: 1.4,
                maxHeight: '120px', boxSizing: 'border-box', overflowY: 'auto',
              }}
            />
            <button
              onClick={sendMessage}
              disabled={sending || !content.trim()}
              style={{
                width: '40px', height: '40px', borderRadius: '50%', border: 'none',
                background: content.trim() ? theme.primaryColor : (theme.darkMode ? '#1a1a1a' : '#e8e8e8'),
                color: content.trim() ? '#000' : muted,
                cursor: content.trim() ? 'pointer' : 'not-allowed',
                fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'background 0.15s',
              }}
              title="Envoyer"
            >
              ➤
            </button>
          </div>
        ) : !userId ? (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <Link href={`/login?redirect=/c/${community.slug}/chat/${group.id}`} style={{ color: theme.primaryColor, textDecoration: 'none', fontSize: '0.88rem', fontFamily: `'${theme.font}', sans-serif`, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Connexion pour participer →
            </Link>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '8px 0', color: muted, fontSize: '0.82rem' }}>
            Rejoins la communauté pour participer aux discussions
          </div>
        )}
      </div>
    </div>
  )
}
