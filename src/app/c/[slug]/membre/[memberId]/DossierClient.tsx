'use client'

import { useState } from 'react'
import { Badge, BadgeStyles } from '@/components/BadgeRenderer'
import type { BadgeDef } from '@/lib/badgeConfig'
import { createClient } from '@/lib/supabase/client'

interface StatField { key: string; label: string; type: string }

interface DossierProps {
  member: {
    id: string
    role: string
    points: number
    badges: BadgeDef[]
    custom_stats: Record<string, any>
    joined_at: string
    computed_score: number
  }
  profile: {
    id: string
    display_name: string | null
    avatar_url: string | null
    email: string
  }
  community: {
    name: string
    slug: string
    theme_json: any
  }
  statFields: StatField[]
  formulaLabel: string
  isOwn: boolean
}

const ROLE_COLORS: Record<string, string> = {
  owner:     '#FFD700',
  moderator: '#00bcd4',
  member:    '#4CAF50',
  pending:   '#FF9800',
}

const ROLE_LABELS: Record<string, string> = {
  owner:     'Commandant',
  moderator: 'Officier',
  member:    'Opérateur',
  pending:   'Recrue',
}

export function DossierClient({ member, profile, community, statFields, formulaLabel, isOwn }: DossierProps) {
  const supabase = createClient()
  const [tab, setTab] = useState<'stats' | 'infos'>('stats')
  const [editingPseudo, setEditingPseudo] = useState(false)
  const [pseudoValue, setPseudoValue]     = useState(profile.display_name ?? profile.email.split('@')[0])
  const [pseudoSaving, setPseudoSaving]   = useState(false)
  const [pseudoMsg, setPseudoMsg]         = useState<{ text: string; ok: boolean } | null>(null)

  const savePseudo = async () => {
    const trimmed = pseudoValue.trim()
    if (!trimmed || trimmed.length < 2) return
    setPseudoSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: trimmed })
      .eq('id', profile.id)
    if (!error) {
      setPseudoMsg({ text: 'Pseudo mis à jour ✓', ok: true })
      setEditingPseudo(false)
    } else {
      setPseudoMsg({ text: error.message, ok: false })
    }
    setPseudoSaving(false)
    setTimeout(() => setPseudoMsg(null), 3000)
  }

  const theme      = community.theme_json as { primaryColor: string; accentColor: string; font: string; darkMode: boolean }
  const primary    = theme.primaryColor ?? '#FFD700'
  const font       = theme.font ?? 'Orbitron'
  const bg         = '#0a0a0a'
  const panel      = '#141414'
  const border     = '#222'
  const muted      = '#555'
  const text       = '#e0e0e0'

  const displayName = profile.display_name ?? profile.email.split('@')[0]
  const initial     = displayName[0]?.toUpperCase()
  const joinDate    = new Date(member.joined_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const roleColor   = ROLE_COLORS[member.role] ?? '#888'
  const roleLabel   = ROLE_LABELS[member.role] ?? member.role.toUpperCase()

  const numStats = statFields.filter(f => f.type === 'number' || f.type === 'percentage')
  const allStats = statFields

  const tabBtn = (id: 'stats' | 'infos', label: string) => (
    <button
      key={id}
      onClick={() => setTab(id)}
      style={{
        background:  tab === id ? `${primary}18` : 'transparent',
        border:      'none',
        borderBottom: tab === id ? `2px solid ${primary}` : '2px solid transparent',
        color:       tab === id ? primary : muted,
        padding:     '10px 24px',
        fontFamily:  `'Orbitron', sans-serif`,
        fontSize:    '0.75rem',
        fontWeight:  700,
        cursor:      'pointer',
        textTransform: 'uppercase',
        letterSpacing: '1.5px',
        transition:  'all 0.15s',
      }}
    >
      {label}
    </button>
  )

  return (
    <>
      <BadgeStyles />
      <div style={{ background: bg, minHeight: '100vh', fontFamily: `'Rajdhani', sans-serif`, color: text }}>

        {/* ── Topbar ──────────────────────────────────────────────────────── */}
        <div style={{
          background: '#0d0d0d', borderBottom: `2px solid ${primary}`,
          padding: '12px 24px', display: 'flex', alignItems: 'center',
          gap: '14px', position: 'sticky', top: 0, zIndex: 100,
        }}>
          <a
            href={`/c/${community.slug}`}
            style={{ background: 'transparent', border: 'none', color: muted, cursor: 'pointer', fontSize: '1.1rem', textDecoration: 'none' }}
          >
            ←
          </a>
          <span style={{ fontFamily: `'Orbitron', sans-serif`, fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', letterSpacing: '2px' }}>
            {community.name}
          </span>
          <span style={{ color: '#333' }}>/</span>
          <span style={{ fontFamily: `'Orbitron', sans-serif`, fontSize: '0.75rem', color: text, textTransform: 'uppercase' }}>
            Dossier
          </span>
        </div>

        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>

          {/* ── Header dossier ──────────────────────────────────────────── */}
          <div style={{
            background: panel,
            border: `1px solid ${border}`,
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '24px',
            position: 'relative',
          }}>
            {/* Ligne couleur principale en haut */}
            <div style={{
              height: '3px',
              background: `linear-gradient(90deg, transparent, ${primary}, ${theme.accentColor ?? primary}, transparent)`,
            }} />

            {/* Mention CLASSIFIED en filigrane */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%,-50%) rotate(-15deg)',
              fontFamily: `'Orbitron', sans-serif`,
              fontSize: '4rem', fontWeight: 900,
              color: `${primary}06`,
              letterSpacing: '8px', pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}>
              DOSSIER SOLDAT
            </div>

            <div style={{ padding: '28px 32px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>

                {/* Avatar */}
                <div style={{
                  width: '90px', height: '90px', flexShrink: 0,
                  background: '#1a1a1a',
                  border: `2px solid ${primary}`,
                  borderRadius: '8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: `'Orbitron', sans-serif`,
                  fontSize: '2rem', color: primary,
                  overflow: 'hidden',
                  boxShadow: `0 0 20px ${primary}30`,
                }}>
                  {profile.avatar_url
                    ? <img src={profile.avatar_url} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : initial
                  }
                </div>

                {/* Infos identité */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <h1 style={{
                      margin: 0,
                      fontFamily: `'Orbitron', sans-serif`,
                      fontSize: '1.5rem', color: 'white',
                      textTransform: 'uppercase', letterSpacing: '3px',
                    }}>
                      {displayName}
                    </h1>
                    {isOwn && (
                      <span style={{ fontSize: '0.65rem', padding: '2px 8px', border: `1px solid ${primary}`, color: primary, borderRadius: '2px', fontFamily: `'Orbitron', sans-serif` }}>
                        VOUS
                      </span>
                    )}
                  </div>

                  <div style={{
                    fontFamily: `'Orbitron', sans-serif`,
                    fontSize: '0.75rem', color: roleColor,
                    textTransform: 'uppercase', letterSpacing: '3px',
                    marginBottom: '14px',
                  }}>
                    ◈ {roleLabel}
                  </div>

                  {/* Badges */}
                  {member.badges?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {member.badges.map((badge, i) => (
                        <Badge key={i} badge={badge} size="md" />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Stats key row ────────────────────────────────────────── */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1px',
                background: border,
                borderRadius: '8px',
                overflow: 'hidden',
                marginTop: '28px',
              }}>
                {[
                  { value: member.points, label: 'Points' },
                  { value: member.computed_score, label: formulaLabel || 'Score' },
                  { value: member.badges?.length ?? 0, label: 'Badges' },
                ].map(({ value, label }, i) => (
                  <div key={i} style={{
                    background: panel,
                    padding: '16px 12px', textAlign: 'center',
                  }}>
                    <div style={{
                      fontFamily: `'Orbitron', sans-serif`,
                      fontSize: '1.6rem', fontWeight: 700,
                      color: i === 0 ? primary : i === 1 ? (theme.accentColor ?? '#00bcd4') : text,
                    }}>
                      {value}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: muted, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Tabs ────────────────────────────────────────────────────── */}
          <div style={{ borderBottom: `1px solid ${border}`, marginBottom: '24px', display: 'flex' }}>
            {tabBtn('stats', '📊 Statistiques')}
            {tabBtn('infos', '🪪 Identité')}
          </div>

          {/* ── Tab : Statistiques ───────────────────────────────────────── */}
          {tab === 'stats' && (
            <div>
              {allStats.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: muted, fontFamily: `'Orbitron', sans-serif`, fontSize: '0.85rem' }}>
                  Aucune statistique définie pour cette communauté.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                  {/* Score calculé en highlight */}
                  <div style={{
                    background: `${primary}10`,
                    border: `1px solid ${primary}40`,
                    borderRadius: '10px',
                    padding: '20px 16px',
                    textAlign: 'center',
                    gridColumn: 'span 2',
                  }}>
                    <div style={{
                      fontFamily: `'Orbitron', sans-serif`,
                      fontSize: '2.5rem', fontWeight: 900, color: primary,
                    }}>
                      {member.computed_score}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: primary, textTransform: 'uppercase', letterSpacing: '2px', marginTop: '4px', opacity: 0.7 }}>
                      {formulaLabel || 'Score Global'}
                    </div>
                  </div>

                  {allStats.map(field => {
                    const val = member.custom_stats?.[field.key]
                    return (
                      <div key={field.key} style={{
                        background: panel,
                        border: `1px solid ${border}`,
                        borderRadius: '10px',
                        padding: '18px 16px',
                        textAlign: 'center',
                        transition: 'border-color 0.2s',
                      }}>
                        <div style={{
                          fontFamily: `'Orbitron', sans-serif`,
                          fontSize: '1.6rem', fontWeight: 700, color: text,
                        }}>
                          {val !== undefined && val !== null ? val : '—'}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: muted, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>
                          {field.label}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Tab : Identité ───────────────────────────────────────────── */}
          {tab === 'infos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: border, borderRadius: '10px', overflow: 'hidden' }}>

              {/* Pseudo — éditable si isOwn */}
              <div style={{ background: panel, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', gap: '12px' }}>
                <span style={{ fontFamily: `'Orbitron', sans-serif`, fontSize: '0.7rem', color: muted, textTransform: 'uppercase', letterSpacing: '1px', flexShrink: 0 }}>
                  Pseudo
                </span>
                {isOwn && editingPseudo ? (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                    <input
                      value={pseudoValue}
                      onChange={e => setPseudoValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') savePseudo(); if (e.key === 'Escape') setEditingPseudo(false) }}
                      autoFocus
                      maxLength={32}
                      style={{
                        background: '#1a1a1a', border: `1px solid ${primary}`,
                        borderRadius: '6px', padding: '6px 12px',
                        color: text, fontFamily: `'Rajdhani', sans-serif`, fontSize: '1rem', fontWeight: 600,
                        outline: 'none', width: '160px',
                      }}
                    />
                    <button onClick={savePseudo} disabled={pseudoSaving} style={{
                      background: primary, color: '#000', border: 'none',
                      borderRadius: '6px', padding: '6px 14px',
                      fontFamily: `'Orbitron', sans-serif`, fontSize: '0.68rem', fontWeight: 700,
                      cursor: 'pointer', letterSpacing: '0.5px',
                    }}>
                      {pseudoSaving ? '…' : 'OK'}
                    </button>
                    <button onClick={() => setEditingPseudo(false)} style={{
                      background: 'transparent', color: muted, border: `1px solid #2a2a2a`,
                      borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '0.8rem',
                    }}>✕</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontFamily: `'Rajdhani', sans-serif`, fontSize: '1rem', color: text, fontWeight: 600 }}>
                      {pseudoValue}
                    </span>
                    {isOwn && (
                      <button onClick={() => setEditingPseudo(true)} style={{
                        background: 'transparent', border: `1px solid #2a2a2a`,
                        borderRadius: '5px', padding: '3px 8px',
                        color: muted, cursor: 'pointer', fontSize: '0.72rem',
                        fontFamily: `'Orbitron', sans-serif`, transition: 'all 0.15s',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = primary; e.currentTarget.style.color = primary }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = muted }}>
                        Modifier
                      </button>
                    )}
                  </div>
                )}
              </div>

              {pseudoMsg && (
                <div style={{ background: pseudoMsg.ok ? '#4CAF5015' : '#FF234415', borderLeft: `3px solid ${pseudoMsg.ok ? '#4CAF50' : '#FF2344'}`, padding: '10px 24px', fontSize: '0.82rem', color: pseudoMsg.ok ? '#4CAF50' : '#FF2344', fontFamily: `'Rajdhani', sans-serif` }}>
                  {pseudoMsg.text}
                </div>
              )}

              {[
                { label: 'Rôle', value: roleLabel },
                { label: "Date d'arrivée", value: joinDate },
                { label: 'Points', value: member.points.toLocaleString('fr-FR') },
                ...(isOwn ? [{ label: 'Email', value: profile.email }] : []),
              ].map(({ label, value }) => (
                <div key={label} style={{
                  background: panel,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '16px 24px',
                }}>
                  <span style={{ fontFamily: `'Orbitron', sans-serif`, fontSize: '0.7rem', color: muted, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {label}
                  </span>
                  <span style={{ fontFamily: `'Rajdhani', sans-serif`, fontSize: '1rem', color: text, fontWeight: 600 }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
