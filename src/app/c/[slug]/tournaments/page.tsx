import { createClient } from '@/lib/supabase/server'
import { notFound }      from 'next/navigation'
import Link from 'next/link'

interface Props { params: Promise<{ slug: string }> }

export default async function PublicTournamentsPage({ params }: Props) {
  const { slug } = await params
  const supabase  = await createClient()

  const { data: community } = await supabase
    .from('communities').select('*').eq('slug', slug).eq('privacy', 'public').single()
  if (!community) notFound()

  const { data: feature } = await supabase
    .from('features').select('*').eq('community_id', community.id)
    .eq('module', 'tournaments').eq('enabled', true).single()
  if (!feature) notFound()

  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('*, tournament_participants(id, name, score, rank, profile_id)')
    .eq('community_id', community.id)
    .order('created_at', { ascending: false })

  const theme = community.theme_json as { primaryColor: string; accentColor: string; font: string; darkMode: boolean }
  const bg    = theme.darkMode ? '#0a0a0a' : '#f5f5f5'
  const panel = theme.darkMode ? '#141414' : '#ffffff'
  const text  = theme.darkMode ? '#e0e0e0' : '#1a1a1a'
  const muted = theme.darkMode ? '#666'    : '#999'
  const bord  = theme.darkMode ? '#222'    : '#e0e0e0'

  const STATUS_CFG = {
    upcoming:  { label: 'À venir',  color: '#2196F3' },
    active:    { label: 'En cours', color: '#4CAF50' },
    completed: { label: 'Terminé',  color: '#666'    },
  }
  const TYPE_LABELS: Record<string, string> = {
    bracket:            '🏆 Élimination directe',
    double_elimination: '⚔️ Double élimination',
    round_robin:        '🔄 Round Robin',
  }

  const active    = tournaments?.filter(t => t.status === 'active')    ?? []
  const upcoming  = tournaments?.filter(t => t.status === 'upcoming')  ?? []
  const completed = tournaments?.filter(t => t.status === 'completed') ?? []

  const TCard = ({ t }: { t: any }) => {
    const st = STATUS_CFG[t.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.upcoming
    const participants = [...(t.tournament_participants ?? [])].sort((a: any, b: any) => (b.score ?? 0) - (a.score ?? 0))
    return (
      <div style={{ background: panel, border: `1px solid ${bord}`, borderTop: `3px solid ${st.color}`, borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ padding: '20px 22px', borderBottom: `1px solid ${bord}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <h3 style={{ margin: 0, fontFamily: `'${theme.font}', sans-serif`, fontSize: '1.05rem', color: text, textTransform: 'uppercase', letterSpacing: '1px' }}>{t.name}</h3>
            <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '3px', border: `1px solid ${st.color}`, color: st.color, textTransform: 'uppercase' }}>{st.label}</span>
          </div>
          <div style={{ display: 'flex', gap: '14px', fontSize: '0.82rem', color: muted }}>
            <span>{TYPE_LABELS[t.type] ?? t.type}</span>
            <span>· {participants.length} participant{participants.length > 1 ? 's' : ''}</span>
            {t.config_json?.start_date && <span>· {new Date(t.config_json.start_date).toLocaleDateString('fr-FR')}</span>}
          </div>
          {t.config_json?.description && <p style={{ margin: '10px 0 0', fontSize: '0.9rem', color: muted, lineHeight: 1.5 }}>{t.config_json.description}</p>}
        </div>
        {participants.length > 0 && (
          <div style={{ padding: '16px 22px' }}>
            <div style={{ fontSize: '0.72rem', color: muted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Classement</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {participants.slice(0, 8).map((p: any, idx: number) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 12px', background: theme.darkMode ? '#1a1a1a' : '#f8f8f8', borderRadius: '6px' }}>
                  <span style={{ fontFamily: `'${theme.font}', sans-serif`, fontSize: '0.75rem', color: idx === 0 ? theme.primaryColor : muted, minWidth: '24px' }}>
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                  </span>
                  <span style={{ flex: 1, fontSize: '0.9rem', color: text }}>{p.name}</span>
                  {p.score != null && (
                    <span style={{ fontFamily: `'${theme.font}', sans-serif`, fontSize: '0.85rem', color: theme.primaryColor }}>{p.score} pts</span>
                  )}
                </div>
              ))}
              {participants.length > 8 && (
                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: muted, margin: '4px 0 0' }}>+{participants.length - 8} autres</p>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ background: bg, minHeight: '100vh', fontFamily: "'Rajdhani', sans-serif", color: text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Rajdhani:wght@400;600;700&family=Oswald:wght@600&family=Montserrat:wght@600&family=Inter:wght@500;600&display=swap');`}</style>

      <header style={{ background: theme.darkMode ? '#0d0d0d' : '#fff', borderBottom: `2px solid ${theme.primaryColor}`, padding: '15px 30px', display: 'flex', alignItems: 'center', gap: '16px', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href={`/c/${community.slug}`} style={{ color: muted, textDecoration: 'none', fontSize: '1.2rem' }}>←</Link>
        {community.logo_url && <img src={community.logo_url} alt="" style={{ width: '34px', height: '34px', borderRadius: '6px', objectFit: 'cover' }} />}
        <h1 style={{ margin: 0, fontFamily: `'${theme.font}', sans-serif`, fontSize: '1rem', color: theme.darkMode ? 'white' : '#111', textTransform: 'uppercase', letterSpacing: '2px' }}>
          {community.name} — Tournois
        </h1>
      </header>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
        {active.length === 0 && upcoming.length === 0 && completed.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px', color: muted }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏆</div>
            <p style={{ fontFamily: `'${theme.font}', sans-serif`, textTransform: 'uppercase', fontSize: '0.88rem' }}>Aucun tournoi pour le moment</p>
          </div>
        )}

        {active.length > 0 && (
          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontFamily: `'${theme.font}', sans-serif`, fontSize: '0.8rem', color: '#4CAF50', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 16px', paddingBottom: '10px', borderBottom: `1px solid ${bord}` }}>
              En cours
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>{active.map(t => <TCard key={t.id} t={t} />)}</div>
          </section>
        )}

        {upcoming.length > 0 && (
          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontFamily: `'${theme.font}', sans-serif`, fontSize: '0.8rem', color: '#2196F3', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 16px', paddingBottom: '10px', borderBottom: `1px solid ${bord}` }}>
              À venir
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>{upcoming.map(t => <TCard key={t.id} t={t} />)}</div>
          </section>
        )}

        {completed.length > 0 && (
          <section>
            <h2 style={{ fontFamily: `'${theme.font}', sans-serif`, fontSize: '0.8rem', color: muted, textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 16px', paddingBottom: '10px', borderBottom: `1px solid ${bord}` }}>
              Historique
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>{completed.map(t => <TCard key={t.id} t={t} />)}</div>
          </section>
        )}
      </div>
    </div>
  )
}
