'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Participant {
  id: string; name: string | null; score: number | null; rank: number | null; profile_id: string | null
}
interface Tournament {
  id: string; name: string
  type: 'single_elimination' | 'double_elimination' | 'round_robin'
  status: 'draft' | 'open' | 'ongoing' | 'completed' | 'cancelled'
  config: TournamentConfig | null
  created_at: string
  tournament_participants: Participant[]
}
interface TournamentConfig {
  template:          string
  format:            string
  registration:      'solo' | 'team'
  team_size:         number
  best_of:           number
  max_slots:         number | null
  third_place_match: boolean
  checkin:           { enabled: boolean; duration_minutes: number }
  seeding:           'random' | 'manual' | 'elo'
  prizes:            { '1st': string; '2nd': string; '3rd': string }
  game:              string | null
  platform:          string | null
  region:            string | null
  event_id?:         string | null
}

// ── Templates ─────────────────────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: 'custom', label: 'Personnalisé', icon: '⚙️', desc: 'Config libre',
    config: { template: 'custom', format: 'single_elim', registration: 'solo', team_size: 1, best_of: 1, max_slots: 16, third_place_match: false, checkin: { enabled: false, duration_minutes: 15 }, seeding: 'random', prizes: { '1st': '', '2nd': '', '3rd': '' }, game: null, platform: null, region: null },
  },
  {
    id: 'lol', label: 'League of Legends', icon: '⚔️', desc: '5v5 · BO5 · Élim. directe',
    config: { template: 'lol', format: 'single_elim', registration: 'team', team_size: 5, best_of: 5, max_slots: 16, third_place_match: true, checkin: { enabled: true, duration_minutes: 15 }, seeding: 'random', prizes: { '1st': '', '2nd': '', '3rd': '' }, game: 'League of Legends', platform: 'PC', region: 'EUW' },
  },
  {
    id: 'valorant', label: 'Valorant', icon: '🎯', desc: '5v5 · BO3 · Élim. directe',
    config: { template: 'valorant', format: 'single_elim', registration: 'team', team_size: 5, best_of: 3, max_slots: 16, third_place_match: false, checkin: { enabled: true, duration_minutes: 15 }, seeding: 'random', prizes: { '1st': '', '2nd': '', '3rd': '' }, game: 'Valorant', platform: 'PC', region: null },
  },
  {
    id: 'cs2', label: 'CS2', icon: '💣', desc: '5v5 · BO3 · Double élim.',
    config: { template: 'cs2', format: 'double_elim', registration: 'team', team_size: 5, best_of: 3, max_slots: 16, third_place_match: false, checkin: { enabled: true, duration_minutes: 15 }, seeding: 'random', prizes: { '1st': '', '2nd': '', '3rd': '' }, game: 'CS2', platform: 'PC', region: null },
  },
  {
    id: 'rocket_league', label: 'Rocket League', icon: '🚗', desc: '3v3 · BO5 · Élim. directe',
    config: { template: 'rocket_league', format: 'single_elim', registration: 'team', team_size: 3, best_of: 5, max_slots: 16, third_place_match: true, checkin: { enabled: true, duration_minutes: 15 }, seeding: 'random', prizes: { '1st': '', '2nd': '', '3rd': '' }, game: 'Rocket League', platform: 'PC', region: null },
  },
  {
    id: 'smash', label: 'Smash Bros', icon: '👊', desc: '1v1 · BO3 · Double élim.',
    config: { template: 'smash', format: 'double_elim', registration: 'solo', team_size: 1, best_of: 3, max_slots: 32, third_place_match: false, checkin: { enabled: true, duration_minutes: 15 }, seeding: 'random', prizes: { '1st': '', '2nd': '', '3rd': '' }, game: 'Super Smash Bros.', platform: null, region: null },
  },
  {
    id: 'football', label: 'Football', icon: '⚽', desc: '11v11 · Groupes + KO',
    config: { template: 'football', format: 'groups+knockout', registration: 'team', team_size: 11, best_of: 1, max_slots: 16, third_place_match: true, checkin: { enabled: false, duration_minutes: 15 }, seeding: 'manual', prizes: { '1st': '', '2nd': '', '3rd': '' }, game: 'Football', platform: null, region: null },
  },
  {
    id: 'fifa', label: 'FIFA / EA FC', icon: '🎮', desc: '1v1 · BO3 · Round Robin',
    config: { template: 'fifa', format: 'round_robin', registration: 'solo', team_size: 1, best_of: 3, max_slots: 16, third_place_match: false, checkin: { enabled: false, duration_minutes: 15 }, seeding: 'random', prizes: { '1st': '', '2nd': '', '3rd': '' }, game: 'EA FC', platform: null, region: null },
  },
] as const

