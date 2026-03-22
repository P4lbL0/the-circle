import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  }

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, display_name, email, avatar_url, global_role, created_at')
      .eq('id', user.id)
      .single(),
    supabase
      .from('community_members')
      .select('role, points, badges, custom_stats, is_public, joined_at, communities(name, slug)')
      .eq('profile_id', user.id),
  ])

  const exportData = {
    exported_at:  new Date().toISOString(),
    account: {
      id:           user.id,
      email:        user.email,
      created_at:   user.created_at,
      display_name: profile?.display_name ?? null,
      avatar_url:   profile?.avatar_url ?? null,
    },
    memberships: (memberships ?? []).map(m => ({
      community:    m.communities,
      role:         m.role,
      points:       m.points,
      badges:       m.badges,
      custom_stats: m.custom_stats,
      joined_at:    m.joined_at,
    })),
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type':        'application/json',
      'Content-Disposition': 'attachment; filename="the-circle-mes-donnees.json"',
    },
  })
}
