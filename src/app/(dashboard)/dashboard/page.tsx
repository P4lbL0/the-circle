import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Vérifie si l'user a déjà une communauté
  const { data: community } = await supabase
    .from('communities')
    .select('slug')
    .eq('owner_id', user.id)
    .single()

  if (community) {
    redirect(`/dashboard/${community.slug}`)
  } else {
    redirect('/onboarding')
  }
}