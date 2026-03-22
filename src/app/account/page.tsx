'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AccountPage() {
  const router = useRouter()
  const [deleting, setDeleting]     = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError]           = useState<string | null>(null)

  async function handleExport() {
    window.location.href = '/api/account/export'
  }

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    const res  = await fetch('/api/account/delete', { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error ?? 'Une erreur est survenue.')
      setDeleting(false)
      return
    }
    router.replace('/?account=deleted')
  }

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#ccc', fontFamily: 'system-ui, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap');
      `}</style>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '60px 24px 80px' }}>
        <Link href="/dashboard" style={{ color: '#444', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block', marginBottom: 40 }}>
          ← Retour au dashboard
        </Link>

        <h1 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '1.4rem', color: 'white', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>
          Mon compte
        </h1>
        <p style={{ color: '#555', fontSize: '0.85rem', marginBottom: 48 }}>Gère tes données personnelles et ton compte.</p>

        {/* Export */}
        <div style={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: 12, padding: '28px 24px', marginBottom: 20 }}>
          <h2 style={{ color: '#FFC107', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, fontWeight: 600 }}>
            Mes données
          </h2>
          <p style={{ color: '#888', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 20 }}>
            Télécharge une copie de toutes tes données personnelles stockées sur The Circle
            (profil, communautés, stats, badges). Fichier JSON.
          </p>
          <button
            onClick={handleExport}
            style={{ background: '#FFC107', color: '#000', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' }}
          >
            ↓ Exporter mes données
          </button>
        </div>

        {/* Liens légaux */}
        <div style={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: 12, padding: '28px 24px', marginBottom: 20 }}>
          <h2 style={{ color: '#FFC107', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, fontWeight: 600 }}>
            Informations légales
          </h2>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Link href="/terms" style={{ color: '#888', fontSize: '0.88rem', textDecoration: 'underline' }}>Conditions d'utilisation</Link>
            <Link href="/privacy" style={{ color: '#888', fontSize: '0.88rem', textDecoration: 'underline' }}>Politique de confidentialité</Link>
            <Link href="/legal" style={{ color: '#888', fontSize: '0.88rem', textDecoration: 'underline' }}>Mentions légales</Link>
          </div>
        </div>

        {/* Suppression */}
        <div style={{ background: '#141414', border: '1px solid #FF234433', borderRadius: 12, padding: '28px 24px' }}>
          <h2 style={{ color: '#FF2344', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, fontWeight: 600 }}>
            Supprimer mon compte
          </h2>
          <p style={{ color: '#888', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 20 }}>
            Cette action est <strong style={{ color: '#ccc' }}>irréversible</strong>. Ton compte,
            ton profil et toutes tes données seront définitivement supprimés.
            Tes communautés créées devront être gérées séparément.
          </p>

          {error && (
            <p style={{ color: '#FF2344', fontSize: '0.85rem', marginBottom: 16 }}>{error}</p>
          )}

          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              style={{ background: 'transparent', color: '#FF2344', border: '1px solid #FF2344', borderRadius: 8, padding: '10px 20px', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}
            >
              Supprimer mon compte
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <p style={{ color: '#FF2344', fontSize: '0.88rem', margin: 0 }}>
                Confirme la suppression définitive :
              </p>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{ background: '#FF2344', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, fontSize: '0.88rem', cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.6 : 1 }}
              >
                {deleting ? 'Suppression…' : 'Oui, supprimer définitivement'}
              </button>
              <button
                onClick={() => setConfirming(false)}
                style={{ background: 'transparent', color: '#555', border: 'none', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Annuler
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
