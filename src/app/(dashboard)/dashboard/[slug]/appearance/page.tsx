'use client'

import { useState, useEffect } from 'react'
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
  { value: 'Orbitron',   label: 'Orbitron',   tag: 'Gaming / Futuriste' },
  { value: 'Rajdhani',   label: 'Rajdhani',   tag: 'Moderne / Compact' },
  { value: 'Inter',      label: 'Inter',      tag: 'Neutre / Universel' },
  { value: 'Oswald',     label: 'Oswald',     tag: 'Sport / Impact' },
  { value: 'Montserrat', label: 'Montserrat', tag: 'Élégant / Pro' },
]

const PRESETS = [
  { label: '🎮 Gaming',  primaryColor: '#FFC107', accentColor: '#FF2344', darkMode: true,  font: 'Orbitron'   },
  { label: '⚽ Sport',   primaryColor: '#4CAF50', accentColor: '#2196F3', darkMode: true,  font: 'Oswald'     },
  { label: '🎓 École',   primaryColor: '#2196F3', accentColor: '#9C27B0', darkMode: false, font: 'Montserrat' },
  { label: '✨ Minimal', primaryColor: '#6366f1', accentColor: '#ec4899', darkMode: false, font: 'Inter'      },
  { label: '🌙 Neon',    primaryColor: '#00ffcc', accentColor: '#ff00ff', darkMode: true,  font: 'Orbitron'   },
  { label: '🔥 Warrior', primaryColor: '#FF6B35', accentColor: '#FFD700', darkMode: true,  font: 'Oswald'     },
]

const QUICK_COLORS = [
  '#FFC107', '#FF2344', '#4CAF50', '#2196F3',
  '#9C27B0', '#00ffcc', '#FF6B35', '#6366f1',
  '#ec4899', '#FFD700', '#00BCD4', '#FF5722',
]

function SectionLabel({ icon, children, step }: { icon: string; children: React.ReactNode; step?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
      {step !== undefined && (
        <div style={{
          width: '22px', height: '22px', borderRadius: '50%',
          background: 'rgba(255,193,7,0.15)', border: '1px solid #FFC107',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Orbitron', fontSize: '0.6rem', color: '#FFC107', flexShrink: 0,
        }}>
          {step}
        </div>
      )}
      <span style={{ fontSize: '0.9rem' }}>{icon}</span>
      <label style={{
        fontFamily: 'Orbitron', fontSize: '0.68rem',
        color: '#FFC107', textTransform: 'uppercase', letterSpacing: '2px',
      }}>
        {children}
      </label>
    </div>
  )
}

function Divider() {
  return <div style={{ borderTop: '1px solid #1e1e1e', margin: '4px 0' }} />
}

