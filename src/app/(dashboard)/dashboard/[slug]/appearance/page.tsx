'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ── Types ────────────────────────────────────────────────
interface Theme {
  primaryColor: string
  accentColor: string
  font: string
  darkMode: boolean
}

interface Community {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  banner_url: string | null
  theme_json: Theme
}

const FONTS = [
  { value: 'Orbitron',  label: 'Orbitron — Gaming / Futuriste' },
  { value: 'Rajdhani',  label: 'Rajdhani — Moderne / Compact' },
  { value: 'Inter',     label: 'Inter — Neutre / Universel' },
  { value: 'Oswald',    label: 'Oswald — Sport / Impact' },
  { value: 'Montserrat',label: 'Montserrat — Élégant / Pro' },
]

const PRESETS = [
  { label: '🎮 Gaming',  primaryColor: '#FFC107', accentColor: '#FF2344', darkMode: true,  font: 'Orbitron'  },
  { label: '⚽ Sport',   primaryColor: '#4CAF50', accentColor: '#2196F3', darkMode: true,  font: 'Oswald'    },
  { label: '🎓 École',   primaryColor: '#2196F3', accentColor: '#9C27B0', darkMode: false, font: 'Montserrat'},
  { label: '✨ Minimal', primaryColor: '#6366f1', accentColor: '#ec4899', darkMode: false, font: 'Inter'     },
]