// ── Labels ────────────────────────────────────────────────────────────────────
const FORMAT_LABELS: Record<string, string> = {
  single_elim:      '🏆 Élimination directe',
  double_elim:      '⚔️ Double élimination',
  round_robin:      '🔄 Round Robin',
  'groups+knockout':'🗂 Groupes + KO',
}
const STATUS_CFG: Record<Tournament['status'], { label: string; color: string; bg: string }> = {
  draft:     { label: 'Brouillon',    color: '#666',    bg: 'rgba(100,100,100,0.1)'  },
  open:      { label: 'Inscriptions', color: '#2196F3', bg: 'rgba(33,150,243,0.12)'  },
  ongoing:   { label: 'En cours',     color: '#4CAF50', bg: 'rgba(76,175,80,0.12)'   },
  completed: { label: 'Terminé',      color: '#9C27B0', bg: 'rgba(156,39,176,0.12)'  },
  cancelled: { label: 'Annulé',       color: '#FF2344', bg: 'rgba(255,35,68,0.12)'   },
}

// Mappe notre format → type DB
const formatToDbType = (format: string): Tournament['type'] => {
  if (format === 'double_elim') return 'double_elimination'
  if (format === 'round_robin' || format === 'groups+knockout') return 'round_robin'
  return 'single_elimination'
}

// ── État initial du formulaire ────────────────────────────────────────────────
const defaultConfig = (): TournamentConfig => ({ ...TEMPLATES[0].config as any })
const EMPTY_FORM = { name: '', description: '', start_date: '', end_date: '' }

// ── Styles partagés ───────────────────────────────────────────────────────────
const S = {
  btn: (active?: boolean): React.CSSProperties => ({
    background: active ? '#FFC107' : '#1a1a1a', color: active ? '#000' : '#888',
    border: `1px solid ${active ? '#FFC107' : '#2a2a2a'}`,
    padding: '8px 18px', borderRadius: '6px', cursor: 'pointer',
    fontFamily: 'Orbitron', fontSize: '0.72rem', textTransform: 'uppercase' as const,
    letterSpacing: '1px', transition: 'all 0.15s',
  }),
  input: (): React.CSSProperties => ({
    background: '#0a0a0a', border: '1px solid #2a2a2a', color: '#e0e0e0',
    padding: '9px 14px', borderRadius: '6px', fontFamily: 'Rajdhani',
    fontSize: '0.95rem', outline: 'none', width: '100%', boxSizing: 'border-box' as const,
  }),
  label: (): React.CSSProperties => ({
    display: 'block', fontSize: '0.72rem', color: '#555',
    textTransform: 'uppercase' as const, letterSpacing: '1px', marginBottom: '5px',
  }),
}

