import { describe, expect, it } from 'vitest';
import { computeFunnel, safeRate } from '../../../src/modules/love/love.metrics';

const zero = { likes: 0, matches: 0, declined: 0, expired: 0, pending: 0, questionnairesCompleted: 0 };

describe('safeRate', () => {
  it('renvoie null sans dénominateur', () => {
    expect(safeRate(3, 0)).toBeNull();
    expect(safeRate(1, Number.NaN)).toBeNull();
  });
  it('arrondit à 4 décimales et ne renvoie jamais de négatif', () => {
    expect(safeRate(1, 3)).toBe(0.3333);
    expect(safeRate(-2, 5)).toBe(0);
  });
});

describe('computeFunnel', () => {
  it('entonnoir vide : taux nuls (null), pas de NaN', () => {
    const f = computeFunnel(zero);
    expect(f.requestsSent).toBe(0);
    expect(f.acceptanceRate).toBeNull();
    expect(f.answeredAcceptanceRate).toBeNull();
  });

  it('déduit les requêtes envoyées : likes − likes de réponse (un par match)', () => {
    // 10 requêtes : 4 acceptées (8 likes au total pour ces paires), 3 refusées, 1 expirée, 2 en attente
    const f = computeFunnel({ likes: 14, matches: 4, declined: 3, expired: 1, pending: 2, questionnairesCompleted: 20 });
    expect(f.requestsSent).toBe(10);
    expect(f.requestsAccepted).toBe(4);
    expect(f.acceptanceRate).toBe(0.4);
    expect(f.answeredAcceptanceRate).toBe(0.5714);
    expect(f.questionnairesCompleted).toBe(20);
  });

  it('reste cohérent si les données sont incohérentes (envoyées jamais négatives)', () => {
    expect(computeFunnel({ ...zero, likes: 1, matches: 3 }).requestsSent).toBe(0);
  });
});
