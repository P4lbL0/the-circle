'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getSoftLimit } from '@/lib/plan-limits'

interface Event {
  id:                   string
  title:                string
  description:          string | null
  start_at:             string
  end_at:               string | null
  location:             string | null
  is_online:            boolean
  max_attendees:        number | null
  visibility:           'public' | 'members_only'
  is_recurring:         boolean
  recurrence_type:      string | null
  recurrence_end_date:  string | null
  recurrence_parent_id: string | null
  event_rsvps:          { id: string; status: string; profile_id: string }[]
}

const EMPTY_FORM = {
  title:                '',
  description:          '',
  start_at:             '',
  end_at:               '',
  location:             '',
  is_online:            false,
  max_attendees:        '',
  visibility:           'public' as 'public' | 'members_only',
  is_recurring:         false,
  recurrence_type:      'weekly' as 'daily' | 'weekly' | 'biweekly' | 'monthly',
  recurrence_end_date:  '',
}

const RECURRENCE_LABELS: Record<string, string> = {
  daily:    'Quotidien',
  weekly:   'Hebdomadaire',
  biweekly: 'Toutes les 2 semaines',
  monthly:  'Mensuel',
}

export function EventsClient({ community, initialEvents }: {
  community:     any
  initialEvents: Event[]
}) {
  const supabase = createClient()

  const [events, setEvents]       = useState<Event[]>(initialEvents)
  const [showForm, setShowForm]   = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [toast, setToast]         = useState<string | null>(null)
  const [deleting, setDeleting]   = useState<string | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  const openCreate = () => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true) }

  const openEdit = (event: Event) => {
    setForm({
      title:               event.title,
      description:         event.description ?? '',
      start_at:            event.start_at.slice(0, 16),
      end_at:              event.end_at?.slice(0, 16) ?? '',
      location:            event.location ?? '',
      is_online:           event.is_online,
      max_attendees:       event.max_attendees?.toString() ?? '',
      visibility:          event.visibility,
      is_recurring:        event.is_recurring,
      recurrence_type:     (event.recurrence_type as any) ?? 'weekly',
      recurrence_end_date: event.recurrence_end_date?.slice(0, 16) ?? '',
    })
    setEditingId(event.id)
    setShowForm(true)
  }

  // Génère les occurrences futures d'un événement récurrent
  const generateOccurrences = async (parentId: string, payload: any) => {
    const startDate      = new Date(payload.start_at)
    const endDate        = payload.end_at ? new Date(payload.end_at) : null
    const duration       = endDate ? endDate.getTime() - startDate.getTime() : null
    const recurrenceEnd  = payload.recurrence_end_date
      ? new Date(payload.recurrence_end_date)
      : new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000) // 1 an max

    const occurrences: any[] = []
    const current = new Date(startDate)
    const MAX_OCCURRENCES = 52

    while (occurrences.length < MAX_OCCURRENCES) {
      if (payload.recurrence_type === 'daily')    current.setDate(current.getDate() + 1)
      if (payload.recurrence_type === 'weekly')   current.setDate(current.getDate() + 7)
      if (payload.recurrence_type === 'biweekly') current.setDate(current.getDate() + 14)
      if (payload.recurrence_type === 'monthly')  current.setMonth(current.getMonth() + 1)

      if (current > recurrenceEnd) break

      occurrences.push({
        community_id:         community.id,
        title:                payload.title,
        description:          payload.description,
        start_at:             new Date(current).toISOString(),
        end_at:               duration ? new Date(current.getTime() + duration).toISOString() : null,
        location:             payload.location,
        is_online:            payload.is_online,
        max_attendees:        payload.max_attendees,
        visibility:           payload.visibility,
        created_by:           payload.created_by,
        is_recurring:         false,
        recurrence_parent_id: parentId,
      })
    }

    if (occurrences.length > 0) {
      const { error } = await supabase.from('events').insert(occurrences)
      if (error) console.error('[generateOccurrences] error:', error)
      return occurrences.length
    }
    return 0
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.start_at) { showToast('Titre et date de début requis'); return }
    setSaving(true)

    // Limite souples plan Free (seulement à la création)
    if (!editingId) {
      const limit = getSoftLimit(community.subscription_tier, 'active_events')
      if (limit !== Infinity) {
        const { count } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('community_id', community.id)
          .gte('start_at', new Date().toISOString())
        if ((count ?? 0) >= limit) {
          showToast(`Limite de ${limit} événements actifs (plan Free) — passez au Starter`)
          setSaving(false)
          return
        }
      }
    }

    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) { showToast('Session expirée — reconnecte-toi'); setSaving(false); return }

    const payload: any = {
      community_id:  community.id,
      title:         form.title.trim(),
      description:   form.description || null,
      start_at:      new Date(form.start_at).toISOString(),
      end_at:        form.end_at ? new Date(form.end_at).toISOString() : null,
      location:      form.location || null,
      is_online:     form.is_online,
      max_attendees: form.max_attendees ? parseInt(form.max_attendees) : null,
      visibility:    form.visibility,
      created_by:    currentUser.id,
      is_recurring:         form.is_recurring,
      recurrence_type:      form.is_recurring ? form.recurrence_type : null,
      recurrence_end_date:  form.is_recurring && form.recurrence_end_date ? new Date(form.recurrence_end_date).toISOString() : null,
    }

    if (editingId) {
      const { data, error } = await supabase
        .from('events').update(payload).eq('id', editingId)
        .select('*, event_rsvps(id, status, profile_id)').single()
      if (error) { showToast('Erreur lors de la mise à jour'); console.error(error) }
      else if (data) {
        setEvents(prev => prev.map(e => e.id === editingId ? { ...data, event_rsvps: data.event_rsvps ?? [] } : e))
        showToast('Événement mis à jour')
      }
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('events').insert(payload).select('id').single()

      if (insertError) { showToast('Erreur lors de la création'); console.error(insertError) }
      else if (inserted) {
        let count = 0
        if (form.is_recurring) {
          count = await generateOccurrences(inserted.id, payload)
        }

        // Re-fetch parent + occurrences pour l'affichage
        const { data: allNew } = await supabase
          .from('events')
          .select('*, event_rsvps(id, status, profile_id)')
          .or(`id.eq.${inserted.id},recurrence_parent_id.eq.${inserted.id}`)

        if (allNew) {
          setEvents(prev => [...prev, ...allNew.map(e => ({ ...e, event_rsvps: e.event_rsvps ?? [] }))]
            .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()))
        }
        showToast(form.is_recurring ? `Événement créé + ${count} occurrence(s) générée(s)` : 'Événement créé !')
      }
    }

    setSaving(false)
    setShowForm(false)
  }

  const handleDelete = async (event: Event) => {
    const isParent = event.is_recurring && !event.recurrence_parent_id
    const msg = isParent
      ? 'Supprimer cet événement ET toutes ses occurrences futures ?'
      : 'Supprimer cet événement ?'
    if (!confirm(msg)) return

    setDeleting(event.id)
    const { error } = await supabase.from('events').delete().eq('id', event.id)
    if (error) { showToast('Erreur lors de la suppression'); console.error(error) }
    else {
      if (isParent) {
        // Les occurrences sont supprimées en cascade (ON DELETE CASCADE)
        setEvents(prev => prev.filter(e => e.id !== event.id && e.recurrence_parent_id !== event.id))
      } else {
        setEvents(prev => prev.filter(e => e.id !== event.id))
      }
      showToast('Événement supprimé')
    }
    setDeleting(null)
  }

  const refreshRsvps = async () => {
    const { data } = await supabase.from('events').select('id, event_rsvps(id, status, profile_id)').eq('community_id', community.id)
    if (data) {
      setEvents(prev => prev.map(e => { const fresh = data.find(d => d.id === e.id); return fresh ? { ...e, event_rsvps: fresh.event_rsvps ?? [] } : e }))
      showToast('Participations actualisées')
    }
  }

  const grouped = events.reduce((acc, event) => {
    const month = new Date(event.start_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    if (!acc[month]) acc[month] = []
    acc[month].push(event)
    return acc
  }, {} as Record<string, Event[]>)

  const isPast = (date: string) => new Date(date) < new Date()

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#0a0a0a', border: '1px solid #2a2a2a',
    color: '#e0e0e0', padding: '9px 14px', borderRadius: '6px',
    fontFamily: 'Rajdhani', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', fontFamily: "'Rajdhani', sans-serif", color: '#e0e0e0' }}>
      <style>{`
        .ev-header { padding: 14px 30px !important; }
        .ev-header-btns { gap: 10px; }
        .ev-content { max-width: 900px; margin: 0 auto; padding: 30px; }
        .ev-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .ev-card { display: flex; align-items: flex-start; gap: 18px; padding: 18px 20px; }
        .ev-card-actions { display: flex; gap: 6px; flex-shrink: 0; }
        @media (max-width: 768px) {
          .ev-header { padding: 12px 16px !important; flex-wrap: wrap; gap: 8px; }
          .ev-header-title { font-size: 0.75rem !important; }
          .ev-header-refresh { display: none !important; }
          .ev-header-create span { display: none; }
          .ev-content { padding: 16px !important; }
          .ev-form-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .ev-card { flex-direction: column; gap: 12px; }
          .ev-date-block { display: flex !important; align-items: center; gap: 12px; min-width: unset !important; width: 100%; }
          .ev-card-actions { position: absolute; top: 14px; right: 14px; }
          .ev-card-wrap { position: relative; }
        }
      `}</style>

      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, background: '#1a1a1a', border: '1px solid #4CAF50', color: '#4CAF50', padding: '12px 20px', borderRadius: '8px', fontFamily: 'Orbitron', fontSize: '0.8rem' }}>
          ✓ {toast}
        </div>
      )}

      {/* Header */}
      <div className="ev-header" style={{ background: '#0d0d0d', borderBottom: '2px solid #FFC107', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <span className="ev-header-title" style={{ fontFamily: 'Orbitron', fontSize: '0.9rem', color: 'white', textTransform: 'uppercase', letterSpacing: '2px' }}>Événements</span>
        <div className="ev-header-btns" style={{ display: 'flex' }}>
          <button className="ev-header-refresh" onClick={refreshRsvps} style={{ background: 'transparent', color: '#666', border: '1px solid #2a2a2a', padding: '9px 16px', fontFamily: 'Orbitron', fontSize: '0.72rem', cursor: 'pointer', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '1px' }} title="Actualiser les participations">
            🔄 Actualiser
          </button>
          <button className="ev-header-create" onClick={openCreate} style={{ background: '#FFC107', color: '#000', border: 'none', padding: '9px 22px', fontFamily: 'Orbitron', fontWeight: 'bold', fontSize: '0.78rem', cursor: 'pointer', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            + <span>Créer un événement</span>
          </button>
        </div>
      </div>

      <div className="ev-content">

        {/* Formulaire création/édition */}
        {showForm && (
          <div style={{ background: '#141414', border: '1px solid #FFC107', borderRadius: '12px', padding: '26px', marginBottom: '30px', boxShadow: '0 0 30px rgba(255,193,7,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <h3 style={{ fontFamily: 'Orbitron', fontSize: '0.85rem', color: '#FFC107', textTransform: 'uppercase', margin: 0 }}>
                {editingId ? 'Modifier l\'événement' : 'Nouvel événement'}
              </h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
            </div>

            <div className="ev-form-grid">
              {/* Titre */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Titre *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Tournoi mensuel, Entraînement..." style={inputStyle} />
              </div>

              {/* Description */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }} />
              </div>

              {/* Dates */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Début *</label>
                <input type="datetime-local" value={form.start_at} onChange={e => setForm(f => ({ ...f, start_at: e.target.value }))} style={{ ...inputStyle, colorScheme: 'dark' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Fin</label>
                <input type="datetime-local" value={form.end_at} onChange={e => setForm(f => ({ ...f, end_at: e.target.value }))} style={{ ...inputStyle, colorScheme: 'dark' }} />
              </div>

              {/* Lieu */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Lieu / Lien</label>
                <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Discord, Adresse, URL..." style={inputStyle} />
              </div>

              {/* Max participants */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Places max</label>
                <input type="number" value={form.max_attendees} onChange={e => setForm(f => ({ ...f, max_attendees: e.target.value }))} placeholder="Illimité" style={inputStyle} />
              </div>

              {/* Options visibilité + en ligne */}
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#888', fontSize: '0.9rem' }}>
                  <input type="checkbox" checked={form.is_online} onChange={e => setForm(f => ({ ...f, is_online: e.target.checked }))} style={{ accentColor: '#FFC107', width: '16px', height: '16px' }} />
                  Événement en ligne
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['public', 'members_only'] as const).map(v => (
                    <button key={v} onClick={() => setForm(f => ({ ...f, visibility: v }))} style={{
                      background: form.visibility === v ? 'rgba(255,193,7,0.12)' : '#1a1a1a',
                      border: `1px solid ${form.visibility === v ? '#FFC107' : '#2a2a2a'}`,
                      color: form.visibility === v ? '#FFC107' : '#666',
                      padding: '6px 14px', borderRadius: '6px', cursor: 'pointer',
                      fontFamily: 'Orbitron', fontSize: '0.7rem', textTransform: 'uppercase',
                    }}>
                      {v === 'public' ? '🌍 Public' : '🔒 Membres'}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── RÉCURRENCE ── */}
              <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #1a1a1a', paddingTop: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: form.is_recurring ? '14px' : '0' }}>
                  <input
                    type="checkbox"
                    checked={form.is_recurring}
                    onChange={e => setForm(f => ({ ...f, is_recurring: e.target.checked }))}
                    style={{ accentColor: '#FFC107', width: '16px', height: '16px' }}
                  />
                  <span style={{ color: form.is_recurring ? '#FFC107' : '#888', fontFamily: 'Orbitron', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    🔁 Événement récurrent
                  </span>
                </label>

                {form.is_recurring && !editingId && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', background: 'rgba(255,193,7,0.04)', border: '1px solid #FFC10722', borderRadius: '8px', padding: '16px' }}>
                    {/* Fréquence */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Fréquence</label>
                      <select
                        value={form.recurrence_type}
                        onChange={e => setForm(f => ({ ...f, recurrence_type: e.target.value as any }))}
                        style={{ ...inputStyle, cursor: 'pointer' }}
                      >
                        <option value="daily">Quotidien</option>
                        <option value="weekly">Hebdomadaire</option>
                        <option value="biweekly">Toutes les 2 semaines</option>
                        <option value="monthly">Mensuel</option>
                      </select>
                    </div>

                    {/* Date de fin de récurrence */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                        Répéter jusqu'au <span style={{ color: '#444' }}>(optionnel, max 1 an)</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={form.recurrence_end_date}
                        onChange={e => setForm(f => ({ ...f, recurrence_end_date: e.target.value }))}
                        style={{ ...inputStyle, colorScheme: 'dark' }}
                      />
                    </div>

                    {/* Prévisualisation */}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>
                        {(() => {
                          if (!form.start_at) return 'Sélectionne une date de début pour voir la prévisualisation'
                          const start = new Date(form.start_at)
                          const end = form.recurrence_end_date ? new Date(form.recurrence_end_date) : new Date(start.getTime() + 365 * 24 * 60 * 60 * 1000)
                          let count = 0
                          const cur = new Date(start)
                          while (count < 52) {
                            if (form.recurrence_type === 'daily')    cur.setDate(cur.getDate() + 1)
                            if (form.recurrence_type === 'weekly')   cur.setDate(cur.getDate() + 7)
                            if (form.recurrence_type === 'biweekly') cur.setDate(cur.getDate() + 14)
                            if (form.recurrence_type === 'monthly')  cur.setMonth(cur.getMonth() + 1)
                            if (cur > end) break
                            count++
                          }
                          return `→ ${count} occurrence${count > 1 ? 's' : ''} seront générées (${RECURRENCE_LABELS[form.recurrence_type]})`
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {form.is_recurring && editingId && (
                  <p style={{ fontSize: '0.8rem', color: '#555', margin: '8px 0 0', fontStyle: 'italic' }}>
                    Note : modifier l'événement parent ne modifie pas les occurrences existantes.
                  </p>
                )}
              </div>

              {/* Actions */}
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid #1a1a1a' }}>
                <button onClick={() => setShowForm(false)} style={{ background: 'transparent', border: '1px solid #2a2a2a', color: '#666', padding: '9px 20px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'Orbitron', fontSize: '0.75rem' }}>
                  Annuler
                </button>
                <button onClick={handleSave} disabled={saving} style={{ background: '#FFC107', color: '#000', border: 'none', padding: '9px 22px', borderRadius: '6px', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Orbitron', fontWeight: 'bold', fontSize: '0.78rem', textTransform: 'uppercase', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Sauvegarde...' : editingId ? 'Mettre à jour' : form.is_recurring ? 'Créer + générer' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Liste vide */}
        {events.length === 0 && !showForm && (
          <div style={{ textAlign: 'center', padding: '80px 40px', border: '1px dashed #222', borderRadius: '12px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📅</div>
            <h3 style={{ fontFamily: 'Orbitron', color: '#444', fontSize: '0.9rem', textTransform: 'uppercase', margin: '0 0 10px' }}>Aucun événement</h3>
            <p style={{ color: '#333', fontSize: '0.88rem', margin: '0 0 20px' }}>Crée ton premier événement pour rassembler ta communauté.</p>
            <button onClick={openCreate} style={{ background: '#FFC107', color: '#000', border: 'none', padding: '10px 24px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'Orbitron', fontWeight: 'bold', fontSize: '0.78rem', textTransform: 'uppercase' }}>
              + Créer un événement
            </button>
          </div>
        )}

        {/* Événements groupés par mois */}
        {Object.entries(grouped).map(([month, monthEvents]) => (
          <div key={month} style={{ marginBottom: '36px' }}>
            <h2 style={{ fontFamily: 'Orbitron', fontSize: '0.78rem', color: '#FFC107', textTransform: 'uppercase', letterSpacing: '2px', paddingBottom: '10px', borderBottom: '1px solid #1a1a1a', marginBottom: '14px' }}>
              {month}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {monthEvents.map(event => {
                const past        = isPast(event.start_at)
                const rsvpYes     = event.event_rsvps?.filter(r => r.status === 'going').length ?? 0
                const rsvpMaybe   = event.event_rsvps?.filter(r => r.status === 'maybe').length ?? 0
                const isFull      = event.max_attendees ? rsvpYes >= event.max_attendees : false
                const startDate   = new Date(event.start_at)
                const time        = startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                const isOccurrence = !!event.recurrence_parent_id

                return (
                  <div key={event.id} style={{ background: '#141414', border: `1px solid ${past ? '#1a1a1a' : '#2a2a2a'}`, borderLeft: `3px solid ${past ? '#333' : '#FFC107'}`, borderRadius: '10px', padding: '18px 20px', opacity: past ? 0.6 : 1, display: 'flex', alignItems: 'flex-start', gap: '18px' }}>
                    {/* Date block */}
                    <div style={{ background: past ? '#1a1a1a' : 'rgba(255,193,7,0.08)', border: `1px solid ${past ? '#222' : '#FFC10733'}`, borderRadius: '8px', padding: '10px 14px', textAlign: 'center', flexShrink: 0, minWidth: '70px' }}>
                      <div style={{ fontFamily: 'Orbitron', fontSize: '1.4rem', color: past ? '#444' : '#FFC107', lineHeight: 1, fontWeight: 700 }}>{startDate.getDate()}</div>
                      <div style={{ fontSize: '0.7rem', color: '#555', textTransform: 'uppercase', marginTop: '2px' }}>{startDate.toLocaleDateString('fr-FR', { month: 'short' })}</div>
                      <div style={{ fontSize: '0.68rem', color: '#444', marginTop: '4px' }}>{time}</div>
                    </div>

                    {/* Infos */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
                        <h3 style={{ margin: 0, fontFamily: 'Orbitron', fontSize: '0.9rem', color: past ? '#555' : 'white', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          {event.title}
                        </h3>
                        {/* Badges */}
                        {(event.is_recurring || isOccurrence) && (
                          <span style={{ fontSize: '0.62rem', padding: '1px 7px', borderRadius: '3px', border: '1px solid #FFC10744', color: '#FFC107', background: 'rgba(255,193,7,0.08)' }}>
                            🔁 {event.is_recurring ? RECURRENCE_LABELS[event.recurrence_type ?? 'weekly'] ?? 'Récurrent' : 'Occurrence'}
                          </span>
                        )}
                        {past && <span style={{ fontSize: '0.62rem', padding: '1px 7px', borderRadius: '3px', border: '1px solid #333', color: '#444', textTransform: 'uppercase' }}>Passé</span>}
                        {isFull && !past && <span style={{ fontSize: '0.62rem', padding: '1px 7px', borderRadius: '3px', border: '1px solid #FF9800', color: '#FF9800', background: 'rgba(255,152,0,0.1)', textTransform: 'uppercase' }}>Complet</span>}
                        <span style={{ fontSize: '0.62rem', padding: '1px 7px', borderRadius: '3px', border: `1px solid ${event.visibility === 'public' ? '#4CAF5055' : '#2196F355'}`, color: event.visibility === 'public' ? '#4CAF5099' : '#2196F399', textTransform: 'uppercase' }}>
                          {event.visibility === 'public' ? '🌍 Public' : '🔒 Membres'}
                        </span>
                      </div>

                      {event.description && <p style={{ margin: '0 0 8px', fontSize: '0.88rem', color: '#666', lineHeight: 1.4 }}>{event.description}</p>}

                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        {event.location && <span style={{ fontSize: '0.8rem', color: '#555' }}>{event.is_online ? '💻' : '📍'} {event.location}</span>}
                        <span style={{ fontSize: '0.8rem', color: '#555' }}>
                          ✅ {rsvpYes} présent{rsvpYes > 1 ? 's' : ''}
                          {rsvpMaybe > 0 && ` · 🤔 ${rsvpMaybe} peut-être`}
                          {event.max_attendees && ` / ${event.max_attendees} max`}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button onClick={() => openEdit(event)} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888', width: '34px', height: '34px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.15s' }}
                        onMouseEnter={e => { (e.currentTarget).style.borderColor = '#FFC107'; (e.currentTarget).style.color = '#FFC107' }}
                        onMouseLeave={e => { (e.currentTarget).style.borderColor = '#2a2a2a'; (e.currentTarget).style.color = '#888' }}>
                        ✏️
                      </button>
                      <button onClick={() => handleDelete(event)} disabled={deleting === event.id} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#555', width: '34px', height: '34px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.15s' }}
                        onMouseEnter={e => { (e.currentTarget).style.borderColor = '#FF2344'; (e.currentTarget).style.color = '#FF2344' }}
                        onMouseLeave={e => { (e.currentTarget).style.borderColor = '#2a2a2a'; (e.currentTarget).style.color = '#555' }}>
                        ✕
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
