'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ── Types ─────────────────────────────────────────────────
type CommunityType = 'gaming' | 'sport' | 'school' | 'other'

interface FormData {
  // Étape 1
  name: string
  slug: string
  community_type: CommunityType
  // Étape 2
  description: string
  logo: File | null
  logoPreview: string
  // Étape 3
  modules: {
    scores: boolean
    tournaments: boolean
    bets: boolean
    shop: boolean
    forum: boolean
    calendar: boolean
    applications: boolean
  }
}

const COMMUNITY_TYPES = [
  { value: 'gaming',  label: '🎮 Jeux vidéo',   desc: 'Clan, guilde, équipe esport' },
  { value: 'sport',   label: '⚽ Sport',          desc: 'Équipe, club, association sportive' },
  { value: 'school',  label: '🎓 École / Classe', desc: 'Groupe scolaire, promo, classe' },
  { value: 'other',   label: '✨ Autre',           desc: 'Toute autre communauté' },
]

const MODULES = [
  { key: 'scores',       label: '🏆 Scores & Classement', desc: 'Statistiques personnalisées et classement des membres' },
  { key: 'tournaments',  label: '🥊 Tournois',             desc: 'Brackets et compétitions internes' },
  { key: 'bets',         label: '🎲 Paris internes',       desc: 'Mises en points fictifs entre membres' },
  { key: 'shop',         label: '🛍️ Boutique',             desc: 'Articles virtuels et physiques contre des points' },
  { key: 'forum',        label: '💬 Forum',                desc: 'Discussions organisées par catégories' },
  { key: 'calendar',     label: '📅 Calendrier',           desc: 'Événements et système de RSVP' },
  { key: 'applications', label: '📋 Candidatures',         desc: 'Formulaire de recrutement personnalisé' },
]

// ── Helper : génère un slug depuis un nom ─────────────────
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 50)
}

