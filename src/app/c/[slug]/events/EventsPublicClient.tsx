'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type RsvpCounts = { going: number; maybe: number; not_going: number }

export function EventsPublicClient({ community, events, userId, initialRsvps }: {
  community:    any
  events:       any[]
  userId:       string | null
  initialRsvps: Record<string, string>
}) {
  const supabase = createClient()
  const theme    = community.theme_json as { primaryColor: string; accentColor: string; font: string; darkMode: boolean }

  const bg    = theme.darkMode ? '#0a0a0a' : '#f5f5f5'
  const panel = theme.darkMode ? '#141414' : '#ffffff'
  const text  = theme.darkMode ? '#e0e0e0' : '#1a1a1a'
  const muted = theme.darkMode ? '#666'    : '#999'
  const bord  = theme.darkMode ? '#222'    : '#e0e0e0'

  const [rsvps, setRsvps]     = useState<Record<string, string>>(initialRsvps)
  const [loading, setLoading] = useState<string | null>(null)

  const [counts, setCounts] = useState<Record<string, RsvpCounts>>(() =>
    Object.fromEntries((events ?? []).map(e => [
      e.id,
      {
        going:     e.event_rsvps?.filter((r: any) => r.status === 'going').length     ?? 0,
        maybe:     e.event_rsvps?.filter((r: any) => r.status === 'maybe').length     ?? 0,
        not_going: e.event_rsvps?.filter((r: any) => r.status === 'not_going').length ?? 0,
      },
    ]))
  )

  const handleRsvp = async (eventId: string, status: 'going' | 'maybe' | 'not_going') => {
    if (!userId) { window.location.href = `/login?redirect=/c/${community.slug}/events`; return }
    setLoading(eventId)

    const current = rsvps[eventId] as 'going' | 'maybe' | 'not_going' | undefined

    if (current === status) {
      const { error } = await supabase.from('event_rsvps').delete().eq('event_id', eventId).eq('profile_id', userId)
      if (!error) {
        setRsvps(prev => { const n = { ...prev }; delete n[eventId]; return n })
        setCounts(prev => ({ ...prev, [eventId]: { ...prev[eventId], [status]: Math.max(0, (prev[eventId]?.[status] ?? 0) - 1) } }))
      }
    } else {
      const { error } = await supabase.from('event_rsvps').upsert({ event_id: eventId, profile_id: userId, status }, { onConflict: 'event_id,profile_id' })
      if (!error) {
        setRsvps(prev => ({ ...prev, [eventId]: status }))
        setCounts(prev => {
          const old = prev[eventId] ?? { going: 0, maybe: 0, not_going: 0 }
          const updated: RsvpCounts = { ...old, [status]: old[status] + 1 }
          if (current) updated[current] = Math.max(0, updated[current] - 1)
          return { ...prev, [eventId]: updated }
        })
      }
    }
    setLoading(null)
  }

  const isPast = (date: string) => new Date(date) < new Date()

  const upcomingEvents = events.filter(e => !isPast(e.start_at))
  const pastEvents     = events.filter(e => isPast(e.start_at))

  const EventCard = ({ event }: { event: any }) => {
    const past        = isPast(event.start_at)
    const rsvpYes     = counts[event.id]?.going     ?? 0
    const rsvpMaybe   = counts[event.id]?.maybe     ?? 0
    const isFull      = event.max_attendees ? rsvpYes >= event.max_attendees : false
    const myRsvp      = rsvps[event.id]
    const startDate   = new Date(event.start_at)
    const endDate     = event.end_at ? new Date(event.end_at) : null
    const isLoading   = loading === event.id
    const isRecurring = event.is_recurring || !!event.recurrence_parent_id

    return (
      <div style={{ background: panel, border: `1px solid ${bord}`, borderTop: `3px solid ${past ? bord : theme.primaryColor}`, borderRadius: '10px', overflow: 'hidden', opacity: past ? 0.7 : 1, transition: 'all 0.2s' }}>
        <div style={{ padding: '20px 22px', borderBottom: `1px solid ${bord}` }}>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div style={{ background: past ? (theme.darkMode ? '#1a1a1a' : '#f0f0f0') : `${theme.primaryColor}15`, border: `1px solid ${past ? bord : theme.primaryColor + '44'}`, borderRadius: '8px', padding: '10px', textAlign: 'center', minWidth: '56px', flexShrink: 0 }}>
              <div style={{ fontFamily: `'${theme.font}', sans-serif`, fontSize: '1.4rem', color: past ? muted : theme.primaryColor, fontWeight: 700, lineHeight: 1 }}>
                {startDate.getDate()}
              </div>
              <div style={{ fontSize: '0.68rem', color: muted, textTransform: 'uppercase', marginTop: '2px' }}>
                {startDate.toLocaleDateString('fr-FR', { month: 'short' })}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <h3 style={{ margin: 0, fontFamily: `'${theme.font}', sans-serif`, fontSize: '1.05rem', color: past ? muted : text, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {event.title}
                </h3>
                {isRecurring && (
                  <span style={{ fontSize: '0.62rem', padding: '1px 7px', borderRadius: '3px', border: `1px solid ${theme.primaryColor}44`, color: theme.primaryColor, background: `${theme.primaryColor}10`, whiteSpace: 'nowrap' }}>
                    🔁 Récurrent
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '0.82rem', color: muted, flexWrap: 'wrap' }}>
                <span>🕐 {startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}{endDate && ` – ${endDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}</span>
                {event.location && <span>{event.is_online ? '💻' : '📍'} {event.location}</span>}
              </div>
            </div>
          </div>

          {event.description && (
            <p style={{ margin: '12px 0 0', fontSize: '0.9rem', color: muted, lineHeight: 1.5 }}>
              {event.description}
            </p>
          )}
        </div>

        <div style={{ padding: '14px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontSize: '0.82rem', color: muted }}>
            ✅ {rsvpYes} présent{rsvpYes > 1 ? 's' : ''}
            {rsvpMaybe > 0 && ` · 🤔 ${rsvpMaybe} peut-être`}
            {event.max_attendees && ` · ${event.max_attendees - rsvpYes} places restantes`}
            {isFull && <span style={{ color: '#FF9800', marginLeft: '6px' }}>· Complet</span>}
          </div>

          {!past && (
            <div style={{ display: 'flex', gap: '6px' }}>
              {([
                { status: 'going',     label: '✅ Je viens',        activeColor: '#4CAF50' },
                { status: 'maybe',     label: '🤔 Peut-être',       activeColor: '#FF9800' },
                { status: 'not_going', label: '❌ Je ne viens pas', activeColor: '#FF2344' },
              ] as const).map(opt => (
                <button
                  key={opt.status}
                  onClick={() => handleRsvp(event.id, opt.status)}
                  disabled={isLoading || (isFull && opt.status === 'going' && myRsvp !== 'going')}
                  style={{
                    background: myRsvp === opt.status ? `${opt.activeColor}22` : theme.darkMode ? '#1a1a1a' : '#f5f5f5',
                    border: `1px solid ${myRsvp === opt.status ? opt.activeColor : bord}`,
                    color: myRsvp === opt.status ? opt.activeColor : muted,
                    padding: '6px 12px', borderRadius: '6px', cursor: 'pointer',
                    fontSize: '0.78rem', fontFamily: 'Rajdhani', fontWeight: 600,
                    transition: 'all 0.15s', whiteSpace: 'nowrap',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: bg, minHeight: '100vh', fontFamily: "'Rajdhani', sans-serif", color: text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Rajdhani:wght@400;600;700&family=Oswald:wght@600&family=Montserrat:wght@600&family=Inter:wght@500;600&display=swap');`}</style>

      <header style={{ background: theme.darkMode ? '#0d0d0d' : '#fff', borderBottom: `2px solid ${theme.primaryColor}`, padding: '15px 30px', display: 'flex', alignItems: 'center', gap: '16px', position: 'sticky', top: 0, zIndex: 100 }}>
        <a href={`/c/${community.slug}`} style={{ color: muted, textDecoration: 'none', fontSize: '1.2rem' }}>←</a>
        {community.logo_url && <img src={community.logo_url} alt="" style={{ width: '34px', height: '34px', borderRadius: '6px', objectFit: 'cover' }} />}
        <h1 style={{ margin: 0, fontFamily: `'${theme.font}', sans-serif`, fontSize: '1rem', color: theme.darkMode ? 'white' : '#111', textTransform: 'uppercase', letterSpacing: '2px' }}>
          {community.name} — Événements
        </h1>
      </header>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '40px 24px' }}>

        {!userId && (
          <div style={{ background: `${theme.primaryColor}10`, border: `1px solid ${theme.primaryColor}33`, borderRadius: '10px', padding: '14px 18px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.88rem', color: muted }}>Connecte-toi pour indiquer ta participation</span>
            <a href={`/login?redirect=/c/${community.slug}/events`} style={{ background: theme.primaryColor, color: '#000', fontFamily: `'${theme.font}', sans-serif`, fontWeight: 'bold', padding: '7px 16px', borderRadius: '4px', textDecoration: 'none', fontSize: '0.78rem', textTransform: 'uppercase' }}>
              Connexion
            </a>
          </div>
        )}

        {upcomingEvents.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontFamily: `'${theme.font}', sans-serif`, fontSize: '0.8rem', color: theme.primaryColor, textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 16px', paddingBottom: '10px', borderBottom: `1px solid ${bord}` }}>
              Prochains événements
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {upcomingEvents.map(e => <EventCard key={e.id} event={e} />)}
            </div>
          </div>
        )}

        {pastEvents.length > 0 && (
          <div>
            <h2 style={{ fontFamily: `'${theme.font}', sans-serif`, fontSize: '0.8rem', color: muted, textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 16px', paddingBottom: '10px', borderBottom: `1px solid ${bord}` }}>
              Événements passés
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {pastEvents.map(e => <EventCard key={e.id} event={e} />)}
            </div>
          </div>
        )}

        {events.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: muted }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📅</div>
            <p style={{ fontFamily: `'${theme.font}', sans-serif`, textTransform: 'uppercase', fontSize: '0.88rem' }}>
              Aucun événement prévu pour le moment
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
