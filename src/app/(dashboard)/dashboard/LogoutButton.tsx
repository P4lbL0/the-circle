'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-lg border border-zinc-700 bg-zinc-800 px-6 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-red-500 hover:text-red-400"
    >
      Se déconnecter
    </button>
  )
}
