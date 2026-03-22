import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendMagicLinkEmail } from '@/lib/email'

export async function POST(request: Request) {
  const { email, redirectTo } = await request.json()

  if (!email) {
    return NextResponse.json({ error: 'Email requis.' }, { status: 400 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const token_hash = data.properties.hashed_token

  await sendMagicLinkEmail({ email, token_hash, redirectTo })

  return NextResponse.json({ success: true })
}
