'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ── Types ─────────────────────────────────────────────────
interface Feature {
  id: string
  module: string
  enabled: boolean
  visibility: 'public' | 'members_only'
  config: Record<string, any>
}

interface Community {
  id: string
  name: string
  slug: string
  subscription_tier: string
}

// ── Config des modules ────────────────────────────────────
const MODULE_CONFIG = [
  {
    key: 'scores',
    label: 'Scores & Classement',
    icon: '🏆',
    desc: 'Statistiques personnalisées et classement des membres',
    plans: ['free', 'starter', 'pro'],
  },
  {
    key: 'applications',
    label: 'Candidatures',
    icon: '📋',
    desc: 'Formulaire de recrutement personnalisé pour les visiteurs',
    plans: ['free', 'starter', 'pro'],
  },
  {
    key: 'calendar',
    label: 'Calendrier & Événements',
    icon: '📅',
    desc: 'Organisez des événements avec système de RSVP',
    plans: ['free', 'starter', 'pro'],
  },
  {
    key: 'forum',
    label: 'Forum',
    icon: '💬',
    desc: 'Discussions organisées par catégories',
    plans: ['free', 'starter', 'pro'],
  },
  {
    key: 'bets',
    label: 'Paris Internes',
    icon: '🎲',
    desc: 'Mises en points fictifs entre membres',
    plans: ['starter', 'pro'],
  },
  {
    key: 'tournaments',
    label: 'Tournois & Brackets',
    icon: '🥊',
    desc: 'Compétitions internes avec brackets visuels',
    plans: ['starter', 'pro'],
  },
  {
    key: 'shop',
    label: 'Boutique',
    icon: '🛍️',
    desc: 'Articles virtuels contre des points (physiques en Pro)',
    plans: ['free', 'starter', 'pro'],
  },
]

const PLAN_ORDER = ['free', 'starter', 'pro']

