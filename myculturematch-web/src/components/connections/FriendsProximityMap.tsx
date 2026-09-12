import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { Map as MapLibreMap, Marker } from 'maplibre-gl';
import supercluster from 'supercluster';
import { Search, Crosshair, Users } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { ConnectionUser } from '@/src/stores/useConnectionsStore';

/**
 * Friends Proximity — carte Snap Map-like avec MapLibre + OpenStreetMap :
 *  - fond de carte OSM raster (aucune clé API requise) ;
 *  - avatars des amis proches groupés par clusters (supercluster) ;
 *  - recherche de lieux via le géocodage Nominatim (OpenStreetMap) ;
 *  - bouton de recentrage sur la position de l'utilisateur (navigator.geolocation).
 */

const OSM_RASTER_STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: 'raster' as const,
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm-tiles',
      type: 'raster' as const,
      source: 'osm',
    },
  ],
};

interface GeoPoint {
  type: 'Feature';
  properties: { cluster?: boolean; clusterId?: number; pointCount?: number; userId?: string };
  geometry: { type: 'Point'; coordinates: [number, number] };
}

/** Géocode un lieu via Nominatim (OpenStreetMap) — gratuit, sans clé. */
async function geocode(query: string): Promise<Array<{ name: string; lat: number; lon: number }>> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) return [];
  const data = (await res.json()) as Array<{ display_name: string; lat: string; lon: string }>;
  return data.map((d) => ({
    name: d.display_name,
    lat: parseFloat(d.lat),
    lon: parseFloat(d.lon),
  }));
}

interface FriendsProximityMapProps {
  users: Array<ConnectionUser & { lat?: number; lon?: number }>;
}

export const FriendsProximityMap: React.FC<FriendsProximityMapProps> = ({ users }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const indexRef = useRef<supercluster | null>(null);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Array<{ name: string; lat: number; lon: number }>>([]);
  const [searching, setSearching] = useState(false);
  const [zoom, setZoom] = useState(2);

  const points = useMemo<GeoPoint[]>(
    () =>
      users
        .filter((u) => typeof u.lat === 'number' && typeof u.lon === 'number')
        .map((u) => ({
          type: 'Feature' as const,
          properties: { userId: u.id },
          geometry: { type: 'Point' as const, coordinates: [u.lon!, u.lat!] },
        })),
    [users],
  );

  // Init map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: OSM_RASTER_STYLE as any,
      center: [2.35, 48.85], // Paris par défaut
      zoom: 2,
      attributionControl: false,
    });
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
    map.on('zoom', () => setZoom(Math.round(map.getZoom())));
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Clustering des points à chaque zoom/déplacement
  useEffect(() => {
    const map = mapRef.current;
    if (!map || points.length === 0) return;

    const index = new supercluster({ radius: 70, maxZoom: 16 });
    index.load(points);
    indexRef.current = index;

    const render = () => {
      // Nettoie les anciens marqueurs
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      const bounds = map.getBounds();
      const z = Math.round(map.getZoom());
      const clusters = index.getClusters(
        [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
        z,
      );

      clusters.forEach((c: any) => {
        const [lng, lat] = c.geometry.coordinates;
        const el = document.createElement('div');

        if (c.properties.cluster) {
          // Cluster : bulle avec le nombre d'amis
          const count = c.properties.point_count as number;
          el.className =
            'flex items-center justify-center w-11 h-11 rounded-full bg-[#E27D60] text-white text-sm font-black shadow-lg border-[3px] border-white cursor-pointer hover:scale-110 transition-transform select-none';
          el.textContent = count > 99 ? '99+' : String(count);
          el.onclick = () => {
            map.easeTo({ center: [lng, lat], zoom: (index.getClusterExpansionZoom(c.properties.cluster_id) as number) });
          };
        } else {
          // Ami individuel : avatar rond avec anneau
          const user = users.find((u) => u.id === c.properties.userId);
          el.className =
            'flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-lg border-[3px] border-[#2dd9d9] cursor-pointer hover:scale-110 transition-transform overflow-hidden select-none';
          if (user?.avatar) {
            const img = document.createElement('img');
            img.src = user.avatar;
            img.alt = user.name;
            img.className = 'w-full h-full object-cover rounded-full';
            img.referrerPolicy = 'no-referrer';
            el.appendChild(img);
          } else {
            el.innerHTML = `<span class="text-xs font-black text-app-black">${(user?.name ?? '?').slice(0, 2).toUpperCase()}</span>`;
          }
          el.title = user?.name ?? '';
        }

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(map);
        markersRef.current.push(marker);
      });
    };

    render();
    map.on('move', render);
    map.on('zoom', render);
    return () => {
      map.off('move', render);
      map.off('zoom', render);
    };
  }, [points, users]);

  const handleSearch = async () => {
    if (search.trim().length < 2) return;
    setSearching(true);
    try {
      const found = await geocode(search.trim());
      setResults(found);
    } finally {
      setSearching(false);
    }
  };

  const goTo = (lat: number, lon: number) => {
    mapRef.current?.easeTo({ center: [lon, lat], zoom: 12 });
    setResults([]);
    setSearch('');
  };

  const locateMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => goTo(pos.coords.latitude, pos.coords.longitude),
      () => undefined,
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  return (
    <div className="relative w-full h-[420px] rounded-[24px] overflow-hidden border border-app-border dark:border-zinc-800 shadow-sm">
      {/* Conteneur carte */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Barre de recherche (géocodage) */}
      <div className="absolute top-3 left-3 right-3 z-10">
        <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur rounded-full shadow-lg border border-app-border dark:border-zinc-800 flex items-center px-4 py-2.5 gap-2">
          <Search className="w-4.5 h-4.5 text-app-gray shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search a city or a place…"
            className="flex-1 bg-transparent outline-none text-sm font-semibold text-app-black dark:text-zinc-100 placeholder:text-app-gray min-w-0"
          />
          {searching && (
            <div className="w-4 h-4 border-2 border-[#E27D60] border-t-transparent rounded-full animate-spin shrink-0" />
          )}
        </div>

        {/* Résultats de géocodage */}
        {results.length > 0 && (
          <div className="mt-2 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-app-border dark:border-zinc-800 overflow-hidden max-h-56 overflow-y-auto">
            {results.map((r) => (
              <button
                key={`${r.lat}-${r.lon}`}
                onClick={() => goTo(r.lat, r.lon)}
                className="w-full text-left px-4 py-3 text-sm font-semibold text-app-black dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer border-b border-app-border/40 dark:border-zinc-800/60 last:border-none"
              >
                {r.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bouton de localisation */}
      <button
        onClick={locateMe}
        title="Locate me"
        className="absolute bottom-5 right-3 z-10 w-11 h-11 rounded-full bg-white dark:bg-zinc-900 shadow-lg border border-app-border dark:border-zinc-800 flex items-center justify-center text-app-black dark:text-zinc-100 hover:scale-105 transition-transform cursor-pointer"
      >
        <Crosshair className="w-5 h-5" />
      </button>

      {/* Compteur d'amis sur la carte */}
      {users.length > 0 && (
        <div className="absolute bottom-5 left-3 z-10 flex items-center gap-2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur rounded-full px-4 py-2 shadow-lg border border-app-border dark:border-zinc-800">
          <Users className="w-4 h-4 text-[#E27D60]" />
          <span className="text-xs font-black text-app-black dark:text-zinc-100">
            {users.length} {users.length === 1 ? 'friend' : 'friends'} nearby
          </span>
        </div>
      )}

      {/* Indicateur de zoom (debug discret) */}
      <span className="hidden">{zoom}</span>
    </div>
  );
};
