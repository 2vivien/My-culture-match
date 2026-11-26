import { launchThemes, themeIcons } from '@/src/lib/themes';
import type { TribeTopic, TribeSubmission } from '@/src/types/createTribe';
import { api } from './api';

export const createTribeService = {
  async getTopics(): Promise<TribeTopic[]> {
    return launchThemes.map((name) => ({
      name,
      icon: themeIcons[name] || '🏷️',
    }));
  },

  /**
   * POST /api/tribes — le backend (schéma strict) attend :
   * { name, tag (slug unique), topic (enum), description }.
   * On transforme donc la soumission du formulaire multi-thèmes.
   */
  async submitTribe(data: TribeSubmission): Promise<{ success: boolean }> {
    const tag = slugifyTribeTag(data.name);
    // Unicité : si le tag existe déjà, on suffixe avec un court hash du nom.
    const payload = {
      name: data.name.trim(),
      tag,
      topic: mapTopic(data.topics?.[0]),
      description: data.description?.trim() || undefined,
    };
    try {
      await api.post<unknown>('/api/tribes', payload);
    } catch (err) {
      // 409 TRIBE_TAG_TAKEN / TRIBE_NAME_TAKEN → on retente avec un tag unique.
      const code = (err as { code?: string })?.code;
      if (code === 'TRIBE_TAG_TAKEN' || code === 'TRIBE_NAME_TAKEN') {
        await api.post<unknown>('/api/tribes', {
          ...payload,
          tag: `${tag}-${Date.now().toString(36).slice(-4)}`,
        });
      } else {
        throw err;
      }
    }
    return { success: true };
  },
};

/** Slug unique pour le tag : "Ma Tribu Été" -> "ma-tribu-ete" (+ suffixe si trop court). */
function slugifyTribeTag(name: string): string {
  const base = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 28);
  return base.length >= 3 ? base : `tribu-${Date.now().toString(36)}`;
}

/** Mappe un thème du formulaire vers un topic accepté par l'API (défaut : traditions). */
const TOPIC_MAP: Array<[RegExp, string]> = [
  [/gastronom|cuisine|boisson/i, 'cuisine'],
  [/langue/i, 'langues'],
  [/voyage|immersion|photographie/i, 'voyage'],
  [/cin[ée]ma|s[ée]ries/i, 'cinema'],
  [/humour|com[ée]die/i, 'fetes'],
  [/musique/i, 'musique'],
  [/festival|c[ée]l[ée]bration/i, 'fetes'],
  [/histoire|patrimoine/i, 'histoire'],
  [/expatri|diaspora/i, 'diaspora'],
  [/mode|textile/i, 'mode'],
  [/religio|spiritualit/i, 'spiritualite'],
  [/relation|couple/i, 'famille'],
  [/m[ée]ditation|bien-[êe]tre/i, 'sante'],
  [/litt[ée]rature|contes/i, 'litterature'],
  [/mythe|l[ée]gende/i, 'histoire'],
  [/danses/i, 'danse'],
  [/artisanat|arts/i, 'art'],
  [/ducation|p[ée]dagogie/i, 'education'],
];

function mapTopic(theme?: string): string {
  if (!theme) return 'traditions';
  for (const [pattern, topic] of TOPIC_MAP) {
    if (pattern.test(theme)) return topic;
  }
  return 'traditions';
}
