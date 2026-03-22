import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendConfirmationEmail } from '@/lib/email'

export async function POST(request: Request) {
  const { email, password, displayName } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email et mot de passe requis.' }, { status: 400 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'signup',
    email,
    password,
    options: {
      data: { display_name: displayName ?? '' },
    },
  })

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('user already')) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé.' }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const token_hash = data.properties.hashed_token

  await sendConfirmationEmail({ email, displayName: displayName ?? '', token_hash })

  return NextResponse.json({ success: true })
}