// ── Composant principal ───────────────────────────────────────────────────────
export function TournamentsClient({ community, initialTournaments }: {
  community: any; initialTournaments: Tournament[]
}) {
  const supabase = createClient()

  const [tournaments, setTournaments]       = useState<Tournament[]>(initialTournaments)
  const [showForm, setShowForm]             = useState(false)
  const [form, setForm]                     = useState(EMPTY_FORM)
  const [config, setConfig]                 = useState<TournamentConfig>(defaultConfig())
  const [selectedTemplate, setSelectedTemplate] = useState('custom')
  const [showAdvanced, setShowAdvanced]     = useState(false)
  const [saving, setSaving]                 = useState(false)
  const [toast, setToast]                   = useState<string | null>(null)
  const [selected, setSelected]             = useState<Tournament | null>(null)
  const [newParticipant, setNewParticipant] = useState('')
  const [addingP, setAddingP]               = useState(false)
  const [editingScore, setEditingScore]     = useState<{ id: string; score: string } | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  const applyTemplate = (templateId: string) => {
    const tpl = TEMPLATES.find(t => t.id === templateId)
    if (!tpl) return
    setSelectedTemplate(templateId)
    setConfig({ ...tpl.config as any })
  }

  const handleCreate = async () => {
    if (!form.name.trim()) { showToast('Nom requis'); return }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const dbType = formatToDbType(config.format)
    const { data, error } = await supabase.from('tournaments')
      .insert({
        community_id: community.id,
        created_by:   user?.id,
        name:         form.name.trim(),
        type:         dbType,
        status:       'draft',
        description:  form.description || null,
        start_at:     form.start_date ? new Date(form.start_date).toISOString() : null,
        end_at:       form.end_date   ? new Date(form.end_date).toISOString()   : null,
        config:       { ...config, description: form.description, start_date: form.start_date, end_date: form.end_date },
      })
      .select('*, tournament_participants(id, name, score, rank, profile_id)')
      .single()

    if (error) { showToast('Erreur lors de la création'); console.error(error) }
    else if (data) {
      setTournaments(prev => [{ ...data, tournament_participants: [] }, ...prev])
      setShowForm(false)
      setForm(EMPTY_FORM)
      setConfig(defaultConfig())
      setSelectedTemplate('custom')
      setShowAdvanced(false)
      showToast('Tournoi créé !')
    }
    setSaving(false)
  }

  const updateStatus = async (id: string, status: Tournament['status']) => {
    const { error } = await supabase.from('tournaments').update({ status }).eq('id', id)
    if (!error) {
      setTournaments(prev => prev.map(t => t.id === id ? { ...t, status } : t))
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null)
      showToast('Statut mis à jour')
    }
  }

  const deleteTournament = async (id: string) => {
    if (!confirm('Supprimer ce tournoi ?')) return
    const { error } = await supabase.from('tournaments').delete().eq('id', id)
    if (!error) {
      setTournaments(prev => prev.filter(t => t.id !== id))
      if (selected?.id === id) setSelected(null)
      showToast('Tournoi supprimé')
    }
  }

  const addParticipant = async () => {
    if (!selected || !newParticipant.trim()) return
    setAddingP(true)
    const { data, error } = await supabase.from('tournament_participants')
      .insert({ tournament_id: selected.id, name: newParticipant.trim(), score: 0, rank: null, profile_id: null })
      .select('id, name, score, rank, profile_id').single()
    if (!error && data) {
      const updated = { ...selected, tournament_participants: [...selected.tournament_participants, data] }
      setSelected(updated)
      setTournaments(prev => prev.map(t => t.id === selected.id ? updated : t))
      setNewParticipant('')
      showToast('Participant ajouté')
    }
    setAddingP(false)
  }

  const removeParticipant = async (participantId: string) => {
    if (!selected) return
    const { error } = await supabase.from('tournament_participants').delete().eq('id', participantId)
    if (!error) {
      const updated = { ...selected, tournament_participants: selected.tournament_participants.filter(p => p.id !== participantId) }
      setSelected(updated)
      setTournaments(prev => prev.map(t => t.id === selected.id ? updated : t))
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
      setSelected(updated)
      setTournaments(prev => prev.map(t => t.id === selected.id ? updated : t))
    }
    setEditingScore(null)
  }

  const cfgLabel = (t: Tournament) => {
    const c = t.config as TournamentConfig | null
    if (!c) return FORMAT_LABELS[t.type] ?? t.type
    const parts: string[] = []
    if (c.registration === 'team' && c.team_size > 1) parts.push(`${c.team_size}v${c.team_size}`)
    parts.push(FORMAT_LABELS[c.format] ?? c.format)
    if (c.best_of > 1) parts.push(`BO${c.best_of}`)
    return parts.join(' · ')
  }

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', fontFamily: "'Rajdhani', sans-serif", color: '#e0e0e0' }}>
      <style>{`
        .tnm-grid { display: grid; grid-template-columns: 1fr; gap: 24px; max-width: 1100px; margin: 0 auto; padding: 30px; }
        .tnm-grid.has-panel { grid-template-columns: 1fr 400px; }
        .tnm-panel { background: #111; border: 1px solid #FFC107; border-radius: 12px; padding: 24px; position: sticky; top: 56px; max-height: calc(100vh - 76px); overflow-y: auto; height: fit-content; }
        .tnm-back-btn { display: none; align-items: center; gap: 6px; background: transparent; border: 1px solid #2a2a2a; color: #888; cursor: pointer; font-family: Rajdhani; font-size: 0.9rem; margin-bottom: 16px; padding: 7px 12px; border-radius: 6px; width: 100%; }
        .tnm-header { background: #0d0d0d; border-bottom: 2px solid #FFC107; padding: 14px 30px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; }
        .tnm-tpl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 8px; margin-bottom: 20px; }
        .tnm-cfg-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .tnm-adv { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
        @media (max-width: 900px) {
          .tnm-grid.has-panel { grid-template-columns: 1fr !important; }
          .tnm-panel { position: static !important; max-height: none !important; }
          .tnm-back-btn { display: flex !important; }
        }
        @media (max-width: 640px) {
          .tnm-grid { padding: 16px !important; }
          .tnm-header { padding: 12px 16px !important; }
          .tnm-tpl-grid { grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)) !important; }
          .tnm-cfg-grid { grid-template-columns: 1fr !important; }
          .tnm-adv { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: '#1a1a1a', border: '1px solid #4CAF50', color: '#4CAF50', padding: '12px 20px', borderRadius: '8px', fontFamily: 'Orbitron', fontSize: '0.8rem' }}>
          ✓ {toast}
        </div>
      )}

      {/* Header */}
      <div className="tnm-header">
        <span style={{ fontFamily: 'Orbitron', fontSize: '0.9rem', color: 'white', textTransform: 'uppercase', letterSpacing: '2px' }}>Tournois</span>
        <button onClick={() => { setShowForm(!showForm); setForm(EMPTY_FORM); setConfig(defaultConfig()); setSelectedTemplate('custom'); setShowAdvanced(false) }} style={S.btn(showForm)}>
          {showForm ? '✕ Fermer' : '+ Nouveau'}
        </button>
      </div>

      <div className={`tnm-grid${selected ? ' has-panel' : ''}`}>
        <div>
          {/* ── Formulaire de création ── */}
          {showForm && (
            <div style={{ background: '#141414', border: '1px solid #FFC107', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 0 30px rgba(255,193,7,0.06)' }}>
              <h3 style={{ fontFamily: 'Orbitron', fontSize: '0.82rem', color: '#FFC107', textTransform: 'uppercase', margin: '0 0 20px' }}>Nouveau tournoi</h3>

              {/* Sélecteur de template */}
              <div style={{ marginBottom: '20px' }}>
                <label style={S.label()}>Template</label>
                <div className="tnm-tpl-grid">
                  {TEMPLATES.map(tpl => (
                    <button
                      key={tpl.id}
                      onClick={() => applyTemplate(tpl.id)}
                      style={{
                        background: selectedTemplate === tpl.id ? 'rgba(255,193,7,0.12)' : '#1a1a1a',
                        border: `1px solid ${selectedTemplate === tpl.id ? '#FFC107' : '#2a2a2a'}`,
                        borderRadius: '8px', padding: '10px 8px', cursor: 'pointer',
                        textAlign: 'center', transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ fontSize: '1.4rem', marginBottom: '4px' }}>{tpl.icon}</div>
                      <div style={{ fontFamily: 'Orbitron', fontSize: '0.58rem', color: selectedTemplate === tpl.id ? '#FFC107' : '#888', textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: 1.3 }}>{tpl.label}</div>
                      <div style={{ fontSize: '0.68rem', color: '#444', marginTop: '3px', lineHeight: 1.2 }}>{tpl.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Nom + Description */}
              <div className="tnm-cfg-grid">
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={S.label()}>Nom *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Tournoi Printemps 2026" style={S.input()} />
                </div>
                <div>
                  <label style={S.label()}>Date de début</label>
                  <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} style={{ ...S.input(), colorScheme: 'dark' }} />
                </div>
                <div>
                  <label style={S.label()}>Date de fin</label>
                  <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} style={{ ...S.input(), colorScheme: 'dark' }} />
                </div>

                {/* Config rapide */}
                <div>
                  <label style={S.label()}>Format</label>
                  <select value={config.format} onChange={e => setConfig(c => ({ ...c, format: e.target.value }))} style={{ ...S.input(), cursor: 'pointer' }}>
                    {Object.entries(FORMAT_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={S.label()}>Inscription</label>
                  <select value={config.registration} onChange={e => setConfig(c => ({ ...c, registration: e.target.value as 'solo' | 'team' }))} style={{ ...S.input(), cursor: 'pointer' }}>
                    <option value="solo">Solo (1v1)</option>
                    <option value="team">Par équipe</option>
                  </select>
                </div>

                {config.registration === 'team' && (
                  <div>
                    <label style={S.label()}>Taille équipe</label>
                    <select value={config.team_size} onChange={e => setConfig(c => ({ ...c, team_size: parseInt(e.target.value) }))} style={{ ...S.input(), cursor: 'pointer' }}>
                      {[2, 3, 4, 5, 6, 7, 10, 11].map(n => <option key={n} value={n}>{n}v{n}</option>)}
                    </select>
                  </div>
                )}

                <div>
                  <label style={S.label()}>Best of</label>
                  <select value={config.best_of} onChange={e => setConfig(c => ({ ...c, best_of: parseInt(e.target.value) }))} style={{ ...S.input(), cursor: 'pointer' }}>
                    <option value={1}>Simple (1 match)</option>
                    <option value={3}>BO3</option>
                    <option value={5}>BO5</option>
                  </select>
                </div>
                <div>
                  <label style={S.label()}>Slots max</label>
                  <select value={config.max_slots ?? ''} onChange={e => setConfig(c => ({ ...c, max_slots: e.target.value ? parseInt(e.target.value) : null }))} style={{ ...S.input(), cursor: 'pointer' }}>
                    <option value="">Illimité</option>
                    {[8, 16, 32, 64, 128].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>

                {/* Description */}
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={S.label()}>Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} style={{ ...S.input(), resize: 'none' as const }} />
                </div>
              </div>

              {/* Options avancées */}
              <div style={{ marginTop: '12px', borderTop: '1px solid #1a1a1a', paddingTop: '12px' }}>
                <button onClick={() => setShowAdvanced(v => !v)} style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', fontFamily: 'Orbitron', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {showAdvanced ? '▲' : '▼'} Options avancées
                </button>

                {showAdvanced && (
                  <div className="tnm-adv">
                    <div>
                      <label style={S.label()}>Classement initial</label>
                      <select value={config.seeding} onChange={e => setConfig(c => ({ ...c, seeding: e.target.value as any }))} style={{ ...S.input(), cursor: 'pointer' }}>
                        <option value="random">Aléatoire</option>
                        <option value="manual">Manuel</option>
                        <option value="elo">Par Elo / Score</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '18px' }}>
                      <input type="checkbox" id="chk-3rd" checked={config.third_place_match} onChange={e => setConfig(c => ({ ...c, third_place_match: e.target.checked }))} style={{ accentColor: '#FFC107', width: '16px', height: '16px' }} />
                      <label htmlFor="chk-3rd" style={{ cursor: 'pointer', color: '#888', fontSize: '0.9rem' }}>Match pour la 3e place</label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input type="checkbox" id="chk-ci" checked={config.checkin.enabled} onChange={e => setConfig(c => ({ ...c, checkin: { ...c.checkin, enabled: e.target.checked } }))} style={{ accentColor: '#FFC107', width: '16px', height: '16px' }} />
                      <label htmlFor="chk-ci" style={{ cursor: 'pointer', color: '#888', fontSize: '0.9rem' }}>Check-in</label>
                      {config.checkin.enabled && (
                        <select value={config.checkin.duration_minutes} onChange={e => setConfig(c => ({ ...c, checkin: { ...c.checkin, duration_minutes: parseInt(e.target.value) } }))} style={{ ...S.input(), width: 'auto', padding: '5px 10px' }}>
                          {[10, 15, 20, 30].map(n => <option key={n} value={n}>{n} min</option>)}
                        </select>
                      )}
                    </div>
                    <div>
                      <label style={S.label()}>Jeu / Sport</label>
                      <input value={config.game ?? ''} onChange={e => setConfig(c => ({ ...c, game: e.target.value || null }))} placeholder="Ex: League of Legends, Football…" style={S.input()} />
                    </div>
                    <div>
                      <label style={S.label()}>Plateforme</label>
                      <select value={config.platform ?? ''} onChange={e => setConfig(c => ({ ...c, platform: e.target.value || null }))} style={{ ...S.input(), cursor: 'pointer' }}>
                        <option value="">—</option>
                        <option value="PC">PC</option>
                        <option value="PS5">PS5</option>
                        <option value="Xbox">Xbox</option>
                        <option value="Mobile">Mobile</option>
                        <option value="Console">Console</option>
                      </select>
                    </div>
                    <div>
                      <label style={S.label()}>Région / Serveur</label>
                      <input value={config.region ?? ''} onChange={e => setConfig(c => ({ ...c, region: e.target.value || null }))} placeholder="EUW, NA, BR…" style={S.input()} />
                    </div>
                    <div style={{ gridColumn: '1/-1' }}>
                      <label style={S.label()}>Prix</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {(['1st', '2nd', '3rd'] as const).map((place, i) => (
                          <input key={place} value={config.prizes[place]} onChange={e => setConfig(c => ({ ...c, prizes: { ...c.prizes, [place]: e.target.value } }))} placeholder={`${i + 1}${i === 0 ? 'er' : 'ème'}`} style={{ ...S.input(), textAlign: 'center' }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '14px', borderTop: '1px solid #1a1a1a', marginTop: '14px' }}>
                <button onClick={() => setShowForm(false)} style={S.btn()}>Annuler</button>
                <button onClick={handleCreate} disabled={saving} style={{ ...S.btn(true), opacity: saving ? 0.6 : 1 }}>{saving ? 'Création…' : 'Créer le tournoi'}</button>
              </div>
            </div>
          )}

          {/* Liste vide */}
          {tournaments.length === 0 && !showForm && (
            <div style={{ textAlign: 'center', padding: '80px 40px', border: '1px dashed #222', borderRadius: '12px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏆</div>
              <h3 style={{ fontFamily: 'Orbitron', color: '#444', fontSize: '0.9rem', textTransform: 'uppercase', margin: '0 0 10px' }}>Aucun tournoi</h3>
              <p style={{ color: '#333', fontSize: '0.88rem', margin: '0 0 20px' }}>Crée ton premier tournoi pour animer ta communauté.</p>
              <button onClick={() => setShowForm(true)} style={S.btn(true)}>+ Créer un tournoi</button>
            </div>
          )}

          {/* Liste des tournois */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {tournaments.map(t => {
              const st = STATUS_CFG[t.status]
              const isSelected = selected?.id === t.id
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
                      <span>{cfgLabel(t)}</span>
                      <span>· {t.tournament_participants?.length ?? 0} participants</span>
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); deleteTournament(t.id) }}
                    style={{ background: 'transparent', border: '1px solid #2a2a2a', color: '#555', width: '30px', height: '30px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', flexShrink: 0, transition: 'all 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget).style.borderColor = '#FF2344'; (e.currentTarget).style.color = '#FF2344' }}
                    onMouseLeave={e => { (e.currentTarget).style.borderColor = '#2a2a2a'; (e.currentTarget).style.color = '#555' }}>✕</button>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Panel détail tournoi ── */}
        {selected && (
          <div className="tnm-panel">
            <button className="tnm-back-btn" onClick={() => setSelected(null)}>← Retour</button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontFamily: 'Orbitron', fontSize: '0.85rem', color: '#FFC107', margin: '0 0 4px', textTransform: 'uppercase' }}>{selected.name}</h3>
                <span style={{ fontSize: '0.75rem', color: '#555' }}>{cfgLabel(selected)}</span>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', color: '#444', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
            </div>

            {/* Config rapide */}
            {selected.config && (
              <div style={{ background: '#0d0d0d', borderRadius: '8px', padding: '12px 14px', marginBottom: '18px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {selected.config.game && <span style={{ fontSize: '0.78rem', color: '#888' }}>🎮 {selected.config.game}</span>}
                {selected.config.platform && <span style={{ fontSize: '0.78rem', color: '#888' }}>📱 {selected.config.platform}</span>}
                {selected.config.region && <span style={{ fontSize: '0.78rem', color: '#888' }}>🌍 {selected.config.region}</span>}
                {selected.config.checkin?.enabled && <span style={{ fontSize: '0.78rem', color: '#888' }}>✅ Check-in {selected.config.checkin.duration_minutes}min</span>}
                {selected.config.third_place_match && <span style={{ fontSize: '0.78rem', color: '#888' }}>🥉 Match 3e place</span>}
                {(Object.values(selected.config.prizes ?? {})).some(v => v) && (
                  <span style={{ fontSize: '0.78rem', color: '#888' }}>🏅 Prix définis</span>
                )}
              </div>
            )}

            {/* Statut */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.68rem', color: '#444', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px' }}>Statut</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {(Object.entries(STATUS_CFG) as [Tournament['status'], typeof STATUS_CFG[Tournament['status']]][]).map(([s, cfg]) => (
                  <button key={s} onClick={() => updateStatus(selected.id, s)} style={{
                    background: selected.status === s ? cfg.bg : 'transparent',
                    border: `1px solid ${selected.status === s ? cfg.color : '#2a2a2a'}`,
                    color: selected.status === s ? cfg.color : '#555',
                    padding: '5px 10px', borderRadius: '4px', cursor: 'pointer',
                    fontFamily: 'Orbitron', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.5px',
                    transition: 'all 0.15s',
                  }}>{cfg.label}</button>
                ))}
              </div>
            </div>

            {/* Participants */}
            <div>
              <div style={{ fontSize: '0.68rem', color: '#444', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #1a1a1a' }}>
                Participants ({selected.tournament_participants?.length ?? 0}{selected.config?.max_slots ? ` / ${selected.config.max_slots}` : ''})
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <input
                  value={newParticipant}
                  onChange={e => setNewParticipant(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addParticipant()}
                  placeholder={selected.config?.registration === 'team' ? "Nom de l'équipe…" : "Nom du participant…"}
                  style={{ ...S.input(), flex: 1, padding: '7px 12px', fontSize: '0.9rem' }}
                />
                <button onClick={addParticipant} disabled={addingP} style={{ ...S.btn(true), padding: '7px 14px', whiteSpace: 'nowrap' as const }}>+</button>
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
                    <button onClick={() => removeParticipant(p.id)}
                      style={{ background: 'transparent', border: 'none', color: '#333', cursor: 'pointer', fontSize: '0.8rem', padding: '2px 6px', flexShrink: 0, transition: 'color 0.15s' }}
                      onMouseEnter={e => (e.currentTarget).style.color = '#FF2344'}
                      onMouseLeave={e => (e.currentTarget).style.color = '#333'}>✕</button>
                  </div>
                ))}
              </div>
              {selected.tournament_participants?.length > 0 && (
                <p style={{ fontSize: '0.72rem', color: '#444', margin: '10px 0 0', textAlign: 'center' }}>Clique sur un score pour modifier — classement recalculé automatiquement</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
