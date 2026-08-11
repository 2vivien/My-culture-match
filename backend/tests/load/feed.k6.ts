// ─────────────────────────────────────────────────────────────
// CHARGE — Feed (MP17)
// Objectif : ~1 000 requêtes / seconde sur le feed "Following".
//
//   k6 run tests/load/feed.k6.ts
//
// Le backend étant authentifié (Bearer), on charge un token valide
// via TOKEN=… et on pagine avec le curseur retourné.
// ─────────────────────────────────────────────────────────────
import { check, sleep } from 'k6';
import http from 'k6/http';

const BASE = __ENV.BASE_URL ?? 'http://localhost:3000';
const TOKEN = __ENV.TOKEN ?? '';

export const options = {
  scenarios: {
    feed: {
      executor: 'constant-arrival-rate',
      rate: 1000,
      timeUnit: '1s',
      duration: '60s',
      preAllocatedVUs: 100,
      maxVUs: 300,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<200'],
    checks: ['rate>0.99'],
  },
};

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'content-type': 'application/json',
};

export default function (): void {
  const filter = ['following', 'foryou', 'new'][__VU % 3];
  const res = http.get(`${BASE}/api/feed?filter=${filter}&limit=20`, { headers });

  check(res, {
    'feed → 200': (r) => r.status === 200,
    'retourne un tableau posts': (r) => {
      const body = r.json() as { posts?: unknown[] };
      return Array.isArray(body.posts);
    },
  });

  sleep(0.05);
}
