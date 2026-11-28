import type { Conversation } from '@/src/types/chat.types';

/**
 * Lyra — assistante de conversation culturelle du chat.
 *
 * Sécurité : aucune clé d'IA n'est embarquée dans le bundle navigateur.
 * Les suggestions sont générées localement à partir du profil de l'interlocuteur
 * (pays, culture, bio, dernier message). Un proxy backend authentifié pourra
 * remplacer ce générateur plus tard sans changer l'API de ce module.
 */

/** Accroches locales par pays/région — utilisées sans clé API. */
const LOCAL_HOOKS: Record<string, string[]> = {
  sn: [
    'Salut ! Raconte-moi un plat de ton enfance à Dakar que personne ne fait comme ta famille 😊',
    'Coucou ! C’est quoi la chanson que tout le monde met aux fêtes chez toi ?',
  ],
  cm: [
    'Hey ! Le ndolé de ta grand-mère ou le douala street food, tu préfères quoi ? 😄',
    'Salut ! On m’a dit que les matches de foot au Cameroun sont une religion, vrai ou faux ?',
  ],
  jp: [
    'Hey ! Un festival Matsuri que tu rêves de montrer à quelqu’un d’ici ?',
    'Salut ! Okonomiyaki maison ou ramen de quartier, ton équipe ? 🍜',
  ],
  bj: [
    'Salut ! Tu connais une légende que ta grand-mère racontait et que peu de gens connaissent ?',
    'Coucou ! Pâte rouge ou igname pilée, le vrai débat 😄',
  ],
  ci: [
    'Hey ! Maquis d’Abidjan : attiéké-poisson ou aloco, tu tranches comment ?',
    'Salut ! C’est quoi le coupé-décalé qui te fait bouger à chaque fois ?',
  ],
  '': [
    'Salut ! C’est quoi une tradition de chez toi que tu aimerais faire découvrir ?',
    'Coucou ! Si on s’échangeait une recette et une chanson de nos cultures pour commencer ? 😊',
  ],
};

function localSuggestions(partner: Conversation, lastMessage?: string): string[] {
  const code = (partner.country || '').toLowerCase().slice(0, 2);
  const hooks = LOCAL_HOOKS[code] ?? LOCAL_HOOKS[''];
  const base = [...hooks];

  if (lastMessage && lastMessage.trim().length > 0) {
    base.push(`Ta dernière phrase m’a donné envie d’en savoir plus : tu peux m’expliquer ${lastMessage.trim().slice(0, 60)} ?`);
  }
  if (partner.bio) {
    base.push(`J’ai lu ta bio : ${partner.bio.trim().slice(0, 80)}… qu’est-ce qui t’a donné envie d’en parler ici ?`);
  }
  base.push(`Et toi, ${partner.name.split(' ')[0]}, c’est quoi ton plus beau souvenir de fête partagée en post ?`);

  return base.slice(0, 4);
}

/** Suggestions de messages prêts à envoyer pour la conversation donnée. */
export async function getSuggestions(partner: Conversation, lastMessage?: string): Promise<string[]> {
  return localSuggestions(partner, lastMessage);
}
