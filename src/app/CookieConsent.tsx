'use client'

import { useState, useEffect } from 'react'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

const STORAGE_KEY = 'tc_cookie_consent'

export function CookieConsent() {
  const [consent, setConsent] = useState<'accepted' | 'refused' | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'accepted' || stored === 'refused') {
      setConsent(stored)
    } else {
      // Petit délai pour ne pas apparaître immédiatement
      const t = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(t)
    }
  }, [])

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted')
    setConsent('accepted')
    setVisible(false)
  }

  const refuse = () => {
    localStorage.setItem(STORAGE_KEY, 'refused')
    setConsent('refused')
    setVisible(false)
  }

  return (
    <>
      {/* Analytics chargés seulement si consentement donné */}
      {consent === 'accepted' && (
        <>
          <Analytics />
          <SpeedInsights />
        </>
      )}

      {/* Bandeau cookies */}
      {visible && (
        <>
          <style>{`
            @keyframes tc-cookie-slide {
              from { transform: translateY(100%); opacity: 0; }
              to   { transform: translateY(0);    opacity: 1; }
            }
            .tc-cookie-banner {
              position: fixed;
              bottom: 24px;
              left: 0; right: 0;
              width: calc(100% - 48px); max-width: 540px;
              margin: 0 auto;
              background: #141414;
              border: 1px solid #2a2a2a;
              border-radius: 14px;
              padding: 20px 22px;
              z-index: 9999;
              animation: tc-cookie-slide 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
              box-shadow: 0 8px 40px rgba(0,0,0,0.6);
            }
            .tc-cookie-title {
              font-size: 0.88rem;
              font-weight: 600;
              color: #e0e0e0;
              margin-bottom: 6px;
            }
            .tc-cookie-text {
              font-size: 0.8rem;
              color: #555;
              line-height: 1.55;
              margin-bottom: 16px;
            }
            .tc-cookie-text a {
              color: #FFC107;
              text-decoration: none;
            }
            .tc-cookie-actions {
              display: flex;
              gap: 10px;
            }
            .tc-cookie-accept {
              flex: 1;
              background: #FFC107;
              color: #0a0a0a;
              border: none;
              border-radius: 8px;
              padding: 9px 16px;
              font-size: 0.82rem;
              font-weight: 700;
              cursor: pointer;
              transition: background 0.15s;
            }
            .tc-cookie-accept:hover { background: #e6ac00; }
            .tc-cookie-refuse {
              flex: 1;
              background: transparent;
              color: #555;
              border: 1px solid #2a2a2a;
              border-radius: 8px;
              padding: 9px 16px;
              font-size: 0.82rem;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.15s;
            }
            .tc-cookie-refuse:hover { border-color: #444; color: #888; }
          `}</style>

          <div className="tc-cookie-banner" role="dialog" aria-label="Consentement aux cookies">
            <div className="tc-cookie-title">🍪 Cookies & mesures d'audience</div>
            <p className="tc-cookie-text">
              The Circle utilise des cookies analytiques (Vercel Analytics, Speed Insights) pour améliorer le service.
              Aucune donnée n'est vendue à des tiers.{' '}
              <a href="/privacy">En savoir plus</a>
            </p>
            <div className="tc-cookie-actions">
              <button className="tc-cookie-accept" onClick={accept}>Accepter</button>
              <button className="tc-cookie-refuse" onClick={refuse}>Refuser</button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