export function ModulesClient({ community, initialFeatures }: {
  community: Community
  initialFeatures: Feature[]
}) {
  const supabase = createClient()
  const router   = useRouter()

  const [features, setFeatures] = useState<Feature[]>(initialFeatures)
  const [saving, setSaving]     = useState<string | null>(null)
  const [toast, setToast]       = useState<string | null>(null)

  const currentPlanIndex = PLAN_ORDER.indexOf(community.subscription_tier)

  // ── Toast ───────────────────────────────────────────────
  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  // ── Toggle enabled ──────────────────────────────────────
  const toggleEnabled = async (feature: Feature) => {
    // Vérifier le plan
    const modConfig = MODULE_CONFIG.find(m => m.key === feature.module)
    if (!modConfig) return

    const requiredPlanIndex = PLAN_ORDER.indexOf(modConfig.plans[0])
    if (currentPlanIndex < requiredPlanIndex) {
      showToast(`Ce module nécessite le plan ${modConfig.plans[0].toUpperCase()}`)
      return
    }

    setSaving(feature.id)
    const newEnabled = !feature.enabled

    const { error } = await supabase
      .from('features')
      .update({ enabled: newEnabled })
      .eq('id', feature.id)

    if (!error) {
      setFeatures(prev => prev.map(f =>
        f.id === feature.id ? { ...f, enabled: newEnabled } : f
      ))
      showToast(newEnabled ? 'Module activé' : 'Module désactivé')
    }
    setSaving(null)
  }

  // ── Toggle visibility ───────────────────────────────────
  const toggleVisibility = async (feature: Feature) => {
    if (!feature.enabled) return
    setSaving(feature.id)

    const newVis = feature.visibility === 'public' ? 'members_only' : 'public'

    const { error } = await supabase
      .from('features')
      .update({ visibility: newVis })
      .eq('id', feature.id)

    if (!error) {
      setFeatures(prev => prev.map(f =>
        f.id === feature.id ? { ...f, visibility: newVis } : f
      ))
      showToast(newVis === 'public' ? 'Visible publiquement' : 'Réservé aux membres')
    }
    setSaving(null)
  }

  const getFeature = (key: string) => features.find(f => f.module === key)

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
            Modules
          </span>
        </div>
        <span style={{
          background: '#1a1a1a', border: '1px solid #333',
          color: '#FFC107', padding: '5px 14px', borderRadius: '20px',
          fontFamily: 'Orbitron', fontSize: '0.75rem', textTransform: 'uppercase',
        }}>
          Plan {community.subscription_tier}
        </span>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 30px' }}>

        {/* Légende */}
        <div style={{
          background: '#141414', border: '1px solid #222',
          borderRadius: '10px', padding: '16px 20px',
          marginBottom: '30px', display: 'flex', gap: '24px', flexWrap: 'wrap',
        }}>
          {[
            { icon: '🌍', label: 'Public — visible par tous les visiteurs' },
            { icon: '🔒', label: 'Membres — visible uniquement par les membres connectés' },
            { icon: '⭐', label: 'Nécessite un plan supérieur' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1rem' }}>{item.icon}</span>
              <span style={{ fontSize: '0.82rem', color: '#666' }}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Liste des modules */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {MODULE_CONFIG.map(modConfig => {
            const feature        = getFeature(modConfig.key)
            if (!feature) return null

            const requiredPlan      = modConfig.plans[0]
            const requiredPlanIndex = PLAN_ORDER.indexOf(requiredPlan)
            const isLocked          = currentPlanIndex < requiredPlanIndex
            const isSaving          = saving === feature.id

            return (
              <div
                key={modConfig.key}
                style={{
                  background: '#141414',
                  border: `1px solid ${feature.enabled ? '#FFC10733' : '#222'}`,
                  borderRadius: '12px', padding: '20px 24px',
                  opacity: isLocked ? 0.5 : 1,
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

                  {/* Icône */}
                  <span style={{ fontSize: '1.8rem', flexShrink: 0 }}>{modConfig.icon}</span>

                  {/* Infos */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontFamily: 'Orbitron', fontSize: '0.88rem',
                        color: feature.enabled ? 'white' : '#666',
                        textTransform: 'uppercase', letterSpacing: '1px',
                      }}>
                        {modConfig.label}
                      </span>
                      {isLocked && (
                        <span style={{
                          fontSize: '0.65rem', padding: '2px 8px', borderRadius: '3px',
                          border: '1px solid #FFC107', color: '#FFC107',
                          background: 'rgba(255,193,7,0.1)', fontFamily: 'Orbitron',
                          textTransform: 'uppercase',
                        }}>
                          ⭐ {requiredPlan}+
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#555', lineHeight: 1.4 }}>
                      {modConfig.desc}
                    </p>
                  </div>

                  {/* Contrôles */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>

                    {/* Visibilité — seulement si activé */}
                    {feature.enabled && !isLocked && (
                      <button
                        onClick={() => toggleVisibility(feature)}
                        disabled={isSaving}
                        title={feature.visibility === 'public' ? 'Visible publiquement — cliquer pour restreindre' : 'Réservé aux membres — cliquer pour rendre public'}
                        style={{
                          background: feature.visibility === 'public' ? 'rgba(76,175,80,0.15)' : 'rgba(33,150,243,0.15)',
                          border: `1px solid ${feature.visibility === 'public' ? '#4CAF50' : '#2196F3'}`,
                          color: feature.visibility === 'public' ? '#4CAF50' : '#2196F3',
                          padding: '6px 14px', borderRadius: '20px',
                          cursor: 'pointer', fontSize: '0.78rem',
                          fontFamily: 'Orbitron', textTransform: 'uppercase',
                          letterSpacing: '1px', transition: 'all 0.15s',
                          display: 'flex', alignItems: 'center', gap: '6px',
                        }}
                      >
                        {feature.visibility === 'public' ? '🌍 Public' : '🔒 Membres'}
                      </button>
                    )}

                    {/* Toggle ON/OFF */}
                    <button
                      onClick={() => !isLocked && toggleEnabled(feature)}
                      disabled={isSaving || isLocked}
                      style={{
                        position: 'relative',
                        width: '52px', height: '28px',
                        background: feature.enabled ? '#FFC107' : '#2a2a2a',
                        border: 'none', borderRadius: '14px',
                        cursor: isLocked ? 'not-allowed' : 'pointer',
                        transition: 'background 0.2s',
                        flexShrink: 0,
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        top: '4px',
                        left: feature.enabled ? '28px' : '4px',
                        width: '20px', height: '20px',
                        background: feature.enabled ? '#000' : '#555',
                        borderRadius: '50%',
                        transition: 'left 0.2s',
                      }} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Upgrade CTA si plan Free */}
        {community.subscription_tier === 'free' && (
          <div style={{
            marginTop: '30px',
            background: 'linear-gradient(135deg, #1a1a0d, #141414)',
            border: '1px solid #FFC107',
            borderRadius: '12px', padding: '24px',
            textAlign: 'center',
            boxShadow: '0 0 30px rgba(255,193,7,0.08)',
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '10px' }}>⭐</div>
            <h3 style={{ fontFamily: 'Orbitron', color: '#FFC107', fontSize: '0.95rem', textTransform: 'uppercase', margin: '0 0 8px', letterSpacing: '1px' }}>
              Débloquer tous les modules
            </h3>
            <p style={{ color: '#666', fontSize: '0.88rem', margin: '0 0 16px' }}>
              Passe au plan Starter pour accéder aux Tournois et à la Boutique.
            </p>
            <button style={{
              background: '#FFC107', color: '#000', border: 'none',
              padding: '10px 28px', fontFamily: 'Orbitron', fontWeight: 'bold',
              fontSize: '0.8rem', cursor: 'pointer', borderRadius: '4px',
              textTransform: 'uppercase', letterSpacing: '1px',
            }}>
              Voir les plans →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}