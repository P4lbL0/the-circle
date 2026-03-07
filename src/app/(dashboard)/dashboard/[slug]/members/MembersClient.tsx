'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// ── Types ─────────────────────────────────────────────────
interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  email: string
}

interface Member {
  id: string
  profile_id: string
  role: 'owner' | 'moderator' | 'member' | 'pending'
  points: number
  badges: any[]
  custom_stats: Record<string, any>
  joined_at: string
  is_public: boolean
  profiles: Profile
}

interface StatField {
  key: string
  label: string
  type: 'number' | 'text' | 'percentage'
}

interface Community {
  id: string
  name: string
  slug: string
  subscription_tier: string
}

const ROLE_COLORS: Record<string, string> = {
  owner:     '#FFC107',
  moderator: '#00bcd4',
  member:    '#4CAF50',
  pending:   '#FF9800',
}

const BADGE_COLORS = ['#FFD700', '#C0C0C0', '#FF2344', '#00bcd4', '#9c27b0', '#4CAF50', '#E91E63']

export function MembersClient({ community, initialMembers, statFields }: {
  community: Community
  initialMembers: Member[]
  statFields: StatField[]
}) {
  const supabase = createClient()
  const router = useRouter()

  const [members, setMembers]         = useState<Member[]>(initialMembers)
  const [search, setSearch]           = useState('')
  const [filterRole, setFilterRole]   = useState<string>('all')
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [inviteLink, setInviteLink]   = useState<string>('')
  const [showInvite, setShowInvite]   = useState(false)
  const [saving, setSaving]           = useState(false)
  const [copied, setCopied]           = useState(false)
  const [toast, setToast]             = useState<string | null>(null)

  // ── Toast ───────────────────────────────────────────────
  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  // ── Générer lien d'invitation ───────────────────────────
  const generateInviteLink = () => {
    const token = btoa(`${community.id}:${Date.now()}`)
    const link  = `${window.location.origin}/join/${community.slug}?token=${token}`
    setInviteLink(link)
    setShowInvite(true)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Changer rôle ────────────────────────────────────────
  const changeRole = async (memberId: string, newRole: string) => {
    const { error } = await supabase
      .from('community_members')
      .update({ role: newRole })
      .eq('id', memberId)

    if (!error) {
      setMembers(prev => prev.map(m =>
        m.id === memberId ? { ...m, role: newRole as Member['role'] } : m
      ))
      if (editingMember?.id === memberId) {
        setEditingMember(prev => prev ? { ...prev, role: newRole as Member['role'] } : null)
      }
      showToast('Rôle mis à jour')
    }
  }

  // ── Mettre à jour points ────────────────────────────────
  const updatePoints = async (memberId: string, points: number) => {
    const { error } = await supabase
      .from('community_members')
      .update({ points })
      .eq('id', memberId)

    if (!error) {
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, points } : m))
      if (editingMember?.id === memberId) {
        setEditingMember(prev => prev ? { ...prev, points } : null)
      }
    }
  }

  // ── Ajouter badge ───────────────────────────────────────
  const addBadge = async (memberId: string, badgeName: string, badgeColor: string) => {
    const member  = members.find(m => m.id === memberId)
    if (!member) return
    const newBadge  = { name: badgeName, color: badgeColor, awarded_at: new Date().toISOString() }
    const newBadges = [...(member.badges ?? []), newBadge]

    const { error } = await supabase
      .from('community_members')
      .update({ badges: newBadges })
      .eq('id', memberId)

    if (!error) {
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, badges: newBadges } : m))
      if (editingMember?.id === memberId) {
        setEditingMember(prev => prev ? { ...prev, badges: newBadges } : null)
      }
      showToast('Badge attribué !')
    }
  }

  // ── Supprimer badge ─────────────────────────────────────
  const removeBadge = async (memberId: string, badgeIndex: number) => {
    const member  = members.find(m => m.id === memberId)
    if (!member) return
    const newBadges = member.badges.filter((_, i) => i !== badgeIndex)

    const { error } = await supabase
      .from('community_members')
      .update({ badges: newBadges })
      .eq('id', memberId)

    if (!error) {
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, badges: newBadges } : m))
      if (editingMember?.id === memberId) {
        setEditingMember(prev => prev ? { ...prev, badges: newBadges } : null)
      }
    }
  }

  // ── Mettre à jour stats custom ──────────────────────────
  const updateStat = async (memberId: string, key: string, value: any) => {
    const member  = members.find(m => m.id === memberId)
    if (!member) return
    const newStats = { ...member.custom_stats, [key]: value }

    const { error } = await supabase
      .from('community_members')
      .update({ custom_stats: newStats })
      .eq('id', memberId)

    if (!error) {
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, custom_stats: newStats } : m))
      if (editingMember?.id === memberId) {
        setEditingMember(prev => prev ? { ...prev, custom_stats: newStats } : null)
      }
    }
  }

  // ── Retirer un membre ───────────────────────────────────
  const removeMember = async (memberId: string) => {
    if (!confirm('Retirer ce membre de la communauté ?')) return
    const { error } = await supabase
      .from('community_members')
      .delete()
      .eq('id', memberId)

    if (!error) {
      setMembers(prev => prev.filter(m => m.id !== memberId))
      if (editingMember?.id === memberId) setEditingMember(null)
      showToast('Membre retiré')
    }
  }

  // ── Filtres ─────────────────────────────────────────────
  const filtered = members.filter(m => {
    const name  = m.profiles?.display_name ?? m.profiles?.email ?? ''
    const matchSearch = name.toLowerCase().includes(search.toLowerCase())
    const matchRole   = filterRole === 'all' || m.role === filterRole
    return matchSearch && matchRole
  })

  const counts = {
    all:       members.length,
    owner:     members.filter(m => m.role === 'owner').length,
    moderator: members.filter(m => m.role === 'moderator').length,
    member:    members.filter(m => m.role === 'member').length,
    pending:   members.filter(m => m.role === 'pending').length,
  }

  // ── Rendu ────────────────────────────────────────────────
  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', fontFamily: "'Rajdhani', sans-serif", color: '#e0e0e0' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          background: '#1a1a1a', border: '1px solid #4CAF50',
          color: '#4CAF50', padding: '12px 20px', borderRadius: '8px',
          fontFamily: 'Orbitron', fontSize: '0.8rem', letterSpacing: '1px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}>
          ✓ {toast}
        </div>
      )}

      {/* Topbar */}
      <div style={{
        background: '#0d0d0d', borderBottom: '2px solid #FFC107',
        padding: '14px 30px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => router.push(`/dashboard/${community.slug}`)}
            style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', fontSize: '1.2rem' }}
          >
            ←
          </button>
          <span style={{ fontFamily: 'Orbitron', fontSize: '0.9rem', color: 'white', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Membres
          </span>
          <span style={{ background: '#1a1a1a', color: '#FFC107', border: '1px solid #333', padding: '3px 10px', borderRadius: '20px', fontSize: '0.8rem', fontFamily: 'Orbitron' }}>
            {members.length}
          </span>
        </div>
        <button
          onClick={generateInviteLink}
          style={{
            background: '#FFC107', color: '#000', border: 'none',
            padding: '9px 22px', fontFamily: 'Orbitron', fontWeight: 'bold',
            fontSize: '0.78rem', cursor: 'pointer', borderRadius: '4px',
            textTransform: 'uppercase', letterSpacing: '1px',
          }}
        >
          + Inviter
        </button>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '30px' }}>

        {/* Modal invitation */}
        {showInvite && (
          <div style={{
            background: '#141414', border: '1px solid #FFC107',
            borderRadius: '12px', padding: '24px', marginBottom: '30px',
            boxShadow: '0 0 30px rgba(255,193,7,0.1)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontFamily: 'Orbitron', fontSize: '0.9rem', color: '#FFC107', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Lien d'invitation
              </h3>
              <button onClick={() => setShowInvite(false)} style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>
            <p style={{ color: '#888', fontSize: '0.9rem', margin: '0 0 14px' }}>
              Partage ce lien — n'importe qui peut rejoindre ta communauté avec.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                readOnly
                value={inviteLink}
                style={{
                  flex: 1, background: '#0a0a0a', border: '1px solid #333',
                  color: '#ccc', padding: '10px 14px', borderRadius: '6px',
                  fontFamily: 'monospace', fontSize: '0.8rem',
                }}
              />
              <button
                onClick={copyLink}
                style={{
                  background: copied ? '#4CAF50' : '#1a1a1a',
                  border: `1px solid ${copied ? '#4CAF50' : '#333'}`,
                  color: copied ? '#fff' : '#ccc',
                  padding: '10px 20px', borderRadius: '6px',
                  cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'Orbitron',
                  transition: 'all 0.2s', whiteSpace: 'nowrap',
                }}
              >
                {copied ? '✓ Copié' : 'Copier'}
              </button>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Rechercher un membre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, minWidth: '200px',
              background: '#141414', border: '1px solid #2a2a2a',
              color: '#e0e0e0', padding: '10px 16px', borderRadius: '8px',
              fontFamily: 'Rajdhani', fontSize: '1rem', outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['all', 'owner', 'moderator', 'member', 'pending'] as const).map(role => (
              <button
                key={role}
                onClick={() => setFilterRole(role)}
                style={{
                  background: filterRole === role ? (role === 'all' ? '#FFC107' : ROLE_COLORS[role]) : '#141414',
                  color: filterRole === role ? (role === 'all' ? '#000' : '#000') : '#888',
                  border: `1px solid ${filterRole === role ? (role === 'all' ? '#FFC107' : ROLE_COLORS[role]) : '#2a2a2a'}`,
                  padding: '8px 14px', borderRadius: '6px',
                  cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'Orbitron',
                  textTransform: 'uppercase', letterSpacing: '1px',
                  transition: 'all 0.15s',
                }}
              >
                {role === 'all' ? 'Tous' : role} ({counts[role]})
              </button>
            ))}
          </div>
        </div>

        {/* Layout : liste + panel édition */}
        <div style={{ display: 'grid', gridTemplateColumns: editingMember ? '1fr 380px' : '1fr', gap: '20px' }}>

          {/* Liste membres */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px', color: '#444', fontFamily: 'Orbitron', fontSize: '0.85rem' }}>
                Aucun membre trouvé
              </div>
            )}
            {filtered.map(member => {
              const name    = member.profiles?.display_name ?? member.profiles?.email?.split('@')[0] ?? '???'
              const initial = name[0]?.toUpperCase()
              const isEditing = editingMember?.id === member.id

              return (
                <div
                  key={member.id}
                  onClick={() => setEditingMember(isEditing ? null : member)}
                  style={{
                    background: isEditing ? '#1a1a0d' : '#141414',
                    border: `1px solid ${isEditing ? '#FFC107' : '#222'}`,
                    borderRadius: '10px', padding: '14px 18px',
                    display: 'flex', alignItems: 'center', gap: '14px',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '6px',
                    background: '#222', border: `1px solid ${ROLE_COLORS[member.role] ?? '#333'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Orbitron', fontSize: '1.1rem', color: '#FFC107',
                    overflow: 'hidden', flexShrink: 0,
                  }}>
                    {member.profiles?.avatar_url
                      ? <img src={member.profiles.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                      : initial
                    }
                  </div>

                  {/* Infos */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'Orbitron', fontSize: '0.9rem', color: 'white', textTransform: 'uppercase' }}>
                        {name}
                      </span>
                      <span style={{
                        fontSize: '0.7rem', padding: '2px 8px', borderRadius: '3px',
                        border: `1px solid ${ROLE_COLORS[member.role]}`,
                        color: ROLE_COLORS[member.role],
                        background: `${ROLE_COLORS[member.role]}18`,
                        textTransform: 'uppercase', fontWeight: 'bold',
                      }}>
                        {member.role}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#555', marginTop: '2px' }}>
                      {member.profiles?.email}
                    </div>
                    {/* Badges */}
                    {member.badges?.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                        {member.badges.map((b: any, i: number) => (
                          <span key={i} style={{
                            fontSize: '0.62rem', padding: '1px 6px', borderRadius: '2px',
                            border: `1px solid ${b.color ?? '#FFC107'}`,
                            color: b.color ?? '#FFC107',
                            background: `${b.color ?? '#FFC107'}18`,
                            textTransform: 'uppercase', fontWeight: 'bold',
                          }}>
                            {b.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Points */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'Orbitron', fontSize: '1.1rem', color: '#FFC107' }}>{member.points}</div>
                    <div style={{ fontSize: '0.65rem', color: '#555', textTransform: 'uppercase' }}>pts</div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Panel d'édition */}
          {editingMember && (
            <EditPanel
              member={editingMember}
              statFields={statFields}
              onClose={() => setEditingMember(null)}
              onChangeRole={changeRole}
              onUpdatePoints={updatePoints}
              onAddBadge={addBadge}
              onRemoveBadge={removeBadge}
              onUpdateStat={updateStat}
              onRemove={removeMember}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ── Panel d'édition d'un membre ────────────────────────────
function EditPanel({ member, statFields, onClose, onChangeRole, onUpdatePoints, onAddBadge, onRemoveBadge, onUpdateStat, onRemove }: {
  member: Member
  statFields: StatField[]
  onClose: () => void
  onChangeRole: (id: string, role: string) => void
  onUpdatePoints: (id: string, points: number) => void
  onAddBadge: (id: string, name: string, color: string) => void
  onRemoveBadge: (id: string, index: number) => void
  onUpdateStat: (id: string, key: string, value: any) => void
  onRemove: (id: string) => void
}) {
  const name = member.profiles?.display_name ?? member.profiles?.email?.split('@')[0] ?? '???'
  const [newBadgeName, setNewBadgeName]   = useState('')
  const [newBadgeColor, setNewBadgeColor] = useState('#FFC107')
  const [localPoints, setLocalPoints]     = useState(member.points)

  return (
    <div style={{
      background: '#111', border: '1px solid #FFC107',
      borderRadius: '12px', padding: '24px',
      position: 'sticky', top: '80px', height: 'fit-content',
      maxHeight: 'calc(100vh - 100px)', overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <span style={{ fontFamily: 'Orbitron', fontSize: '0.85rem', color: '#FFC107', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {name}
        </span>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
      </div>

      {/* Rôle */}
      <Section title="Rôle">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {(['moderator', 'member', 'pending'] as const).map(role => (
            <button
              key={role}
              onClick={() => onChangeRole(member.id, role)}
              style={{
                background: member.role === role ? `${ROLE_COLORS[role]}22` : '#1a1a1a',
                border: `1px solid ${member.role === role ? ROLE_COLORS[role] : '#2a2a2a'}`,
                color: member.role === role ? ROLE_COLORS[role] : '#777',
                padding: '8px', borderRadius: '6px',
                cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'Orbitron',
                textTransform: 'uppercase', transition: 'all 0.15s',
              }}
            >
              {role}
            </button>
          ))}
        </div>
      </Section>

      {/* Points */}
      <Section title="Points">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => { const v = Math.max(0, localPoints - 10); setLocalPoints(v); onUpdatePoints(member.id, v) }}
            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#ccc', width: '36px', height: '36px', borderRadius: '6px', cursor: 'pointer', fontSize: '1.1rem' }}
          >−</button>
          <input
            type="number"
            value={localPoints}
            onChange={e => setLocalPoints(Number(e.target.value))}
            onBlur={() => onUpdatePoints(member.id, localPoints)}
            style={{
              flex: 1, background: '#0a0a0a', border: '1px solid #2a2a2a',
              color: '#FFC107', padding: '8px', borderRadius: '6px',
              fontFamily: 'Orbitron', fontSize: '1rem', textAlign: 'center', outline: 'none',
            }}
          />
          <button
            onClick={() => { const v = localPoints + 10; setLocalPoints(v); onUpdatePoints(member.id, v) }}
            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#ccc', width: '36px', height: '36px', borderRadius: '6px', cursor: 'pointer', fontSize: '1.1rem' }}
          >+</button>
        </div>
      </Section>

      {/* Badges */}
      <Section title="Badges">
        {member.badges?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            {member.badges.map((b: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{
                  fontSize: '0.65rem', padding: '2px 8px', borderRadius: '2px',
                  border: `1px solid ${b.color ?? '#FFC107'}`,
                  color: b.color ?? '#FFC107',
                  background: `${b.color ?? '#FFC107'}18`,
                  textTransform: 'uppercase', fontWeight: 'bold',
                }}>
                  {b.name}
                </span>
                <button
                  onClick={() => onRemoveBadge(member.id, i)}
                  style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', fontSize: '0.8rem', padding: '0 2px' }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            placeholder="Nom du badge"
            value={newBadgeName}
            onChange={e => setNewBadgeName(e.target.value)}
            style={{
              flex: 1, background: '#0a0a0a', border: '1px solid #2a2a2a',
              color: '#ccc', padding: '8px 10px', borderRadius: '6px',
              fontFamily: 'Rajdhani', fontSize: '0.9rem', outline: 'none',
            }}
          />
          <input
            type="color"
            value={newBadgeColor}
            onChange={e => setNewBadgeColor(e.target.value)}
            style={{ width: '38px', height: '38px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '4px' }}
          />
          <button
            onClick={() => { if (newBadgeName.trim()) { onAddBadge(member.id, newBadgeName.trim(), newBadgeColor); setNewBadgeName('') } }}
            style={{
              background: '#FFC107', color: '#000', border: 'none',
              padding: '8px 14px', borderRadius: '6px', cursor: 'pointer',
              fontFamily: 'Orbitron', fontSize: '0.75rem', fontWeight: 'bold',
            }}
          >
            +
          </button>
        </div>
      </Section>

      {/* Stats custom */}
      {statFields.length > 0 && (
        <Section title="Statistiques">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {statFields.map((field: StatField) => (
              <div key={field.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {field.label}
                </span>
                <input
                  type={field.type === 'number' || field.type === 'percentage' ? 'number' : 'text'}
                  value={member.custom_stats?.[field.key] ?? ''}
                  onChange={e => onUpdateStat(member.id, field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                  style={{
                    width: '90px', background: '#0a0a0a', border: '1px solid #2a2a2a',
                    color: '#FFC107', padding: '6px 10px', borderRadius: '6px',
                    fontFamily: 'Orbitron', fontSize: '0.85rem', textAlign: 'right', outline: 'none',
                  }}
                />
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Danger zone */}
      {member.role !== 'owner' && (
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #2a2a2a' }}>
          <button
            onClick={() => onRemove(member.id)}
            style={{
              width: '100%', background: 'transparent',
              border: '1px solid #FF2344', color: '#FF2344',
              padding: '10px', borderRadius: '6px', cursor: 'pointer',
              fontFamily: 'Orbitron', fontSize: '0.75rem', textTransform: 'uppercase',
              letterSpacing: '1px', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget).style.background = '#FF234422' }}
            onMouseLeave={e => { (e.currentTarget).style.background = 'transparent' }}
          >
            Retirer ce membre
          </button>
        </div>
      )}
    </div>
  )
}

// ── Section helper ─────────────────────────────────────────
function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '22px' }}>
      <div style={{
        fontFamily: 'Orbitron', fontSize: '0.68rem', color: '#555',
        textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px',
        paddingBottom: '6px', borderBottom: '1px solid #1a1a1a',
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}