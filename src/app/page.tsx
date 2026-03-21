import Link from 'next/link'

const USE_CASES = [
  {
    type: 'Clan Gaming',
    icon: '🎮',
    desc: 'Classements KDA, tournois bracket, paris sur les matchs, boutique de skins.',
    stats: ['Kills / Deaths / Assists', 'Classement ELO', 'Tournois élimination directe'],
    color: '#a855f7',
  },
  {
    type: 'Équipe Sportive',
    icon: '⚽',
    desc: 'Suivi buts & passes, calendrier des matchs, gestion des licenciés.',
    stats: ['Buts / Passes / Minutes', 'Calendrier saison', 'Classement général'],
    color: '#22c55e',
  },
  {
    type: 'Classe / École',
    icon: '📚',
    desc: 'Notes par matière, agenda, chat de classe, association parents-élèves.',
    stats: ['Moyenne par matière', 'Agenda scolaire', 'Chat privé'],
    color: '#3b82f6',
  },
  {
    type: 'Association',
    icon: '🤝',
    desc: 'Adhérents, événements, boutique de goodies, chat de discussion.',
    stats: ['Gestion adhérents', 'Événements & RSVP', 'Boutique interne'],
    color: '#f97316',
  },
]

const FEATURES = [
  {
    icon: '📊',
    title: 'Stats & Classements',
    desc: 'Définissez vos propres métriques et formules de score. Chaque communauté a ses propres indicateurs de performance.',
  },
  {
    icon: '🏆',
    title: 'Tournois & Compétitions',
    desc: 'Organisez des brackets, round-robin ou double élimination. Gérez les scores et classez automatiquement.',
  },
  {
    icon: '📅',
    title: 'Événements & RSVP',
    desc: 'Planifiez, partagez et gérez les participations. Événements récurrents, en ligne ou en présentiel.',
  },
  {
    icon: '💬',
    title: 'Chat groupe',
    desc: 'Messagerie temps réel style Messenger. Groupes de discussion, bulles, avatars, modération. Public ou réservé aux membres.',
  },
  {
    icon: '🛒',
    title: 'Boutique de récompenses',
    desc: 'Système de points internes. Récompensez vos membres avec des badges, cosmétiques ou articles physiques.',
  },
  {
    icon: '📋',
    title: 'Candidatures',
    desc: 'Formulaire de recrutement personnalisé. Questionnaire, validation manuelle, intégration automatique.',
  },
  {
    icon: '🎨',
    title: 'Identité visuelle',
    desc: 'Thème 100% custom : couleurs, police, logo, bannière. Votre vitrine reflète votre identité.',
  },
  {
    icon: '🔐',
    title: 'Contrôle total',
    desc: 'Confidentialité configurable, rôles et permissions, modules activables à la carte.',
  },
]

const STEPS = [
  {
    num: '01',
    title: 'Créez votre espace',
    desc: 'Nommez votre communauté, choisissez votre type, définissez vos métriques. Moins de 3 minutes.',
  },
  {
    num: '02',
    title: 'Personnalisez tout',
    desc: 'Couleurs, police, logo, modules actifs. Votre vitrine ressemble exactement à ce que vous imaginez.',
  },
  {
    num: '03',
    title: 'Invitez vos membres',
    desc: 'Partagez votre lien d\'invitation. Les membres rejoignent, suivent leurs stats et participent.',
  },
]

const PLANS = [
  {
    name: 'Free',
    price: '0€',
    period: '',
    color: '#525252',
    highlight: false,
    features: [
      '1 communauté',
      '30 membres max',
      'Stats & Classement',
      'Événements (5 actifs max)',
      'Chat groupe (3 groupes max)',
      'Boutique virtuelle (10 articles max)',
      'Candidatures',
      'Vitrine publique /c/slug',
    ],
    cta: 'Commencer gratuitement',
  },
  {
    name: 'Starter',
    price: '5€',
    period: '/mois',
    color: '#3b82f6',
    highlight: false,
    features: [
      '3 communautés',
      '150 membres max',
      'Tournois & Brackets',
      'Paris internes',
      'Événements & Chat illimités',
      'Boutique virtuelle illimitée',
      'Sous-domaine slug.thecircle.app',
      'Support prioritaire',
    ],
    cta: 'Essayer Starter',
  },
  {
    name: 'Pro',
    price: '15€',
    period: '/mois',
    color: '#FFC107',
    highlight: true,
    features: [
      'Communautés illimitées',
      'Membres illimités',
      'Tous les modules',
      'Boutique articles physiques',
      'Domaine personnalisé',
      'Export CSV',
      'Branding supprimé',
      'Support dédié',
    ],
    cta: 'Passer Pro',
  },
]