export default function AppearancePage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const supabase = createClient()

  const [community, setCommunity]         = useState<Community | null>(null)
  const [theme, setTheme]                 = useState<Theme>({
    primaryColor: '#FFC107', accentColor: '#2E86AB', font: 'Orbitron', darkMode: true,
  })
  const [description, setDescription]     = useState('')
  const [logoFile, setLogoFile]           = useState<File | null>(null)
  const [bannerFile, setBannerFile]       = useState<File | null>(null)
  const [logoPreview, setLogoPreview]     = useState<string>('')
  const [bannerPreview, setBannerPreview] = useState<string>('')
  const [saving, setSaving]               = useState(false)
  const [saved, setSaved]                 = useState(false)
  const [error, setError]                 = useState<string | null>(null)

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
        setDescription(data.description ?? '')
        if (data.logo_url)   setLogoPreview(data.logo_url)
        if (data.banner_url) setBannerPreview(data.banner_url)
      }
    }
    load()
  }, [slug])

  // ── Handlers fichiers ───────────────────────────────────
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = e.target.files?.[0]
    if (!file) return
    const maxMB = type === 'logo' ? 2 : 5
    if (file.size > maxMB * 1024 * 1024) { setError(`Max ${maxMB}MB`); return }
    const preview = URL.createObjectURL(file)
    if (type === 'logo') { setLogoFile(file); setLogoPreview(preview) }
    else                 { setBannerFile(file); setBannerPreview(preview) }
    setError(null)
  }

  // ── Upload helper ───────────────────────────────────────
  async function uploadFile(file: File, path: string): Promise<string> {
    const { error } = await supabase.storage.from('community-assets').upload(path, file, { upsert: true })
    if (error) throw error
    return supabase.storage.from('community-assets').getPublicUrl(path).data.publicUrl
  }

  // ── Sauvegarde ──────────────────────────────────────────
  const handleSave = async () => {
    if (!community) return
    setSaving(true); setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecté')

      let logoUrl   = community.logo_url
      let bannerUrl = community.banner_url

      if (logoFile)   logoUrl   = await uploadFile(logoFile,   `${user.id}/${slug}-logo.${logoFile.name.split('.').pop()}`)
      if (bannerFile) bannerUrl = await uploadFile(bannerFile, `${user.id}/${slug}-banner.${bannerFile.name.split('.').pop()}`)

      const { error: updateError } = await supabase
        .from('communities')
        .update({ theme_json: theme, logo_url: logoUrl, banner_url: bannerUrl, description })
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

  // ── Detect active preset ─────────────────────────────────
  const activePreset = PRESETS.findIndex(p =>
    p.primaryColor === theme.primaryColor &&
    p.accentColor  === theme.accentColor  &&
    p.darkMode     === theme.darkMode     &&
    p.font         === theme.font
  )

  if (!community) return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#FFC107', fontFamily: 'Orbitron', fontSize: '0.9rem', letterSpacing: '2px' }}>Chargement...</span>
    </div>
  )

  const bg    = theme.darkMode ? '#0a0a0a' : '#f5f5f5'
  const panel = theme.darkMode ? '#141414' : '#ffffff'
  const text  = theme.darkMode ? '#e0e0e0' : '#1a1a1a'
  const muted = theme.darkMode ? '#666'    : '#999'
  const primaryColor = theme.primaryColor

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', fontFamily: "'Rajdhani', sans-serif", color: '#e0e0e0' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;500;600;700&family=Oswald:wght@400;600;700&family=Montserrat:wght@400;600;700&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        .app-preset-btn:hover { transform: translateY(-2px) !important; }
        .app-color-swatch:hover { transform: scale(1.15) !important; }
        .app-font-btn:hover { border-color: #FFC10788 !important; }
        .app-upload-area:hover { border-color: #FFC10766 !important; }
        @media (max-width: 1100px) {
          .app-layout { grid-template-columns: 1fr !important; }
          .app-preview { display: none !important; }
        }
        @media (max-width: 640px) {
          .app-topbar { padding: 12px 16px !important; }
          .app-controls { padding: 20px 16px !important; }
          .app-presets-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      {/* ── TOPBAR ── */}
      <div className="app-topbar" style={{
        background: '#0d0d0d', borderBottom: '2px solid #FFC107',
        padding: '12px 24px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100,
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={() => router.push(`/dashboard/${slug}`)}
            style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}
          >
            ←
          </button>
          <div>
            <div style={{ fontFamily: 'Orbitron', fontSize: '0.88rem', color: 'white', textTransform: 'uppercase', letterSpacing: '2px' }}>
              Apparence
            </div>
            <div style={{ fontSize: '0.72rem', color: '#444', marginTop: '2px' }}>{community.name}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <a
            href={`/c/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              color: '#555', fontSize: '0.72rem', textDecoration: 'none',
              border: '1px solid #2a2a2a', padding: '8px 14px', borderRadius: '4px',
              fontFamily: 'Orbitron', textTransform: 'uppercase', letterSpacing: '1px',
              transition: 'color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#FFC107'; (e.currentTarget as HTMLAnchorElement).style.borderColor = '#FFC107' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#555'; (e.currentTarget as HTMLAnchorElement).style.borderColor = '#2a2a2a' }}
          >
            Voir ↗
          </a>
          {error && <span style={{ color: '#FF2344', fontSize: '0.82rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{error}</span>}
          {saved && (
            <span style={{ color: '#4CAF50', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span>✓</span> Sauvegardé
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: saving ? '#332b00' : '#FFC107',
              color: saving ? '#888' : '#000',
              border: 'none',
              padding: '9px 22px', fontFamily: 'Orbitron', fontWeight: 'bold',
              fontSize: '0.75rem', cursor: saving ? 'not-allowed' : 'pointer',
              borderRadius: '4px', letterSpacing: '1px', textTransform: 'uppercase',
              transition: 'all 0.15s',
            }}
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      <div className="app-layout" style={{ display: 'grid', gridTemplateColumns: '420px 1fr', minHeight: 'calc(100vh - 57px)' }}>

        {/* ── PANNEAU GAUCHE : CONTRÔLES ── */}
        <div className="app-controls" style={{
          background: '#0f0f0f', borderRight: '1px solid #1a1a1a',
          padding: '28px 24px', overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: '24px',
        }}>

          {/* Description */}
          <div>
            <SectionLabel icon="✏️" step={1}>Infos générales</SectionLabel>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Décris ta communauté en quelques mots..."
              rows={3}
              style={{
                width: '100%', background: '#141414', border: '1px solid #2a2a2a',
                color: '#e0e0e0', padding: '10px 14px', borderRadius: '8px',
                fontFamily: 'Rajdhani', fontSize: '0.95rem', outline: 'none',
                resize: 'vertical', lineHeight: 1.5,
              }}
            />
            <div style={{ textAlign: 'right', fontSize: '0.72rem', color: '#444', marginTop: '4px' }}>
              {description.length} / 250 caractères
            </div>
          </div>

          <Divider />

          {/* Presets */}
          <div>
            <SectionLabel icon="🎨" step={2}>Thèmes prédéfinis</SectionLabel>
            <div className="app-presets-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {PRESETS.map((preset, i) => {
                const isActive = activePreset === i
                return (
                  <button
                    key={preset.label}
                    className="app-preset-btn"
                    onClick={() => setTheme({ ...theme, ...preset })}
                    style={{
                      background: preset.darkMode ? '#1a1a1a' : '#f5f5f5',
                      border: isActive ? `2px solid ${preset.primaryColor}` : '2px solid #2a2a2a',
                      borderRadius: '10px', padding: '12px 8px',
                      cursor: 'pointer', transition: 'all 0.2s',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                      position: 'relative', overflow: 'hidden',
                      boxShadow: isActive ? `0 0 16px ${preset.primaryColor}40` : 'none',
                    }}
                  >
                    {isActive && (
                      <div style={{
                        position: 'absolute', top: '6px', right: '6px',
                        width: '14px', height: '14px', borderRadius: '50%',
                        background: preset.primaryColor,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.5rem', color: '#000', fontWeight: 700,
                      }}>✓</div>
                    )}
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: preset.primaryColor, boxShadow: `0 0 8px ${preset.primaryColor}88` }} />
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: preset.accentColor }} />
                    </div>
                    <span style={{ fontSize: '0.68rem', color: preset.darkMode ? '#e0e0e0' : '#333', fontWeight: 600, textAlign: 'center', lineHeight: 1.3 }}>
                      {preset.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <Divider />

          {/* Couleurs */}
          <div>
            <SectionLabel icon="🎨" step={3}>Couleurs personnalisées</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { key: 'primaryColor', label: 'Principale', icon: '●' },
                { key: 'accentColor',  label: 'Accent',     icon: '◉' },
              ].map(({ key, label, icon }) => (
                <div key={key}>
                  <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: theme[key as keyof Theme] as string }}>{icon}</span>
                    {label}
                  </div>
                  <div style={{
                    background: '#141414', padding: '10px 14px',
                    borderRadius: '8px', border: '1px solid #2a2a2a',
                    display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
                  }}>
                    {/* Quick swatches */}
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', flex: 1 }}>
                      {QUICK_COLORS.map(color => (
                        <button
                          key={color}
                          className="app-color-swatch"
                          onClick={() => setTheme({ ...theme, [key]: color })}
                          style={{
                            width: '20px', height: '20px', borderRadius: '4px',
                            background: color, border: `2px solid ${theme[key as keyof Theme] === color ? '#fff' : 'transparent'}`,
                            cursor: 'pointer', padding: 0, transition: 'transform 0.15s',
                            boxShadow: theme[key as keyof Theme] === color ? `0 0 8px ${color}88` : 'none',
                          }}
                          title={color}
                        />
                      ))}
                    </div>
                    {/* Color picker + hex input */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <input
                        type="color"
                        value={theme[key as keyof Theme] as string}
                        onChange={e => setTheme({ ...theme, [key]: e.target.value })}
                        style={{ width: '32px', height: '32px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '4px', padding: '2px' }}
                      />
                      <input
                        type="text"
                        value={theme[key as keyof Theme] as string}
                        onChange={e => {
                          if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value))
                            setTheme({ ...theme, [key]: e.target.value })
                        }}
                        style={{
                          width: '84px', background: '#0a0a0a', border: '1px solid #333',
                          color: '#e0e0e0', padding: '5px 8px', borderRadius: '6px',
                          fontFamily: 'monospace', fontSize: '0.82rem', outline: 'none',
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Divider />

          {/* Mode */}
          <div>
            <SectionLabel icon="🌗" step={4}>Mode</SectionLabel>
            <div style={{ display: 'flex', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', overflow: 'hidden' }}>
              {[
                { value: true,  label: '🌙 Sombre', desc: 'Dark' },
                { value: false, label: '☀️ Clair',  desc: 'Light' },
              ].map(opt => (
                <button
                  key={String(opt.value)}
                  onClick={() => setTheme({ ...theme, darkMode: opt.value })}
                  style={{
                    flex: 1, padding: '13px 10px', border: 'none', cursor: 'pointer',
                    background: theme.darkMode === opt.value ? '#FFC107' : 'transparent',
                    color: theme.darkMode === opt.value ? '#000' : '#888',
                    fontFamily: 'Rajdhani', fontWeight: 600, fontSize: '0.9rem',
                    transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                  }}
                >
                  {opt.label}
                  <span style={{ fontSize: '0.6rem', fontFamily: 'Orbitron', letterSpacing: '1px', opacity: 0.7 }}>{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <Divider />

          {/* Police */}
          <div>
            <SectionLabel icon="Aa" step={5}>Police de titre</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {FONTS.map(font => {
                const isActive = theme.font === font.value
                return (
                  <button
                    key={font.value}
                    className="app-font-btn"
                    onClick={() => setTheme({ ...theme, font: font.value })}
                    style={{
                      background: isActive ? 'rgba(255,193,7,0.08)' : '#141414',
                      border: `1px solid ${isActive ? '#FFC107' : '#2a2a2a'}`,
                      borderRadius: '8px', padding: '10px 14px',
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ fontFamily: `'${font.value}', sans-serif`, fontSize: '1rem', color: isActive ? '#FFC107' : '#ccc', fontWeight: 600 }}>
                      {font.label}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: '#555', fontFamily: 'Rajdhani' }}>{font.tag}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <Divider />

          {/* Logo */}
          <div>
            <SectionLabel icon="🖼️" step={6}>Logo</SectionLabel>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '12px',
                border: `2px dashed ${logoPreview ? primaryColor + '66' : '#333'}`,
                background: '#141414',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', flexShrink: 0, position: 'relative',
              }}>
                {logoPreview
                  ? <img src={logoPreview} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: '2rem', opacity: 0.3 }}>🏠</span>
                }
              </div>
              <div style={{ flex: 1 }}>
                <label className="app-upload-area" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '10px 16px', borderRadius: '8px',
                  border: '1px solid #2a2a2a', color: '#888', fontSize: '0.85rem',
                  cursor: 'pointer', background: '#141414', transition: 'border-color 0.15s',
                  fontFamily: 'Rajdhani',
                }}>
                  📁 Choisir un fichier
                  <input type="file" accept="image/*" onChange={e => handleFile(e, 'logo')} style={{ display: 'none' }} />
                </label>
                <p style={{ margin: '6px 0 0', fontSize: '0.72rem', color: '#444' }}>PNG, SVG, JPG — max 2 MB</p>
                {logoPreview && (
                  <button
                    onClick={() => { setLogoPreview(''); setLogoFile(null) }}
                    style={{ background: 'none', border: 'none', color: '#555', fontSize: '0.72rem', cursor: 'pointer', padding: '4px 0', textDecoration: 'underline' }}
                  >
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Bannière */}
          <div>
            <SectionLabel icon="🖼️" step={7}>Bannière</SectionLabel>
            <div className="app-upload-area" style={{
              width: '100%', height: '100px', borderRadius: '10px',
              border: `2px dashed ${bannerPreview ? primaryColor + '66' : '#333'}`,
              background: '#141414',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', position: 'relative', marginBottom: '10px',
              cursor: 'pointer', transition: 'border-color 0.15s',
            }}>
              {bannerPreview
                ? <img src={bannerPreview} alt="banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ color: '#444', fontSize: '0.82rem', fontFamily: 'Rajdhani' }}>Aucune bannière</span>
              }
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <label style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', borderRadius: '6px',
                border: '1px solid #2a2a2a', color: '#888', fontSize: '0.82rem',
                cursor: 'pointer', background: '#141414', fontFamily: 'Rajdhani',
              }}>
                📁 Choisir une bannière
                <input type="file" accept="image/*" onChange={e => handleFile(e, 'banner')} style={{ display: 'none' }} />
              </label>
              {bannerPreview && (
                <button
                  onClick={() => { setBannerPreview(''); setBannerFile(null) }}
                  style={{ background: 'none', border: 'none', color: '#555', fontSize: '0.72rem', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Supprimer
                </button>
              )}
              <span style={{ fontSize: '0.72rem', color: '#444' }}>JPG, PNG — max 5 MB</span>
            </div>
          </div>

        </div>

        {/* ── PANNEAU DROIT : PRÉVISUALISATION ── */}
        <div className="app-preview" style={{ overflowY: 'auto', background: '#080808' }}>
          {/* Preview header */}
          <div style={{
            padding: '12px 24px', borderBottom: '1px solid #1a1a1a',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontFamily: 'Orbitron', fontSize: '0.65rem', color: '#333', textTransform: 'uppercase', letterSpacing: '2px' }}>
              Prévisualisation — Vitrine publique
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4CAF50', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: '0.65rem', color: '#4CAF5088', fontFamily: 'Orbitron', letterSpacing: '1px' }}>LIVE</span>
            </div>
          </div>

          {/* Mini vitrine */}
          <div style={{ background: bg, minHeight: '100%', fontFamily: `'Rajdhani', sans-serif` }}>

            {/* Header */}
            <div style={{
              background: theme.darkMode ? '#080808' : '#fff',
              borderBottom: `2px solid ${primaryColor}`,
              padding: '0 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              minHeight: '52px', position: 'sticky', top: 0, zIndex: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {logoPreview ? (
                  <img src={logoPreview} alt="" style={{ width: '30px', height: '30px', borderRadius: '6px', objectFit: 'cover', border: `1px solid ${primaryColor}` }} />
                ) : (
                  <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: primaryColor + '22', border: `1px solid ${primaryColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                    {community.name[0]}
                  </div>
                )}
                <span style={{
                  fontFamily: `'${theme.font}', sans-serif`,
                  fontSize: '0.82rem', fontWeight: 700,
                  color: theme.darkMode ? 'white' : '#111',
                  textTransform: 'uppercase', letterSpacing: '2px',
                }}>
                  {community.name}
                </span>
              </div>
              <span style={{
                fontSize: '0.58rem', color: primaryColor,
                border: `1px solid ${primaryColor}`,
                padding: '4px 10px', borderRadius: '4px',
                fontFamily: `'${theme.font}', sans-serif`,
                textTransform: 'uppercase',
              }}>
                Connexion
              </span>
            </div>

            {/* Hero */}
            <div style={{
              backgroundColor: theme.darkMode ? '#1a1a1a' : '#f0f0f0',
              padding: '48px 24px', textAlign: 'center',
              position: 'relative', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {bannerPreview ? (
                <>
                  <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `url(${bannerPreview})`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    opacity: 0.3,
                  }} />
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: `linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, ${bg} 100%)`,
                  }} />
                </>
              ) : (
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: `radial-gradient(${primaryColor}15 1px, transparent 1px)`,
                  backgroundSize: '16px 16px',
                }} />
              )}
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                {logoPreview && (
                  <img src={logoPreview} alt="" style={{
                    width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover',
                    border: `2px solid ${primaryColor}`,
                    boxShadow: `0 0 24px ${primaryColor}50`,
                  }} />
                )}
                <h2 style={{
                  fontFamily: `'${theme.font}', sans-serif`,
                  fontSize: '1.6rem', fontWeight: 900,
                  color: theme.darkMode ? 'white' : '#111',
                  textTransform: 'uppercase', margin: 0,
                  textShadow: `0 0 30px ${primaryColor}60`,
                  letterSpacing: '3px', lineHeight: 1.1,
                }}>
                  {community.name}
                </h2>
                {description && (
                  <p style={{ color: muted, fontStyle: 'italic', margin: 0, fontSize: '0.82rem', maxWidth: '340px', lineHeight: 1.5 }}>
                    {description}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {[{ n: '0', label: 'Membres' }, { n: '0', label: 'Modules' }].map(s => (
                    <div key={s.label} style={{
                      background: theme.darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)',
                      border: `1px solid ${primaryColor}33`,
                      borderRadius: '16px', padding: '5px 14px',
                      fontSize: '0.7rem', color: muted,
                    }}>
                      <span style={{ color: primaryColor, fontFamily: 'Orbitron', fontWeight: 700, marginRight: '4px' }}>{s.n}</span>
                      {s.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Module nav */}
            <div style={{
              backgroundColor: theme.darkMode ? '#0d0d0d' : '#f8f8f8',
              borderBottom: `1px solid ${primaryColor}33`,
              display: 'flex', padding: '0 12px', overflowX: 'auto',
            }}>
              {['🏆 Classement', '📅 Événements', '💬 Forum', '🛍️ Boutique'].map(lbl => (
                <span key={lbl} style={{
                  padding: '10px 14px', fontSize: '0.68rem', color: muted,
                  textTransform: 'uppercase', letterSpacing: '1px',
                  fontFamily: 'Rajdhani', whiteSpace: 'nowrap',
                  borderBottom: '2px solid transparent',
                }}>
                  {lbl}
                </span>
              ))}
            </div>

            {/* Members section title */}
            <div style={{ padding: '20px 20px 10px' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderLeft: `4px solid ${primaryColor}`, paddingLeft: '12px',
                marginBottom: '14px',
              }}>
                <h3 style={{
                  fontFamily: `'${theme.font}', sans-serif`,
                  color: theme.darkMode ? 'white' : '#111',
                  fontSize: '0.95rem', margin: 0,
                  textTransform: 'uppercase', letterSpacing: '2px',
                }}>
                  Membres
                </h3>
                <span style={{ fontSize: '0.62rem', color: muted, fontFamily: 'Rajdhani' }}>0 MEMBRES</span>
              </div>

              {/* Member cards preview */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {['Member_01', 'Member_02'].map((name, i) => (
                  <div key={i} style={{
                    background: theme.darkMode ? '#141414' : '#fff',
                    border: `1px solid ${theme.darkMode ? '#2a2a2a' : '#e0e0e0'}`,
                    borderRadius: '8px', padding: '12px',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                      background: `linear-gradient(90deg, transparent, ${primaryColor}, transparent)`,
                    }} />
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '6px',
                      background: theme.darkMode ? '#2a2a2a' : '#eee',
                      border: `1px solid ${theme.accentColor}55`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: `'${theme.font}', sans-serif`,
                      color: primaryColor, fontSize: '0.85rem', flexShrink: 0, fontWeight: 700,
                    }}>
                      {name[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: `'${theme.font}', sans-serif`, fontSize: '0.78rem', color: theme.darkMode ? 'white' : '#111', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                      <div style={{ fontSize: '0.62rem', color: theme.accentColor }}>membre</div>
                    </div>
                    <div style={{ fontFamily: 'Orbitron', fontSize: '0.78rem', color: primaryColor, fontWeight: 700, flexShrink: 0 }}>
                      {(i + 1) * 1250}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div style={{
              backgroundColor: theme.darkMode ? '#080808' : '#f0f0f0',
              textAlign: 'center', padding: '16px',
              color: theme.darkMode ? '#333' : '#bbb', fontSize: '0.68rem',
              borderTop: `1px solid ${theme.darkMode ? '#1a1a1a' : '#ddd'}`,
              marginTop: '20px',
            }}>
              Propulsé par <span style={{ color: primaryColor, fontFamily: 'Orbitron', fontSize: '0.6rem', letterSpacing: '2px' }}>THE CIRCLE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
