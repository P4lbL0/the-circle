'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getSoftLimit, canAccess } from '@/lib/plan-limits'

interface ShopItem {
  id:           string
  name:         string
  description:  string | null
  price_points: number
  type:         'badge' | 'cosmetic' | 'physical'
  stock:        number | null
  image_url:    string | null
  created_at:   string
}

interface Order {
  id:           string
  profile_id:   string
  item_id:      string
  status:       'pending' | 'fulfilled'
  created_at:   string
  shop_items?:  { name: string; type: string } | null
  profiles?:    { display_name: string; email: string } | null
}

const EMPTY_FORM = { name: '', description: '', price_points: '', type: 'badge' as ShopItem['type'], stock: '' }

const TYPE_LABELS: Record<ShopItem['type'], string> = {
  badge:    '🏅 Badge virtuel',
  cosmetic: '✨ Cosmétique',
  physical: '📦 Produit physique',
}

const ORDER_STATUS: Record<Order['status'], { label: string; color: string; bg: string }> = {
  pending:   { label: 'En attente', color: '#FF9800', bg: 'rgba(255,152,0,0.12)' },
  fulfilled: { label: 'Traité',     color: '#4CAF50', bg: 'rgba(76,175,80,0.12)' },
}

export function ShopClient({ community, initialItems, initialOrders }: {
  community: any; initialItems: ShopItem[]; initialOrders: Order[]
}) {
  const supabase = createClient()
  const [items, setItems]       = useState<ShopItem[]>(initialItems)
  const [orders, setOrders]     = useState<Order[]>(initialOrders)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<ShopItem | null>(null)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)
  const [tab, setTab]           = useState<'items' | 'orders'>('items')
  const [toast, setToast]       = useState<string | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  const S = {
    input: (): React.CSSProperties => ({
      background: '#0a0a0a', border: '1px solid #2a2a2a', color: '#e0e0e0',
      padding: '9px 14px', borderRadius: '6px', fontFamily: 'Rajdhani',
      fontSize: '0.95rem', outline: 'none', width: '100%', boxSizing: 'border-box' as const,
    }),
    btn: (active?: boolean): React.CSSProperties => ({
      background: active ? '#FFC107' : '#1a1a1a', color: active ? '#000' : '#888',
      border: `1px solid ${active ? '#FFC107' : '#2a2a2a'}`,
      padding: '8px 18px', borderRadius: '6px', cursor: 'pointer',
      fontFamily: 'Orbitron', fontSize: '0.72rem', textTransform: 'uppercase' as const,
      letterSpacing: '1px', transition: 'all 0.15s',
    }),
  }

  const openCreate = () => { setEditingItem(null); setForm(EMPTY_FORM); setShowForm(true) }
  const openEdit = (item: ShopItem) => {
    setEditingItem(item)
    setForm({ name: item.name, description: item.description ?? '', price_points: String(item.price_points), type: item.type, stock: item.stock != null ? String(item.stock) : '' })
    setShowForm(true)
  }

  const saveItem = async () => {
    if (!form.name.trim() || !form.price_points) { showToast('Nom et prix requis'); return }

    // Checks plan uniquement à la création
    if (!editingItem) {
      const limit = getSoftLimit(community.subscription_tier, 'shop_items')
      if (limit !== Infinity && items.length >= limit) {
        showToast(`Limite de ${limit} articles (plan Free) — passez au Starter`)
        return
      }
      if (form.type === 'physical' && !canAccess(community.subscription_tier, 'physical_shop')) {
        showToast('Les articles physiques nécessitent le plan Pro')
        return
      }
    }

    setSaving(true)
    const payload = {
      community_id: community.id,
      name: form.name.trim(),
      description: form.description || null,
      price_points: parseInt(form.price_points),
      type: form.type,
      stock: form.stock ? parseInt(form.stock) : null,
    }
    if (editingItem) {
      const { error } = await supabase.from('shop_items').update(payload).eq('id', editingItem.id)
      if (!error) {
        setItems(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...payload } : i))
        showToast('Article mis à jour')
      }
    } else {
      const { data, error } = await supabase.from('shop_items').insert(payload).select('*').single()
      if (!error && data) { setItems(prev => [data, ...prev]); showToast('Article créé !') }
    }
    setShowForm(false)
    setSaving(false)
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Supprimer cet article ?')) return
    const { error } = await supabase.from('shop_items').delete().eq('id', id)
    if (!error) { setItems(prev => prev.filter(i => i.id !== id)); showToast('Article supprimé') }
  }

  const fulfillOrder = async (id: string) => {
    const { error } = await supabase.from('shop_orders').update({ status: 'fulfilled' }).eq('id', id)
    if (!error) {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'fulfilled' } : o))
      showToast('Commande marquée comme traitée')
    }
  }

  const pendingOrders = orders.filter(o => o.status === 'pending').length

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', fontFamily: "'Rajdhani', sans-serif", color: '#e0e0e0' }}>
      <style>{`
        .shop-header { padding: 14px 30px !important; }
        .shop-content { max-width: 1000px; margin: 0 auto; padding: 30px; }
        .shop-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .shop-items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
        .shop-tabs { display: flex; gap: 4px; margin-bottom: 24px; background: #111; padding: 4px; border-radius: 10px; border: 1px solid #1a1a1a; width: fit-content; }
        .shop-order-row { display: flex; align-items: center; gap: 16px; }
        @media (max-width: 768px) {
          .shop-header { padding: 12px 16px !important; }
          .shop-header-title { font-size: 0.75rem !important; }
          .shop-content { padding: 16px !important; }
          .shop-form-grid { grid-template-columns: 1fr !important; }
          .shop-items-grid { grid-template-columns: 1fr !important; }
          .shop-tabs { width: 100% !important; }
          .shop-tabs button { flex: 1; font-size: 0.65rem !important; padding: 8px 8px !important; }
          .shop-order-row { flex-wrap: wrap; }
        }
      `}</style>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: '#1a1a1a', border: '1px solid #4CAF50', color: '#4CAF50', padding: '12px 20px', borderRadius: '8px', fontFamily: 'Orbitron', fontSize: '0.8rem' }}>
          ✓ {toast}
        </div>
      )}

      <div className="shop-header" style={{ background: '#0d0d0d', borderBottom: '2px solid #FFC107', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="shop-header-title" style={{ fontFamily: 'Orbitron', fontSize: '0.9rem', color: 'white', textTransform: 'uppercase', letterSpacing: '2px' }}>Boutique</span>
          {pendingOrders > 0 && (
            <span style={{ background: 'rgba(255,152,0,0.15)', color: '#FF9800', border: '1px solid #FF9800', padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontFamily: 'Orbitron' }}>
              {pendingOrders} commande{pendingOrders > 1 ? 's' : ''} à traiter
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <a href={`/c/${community.slug}/shop`} target="_blank" style={{ ...S.btn(), textDecoration: 'none', fontSize: '0.68rem', padding: '7px 14px' }}>Voir ↗</a>
          <button onClick={openCreate} style={S.btn(true)}>+ Article</button>
        </div>
      </div>

      <div className="shop-content">
        {/* Onglets */}
        <div className="shop-tabs">
          {([['items', `Articles (${items.length})`], ['orders', `Commandes (${orders.length})`]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              style={{ background: tab === key ? '#FFC107' : 'transparent', color: tab === key ? '#000' : '#666', border: 'none', padding: '8px 18px', borderRadius: '7px', cursor: 'pointer', fontFamily: 'Orbitron', fontSize: '0.72rem', textTransform: 'uppercase', transition: 'all 0.15s' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Formulaire */}
        {showForm && tab === 'items' && (
          <div style={{ background: '#141414', border: '1px solid #FFC107', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 0 30px rgba(255,193,7,0.06)' }}>
            <h3 style={{ fontFamily: 'Orbitron', fontSize: '0.82rem', color: '#FFC107', textTransform: 'uppercase', margin: '0 0 18px' }}>
              {editingItem ? 'Modifier l\'article' : 'Nouvel article'}
            </h3>
            <div className="shop-form-grid">
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Nom *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Badge Légendaire" style={S.input()} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} style={{ ...S.input(), resize: 'none' as const }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Prix (points) *</label>
                <input type="number" min={1} value={form.price_points} onChange={e => setForm(f => ({ ...f, price_points: e.target.value }))} placeholder="100" style={S.input()} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Stock (vide = illimité)</label>
                <input type="number" min={0} value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="Illimité" style={S.input()} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Type</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(Object.entries(TYPE_LABELS) as [ShopItem['type'], string][]).map(([key, label]) => (
                    <button key={key} onClick={() => setForm(f => ({ ...f, type: key }))}
                      style={{ ...S.btn(form.type === key), flex: 1, fontSize: '0.7rem', padding: '8px 6px' }}>
                      {label}
                    </button>
                  ))}
                </div>
                {form.type === 'physical' && (
                  <p style={{ fontSize: '0.75rem', color: '#FF9800', margin: '8px 0 0' }}>⚠️ Plan Pro requis pour les produits physiques.</p>
                )}
              </div>
              <div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid #1a1a1a' }}>
                <button onClick={() => setShowForm(false)} style={S.btn()}>Annuler</button>
                <button onClick={saveItem} disabled={saving} style={{ ...S.btn(true), opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Sauvegarde...' : editingItem ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Articles */}
        {tab === 'items' && (
          <>
            {items.length === 0 && !showForm ? (
              <div style={{ textAlign: 'center', padding: '80px 40px', border: '1px dashed #222', borderRadius: '12px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🛍️</div>
                <h3 style={{ fontFamily: 'Orbitron', color: '#444', fontSize: '0.9rem', textTransform: 'uppercase', margin: '0 0 10px' }}>Aucun article</h3>
                <button onClick={openCreate} style={S.btn(true)}>+ Créer un article</button>
              </div>
            ) : (
              <div className="shop-items-grid">
                {items.map(item => (
                  <div key={item.id} style={{ background: '#141414', border: '1px solid #222', borderRadius: '10px', padding: '18px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: item.type === 'badge' ? '#FFC107' : item.type === 'cosmetic' ? '#9C27B0' : '#2196F3' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#555' }}>{TYPE_LABELS[item.type]}</span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => openEdit(item)} style={{ background: 'transparent', border: '1px solid #2a2a2a', color: '#555', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}
                          onMouseEnter={e => { (e.currentTarget).style.borderColor = '#FFC107'; (e.currentTarget).style.color = '#FFC107' }}
                          onMouseLeave={e => { (e.currentTarget).style.borderColor = '#2a2a2a'; (e.currentTarget).style.color = '#555' }}>✏️</button>
                        <button onClick={() => deleteItem(item.id)} style={{ background: 'transparent', border: '1px solid #2a2a2a', color: '#555', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}
                          onMouseEnter={e => { (e.currentTarget).style.borderColor = '#FF2344'; (e.currentTarget).style.color = '#FF2344' }}
                          onMouseLeave={e => { (e.currentTarget).style.borderColor = '#2a2a2a'; (e.currentTarget).style.color = '#555' }}>✕</button>
                      </div>
                    </div>
                    <h3 style={{ fontFamily: 'Orbitron', fontSize: '0.85rem', color: 'white', textTransform: 'uppercase', margin: '0 0 6px' }}>{item.name}</h3>
                    {item.description && <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: '#666', lineHeight: 1.4 }}>{item.description}</p>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'Orbitron', fontSize: '1rem', color: '#FFC107' }}>{item.price_points} pts</span>
                      <span style={{ fontSize: '0.75rem', color: item.stock === 0 ? '#FF2344' : '#555' }}>
                        {item.stock == null ? '∞ illimité' : item.stock === 0 ? '⚠ Rupture' : `${item.stock} en stock`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Commandes */}
        {tab === 'orders' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#333', fontFamily: 'Orbitron', fontSize: '0.82rem' }}>Aucune commande</div>
            ) : (
              orders.map(order => {
                const st = ORDER_STATUS[order.status]
                return (
                  <div key={order.id} style={{ background: '#141414', border: '1px solid #222', borderRadius: '10px', padding: '16px 20px' }} className="shop-order-row">
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <span style={{ fontFamily: 'Orbitron', fontSize: '0.82rem', color: 'white' }}>{(order.shop_items as any)?.name ?? 'Article inconnu'}</span>
                        <span style={{ fontSize: '0.62rem', padding: '2px 8px', borderRadius: '3px', border: `1px solid ${st.color}`, color: st.color, background: st.bg, textTransform: 'uppercase' as const }}>{st.label}</span>
                        {(order.shop_items as any)?.type === 'physical' && (
                          <span style={{ fontSize: '0.62rem', padding: '2px 8px', borderRadius: '3px', border: '1px solid #2196F3', color: '#2196F3', textTransform: 'uppercase' as const }}>📦 Physique</span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#555' }}>
                        {(order.profiles as any)?.display_name ?? 'Membre'} · {(order.profiles as any)?.email}
                        {' · '}{new Date(order.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    {order.status === 'pending' && (
                      <button onClick={() => fulfillOrder(order.id)} style={{ background: 'rgba(76,175,80,0.15)', border: '1px solid #4CAF50', color: '#4CAF50', padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'Orbitron', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        ✓ Marquer traité
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
