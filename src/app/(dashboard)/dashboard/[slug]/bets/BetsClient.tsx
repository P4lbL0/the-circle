'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Option { id: string; label: string }
interface BetEntry { id: string; profile_id: string; chosen_option_id: string; points_wagered: number }

interface Bet {
  id:               string
  title:            string
  options:          Option[]
  status:           'open' | 'closed' | 'resolved'
  result_option_id: string | null
  closes_at:        string | null
  created_at:       string
  bet_entries:      BetEntry[]
}

const EMPTY_FORM = { title: '', options: ['', ''], close_at: '' }

export function BetsClient({ community, initialBets }: { community: any; initialBets: Bet[] }) {
  const supabase = createClient()
  const [bets, setBets]       = useState<Bet[]>(initialBets)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]       = useState(EMPTY_FORM)
  const [saving, setSaving]   = useState(false)
  const [toast, setToast]     = useState<string | null>(null)
  const [selected, setSelected] = useState<Bet | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  const S = {
    input: (): React.CSSProperties => ({
      background: '#0a0a0a', border: '1px solid #2a2a2a', color: '#e0e0e0',
      padding: '9px 14px', borderRadius: '6px', fontFamily: 'Rajdhani',
      fontSize: '0.95rem', outline: 'none', width: '100%', boxSizing: 'border-box' as const,
    }),
    btn: (active?: boolean): React.CSSProperties => ({
      background: active ? '#FFC107' : '#1a1a1a',
      color: active ? '#000' : '#888',
      border: `1px solid ${active ? '#FFC107' : '#2a2a2a'}`,
      padding: '8px 18px', borderRadius: '6px', cursor: 'pointer',
      fontFamily: 'Orbitron', fontSize: '0.72rem', textTransform: 'uppercase' as const,
      letterSpacing: '1px', transition: 'all 0.15s',
    }),
  }

  const createBet = async () => {
    if (!form.title.trim() || form.options.filter(o => o.trim()).length < 2) {
      showToast('Titre et au moins 2 options requis'); return
    }
    setSaving(true)
    const options: Option[] = form.options.filter(o => o.trim()).map((o, i) => ({ id: `opt_${i}`, label: o.trim() }))
    const { data, error } = await supabase
      .from('bets')
      .insert({
        community_id: community.id,
        creator_id:   (await supabase.auth.getUser()).data.user?.id,
        title:        form.title.trim(),
        options:      options,
        status:       'open',
        closes_at:    form.close_at ? new Date(form.close_at).toISOString() : null,
      })
      .select('*, bet_entries(id, profile_id, chosen_option_id, points_wagered)')
      .single()
    if (!error && data) {
      setBets(prev => [{ ...data, bet_entries: [] }, ...prev])
      setShowForm(false)
      setForm(EMPTY_FORM)
      showToast('Pari créé !')
    } else { showToast('Erreur lors de la création') }
    setSaving(false)
  }

  const updateBetStatus = async (id: string, status: 'open' | 'closed' | 'resolved', result?: string) => {
    const { error } = await supabase.from('bets').update({ status, result_option_id: result ?? null }).eq('id', id)
    if (!error) {
      setBets(prev => prev.map(b => b.id === id ? { ...b, status, result_option_id: result ?? null } : b))
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status, result_option_id: result ?? null } : null)

      // Si résolu → redistribuer les points
      if (status === 'resolved' && result) {
        const bet = bets.find(b => b.id === id)
        if (bet) await redistributePoints(bet, result)
      }
      showToast(status === 'resolved' ? 'Pari résolu !' : status === 'closed' ? 'Pari fermé' : 'Pari rouvert')
    }
  }

  const redistributePoints = async (bet: Bet, winningOption: string) => {
    const winners = bet.bet_entries.filter(e => e.chosen_option_id === winningOption)
    const totalPot = bet.bet_entries.reduce((sum, e) => sum + e.points_wagered, 0)
    const winnersPot = winners.reduce((sum, e) => sum + e.points_wagered, 0)
    if (winnersPot === 0 || winners.length === 0) return

    // Chaque gagnant reçoit proportionnellement au pot total
    for (const winner of winners) {
      const gain = Math.floor((winner.points_wagered / winnersPot) * totalPot)
      const { error: rpcErr } = await supabase.rpc('add_member_points', {
        p_community_id: community.id,
        p_profile_id:   winner.profile_id,
        p_points:       gain,
      })
      if (rpcErr) {
        // Fallback si la fonction RPC n'existe pas
        const { data } = await supabase.from('community_members')
          .select('points').eq('community_id', community.id).eq('profile_id', winner.profile_id).single()
        if (data) {
          await supabase.from('community_members')
            .update({ points: (data.points ?? 0) + gain })
            .eq('community_id', community.id).eq('profile_id', winner.profile_id)
        }
      }
    }
  }

  const deleteBet = async (id: string) => {
    if (!confirm('Supprimer ce pari ?')) return
    const { error } = await supabase.from('bets').delete().eq('id', id)
    if (!error) {
      setBets(prev => prev.filter(b => b.id !== id))
      if (selected?.id === id) setSelected(null)
      showToast('Pari supprimé')
    }
  }

  const STATUS_CFG = {
    open:     { label: 'Ouvert',  color: '#4CAF50', bg: 'rgba(76,175,80,0.12)'  },
    closed:   { label: 'Fermé',   color: '#FF9800', bg: 'rgba(255,152,0,0.12)'  },
    resolved: { label: 'Résolu',  color: '#666',    bg: 'rgba(100,100,100,0.1)' },
  }

  const getBetStats = (bet: Bet) => {
    const totalPot = bet.bet_entries.reduce((sum, e) => sum + e.points_wagered, 0)
    const countByOption: Record<string, number> = {}
    const pointsByOption: Record<string, number> = {}
    for (const e of bet.bet_entries) {
      countByOption[e.chosen_option_id] = (countByOption[e.chosen_option_id] ?? 0) + 1
      pointsByOption[e.chosen_option_id] = (pointsByOption[e.chosen_option_id] ?? 0) + e.points_wagered
    }
    return { totalPot, countByOption, pointsByOption }
  }

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', fontFamily: "'Rajdhani', sans-serif", color: '#e0e0e0' }}>
      <style>{`
        .bets-header { padding: 14px 30px !important; }
        .bets-header-title { font-size: 0.9rem !important; }
        .bets-grid { max-width: 1100px; margin: 0 auto; padding: 30px; display: grid; grid-template-columns: 1fr; gap: 24px; }
        .bets-grid.has-panel { grid-template-columns: 1fr 400px; }
        .bets-panel { position: sticky; top: 80px; max-height: calc(100vh - 100px); overflow-y: auto; height: fit-content; }
        .bets-back-btn { display: none; }
        @media (max-width: 900px) {
          .bets-grid.has-panel { grid-template-columns: 1fr !important; }
          .bets-panel { position: static !important; max-height: none !important; }
          .bets-back-btn { display: flex !important; align-items: center; gap: 8px; background: transparent; border: 1px solid #2a2a2a; color: #888; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-family: Rajdhani; font-size: 0.85rem; margin-bottom: 16px; }
        }
        @media (max-width: 640px) {
          .bets-header { padding: 12px 16px !important; }
          .bets-header-title { font-size: 0.75rem !important; letter-spacing: 1px !important; }
          .bets-grid { padding: 16px !important; }
        }
      `}</style>

      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: '#1a1a1a', border: '1px solid #4CAF50', color: '#4CAF50', padding: '12px 20px', borderRadius: '8px', fontFamily: 'Orbitron', fontSize: '0.8rem' }}>
          ✓ {toast}
        </div>
      )}

      <div className="bets-header" style={{ background: '#0d0d0d', borderBottom: '2px solid #FFC107', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="bets-header-title" style={{ fontFamily: 'Orbitron', color: 'white', textTransform: 'uppercase', letterSpacing: '2px' }}>Paris internes</span>
          <span style={{ background: '#1a1a1a', color: '#FFC107', border: '1px solid #333', padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontFamily: 'Orbitron' }}>
            {bets.filter(b => b.status === 'open').length} ouvert{bets.filter(b => b.status === 'open').length > 1 ? 's' : ''}
          </span>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={S.btn(showForm)}>+ Créer un pari</button>
      </div>

      <div className={`bets-grid${selected ? ' has-panel' : ''}`}>
        <div>
          {/* Formulaire */}
          {showForm && (
            <div style={{ background: '#141414', border: '1px solid #FFC107', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 0 30px rgba(255,193,7,0.06)' }}>
              <h3 style={{ fontFamily: 'Orbitron', fontSize: '0.82rem', color: '#FFC107', textTransform: 'uppercase', margin: '0 0 18px' }}>Nouveau pari</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Titre du pari *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Qui finira premier ce mois-ci ?" style={S.input()} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Options (min 2)</label>
                  {form.options.map((opt, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                      <input value={opt} onChange={e => setForm(f => ({ ...f, options: f.options.map((o, j) => j === i ? e.target.value : o) }))} placeholder={`Option ${i + 1}...`} style={S.input()} />
                      {form.options.length > 2 && (
                        <button onClick={() => setForm(f => ({ ...f, options: f.options.filter((_, j) => j !== i) }))} style={{ ...S.btn(), padding: '8px 12px' }}>✕</button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => setForm(f => ({ ...f, options: [...f.options, ''] }))} style={{ ...S.btn(), marginTop: '4px', fontSize: '0.68rem', padding: '6px 12px' }}>+ Option</button>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Date de clôture (optionnel)</label>
                  <input type="datetime-local" value={form.close_at} onChange={e => setForm(f => ({ ...f, close_at: e.target.value }))} style={{ ...S.input(), colorScheme: 'dark' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid #1a1a1a' }}>
                  <button onClick={() => setShowForm(false)} style={S.btn()}>Annuler</button>
                  <button onClick={createBet} disabled={saving} style={{ ...S.btn(true), opacity: saving ? 0.6 : 1 }}>
                    {saving ? 'Création...' : 'Créer'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {bets.length === 0 && !showForm && (
            <div style={{ textAlign: 'center', padding: '80px 40px', border: '1px dashed #222', borderRadius: '12px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎲</div>
              <h3 style={{ fontFamily: 'Orbitron', color: '#444', fontSize: '0.9rem', textTransform: 'uppercase', margin: '0 0 10px' }}>Aucun pari</h3>
              <button onClick={() => setShowForm(true)} style={S.btn(true)}>+ Créer un pari</button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {bets.map(bet => {
              const st = STATUS_CFG[bet.status]
              const stats = getBetStats(bet)
              const isSelected = selected?.id === bet.id
              return (
                <div key={bet.id} onClick={() => setSelected(isSelected ? null : bet)}
                  style={{ background: isSelected ? '#1a1a0d' : '#141414', border: `1px solid ${isSelected ? '#FFC107' : '#222'}`, borderLeft: `3px solid ${st.color}`, borderRadius: '10px', padding: '18px 20px', cursor: 'pointer', transition: 'all 0.15s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <span style={{ fontFamily: 'Orbitron', fontSize: '0.85rem', color: 'white' }}>{bet.title}</span>
                        <span style={{ fontSize: '0.62rem', padding: '2px 8px', borderRadius: '3px', border: `1px solid ${st.color}`, color: st.color, background: st.bg, textTransform: 'uppercase' as const }}>{st.label}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {bet.options.map((opt) => (
                          <span key={opt.id} style={{
                            fontSize: '0.78rem', padding: '3px 10px', borderRadius: '4px',
                            background: bet.result_option_id === opt.id ? 'rgba(76,175,80,0.15)' : '#1a1a1a',
                            border: `1px solid ${bet.result_option_id === opt.id ? '#4CAF50' : '#2a2a2a'}`,
                            color: bet.result_option_id === opt.id ? '#4CAF50' : '#888',
                          }}>
                            {opt.label}
                            {stats.countByOption[opt.id] ? ` (${stats.countByOption[opt.id]} mise${stats.countByOption[opt.id] > 1 ? 's' : ''}, ${stats.pointsByOption[opt.id]} pts)` : ''}
                            {bet.result_option_id === opt.id ? ' ✓' : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                      <div style={{ fontFamily: 'Orbitron', fontSize: '1rem', color: '#FFC107' }}>{stats.totalPot}</div>
                      <div style={{ fontSize: '0.7rem', color: '#555' }}>points en jeu</div>
                      <div style={{ fontSize: '0.7rem', color: '#444', marginTop: '2px' }}>{bet.bet_entries.length} mise{bet.bet_entries.length > 1 ? 's' : ''}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Panneau détail */}
        {selected && (
          <div className="bets-panel" style={{ background: '#111', border: '1px solid #FFC107', borderRadius: '12px', padding: '24px' }}>
            <button className="bets-back-btn" onClick={() => setSelected(null)}>← Retour aux paris</button>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'Orbitron', fontSize: '0.82rem', color: '#FFC107', margin: 0, textTransform: 'uppercase' }}>{selected.title}</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', color: '#444', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
            </div>

            {/* Contrôles statut */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.68rem', color: '#444', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px' }}>Contrôle</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {selected.status === 'open' && (
                  <button onClick={() => updateBetStatus(selected.id, 'closed')} style={{ ...S.btn(), borderColor: '#FF9800', color: '#FF9800', fontSize: '0.68rem' }}>
                    🔒 Fermer les mises
                  </button>
                )}
                {selected.status === 'closed' && (
                  <button onClick={() => updateBetStatus(selected.id, 'open')} style={{ ...S.btn(), borderColor: '#4CAF50', color: '#4CAF50', fontSize: '0.68rem' }}>
                    🔓 Réouvrir
                  </button>
                )}
                <button onClick={() => deleteBet(selected.id)} style={{ ...S.btn(), borderColor: '#FF2344', color: '#FF2344', fontSize: '0.68rem' }}>
                  🗑 Supprimer
                </button>
              </div>
            </div>

            {/* Résolution */}
            {selected.status !== 'open' && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '0.68rem', color: '#444', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #1a1a1a' }}>
                  Désigner le gagnant
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selected.options.map(opt => {
                    const stats = getBetStats(selected)
                    return (
                      <button key={opt.id}
                        onClick={() => selected.status !== 'resolved' && updateBetStatus(selected.id, 'resolved', opt.id)}
                        disabled={selected.status === 'resolved'}
                        style={{
                          background: selected.result_option_id === opt.id ? 'rgba(76,175,80,0.15)' : '#1a1a1a',
                          border: `1px solid ${selected.result_option_id === opt.id ? '#4CAF50' : '#2a2a2a'}`,
                          color: selected.result_option_id === opt.id ? '#4CAF50' : '#888',
                          padding: '10px 14px', borderRadius: '8px', cursor: selected.status === 'resolved' ? 'default' : 'pointer',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          fontFamily: 'Rajdhani', fontSize: '0.95rem', transition: 'all 0.15s',
                        }}
                      >
                        <span>{opt.label} {selected.result_option_id === opt.id ? '✓ Gagnant' : ''}</span>
                        <span style={{ fontSize: '0.78rem', color: '#555' }}>
                          {stats.countByOption[opt.id] ?? 0} mise{(stats.countByOption[opt.id] ?? 0) > 1 ? 's' : ''} · {stats.pointsByOption[opt.id] ?? 0} pts
                        </span>
                      </button>
                    )
                  })}
                </div>
                {selected.status !== 'resolved' && (
                  <p style={{ fontSize: '0.72rem', color: '#444', margin: '8px 0 0' }}>Clique sur l'option gagnante pour redistribuer les points.</p>
                )}
              </div>
            )}

            {/* Mises */}
            <div>
              <div style={{ fontSize: '0.68rem', color: '#444', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #1a1a1a' }}>
                Mises ({selected.bet_entries.length})
              </div>
              {selected.bet_entries.length === 0 ? (
                <p style={{ color: '#333', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>Aucune mise pour l'instant</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selected.bet_entries.map(e => {
                    const opt = selected.options.find(o => o.id === e.chosen_option_id)
                    return (
                      <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#1a1a1a', borderRadius: '6px', border: '1px solid #2a2a2a' }}>
                        <span style={{ fontSize: '0.8rem', color: '#888' }}>{opt?.label ?? e.chosen_option_id}</span>
                        <span style={{ fontFamily: 'Orbitron', fontSize: '0.8rem', color: '#FFC107' }}>{e.points_wagered} pts</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
