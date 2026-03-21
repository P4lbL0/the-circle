'use client'

import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import { DashboardBell } from './DashboardBell'

interface Community {
  id: string
  name: string
  slug: string
  logo_url: string | null
  subscription_tier: string
}

const NAV_ITEMS = [
  { href: '/members',      icon: '👥', label: 'Membres'      },
  { href: '/modules',      icon: '🧩', label: 'Modules'      },
  { href: '/stats',        icon: '📊', label: 'Stats'        },
  { href: '/applications', icon: '📋', label: 'Candidatures' },
  { href: '/events',       icon: '📅', label: 'Événements'   },
  { href: '/tournaments',  icon: '🏆', label: 'Tournois'     },
  { href: '/chat',         icon: '💬', label: 'Chat'         },
  { href: '/shop',         icon: '🛒', label: 'Boutique'     },
  { href: '/appearance',   icon: '🎨', label: 'Apparence'    },
  { href: '/settings',     icon: '⚙️',  label: 'Paramètres'  },
]

// Items affichés dans la bottom nav mobile (les plus utilisés)
const BOTTOM_NAV = [
  { href: '/members',     icon: '👥', label: 'Membres'    },
  { href: '/events',      icon: '📅', label: 'Événements' },
  { href: '/tournaments', icon: '🏆', label: 'Tournois'   },
  { href: '/modules',     icon: '🧩', label: 'Modules'    },
]

