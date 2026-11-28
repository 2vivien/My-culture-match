/**
 * Garde « dernière requête gagnante » : chaque requête reçoit un jeton ; seule la plus récente peut encore écrire
 * son résultat. Évite qu'une réponse lente d'une ancienne zone écrase celle de la zone actuelle.
 */
export function createLatestGuard() {
  let current = 0;
  return {
    /** Démarre une requête : retourne une fonction « suis-je toujours la plus récente ? ». */
    begin(): () => boolean {
      const id = ++current;
      return () => id === current;
    },
    /** Invalide toute requête en vol (démontage, désactivation de la couche). */
    cancel(): void {
      current += 1;
    },
  };
}
