import { safeImageUrl } from '@/src/lib/safeUrl';

/** Initiales (2 lettres max) d'un nom affiché. */
export const initials = (name: string): string =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join('').toUpperCase();

interface MarkerPerson {
  name: string;
  avatar: string | null;
  isActive: boolean;
}

/**
 * Marqueur d'une personne, construit uniquement avec des nœuds DOM (jamais de innerHTML) :
 * un avatar venant du serveur ne peut pas sortir de l'attribut `src`.
 */
export function buildPersonMarker(person: MarkerPerson, onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'relative w-14 h-14 rounded-full bg-white p-1 border-2 border-white shadow-2xl hover:scale-110 transition';
  button.setAttribute('aria-label', `${person.name}${person.isActive ? ' (actif·ve)' : ''}`);
  const avatar = safeImageUrl(person.avatar);
  if (avatar) {
    const img = document.createElement('img');
    img.src = avatar;
    img.alt = '';
    img.className = 'w-full h-full rounded-full object-cover';
    button.appendChild(img);
  } else {
    const span = document.createElement('span');
    span.className = 'w-full h-full rounded-full flex items-center justify-center bg-zinc-950 text-white text-xs font-black';
    span.textContent = initials(person.name);
    button.appendChild(span);
  }
  if (person.isActive) {
    const dot = document.createElement('i');
    dot.className = 'absolute right-0 bottom-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white';
    button.appendChild(dot);
  }
  button.onclick = onClick;
  return button;
}
