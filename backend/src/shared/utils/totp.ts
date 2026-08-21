import { createHmac, randomBytes } from 'node:crypto';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const STEP = 30;
const DIGITS = 6;
const WINDOW = 1; // ±1 step de tolérance

function base32Encode(buf: Buffer): string {
  let bits = '';
  for (const byte of buf) bits += byte.toString(2).padStart(8, '0');
  const out: string[] = [];
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    const alphabetChar = ALPHABET[parseInt(bits.slice(i, i + 5), 2)];
    if (alphabetChar) out.push(alphabetChar);
  }
  const remainder = bits.length % 5;
  if (remainder > 0) {
    const lastChar = ALPHABET[parseInt(bits.slice(bits.length - remainder).padEnd(5, '0'), 2)];
    if (lastChar) out.push(lastChar);
  }
  return out.join('');
}

function base32Decode(input: string): Buffer {
  const cleaned = input.replace(/[=\s]/g, '').toUpperCase();
  let bits = '';
  for (const char of cleaned) {
    const idx = ALPHABET.indexOf(char);
    if (idx === -1) throw new Error('Secret TOTP invalide');
    bits += idx.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function hotp(secret: Buffer, counter: number): string {
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac('sha1', secret).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1]! & 0x0f;
  const code =
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8) |
    (hmac[offset + 3]! & 0xff);
  return String(code % 10 ** DIGITS).padStart(DIGITS, '0');
}

function currentCounter(): number {
  return Math.floor(Date.now() / 1000 / STEP);
}

/** Génère un secret TOTP en Base32 (20 octets aléatoires, crypto-safe). */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

/** Calcule le code TOTP courant pour un secret Base32. */
export function generateTotpCode(secret: string, counter = currentCounter()): string {
  return hotp(base32Decode(secret), counter);
}

/** Construit l'URI otpauth:// affichée dans l'app d'authentification. */
export function buildOtpauthUri(secret: string, account: string, issuer = 'MyCultureMatch'): string {
  const label = `${issuer}:${account}`;
  return `otpauth://totp/${encodeURIComponent(label)}?secret=${encodeURIComponent(secret)}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${DIGITS}&period=${STEP}`;
}

/** Vérifie un code avec fenêtre de ±WINDOW pas. */
export function verifyTotpCode(secret: string, code: string): boolean {
  const provided = code.trim();
  if (!/^\d{6}$/.test(provided)) return false;
  const counter = currentCounter();
  for (let i = -WINDOW; i <= WINDOW; i++) {
    if (generateTotpCode(secret, counter + i) === provided) return true;
  }
  return false;
}
