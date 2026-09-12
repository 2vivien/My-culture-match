import { eq } from 'drizzle-orm';
import { db, schema } from '../../infrastructure/database';
import { AppError } from '../../shared/utils/AppError';
import { isAdult, calculateAge } from '../../shared/utils/age';
import { generateUsernameSuggestions } from '../../shared/utils/usernames';
import type { OnboardingInput } from './onboarding.schemas';

function dicebearAvatar(seed: string): string {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}

async function usernameIsTaken(username: string): Promise<boolean> {
  const [row] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.username, username))
    .limit(1);
  return Boolean(row);
}

/** Suggère 3 usernames libres à partir d'une base. */
export async function availableUsernameSuggestions(base: string): Promise<string[]> {
  const suggestions: string[] = [];
  for (const candidate of generateUsernameSuggestions(base)) {
    if (suggestions.length >= 3) break;
    if (!(await usernameIsTaken(candidate))) suggestions.push(candidate);
  }
  return suggestions;
}

export interface OnboardedUserDto {
  id: string;
  email: string;
  username: string;
  name: string;
  avatar: string | null;
  avatarSeed: string | null;
  level: number;
  xp: number;
  glow: string;
  gender: string | null;
  seeking: string | null;
  intention: string | null;
  profileCompleted: boolean;
  createdAt: string;
}

/** Projection sûre : n'expose jamais les champs sensibles (2FA, verrouillage, bannissement). */
function toSafeUser(user: schema.User): OnboardedUserDto {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    name: user.name,
    avatar: user.avatar,
    avatarSeed: user.avatarSeed,
    level: user.level,
    xp: user.xp,
    glow: user.glow,
    gender: user.gender,
    seeking: user.seeking,
    intention: user.intention,
    profileCompleted: user.profileCompleted,
    createdAt: user.createdAt.toISOString(),
  };
}

/** Traite l'onboarding en 7 étapes : valide les règles métier et remplit le profil. */
export async function completeOnboarding(input: OnboardingInput): Promise<OnboardedUserDto> {
  const [existing] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, input.email))
    .limit(1);

  if (!existing) {
    throw AppError.notFound('Aucun compte pour cet email. Connectez-vous d’abord.', 'ACCOUNT_NOT_FOUND');
  }
  if (existing.profileCompleted) {
    throw AppError.conflict('Compte déjà existant, profil déjà complété', 'ALREADY_ONBOARDED');
  }

  // Âge minimum
  if (!isAdult(input.birthdate)) {
    throw AppError.forbidden('Vous devez avoir au moins 16 ans', 'UNDERAGE');
  }

  // Username unique
  if (await usernameIsTaken(input.username)) {
    const suggestions = await availableUsernameSuggestions(input.username);
    throw AppError.conflict(
      'Ce username est déjà pris',
      'USERNAME_TAKEN',
      { suggestions },
    );
  }

  const age = calculateAge(input.birthdate);
  const avatar = input.avatarSeed ? dicebearAvatar(input.avatarSeed) : null;

  const [updated] = await db
    .update(schema.users)
    .set({
      name: input.name,
      username: input.username,
      avatarSeed: input.avatarSeed,
      avatar,
      gender: input.gender,
      seeking: input.seeking,
      birthdate: input.birthdate,
      age,
      roots: input.roots,
      country: input.roots.country,
      region: input.roots.region ?? null,
      ethnicity: input.roots.ethnicity ?? null,
      village: input.roots.village ?? null,
      location: input.location ?? existing.location,
      languages: input.languages,
      intention: input.intention,
      acceptedTermsAt: input.acceptedTermsAt,
      profileCompleted: true,
      level: 1,
      glow: 'none',
      xp: 0,
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, existing.id))
    .returning();

  // Vecteur de profil initial (vide, rempli par le Culture Engine)
  await db
    .insert(schema.userProfileVectors)
    .values({ userId: existing.id, vector: {}, updatedAt: new Date() })
    .onConflictDoNothing();

  return toSafeUser(updated!);
}
