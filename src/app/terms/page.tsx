import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Conditions d'utilisation — The Circle",
}

export default function TermsPage() {
  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#ccc', fontFamily: 'system-ui, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=swap');
        .legal-container { max-width: 760px; margin: 0 auto; padding: 60px 24px 80px; }
        .legal-title { font-family: 'Orbitron', sans-serif; font-size: 1.6rem; color: white; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px; }
        .legal-subtitle { color: #555; font-size: 0.85rem; margin-bottom: 48px; }
        .legal-section { margin-bottom: 36px; }
        .legal-section h2 { font-size: 1rem; color: #FFC107; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; font-weight: 600; }
        .legal-section p, .legal-section li { font-size: 0.9rem; line-height: 1.7; color: #888; }
        .legal-section ul { padding-left: 20px; }
        .legal-section li { margin-bottom: 6px; }
        .legal-back { display: inline-flex; align-items: center; gap: 8px; color: #444; font-size: 0.85rem; text-decoration: none; margin-bottom: 40px; transition: color 0.15s; }
        .legal-back:hover { color: #FFC107; }
        hr { border: none; border-top: 1px solid #1a1a1a; margin: 36px 0; }
      `}</style>

      <div className="legal-container">
        <Link href="/" className="legal-back">← Retour à l'accueil</Link>

        <h1 className="legal-title">Conditions d'utilisation</h1>
        <p className="legal-subtitle">Dernière mise à jour : mars 2026</p>

        <div className="legal-section">
          <h2>1. Objet</h2>
          <p>
            Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la
            plateforme The Circle, éditée par Angelos Lemire. En créant un compte ou en utilisant le service,
            vous acceptez ces conditions sans réserve.
          </p>
        </div>

        <hr />

        <div className="legal-section">
          <h2>2. Description du service</h2>
          <p>
            The Circle est une plateforme SaaS permettant à des organisateurs de créer et gérer des communautés
            en ligne (clans gaming, équipes sportives, associations, classes). Le service comprend notamment :
          </p>
          <ul>
            <li>Gestion des membres et candidatures</li>
            <li>Organisation d'événements et tournois</li>
            <li>Chat interne par groupes</li>
            <li>Boutique interne avec points</li>
            <li>Statistiques personnalisables</li>
            <li>Annonces et notifications</li>
          </ul>
        </div>

        <hr />

        <div className="legal-section">
          <h2>3. Création de compte</h2>
          <p>
            L'accès au service nécessite la création d'un compte avec une adresse email valide. Vous vous engagez à
            fournir des informations exactes et à maintenir la confidentialité de vos identifiants.
            Vous êtes responsable de toutes les actions effectuées depuis votre compte.
          </p>
          <p style={{ marginTop: 10 }}>
            The Circle se réserve le droit de suspendre ou supprimer tout compte en cas de non-respect des présentes CGU.
          </p>
        </div>

        <hr />

        <div className="legal-section">
          <h2>4. Règles de conduite</h2>
          <p>En utilisant The Circle, vous vous engagez à ne pas :</p>
          <ul>
            <li>Publier du contenu illégal, haineux, discriminatoire ou à caractère pornographique</li>
            <li>Harceler, menacer ou intimider d'autres utilisateurs</li>
            <li>Usurper l'identité d'une autre personne</li>
            <li>Tenter d'accéder à des données ou fonctionnalités non autorisées</li>
            <li>Utiliser le service à des fins commerciales non autorisées</li>
            <li>Automatiser l'accès au service (bots, scrapers) sans autorisation</li>
          </ul>
        </div>

        <hr />

        <div className="legal-section">
          <h2>5. Contenu utilisateur</h2>
          <p>
            Vous restez propriétaire du contenu que vous publiez sur la plateforme. En le publiant, vous accordez
            à The Circle une licence non exclusive et gratuite pour l'héberger, l'afficher et le distribuer
            dans le cadre du service.
          </p>
          <p style={{ marginTop: 10 }}>
            The Circle ne modère pas le contenu de façon proactive mais se réserve le droit de supprimer
            tout contenu signalé comme illégal ou contraire aux présentes CGU.
          </p>
        </div>

        <hr />

        <div className="legal-section">
          <h2>6. Disponibilité du service</h2>
          <p>
            The Circle s'efforce d'assurer la disponibilité du service 24h/24, 7j/7, mais ne peut garantir
            une disponibilité sans interruption. Des maintenances peuvent être effectuées, de préférence
            en dehors des heures de pointe.
          </p>
        </div>

        <hr />

        <div className="legal-section">
          <h2>7. Limitation de responsabilité</h2>
          <p>
            The Circle ne peut être tenu responsable des dommages indirects résultant de l'utilisation
            ou de l'impossibilité d'utiliser le service, ni du contenu publié par les utilisateurs ou
            les administrateurs de communautés.
          </p>
        </div>

        <hr />

        <div className="legal-section">
          <h2>8. Modification des CGU</h2>
          <p>
            The Circle se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs
            seront informés par email ou notification dans l'application. La poursuite de l'utilisation
            du service après modification vaut acceptation des nouvelles conditions.
          </p>
        </div>

        <hr />

        <div className="legal-section">
          <h2>9. Responsabilité des organisateurs de communauté</h2>
          <p>
            Toute personne créant une communauté sur The Circle (ci-après « l'Organisateur ») agit en tant que
            responsable de traitement au sens du RGPD pour les données qu'il collecte sur ses membres.
            The Circle fournit uniquement l'outil technique et n'assume aucune responsabilité éditoriale
            sur le contenu des communautés.
          </p>
          <p style={{ marginTop: 10 }}>L'Organisateur s'engage notamment à :</p>
          <ul>
            <li>Ne pas collecter de données sensibles dans les champs de statistiques personnalisées (données de santé, opinions politiques, convictions religieuses, origines ethniques, etc.)</li>
            <li>Informer ses membres des données collectées et de leur finalité</li>
            <li>Respecter les droits des membres (accès, rectification, suppression) sur demande</li>
            <li>Ne pas partager les données de ses membres avec des tiers sans consentement</li>
          </ul>
          <p style={{ marginTop: 10 }}>
            The Circle se réserve le droit de supprimer sans préavis toute communauté dont le contenu ou
            les pratiques de collecte de données ne respectent pas les présentes CGU ou la réglementation en vigueur.
          </p>
        </div>

        <hr />

        <div className="legal-section">
          <h2>10. Suppression du compte</h2>
          <p>
            Vous pouvez supprimer votre compte directement depuis votre espace personnel
            (<a href="/account" style={{ color: '#FFC107' }}>Mon compte</a>).
            Vos données seront supprimées immédiatement, sauf obligation légale de conservation.
            Vous pouvez également contacter{' '}
            <a href="mailto:thecircle.contact@gmail.com" style={{ color: '#FFC107' }}>thecircle.contact@gmail.com</a>.
          </p>
        </div>

        <hr />

        <div className="legal-section">
          <h2>11. Droit applicable</h2>
          <p>
            Les présentes CGU sont soumises au droit français. En cas de litige, et à défaut de résolution amiable,
            les tribunaux français seront compétents.
          </p>
        </div>

        <hr />

        <div className="legal-section">
          <h2>Contact</h2>
          <p>Pour toute question relative aux présentes CGU : <a href="mailto:thecircle.contact@gmail.com" style={{ color: '#FFC107' }}>thecircle.contact@gmail.com</a></p>
        </div>
      </div>
    </div>
  )
}
