'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Community {
  id:           string
  name:         string
  slug:         string
  logo_url:     string | null
  description:  string | null
  theme_json:   any
  subscription_tier: string
}

export function JoinClient({ community, token }: {
  community: Community
  token:     string
}) {
  const theme = community.theme_json as {
    primaryColor: string
    accentColor:  string
    font:         string
    darkMode:     boolean
  }

  const bg    = theme.darkMode ? '#0a0a0a' : '#f5f5f5'
  const panel = theme.darkMode ? '#141414' : '#ffffff'
  const text  = theme.darkMode ? '#e0e0e0' : '#1a1a1a'
  const muted = theme.darkMode ? '#666'    : '#999'
  const bord  = theme.darkMode ? '#2a2a2a' : '#e0e0e0'
  const inputBg = theme.darkMode ? '#0f0f0f' : '#f8f8f8'

  const [email, setEmail]   = useState('')
  const [sent, setSent]     = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const redirectTo =
      `${window.location.origin}/auth/callback?next=${encodeURIComponent(`/join/${community.slug}?token=${token}`)}`

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    })

    if (otpError) {
      setError('Impossible d\'envoyer le lien. Vérifie ton email.')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div style={{ background: bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Rajdhani', sans-serif", padding: '24px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Rajdhani:wght@400;600;700&family=Oswald:wght@600&family=Montserrat:wght@600&family=Inter:wght@500;600&display=swap');`}</style>

      <div style={{
        background: panel, border: `1px solid ${theme.primaryColor}44`,
        borderRadius: '20px', padding: '50px 40px', maxWidth: '440px', width: '100%',
        textAlign: 'center', boxShadow: `0 0 60px ${theme.primaryColor}15`,
      }}>

        {/* Logo */}
        {community.logo_url ? (
          <img src={community.logo_url} alt={community.name}
            style={{ width: '80px', height: '80px', borderRadius: '16px', objectFit: 'cover', border: `2px solid ${theme.primaryColor}`, marginBottom: '20px' }}
          />
        ) : (
          <div style={{
            width: '80px', height: '80px', borderRadius: '16px',
            background: theme.darkMode ? '#1a1a1a' : '#eee',
            border: `2px solid ${theme.primaryColor}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: `'${theme.font}', sans-serif`, fontSize: '2rem',
            color: theme.primaryColor, margin: '0 auto 20px',
          }}>
            {community.name[0]?.toUpperCase()}
          </div>
        )}

        {/* Titre */}
        <h1 style={{
          fontFamily: `'${theme.font}', sans-serif`, fontSize: '1.4rem',
          color: theme.darkMode ? 'white' : '#111', textTransform: 'uppercase',
          letterSpacing: '2px', margin: '0 0 10px',
        }}>
          {community.name}
        </h1>

        <p style={{ color: muted, fontSize: '0.9rem', margin: '0 0 8px' }}>
          Tu as été invité à rejoindre cette communauté.
        </p>

        {community.description && (
          <p style={{ color: theme.darkMode ? '#888' : '#777', fontSize: '0.88rem', margin: '0 0 28px', lineHeight: 1.5, fontStyle: 'italic' }}>
            "{community.description}"
          </p>
        )}

        {/* ── État : email envoyé ── */}
        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📬</div>
            <h3 style={{ fontFamily: `'${theme.font}', sans-serif`, color: theme.primaryColor, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 12px' }}>
              Vérifie ta boîte mail
            </h3>
            <p style={{ color: muted, fontSize: '0.88rem', lineHeight: 1.6, margin: '0 0 20px' }}>
              On a envoyé un lien magique à <strong style={{ color: text }}>{email}</strong>.<br />
              Clique dessus pour rejoindre instantanément la communauté.
            </p>
            <button
              onClick={() => { setSent(false); setEmail('') }}
              style={{ background: 'transparent', border: 'none', color: muted, fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Utiliser un autre email
            </button>
          </div>
        ) : (
          /* ── Formulaire magic link ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            <form onSubmit={handleMagicLink} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="email"
                required
                placeholder="ton@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  background: inputBg, border: `1px solid ${bord}`,
                  color: text, padding: '13px 16px', borderRadius: '8px',
                  fontFamily: 'Rajdhani', fontSize: '1rem', outline: 'none',
                  textAlign: 'center',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = theme.primaryColor)}
                onBlur={e => (e.currentTarget.style.borderColor = bord)}
              />

              {error && (
                <p style={{ color: '#FF2344', fontSize: '0.82rem', margin: 0 }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  background: loading ? `${theme.primaryColor}66` : theme.primaryColor,
                  color: '#000', fontFamily: `'${theme.font}', sans-serif`, fontWeight: 'bold',
                  padding: '13px', borderRadius: '8px', border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px',
                  transition: 'all 0.2s',
                }}
              >
                {loading ? 'Envoi...' : '✨ Rejoindre en 1 clic'}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0' }}>
              <div style={{ flex: 1, height: '1px', background: bord }} />
              <span style={{ color: muted, fontSize: '0.75rem' }}>ou</span>
              <div style={{ flex: 1, height: '1px', background: bord }} />
            </div>

            <Link
              href={`/login?redirect=/join/${community.slug}?token=${token}`}
              style={{
                display: 'block', background: 'transparent',
                border: `1px solid ${bord}`, color: muted,
                fontFamily: `'${theme.font}', sans-serif`,
                padding: '12px', borderRadius: '8px', textDecoration: 'none',
                textTransform: 'uppercase', fontSize: '0.82rem',
                transition: 'border-color 0.15s',
              }}
            >
              J'ai déjà un compte
            </Link>

            <Link href={`/c/${community.slug}`} style={{ color: muted, fontSize: '0.8rem', marginTop: '4px' }}>
              Voir la vitrine sans rejoindre →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
