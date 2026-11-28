/**
 * Logique pure des tribus privées et des flairs (sans dépendance React ni alias `@/`),
 * pour pouvoir être testée depuis backend/tests/unit/ par import relatif.
 */

export type TribeVisibility = 'public' | 'private';

/** Rôles renvoyés par l'API pour le lecteur courant (null = non membre). */
export type TribeRole = 'owner' | 'moderator' | 'member' | null;

export type JoinActionKind = 'join' | 'request' | 'cancel-request' | 'leave' | 'owner';

export interface JoinAction {
  kind: JoinActionKind;
  label: string;
  /** Texte d'aide (aria-label / title) plus explicite que le libellé. */
  hint: string;
  /** 'primary' = action d'adhésion, 'secondary' = retrait / annulation. */
  tone: 'primary' | 'secondary';
  /** Le propriétaire ne peut pas quitter sa tribu (le backend renvoie 400). */
  disabled: boolean;
}

export interface MembershipState {
  visibility: TribeVisibility;
  joined: boolean;
  requestPending: boolean;
  role: TribeRole;
}

/** Action d'adhésion à proposer selon l'état réel renvoyé par le serveur. */
export function getJoinAction(state: MembershipState): JoinAction {
  if (state.joined) {
    if (state.role === 'owner') {
      return {
        kind: 'owner',
        label: 'Administrateur',
        hint: 'Vous êtes l’administrateur de cette tribu : vous ne pouvez pas la quitter',
        tone: 'secondary',
        disabled: true,
      };
    }
    return { kind: 'leave', label: 'Quitter', hint: 'Quitter la tribu', tone: 'secondary', disabled: false };
  }
  if (state.visibility === 'private') {
    if (state.requestPending) {
      return {
        kind: 'cancel-request',
        label: 'Demande envoyée — annuler',
        hint: 'Annuler ma demande d’adhésion',
        tone: 'secondary',
        disabled: false,
      };
    }
    return {
      kind: 'request',
      label: 'Demander à rejoindre',
      hint: 'Envoyer une demande d’adhésion aux modérateurs',
      tone: 'primary',
      disabled: false,
    };
  }
  return { kind: 'join', label: 'Rejoindre', hint: 'Rejoindre la tribu', tone: 'primary', disabled: false };
}

/** Message de confirmation après une action d'adhésion (réponse de POST /join). */
export function joinResultMessage(result: { joined: boolean; requested?: boolean }): string {
  if (result.joined) return 'Vous avez rejoint la tribu.';
  if (result.requested) return 'Demande envoyée : un modérateur doit l’approuver.';
  return 'Vous êtes déjà membre de cette tribu.';
}

/** Libellé d'accès affiché dans la carte « À propos ». */
export function visibilityLabel(visibility: TribeVisibility | undefined): string {
  return visibility === 'private' ? 'Privée' : 'Publique';
}

export function canModerate(role: TribeRole | string | null | undefined): boolean {
  return role === 'owner' || role === 'moderator';
}

export function isOwner(role: TribeRole | string | null | undefined): boolean {
  return role === 'owner';
}

/** Vrai si l'erreur API est le refus d'accès à une tribu privée (403 TRIBE_PRIVATE). */
export function isTribePrivateError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  return (err as { code?: unknown }).code === 'TRIBE_PRIVATE';
}

export const TRIBE_PRIVATE_NOTICE = 'Tribu privée : demande à rejoindre pour voir le contenu';

// ── Flairs ───────────────────────────────────────────────────

export const FLAIR_DEFAULT_COLOR = '#E27D60';
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export function isValidFlairColor(color: unknown): color is string {
  return typeof color === 'string' && HEX_COLOR.test(color);
}

/** Couleur sûre : jamais une valeur serveur non validée dans un style. */
export function safeFlairColor(color: unknown): string {
  return isValidFlairColor(color) ? color : FLAIR_DEFAULT_COLOR;
}

/** Style inline de la pastille de flair (fond translucide, texte et bordure à la couleur). */
export function flairBadgeStyle(color: unknown): { color: string; backgroundColor: string; borderColor: string } {
  const c = safeFlairColor(color);
  return { color: c, backgroundColor: `${c}1F`, borderColor: `${c}66` };
}

export interface Flair {
  id: string;
  name: string;
  color: string;
}

/** Normalise un flair venant du serveur (null si inutilisable, couleur assainie). */
export function normalizeFlair(raw: unknown): Flair | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as { id?: unknown; name?: unknown; color?: unknown };
  if (typeof r.id !== 'string' || !r.id || typeof r.name !== 'string' || !r.name.trim()) return null;
  return { id: r.id, name: r.name, color: safeFlairColor(r.color) };
}

/** Validation du nom d'un flair côté formulaire (schéma backend : 2 à 24 caractères). */
export function validateFlairName(name: string): string | null {
  const n = name.trim();
  if (n.length < 2) return 'Flair : 2 caractères minimum';
  if (n.length > 24) return 'Flair : 24 caractères maximum';
  return null;
}
