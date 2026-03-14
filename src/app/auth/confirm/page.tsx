'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Page intermédiaire pour les navigateurs in-app (Snap, WhatsApp...)
// qui bloquent les cookies sur le callback serveur
export default function ConfirmPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const supabase = createClient()
    const token_hash = searchParams.get('token_hash')
    const type       = searchParams.get('type') as 'magiclink' | 'email' | null
    const next       = searchParams.get('next') ?? '/dashboard'

    async function confirm() {
      if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({ token_hash, type })
        if (!error) {
          router.replace(next)
          return
        }
      }
      router.replace('/login?error=link_expired')
    }

    confirm()
  }, [])

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Rajdhani, sans-serif',
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Rajdhani:wght@600&display=swap');`}</style>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '48px', height: '48px', border: '3px solid #FFC107',
          borderTopColor: 'transparent', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite', margin: '0 auto 20px',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <p style={{ color: '#FFC107', fontFamily: 'Orbitron', fontSize: '0.75rem', letterSpacing: '2px', textTransform: 'uppercase' }}>
          Connexion en cours…
        </p>
      </div>
    </div>
  )
}
