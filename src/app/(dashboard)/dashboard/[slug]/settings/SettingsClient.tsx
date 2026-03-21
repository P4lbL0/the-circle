'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const COMMUNITY_TYPES = [
  { value: 'gaming',  label: '🎮 Jeux vidéo'   },
  { value: 'sport',   label: '⚽ Sport'          },
  { value: 'school',  label: '🎓 École / Classe' },
  { value: 'other',   label: '✨ Autre'           },
]

export function SettingsClient({ community }: { community: any }) {
  const supabase = createClient()
  const router   = useRouter()

  const [form, setForm] = useState({
    name:             community.name ?? '',
    slug:             community.slug ?? '',
    description:      community.description ?? '',
    community_type:   community.community_type ?? 'other',
    privacy:          community.privacy ?? 'public',
  })

  const [slugAvailable, setSlugAvailable]   = useState<boolean | null>(null)
  const [checkingSlug, setCheckingSlug]     = useState(false)
  const slugTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [saving, setSaving]                 = useState(false)
  const [saved, setSaved]                   = useState(false)
  const [error, setError]                   = useState<string | null>(null)
  const [showDanger, setShowDanger]         = useState(false)
  const [deleteConfirm, setDeleteConfirm]   = useState('')

  // ── Vérif slug ──────────────────────────────────────────
  const checkSlug = async (slug: string) => {
    if (slug === community.slug) { setSlugAvailable(true); return }
    setCheckingSlug(true)
    const { data } = await supabase
      .from('communities')
      .select('id')
      .eq('slug', slug)
      .single()
    setSlugAvailable(!data)
    setCheckingSlug(false)
  }

  const handleSlugChange = (value: string) => {
    const slug = value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50)
    setForm(f => ({ ...f, slug }))
    if (slug.length >= 3) {
      if (slugTimer.current) clearTimeout(slugTimer.current)
      slugTimer.current = setTimeout(() => checkSlug(slug), 500)
    }
  }

  // ── Sauvegarder ─────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true)
    setError(null)

    const { error: updateError } = await supabase
      .from('communities')
      .update({
        name:           form.name,
        slug:           form.slug,
        description:    form.description || null,
        community_type: form.community_type,
        privacy:        form.privacy,
      })
      .eq('id', community.id)

    if (updateError) {
      setError(updateError.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      // Si le slug a changé, rediriger vers la nouvelle URL
      if (form.slug !== community.slug) {
        router.push(`/dashboard/${form.slug}/settings`)
      }
    }
    setSaving(false)
  }

  // ── Supprimer la communauté ──────────────────────────────
  const handleDelete = async () => {
    if (deleteConfirm !== community.slug) return
    const { error } = await supabase
      .from('communities')
      .delete()
      .eq('id', community.id)

    if (!error) router.push('/dashboard')
  }

  const canSave = form.name.length >= 2 &&
                  form.slug.length >= 3 &&
                  (slugAvailable === true || form.slug === community.slug)

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', fontFamily: "'Rajdhani', sans-serif", color: '#e0e0e0', padding: '40px 30px' }}>
      <div style={{ maxWidth: '660px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontFamily: 'Orbitron', fontSize: '1rem', color: 'white', textTransform: 'uppercase', letterSpacing: '2px', margin: 0 }}>
            Paramètres
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {error && <span style={{ color: '#FF2344', fontSize: '0.85rem' }}>{error}</span>}
            {saved && <span style={{ color: '#4CAF50', fontSize: '0.85rem' }}>✓ Sauvegardé</span>}
            <button
              onClick={handleSave}
              disabled={saving || !canSave}
              style={{
                background: '#FFC107', color: '#000', border: 'none',
                padding: '9px 22px', fontFamily: 'Orbitron', fontWeight: 'bold',
                fontSize: '0.78rem', cursor: (!canSave || saving) ? 'not-allowed' : 'pointer',
                borderRadius: '4px', opacity: (!canSave || saving) ? 0.5 : 1,
                textTransform: 'uppercase', letterSpacing: '1px',
              }}
            >
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </div>

        {/* Infos générales */}
        <Card title="Informations générales">
          {/* Nom */}
          <Field label="Nom de la communauté">
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              style={inputStyle}
            />
          </Field>

          {/* Slug */}
          <Field label="URL (slug)">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#444', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>thecircle.app/c/</span>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  value={form.slug}
                  onChange={e => handleSlugChange(e.target.value)}
                  style={{ ...inputStyle, width: '100%', paddingRight: '80px', boxSizing: 'border-box' }}
                />
                <span style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  fontSize: '0.75rem',
                  color: checkingSlug ? '#666' : (slugAvailable === true ? '#4CAF50' : slugAvailable === false ? '#FF2344' : '#666'),
                }}>
                  {checkingSlug ? '...' : slugAvailable === true ? '✓ Dispo' : slugAvailable === false ? '✗ Pris' : ''}
                </span>
              </div>
            </div>
            {form.slug !== community.slug && (
              <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: '#FF9800' }}>
                ⚠️ Changer le slug modifie l'URL de ta communauté
              </p>
            )}
          </Field>

          {/* Description */}
          <Field label="Description">
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Décris ta communauté..."
              style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
            />
          </Field>

          {/* Type */}
          <Field label="Type de communauté">
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {COMMUNITY_TYPES.map(type => (
                <button
                  key={type.value}
                  onClick={() => setForm(f => ({ ...f, community_type: type.value }))}
                  style={{
                    background: form.community_type === type.value ? 'rgba(255,193,7,0.1)' : '#1a1a1a',
                    border: `1px solid ${form.community_type === type.value ? '#FFC107' : '#2a2a2a'}`,
                    color: form.community_type === type.value ? '#FFC107' : '#666',
                    padding: '8px 14px', borderRadius: '6px', cursor: 'pointer',
                    fontSize: '0.88rem', transition: 'all 0.15s',
                  }}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </Field>
        </Card>

        {/* Confidentialité */}
        <Card title="Confidentialité">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { value: 'public',  icon: '🌍', label: 'Publique', desc: 'La vitrine est visible par tous les visiteurs' },
              { value: 'private', icon: '🔒', label: 'Privée',   desc: 'Seuls les membres connectés peuvent voir la communauté' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setForm(f => ({ ...f, privacy: opt.value }))}
                style={{
                  background: form.privacy === opt.value ? 'rgba(255,193,7,0.08)' : '#1a1a1a',
                  border: `1px solid ${form.privacy === opt.value ? '#FFC107' : '#2a2a2a'}`,
                  borderRadius: '10px', padding: '14px 18px',
                  cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '14px',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: '1.4rem' }}>{opt.icon}</span>
                <div>
                  <div style={{ fontFamily: 'Orbitron', fontSize: '0.82rem', color: form.privacy === opt.value ? '#FFC107' : '#888', textTransform: 'uppercase' }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#555', marginTop: '3px' }}>{opt.desc}</div>
                </div>
                {form.privacy === opt.value && (
                  <span style={{ marginLeft: 'auto', color: '#FFC107', fontSize: '1rem' }}>✓</span>
                )}
              </button>
            ))}
          </div>
        </Card>

        {/* Danger zone */}
        <div style={{
          background: '#141414',
          border: '1px solid #FF234433',
          borderRadius: '12px', overflow: 'hidden',
        }}>
          <button
            onClick={() => setShowDanger(!showDanger)}
            style={{
              width: '100%', background: 'transparent', border: 'none',
              padding: '18px 24px', cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}
          >
            <span style={{ fontFamily: 'Orbitron', fontSize: '0.8rem', color: '#FF2344', textTransform: 'uppercase', letterSpacing: '1px' }}>
              ⚠️ Zone dangereuse
            </span>
            <span style={{ color: '#FF2344', fontSize: '0.8rem' }}>{showDanger ? '▲' : '▼'}</span>
          </button>

          {showDanger && (
            <div style={{ padding: '0 24px 24px', borderTop: '1px solid #FF234422' }}>
              <p style={{ color: '#888', fontSize: '0.88rem', margin: '16px 0 14px', lineHeight: 1.5 }}>
                Supprimer la communauté est <strong style={{ color: '#FF2344' }}>irréversible</strong>. Toutes les données (membres, stats, modules) seront supprimées définitivement.
              </p>
              <p style={{ color: '#666', fontSize: '0.82rem', margin: '0 0 10px' }}>
                Tape <code style={{ color: '#FF2344', background: '#1a1a1a', padding: '2px 6px', borderRadius: '3px' }}>{community.slug}</code> pour confirmer :
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  value={deleteConfirm}
                  onChange={e => setDeleteConfirm(e.target.value)}
                  placeholder={community.slug}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  onClick={handleDelete}
                  disabled={deleteConfirm !== community.slug}
                  style={{
                    background: deleteConfirm === community.slug ? '#FF2344' : '#1a1a1a',
                    border: '1px solid #FF2344', color: deleteConfirm === community.slug ? 'white' : '#FF234466',
                    padding: '9px 18px', borderRadius: '6px', cursor: deleteConfirm === community.slug ? 'pointer' : 'not-allowed',
                    fontFamily: 'Orbitron', fontSize: '0.75rem', textTransform: 'uppercase',
                    transition: 'all 0.2s',
                  }}
                >
                  Supprimer
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

// ── Helpers UI ─────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', background: '#0a0a0a', border: '1px solid #2a2a2a',
  color: '#e0e0e0', padding: '9px 14px', borderRadius: '6px',
  fontFamily: 'Rajdhani', fontSize: '1rem', outline: 'none',
  boxSizing: 'border-box',
}

function Card({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div style={{ background: '#141414', border: '1px solid #222', borderRadius: '12px', padding: '24px' }}>
      <h3 style={{ fontFamily: 'Orbitron', fontSize: '0.78rem', color: '#FFC107', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 20px' }}>
        {title}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.78rem', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '7px' }}>
        {label}
      </label>
      {children}
    </div>
  )
}