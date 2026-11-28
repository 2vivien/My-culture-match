import * as maplibregl from 'maplibre-gl';
import type { Map as MapLibreMap, Marker } from 'maplibre-gl';
import { safeImageUrl } from '@/src/lib/safeUrl';
import { diffMarkerKeys } from '@/src/lib/markerDiff';

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

export interface WantedMarker {
  key: string;
  lngLat: [number, number];
  build: () => HTMLElement;
}

/** Aligne les marqueurs affichés sur la liste voulue : retire les disparus, crée les nouveaux, garde les autres. */
export function syncMarkers(map: MapLibreMap, store: Map<string, Marker>, wanted: WantedMarker[]): void {
  const { add, remove } = diffMarkerKeys(store.keys(), wanted.map((w) => w.key));
  for (const key of remove) {
    store.get(key)?.remove();
    store.delete(key);
  }
  const toAdd = new Set(add);
  for (const w of wanted) {
    if (!toAdd.has(w.key)) continue;
    store.set(w.key, new maplibregl.Marker({ element: w.build() }).setLngLat(w.lngLat).addTo(map));
  }
}

export function clearMarkers(store: Map<string, Marker>): void {
  store.forEach((m) => m.remove());
  store.clear();
}

export function buildClusterMarker(count: number, onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'w-12 h-12 rounded-full bg-zinc-950 text-white font-black text-xs border-2 border-white shadow-2xl hover:scale-110 transition';
  button.textContent = count > 99 ? '99+' : String(count);
  button.setAttribute('aria-label', `${count} personnes : zoomer sur ce groupe`);
  button.onclick = onClick;
  return button;
}

interface MarkerStory {
  name: string;
  avatar: string | null;
  placeLabel: string | null;
  viewed: boolean;
}

export function buildStoryMarker(story: MarkerStory, onClick: () => void): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.setAttribute('aria-label', `Story de ${story.name}${story.placeLabel ? ' · ' + story.placeLabel : ''}`);
  b.className = `relative w-12 h-12 rounded-full p-[3px] shadow-2xl hover:scale-110 transition ${story.viewed ? 'bg-zinc-300' : 'bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-600'}`;
  const inner = document.createElement('span');
  inner.className = 'block w-full h-full rounded-full overflow-hidden bg-white border-2 border-white flex items-center justify-center text-[10px] font-black';
  const avatar = safeImageUrl(story.avatar);
  if (avatar) {
    const img = document.createElement('img');
    img.src = avatar;
    img.alt = '';
    img.className = 'w-full h-full object-cover';
    inner.appendChild(img);
  } else {
    inner.textContent = initials(story.name);
  }
  b.appendChild(inner);
  b.onclick = onClick;
  return b;
}

export function buildPlaceMarker(label: string, icon: string, onClick: () => void): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.setAttribute('aria-label', label);
  b.className = 'w-9 h-9 rounded-full bg-white border-2 border-zinc-900 shadow-xl text-base leading-none flex items-center justify-center hover:scale-110 transition';
  b.textContent = icon;
  b.onclick = onClick;
  return b;
}

export function buildEventMarker(label: string, onClick: () => void): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.setAttribute('aria-label', label);
  b.className = 'w-10 h-10 rounded-xl bg-indigo-600 text-white border-2 border-white shadow-xl text-base leading-none flex items-center justify-center hover:scale-110 transition';
  b.textContent = '📅';
  b.onclick = onClick;
  return b;
}
