'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Option { id: string; label: string }
interface BetEntry { id: string; profile_id: string; chosen_option_id: string; points_wagered: number }
interface Bet { id: string; title: string; options: Option[]; status: 'open' | 'closed' | 'resolved'; result_option_id: string | null; closes_at: string | null; created_at: string; bet_entries: BetEntry[] }

export function BetsPublicClient({ community, bets: initialBets, userId, memberPoints: initialPoints, isMember }: {
  community: any; bets: Bet[]; userId: string | null; memberPoints: number; isMember: boolean
}) {
  const supabase = createClient()
  const theme = community.theme_json as { primaryColor: string; accentColor: string; font: string; darkMode: boolean }
  const bg    = theme.darkMode ? '#0a0a0a' : '#f5f5f5'
  const panel = theme.darkMode ? '#141414' : '#ffffff'
  const text  = theme.darkMode ? '#e0e0e0' : '#1a1a1a'
  const muted = theme.darkMode ? '#666'    : '#999'
  const bord  = theme.darkMode ? '#222'    : '#e0e0e0'

  const [bets, setBets]           = useState<Bet[]>(initialBets)
  const [myPoints, setMyPoints]   = useState(initialPoints)
  const [wagerInputs, setWagerInputs] = useState<Record<string, string>>({})
  const [selectedOpts, setSelectedOpts] = useState<Record<string, string>>({})
  const [loading, setLoading]     = useState<string | null>(null)
  const [toast, setToast]         = useState<string | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const getMyEntry = (bet: Bet) => bet.bet_entries.find(e => e.profile_id === userId)

  const placeBet = async (betId: string) => {
    const optionId = selectedOpts[betId]
    const wager = parseInt(wagerInputs[betId] ?? '0')
    if (!optionId) { showToast('Choisis une option'); return }
    if (!wager || wager <= 0) { showToast('Entre une mise valide'); return }
    if (wager > myPoints) { showToast('Pas assez de points'); return }

    setLoading(betId)
    const { error } = await supabase.from('bet_entries').insert({
      bet_id: betId, profile_id: userId, chosen_option_id: optionId, points_wagered: wager,
      community_id: community.id,
    })
    if (error) { showToast('Erreur lors de la mise'); setLoading(null); return }

    // Déduire les points
    await supabase.from('community_members')
      .update({ points: myPoints - wager })
      .eq('community_id', community.id).eq('profile_id', userId)
    setMyPoints(prev => prev - wager)

    setBets(prev => prev.map(b => b.id === betId
      ? { ...b, bet_entries: [...b.bet_entries, { id: `tmp_${Date.now()}`, profile_id: userId!, chosen_option_id: optionId, points_wagered: wager }] }
      : b
    ))
    setWagerInputs(prev => ({ ...prev, [betId]: '' }))
    setSelectedOpts(prev => ({ ...prev, [betId]: '' }))
    showToast(`✓ Mise de ${wager} points placée !`)
    setLoading(null)
  }

  const STATUS_CFG = {
    open:     { label: 'Ouvert',  color: '#4CAF50' },
    closed:   { label: 'Fermé',   color: '#FF9800' },
    resolved: { label: 'Résolu',  color: '#666'    },
  }

  const inputStyle: React.CSSProperties = {
    background: theme.darkMode ? '#0a0a0a' : '#f8f8f8',
    border: `1px solid ${bord}`, color: text,
    padding: '9px 14px', borderRadius: '6px',
    fontFamily: 'Rajdhani', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' as const,
  }

  return (
    <div style={{ background: bg, minHeight: '100vh', fontFamily: "'Rajdhani', sans-serif", color: text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Rajdhani:wght@400;600;700&family=Oswald:wght@600&family=Montserrat:wght@600&family=Inter:wght@500;600&display=swap');`}</style>

      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: panel, border: `1px solid ${theme.primaryColor}`, color: theme.primaryColor, padding: '12px 20px', borderRadius: '8px', fontFamily: `'${theme.font}', sans-serif`, fontSize: '0.82rem' }}>
          {toast}
        </div>
      )}

      <header style={{ background: theme.darkMode ? '#0d0d0d' : '#fff', borderBottom: `2px solid ${theme.primaryColor}`, padding: '15px 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <a href={`/c/${community.slug}`} style={{ color: muted, textDecoration: 'none', fontSize: '1.2rem' }}>←</a>
          {community.logo_url && <img src={community.logo_url} alt="" style={{ width: '34px', height: '34px', borderRadius: '6px', objectFit: 'cover' }} />}
          <h1 style={{ margin: 0, fontFamily: `'${theme.font}', sans-serif`, fontSize: '1rem', color: theme.darkMode ? 'white' : '#111', textTransform: 'uppercase', letterSpacing: '2px' }}>
            {community.name} — Paris
          </h1>
        </div>
        {isMember && (
          <span style={{ fontFamily: `'${theme.font}', sans-serif`, fontSize: '0.85rem', color: theme.primaryColor, border: `1px solid ${theme.primaryColor}33`, padding: '6px 14px', borderRadius: '6px' }}>
            {myPoints} pts
          </span>
        )}
      </header>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>

        {!userId && (
          <div style={{ background: `${theme.primaryColor}10`, border: `1px solid ${theme.primaryColor}33`, borderRadius: '10px', padding: '14px 18px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.88rem', color: muted }}>Connecte-toi pour parier</span>
            <a href={`/login?redirect=/c/${community.slug}/bets`} style={{ background: theme.primaryColor, color: '#000', fontFamily: `'${theme.font}', sans-serif`, fontWeight: 'bold', padding: '7px 16px', borderRadius: '4px', textDecoration: 'none', fontSize: '0.78rem', textTransform: 'uppercase' }}>
              Connexion
            </a>
          </div>
        )}

        {bets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: muted }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎲</div>
            <p style={{ fontFamily: `'${theme.font}', sans-serif`, textTransform: 'uppercase', fontSize: '0.88rem' }}>Aucun pari pour le moment</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {bets.map(bet => {
              const st = STATUS_CFG[bet.status]
              const myEntry = getMyEntry(bet)
              const totalPot = bet.bet_entries.reduce((s, e) => s + e.points_wagered, 0)
              const isLoading = loading === bet.id
              const winnerOpt = bet.result_option_id ? bet.options.find(o => o.id === bet.result_option_id) : null

              return (
                <div key={bet.id} style={{ background: panel, border: `1px solid ${bord}`, borderTop: `3px solid ${st.color}`, borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ padding: '20px 22px', borderBottom: `1px solid ${bord}` }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                      <h3 style={{ margin: 0, fontFamily: `'${theme.font}', sans-serif`, fontSize: '1.05rem', color: text, textTransform: 'uppercase', letterSpacing: '1px' }}>{bet.title}</h3>
                      <span style={{ flexShrink: 0, fontSize: '0.65rem', padding: '2px 8px', borderRadius: '3px', border: `1px solid ${st.color}`, color: st.color, textTransform: 'uppercase' }}>{st.label}</span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: muted }}>
                      {bet.bet_entries.length} mise{bet.bet_entries.length > 1 ? 's' : ''} · {totalPot} pts en jeu
                      {bet.closes_at && ` · Clôture ${new Date(bet.closes_at).toLocaleDateString('fr-FR')}`}
                    </div>
                    {winnerOpt && (
                      <div style={{ marginTop: '10px', background: 'rgba(76,175,80,0.1)', border: '1px solid #4CAF5044', borderRadius: '6px', padding: '8px 14px', fontSize: '0.88rem', color: '#4CAF50' }}>
                        🏆 Résultat : <strong>{winnerOpt.label}</strong>
                      </div>
                    )}
                  </div>

                  <div style={{ padding: '16px 22px' }}>
                    {/* Options */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                      {bet.options.map(opt => {
                        const count = bet.bet_entries.filter(e => e.chosen_option_id === opt.id).length
                        const pts = bet.bet_entries.filter(e => e.chosen_option_id === opt.id).reduce((s, e) => s + e.points_wagered, 0)
                        const pct = totalPot > 0 ? Math.round((pts / totalPot) * 100) : 0
                        const isWinner = bet.result_option_id === opt.id
                        const isSelected = selectedOpts[bet.id] === opt.id
                        const isMyChoice = myEntry?.chosen_option_id === opt.id

                        return (
                          <div key={opt.id}>
                            <button
                              onClick={() => bet.status === 'open' && !myEntry && setSelectedOpts(prev => ({ ...prev, [bet.id]: isSelected ? '' : opt.id }))}
                              disabled={bet.status !== 'open' || !!myEntry}
                              style={{
                                width: '100%', background: isWinner ? 'rgba(76,175,80,0.08)' : isSelected ? `${theme.primaryColor}12` : theme.darkMode ? '#1a1a1a' : '#f8f8f8',
                                border: `1px solid ${isWinner ? '#4CAF50' : isSelected || isMyChoice ? theme.primaryColor : bord}`,
                                borderRadius: '8px', padding: '12px 14px', cursor: bet.status === 'open' && !myEntry ? 'pointer' : 'default',
                                display: 'flex', alignItems: 'center', gap: '12px',
                                transition: 'all 0.15s', textAlign: 'left' as const,
                              }}
                            >
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.95rem', color: isWinner ? '#4CAF50' : isMyChoice ? theme.primaryColor : text, fontWeight: 600 }}>
                                  {opt.label}
                                  {isMyChoice && <span style={{ fontSize: '0.72rem', color: theme.primaryColor, marginLeft: '8px' }}>· Ma mise: {myEntry?.points_wagered} pts</span>}
                                  {isWinner && <span style={{ fontSize: '0.72rem', marginLeft: '8px' }}>✓ Gagnant</span>}
                                </div>
                                <div style={{ marginTop: '4px', height: '4px', borderRadius: '2px', background: theme.darkMode ? '#2a2a2a' : '#e0e0e0', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', borderRadius: '2px', background: isWinner ? '#4CAF50' : theme.primaryColor, width: `${pct}%`, transition: 'width 0.3s' }} />
                                </div>
                              </div>
                              <span style={{ fontSize: '0.78rem', color: muted, flexShrink: 0 }}>{pct}% ({count})</span>
                            </button>
                          </div>
                        )
                      })}
                    </div>

                    {/* Zone de mise */}
                    {bet.status === 'open' && isMember && !myEntry && (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="number"
                          min={1}
                          max={myPoints}
                          value={wagerInputs[bet.id] ?? ''}
                          onChange={e => setWagerInputs(prev => ({ ...prev, [bet.id]: e.target.value }))}
                          placeholder={`Mise (max ${myPoints} pts)`}
                          style={{ ...inputStyle, flex: 1 }}
                        />
                        <button
                          onClick={() => placeBet(bet.id)}
                          disabled={isLoading || !selectedOpts[bet.id]}
                          style={{
                            background: theme.primaryColor, color: '#000', border: 'none',
                            padding: '9px 18px', borderRadius: '6px', cursor: isLoading || !selectedOpts[bet.id] ? 'not-allowed' : 'pointer',
                            fontFamily: `'${theme.font}', sans-serif`, fontWeight: 'bold', fontSize: '0.82rem',
                            textTransform: 'uppercase', whiteSpace: 'nowrap' as const, opacity: !selectedOpts[bet.id] ? 0.5 : 1,
                          }}
                        >
                          {isLoading ? '...' : 'Parier'}
                        </button>
                      </div>
                    )}
                    {bet.status === 'open' && isMember && myEntry && (
                      <p style={{ fontSize: '0.82rem', color: muted, textAlign: 'center', margin: 0 }}>Tu as déjà misé {myEntry.points_wagered} pts sur "{bet.options.find(o => o.id === myEntry.chosen_option_id)?.label}"</p>
                    )}
                    {bet.status === 'closed' && !bet.result_option_id && (
                      <p style={{ fontSize: '0.82rem', color: '#FF9800', textAlign: 'center', margin: 0 }}>Les mises sont fermées — le résultat sera annoncé prochainement</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
