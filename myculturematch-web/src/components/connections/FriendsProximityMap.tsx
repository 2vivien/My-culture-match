import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { Map as MapLibreMap, Marker } from 'maplibre-gl';
import supercluster from 'supercluster';
import { Search, Crosshair, Users, LocateFixed, X } from 'lucide-react';
import { api } from '@/src/services/api';
import { getMapStyle } from '@/src/lib/mapStyle';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import 'maplibre-gl/dist/maplibre-gl.css';

/**
 * Friends Proximity — carte Snap Map-like avec MapLibre + OpenStreetMap :
 *  - fond de carte OSM raster (aucune clé API requise) ;
 *  - partage de position réel : PATCH /api/users/me/location (activé/désactivé) ;
 *  - amis visibles = GET /api/connections/nearby (géoloc activée des deux côtés) ;
 *  - avatars groupés par clusters (supercluster), distance en km ;
 *  - recherche de lieux via le géocodage Nominatim (OpenStreetMap).
 */

const OSM_RASTER_STYLE = getMapStyle();

interface NearbyFriend {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  bio: string | null;
  location: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
  distanceKm: number | null;
  lastSeen: string | null;
  isCompanion: boolean;
}

interface NearbyResponse {
  success: boolean;
  me: { latitude: number | null; longitude: number | null; locationSharingEnabled: boolean };
  friends: NearbyFriend[];
}

