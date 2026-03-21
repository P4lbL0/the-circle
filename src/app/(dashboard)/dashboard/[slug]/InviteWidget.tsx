'use client'

import { useState } from 'react'

interface InviteWidgetProps {
  slug: string
  communityName: string
  inviteToken: string
}

export function InviteWidget({ slug, communityName, inviteToken }: InviteWidgetProps) {
  const [copied, setCopied] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const getUrl = () =>
    typeof window !== 'undefined'
      ? `${window.location.origin}/join/${slug}?token=${inviteToken}`
      : `/join/${slug}?token=${inviteToken}`

  const message = `Rejoins ${communityName} sur The Circle ! 🔥`

  const copy = async () => {
    await navigator.clipboard.writeText(getUrl())
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const shareNative = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: message, url: getUrl() })
    } else {
      copy()
    }
  }

  const url = getUrl()
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(message + ' ' + url)}`
  const telegramHref = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(message)}`

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 rounded-lg bg-yellow-400 text-black text-sm font-bold hover:bg-yellow-300 transition"
      >
        🔗 Inviter des membres
      </button>

      {showModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: '#141414', border: '1px solid #2a2a2a',
              borderRadius: '20px', padding: '32px', maxWidth: '480px', width: '100%',
              fontFamily: "'Rajdhani', sans-serif",
            }}
            onClick={e => e.stopPropagation()}
          >
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Rajdhani:wght@400;600;700&display=swap');`}</style>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontFamily: 'Orbitron', fontSize: '0.9rem', color: '#FFC107', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 6px' }}>
                  Inviter des membres
                </h2>
                <p style={{ color: '#666', fontSize: '0.85rem', margin: 0 }}>
                  Partage ce lien — les gens rejoignent en un clic
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#555', borderRadius: '6px', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                ✕
              </button>
            </div>

            {/* Link display */}
            <div style={{ background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <span style={{ flex: 1, fontSize: '0.8rem', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                {`/join/${slug}?token=${inviteToken.slice(0, 8)}…`}
              </span>
              <button
                onClick={copy}
                style={{
                  background: copied ? 'rgba(76,175,80,0.15)' : '#1a1a1a',
                  border: `1px solid ${copied ? '#4CAF50' : '#3a3a3a'}`,
                  color: copied ? '#4CAF50' : '#aaa',
                  padding: '6px 14px', borderRadius: '6px', cursor: 'pointer',
                  fontSize: '0.78rem', fontFamily: 'Rajdhani', fontWeight: 700,
                  whiteSpace: 'nowrap', transition: 'all 0.2s', flexShrink: 0,
                }}
              >
                {copied ? '✓ Copié !' : '📋 Copier'}
              </button>
            </div>

            {/* Share buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              {/* Native share (works on mobile for any app: Snap, WhatsApp...) */}
              <button
                onClick={shareNative}
                style={{
                  background: 'linear-gradient(135deg, #FFC107, #FF9800)',
                  color: '#000', border: 'none',
                  padding: '13px 16px', borderRadius: '10px', cursor: 'pointer',
                  fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '0.9rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  gridColumn: '1 / -1',
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>📲</span>
                Partager (Snap, Insta, SMS, …)
              </button>

              {/* WhatsApp */}
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: '#075E54', color: '#fff',
                  padding: '12px 16px', borderRadius: '10px',
                  fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '0.88rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  textDecoration: 'none',
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>💬</span>
                WhatsApp
              </a>

              {/* Telegram */}
              <a
                href={telegramHref}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: '#229ED9', color: '#fff',
                  padding: '12px 16px', borderRadius: '10px',
                  fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '0.88rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  textDecoration: 'none',
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>✈️</span>
                Telegram
              </a>
            </div>

            <p style={{ color: '#444', fontSize: '0.75rem', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
              Le bouton "Partager" ouvre le menu natif de ton téléphone (Snapchat, Instagram, SMS…).<br />
              Sur desktop, il copie le lien automatiquement.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
