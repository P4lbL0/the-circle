'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getMemberLimit } from '@/lib/plan-limits'

// ── Types ─────────────────────────────────────────────────
interface Application {
  id:              string
  applicant_id:    string | null
  applicant_name:  string | null
  applicant_email: string | null
  answers:         Record<string, any>
  status:          'pending' | 'accepted' | 'rejected' | 'waitlisted'
  notes:           string | null
  created_at:      string
  reviewed_at:     string | null
}

interface FormField {
  id:       string
  label:    string
  type:     string
  required: boolean
  options?: string[]
}

const STATUS_CONFIG = {
  pending:    { label: 'En attente',   color: '#FF9800', bg: 'rgba(255,152,0,0.12)'    },
  accepted:   { label: 'Accepté',      color: '#4CAF50', bg: 'rgba(76,175,80,0.12)'    },
  rejected:   { label: 'Refusé',       color: '#FF2344', bg: 'rgba(255,35,68,0.12)'    },
  waitlisted: { label: 'En attente',   color: '#00bcd4', bg: 'rgba(0,188,212,0.12)'    },
}

const DEFAULT_FIELDS: FormField[] = [
  { id: 'motivation', label: 'Pourquoi veux-tu rejoindre ?', type: 'textarea', required: true  },
  { id: 'experience', label: 'Parle-nous de ton expérience',  type: 'textarea', required: false },
]

