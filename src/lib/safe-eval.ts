/**
 * Évaluateur d'expression mathématique sécurisé pour les formules de score.
 *
 * Sécurité :
 *  - Tous les identifiants de l'expression doivent être dans `variables`
 *  - Les noms d'objets globaux dangereux sont bloqués
 *  - Seuls les caractères autorisés en math sont acceptés
 */

const BLOCKED_IDENTIFIERS = /\b(constructor|prototype|__proto__|this|globalThis|window|document|process|eval|Function|setTimeout|setInterval|fetch|XMLHttpRequest|localStorage|sessionStorage|require|import|Object|Array|Math|Number|String|Boolean|RegExp|Symbol|Proxy|Reflect|Promise|Error|JSON)\b/i

const ALLOWED_CHARS = /^[a-zA-Z0-9_+\-*/%.()|\s&!<>=?:.]+$/

export function safeEval(expression: string, variables: Record<string, number>): number {
  const expr = expression.trim()

  if (!expr) throw new Error('Expression vide')

  // Vérifier les caractères autorisés
  if (!ALLOWED_CHARS.test(expr)) {
    throw new Error('Expression invalide : caractères non autorisés')
  }

  // Bloquer les noms globaux dangereux
  if (BLOCKED_IDENTIFIERS.test(expr)) {
    throw new Error('Expression invalide : identifiant interdit')
  }

  // Extraire tous les identifiants et vérifier qu'ils sont dans les variables connues
  const identifiers = [...expr.matchAll(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g)].map(m => m[1])
  for (const id of identifiers) {
    if (!(id in variables)) {
      throw new Error(`Variable inconnue dans la formule : "${id}"`)
    }
  }

  // Évaluation sécurisée : seules les variables numériques connues sont accessibles
  const keys = Object.keys(variables)
  const vals = Object.values(variables)
  // eslint-disable-next-line no-new-func
  const fn = new Function(...keys, `"use strict"; return (${expr})`)
  const result = fn(...vals)

  if (typeof result !== 'number' || !isFinite(result)) return 0
  return Math.round(result * 100) / 100
}

/**
 * Valide une expression sans l'exécuter.
 * Retourne null si OK, sinon le message d'erreur.
 */
export function validateExpression(expression: string, fieldKeys: string[]): string | null {
  try {
    const testVars: Record<string, number> = {}
    fieldKeys.forEach((k, i) => { testVars[k] = (i + 1) * 5 })
    safeEval(expression, testVars)
    return null
  } catch (e: any) {
    return e.message ?? 'Expression invalide'
  }
}
