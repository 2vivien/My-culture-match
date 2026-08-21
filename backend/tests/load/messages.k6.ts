// ─────────────────────────────────────────────────────────────
// CHARGE — Messagerie (MP17)
// Objectif : ~5 000 messages / minute en REST (≈ 83 msg/s),
// plus vérification du panneau de conversations.
//
//   k6 run tests/load/messages.k6.ts
//
// Nécessite un token valide (TOKEN) et un id de conversation
// (CONVERSATION_ID) dans laquelle l'utilisateur participe.
// ─────────────────────────────────────────────────────────────
import { check, sleep } from 'k6';
import http from 'k6/http';

const BASE = __ENV.BASE_URL ?? 'http://localhost:3000';
const TOKEN = __ENV.TOKEN ?? '';
const CONVERSATION_ID = __ENV.CONVERSATION_ID ?? '';

export const options = {
  scenarios: {
    messages: {
      executor: 'constant-arrival-rate',
      rate: 83, // ≈ 5 000 msg/min
      timeUnit: '1s',
      duration: '60s',
      preAllocatedVUs: 50,
      maxVUs: 200,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<300'],
    checks: ['rate>0.99'],
  },
};

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'content-type': 'application/json',
};

export default function (): void {
  if (!CONVERSATION_ID) {
    // Sans conversation cible, on exerce la lecture seule du panneau.
    const panel = http.get(`${BASE}/api/messages`, { headers });
    check(panel, { 'panneau messages → 200': (r) => r.status === 200 });
    sleep(0.2);
    return;
  }

  const send = http.post(
    `${BASE}/api/conversations/${CONVERSATION_ID}/messages`,
    JSON.stringify({
      type: 'text',
      text: `charge ${__VU}:${Date.now() % 1000}`,
    }),
    { headers },
  );
  check(send, {
    'envoi message → 201': (r) => r.status === 201,
    'réponse JSON': (r) => r.json() !== null,
  });

  const list = http.get(`${BASE}/api/conversations`, { headers });
  check(list, {
    'liste conversations → 200': (r) => r.status === 200,
  });

  sleep(0.1);
}
