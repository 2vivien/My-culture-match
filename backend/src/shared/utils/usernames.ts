import { randomInt } from 'node:crypto';

/**
 * Génère 3 suggestions de username uniques à partir d'une base.
 * Format : {base}{num} / {base}_{num} / {base}.{num}
 */
export function generateUsernameSuggestions(base: string): string[] {
  const clean = base.replace(/[^a-zA-Z0-9_.]/g, '').slice(0, 20) || 'user';
  const seen = new Set<string>([clean]);
  const suggestions: string[] = [];

  const pick = (fn: (n: number) => string): string => {
    let candidate = '';
    let tries = 0;
    do {
      candidate = fn(randomInt(1000, 9999));
      tries += 1;
    } while (seen.has(candidate) && tries < 20);
    seen.add(candidate);
    return candidate;
  };

  suggestions.push(pick((n) => `${clean}${n}`));
  suggestions.push(pick((n) => `${clean}_${n}`));
  suggestions.push(pick((n) => `${clean}.${n}`));

  return suggestions;
}
