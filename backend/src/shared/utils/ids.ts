import { randomBytes } from 'node:crypto';

const bytes = new Uint8Array(16);

// Monotonie (RFC 9562) : au sein d'une même milliseconde, un compteur
// incrémental garantit le tri strict et l'unicité des IDs.
let lastTimestamp = 0n;
let counter = 0n;
const COUNTER_MASK = (1n << 74n) - 1n;

/**
 * Génère un identifiant UUID v7 (RFC 9562).
 * - 48 bits d'horodatage ms → triable par temps, index friendly
 * - version 7 + variant RFC 4122, 74 bits aléatoires/monotones
 */
export function generateId(): string {
  let ts = BigInt(Date.now());

  if (ts <= lastTimestamp) {
    ts = lastTimestamp;
    counter = (counter + 1n) & COUNTER_MASK;
    if (counter === 0n) ts += 1n; // saturation : on saute une ms plutôt que d'échouer
  } else {
    counter = BigInt(`0x${randomBytes(10).toString('hex')}`) & COUNTER_MASK;
  }
  lastTimestamp = ts;

  // 48 bits d'horodatage
  for (let i = 0; i < 6; i++) {
    bytes[5 - i] = Number((ts >> BigInt(i * 8)) & 0xffn);
  }

  // 74 bits : version (4) + rand_a/counter (12) + variant (2) + rand_b/counter (62)
  bytes[6] = 0x70 | Number((counter >> 8n) & 0x0fn); // version 7 + haut rand_a
  bytes[7] = Number(counter & 0xffn);
  bytes[8] = 0x80 | Number((counter >> 16n) & 0x3fn); // variant 10 + haut rand_b
  for (let i = 0; i < 7; i++) {
    bytes[9 + i] = Number((counter >> (24n + BigInt(i * 8))) & 0xffn);
  }

  const hex = Buffer.from(bytes).toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