export default function AppearancePage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const supabase = createClient()

  const [community, setCommunity] = useState<Community | null>(null)
  const [theme, setTheme] = useState<Theme>({
    primaryColor: '#FFC107',
    accentColor: '#2E86AB',
    font: 'Orbitron',
    darkMode: true,
  })
  const [logoFile, setLogoFile]     = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview]     = useState<string>('')
  const [bannerPreview, setBannerPreview] = useState<string>('')
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState<string | null>(null)

  // ── Chargement initial ──────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('communities')
        .select('id, name, slug, description, logo_url, banner_url, theme_json')
        .eq('slug', slug)
        .single()

      if (data) {
        setCommunity(data as Community)
        setTheme(data.theme_json as Theme)
        if (data.logo_url)   setLogoPreview(data.logo_url)
        if (data.banner_url) setBannerPreview(data.banner_url)
      }
    }
    load()
  }, [slug])

  // ── Handlers fichiers ───────────────────────────────────
  const handleFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'banner'
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    const maxMB = type === 'logo' ? 2 : 5
    if (file.size > maxMB * 1024 * 1024) {
      setError(`Le fichier ne doit pas dépasser ${maxMB}MB`)
      return
    }
    const preview = URL.createObjectURL(file)
    if (type === 'logo') { setLogoFile(file); setLogoPreview(preview) }
    else                 { setBannerFile(file); setBannerPreview(preview) }
    setError(null)
  }

  // ── Upload helper ───────────────────────────────────────
  async function uploadFile(file: File, path: string): Promise<string> {
    const { error } = await supabase.storage
      .from('community-assets')
      .upload(path, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from('community-assets').getPublicUrl(path)
    return data.publicUrl
  }

  // ── Sauvegarde ──────────────────────────────────────────
  const handleSave = async () => {
    if (!community) return
    setSaving(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecté')

      let logoUrl   = community.logo_url
      let bannerUrl = community.banner_url

      if (logoFile) {
        const ext = logoFile.name.split('.').pop()
        logoUrl = await uploadFile(logoFile, `${user.id}/${slug}-logo.${ext}`)
      }
      if (bannerFile) {
        const ext = bannerFile.name.split('.').pop()
        bannerUrl = await uploadFile(bannerFile, `${user.id}/${slug}-banner.${ext}`)
      }

      const { error: updateError } = await supabase
        .from('communities')
        .update({
          theme_json: theme,
          logo_url:   logoUrl,
          banner_url: bannerUrl,
        })
        .eq('id', community.id)

      if (updateError) throw updateError

      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!community) return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#FFC107', fontFamily: 'Orbitron', fontSize: '0.9rem' }}>Chargement...</span>
    </div>
  )

  const bg     = theme.darkMode ? '#0a0a0a' : '#f5f5f5'
  const panel  = theme.darkMode ? '#141414' : '#ffffff'
  const border = theme.darkMode ? '#2a2a2a' : '#e0e0e0'
  const text   = theme.darkMode ? '#e0e0e0' : '#1a1a1a'
  const muted  = theme.darkMode ? '#666'    : '#999'

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', fontFamily: "'Rajdhani', sans-serif", color: '#e0e0e0' }}>

      {/* ── TOPBAR ── */}
      <div style={{
        background: '#0d0d0d', borderBottom: '2px solid #FFC107',
        padding: '14px 30px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => router.push(`/dashboard/${slug}`)}
            style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', fontSize: '1.2rem' }}
          >
            ←
          </button>
          <span style={{ fontFamily: 'Orbitron', fontSize: '0.9rem', color: 'white', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Apparence
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {error && <span style={{ color: '#FF2344', fontSize: '0.85rem' }}>{error}</span>}
          {saved && <span style={{ color: '#4CAF50', fontSize: '0.85rem' }}>✓ Sauvegardé</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: '#FFC107', color: '#000', border: 'none',
              padding: '9px 22px', fontFamily: 'Orbitron', fontWeight: 'bold',
              fontSize: '0.78rem', cursor: saving ? 'not-allowed' : 'pointer',
              borderRadius: '4px', opacity: saving ? 0.6 : 1,
              textTransform: 'uppercase', letterSpacing: '1px',
            }}
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', minHeight: 'calc(100vh - 57px)' }}>

        {/* ── PANNEAU GAUCHE : CONTRÔLES ── */}
        <div style={{
          background: '#111', borderRight: '1px solid #222',
          padding: '30px', overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: '30px',
        }}>

          {/* Presets */}
          <div>
            <label style={{ display: 'block', fontFamily: 'Orbitron', fontSize: '0.72rem', color: '#FFC107', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px' }}>
              Thèmes prédéfinis
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {PRESETS.map(preset => (
                <button
                  key={preset.label}
                  onClick={() => setTheme({ ...theme, ...preset })}
                  style={{
                    background: preset.darkMode ? '#1a1a1a' : '#f0f0f0',
                    border: `2px solid ${preset.primaryColor}`,
                    borderRadius: '8px', padding: '10px',
                    cursor: 'pointer', transition: 'all 0.2s',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: preset.primaryColor }} />
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: preset.accentColor }} />
                  </div>
                  <span style={{ fontSize: '0.78rem', color: preset.darkMode ? '#e0e0e0' : '#333', fontWeight: 600 }}>
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Couleurs */}
          <div>
            <label style={{ display: 'block', fontFamily: 'Orbitron', fontSize: '0.72rem', color: '#FFC107', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px' }}>
              Couleurs
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { key: 'primaryColor', label: 'Couleur principale' },
                { key: 'accentColor',  label: 'Couleur accent' },
              ].map(({ key, label }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1a1a1a', padding: '12px 16px', borderRadius: '8px', border: '1px solid #2a2a2a' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: theme[key as keyof Theme] as string, border: '2px solid #333' }} />
                    <span style={{ fontSize: '0.9rem', color: '#ccc' }}>{label}</span>
                  </div>
                  <input
                    type="color"
                    value={theme[key as keyof Theme] as string}
                    onChange={e => setTheme({ ...theme, [key]: e.target.value })}
                    style={{ width: '36px', height: '36px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Mode */}
          <div>
            <label style={{ display: 'block', fontFamily: 'Orbitron', fontSize: '0.72rem', color: '#FFC107', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px' }}>
              Mode
            </label>
            <div style={{ display: 'flex', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', overflow: 'hidden' }}>
              {[
                { value: true,  label: '🌙 Sombre' },
                { value: false, label: '☀️ Clair' },
              ].map(opt => (
                <button
                  key={String(opt.value)}
                  onClick={() => setTheme({ ...theme, darkMode: opt.value })}
                  style={{
                    flex: 1, padding: '12px', border: 'none', cursor: 'pointer',
                    background: theme.darkMode === opt.value ? '#FFC107' : 'transparent',
                    color: theme.darkMode === opt.value ? '#000' : '#888',
                    fontFamily: 'Rajdhani', fontWeight: 600, fontSize: '0.9rem',
                    transition: 'all 0.2s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Police */}
          <div>
            <label style={{ display: 'block', fontFamily: 'Orbitron', fontSize: '0.72rem', color: '#FFC107', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px' }}>
              Police
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {FONTS.map(font => (
                <button
                  key={font.value}
                  onClick={() => setTheme({ ...theme, font: font.value })}
                  style={{
                    background: theme.font === font.value ? 'rgba(255,193,7,0.1)' : '#1a1a1a',
                    border: `1px solid ${theme.font === font.value ? '#FFC107' : '#2a2a2a'}`,
                    borderRadius: '8px', padding: '10px 14px',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontFamily: `'${font.value}', sans-serif`, fontSize: '0.95rem', color: theme.font === font.value ? '#FFC107' : '#ccc' }}>
                    {font.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Logo */}
          <div>
            <label style={{ display: 'block', fontFamily: 'Orbitron', fontSize: '0.72rem', color: '#FFC107', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px' }}>
              Logo
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '10px',
                border: '2px dashed #333', background: '#1a1a1a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', flexShrink: 0,
              }}>
                {logoPreview
                  ? <img src={logoPreview} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: '1.8rem' }}>🏠</span>
                }
              </div>
              <div>
                <label style={{
                  display: 'inline-block', padding: '8px 16px', borderRadius: '6px',
                  border: '1px solid #333', color: '#ccc', fontSize: '0.85rem',
                  cursor: 'pointer', background: '#1a1a1a',
                }}>
                  Choisir
                  <input type="file" accept="image/*" onChange={e => handleFile(e, 'logo')} style={{ display: 'none' }} />
                </label>
                <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: '#555' }}>PNG, SVG, JPG — max 2MB</p>
              </div>
            </div>
          </div>

          {/* Bannière */}
          <div>
            <label style={{ display: 'block', fontFamily: 'Orbitron', fontSize: '0.72rem', color: '#FFC107', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px' }}>
              Bannière
            </label>
            <div style={{
              width: '100%', height: '100px', borderRadius: '10px',
              border: '2px dashed #333', background: '#1a1a1a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', position: 'relative', marginBottom: '10px',
            }}>
              {bannerPreview
                ? <img src={bannerPreview} alt="banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ color: '#444', fontSize: '0.85rem' }}>Aucune bannière</span>
              }
            </div>
            <label style={{
              display: 'inline-block', padding: '8px 16px', borderRadius: '6px',
              border: '1px solid #333', color: '#ccc', fontSize: '0.85rem',
              cursor: 'pointer', background: '#1a1a1a',
            }}>
              Choisir une bannière
              <input type="file" accept="image/*" onChange={e => handleFile(e, 'banner')} style={{ display: 'none' }} />
            </label>
            <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: '#555' }}>JPG, PNG — max 5MB</p>
          </div>

        </div>

        {/* ── PANNEAU DROIT : PRÉVISUALISATION ── */}
        <div style={{ overflowY: 'auto', background: '#0d0d0d' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #222' }}>
            <span style={{ fontFamily: 'Orbitron', fontSize: '0.7rem', color: '#444', textTransform: 'uppercase', letterSpacing: '2px' }}>
              Prévisualisation — Vitrine publique
            </span>
          </div>

          {/* Mini vitrine preview */}
          <div style={{ background: bg, minHeight: '100%' }}>

            {/* Header preview */}
            <div style={{
              background: theme.darkMode ? '#0d0d0d' : '#fff',
              borderBottom: `2px solid ${theme.primaryColor}`,
              padding: '14px 24px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {logoPreview && (
                  <img src={logoPreview} alt="" style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
                )}
                <span style={{
                  fontFamily: `'${theme.font}', sans-serif`,
                  fontSize: '1rem', fontWeight: 700,
                  color: theme.darkMode ? 'white' : '#111',
                  textTransform: 'uppercase', letterSpacing: '2px',
                }}>
                  {community.name}
                </span>
              </div>
              <span style={{
                fontSize: '0.72rem', color: theme.primaryColor,
                border: `1px solid ${theme.primaryColor}`,
                padding: '5px 12px', borderRadius: '4px',
                fontFamily: `'${theme.font}', sans-serif`,
              }}>
                Rejoindre
              </span>
            </div>

            {/* Hero preview */}
            <div style={{
              background: theme.darkMode ? '#1e1e1e' : '#f0f0f0',
              borderBottom: `4px solid ${theme.primaryColor}`,
              padding: '50px 24px', textAlign: 'center',
              position: 'relative', overflow: 'hidden',
            }}>
              {bannerPreview && (
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: `url(${bannerPreview})`,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  opacity: 0.2,
                }} />
              )}
              <div style={{ position: 'relative' }}>
                {logoPreview && (
                  <img src={logoPreview} alt="" style={{ width: '56px', height: '56px', borderRadius: '10px', objectFit: 'cover', border: `2px solid ${theme.primaryColor}`, marginBottom: '14px' }} />
                )}
                <h2 style={{
                  fontFamily: `'${theme.font}', sans-serif`,
                  fontSize: '1.6rem', fontWeight: 700,
                  color: theme.darkMode ? 'white' : '#111',
                  textTransform: 'uppercase', margin: '0 0 10px',
                }}>
                  Bienvenue dans{' '}
                  <span style={{ color: theme.primaryColor, textShadow: `0 0 10px ${theme.primaryColor}55` }}>
                    {community.name}
                  </span>
                </h2>
                {community.description && (
                  <p style={{ color: theme.darkMode ? '#aaa' : '#666', fontSize: '0.9rem', margin: 0 }}>
                    {community.description}
                  </p>
                )}
              </div>
            </div>

            {/* Members preview */}
            <div style={{ padding: '30px 24px' }}>
              <h3 style={{
                fontFamily: `'${theme.font}', sans-serif`,
                color: theme.darkMode ? 'white' : '#111',
                borderLeft: `4px solid ${theme.primaryColor}`,
                paddingLeft: '12px', fontSize: '1.1rem',
                textTransform: 'uppercase', marginBottom: '20px',
              }}>
                Membres
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {['Member_01', 'Member_02'].map((name, i) => (
                  <div key={i} style={{
                    background: theme.darkMode ? '#1a1a1a' : '#fff',
                    border: `1px solid ${theme.darkMode ? '#2a2a2a' : '#e0e0e0'}`,
                    borderRadius: '6px', padding: '14px',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${theme.primaryColor}, transparent)` }} />
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '4px',
                      background: theme.darkMode ? '#2a2a2a' : '#eee',
                      border: `1px solid ${theme.accentColor}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: `'${theme.font}', sans-serif`,
                      color: theme.primaryColor, fontSize: '0.9rem', flexShrink: 0,
                    }}>
                      {name[0]}
                    </div>
                    <div>
                      <div style={{ fontFamily: `'${theme.font}', sans-serif`, fontSize: '0.85rem', color: theme.darkMode ? 'white' : '#111', fontWeight: 600 }}>{name}</div>
                      <div style={{ fontSize: '0.7rem', color: theme.accentColor }}>membre</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}