export function ApplicationsClient({ community, initialApplications, formFields, formActive }: {
  community:            any
  initialApplications:  Application[]
  formFields:           FormField[]
  formActive:           boolean
}) {
  const supabase = createClient()
  const router   = useRouter()

  const [applications, setApplications] = useState<Application[]>(initialApplications)
  const [selected, setSelected]         = useState<Application | null>(null)
  const [filter, setFilter]             = useState<string>('all')
  const [saving, setSaving]             = useState(false)
  const [toast, setToast]               = useState<string | null>(null)
  const [notes, setNotes]               = useState('')

  // Form builder state
  const [showFormBuilder, setShowFormBuilder] = useState(false)
  const [fields, setFields]                   = useState<FormField[]>(
    formFields.length > 0 ? formFields : DEFAULT_FIELDS
  )
  const [savingForm, setSavingForm]           = useState(false)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  // ── Ouvrir une candidature ──────────────────────────────
  const openApplication = (app: Application) => {
    setSelected(app)
    setNotes(app.notes ?? '')
  }

  // ── Changer le statut ───────────────────────────────────
  const updateStatus = async (id: string, status: Application['status']) => {
    setSaving(true)
    const { error } = await supabase
      .from('applications')
      .update({
        status,
        notes:       notes || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (!error) {
      setApplications(prev => prev.map(a =>
        a.id === id ? { ...a, status, notes: notes || null } : a
      ))
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status, notes: notes || null } : null)

      // Si accepté → créer le membre automatiquement si applicant_id existe
      if (status === 'accepted') {
        const app = applications.find(a => a.id === id)
        if (app?.applicant_id) {
          // Vérifier la limite de membres avant d'ajouter
          const { count } = await supabase
            .from('community_members')
            .select('*', { count: 'exact', head: true })
            .eq('community_id', community.id)

          const limit = getMemberLimit(community.subscription_tier)
          if ((count ?? 0) >= limit) {
            showToast(`Limite de ${limit} membres atteinte (plan ${community.subscription_tier.toUpperCase()})`)
            setSaving(false)
            return
          }

          await supabase.from('community_members').upsert({
            community_id: community.id,
            profile_id:   app.applicant_id,
            role:         'member',
          }, { onConflict: 'community_id,profile_id' })
        }
      }

      // Notifier le candidat par email si accepté ou refusé
      if (status === 'accepted' || status === 'rejected') {
        const app = applications.find(a => a.id === id)
        if (app?.applicant_email) {
          fetch('/api/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'application-decision',
              payload: {
                applicantEmail: app.applicant_email,
                applicantName:  app.applicant_name ?? app.applicant_email,
                communityName:  community.name,
                communitySlug:  community.slug,
                accepted:       status === 'accepted',
                notes:          notes || null,
              },
            }),
          }).catch(() => {})
        }
      }

      showToast(
        status === 'accepted'   ? '✓ Candidature acceptée'    :
        status === 'rejected'   ? '✗ Candidature refusée'     :
        status === 'waitlisted' ? '◷ Mise en liste d\'attente' :
        '↺ Remise en attente'
      )
    }
    setSaving(false)
  }

  // ── Sauvegarder les notes ───────────────────────────────
  const saveNotes = async () => {
    if (!selected) return
    await supabase
      .from('applications')
      .update({ notes: notes || null })
      .eq('id', selected.id)

    setApplications(prev => prev.map(a =>
      a.id === selected.id ? { ...a, notes: notes || null } : a
    ))
    showToast('Notes sauvegardées')
  }

  // ── Form builder ────────────────────────────────────────
  const addField = () => {
    setFields(prev => [...prev, {
      id:       `field_${Date.now()}`,
      label:    'Nouvelle question',
      type:     'text',
      required: false,
    }])
  }

  const updateField = (index: number, updates: Partial<FormField>) => {
    setFields(prev => prev.map((f, i) => i === index ? { ...f, ...updates } : f))
  }

  const removeField = (index: number) => {
    setFields(prev => prev.filter((_, i) => i !== index))
  }

  const saveForm = async () => {
    setSavingForm(true)
    const { data: existing } = await supabase
      .from('application_forms')
      .select('id')
      .eq('community_id', community.id)
      .single()

    if (existing) {
      await supabase
        .from('application_forms')
        .update({ fields, is_active: true })
        .eq('community_id', community.id)
    } else {
      await supabase
        .from('application_forms')
        .insert({ community_id: community.id, fields, is_active: true })
    }

    setSavingForm(false)
    setShowFormBuilder(false)
    showToast('Formulaire sauvegardé')
  }

  // ── Filtres ─────────────────────────────────────────────
  const filtered = filter === 'all'
    ? applications
    : applications.filter(a => a.status === filter)

  const counts = {
    all:        applications.length,
    pending:    applications.filter(a => a.status === 'pending').length,
    accepted:   applications.filter(a => a.status === 'accepted').length,
    rejected:   applications.filter(a => a.status === 'rejected').length,
    waitlisted: applications.filter(a => a.status === 'waitlisted').length,
  }

  const displayFields = formFields.length > 0 ? formFields : DEFAULT_FIELDS

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', fontFamily: "'Rajdhani', sans-serif", color: '#e0e0e0' }}>
      <style>{`
        .app-header { padding: 14px 30px !important; }
        .app-content { max-width: 1200px; margin: 0 auto; padding: 30px; }
        .app-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
        .app-grid.has-panel { grid-template-columns: 1fr 420px; }
        .app-panel { position: sticky; top: 80px; max-height: calc(100vh - 100px); overflow-y: auto; height: fit-content; }
        .app-back-btn { display: none; }
        .app-table-row { display: grid; grid-template-columns: 1fr 120px 80px auto; gap: 12px; align-items: center; padding: 14px 18px; }
        @media (max-width: 900px) {
          .app-grid.has-panel { grid-template-columns: 1fr !important; }
          .app-panel { position: static !important; max-height: none !important; }
          .app-back-btn { display: flex !important; align-items: center; gap: 8px; background: transparent; border: 1px solid #2a2a2a; color: #888; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-family: Rajdhani; font-size: 0.85rem; margin-bottom: 16px; }
        }
        @media (max-width: 640px) {
          .app-header { padding: 12px 16px !important; }
          .app-header-title { font-size: 0.75rem !important; }
          .app-content { padding: 16px !important; }
          .app-table-row { grid-template-columns: 1fr auto !important; }
          .app-table-date { display: none; }
          .app-table-status { display: none; }
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          background: '#1a1a1a', border: '1px solid #4CAF50',
          color: '#4CAF50', padding: '12px 20px', borderRadius: '8px',
          fontFamily: 'Orbitron', fontSize: '0.8rem', letterSpacing: '1px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="app-header" style={{
        background: '#0d0d0d', borderBottom: '2px solid #FFC107',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span className="app-header-title" style={{ fontFamily: 'Orbitron', fontSize: '0.9rem', color: 'white', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Candidatures
          </span>
          <span style={{ background: '#1a1a1a', color: '#FFC107', border: '1px solid #333', padding: '3px 10px', borderRadius: '20px', fontSize: '0.8rem', fontFamily: 'Orbitron' }}>
            {counts.pending} en attente
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <a
            href={`/c/${community.slug}/apply`}
            target="_blank"
            style={{
              background: 'transparent', border: '1px solid #333', color: '#666',
              padding: '8px 16px', borderRadius: '6px', textDecoration: 'none',
              fontFamily: 'Orbitron', fontSize: '0.72rem', textTransform: 'uppercase',
            }}
          >
            Voir le formulaire ↗
          </a>
          <button
            onClick={() => setShowFormBuilder(!showFormBuilder)}
            style={{
              background: showFormBuilder ? 'rgba(255,193,7,0.15)' : '#1a1a1a',
              border: `1px solid ${showFormBuilder ? '#FFC107' : '#333'}`,
              color: showFormBuilder ? '#FFC107' : '#888',
              padding: '8px 16px', borderRadius: '6px', cursor: 'pointer',
              fontFamily: 'Orbitron', fontSize: '0.72rem', textTransform: 'uppercase',
            }}
          >
            ✏️ Modifier le formulaire
          </button>
        </div>
      </div>

      <div className="app-content">

        {/* Form Builder */}
        {showFormBuilder && (
          <div style={{
            background: '#141414', border: '1px solid #FFC107',
            borderRadius: '12px', padding: '26px', marginBottom: '30px',
            boxShadow: '0 0 30px rgba(255,193,7,0.08)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'Orbitron', fontSize: '0.85rem', color: '#FFC107', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
                Éditeur de formulaire
              </h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={addField} style={{
                  background: '#1a1a1a', border: '1px solid #333', color: '#ccc',
                  padding: '7px 14px', borderRadius: '6px', cursor: 'pointer',
                  fontFamily: 'Orbitron', fontSize: '0.7rem', textTransform: 'uppercase',
                }}>
                  + Question
                </button>
                <button onClick={saveForm} disabled={savingForm} style={{
                  background: '#FFC107', color: '#000', border: 'none',
                  padding: '7px 16px', borderRadius: '6px', cursor: 'pointer',
                  fontFamily: 'Orbitron', fontSize: '0.7rem', fontWeight: 'bold',
                  textTransform: 'uppercase', opacity: savingForm ? 0.6 : 1,
                }}>
                  {savingForm ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {fields.map((field, index) => (
                <div key={index} style={{
                  background: '#1a1a1a', border: '1px solid #2a2a2a',
                  borderRadius: '8px', padding: '14px',
                  display: 'grid', gridTemplateColumns: '1fr 120px 80px auto',
                  gap: '10px', alignItems: 'center',
                }}>
                  <input
                    value={field.label}
                    onChange={e => updateField(index, { label: e.target.value })}
                    placeholder="Question..."
                    style={{
                      background: '#0a0a0a', border: '1px solid #333',
                      color: '#e0e0e0', padding: '8px 12px', borderRadius: '6px',
                      fontFamily: 'Rajdhani', fontSize: '0.95rem', outline: 'none',
                    }}
                  />
                  <select
                    value={field.type}
                    onChange={e => updateField(index, { type: e.target.value as any })}
                    style={{
                      background: '#0a0a0a', border: '1px solid #333',
                      color: '#ccc', padding: '8px', borderRadius: '6px',
                      fontFamily: 'Rajdhani', fontSize: '0.9rem', outline: 'none',
                    }}
                  >
                    <option value="text">Texte court</option>
                    <option value="textarea">Texte long</option>
                    <option value="select">Choix multiple</option>
                    <option value="checkbox">Case à cocher</option>
                  </select>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#666', fontSize: '0.82rem' }}>
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={e => updateField(index, { required: e.target.checked })}
                      style={{ accentColor: '#FFC107' }}
                    />
                    Requis
                  </label>
                  <button
                    onClick={() => removeField(index)}
                    style={{
                      background: 'transparent', border: '1px solid #2a2a2a',
                      color: '#555', width: '34px', height: '34px', borderRadius: '6px',
                      cursor: 'pointer', fontSize: '0.9rem',
                    }}
                    onMouseEnter={e => { (e.currentTarget).style.borderColor = '#FF2344'; (e.currentTarget).style.color = '#FF2344' }}
                    onMouseLeave={e => { (e.currentTarget).style.borderColor = '#2a2a2a'; (e.currentTarget).style.color = '#555' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filtres */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {([
            { key: 'all',        label: `Toutes (${counts.all})`          },
            { key: 'pending',    label: `En attente (${counts.pending})`  },
            { key: 'accepted',   label: `Acceptées (${counts.accepted})`  },
            { key: 'waitlisted', label: `En liste (${counts.waitlisted})` },
            { key: 'rejected',   label: `Refusées (${counts.rejected})`   },
          ] as const).map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                background: filter === f.key
                  ? f.key === 'all' ? 'rgba(255,193,7,0.15)' : `${STATUS_CONFIG[f.key as keyof typeof STATUS_CONFIG]?.bg ?? 'rgba(255,193,7,0.15)'}`
                  : '#141414',
                border: `1px solid ${filter === f.key
                  ? f.key === 'all' ? '#FFC107' : STATUS_CONFIG[f.key as keyof typeof STATUS_CONFIG]?.color ?? '#FFC107'
                  : '#222'}`,
                color: filter === f.key
                  ? f.key === 'all' ? '#FFC107' : STATUS_CONFIG[f.key as keyof typeof STATUS_CONFIG]?.color ?? '#FFC107'
                  : '#555',
                padding: '7px 14px', borderRadius: '6px', cursor: 'pointer',
                fontFamily: 'Orbitron', fontSize: '0.72rem', textTransform: 'uppercase',
                letterSpacing: '1px', transition: 'all 0.15s',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Layout liste + détail */}
        <div className={`app-grid${selected ? ' has-panel' : ''}`}>

          {/* Liste */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px', color: '#333', fontFamily: 'Orbitron', fontSize: '0.82rem' }}>
                {filter === 'pending' ? 'Aucune candidature en attente 🎉' : 'Aucune candidature'}
              </div>
            )}

            {filtered.map(app => {
              const status = STATUS_CONFIG[app.status]
              const isSelected = selected?.id === app.id
              const date = new Date(app.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })

              return (
                <div
                  key={app.id}
                  onClick={() => openApplication(app)}
                  style={{
                    background: isSelected ? '#1a1a0d' : '#141414',
                    border: `1px solid ${isSelected ? '#FFC107' : '#222'}`,
                    borderRadius: '10px', padding: '16px 20px',
                    cursor: 'pointer', transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', gap: '14px',
                  }}
                >
                  {/* Avatar initiale */}
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '8px',
                    background: '#222', border: `1px solid ${status.color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Orbitron', fontSize: '1rem', color: '#FFC107', flexShrink: 0,
                  }}>
                    {(app.applicant_name ?? '?')[0]?.toUpperCase()}
                  </div>

                  {/* Infos */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'Orbitron', fontSize: '0.85rem', color: 'white' }}>
                        {app.applicant_name ?? 'Anonyme'}
                      </span>
                      <span style={{
                        fontSize: '0.65rem', padding: '2px 8px', borderRadius: '3px',
                        border: `1px solid ${status.color}`, color: status.color,
                        background: status.bg, textTransform: 'uppercase', fontWeight: 'bold',
                      }}>
                        {status.label}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#555', marginTop: '2px' }}>
                      {app.applicant_email}
                    </div>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: '#444', flexShrink: 0 }}>{date}</div>
                </div>
              )
            })}
          </div>

          {/* Détail candidature */}
          {selected && (
            <div className="app-panel" style={{
              background: '#111', border: '1px solid #FFC107',
              borderRadius: '12px', padding: '26px',
            }}>
              <button className="app-back-btn" onClick={() => setSelected(null)}>← Retour</button>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontFamily: 'Orbitron', fontSize: '0.9rem', color: '#FFC107', margin: '0 0 4px', textTransform: 'uppercase' }}>
                    {selected.applicant_name ?? 'Anonyme'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#555' }}>{selected.applicant_email}</p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#444' }}>
                    {new Date(selected.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', color: '#444', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
              </div>

              {/* Réponses */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontFamily: 'Orbitron', fontSize: '0.68rem', color: '#444', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '14px', paddingBottom: '6px', borderBottom: '1px solid #1a1a1a' }}>
                  Réponses
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {displayFields.map(field => (
                    <div key={field.id}>
                      <div style={{ fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>
                        {field.label}
                      </div>
                      <div style={{
                        background: '#0a0a0a', border: '1px solid #1a1a1a',
                        borderRadius: '6px', padding: '10px 14px',
                        fontSize: '0.9rem', color: '#ccc', lineHeight: 1.5,
                      }}>
                        {selected.answers?.[field.id]
                          ? String(selected.answers[field.id])
                          : <span style={{ color: '#333', fontStyle: 'italic' }}>Pas de réponse</span>
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes internes */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontFamily: 'Orbitron', fontSize: '0.68rem', color: '#444', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid #1a1a1a' }}>
                  Notes internes
                </div>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  onBlur={saveNotes}
                  placeholder="Tes notes sur ce candidat (visibles seulement par l'équipe)..."
                  rows={3}
                  style={{
                    width: '100%', background: '#0a0a0a', border: '1px solid #2a2a2a',
                    color: '#ccc', padding: '10px 12px', borderRadius: '6px',
                    fontFamily: 'Rajdhani', fontSize: '0.9rem', outline: 'none',
                    resize: 'vertical', lineHeight: 1.5, boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Actions */}
              <div style={{ fontFamily: 'Orbitron', fontSize: '0.68rem', color: '#444', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #1a1a1a' }}>
                Décision
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => updateStatus(selected.id, 'accepted')}
                  disabled={saving || selected.status === 'accepted'}
                  style={{
                    background: selected.status === 'accepted' ? 'rgba(76,175,80,0.2)' : 'transparent',
                    border: `1px solid #4CAF50`, color: '#4CAF50',
                    padding: '11px', borderRadius: '6px', cursor: saving ? 'not-allowed' : 'pointer',
                    fontFamily: 'Orbitron', fontSize: '0.78rem', textTransform: 'uppercase',
                    letterSpacing: '1px', opacity: saving ? 0.6 : 1,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (selected.status !== 'accepted') (e.currentTarget).style.background = 'rgba(76,175,80,0.15)' }}
                  onMouseLeave={e => { if (selected.status !== 'accepted') (e.currentTarget).style.background = 'transparent' }}
                >
                  ✓ Accepter
                </button>
                <button
                  onClick={() => updateStatus(selected.id, 'waitlisted')}
                  disabled={saving || selected.status === 'waitlisted'}
                  style={{
                    background: selected.status === 'waitlisted' ? 'rgba(0,188,212,0.2)' : 'transparent',
                    border: `1px solid #00bcd4`, color: '#00bcd4',
                    padding: '11px', borderRadius: '6px', cursor: saving ? 'not-allowed' : 'pointer',
                    fontFamily: 'Orbitron', fontSize: '0.78rem', textTransform: 'uppercase',
                    letterSpacing: '1px', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (selected.status !== 'waitlisted') (e.currentTarget).style.background = 'rgba(0,188,212,0.15)' }}
                  onMouseLeave={e => { if (selected.status !== 'waitlisted') (e.currentTarget).style.background = 'transparent' }}
                >
                  ◷ Liste d'attente
                </button>
                <button
                  onClick={() => updateStatus(selected.id, 'rejected')}
                  disabled={saving || selected.status === 'rejected'}
                  style={{
                    background: selected.status === 'rejected' ? 'rgba(255,35,68,0.2)' : 'transparent',
                    border: `1px solid #FF2344`, color: '#FF2344',
                    padding: '11px', borderRadius: '6px', cursor: saving ? 'not-allowed' : 'pointer',
                    fontFamily: 'Orbitron', fontSize: '0.78rem', textTransform: 'uppercase',
                    letterSpacing: '1px', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (selected.status !== 'rejected') (e.currentTarget).style.background = 'rgba(255,35,68,0.15)' }}
                  onMouseLeave={e => { if (selected.status !== 'rejected') (e.currentTarget).style.background = 'transparent' }}
                >
                  ✕ Refuser
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}