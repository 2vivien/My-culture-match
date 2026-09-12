import { GoogleGenAI } from '@google/genai';
import type { Conversation } from '@/src/types/chat.types';

/**
 * Lyra — assistante de conversation culturelle du chat.
 * Utilise Gemini si GEMINI_API_KEY est disponible, sinon un générateur local
 * (ouvre la conversation avec une accroche culturelle pertinente). Ne renvoie
 * JAMAIS d'erreur bloquante : en dernier recours, suggestions locales.
 */

const MODEL = 'gemini-2.5-flash';

const SYSTEM_PROMPT = `Tu es Lyra, l'assistante de conversation de My Culture Match, un réseau social interculturel.
Ton rôle : aider deux personnes de cultures différentes à démarrer ou relancer une conversation chaleureuse et respectueuse.
Règles :
- Tu proposes des MESSAGES PRÊTS À ENVOYER, à la première personne, courts (1-2 phrases max).
- Ton chaleureux, curieux, jamais niais. En français sauf si l'autre personne parle anglais.
- Ancré dans la culture de l'interlocuteur (traditions, cuisine, musique, fêtes, langue) et des points communs.
- Aucune liste, aucun titre, aucun guillemets : uniquement le texte du message.`;

function getApiKey(): string | undefined {
  const key = import.meta.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
  return key && key !== 'MY_GEMINI_API_KEY' ? key : undefined;
}

/** Accroches locales par pays/région — utilisées sans clé API (fallback). */
const LOCAL_HOOKS: Record<string, string[]> = {
  sn: ['Salut ! Raconte-moi un plat de ton enfance à Dakar que personne ne fait comme ta famille 😊', 'Coucou ! C\'est quoi la chanson que tout le monde met aux fêtes chez toi ?'],
  cm: ['Hey ! Le ndolé de ta grand-mère ou le douala street food, tu préfères quoi ? 😄', 'Salut ! On m\'a dit que les matches de foot au Cameroun sont une religion, vrai ou faux ?'],
  jp: ['Hey ! Un festival Matsuri que tu rêves de montrer à quelqu\'un d\'ici ?', 'Salut ! Okonomiyaki maison ou ramen de quartier, ton équipe ? 🍜'],
  bj: ['Salut ! Tu connais une légende que ta grand-mère racontait et que peu de gens connaissent ?', 'Coucou ! Pâte rouge ou igname pilée, le vrai débat 😄'],
  ci: ['Hey ! Maquis d\'Abidjan : attiéké-poisson ou aloco, tu tranches comment ?', 'Salut ! C\'est quoi le coupé-décalé qui te fait bouger à chaque fois ?'],
  '': ['Salut ! C\'est quoi une tradition de chez toi que tu aimerais faire découvrir ?', 'Coucou ! Si on s\'échangeait une recette et une chanson de nos cultures pour commencer ? 😊'],
};

function localSuggestions(partner: Conversation): string[] {
  const code = (partner.country || '').toLowerCase().slice(0, 2);
  const hooks = LOCAL_HOOKS[code] ?? LOCAL_HOOKS[''];
  return [...hooks, `Et toi, ${partner.name.split(' ')[0]}, c'est quoi ton plus beau souvenir de fête traditionnelle ?`];
}

function parseSuggestions(raw: string): string[] {
  return raw
    .split('\n')
    .map((l) => l.replace(/^[-*\d.)\s"«]+|["»]+$/g, '').trim())
    .filter((l) => l.length > 5 && l.length < 220)
    .slice(0, 4);
}

/** Suggestions de messages prêts à envoyer pour la conversation donnée. */
export async function getSuggestions(partner: Conversation, lastMessage?: string): Promise<string[]> {
  const apiKey = getApiKey();
  if (!apiKey) return localSuggestions(partner);

  try {
    const ai = new GoogleGenAI({ apiKey });
    const context = [
      `Interlocuteur : ${partner.name}`,
      partner.culture ? `Culture / pseudo : ${partner.culture}` : '',
      partner.country ? `Pays : ${partner.country}` : '',
      partner.bio ? `Bio : ${partner.bio}` : '',
      lastMessage ? `Dernier message reçu : "${lastMessage}"` : 'La conversation n\'a pas encore commencé.',
    ].filter(Boolean).join('\n');

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `${context}\n\nPropose 3 messages prêts à envoyer (1 par ligne, sans numérotation) pour lancer ou relancer naturellement cette conversation.`,
      config: { systemInstruction: SYSTEM_PROMPT, temperature: 0.9 },
    });

    const text = response.text ?? '';
    const parsed = parseSuggestions(text);
    return parsed.length > 0 ? parsed : localSuggestions(partner);
  } catch {
    return localSuggestions(partner);
  }
}
