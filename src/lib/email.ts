import { Resend } from 'resend'

const FROM = 'The Circle <noreply@the-circle.pro>'
// Initialisation lazy — évite le crash au build si RESEND_API_KEY absent
function getResend() {
  if (!process.env.RESEND_API_KEY) return null
  return new Resend(process.env.RESEND_API_KEY)
}

// ── Confirmation d'inscription (→ nouvel utilisateur) ────
export async function sendConfirmationEmail({
  email,
  displayName,
  token_hash,
}: {
  email:       string
  displayName: string
  token_hash:  string
}) {
  const resend = getResend()
  if (!resend) return
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://the-circle.vercel.app'
  const confirmUrl = `${siteUrl}/auth/confirm?token_hash=${token_hash}&type=signup`

  return resend.emails.send({
    from:    FROM,
    to:      email,
    subject: 'Confirme ton adresse email — The Circle',
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
        <h2 style="color:#FFC107">The Circle</h2>
        <p>Bonjour${displayName ? ` <strong>${displayName}</strong>` : ''} !</p>
        <p>Clique sur le bouton ci-dessous pour confirmer ton adresse email et activer ton compte.</p>
        <a href="${confirmUrl}"
           style="display:inline-block;background:#FFC107;color:#000;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin-top:16px">
          Confirmer mon email →
        </a>
        <p style="color:#999;font-size:0.82rem;margin-top:32px">
          Si tu n'as pas créé de compte, ignore cet email.<br/>
          The Circle · ta communauté, tes règles.
        </p>
      </div>
    `,
  })
}

// ── Magic link (→ rejoindre communauté / connexion) ──────
export async function sendMagicLinkEmail({
  email,
  token_hash,
  redirectTo,
}: {
  email:      string
  token_hash: string
  redirectTo: string
}) {
  const resend = getResend()
  if (!resend) return
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://the-circle.vercel.app'
  const magicUrl = `${siteUrl}/auth/confirm?token_hash=${token_hash}&type=magiclink&next=${encodeURIComponent(redirectTo)}`

  return resend.emails.send({
    from:    FROM,
    to:      email,
    subject: 'Ton lien de connexion — The Circle',
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
        <h2 style="color:#FFC107">The Circle</h2>
        <p>Clique sur le bouton ci-dessous pour rejoindre la communauté. Ce lien est valable 1 heure.</p>
        <a href="${magicUrl}"
           style="display:inline-block;background:#FFC107;color:#000;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin-top:16px">
          Rejoindre la communauté →
        </a>
        <p style="color:#999;font-size:0.82rem;margin-top:32px">
          Si tu n'as pas demandé ce lien, ignore cet email.<br/>
          The Circle · ta communauté, tes règles.
        </p>
      </div>
    `,
  })
}

// ── Nouvelle candidature reçue (→ owner) ─────────────────
export async function sendApplicationReceived({
  ownerEmail,
  communityName,
  applicantName,
  applicantEmail,
  communitySlug,
}: {
  ownerEmail:     string
  communityName:  string
  applicantName:  string
  applicantEmail: string
  communitySlug:  string
}) {
  const resend = getResend()
  if (!resend) return
  return resend.emails.send({
    from:    FROM,
    to:      ownerEmail,
    subject: `Nouvelle candidature pour ${communityName}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
        <h2 style="color:#FFC107">📋 Nouvelle candidature</h2>
        <p><strong>${applicantName}</strong> (${applicantEmail}) vient de postuler pour rejoindre <strong>${communityName}</strong>.</p>
        <a href="https://thecircle.app/dashboard/${communitySlug}/applications"
           style="display:inline-block;background:#FFC107;color:#000;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin-top:16px">
          Voir la candidature →
        </a>
        <p style="color:#999;font-size:0.82rem;margin-top:32px">The Circle · ta communauté, tes règles.</p>
      </div>
    `,
  })
}

// ── Décision candidature (→ candidat) ────────────────────
export async function sendApplicationDecision({
  applicantEmail,
  applicantName,
  communityName,
  communitySlug,
  accepted,
  notes,
}: {
  applicantEmail: string
  applicantName:  string
  communityName:  string
  communitySlug:  string
  accepted:       boolean
  notes?:         string | null
}) {
  const subject = accepted
    ? `✅ Ta candidature chez ${communityName} a été acceptée !`
    : `Ta candidature chez ${communityName}`

  const body = accepted
    ? `<p>Bonne nouvelle ! Ta candidature pour rejoindre <strong>${communityName}</strong> a été <strong style="color:#4CAF50">acceptée</strong>.</p>
       <a href="https://thecircle.app/c/${communitySlug}"
          style="display:inline-block;background:#FFC107;color:#000;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin-top:16px">
         Accéder à la communauté →
       </a>`
    : `<p>Ta candidature pour rejoindre <strong>${communityName}</strong> n'a pas été retenue cette fois.</p>
       ${notes ? `<p style="color:#666;font-style:italic">"${notes}"</p>` : ''}`

  const resend = getResend()
  if (!resend) return
  return resend.emails.send({
    from:    FROM,
    to:      applicantEmail,
    subject,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
        <h2 style="color:#FFC107">The Circle</h2>
        <p>Bonjour <strong>${applicantName}</strong>,</p>
        ${body}
        <p style="color:#999;font-size:0.82rem;margin-top:32px">The Circle · ta communauté, tes règles.</p>
      </div>
    `,
  })
}

// ── Bienvenue nouveau membre (→ membre) ──────────────────
export async function sendWelcomeEmail({
  memberEmail,
  memberName,
  communityName,
  communitySlug,
}: {
  memberEmail:   string
  memberName:    string
  communityName: string
  communitySlug: string
}) {
  const resend = getResend()
  if (!resend) return
  return resend.emails.send({
    from:    FROM,
    to:      memberEmail,
    subject: `Bienvenue dans ${communityName} 🎉`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
        <h2 style="color:#FFC107">Bienvenue, ${memberName} !</h2>
        <p>Tu viens de rejoindre <strong>${communityName}</strong> sur The Circle.</p>
        <a href="https://thecircle.app/c/${communitySlug}"
           style="display:inline-block;background:#FFC107;color:#000;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin-top:16px">
          Voir la communauté →
        </a>
        <p style="color:#999;font-size:0.82rem;margin-top:32px">The Circle · ta communauté, tes règles.</p>
      </div>
    `,
  })
}
