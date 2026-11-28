import type { StyleSpecification } from 'maplibre-gl';

/**
 * Style de carte unique pour toute l'app (issue #37 / F1).
 *
 * Les tuiles de tile.openstreetmap.org sont réservées au développement : leur
 * politique d'usage interdit une utilisation applicative en production.
 * En production, définir VITE_MAP_TILES_URL (ex. https://…/{z}/{x}/{y}.png)
 * et VITE_MAP_ATTRIBUTION auprès d'un fournisseur de tuiles autorisé.
 */
const DEV_FALLBACK_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export function getMapStyle(): StyleSpecification {
  const configured = import.meta.env.VITE_MAP_TILES_URL?.trim();
  const tiles = configured || (import.meta.env.DEV ? DEV_FALLBACK_TILES : '');

  if (!tiles) {
    console.error('[map] VITE_MAP_TILES_URL est requis en production : aucun fond de carte chargé.');
    return {
      version: 8,
      sources: {},
      layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#e5e7eb' } }],
    };
  }

  // L'attribution OSM n'est valable que pour les tuiles OSM de repli : un fournisseur configuré
  // doit fournir la sienne (VITE_MAP_ATTRIBUTION), sinon on n'en invente pas.
  const attribution = configured ? import.meta.env.VITE_MAP_ATTRIBUTION?.trim() ?? '' : '© OpenStreetMap contributors';
  if (configured && !attribution) {
    console.warn('[map] VITE_MAP_ATTRIBUTION est vide : renseigner le crédit exigé par le fournisseur de tuiles.');
  }

  return {
    version: 8,
    sources: {
      basemap: {
        type: 'raster',
        tiles: [tiles],
        tileSize: 256,
        attribution,
      },
    },
    layers: [{ id: 'basemap', type: 'raster', source: 'basemap' }],
  };
}
