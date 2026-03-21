export type Tier = 'free' | 'starter' | 'pro'

// ── Limites membres ────────────────────────────────────────
export const MEMBER_LIMITS: Record<Tier, number> = {
  free:    30,
  starter: 150,
  pro:     Infinity,
}

// ── Limites souples (création de contenu) ─────────────────
export const SOFT_LIMITS: Record<Tier, {
  active_events: number
  chat_groups:   number
  shop_items:    number
}> = {
  free:    { active_events: 5,        chat_groups: 3,        shop_items: 10       },
  starter: { active_events: Infinity, chat_groups: Infinity, shop_items: Infinity },
  pro:     { active_events: Infinity, chat_groups: Infinity, shop_items: Infinity },
}

// ── Accès modules ─────────────────────────────────────────
export const MODULE_ACCESS: Record<Tier, {
  tournaments:   boolean
  physical_shop: boolean
  analytics:     boolean
  export_csv:    boolean
}> = {
  free:    { tournaments: false, physical_shop: false, analytics: false, export_csv: false },
  starter: { tournaments: true,  physical_shop: false, analytics: true,  export_csv: false },
  pro:     { tournaments: true,  physical_shop: true,  analytics: true,  export_csv: true  },
}

// ── Helpers ───────────────────────────────────────────────
export function getMemberLimit(tier: string): number {
  return MEMBER_LIMITS[(tier as Tier)] ?? 30
}

export function getSoftLimit(tier: string, feature: keyof typeof SOFT_LIMITS.free): number {
  return SOFT_LIMITS[(tier as Tier)]?.[feature] ?? SOFT_LIMITS.free[feature]
}

export function canAccess(tier: string, feature: keyof typeof MODULE_ACCESS.free): boolean {
  return MODULE_ACCESS[(tier as Tier)]?.[feature] ?? false
}
