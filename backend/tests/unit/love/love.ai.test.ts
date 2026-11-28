import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseLoveQuery } from '../../../src/modules/love/love.ai';

const ENV_KEYS = ['LOVE_AI_ENABLED', 'LOVE_AI_API_KEY', 'LOVE_AI_MODEL', 'LOVE_AI_BASE_URL', 'LOVE_AI_TIMEOUT_MS'] as const;
const saved: Record<string, string | undefined> = {};
const fetchMock = vi.fn();

beforeEach(() => {
  for (const k of ENV_KEYS) { saved[k] = process.env[k]; delete process.env[k]; }
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
  for (const k of ENV_KEYS) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; }
});

const enableAi = () => {
  process.env.LOVE_AI_ENABLED = 'true';
  process.env.LOVE_AI_API_KEY = 'cle-de-test';
  process.env.LOVE_AI_MODEL = 'modele-test';
};
const aiReply = (content: string) => ({ ok: true, json: async () => ({ choices: [{ message: { content } }] }) });

describe('parseLoveQuery — analyse déterministe (IA désactivée)', () => {
  it('extrait la tranche d’âge « entre 25 et 35 »', async () => {
    const c = await parseLoveQuery('Je cherche quelqu’un entre 25 et 35 ans');
    expect(c.ageMin).toBe(25);
    expect(c.ageMax).toBe(35);
  });

  it('comprend « de 30 à 40 » malgré les accents', async () => {
    const c = await parseLoveQuery('de 30 à 40 ans');
    expect([c.ageMin, c.ageMax]).toEqual([30, 40]);
  });

  it('détecte le genre recherché', async () => {
    expect((await parseLoveQuery('une femme sympa')).genders).toEqual(['female']);
    expect((await parseLoveQuery('un homme drôle')).genders).toEqual(['male']);
    expect((await parseLoveQuery('quelqu’un de sympa')).genders).toBeUndefined();
  });

  it('détecte le but relationnel, sérieux avant occasionnel', async () => {
    expect((await parseLoveQuery('une relation sérieuse')).relationshipGoal).toBe('serious');
    expect((await parseLoveQuery('quelque chose de casual')).relationshipGoal).toBe('casual');
    expect((await parseLoveQuery('pour le mariage')).relationshipGoal).toBe('serious');
    expect((await parseLoveQuery('bonjour')).relationshipGoal).toBeUndefined();
  });

  it('fixe 50 km quand la requête évoque la proximité', async () => {
    expect((await parseLoveQuery('quelqu’un près de chez moi')).distanceKm).toBe(50);
    expect((await parseLoveQuery('quelqu’un')).distanceKm).toBeUndefined();
  });

  it('extrait les mots-clés connus sans tenir compte des accents ni de la casse', async () => {
    const c = await parseLoveQuery('Passionnée de MUSIQUE, de voyage et de cuisine');
    expect(c.keywords).toEqual(expect.arrayContaining(['musique', 'voyage', 'cuisine']));
    expect(c.keywords).not.toContain('sport');
  });

  it('retire les mots-clés sensibles même s’ils viennent du modèle', async () => {
    enableAi();
    fetchMock.mockResolvedValue(aiReply('{"keywords":["musique","musulman","voyage"]}'));
    expect((await parseLoveQuery('x')).keywords).toEqual(['musique', 'voyage']);
  });

  it('renvoie des mots-clés vides pour une requête sans critère', async () => {
    expect((await parseLoveQuery('salut')).keywords).toEqual([]);
  });

  it('ignore une tranche d’âge incohérente au lieu de faire échouer la recherche', async () => {
    const c = await parseLoveQuery('une femme entre 40 et 30 ans');
    expect(c.ageMin).toBeUndefined();
    expect(c.ageMax).toBeUndefined();
    expect(c.genders).toEqual(['female']);
  });

  it('ignore une tranche d’âge de mineurs', async () => {
    const c = await parseLoveQuery('entre 12 et 15 ans');
    expect(c.ageMin).toBeUndefined();
  });
});

describe('parseLoveQuery — avec IA', () => {
  it('reste en mode déterministe si une variable manque (aucun appel réseau)', async () => {
    process.env.LOVE_AI_ENABLED = 'true';
    process.env.LOVE_AI_API_KEY = 'x';
    await parseLoveQuery('une femme');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('utilise la réponse JSON de l’IA et appelle l’endpoint configuré', async () => {
    enableAi();
    process.env.LOVE_AI_BASE_URL = 'https://ia.example.test/v1/';
    fetchMock.mockResolvedValue(aiReply('{"ageMin":28,"ageMax":38,"genders":["female"],"relationshipGoal":"friendship"}'));
    const c = await parseLoveQuery('quelqu’un');
    expect(c).toEqual({ ageMin: 28, ageMax: 38, genders: ['female'], relationshipGoal: 'friendship', keywords: [] });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://ia.example.test/v1/chat/completions');
    expect((init as RequestInit).headers).toMatchObject({ Authorization: 'Bearer cle-de-test' });
    const body = JSON.parse((init as { body: string }).body);
    expect(body.model).toBe('modele-test');
    expect(body.messages.at(-1)).toEqual({ role: 'user', content: 'quelqu’un' });
  });

  it('extrait le JSON d’un bloc de code markdown', async () => {
    enableAi();
    fetchMock.mockResolvedValue(aiReply('Voici :\n```json\n{"distanceKm":120}\n```'));
    expect(await parseLoveQuery('x')).toEqual({ distanceKm: 120, keywords: [] });
  });

  it.each([
    ['erreur HTTP', { ok: false, status: 500, json: async () => ({}) }],
    ['réponse sans JSON', aiReply('désolé, je ne peux pas')],
    ['JSON invalide pour le schéma', aiReply('{"ageMin":5}')],
    ['âges incohérents', aiReply('{"ageMin":50,"ageMax":20}')],
  ])('retombe sur l’analyse déterministe en cas de %s', async (_label, response) => {
    enableAi();
    fetchMock.mockResolvedValue(response);
    const c = await parseLoveQuery('une femme entre 25 et 35 ans');
    expect(c.genders).toEqual(['female']);
    expect(c.ageMin).toBe(25);
  });

  it('retombe sur l’analyse déterministe si le réseau échoue', async () => {
    enableAi();
    fetchMock.mockRejectedValue(new Error('réseau'));
    expect((await parseLoveQuery('un homme')).genders).toEqual(['male']);
  });
});
