/** Âge minimum requis pour le produit. */
export const MIN_AGE = 18;

/** Calcule l'âge en années révolues à partir d'une date de naissance. */
export function calculateAge(birthdate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthdate.getFullYear();
  const monthDiff = today.getMonth() - birthdate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdate.getDate())) {
    age -= 1;
  }
  return age;
}

/** Vérifie que l'utilisateur a au moins 18 ans. */
export function isAdult(birthdate: Date): boolean {
  return calculateAge(birthdate) >= MIN_AGE;
}
