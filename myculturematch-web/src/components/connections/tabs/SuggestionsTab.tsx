import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { UserCard } from '../UserCard';
import { UserRow } from '../UserRow';
import { PeopleNearbyMapV2 } from '../PeopleNearbyMapV2';
import { connectLocationRealtime } from '@/src/services/locationRealtime';
import { api } from '@/src/services/api';
import type { ConnectionUser } from '@/src/stores/useConnectionsStore';

interface SuggestionsTabProps { list: ConnectionUser[]; onConnect: (id: string) => void; }

export const SuggestionsTab: React.FC<SuggestionsTabProps> = ({ list, onConnect }) => {
  const [locationRefresh, setLocationRefresh] = useState(0);

  useEffect(() => connectLocationRealtime(() => setLocationRefresh(v => v + 1)), []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    let lastSent = 0;
    const watch = navigator.geolocation.watchPosition(async ({ coords }) => {
      const now = Date.now();
      if (now - lastSent < 20_000) return;
      lastSent = now;
      try {
        await api.post('/api/location/heartbeat', { latitude: coords.latitude, longitude: coords.longitude });
      } catch {
        // Location is best-effort; the map remains usable when permission/network is unavailable.
      }
    }, () => undefined, { enableHighAccuracy: false, maximumAge: 15_000, timeout: 10_000 });
    return () => navigator.geolocation.clearWatch(watch);
  }, []);

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="mb-6">
        <PeopleNearbyMapV2 key={locationRefresh} />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6">
        {list.map(user => <UserCard key={user.id} user={user} onConnect={onConnect} />)}
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="md:hidden flex flex-col gap-3.5">
        {list.map(user => <UserRow key={user.id} user={user} onConnect={onConnect} />)}
      </motion.div>
    </>
  );
};
