'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ── Types ─────────────────────────────────────────────────
type CommunityType = 'gaming' | 'sport' | 'school' | 'other'

interface StatField {
  key: string
  label: string
  type: 'number' | 'text' | 'percentage'
  visible_public: boolean
  order: number
}

interface FormulaConfig {
  type: 'sum' | 'average' | 'custom'
  expression: string
  label: string
}

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
  statFields: StatField[]
  statFormula: FormulaConfig
  // Étape 4
  modules: {
    scores: boolean
    tournaments: boolean
    shop: boolean
    forum: boolean
    calendar: boolean
    applications: boolean
  }
}

// ── Templates stats par type de communauté ────────────────
const STAT_TEMPLATES: Record<string, { fields: StatField[]; formula: FormulaConfig }> = {
  gaming: {
    fields: [
      { key: 'kills',   label: 'Kills',      type: 'number', visible_public: true,  order: 0 },
      { key: 'deaths',  label: 'Deaths',     type: 'number', visible_public: true,  order: 1 },
      { key: 'assists', label: 'Assists',    type: 'number', visible_public: true,  order: 2 },
      { key: 'wins',    label: 'Victoires',  type: 'number', visible_public: true,  order: 3 },
    ],
    formula: { type: 'custom', expression: '(kills + assists * 0.5) / (deaths || 1)', label: 'KDA' },
  },
  sport: {
    fields: [
      { key: 'goals',   label: 'Buts',         type: 'number', visible_public: true, order: 0 },
      { key: 'assists', label: 'Passes',        type: 'number', visible_public: true, order: 1 },
      { key: 'matches', label: 'Matchs joués', type: 'number', visible_public: true, order: 2 },
      { key: 'wins',    label: 'Victoires',     type: 'number', visible_public: true, order: 3 },
    ],
    formula: { type: 'custom', expression: 'goals * 2 + assists', label: 'Score' },
  },
  school: {
    fields: [
      { key: 'maths',   label: 'Maths',     type: 'number', visible_public: false, order: 0 },
      { key: 'french',  label: 'Français',  type: 'number', visible_public: false, order: 1 },
      { key: 'science', label: 'Sciences',  type: 'number', visible_public: false, order: 2 },
      { key: 'history', label: 'Histoire',  type: 'number', visible_public: false, order: 3 },
    ],
    formula: { type: 'average', expression: '(maths + french + science + history) / 4', label: 'Moyenne' },
  },
  other: {
    fields: [
      { key: 'score', label: 'Score', type: 'number', visible_public: true, order: 0 },
    ],
    formula: { type: 'sum', expression: 'score', label: 'Score total' },
  },
}

const COMMUNITY_TYPES = [
  { value: 'gaming', label: '🎮 Jeux vidéo',   desc: 'Clan, guilde, équipe esport' },
  { value: 'sport',  label: '⚽ Sport',          desc: 'Équipe, club, association sportive' },
  { value: 'school', label: '🎓 École / Classe', desc: 'Groupe scolaire, promo, classe' },
  { value: 'other',  label: '✨ Autre',           desc: 'Toute autre communauté' },
]

const MODULES = [
  { key: 'scores',       label: '🏆 Scores & Classement', desc: 'Statistiques personnalisées et classement des membres' },
  { key: 'tournaments',  label: '🥊 Tournois',             desc: 'Brackets et compétitions internes' },
  { key: 'shop',         label: '🛍️ Boutique',             desc: 'Articles virtuels et physiques contre des points' },
  { key: 'forum',        label: '💬 Forum',                desc: 'Discussions organisées par catégories' },
  { key: 'calendar',     label: '📅 Calendrier',           desc: 'Événements et système de RSVP' },
  { key: 'applications', label: '📋 Candidatures',         desc: 'Formulaire de recrutement personnalisé' },
]

const FIELD_TYPES: { value: StatField['type']; label: string }[] = [
  { value: 'number',     label: '🔢 Nombre' },
  { value: 'percentage', label: '📊 Pourcentage' },
  { value: 'text',       label: '💬 Texte' },
]

// ── Helpers ───────────────────────────────────────────────
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

function labelToKey(label: string, index: number): string {
  return (
    label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '') || `field_${index}`
  )
}

