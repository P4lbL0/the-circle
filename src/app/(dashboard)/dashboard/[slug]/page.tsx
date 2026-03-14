import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { InviteWidget } from './InviteWidget'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function CommunityDashboardPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Récupère la communauté + vérifie que l'user en est le owner
  const { data: community } = await supabase
    .from('communities')
    .select('*')
    .eq('slug', slug)
    .eq('owner_id', user.id)
    .single()

  if (!community) redirect('/dashboard')

  // Récupère les membres
  const { data: members } = await supabase
    .from('community_members')
    .select('*, profiles(display_name, avatar_url, email)')
    .eq('community_id', community.id)

  // Récupère les modules
  const { data: features } = await supabase
    .from('features')
    .select('*')
    .eq('community_id', community.id)

  const activeModules = features?.filter((f: any) => f.enabled).map((f: any) => f.module) ?? []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {community.logo_url && (
              <img
                src={community.logo_url}
                alt={community.name}
                className="w-10 h-10 rounded-xl object-cover"
              />
            )}
            <div>
              <h1 className="font-bold text-gray-900">{community.name}</h1>
              <p className="text-xs text-gray-400">thecircle.app/c/{community.slug}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium capitalize">
              {community.subscription_tier}
            </span>
            <a
              href={`/c/${community.slug}`}
              target="_blank"
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Voir la vitrine →
            </a>
            <a
              href={`/dashboard/${community.slug}/appearance`}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              🎨 Apparence
            </a>
            <a
              href={`/dashboard/${community.slug}/members`}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              👥 Membres
            </a>
            <a
              href={`/dashboard/${community.slug}/modules`}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              🧩 Modules
            </a>
            <a
              href={`/dashboard/${community.slug}/stats`}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              📊 Stats
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* Stats rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Membres actifs', value: members?.filter((m: any) => m.role !== 'pending').length ?? 0, icon: '👥' },
            { label: 'En attente', value: members?.filter((m: any) => m.role === 'pending').length ?? 0, icon: '⏳' },
            { label: 'Modules actifs', value: activeModules.length, icon: '🧩' },
            { label: 'Plan', value: community.subscription_tier, icon: '⭐' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Membres */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900">Membres</h2>
            <InviteWidget slug={community.slug} communityName={community.name} />
          </div>

          {members && members.length > 0 ? (
            <div className="space-y-2">
              {members.map((member: any) => (
                <div key={member.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">
                      {member.profiles?.avatar_url
                        ? <img src={member.profiles.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
                        : member.profiles?.display_name?.[0]?.toUpperCase() ?? '?'
                      }
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {member.profiles?.display_name ?? member.profiles?.email}
                      </div>
                      <div className="text-xs text-gray-400">{member.profiles?.email}</div>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    member.role === 'owner'     ? 'bg-purple-100 text-purple-700' :
                    member.role === 'moderator' ? 'bg-blue-100 text-blue-700' :
                    member.role === 'pending'   ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-6">Aucun membre pour l'instant.</p>
          )}
        </div>

        {/* Modules */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-5">Modules</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {features?.map((feature: any) => (
              <div key={feature.module} className={`p-4 rounded-xl border-2 ${
                feature.enabled ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="text-sm font-medium text-gray-900 capitalize">{feature.module}</div>
                <div className={`text-xs mt-1 ${feature.enabled ? 'text-blue-600' : 'text-gray-400'}`}>
                  {feature.enabled ? '● Actif' : '○ Inactif'}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
