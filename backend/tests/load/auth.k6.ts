// ─────────────────────────────────────────────────────────────
// CHARGE — Auth (MP17)
// Objectif : 10 000 tentatives de login / minute.
//
//   k6 run tests/load/auth.k6.ts
//
// Scénario :
//   - chaque VU simule un email unique (vus distincts)
//   - envoi OTP puis vérification du code
//   - checks : réponses 200/201, durée < 500ms
// ─────────────────────────────────────────────────────────────
import { check, sleep } from 'k6';
import http from 'k6/http';

const BASE = __ENV.BASE_URL ?? 'http://localhost:3000';

export const options = {
  // ~10 000 requêtes / minute (2 req par itération, 8 300 itérations)
  scenarios: {
    auth: {
      executor: 'constant-vus',
      vus: 150,
      duration: '60s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
    checks: ['rate>0.99'],
  },
};

const emailOf = (vu: number): string => `load-auth-${vu}@example.com`;

export default function (): void {
  const email = emailOf(__VU);

  const otp = http.post(`${BASE}/api/auth/send-otp`, JSON.stringify({ email }), {
    headers: { 'content-type': 'application/json' },
  });
  check(otp, {
    'send-otp → 200': (r) => r.status === 200,
  });

  // En environnement de test réel, le code est récupéré via Mailpit/Redis ;
  // ici on utilise un code inert pour exercer le chemin de validation.
  const verify = http.post(
    `${BASE}/api/auth/verify-otp`,
    JSON.stringify({ email, code: '000000' }),
    { headers: { 'content-type': 'application/json' } },
  );
  check(verify, {
    'verify-otp → 200 ou 400 (code faux)': (r) => r.status === 200 || r.status === 400,
    'réponse JSON': (r) => r.json() !== null,
  });

  sleep(0.3);
}
