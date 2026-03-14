'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Participant {
  id: string; name: string; score: number | null; rank: number | null; profile_id: string | null
}
interface Tournament {
  id: string; name: string; type: 'bracket' | 'round_robin' | 'double_elimination'
  status: 'upcoming' | 'active' | 'completed'; config: any; created_at: string
  tournament_participants: Participant[]
}

const EMPTY_FORM = { name: '', type: 'bracket' as Tournament['type'], description: '', start_date: '', end_date: '' }
const TYPE_LABELS = {
  bracket:            '🏆 Élimination directe',
  double_elimination: '⚔️ Double élimination',
  round_robin:        '🔄 Round Robin',
}
const STATUS_CFG = {
  upcoming:  { label: 'À venir',  color: '#2196F3', bg: 'rgba(33,150,243,0.12)'  },
  active:    { label: 'En cours', color: '#4CAF50', bg: 'rgba(76,175,80,0.12)'   },
  completed: { label: 'Terminé',  color: '#666',    bg: 'rgba(100,100,100,0.1)'  },
}

export function TournamentsClient({ community, initialTournaments }: {
  community: any; initialTournaments: Tournament[]
}) {
  const supabase = createClient()
  const [tournaments, setTournaments]       = useState<Tournament[]>(initialTournaments)
  const [showForm, setShowForm]             = useState(false)
  const [form, setForm]                     = useState(EMPTY_FORM)
  const [saving, setSaving]                 = useState(false)
  const [toast, setToast]                   = useState<string | null>(null)
  const [selected, setSelected]             = useState<Tournament | null>(null)
  const [newParticipant, setNewParticipant] = useState('')
  const [addingP, setAddingP]               = useState(false)
  const [editingScore, setEditingScore]     = useState<{ id: string; score: string } | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  const handleCreate = async () => {
    if (!form.name.trim()) { showToast('Nom requis'); return }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('tournaments')
      .insert({ community_id: community.id, created_by: user?.id, name: form.name.trim(), type: form.type, status: 'upcoming', config: { description: form.description, start_date: form.start_date, end_date: form.end_date } })
      .select('*, tournament_participants(id, name, score, rank, profile_id)').single()
    if (error) { showToast('Erreur lors de la création') }
    else if (data) { setTournaments(prev => [{ ...data, tournament_participants: [] }, ...prev]); setShowForm(false); setForm(EMPTY_FORM); showToast('Tournoi créé !') }
    setSaving(false)
  }

  const updateStatus = async (id: string, status: Tournament['status']) => {
    const { error } = await supabase.from('tournaments').update({ status }).eq('id', id)
    if (!error) { setTournaments(prev => prev.map(t => t.id === id ? { ...t, status } : t)); if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null); showToast('Statut mis à jour') }
  }

  const deleteTournament = async (id: string) => {
    if (!confirm('Supprimer ce tournoi ?')) return
    const { error } = await supabase.from('tournaments').delete().eq('id', id)
    if (!error) { setTournaments(prev => prev.filter(t => t.id !== id)); if (selected?.id === id) setSelected(null); showToast('Tournoi supprimé') }
  }

  const addParticipant = async () => {
    if (!selected || !newParticipant.trim()) return
    setAddingP(true)
    const { data, error } = await supabase.from('tournament_participants')
      .insert({ tournament_id: selected.id, name: newParticipant.trim(), score: 0, rank: null, profile_id: null })
      .select('id, name, score, rank, profile_id').single()
    if (!error && data) {
      const updated = { ...selected, tournament_participants: [...selected.tournament_participants, data] }
      setSelected(updated); setTournaments(prev => prev.map(t => t.id === selected.id ? updated : t)); setNewParticipant(''); showToast('Participant ajouté')
    }
    setAddingP(false)
  }

  const removeParticipant = async (participantId: string) => {
    if (!selected) return
    const { error } = await supabase.from('tournament_participants').delete().eq('id', participantId)
    if (!error) {
      const updated = { ...selected, tournament_participants: selected.tournament_participants.filter(p => p.id !== participantId) }
      setSelected(updated); setTournaments(prev => prev.map(t => t.id === selected.id ? updated : t))
    }
  }

  const saveScore = async (participantId: string, score: string) => {
    if (!selected) return
    const scoreNum = parseFloat(score); if (isNaN(scoreNum)) return
    const { error } = await supabase.from('tournament_participants').update({ score: scoreNum }).eq('id', participantId)
    if (!error) {
      const updated = {
        ...selected,
        tournament_participants: selected.tournament_participants
          .map(p => p.id === participantId ? { ...p, score: scoreNum } : p)
          .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
          .map((p, i) => ({ ...p, rank: i + 1 })),
      }
      setSelected(updated); setTournaments(prev => prev.map(t => t.id === selected.id ? updated : t))
    }
    setEditingScore(null)
  }

  const S = {
    btn: (active?: boolean): React.CSSProperties => ({
      background: active ? '#FFC107' : '#1a1a1a', color: active ? '#000' : '#888',
      border: `1px solid ${active ? '#FFC107' : '#2a2a2a'}`,
      padding: '8px 18px', borderRadius: '6px', cursor: 'pointer',
      fontFamily: 'Orbitron', fontSize: '0.72rem', textTransform: 'uppercase' as const, letterSpacing: '1px', transition: 'all 0.15s',
    }),
    input: (): React.CSSProperties => ({
      background: '#0a0a0a', border: '1px solid #2a2a2a', color: '#e0e0e0',
      padding: '9px 14px', borderRadius: '6px', fontFamily: 'Rajdhani',
      fontSize: '0.95rem', outline: 'none', width: '100%', boxSizing: 'border-box' as const,
    }),
  }

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', fontFamily: "'Rajdhani', sans-serif", color: '#e0e0e0' }}>
      <style>{`
        .tnm-grid { display: grid; grid-template-columns: 1fr; gap: 24px; max-width: 1100px; margin: 0 auto; padding: 30px; }
        .tnm-grid.has-panel { grid-template-columns: 1fr 420px; }
        .tnm-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .tnm-panel { background: #111; border: 1px solid #FFC107; border-radius: 12px; padding: 24px; position: sticky; top: 80px; max-height: calc(100vh - 100px); overflow-y: auto; height: fit-content; }
        .tnm-back-btn { display: none; align-items: center; gap: 6px; background: transparent; border: 1px solid #2a2a2a; color: #888; cursor: pointer; font-family: Rajdhani; font-size: 0.9rem; margin-bottom: 16px; padding: 7px 12px; border-radius: 6px; width: 100%; }
        .tnm-header { background: #0d0d0d; border-bottom: 2px solid #FFC107; padding: 14px 30px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; }
        .tnm-type-btns { display: flex; gap: 8px; }
        @media (max-width: 900px) {
          .tnm-grid.has-panel { grid-template-columns: 1fr !important; }
          .tnm-panel { position: static !important; max-height: none !important; }
          .tnm-back-btn { display: flex !important; }
        }
        @media (max-width: 640px) {
          .tnm-grid { padding: 16px !important; }
          .tnm-form-grid { grid-template-columns: 1fr !important; }
          .tnm-header { padding: 12px 16px !important; }
          .tnm-type-btns { flex-direction: column !important; }
        }
      `}</style>

      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: '#1a1a1a', border: '1px solid #4CAF50', color: '#4CAF50', padding: '12px 20px', borderRadius: '8px', fontFamily: 'Orbitron', fontSize: '0.8rem' }}>
          ✓ {toast}
        </div>
      )}

      <div className="tnm-header">
        <span style={{ fontFamily: 'Orbitron', fontSize: '0.9rem', color: 'white', textTransform: 'uppercase', letterSpacing: '2px' }}>Tournois</span>
        <button onClick={() => setShowForm(!showForm)} style={S.btn(showForm)}>+ Nouveau</button>
      </div>

      <div className={`tnm-grid${selected ? ' has-panel' : ''}`}>
        <div>
          {showForm && (
            <div style={{ background: '#141414', border: '1px solid #FFC107', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
              <h3 style={{ fontFamily: 'Orbitron', fontSize: '0.82rem', color: '#FFC107', textTransform: 'uppercase', margin: '0 0 18px' }}>Nouveau tournoi</h3>
              <div className="tnm-form-grid">
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Nom *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Tournoi Printemps 2026" style={S.input()} />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Format</label>
                  <div className="tnm-type-btns">
                    {(Object.entries(TYPE_LABELS) as [Tournament['type'], string][]).map(([key, label]) => (
                      <button key={key} onClick={() => setForm(f => ({ ...f, type: key }))} style={{ ...S.btn(form.type === key), flex: 1, fontSize: '0.7rem', padding: '8px 6px' }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Date de début</label>
                  <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} style={{ ...S.input(), colorScheme: 'dark' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Date de fin</label>
                  <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} style={{ ...S.input(), colorScheme: 'dark' }} />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} style={{ ...S.input(), resize: 'none' as const }} />
                </div>
                <div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid #1a1a1a' }}>
                  <button onClick={() => setShowForm(false)} style={S.btn()}>Annuler</button>
                  <button onClick={handleCreate} disabled={saving} style={{ ...S.btn(true), opacity: saving ? 0.6 : 1 }}>{saving ? 'Création...' : 'Créer'}</button>
                </div>
              </div>
            </div>
          )}

          {tournaments.length === 0 && !showForm && (
            <div style={{ textAlign: 'center', padding: '80px 40px', border: '1px dashed #222', borderRadius: '12px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏆</div>
              <h3 style={{ fontFamily: 'Orbitron', color: '#444', fontSize: '0.9rem', textTransform: 'uppercase', margin: '0 0 10px' }}>Aucun tournoi</h3>
              <p style={{ color: '#333', fontSize: '0.88rem', margin: '0 0 20px' }}>Crée ton premier tournoi pour animer ta communauté.</p>
              <button onClick={() => setShowForm(true)} style={S.btn(true)}>+ Créer un tournoi</button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {tournaments.map(t => {
              const st = STATUS_CFG[t.status]; const isSelected = selected?.id === t.id
              return (
                <div key={t.id} onClick={() => setSelected(isSelected ? null : t)} style={{
                  background: isSelected ? '#1a1a0d' : '#141414',
                  border: `1px solid ${isSelected ? '#FFC107' : '#222'}`,
                  borderLeft: `3px solid ${isSelected ? '#FFC107' : st.color}`,
                  borderRadius: '10px', padding: '16px 18px', cursor: 'pointer', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: '12px',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'Orbitron', fontSize: '0.85rem', color: 'white', textTransform: 'uppercase' }}>{t.name}</span>
                      <span style={{ fontSize: '0.62rem', padding: '2px 8px', borderRadius: '3px', border: `1px solid ${st.color}`, color: st.color, background: st.bg, textTransform: 'uppercase' as const, flexShrink: 0 }}>{st.label}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#555', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <span>{TYPE_LABELS[t.type]}</span>
                      <span>· {t.tournament_participants?.length ?? 0} participants</span>
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); deleteTournament(t.id) }}
                    style={{ background: 'transparent', border: '1px solid #2a2a2a', color: '#555', width: '30px', height: '30px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', flexShrink: 0 }}
                    onMouseEnter={e => { (e.currentTarget).style.borderColor = '#FF2344'; (e.currentTarget).style.color = '#FF2344' }}
                    onMouseLeave={e => { (e.currentTarget).style.borderColor = '#2a2a2a'; (e.currentTarget).style.color = '#555' }}>✕</button>
                </div>
              )
            })}
          </div>
        </div>

        {selected && (
          <div className="tnm-panel">
            <button className="tnm-back-btn" onClick={() => setSelected(null)}>← Retour aux tournois</button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontFamily: 'Orbitron', fontSize: '0.85rem', color: '#FFC107', margin: '0 0 4px', textTransform: 'uppercase' }}>{selected.name}</h3>
                <span style={{ fontSize: '0.75rem', color: '#555' }}>{TYPE_LABELS[selected.type]}</span>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', color: '#444', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.68rem', color: '#444', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px' }}>Statut</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {(['upcoming', 'active', 'completed'] as Tournament['status'][]).map(s => (
                  <button key={s} onClick={() => updateStatus(selected.id, s)} style={{
                    ...S.btn(selected.status === s), fontSize: '0.65rem', padding: '6px 10px',
                    background: selected.status === s ? STATUS_CFG[s].bg : 'transparent',
                    borderColor: selected.status === s ? STATUS_CFG[s].color : '#2a2a2a',
                    color: selected.status === s ? STATUS_CFG[s].color : '#555',
                  }}>{STATUS_CFG[s].label}</button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.68rem', color: '#444', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #1a1a1a' }}>
                Participants ({selected.tournament_participants?.length ?? 0})
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <input value={newParticipant} onChange={e => setNewParticipant(e.target.value)} onKeyDown={e => e.key === 'Enter' && addParticipant()} placeholder="Nom du participant..." style={{ ...S.input(), flex: 1, padding: '7px 12px', fontSize: '0.9rem' }} />
                <button onClick={addParticipant} disabled={addingP} style={{ ...S.btn(true), padding: '7px 14px', whiteSpace: 'nowrap' as const }}>+ Ajouter</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[...selected.tournament_participants].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).map((p, idx) => (
                  <div key={p.id} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontFamily: 'Orbitron', fontSize: '0.72rem', color: idx === 0 ? '#FFC107' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : '#444', minWidth: '22px', flexShrink: 0 }}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                    </span>
                    <span style={{ flex: 1, fontSize: '0.9rem', color: '#ccc', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                    {editingScore?.id === p.id ? (
                      <input autoFocus value={editingScore.score}
                        onChange={e => setEditingScore({ ...editingScore, score: e.target.value })}
                        onBlur={() => saveScore(p.id, editingScore.score)}
                        onKeyDown={e => e.key === 'Enter' && saveScore(p.id, editingScore.score)}
                        style={{ ...S.input(), width: '70px', padding: '4px 8px', textAlign: 'center', fontFamily: 'Orbitron', fontSize: '0.85rem' }} />
                    ) : (
                      <span onClick={() => setEditingScore({ id: p.id, score: String(p.score ?? 0) })}
                        style={{ fontFamily: 'Orbitron', fontSize: '0.85rem', color: '#FFC107', cursor: 'pointer', minWidth: '40px', textAlign: 'right', flexShrink: 0 }}>
                        {p.score ?? 0}
                      </span>
                    )}
                    <button onClick={() => removeParticipant(p.id)} style={{ background: 'transparent', border: 'none', color: '#333', cursor: 'pointer', fontSize: '0.8rem', padding: '2px 6px', flexShrink: 0 }}
                      onMouseEnter={e => (e.currentTarget).style.color = '#FF2344'}
                      onMouseLeave={e => (e.currentTarget).style.color = '#333'}>✕</button>
                  </div>
                ))}
              </div>
              {selected.tournament_participants?.length > 0 && (
                <p style={{ fontSize: '0.72rem', color: '#444', margin: '10px 0 0', textAlign: 'center' }}>Clique sur un score pour le modifier — classement auto-recalculé</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