export function DashboardSidebar({ community }: {
  community: Community
}) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => { setMobileOpen(false) }, [pathname])
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const base = `/dashboard/${community.slug}`
  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login') }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;600;700&display=swap');

        /* ── Sidebar Desktop ── */
        .tc-sidebar {
          position: fixed; top: 0; left: 0;
          width: 240px; height: 100vh;
          background: #0d0d0d;
          border-right: 1px solid #1a1a1a;
          display: flex; flex-direction: column;
          z-index: 200;
          font-family: 'Rajdhani', sans-serif;
          transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* ── Bell : visible uniquement dans la sidebar desktop ── */
        .tc-desktop-bell { display: flex; }
        /* ── Mobile topbar ── */
        .tc-mobile-bar {
          display: none;
          position: fixed; top: 0; left: 0; right: 0; height: 52px;
          background: #0d0d0d; border-bottom: 1px solid #1a1a1a;
          align-items: center; padding: 0 10px;
          z-index: 198; gap: 8px;
          overflow: hidden;
        }
        .tc-hamburger {
          display: none;
          background: #1a1a1a; border: 1px solid #2a2a2a;
          border-radius: 8px; width: 36px; height: 36px;
          align-items: center; justify-content: center;
          cursor: pointer; color: #FFC107; font-size: 1.05rem;
          flex-shrink: 0;
        }
        .tc-mobile-bar-title {
          font-family: 'Orbitron', sans-serif; font-size: 0.68rem;
          color: white; text-transform: uppercase; letter-spacing: 1.5px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;
        }

        /* ── Bottom nav mobile ── */
        .tc-bottom-nav {
          display: none;
          position: fixed; bottom: 0; left: 0; right: 0; height: 60px;
          background: #0d0d0d; border-top: 1px solid #1a1a1a;
          z-index: 198;
          padding: 0 4px;
        }
        .tc-bottom-nav-inner {
          display: flex; height: 100%; align-items: stretch;
        }
        .tc-bottom-nav-item {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 3px;
          text-decoration: none; color: #555;
          font-family: 'Rajdhani', sans-serif; font-size: 0.65rem; font-weight: 600;
          transition: color 0.15s; border: none; background: transparent;
          cursor: pointer; padding: 0;
          position: relative;
        }
        .tc-bottom-nav-item.active {
          color: #FFC107;
        }
        .tc-bottom-nav-item.active::before {
          content: '';
          position: absolute; top: 0; left: 20%; right: 20%; height: 2px;
          background: #FFC107; border-radius: 0 0 2px 2px;
        }
        .tc-bottom-nav-item span:first-child {
          font-size: 1.15rem;
          line-height: 1;
        }
        .tc-bottom-nav-more {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 3px;
          color: #555; background: transparent; border: none;
          font-family: 'Rajdhani', sans-serif; font-size: 0.65rem; font-weight: 600;
          cursor: pointer; transition: color 0.15s;
        }
        .tc-bottom-nav-more:active { color: #aaa; }

        /* ── Backdrop ── */
        .tc-backdrop {
          display: none; position: fixed; inset: 0;
          background: rgba(0,0,0,0.8); z-index: 199;
          backdrop-filter: blur(3px);
        }
        .tc-close-btn {
          display: none;
          position: absolute; top: 14px; right: 14px;
          background: #1a1a1a; border: 1px solid #2a2a2a;
          border-radius: 6px; width: 30px; height: 30px;
          align-items: center; justify-content: center;
          cursor: pointer; color: #555; font-size: 0.9rem;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .tc-sidebar {
            transform: translateX(-100%);
            width: 270px;
            z-index: 201;
          }
          .tc-sidebar.tc-open {
            transform: translateX(0);
            box-shadow: 8px 0 40px rgba(0,0,0,0.9);
          }
          .tc-mobile-bar  { display: flex; }
          .tc-hamburger   { display: flex; }
          .tc-backdrop.tc-visible { display: block; }
          .tc-close-btn   { display: flex; }
          .tc-bottom-nav  { display: block; }
          /* Masque la cloche dans le drawer mobile (déjà dans la topbar) */
          .tc-desktop-bell { display: none !important; }
        }
      `}</style>

      {/* Mobile top bar */}
      <div className="tc-mobile-bar">
        <button className="tc-hamburger" onClick={() => setMobileOpen(true)} aria-label="Menu">
          ☰
        </button>
        <span className="tc-mobile-bar-title">{community.name}</span>
        <DashboardBell communityId={community.id} />
      </div>

      {/* Backdrop */}
      <div className={`tc-backdrop${mobileOpen ? ' tc-visible' : ''}`} onClick={() => setMobileOpen(false)} />

      {/* Sidebar */}
      <aside className={`tc-sidebar${mobileOpen ? ' tc-open' : ''}`}>

        <button className="tc-close-btn" onClick={() => setMobileOpen(false)}>✕</button>

        {/* Logo + nom */}
        <div style={{ padding: '20px 18px', paddingTop: '24px', borderBottom: '1px solid #1a1a1a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '8px',
              background: '#1a1a1a', border: '1px solid #FFC107',
              overflow: 'hidden', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Orbitron', fontSize: '1rem', color: '#FFC107',
            }}>
              {community.logo_url
                ? <img src={community.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : community.name[0]?.toUpperCase()
              }
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: 'Orbitron', fontSize: '0.78rem', color: 'white', textTransform: 'uppercase', letterSpacing: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {community.name}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#FFC107', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>
                {community.subscription_tier}
              </div>
            </div>
            <span className="tc-desktop-bell">
              <DashboardBell communityId={community.id} />
            </span>
          </div>

          <a href={`/c/${community.slug}`} target="_blank" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '7px 12px', color: '#666', fontSize: '0.78rem', textDecoration: 'none', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#FFC107'; e.currentTarget.style.color = '#FFC107' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#666' }}>
            <span style={{ fontSize: '0.8rem' }}>🌐</span>
            <span>Voir la vitrine</span>
            <span style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>↗</span>
          </a>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          <div style={{ fontSize: '0.65rem', color: '#333', textTransform: 'uppercase', letterSpacing: '2px', padding: '4px 8px 10px', fontFamily: 'Orbitron' }}>
            Dashboard
          </div>
          {NAV_ITEMS.map(item => {
            const href     = `${base}${item.href}`
            const isActive = pathname.startsWith(href)
            return (
              <a key={item.href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 12px', borderRadius: '8px', marginBottom: '2px',
                background: isActive ? 'rgba(255,193,7,0.1)' : 'transparent',
                borderLeft: isActive ? '3px solid #FFC107' : '3px solid transparent',
                color: isActive ? '#FFC107' : '#666',
                textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, transition: 'all 0.15s',
              }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#aaa' } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#666' } }}
              >
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.icon}</span>
                <span>{item.label}</span>
              </a>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: '14px 10px', borderTop: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <a href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '8px', color: '#444', textDecoration: 'none', fontSize: '0.88rem', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#888' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#444' }}>
            <span>🏠</span><span>Mes communautés</span>
          </a>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '8px', background: 'transparent', border: 'none', color: '#444', cursor: 'pointer', fontSize: '0.88rem', width: '100%', textAlign: 'left', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#FF2344'; e.currentTarget.style.background = 'rgba(255,35,68,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#444'; e.currentTarget.style.background = 'transparent' }}>
            <span>🚪</span><span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Bottom nav mobile */}
      <nav className="tc-bottom-nav">
        <div className="tc-bottom-nav-inner">
          {BOTTOM_NAV.map(item => {
            const href     = `${base}${item.href}`
            const isActive = pathname.startsWith(href)
            return (
              <a key={item.href} href={href} className={`tc-bottom-nav-item${isActive ? ' active' : ''}`}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </a>
            )
          })}
          <button className="tc-bottom-nav-more" onClick={() => setMobileOpen(true)}>
            <span style={{ fontSize: '1.15rem', lineHeight: 1 }}>☰</span>
            <span>Plus</span>
          </button>
        </div>
      </nav>
    </>
  )
}
