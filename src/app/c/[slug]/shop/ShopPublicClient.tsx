'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ShopItem {
  id:           string
  name:         string
  description:  string | null
  price_points: number
  type:         string
  stock:        number | null
  image_url:    string | null
}

const TYPE_LABEL: Record<string, string> = {
  badge:     'Badge',
  cosmetic:  'Cosmétique',
  physical:  'Physique',
}

const TYPE_COLOR: Record<string, string> = {
  badge:    '#9C27B0',
  cosmetic: '#2196F3',
  physical: '#FF9800',
}

export function ShopPublicClient({ community, items, userId, memberPoints, isMember }: {
  community:    any
  items:        ShopItem[]
  userId:       string | null
  memberPoints: number
  isMember:     boolean
}) {
  const supabase = createClient()
  const theme = community.theme_json as { primaryColor: string; accentColor: string; font: string; darkMode: boolean }
  const bg    = theme.darkMode ? '#0a0a0a' : '#f5f5f5'
  const panel = theme.darkMode ? '#141414' : '#ffffff'
  const text  = theme.darkMode ? '#e0e0e0' : '#1a1a1a'
  const muted = theme.darkMode ? '#666'    : '#999'
  const bord  = theme.darkMode ? '#222'    : '#e0e0e0'

  const [points, setPoints]   = useState(memberPoints)
  const [buying, setBuying]   = useState<string | null>(null)
  const [toast, setToast]     = useState<{ msg: string; ok: boolean } | null>(null)
  const [bought, setBought]   = useState<string[]>([])

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const buyItem = async (item: ShopItem) => {
    if (!userId || !isMember) return
    if (points < item.price_points) { showToast('Points insuffisants', false); return }
    if (item.stock !== null && item.stock <= 0) { showToast('Rupture de stock', false); return }

    setBuying(item.id)

    // Déduire les points
    const { error: pointsErr } = await supabase
      .from('community_members')
      .update({ points: points - item.price_points })
      .eq('community_id', community.id)
      .eq('profile_id', userId)

    if (pointsErr) { showToast('Erreur lors de l\'achat', false); setBuying(null); return }

    // Créer la commande
    const { error: orderErr } = await supabase
      .from('shop_orders')
      .insert({
        community_id: community.id,
        item_id:      item.id,
        profile_id:   userId,
        status:       item.type === 'physical' ? 'pending' : 'fulfilled',
        points_spent: item.price_points,
      })

    if (orderErr) {
      // Rembourser si création échoue
      await supabase.from('community_members').update({ points: points }).eq('community_id', community.id).eq('profile_id', userId)
      showToast('Erreur lors de la commande', false)
      setBuying(null)
      return
    }

    setPoints(prev => prev - item.price_points)
    setBought(prev => [...prev, item.id])
    showToast(item.type === 'physical' ? 'Commande enregistrée ! 📦' : `${item.name} obtenu !`, true)
    setBuying(null)
  }

  return (
    <div style={{ background: bg, minHeight: '100vh', fontFamily: `'Rajdhani', sans-serif`, color: text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Rajdhani:wght@400;600;700&family=Oswald:wght@600&family=Montserrat:wght@600&family=Inter:wght@500;600&display=swap');`}</style>

      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: panel, border: `1px solid ${toast.ok ? theme.primaryColor : '#FF2344'}`, color: toast.ok ? theme.primaryColor : '#FF2344', padding: '12px 20px', borderRadius: '8px', fontFamily: `'${theme.font}', sans-serif`, fontSize: '0.82rem' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header style={{ background: theme.darkMode ? '#0d0d0d' : '#fff', borderBottom: `2px solid ${theme.primaryColor}`, padding: '15px 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a href={`/c/${community.slug}`} style={{ color: muted, textDecoration: 'none', fontSize: '1.2rem' }}>←</a>
          {community.logo_url && <img src={community.logo_url} alt="" style={{ width: '34px', height: '34px', borderRadius: '6px', objectFit: 'cover' }} />}
          <h1 style={{ margin: 0, fontFamily: `'${theme.font}', sans-serif`, fontSize: '0.95rem', color: theme.darkMode ? 'white' : '#111', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Boutique
          </h1>
        </div>
        {isMember && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: `${theme.primaryColor}12`, border: `1px solid ${theme.primaryColor}33`, borderRadius: '8px', padding: '8px 16px' }}>
            <span style={{ color: theme.primaryColor, fontFamily: `'${theme.font}', sans-serif`, fontWeight: 700, fontSize: '1.1rem' }}>{points.toLocaleString()}</span>
            <span style={{ color: muted, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>pts</span>
          </div>
        )}
      </header>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>

        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 40px', color: muted }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🛒</div>
            <p style={{ fontFamily: `'${theme.font}', sans-serif`, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.9rem' }}>La boutique est vide</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {items.map(item => {
              const typeColor = TYPE_COLOR[item.type] ?? '#888'
              const outOfStock = item.stock !== null && item.stock <= 0
              const alreadyBought = bought.includes(item.id)
              const canAfford = points >= item.price_points
              const isLoading = buying === item.id

              return (
                <div key={item.id} style={{ background: panel, border: `1px solid ${bord}`, borderTop: `3px solid ${typeColor}`, borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '120px', background: `${typeColor}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                      {item.type === 'badge' ? '🏅' : item.type === 'cosmetic' ? '✨' : '📦'}
                    </div>
                  )}

                  <div style={{ padding: '18px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: `'${theme.font}', sans-serif`, fontSize: '1rem', color: text, fontWeight: 700, flex: 1 }}>{item.name}</span>
                      <span style={{ fontSize: '0.62rem', padding: '2px 6px', borderRadius: '3px', background: `${typeColor}18`, color: typeColor, border: `1px solid ${typeColor}44` }}>
                        {TYPE_LABEL[item.type] ?? item.type}
                      </span>
                    </div>

                    {item.description && (
                      <p style={{ margin: 0, fontSize: '0.88rem', color: muted, lineHeight: 1.5 }}>{item.description}</p>
                    )}

                    <div style={{ marginTop: 'auto', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ fontFamily: `'${theme.font}', sans-serif`, color: theme.primaryColor, fontSize: '1.3rem', fontWeight: 700 }}>
                          {item.price_points.toLocaleString()}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: muted, marginLeft: '4px' }}>pts</span>
                      </div>
                      {item.stock !== null && (
                        <span style={{ fontSize: '0.7rem', color: outOfStock ? '#FF2344' : muted }}>
                          {outOfStock ? 'Rupture' : `Stock: ${item.stock}`}
                        </span>
                      )}
                    </div>

                    {!userId ? (
                      <a href={`/login?redirect=/c/${community.slug}/shop`} style={{ display: 'block', textAlign: 'center', background: theme.primaryColor, color: '#000', fontFamily: `'${theme.font}', sans-serif`, fontWeight: 'bold', padding: '9px', borderRadius: '6px', textDecoration: 'none', fontSize: '0.82rem', textTransform: 'uppercase', marginTop: '4px' }}>
                        Connexion pour acheter
                      </a>
                    ) : !isMember ? (
                      <div style={{ textAlign: 'center', color: muted, fontSize: '0.8rem', padding: '8px', background: `${bord}40`, borderRadius: '6px', marginTop: '4px' }}>
                        Rejoins la communauté pour acheter
                      </div>
                    ) : (
                      <button
                        onClick={() => buyItem(item)}
                        disabled={isLoading || outOfStock || alreadyBought || !canAfford}
                        style={{
                          width: '100%', padding: '10px', borderRadius: '6px', border: 'none',
                          background: alreadyBought ? `${theme.primaryColor}22` : outOfStock ? '#1a1a1a' : !canAfford ? '#1a1a1a' : theme.primaryColor,
                          color: alreadyBought ? theme.primaryColor : outOfStock || !canAfford ? '#444' : '#000',
                          cursor: isLoading || outOfStock || alreadyBought || !canAfford ? 'not-allowed' : 'pointer',
                          fontFamily: `'${theme.font}', sans-serif`, fontWeight: 'bold',
                          fontSize: '0.82rem', textTransform: 'uppercase', marginTop: '4px',
                        }}
                      >
                        {isLoading ? 'Achat...' : alreadyBought ? '✓ Acheté' : outOfStock ? 'Rupture de stock' : !canAfford ? 'Points insuffisants' : 'Acheter'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!isMember && userId && (
          <div style={{ marginTop: '40px', background: `${theme.primaryColor}10`, border: `1px solid ${theme.primaryColor}33`, borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 14px', color: muted }}>Tu dois être membre de la communauté pour acheter des articles.</p>
            <a href={`/c/${community.slug}/apply`} style={{ background: theme.primaryColor, color: '#000', fontFamily: `'${theme.font}', sans-serif`, fontWeight: 'bold', padding: '10px 24px', borderRadius: '4px', textDecoration: 'none', fontSize: '0.82rem', textTransform: 'uppercase' }}>
              Rejoindre
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