interface GeoPoint {
  type: 'Feature';
  properties: { cluster?: boolean; clusterId?: number; pointCount?: number; friend?: NearbyFriend };
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

function formatDistance(km: number | null): string {
  if (km === null) return '';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

function formatLastSeen(iso: string | null): string {
  if (!iso) return '';
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 2) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const h = Math.floor(diffMin / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export const FriendsProximityMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const indexRef = useRef<supercluster | null>(null);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Array<{ name: string; lat: number; lon: number }>>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<NearbyFriend | null>(null);
  const [enabling, setEnabling] = useState(false);
  const queryClient = useQueryClient();

  const { data, refetch } = useQuery<NearbyResponse>({
    queryKey: ['connections', 'nearby'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; me: NearbyResponse['me']; friends: NearbyFriend[] }>('/api/connections/nearby');
      return res as unknown as NearbyResponse;
    },
    staleTime: 1000 * 30,
    enabled: true,
  });

  const me = data?.me ?? { latitude: null, longitude: null, locationSharingEnabled: false };
  const friends = useMemo(() => data?.friends ?? [], [data]);

  const points = useMemo<GeoPoint[]>(
    () =>
      friends.map((f) => ({
        type: 'Feature' as const,
        properties: { friend: f },
        geometry: { type: 'Point' as const, coordinates: [f.longitude, f.latitude] },
      })),
    [friends],
  );

  /** Active le partage de position (comme Snap : la carte ne montre que si c'est activé). */
  const enableSharing = () => {
    if (!navigator.geolocation) return;
    setEnabling(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await api.patch('/api/users/me/location', {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            enabled: true,
          });
          await refetch();
          // Recentre sur moi
          mapRef.current?.easeTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 13 });
        } finally {
          setEnabling(false);
        }
      },
      () => setEnabling(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  /** Désactive le partage (comme Snap : Ghost Mode). */
  const disableSharing = async () => {
    await api.patch('/api/users/me/location', { enabled: false });
    await refetch();
  };

  // Init map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: OSM_RASTER_STYLE as any,
      center: [2.35, 48.85],
      zoom: 2,
      attributionControl: false,
    });
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Centre sur ma position dès qu'on la connaît
  useEffect(() => {
    if (me.locationSharingEnabled && me.latitude !== null && me.longitude !== null) {
      mapRef.current?.easeTo({ center: [me.longitude, me.latitude], zoom: 11 });
    }
  }, [me.locationSharingEnabled, me.latitude, me.longitude]);

  // Clustering des points à chaque zoom/déplacement
  useEffect(() => {
    const map = mapRef.current;
    if (!map || points.length === 0) return;

    const index = new supercluster({ radius: 70, maxZoom: 16 });
    index.load(points);
    indexRef.current = index;

    const render = () => {
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
          const count = c.properties.point_count as number;
          el.className =
            'flex items-center justify-center w-11 h-11 rounded-full bg-[#E27D60] text-white text-sm font-black shadow-lg border-[3px] border-white cursor-pointer hover:scale-110 transition-transform select-none';
          el.textContent = count > 99 ? '99+' : String(count);
          el.onclick = () => {
            map.easeTo({ center: [lng, lat], zoom: index.getClusterExpansionZoom(c.properties.cluster_id) as number });
          };
        } else {
          const friend = c.properties.friend as NearbyFriend;
          el.className =
            'flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-lg border-[3px] cursor-pointer hover:scale-110 transition-transform overflow-hidden select-none ' +
            (friend.isCompanion ? 'border-[#3ddc84]' : 'border-[#2dd9d9]');
          if (friend.avatar) {
            const img = document.createElement('img');
            img.src = friend.avatar;
            img.alt = friend.name;
            img.className = 'w-full h-full object-cover rounded-full';
            img.referrerPolicy = 'no-referrer';
            el.appendChild(img);
          } else {
            el.innerHTML = `<span class="text-xs font-black text-app-black">${friend.name.slice(0, 2).toUpperCase()}</span>`;
          }
          el.onclick = () => setSelected(friend);
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
  }, [points]);

  const handleSearch = async () => {
    if (search.trim().length < 2) return;
    setSearching(true);
    try {
      setResults(await geocode(search.trim()));
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
    <div className="relative w-full h-[440px] rounded-[24px] overflow-hidden border border-app-border dark:border-zinc-800 shadow-sm">
      {/* Conteneur carte */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Overlay quand le partage est désactivé (comme Snap : "Turn on location") */}
      {!me.locationSharingEnabled && (
        <div className="absolute inset-0 z-20 bg-black/45 backdrop-blur-[2px] flex flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-white/95 dark:bg-zinc-900 flex items-center justify-center shadow-xl">
            <LocateFixed className="w-8 h-8 text-[#E27D60]" />
          </div>
          <div>
            <h3 className="font-black text-lg text-white drop-shadow-md">Share your location</h3>
            <p className="text-sm text-white/90 drop-shadow-md mt-1 max-w-xs">
              Turn on location sharing to see friends nearby on the map — just like Snap Map.
            </p>
          </div>
          <button
            onClick={enableSharing}
            disabled={enabling}
            className="px-6 py-3 rounded-full bg-[#E27D60] hover:bg-[#c66b50] text-white text-sm font-black shadow-lg transition-all cursor-pointer disabled:opacity-60 flex items-center gap-2"
          >
            {enabling ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <LocateFixed className="w-4.5 h-4.5" />
            )}
            {enabling ? 'Locating…' : 'Turn On Location'}
          </button>
        </div>
      )}

      {/* Barre de recherche (géocodage) */}
      {me.locationSharingEnabled && (
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
      )}

      {/* Boutons flottants : locate-me + compteur + ghost mode */}
      {me.locationSharingEnabled && (
        <>
          <button
            onClick={locateMe}
            title="Locate me"
            className="absolute bottom-5 right-3 z-10 w-11 h-11 rounded-full bg-white dark:bg-zinc-900 shadow-lg border border-app-border dark:border-zinc-800 flex items-center justify-center text-app-black dark:text-zinc-100 hover:scale-105 transition-transform cursor-pointer"
          >
            <Crosshair className="w-5 h-5" />
          </button>

          <div className="absolute bottom-5 left-3 z-10 flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur rounded-full px-4 py-2 shadow-lg border border-app-border dark:border-zinc-800">
              <Users className="w-4 h-4 text-[#E27D60]" />
              <span className="text-xs font-black text-app-black dark:text-zinc-100">
                {friends.length} {friends.length === 1 ? 'friend' : 'friends'} nearby
              </span>
            </div>
            <button
              onClick={disableSharing}
              title="Stop sharing (Ghost Mode)"
              className="w-9 h-9 rounded-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur shadow-lg border border-app-border dark:border-zinc-800 flex items-center justify-center text-app-gray hover:text-red-500 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </>
      )}

      {/* Fiche ami sélectionné */}
      {selected && (
        <div className="absolute bottom-5 left-3 right-3 z-30 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-app-border dark:border-zinc-800 p-4 flex items-center gap-3.5">
          <div className="relative shrink-0">
            {selected.avatar ? (
              <img src={selected.avatar} alt={selected.name} className="w-14 h-14 rounded-full object-cover border-2 border-[#2dd9d9]" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-black text-app-black dark:text-white">
                {selected.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-extrabold text-sm text-app-black dark:text-zinc-100 truncate">{selected.name}</h4>
            <p className="text-xs text-app-gray dark:text-zinc-400 font-semibold">
              {formatDistance(selected.distanceKm)}
              {selected.distanceKm !== null && ' away'}
              {selected.lastSeen && ` · ${formatLastSeen(selected.lastSeen)}`}
            </p>
            {selected.location && (
              <p className="text-xs text-app-gray/80 truncate mt-0.5">{selected.location}</p>
            )}
          </div>
          <button
            onClick={() => setSelected(null)}
            className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-app-gray hover:text-app-black dark:hover:text-white cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
