'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ── Types ─────────────────────────────────────────────────
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

interface Community {
  id: string
  name: string
  slug: string
  community_type: string
}

// ── Templates par type de communauté ─────────────────────
const TEMPLATES: Record<string, { fields: StatField[], formula: FormulaConfig }> = {
  gaming: {
    fields: [
      { key: 'kills',   label: 'Kills',   type: 'number', visible_public: true,  order: 0 },
      { key: 'deaths',  label: 'Deaths',  type: 'number', visible_public: true,  order: 1 },
      { key: 'assists', label: 'Assists', type: 'number', visible_public: true,  order: 2 },
      { key: 'wins',    label: 'Victoires', type: 'number', visible_public: true, order: 3 },
    ],
    formula: { type: 'custom', expression: '(kills + assists * 0.5) / (deaths || 1)', label: 'KDA' },
  },
  sport: {
    fields: [
      { key: 'goals',    label: 'Buts',          type: 'number', visible_public: true, order: 0 },
      { key: 'assists',  label: 'Passes',         type: 'number', visible_public: true, order: 1 },
      { key: 'matches',  label: 'Matchs joués',   type: 'number', visible_public: true, order: 2 },
      { key: 'wins',     label: 'Victoires',      type: 'number', visible_public: true, order: 3 },
    ],
    formula: { type: 'custom', expression: 'goals * 2 + assists', label: 'Score' },
  },
  school: {
    fields: [
      { key: 'maths',    label: 'Maths',    type: 'number', visible_public: false, order: 0 },
      { key: 'french',   label: 'Français', type: 'number', visible_public: false, order: 1 },
      { key: 'science',  label: 'Sciences', type: 'number', visible_public: false, order: 2 },
      { key: 'history',  label: 'Histoire', type: 'number', visible_public: false, order: 3 },
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

const FIELD_TYPES = [
  { value: 'number',     label: '🔢 Nombre' },
  { value: 'percentage', label: '📊 Pourcentage' },
  { value: 'text',       label: '💬 Texte' },
]

export function StatsSchemaClient({ community, initialSchema }: {
  community: Community
  initialSchema: any
}) {
  const supabase = createClient()
  const router   = useRouter()

  const [fields, setFields]   = useState<StatField[]>(
    initialSchema?.fields?.length > 0
      ? initialSchema.fields
      : TEMPLATES[community.community_type]?.fields ?? TEMPLATES.other.fields
  )
  const [formula, setFormula] = useState<FormulaConfig>(
    initialSchema?.formula_config && Object.keys(initialSchema.formula_config).length > 0
      ? initialSchema.formula_config
      : TEMPLATES[community.community_type]?.formula ?? TEMPLATES.other.formula
  )
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [preview, setPreview] = useState(false)

  // ── Ajouter un champ ────────────────────────────────────
  const addField = () => {
    const newField: StatField = {
      key:            `field_${Date.now()}`,
      label:          'Nouveau champ',
      type:           'number',
      visible_public: true,
      order:          fields.length,
    }
    setFields(prev => [...prev, newField])
  }

  // ── Modifier un champ ───────────────────────────────────
  const updateField = (index: number, updates: Partial<StatField>) => {
    setFields(prev => prev.map((f, i) => {
      if (i !== index) return f
      const updated = { ...f, ...updates }
      // Auto-générer la key depuis le label
      if (updates.label !== undefined) {
        updated.key = updates.label
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '')
          || `field_${i}`
      }
      return updated
    }))
  }

  // ── Supprimer un champ ──────────────────────────────────
  const removeField = (index: number) => {
    setFields(prev => prev.filter((_, i) => i !== index))
  }

  // ── Monter / descendre ──────────────────────────────────
  const moveField = (index: number, dir: 'up' | 'down') => {
    const next = [...fields]
    const swap = dir === 'up' ? index - 1 : index + 1
    if (swap < 0 || swap >= next.length) return
    ;[next[index], next[swap]] = [next[swap], next[index]]
    setFields(next.map((f, i) => ({ ...f, order: i })))
  }

  // ── Appliquer un template ───────────────────────────────
  const applyTemplate = (type: string) => {
    if (!confirm('Remplacer les champs actuels par ce template ?')) return
    const tpl = TEMPLATES[type] ?? TEMPLATES.other
    setFields(tpl.fields)
    setFormula(tpl.formula)
  }

  // ── Prévisualiser le calcul ─────────────────────────────
  const previewFormula = () => {
    try {
      const testValues: Record<string, number> = {}
      fields.filter(f => f.type === 'number' || f.type === 'percentage')
            .forEach((f, i) => { testValues[f.key] = (i + 1) * 5 }) // ← valeurs fixes au lieu de Math.random()

      const expr  = formula.expression
      const keys  = Object.keys(testValues)
      const vals  = Object.values(testValues)
      // eslint-disable-next-line no-new-func
      const fn     = new Function(...keys, `return ${expr}`)
      const result = fn(...vals)

      return { values: testValues, result: Math.round(result * 100) / 100 }
    } catch {
      return null
    }
  }

  // ── Sauvegarder ────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true)
    setError(null)

    // Validation
    const keys = fields.map(f => f.key)
    if (new Set(keys).size !== keys.length) {
      setError('Deux champs ont le même nom — renomme-les.')
      setSaving(false)
      return
    }

    const { error: updateError } = await supabase
      .from('stat_schemas')
      .update({ fields, formula_config: formula })
      .eq('community_id', community.id)

    if (updateError) {
      setError(updateError.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
    setSaving(false)
  }

  const formulaPreview = previewFormula()

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', fontFamily: "'Rajdhani', sans-serif", color: '#e0e0e0' }}>

      {/* Topbar */}
      <div style={{
        background: '#0d0d0d', borderBottom: '2px solid #FFC107',
        padding: '14px 30px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => router.push(`/dashboard/${community.slug}`)}
            style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', fontSize: '1.2rem' }}
          >
            ←
          </button>
          <span style={{ fontFamily: 'Orbitron', fontSize: '0.9rem', color: 'white', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Schéma de stats
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {error  && <span style={{ color: '#FF2344', fontSize: '0.85rem' }}>{error}</span>}
          {saved  && <span style={{ color: '#4CAF50', fontSize: '0.85rem' }}>✓ Sauvegardé</span>}
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

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 30px', display: 'flex', flexDirection: 'column', gap: '30px' }}>

        {/* Templates */}
        <div style={{ background: '#141414', border: '1px solid #222', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ fontFamily: 'Orbitron', fontSize: '0.8rem', color: '#FFC107', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 16px' }}>
            Templates prédéfinis
          </h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {[
              { key: 'gaming', label: '🎮 Jeux vidéo', sub: 'KDA, Kills, Deaths' },
              { key: 'sport',  label: '⚽ Sport',       sub: 'Buts, Passes, Matchs' },
              { key: 'school', label: '🎓 École',        sub: 'Notes par matière' },
              { key: 'other',  label: '✨ Personnalisé', sub: 'Repartir de zéro' },
            ].map(tpl => (
              <button
                key={tpl.key}
                onClick={() => applyTemplate(tpl.key)}
                style={{
                  background: community.community_type === tpl.key ? 'rgba(255,193,7,0.1)' : '#1a1a1a',
                  border: `1px solid ${community.community_type === tpl.key ? '#FFC107' : '#2a2a2a'}`,
                  borderRadius: '8px', padding: '12px 18px',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                }}
              >
                <div style={{ fontFamily: 'Orbitron', fontSize: '0.8rem', color: community.community_type === tpl.key ? '#FFC107' : '#ccc' }}>
                  {tpl.label}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#555', marginTop: '3px' }}>{tpl.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Champs */}
        <div style={{ background: '#141414', border: '1px solid #222', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontFamily: 'Orbitron', fontSize: '0.8rem', color: '#FFC107', textTransform: 'uppercase', letterSpacing: '2px', margin: 0 }}>
              Champs ({fields.length})
            </h3>
            <button
              onClick={addField}
              style={{
                background: '#1a1a1a', border: '1px solid #333', color: '#ccc',
                padding: '7px 16px', borderRadius: '6px', cursor: 'pointer',
                fontFamily: 'Orbitron', fontSize: '0.72rem', textTransform: 'uppercase',
              }}
            >
              + Ajouter un champ
            </button>
          </div>

          {fields.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px', color: '#444', fontFamily: 'Orbitron', fontSize: '0.8rem' }}>
              Aucun champ — clique sur "+ Ajouter" ou choisis un template
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {fields.map((field, index) => (
              <div
                key={index}
                style={{
                  background: '#1a1a1a', border: '1px solid #2a2a2a',
                  borderRadius: '10px', padding: '16px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 140px 1fr auto auto auto',
                  gap: '10px', alignItems: 'center',
                }}
              >
                {/* Label */}
                <input
                  value={field.label}
                  onChange={e => updateField(index, { label: e.target.value })}
                  placeholder="Nom du champ"
                  style={{
                    background: '#0a0a0a', border: '1px solid #333',
                    color: '#e0e0e0', padding: '8px 12px', borderRadius: '6px',
                    fontFamily: 'Rajdhani', fontSize: '0.95rem', outline: 'none',
                  }}
                />

                {/* Type */}
                <select
                  value={field.type}
                  onChange={e => updateField(index, { type: e.target.value as StatField['type'] })}
                  style={{
                    background: '#0a0a0a', border: '1px solid #333',
                    color: '#ccc', padding: '8px', borderRadius: '6px',
                    fontFamily: 'Rajdhani', fontSize: '0.9rem', outline: 'none',
                  }}
                >
                  {FIELD_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>

                {/* Key (auto) */}
                <div style={{
                  background: '#0d0d0d', border: '1px solid #1a1a1a',
                  padding: '8px 12px', borderRadius: '6px',
                  fontFamily: 'monospace', fontSize: '0.8rem', color: '#555',
                }}>
                  clé : <span style={{ color: '#FFC10788' }}>{field.key}</span>
                </div>

                {/* Visible public */}
                <button
                  onClick={() => updateField(index, { visible_public: !field.visible_public })}
                  title={field.visible_public ? 'Visible publiquement' : 'Privé (membres seulement)'}
                  style={{
                    background: field.visible_public ? 'rgba(76,175,80,0.15)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${field.visible_public ? '#4CAF50' : '#333'}`,
                    color: field.visible_public ? '#4CAF50' : '#555',
                    width: '36px', height: '36px', borderRadius: '6px',
                    cursor: 'pointer', fontSize: '1rem',
                  }}
                >
                  {field.visible_public ? '🌍' : '🔒'}
                </button>

                {/* Ordre */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <button onClick={() => moveField(index, 'up')} disabled={index === 0}
                    style={{ background: '#111', border: '1px solid #222', color: index === 0 ? '#333' : '#888', width: '28px', height: '17px', cursor: index === 0 ? 'default' : 'pointer', borderRadius: '3px', fontSize: '0.6rem' }}>
                    ▲
                  </button>
                  <button onClick={() => moveField(index, 'down')} disabled={index === fields.length - 1}
                    style={{ background: '#111', border: '1px solid #222', color: index === fields.length - 1 ? '#333' : '#888', width: '28px', height: '17px', cursor: index === fields.length - 1 ? 'default' : 'pointer', borderRadius: '3px', fontSize: '0.6rem' }}>
                    ▼
                  </button>
                </div>

                {/* Supprimer */}
                <button
                  onClick={() => removeField(index)}
                  style={{
                    background: 'transparent', border: '1px solid #2a2a2a',
                    color: '#555', width: '36px', height: '36px', borderRadius: '6px',
                    cursor: 'pointer', fontSize: '1rem', transition: 'all 0.15s',
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

        {/* Formule */}
        <div style={{ background: '#141414', border: '1px solid #222', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ fontFamily: 'Orbitron', fontSize: '0.8rem', color: '#FFC107', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 6px' }}>
            Formule du score global
          </h3>
          <p style={{ color: '#555', fontSize: '0.85rem', margin: '0 0 20px', lineHeight: 1.5 }}>
            Utilise les clés de tes champs pour écrire la formule. Ex: <code style={{ background: '#1a1a1a', padding: '2px 6px', borderRadius: '3px', color: '#FFC107', fontSize: '0.8rem' }}>(kills + assists * 0.5) / (deaths || 1)</code>
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Label du score */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                Nom du score affiché
              </label>
              <input
                value={formula.label}
                onChange={e => setFormula({ ...formula, label: e.target.value })}
                placeholder="ex: KDA, Score, Moyenne..."
                style={{
                  width: '200px', background: '#0a0a0a', border: '1px solid #333',
                  color: '#e0e0e0', padding: '9px 14px', borderRadius: '6px',
                  fontFamily: 'Rajdhani', fontSize: '1rem', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Expression */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                Expression JavaScript
              </label>
              <input
                value={formula.expression}
                onChange={e => setFormula({ ...formula, expression: e.target.value, type: 'custom' })}
                placeholder="ex: (kills + assists * 0.5) / (deaths || 1)"
                style={{
                  width: '100%', background: '#0a0a0a', border: '1px solid #333',
                  color: '#FFC107', padding: '9px 14px', borderRadius: '6px',
                  fontFamily: 'monospace', fontSize: '0.9rem', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Champs disponibles */}
            {fields.filter(f => f.type !== 'text').length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', color: '#444', marginRight: '4px', alignSelf: 'center' }}>Clés disponibles :</span>
                {fields.filter(f => f.type !== 'text').map(f => (
                  <code
                    key={f.key}
                    onClick={() => setFormula({ ...formula, expression: formula.expression + f.key })}
                    style={{
                      background: '#1a1a1a', border: '1px solid #2a2a2a',
                      color: '#FFC10788', padding: '2px 8px', borderRadius: '4px',
                      fontSize: '0.78rem', cursor: 'pointer',
                    }}
                    title={`Cliquer pour insérer "${f.key}"`}
                  >
                    {f.key}
                  </code>
                ))}
              </div>
            )}

            {/* Prévisualisation */}
            {formulaPreview && (
              <div style={{
                background: '#0d0d0d', border: '1px solid #1a1a1a',
                borderRadius: '8px', padding: '14px 18px',
              }}>
                <div style={{ fontSize: '0.75rem', color: '#444', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                  Test avec valeurs aléatoires
                </div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {Object.entries(formulaPreview.values).map(([key, val]) => (
                    <span key={key} style={{ fontSize: '0.82rem', color: '#666' }}>
                      <span style={{ color: '#FFC10788' }}>{key}</span> = {val}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#666' }}>Résultat :</span>
                  <span style={{ fontFamily: 'Orbitron', fontSize: '1.2rem', color: '#FFC107' }}>
                    {formulaPreview.result}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#444' }}>{formula.label}</span>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}