// ── Composant principal ───────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [checkingSlug, setCheckingSlug] = useState(false)

  const [form, setForm] = useState<FormData>({
    name: '',
    slug: '',
    community_type: 'other',
    description: '',
    logo: null,
    logoPreview: '',
    modules: {
      scores: true,
      tournaments: false,
      bets: false,
      shop: false,
      forum: true,
      calendar: true,
      applications: false,
    },
  })

  // ── Handlers ────────────────────────────────────────────
  const handleNameChange = async (value: string) => {
    const slug = generateSlug(value)
    setForm(f => ({ ...f, name: value, slug }))
    if (slug.length >= 3) await checkSlug(slug)
  }

  const handleSlugChange = async (value: string) => {
    const slug = generateSlug(value)
    setForm(f => ({ ...f, slug }))
    if (slug.length >= 3) await checkSlug(slug)
  }

  const checkSlug = async (slug: string) => {
    setCheckingSlug(true)
    const { data } = await supabase
      .from('communities')
      .select('id')
      .eq('slug', slug)
      .single()
    setSlugAvailable(!data)
    setCheckingSlug(false)
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setError('Le logo ne doit pas dépasser 2MB')
      return
    }
    const preview = URL.createObjectURL(file)
    setForm(f => ({ ...f, logo: file, logoPreview: preview }))
    setError(null)
  }

  const toggleModule = (key: string) => {
    setForm(f => ({
      ...f,
      modules: { ...f.modules, [key]: !f.modules[key as keyof typeof f.modules] }
    }))
  }

  // ── Soumission finale ────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecté')

      // 1. Upload du logo si présent
      let logoUrl: string | null = null
      if (form.logo) {
        const ext = form.logo.name.split('.').pop()
        const path = `${user.id}/${form.slug}-logo.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('community-assets')
          .upload(path, form.logo, { upsert: true })

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('community-assets')
          .getPublicUrl(path)
        logoUrl = urlData.publicUrl
      }

      // 2. Créer la communauté
      const { data: community, error: communityError } = await supabase
        .from('communities')
        .insert({
          owner_id: user.id,
          name: form.name,
          slug: form.slug,
          community_type: form.community_type,
          description: form.description || null,
          logo_url: logoUrl,
        })
        .select('slug')
        .single()

      if (communityError) throw communityError

      // 3. Activer les modules choisis
      // Le trigger a déjà créé les lignes features, on met juste à jour enabled
      const moduleUpdates = Object.entries(form.modules).map(([module, enabled]) =>
        supabase
          .from('features')
          .update({ enabled })
          .eq('community_id', community.slug) // on va utiliser l'id
      )

      // Récupérer l'id de la communauté créée
      const { data: comm } = await supabase
        .from('communities')
        .select('id')
        .eq('slug', community.slug)
        .single()

      if (comm) {
        await Promise.all(
          Object.entries(form.modules).map(([module, enabled]) =>
            supabase
              .from('features')
              .update({ enabled })
              .eq('community_id', comm.id)
              .eq('module', module)
          )
        )
      }

      // 4. Marquer l'onboarding comme complété
      await supabase
        .from('communities')
        .update({ onboarding_completed: true })
        .eq('slug', community.slug)

      router.push(`/dashboard/${community.slug}`)

    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
      setLoading(false)
    }
  }

  // ── Validation par étape ─────────────────────────────────
  const canGoNext = () => {
    if (step === 1) return form.name.length >= 2 && form.slug.length >= 3 && slugAvailable === true
    if (step === 2) return true // description et logo optionnels
    return true
  }

  // ── Rendu ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">The Circle</h1>
        <p className="text-gray-500 mt-1">Créons ta communauté</p>
      </div>

      {/* Indicateur d'étapes */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
              s < step ? 'bg-green-500 text-white' :
              s === step ? 'bg-blue-600 text-white' :
              'bg-gray-200 text-gray-500'
            }`}>
              {s < step ? '✓' : s}
            </div>
            {s < 3 && <div className={`w-12 h-0.5 mx-1 ${s < step ? 'bg-green-500' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-lg p-8">

        {/* ── ÉTAPE 1 : Identité ── */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Identité de ta communauté</h2>
              <p className="text-gray-500 text-sm mt-1">Ces infos seront visibles publiquement.</p>
            </div>

            {/* Nom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de la communauté <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="Les Lions de Lyon"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL de ta communauté <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm whitespace-nowrap">thecircle.app/c/</span>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={form.slug}
                    onChange={e => handleSlugChange(e.target.value)}
                    placeholder="les-lions-de-lyon"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  />
                  {checkingSlug && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">...</span>
                  )}
                  {!checkingSlug && slugAvailable === true && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-xs">✓ Disponible</span>
                  )}
                  {!checkingSlug && slugAvailable === false && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 text-xs">✗ Pris</span>
                  )}
                </div>
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de communauté <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {COMMUNITY_TYPES.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, community_type: type.value as CommunityType }))}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      form.community_type === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-sm text-gray-900">{type.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{type.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 2 : Description & Logo ── */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Présentation</h2>
              <p className="text-gray-500 text-sm mt-1">Optionnel — tu pourras modifier ça plus tard.</p>
            </div>

            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                  {form.logoPreview
                    ? <img src={form.logoPreview} alt="logo" className="w-full h-full object-cover" />
                    : <span className="text-3xl">🏠</span>
                  }
                </div>
                <div>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                    <span>Choisir un fichier</span>
                    <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                  </label>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, SVG — max 2MB</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Décris ta communauté en quelques phrases..."
                rows={4}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition resize-none"
              />
            </div>
          </div>
        )}

        {/* ── ÉTAPE 3 : Modules ── */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Choix des modules</h2>
              <p className="text-gray-500 text-sm mt-1">Tu pourras les activer ou désactiver à tout moment.</p>
            </div>

            <div className="space-y-2">
              {MODULES.map(mod => (
                <button
                  key={mod.key}
                  type="button"
                  onClick={() => toggleModule(mod.key)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                    form.modules[mod.key as keyof typeof form.modules]
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div>
                    <div className="font-medium text-sm text-gray-900">{mod.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{mod.desc}</div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-3 ${
                    form.modules[mod.key as keyof typeof form.modules]
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {form.modules[mod.key as keyof typeof form.modules] && (
                      <span className="text-white text-xs">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={() => setStep(s => s - 1)}
            className={`px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition ${step === 1 ? 'invisible' : ''}`}
          >
            Retour
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={() => { setError(null); setStep(s => s + 1) }}
              disabled={!canGoNext()}
              className="px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Continuer →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Création...' : 'Créer ma communauté 🚀'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}