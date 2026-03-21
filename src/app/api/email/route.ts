import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  sendApplicationReceived,
  sendApplicationDecision,
} from '@/lib/email'

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: true }) // silencieux si pas configuré
  }

  try {
    const body = await req.json()
    const { type, payload } = body as { type: string; payload: any }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (type === 'application-submitted') {
      // Récupérer l'email de l'owner
      const { data: community } = await supabase
        .from('communities')
        .select('name, slug, owner_id')
        .eq('id', payload.communityId)
        .single()

      if (community) {
        const { data: ownerProfile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', community.owner_id)
          .single()

        if (ownerProfile?.email) {
          await sendApplicationReceived({
            ownerEmail:     ownerProfile.email,
            communityName:  community.name,
            applicantName:  payload.applicantName,
            applicantEmail: payload.applicantEmail,
            communitySlug:  community.slug,
          })
        }
      }
    }

    if (type === 'application-decision') {
      // Vérifier que l'appelant est bien le owner
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      await sendApplicationDecision({
        applicantEmail: payload.applicantEmail,
        applicantName:  payload.applicantName,
        communityName:  payload.communityName,
        communitySlug:  payload.communitySlug,
        accepted:       payload.accepted,
        notes:          payload.notes,
      })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true }) // ne pas bloquer l'UI si email échoue
  }
}
