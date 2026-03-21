'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface FormField {
  id:       string
  label:    string
  type:     'text' | 'textarea' | 'select' | 'checkbox'
  options?: string[]
  required: boolean
}

export function ApplyClient({ community, formFields }: {
  community:  any
  formFields: FormField[]
}) {
  const supabase = createClient()
  const theme    = community.theme_json as {
    primaryColor: string
    accentColor:  string
    font:         string
    darkMode:     boolean
  }

  const bg    = theme.darkMode ? '#0a0a0a' : '#f5f5f5'
  const panel = theme.darkMode ? '#141414' : '#ffffff'
  const text  = theme.darkMode ? '#e0e0e0' : '#1a1a1a'
  const muted = theme.darkMode ? '#666'    : '#999'
  const bord  = theme.darkMode ? '#2a2a2a' : '#e0e0e0'

  const defaultFields: FormField[] = formFields.length > 0 ? formFields : [
    { id: 'motivation', label: 'Pourquoi veux-tu rejoindre ?', type: 'textarea', required: true },
    { id: 'experience', label: 'Parle-nous de ton expérience',  type: 'textarea', required: false },
  ]

  const [answers, setAnswers]     = useState<Record<string, any>>({})
  const [name, setName]           = useState('')
  const [email, setEmail]         = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const handleAnswer = (fieldId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [fieldId]: value }))
  }

  const handleSubmit = async () => {
    setError(null)

    // Validation
    if (!name.trim())  { setError('Ton nom est requis'); return }
    if (!email.trim()) { setError('Ton email est requis'); return }
    for (const field of defaultFields) {
      if (field.required && !answers[field.id]) {
        setError(`Le champ "${field.label}" est requis`)
        return
      }
    }

    setSubmitting(true)

    // Vérifier si l'user est connecté
    const { data: { user } } = await supabase.auth.getUser()

    const { error: insertError } = await supabase
      .from('applications')
      .insert({
        community_id:     community.id,
        applicant_id:     user?.id ?? null,
        applicant_email:  email,
        applicant_name:   name,
        answers,
        status:           'pending',
      })

    if (insertError) {
      setError('Erreur lors de l\'envoi. Réessaie.')
      setSubmitting(false)
      return
    }

    // Notifier l'owner par email (best-effort, ne bloque pas si ça échoue)
    fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'application-submitted',
        payload: {
          communityId:    community.id,
          applicantName:  name,
          applicantEmail: email,
        },
      }),
    }).catch(() => {})

    setSubmitted(true)
    setSubmitting(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: theme.darkMode ? '#0a0a0a' : '#f8f8f8',
    border: `1px solid ${bord}`, color: text,
    padding: '10px 14px', borderRadius: '6px',
    fontFamily: 'Rajdhani', fontSize: '1rem', outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ background: bg, minHeight: '100vh', fontFamily: "'Rajdhani', sans-serif", color: text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Rajdhani:wght@400;600;700&family=Oswald:wght@600&family=Montserrat:wght@600&family=Inter:wght@500;600&display=swap');`}</style>

      {/* Header */}
      <header style={{
        background: theme.darkMode ? '#0d0d0d' : '#fff',
        borderBottom: `2px solid ${theme.primaryColor}`,
        padding: '15px 30px', display: 'flex', alignItems: 'center', gap: '16px',
      }}>
        <Link href={`/c/${community.slug}`} style={{ color: muted, textDecoration: 'none', fontSize: '1.2rem' }}>←</Link>
        {community.logo_url && (
          <img src={community.logo_url} alt="" style={{ width: '34px', height: '34px', borderRadius: '6px', objectFit: 'cover', border: `1px solid ${theme.primaryColor}` }} />
        )}
        <h1 style={{ margin: 0, fontFamily: `'${theme.font}', sans-serif`, fontSize: '1rem', color: theme.darkMode ? 'white' : '#111', textTransform: 'uppercase', letterSpacing: '2px' }}>
          Rejoindre {community.name}
        </h1>
      </header>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '50px 24px' }}>

        {/* Succès */}
        {submitted ? (
          <div style={{
            background: panel, border: `1px solid ${theme.primaryColor}`,
            borderRadius: '16px', padding: '50px 40px', textAlign: 'center',
            boxShadow: `0 0 40px ${theme.primaryColor}18`,
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>✅</div>
            <h2 style={{ fontFamily: `'${theme.font}', sans-serif`, fontSize: '1.2rem', color: theme.darkMode ? 'white' : '#111', textTransform: 'uppercase', margin: '0 0 12px' }}>
              Candidature envoyée !
            </h2>
            <p style={{ color: muted, fontSize: '1rem', lineHeight: 1.6, margin: '0 0 24px' }}>
              L'équipe de <strong style={{ color: theme.primaryColor }}>{community.name}</strong> examinera ta candidature et te contactera par email.
            </p>
            <Link href={`/c/${community.slug}`} style={{
              display: 'inline-block', background: theme.primaryColor,
              color: '#000', fontFamily: `'${theme.font}', sans-serif`,
              fontWeight: 'bold', padding: '11px 26px', borderRadius: '4px',
              textDecoration: 'none', textTransform: 'uppercase', fontSize: '0.82rem',
            }}>
              Retour à la vitrine
            </Link>
          </div>
        ) : (
          <div style={{ background: panel, border: `1px solid ${bord}`, borderRadius: '16px', padding: '36px', boxShadow: theme.darkMode ? '0 0 30px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.08)' }}>

            {/* Titre */}
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ fontFamily: `'${theme.font}', sans-serif`, fontSize: '1.3rem', color: theme.darkMode ? 'white' : '#111', textTransform: 'uppercase', margin: '0 0 8px', letterSpacing: '1px' }}>
                Formulaire de candidature
              </h2>
              {community.description && (
                <p style={{ color: muted, fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>{community.description}</p>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Infos de base */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: muted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                    Ton nom / pseudo <span style={{ color: theme.primaryColor }}>*</span>
                  </label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="John_Doe"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: muted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                    Email <span style={{ color: theme.primaryColor }}>*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Champs dynamiques */}
              {defaultFields.map(field => (
                <div key={field.id}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: muted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                    {field.label} {field.required && <span style={{ color: theme.primaryColor }}>*</span>}
                  </label>

                  {field.type === 'textarea' && (
                    <textarea
                      value={answers[field.id] ?? ''}
                      onChange={e => handleAnswer(field.id, e.target.value)}
                      rows={4}
                      style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                    />
                  )}

                  {field.type === 'text' && (
                    <input
                      value={answers[field.id] ?? ''}
                      onChange={e => handleAnswer(field.id, e.target.value)}
                      style={inputStyle}
                    />
                  )}

                  {field.type === 'select' && field.options && (
                    <select
                      value={answers[field.id] ?? ''}
                      onChange={e => handleAnswer(field.id, e.target.value)}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      <option value="">Choisir...</option>
                      {field.options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}

                  {field.type === 'checkbox' && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={answers[field.id] ?? false}
                        onChange={e => handleAnswer(field.id, e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: theme.primaryColor }}
                      />
                      <span style={{ fontSize: '0.9rem', color: text }}>Oui</span>
                    </label>
                  )}
                </div>
              ))}

              {/* Erreur */}
              {error && (
                <div style={{
                  background: 'rgba(255,35,68,0.08)', border: '1px solid #FF234433',
                  borderRadius: '8px', padding: '12px 16px',
                  color: '#FF2344', fontSize: '0.88rem',
                }}>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  background: theme.primaryColor, color: '#000', border: 'none',
                  padding: '13px', borderRadius: '6px', cursor: submitting ? 'not-allowed' : 'pointer',
                  fontFamily: `'${theme.font}', sans-serif`, fontWeight: 'bold',
                  fontSize: '0.88rem', textTransform: 'uppercase', letterSpacing: '1px',
                  opacity: submitting ? 0.6 : 1, transition: 'opacity 0.2s',
                }}
              >
                {submitting ? 'Envoi en cours...' : 'Envoyer ma candidature'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