export default function Home() {
  return (
    <div style={{
      background: '#09090b',
      minHeight: '100vh',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      color: '#fafafa',
      overflowX: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(255,193,7,0.25); }
        .nav-link { color: #71717a; text-decoration: none; font-size: 0.875rem; font-weight: 500; transition: color 0.15s; }
        .nav-link:hover { color: #fafafa; }
        .btn-primary { display: inline-flex; align-items: center; gap: 8px; background: #fafafa; color: #09090b; border: none; padding: 12px 24px; border-radius: 8px; font-size: 0.875rem; font-weight: 600; text-decoration: none; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
        .btn-primary:hover { background: #e4e4e7; }
        .btn-ghost { display: inline-flex; align-items: center; gap: 8px; background: transparent; color: #71717a; border: 1px solid #27272a; padding: 12px 24px; border-radius: 8px; font-size: 0.875rem; font-weight: 500; text-decoration: none; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
        .btn-ghost:hover { border-color: #52525b; color: #fafafa; }
        .btn-accent { display: inline-flex; align-items: center; gap: 8px; background: #FFC107; color: #09090b; border: none; padding: 12px 24px; border-radius: 8px; font-size: 0.875rem; font-weight: 700; text-decoration: none; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
        .btn-accent:hover { background: #e6ac00; }
        .feature-card { background: #111113; border: 1px solid #1c1c1f; border-radius: 16px; padding: 28px; transition: border-color 0.2s, transform 0.2s; }
        .feature-card:hover { border-color: #3f3f46; transform: translateY(-2px); }
        .use-case-card { background: #111113; border: 1px solid #1c1c1f; border-radius: 16px; padding: 24px; transition: border-color 0.2s; }
        .step-num { font-family: 'Inter', sans-serif; font-size: 3.5rem; font-weight: 900; opacity: 0.08; line-height: 1; }
        /* ── Responsive ── */
        .lp-nav-links { display: flex; gap: 28px; align-items: center; }
        .lp-section-pad { padding: 80px 24px; }
        .lp-features-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
        .lp-usecases-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .lp-plans-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .lp-steps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
        @media (max-width: 900px) {
          .lp-usecases-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .lp-plans-grid { grid-template-columns: 1fr !important; max-width: 420px; margin: 0 auto; }
          .lp-steps-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .lp-nav-links .nav-link { display: none; }
          .lp-nav-links .btn-primary { display: none; }
          .lp-nav-cta { display: inline-flex !important; }
          .lp-section-pad { padding: 60px 16px !important; }
          .lp-usecases-grid { grid-template-columns: 1fr !important; }
          .lp-features-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 200,
        background: 'rgba(9,9,11,0.8)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid #18181b',
        padding: '0 40px', height: '60px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '0.95rem', fontWeight: 900,
          color: '#FFC107', letterSpacing: '4px', textTransform: 'uppercase',
        }}>
          THE CIRCLE
        </span>
        <div className="lp-nav-links">
          <a href="#features" className="nav-link">Fonctionnalités</a>
          <a href="#pricing" className="nav-link">Tarifs</a>
          <Link href="/login" className="nav-link">Connexion</Link>
          <Link href="/signup" className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.82rem' }}>
            Créer mon espace
          </Link>
          <Link href="/signup" className="lp-nav-cta btn-accent" style={{ display: 'none', padding: '8px 16px', fontSize: '0.8rem' }}>
            Commencer
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', padding: '110px 24px 90px', textAlign: 'center', overflow: 'hidden' }}>
        {/* Glow */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '600px', height: '400px', background: 'radial-gradient(ellipse at center, rgba(255,193,7,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: '820px', margin: '0 auto' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255,193,7,0.08)', border: '1px solid rgba(255,193,7,0.2)',
            borderRadius: '999px', padding: '5px 14px', marginBottom: '32px',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FFC107', display: 'inline-block' }} />
            <span style={{ fontSize: '0.78rem', color: '#d4a017', fontWeight: 500, letterSpacing: '0.5px' }}>
              Pour toutes vos communautés — Gaming, Sport, École, Association
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.8rem, 7vw, 5.2rem)',
            fontWeight: 900, lineHeight: 1.05,
            letterSpacing: '-0.03em', marginBottom: '24px',
          }}>
            Gérez votre communauté.{' '}
            <span style={{ color: 'transparent', WebkitBackgroundClip: 'text', backgroundClip: 'text', backgroundImage: 'linear-gradient(135deg, #FFC107, #ff9500)' }}>
              Simplement.
            </span>
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.2rem)',
            color: '#71717a', lineHeight: 1.75,
            maxWidth: '600px', margin: '0 auto 44px',
          }}>
            The Circle est la plateforme tout-en-un pour créer et gérer n'importe quelle communauté.
            Classements, événements, tournois, chat groupe, boutique — tout personnalisable.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" className="btn-accent">
              Créer ma communauté — c'est gratuit
            </Link>
            <Link href="/login" className="btn-ghost">
              Se connecter
            </Link>
          </div>

          {/* Community type pills */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '52px' }}>
            {USE_CASES.map(uc => (
              <div key={uc.type} style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                background: '#111113', border: '1px solid #27272a',
                borderRadius: '999px', padding: '7px 16px',
                fontSize: '0.82rem', color: '#a1a1aa',
              }}>
                <span>{uc.icon}</span>
                <span>{uc.type}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── USE CASES ── */}
      <section style={{ padding: '80px 24px', borderTop: '1px solid #18181b' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <p style={{ fontSize: '0.78rem', color: '#52525b', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600, marginBottom: '12px' }}>Cas d'usage</p>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '14px' }}>
              Conçu pour s'adapter à vous
            </h2>
            <p style={{ color: '#71717a', maxWidth: '480px', margin: '0 auto', fontSize: '0.95rem', lineHeight: 1.7 }}>
              Chaque type de communauté a ses propres besoins. The Circle s'adapte à vos métriques, pas l'inverse.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
            {USE_CASES.map(uc => (
              <div key={uc.type} className="use-case-card">
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px', marginBottom: '18px',
                  background: `${uc.color}15`, border: `1px solid ${uc.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.4rem',
                }}>
                  {uc.icon}
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '10px', color: '#fafafa' }}>{uc.type}</h3>
                <p style={{ fontSize: '0.875rem', color: '#71717a', lineHeight: 1.6, marginBottom: '18px' }}>{uc.desc}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {uc.stats.map(s => (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#52525b' }}>
                      <span style={{ color: uc.color, fontSize: '0.6rem' }}>●</span>
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: '80px 24px', borderTop: '1px solid #18181b' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <p style={{ fontSize: '0.78rem', color: '#52525b', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600, marginBottom: '12px' }}>Fonctionnalités</p>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '14px' }}>
              Tout ce dont vous avez besoin, rien de plus
            </h2>
            <p style={{ color: '#71717a', maxWidth: '480px', margin: '0 auto', fontSize: '0.95rem', lineHeight: 1.7 }}>
              Activez uniquement les modules dont vous avez besoin. Chaque fonctionnalité est pensée pour l'engagement de vos membres.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
            {FEATURES.map((feat, i) => (
              <div key={feat.title} className="feature-card" style={{ gridColumn: i === 0 ? 'span 1' : undefined }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px', marginBottom: '18px',
                  background: '#1c1c1f', border: '1px solid #27272a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.2rem',
                }}>
                  {feat.icon}
                </div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fafafa', marginBottom: '8px' }}>{feat.title}</h3>
                <p style={{ fontSize: '0.85rem', color: '#52525b', lineHeight: 1.65 }}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '80px 24px', borderTop: '1px solid #18181b', background: '#0d0d10' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <p style={{ fontSize: '0.78rem', color: '#52525b', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600, marginBottom: '12px' }}>Comment ça marche</p>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Lancé en 3 étapes
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '2px' }}>
            {STEPS.map((step, i) => (
              <div key={step.num} style={{
                background: '#111113', border: '1px solid #1c1c1f',
                borderRadius: i === 0 ? '16px 0 0 16px' : i === STEPS.length - 1 ? '0 16px 16px 0' : '0',
                padding: '36px 28px', position: 'relative', overflow: 'hidden',
              }}>
                <div className="step-num" style={{ position: 'absolute', top: '12px', right: '16px', color: '#fafafa' }}>{step.num}</div>
                <div style={{ width: '32px', height: '2px', background: '#FFC107', marginBottom: '24px', borderRadius: '2px' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fafafa', marginBottom: '10px' }}>{step.title}</h3>
                <p style={{ fontSize: '0.875rem', color: '#52525b', lineHeight: 1.65 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: '80px 24px', borderTop: '1px solid #18181b' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <p style={{ fontSize: '0.78rem', color: '#52525b', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600, marginBottom: '12px' }}>Tarifs</p>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '14px' }}>
              Commencez gratuitement, scalez à votre rythme
            </h2>
            <p style={{ color: '#71717a', fontSize: '0.95rem' }}>Sans engagement. Changez de plan à tout moment.</p>
          </div>

          <div className="lp-plans-grid" style={{ gap: '14px' }}>
            {PLANS.map(plan => (
              <div key={plan.name} style={{
                background: plan.highlight ? '#111113' : '#0d0d10',
                border: `1px solid ${plan.highlight ? 'rgba(255,193,7,0.25)' : '#1c1c1f'}`,
                borderRadius: '20px', padding: '32px',
                position: 'relative', display: 'flex', flexDirection: 'column',
                boxShadow: plan.highlight ? '0 0 60px rgba(255,193,7,0.06)' : 'none',
              }}>
                {plan.highlight && (
                  <div style={{
                    position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                    background: '#FFC107', color: '#09090b', fontSize: '0.7rem',
                    fontWeight: 700, padding: '4px 16px', borderRadius: '999px',
                    letterSpacing: '0.5px', whiteSpace: 'nowrap',
                  }}>
                    Le plus populaire
                  </div>
                )}

                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: plan.color, display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '1px' }}>{plan.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: '2.8rem', fontWeight: 900, color: '#fafafa', letterSpacing: '-0.03em' }}>{plan.price}</span>
                    {plan.period && <span style={{ fontSize: '0.875rem', color: '#52525b' }}>{plan.period}</span>}
                  </div>
                </div>

                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '11px', marginBottom: '28px', flex: 1 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '0.875rem', color: '#71717a' }}>
                      <span style={{ color: plan.color, flexShrink: 0, marginTop: '1px', fontSize: '0.75rem' }}>✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className={plan.highlight ? 'btn-accent' : 'btn-ghost'}
                  style={{ justifyContent: 'center', width: '100%' }}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MODULAR HIGHLIGHT ── */}
      <section style={{ padding: '80px 24px', borderTop: '1px solid #18181b', background: '#0d0d10' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <div style={{ background: '#111113', border: '1px solid #1c1c1f', borderRadius: '24px', padding: '52px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 44px)', gap: '8px', justifyContent: 'center' }}>
              {['📊','🏆','📅','💬','🛒','📋','🎨','🔐'].map((icon, i) => (
                <div key={i} style={{ width: '44px', height: '44px', background: '#1c1c1f', border: '1px solid #27272a', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                  {icon}
                </div>
              ))}
            </div>
            <div>
              <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '14px' }}>
                100% modulaire. 0% superflu.
              </h2>
              <p style={{ color: '#71717a', maxWidth: '500px', lineHeight: 1.7, fontSize: '0.95rem' }}>
                Activez uniquement les modules dont votre communauté a besoin. Une classe n'a pas besoin de paris, un clan gaming pas de notes. Chaque espace est unique.
              </p>
            </div>
            <Link href="/signup" className="btn-accent">Créer mon espace maintenant</Link>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '100px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 70% at 50% 100%, rgba(255,193,7,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: '640px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '20px' }}>
            Votre communauté mérite<br />
            <span style={{ color: 'transparent', WebkitBackgroundClip: 'text', backgroundClip: 'text', backgroundImage: 'linear-gradient(135deg, #FFC107, #ff9500)' }}>
              mieux qu'un groupe Discord
            </span>
          </h2>
          <p style={{ color: '#71717a', marginBottom: '40px', fontSize: '1rem', lineHeight: 1.7 }}>
            Rejoignez des centaines de communautés qui ont déjà créé leur espace sur The Circle.
            Gratuit pour commencer, sans carte bancaire.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" className="btn-accent">
              Créer ma communauté — gratuit
            </Link>
            <Link href="/login" className="btn-ghost">Se connecter</Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid #18181b', padding: '32px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.82rem', color: '#FFC107', letterSpacing: '4px', textTransform: 'uppercase' }}>
          THE CIRCLE
        </span>
        <span style={{ fontSize: '0.8rem', color: '#3f3f46' }}>© 2026 The Circle. Tous droits réservés.</span>
        <div style={{ display: 'flex', gap: '24px' }}>
          <Link href="/login" style={{ color: '#3f3f46', textDecoration: 'none', fontSize: '0.8rem', transition: 'color 0.15s' }}>Connexion</Link>
          <Link href="/signup" style={{ color: '#3f3f46', textDecoration: 'none', fontSize: '0.8rem', transition: 'color 0.15s' }}>Inscription</Link>
        </div>
      </footer>
    </div>
  )
}