// ── Composant principal ───────────────────────────────────
export default function OnboardingPage() {
  const router  = useRouter()
  const supabase = createClient()

  const [step, setStep]             = useState(1)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [checkingSlug, setCheckingSlug]   = useState(false)
  const [createdSlug, setCreatedSlug]     = useState<string>('')
  const slugTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [form, setForm] = useState<FormData>({
    name: '',
    slug: '',
    community_type: 'other',
    description: '',
    logo: null,
    logoPreview: '',
    statFields: STAT_TEMPLATES.other.fields,
    statFormula: STAT_TEMPLATES.other.formula,
    modules: {
      scores: true,
      tournaments: false,
      shop: false,
      forum: true,
      calendar: true,
      applications: false,
    },
  })

  // ── Handlers ─────────────────────────────────────────────
  const scheduleSlugCheck = (slug: string) => {
    if (slugTimer.current) clearTimeout(slugTimer.current)
    slugTimer.current = setTimeout(() => checkSlug(slug), 500)
  }

  const handleNameChange = (value: string) => {
    const slug = generateSlug(value)
    setForm(f => ({ ...f, name: value, slug }))
    if (slug.length >= 3) scheduleSlugCheck(slug)
  }

  const handleSlugChange = (value: string) => {
    const slug = generateSlug(value)
    setForm(f => ({ ...f, slug }))
    if (slug.length >= 3) scheduleSlugCheck(slug)
  }

  const handleTypeChange = (type: CommunityType) => {
    const tpl = STAT_TEMPLATES[type] ?? STAT_TEMPLATES.other
    setForm(f => ({
      ...f,
      community_type: type,
      statFields:  tpl.fields,
      statFormula: tpl.formula,
    }))
  }

  const checkSlug = async (slug: string) => {
    setCheckingSlug(true)
    const { data } = await supabase.from('communities').select('id').eq('slug', slug).single()
    setSlugAvailable(!data)
    setCheckingSlug(false)
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setError('Le logo ne doit pas dépasser 2MB'); return }
    setForm(f => ({ ...f, logo: file, logoPreview: URL.createObjectURL(file) }))
    setError(null)
  }

  const toggleModule = (key: string) => {
    setForm(f => ({ ...f, modules: { ...f.modules, [key]: !f.modules[key as keyof typeof f.modules] } }))
  }

  // ── Stat fields handlers ──────────────────────────────────
  const addStatField = () => {
    const newField: StatField = {
      key: `field_${Date.now()}`,
      label: 'Nouveau champ',
      type: 'number',
      visible_public: true,
      order: form.statFields.length,
    }
    setForm(f => ({ ...f, statFields: [...f.statFields, newField] }))
  }

  const updateStatField = (index: number, updates: Partial<StatField>) => {
    setForm(f => ({
      ...f,
      statFields: f.statFields.map((field, i) => {
        if (i !== index) return field
        const updated = { ...field, ...updates }
        if (updates.label !== undefined) updated.key = labelToKey(updates.label, i)
        return updated
      }),
    }))
  }

  const removeStatField = (index: number) => {
    setForm(f => ({ ...f, statFields: f.statFields.filter((_, i) => i !== index) }))
  }

  // ── Soumission finale (après step 4) ─────────────────────
  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecté')

      // 1. Upload logo
      let logoUrl: string | null = null
      if (form.logo) {
        const ext = form.logo.name.split('.').pop()
        const path = `${user.id}/${form.slug}-logo.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('community-assets')
          .upload(path, form.logo, { upsert: true })
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('community-assets').getPublicUrl(path)
        logoUrl = urlData.publicUrl
      }

      // 2-5. Créer la communauté en une seule transaction atomique (RPC)
      const { data: result, error: rpcError } = await supabase.rpc('create_community_transactional', {
        p_owner_id:       user.id,
        p_name:           form.name,
        p_slug:           form.slug,
        p_community_type: form.community_type,
        p_description:    form.description || null,
        p_logo_url:       logoUrl,
        p_modules:        form.modules,
        p_stat_fields:    form.statFields,
        p_formula_config: form.statFormula,
      })

      if (rpcError) throw rpcError

      const community = result as { id: string; slug: string }
      setCreatedSlug(community.slug)
      setStep(5)

    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  // ── Validation par étape ──────────────────────────────────
  const canGoNext = () => {
    if (step === 1) return form.name.length >= 2 && form.slug.length >= 3 && slugAvailable === true
    return true
  }

  // ── Input style helpers ───────────────────────────────────
  const inputCls = 'w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-gray-900'

  const STEPS = ['Identité', 'Présentation', 'Statistiques', 'Modules', 'Invitation']

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">

      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">The Circle</h1>
        <p className="text-gray-500 mt-1">Créons ta communauté</p>
      </div>

      {/* Indicateur d'étapes (5 steps) */}
      {step < 5 && (
        <div className="flex items-center gap-1 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                s < step  ? 'bg-green-500 text-white' :
                s === step ? 'bg-blue-600 text-white' :
                'bg-gray-200 text-gray-500'
              }`}>
                {s < step ? '✓' : s}
              </div>
              {s < 4 && <div className={`w-8 h-0.5 mx-0.5 ${s < step ? 'bg-green-500' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
      )}

      {/* Label étape */}
      {step < 5 && (
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">
          Étape {step} / 4 — {STEPS[step - 1]}
        </p>
      )}

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-lg p-8">

        {/* ── ÉTAPE 1 : Identité ── */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Identité de ta communauté</h2>
              <p className="text-gray-500 text-sm mt-1">Ces infos seront visibles publiquement.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="Les Lions de Lyon"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm whitespace-nowrap">thecircle.app/c/</span>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={form.slug}
                    onChange={e => handleSlugChange(e.target.value)}
                    placeholder="les-lions-de-lyon"
                    className={inputCls}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de communauté <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {COMMUNITY_TYPES.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleTypeChange(type.value as CommunityType)}
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

        {/* ── ÉTAPE 2 : Présentation ── */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Présentation</h2>
              <p className="text-gray-500 text-sm mt-1">Optionnel — tu pourras modifier ça plus tard.</p>
            </div>

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
                    Choisir un fichier
                    <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                  </label>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, SVG — max 2MB</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Décris ta communauté en quelques phrases..."
                rows={4}
                className={`${inputCls} resize-none`}
              />
            </div>
          </div>
        )}

        {/* ── ÉTAPE 3 : Schéma de stats ── */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Statistiques</h2>
              <p className="text-gray-500 text-sm mt-1">
                Pré-rempli selon ton type de communauté. Tu pourras tout modifier plus tard.
              </p>
            </div>

            {/* Champs */}
            <div className="space-y-2">
              {form.statFields.map((field, index) => (
                <div key={index} className="flex items-center gap-2 bg-gray-50 rounded-xl border border-gray-200 p-3">
                  <input
                    value={field.label}
                    onChange={e => updateStatField(index, { label: e.target.value })}
                    placeholder="Nom du champ"
                    className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 outline-none focus:border-blue-400"
                  />
                  <select
                    value={field.type}
                    onChange={e => updateStatField(index, { type: e.target.value as StatField['type'] })}
                    className="bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-700 outline-none"
                  >
                    {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => updateStatField(index, { visible_public: !field.visible_public })}
                    className={`text-xs px-2 py-1.5 rounded-lg border transition ${
                      field.visible_public
                        ? 'border-green-300 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-400'
                    }`}
                    title={field.visible_public ? 'Visible publiquement' : 'Privé'}
                  >
                    {field.visible_public ? '🌍' : '🔒'}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeStatField(index)}
                    className="text-gray-300 hover:text-red-400 transition text-sm w-7 h-7 flex items-center justify-center rounded"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addStatField}
              className="w-full py-2 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 text-sm hover:border-blue-300 hover:text-blue-500 transition"
            >
              + Ajouter un champ
            </button>

            {/* Formule */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Formule du score</label>
                <input
                  value={form.statFormula.label}
                  onChange={e => setForm(f => ({ ...f, statFormula: { ...f.statFormula, label: e.target.value } }))}
                  placeholder="ex: KDA, Score..."
                  className="bg-white border border-gray-300 rounded-lg px-3 py-1 text-sm text-gray-900 outline-none w-28 text-right"
                />
              </div>
              <input
                value={form.statFormula.expression}
                onChange={e => setForm(f => ({ ...f, statFormula: { ...f.statFormula, expression: e.target.value, type: 'custom' } }))}
                placeholder="ex: kills + assists * 0.5"
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-mono text-blue-700 outline-none focus:border-blue-400"
              />
              {form.statFields.filter(f => f.type !== 'text').length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-xs text-gray-400">Clés :</span>
                  {form.statFields.filter(f => f.type !== 'text').map(f => (
                    <code
                      key={f.key}
                      onClick={() => setForm(ff => ({ ...ff, statFormula: { ...ff.statFormula, expression: ff.statFormula.expression + f.key } }))}
                      className="text-xs bg-white border border-gray-200 rounded px-1.5 py-0.5 text-blue-500 cursor-pointer hover:border-blue-300"
                    >
                      {f.key}
                    </code>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ÉTAPE 4 : Modules ── */}
        {step === 4 && (
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

        {/* ── ÉTAPE 5 : Succès + Lien d'invitation ── */}
        {step === 5 && (
          <div className="space-y-6 text-center">
            <div className="text-5xl">🎉</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Communauté créée !</h2>
              <p className="text-gray-500 text-sm mt-2">
                Partage ce lien à tes membres pour qu'ils nous rejoignent.
              </p>
            </div>

            {/* Lien d'invitation */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Lien d'invitation</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-blue-600 truncate text-left">
                  {typeof window !== 'undefined' ? window.location.origin : 'https://thecircle.app'}/join/{createdSlug}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    const link = `${window.location.origin}/join/${createdSlug}`
                    navigator.clipboard.writeText(link)
                  }}
                  className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-100 transition whitespace-nowrap"
                >
                  📋 Copier
                </button>
              </div>
            </div>

            {/* Lien vitrine publique */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Vitrine publique</p>
              <a
                href={`/c/${createdSlug}`}
                target="_blank"
                className="text-sm text-blue-600 hover:underline"
              >
                {typeof window !== 'undefined' ? window.location.origin : 'https://thecircle.app'}/c/{createdSlug} ↗
              </a>
            </div>

            <button
              type="button"
              onClick={() => router.push(`/dashboard/${createdSlug}`)}
              className="w-full px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
            >
              Accéder au dashboard →
            </button>
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Navigation */}
        {step < 5 && (
          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className={`px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition ${step === 1 ? 'invisible' : ''}`}
            >
              Retour
            </button>

            {step < 4 ? (
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
        )}
      </div>
    </div>
  )
}
