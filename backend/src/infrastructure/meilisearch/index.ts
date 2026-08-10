import { MeiliSearch } from 'meilisearch';
import { env } from '../../config/env';

export const meilisearch = new MeiliSearch({
  host: env.MEILISEARCH_HOST,
  apiKey: env.MEILISEARCH_API_KEY,
});

export async function checkMeilisearch(): Promise<void> {
  await meilisearch.getIndexes();
}

export async function closeMeilisearch(): Promise<void> {
  // pas de connexion persistante à fermer
}
