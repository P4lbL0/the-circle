'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Tier = 'free' | 'starter' | 'pro'

interface Community {
  id:                string
  name:              string
  slug:              string
  subscription_tier: string
  privacy:           string
  community_type:    string
  created_at:        string
  logo_url:          string | null
  community_members: { count: number }[]
}

interface Stats {
  totalUsers:       number
  totalCommunities: number
  totalEvents:      number
}

const TIER_COLORS: Record<string, string> = {
  free:    '#52525b',
  starter: '#3b82f6',
  pro:     '#FFC107',
}

const TIER_ORDER: Tier[] = ['free', 'starter', 'pro']

export function SuperAdminClient({ adminName, communities, stats }: {
  adminName:   string
  communities: Community[]
  stats:       Stats
}) {
  const supabase = createClient()

  const [list, setList]       = useState<Community[]>(communities)
  const [loading, setLoading] = useState<string | null>(null)
  const [toast, setToast]     = useState<string | null>(null)
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState<'all' | Tier>('all')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  const setTier = async (communityId: string, tier: Tier) => {
    setLoading(communityId + tier)
    const { error } = await supabase
      .from('communities')
      .update({ subscription_tier: tier })
      .eq('id', communityId)

    if (error) {
      showToast('Erreur : ' + error.message)
    } else {
      setList(prev => prev.map(c => c.id === communityId ? { ...c, subscription_tier: tier } : c))
      showToast(`Plan mis à jour → ${tier.toUpperCase()}`)
    }
    setLoading(null)
  }

  const filtered = list.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.slug.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || c.subscription_tier === filter
    return matchSearch && matchFilter
  })

  const inputStyle: React.CSSProperties = {
    background: '#111113', border: '1px solid #27272a', color: '#fafafa',
    padding: '9px 14px', borderRadius: '8px', fontSize: '0.875rem',
    outline: 'none', fontFamily: 'inherit',
  }

  return (
    <div style={{ background: '#09090b', minHeight: '100vh', fontFamily: "'Inter', -apple-system, sans-serif", color: '#fafafa' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Orbitron:wght@700;900&display=swap');`}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, background: '#111113', border: '1px solid #22c55e', color: '#22c55e', padding: '12px 20px', borderRadius: '10px', fontSize: '0.875rem', fontWeight: 500, boxShadow: '0 10px 40px rgba(0,0,0,0.4)' }}>
          ✓ {toast}
        </div>
      )}

      {/* Header */}
      <header style={{ background: '#0d0d10', borderBottom: '1px solid #18181b', padding: '0 40px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.88rem', color: '#FFC107', letterSpacing: '4px' }}>THE CIRCLE</span>
          <span style={{ color: '#27272a' }}>|</span>
          <span style={{ fontSize: '0.82rem', color: '#52525b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1px' }}>Super Admin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.82rem', color: '#52525b' }}>Connecté en tant que</span>
          <div style={{ background: 'rgba(255,193,7,0.1)', border: '1px solid rgba(255,193,7,0.2)', borderRadius: '999px', padding: '4px 12px', fontSize: '0.8rem', color: '#FFC107', fontWeight: 600 }}>
            {adminName}
          </div>
          <a href="/dashboard" style={{ background: '#1c1c1f', border: '1px solid #27272a', borderRadius: '6px', padding: '7px 14px', color: '#71717a', textDecoration: 'none', fontSize: '0.8rem', transition: 'color 0.15s' }}>
            ← Dashboard
          </a>
        </div>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>

        {/* Stats globales */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '40px' }}>
          {[
            { label: 'Utilisateurs', value: stats.totalUsers, icon: '👤', color: '#3b82f6' },
            { label: 'Communautés', value: stats.totalCommunities, icon: '🌐', color: '#FFC107' },
            { label: 'Événements', value: stats.totalEvents, icon: '📅', color: '#22c55e' },
          ].map(stat => (
            <div key={stat.label} style={{ background: '#111113', border: '1px solid #1c1c1f', borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${stat.color}15`, border: `1px solid ${stat.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
                {stat.icon}
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fafafa', letterSpacing: '-0.02em', lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: '0.8rem', color: '#52525b', marginTop: '4px', fontWeight: 500 }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Titre + actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fafafa', marginBottom: '4px' }}>Gestion des communautés</h1>
            <p style={{ fontSize: '0.85rem', color: '#52525b' }}>Modifiez les plans directement pour tester les fonctionnalités.</p>
          </div>
          {/* Résumé par tier */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['all', 'free', 'starter', 'pro'] as const).map(t => {
              const count = t === 'all' ? list.length : list.filter(c => c.subscription_tier === t).length
              return (
                <button key={t} onClick={() => setFilter(t)} style={{
                  background: filter === t ? '#1c1c1f' : 'transparent',
                  border: `1px solid ${filter === t ? '#3f3f46' : '#27272a'}`,
                  borderRadius: '8px', padding: '7px 14px',
                  color: filter === t ? '#fafafa' : '#71717a',
                  fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  {t === 'all' ? 'Tous' : t.toUpperCase()}
                  <span style={{ background: t === 'all' ? '#27272a' : (TIER_COLORS[t] + '22'), color: t === 'all' ? '#71717a' : TIER_COLORS[t], borderRadius: '999px', padding: '1px 7px', fontSize: '0.72rem', fontWeight: 600 }}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Barre de recherche */}
        <div style={{ marginBottom: '16px' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une communauté..."
            style={{ ...inputStyle, width: '320px' }}
          />
        </div>

        {/* Table des communautés */}
        <div style={{ background: '#111113', border: '1px solid #1c1c1f', borderRadius: '16px', overflow: 'hidden' }}>
          {/* En-tête */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr', padding: '12px 20px', borderBottom: '1px solid #1c1c1f', background: '#0d0d10' }}>
            {['Communauté', 'Type', 'Membres', 'Plan actuel', 'Changer de plan'].map(h => (
              <span key={h} style={{ fontSize: '0.72rem', color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>{h}</span>
            ))}
          </div>

          {filtered.length === 0 && (
            <div style={{ padding: '48px', textAlign: 'center', color: '#3f3f46', fontSize: '0.875rem' }}>
              Aucune communauté trouvée.
            </div>
          )}

          {filtered.map((community, i) => {
            const memberCount = community.community_members?.[0]?.count ?? 0
            const tier        = community.subscription_tier as Tier
            const tierColor   = TIER_COLORS[tier] ?? '#52525b'

            return (
              <div key={community.id} style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr',
                padding: '14px 20px', alignItems: 'center',
                borderBottom: i < filtered.length - 1 ? '1px solid #18181b' : 'none',
                transition: 'background 0.1s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = '#18181b')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Nom */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#1c1c1f', border: '1px solid #27272a', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#52525b', fontSize: '0.8rem', fontWeight: 700 }}>
                    {community.logo_url
                      ? <img src={community.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : community.name[0]?.toUpperCase()
                    }
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fafafa' }}>{community.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#3f3f46' }}>/{community.slug}</div>
                  </div>
                </div>

                {/* Type */}
                <div style={{ fontSize: '0.8rem', color: '#52525b', textTransform: 'capitalize' }}>{community.community_type}</div>

                {/* Membres */}
                <div style={{ fontSize: '0.875rem', color: '#71717a', fontWeight: 500 }}>{memberCount}</div>

                {/* Plan actuel */}
                <div>
                  <span style={{
                    display: 'inline-block', padding: '3px 10px', borderRadius: '999px',
                    background: `${tierColor}15`, border: `1px solid ${tierColor}30`,
                    color: tierColor, fontSize: '0.75rem', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                  }}>
                    {tier}
                  </span>
                </div>

                {/* Actions tier */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  {TIER_ORDER.map(t => {
                    const isCurrentTier = tier === t
                    const isLoading     = loading === community.id + t
                    return (
                      <button
                        key={t}
                        onClick={() => !isCurrentTier && setTier(community.id, t)}
                        disabled={isCurrentTier || isLoading !== false}
                        style={{
                          padding: '5px 12px', borderRadius: '6px', cursor: isCurrentTier ? 'default' : 'pointer',
                          border: `1px solid ${isCurrentTier ? TIER_COLORS[t] + '50' : '#27272a'}`,
                          background: isCurrentTier ? `${TIER_COLORS[t]}15` : '#0d0d10',
                          color: isCurrentTier ? TIER_COLORS[t] : '#52525b',
                          fontSize: '0.72rem', fontWeight: 600,
                          textTransform: 'uppercase', letterSpacing: '0.5px',
                          transition: 'all 0.15s', opacity: isLoading ? 0.5 : 1,
                        }}
                        onMouseEnter={e => { if (!isCurrentTier) { (e.currentTarget).style.borderColor = TIER_COLORS[t]; (e.currentTarget).style.color = TIER_COLORS[t] } }}
                        onMouseLeave={e => { if (!isCurrentTier) { (e.currentTarget).style.borderColor = '#27272a'; (e.currentTarget).style.color = '#52525b' } }}
                      >
                        {isLoading ? '...' : isCurrentTier ? '✓ ' + t : t}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Note */}
        <div style={{ marginTop: '20px', background: 'rgba(255,193,7,0.05)', border: '1px solid rgba(255,193,7,0.15)', borderRadius: '12px', padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1rem', flexShrink: 0 }}>💡</span>
            <div style={{ fontSize: '0.85rem', color: '#a1a1aa', lineHeight: 1.6 }}>
              <strong style={{ color: '#FFC107' }}>Mode test :</strong> Changez le plan d'une communauté directement ici pour tester les fonctionnalités Pro (articles physiques, membres illimités, export CSV, branding supprimé). En production, ceci sera géré par Stripe automatiquement.
              <br />
              <strong style={{ color: '#71717a' }}>Pour devenir superadmin :</strong> Mettez à jour <code style={{ background: '#1c1c1f', padding: '1px 5px', borderRadius: '3px', fontSize: '0.8rem' }}>profiles.global_role = 'super_admin'</code> dans Supabase pour votre profil.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
