import { useQuery } from '@tanstack/react-query';
import {
  GetCountries,
  GetState,
  GetCity,
  GetLanguages,
} from 'react-country-state-city';

export interface GeoCountry {
  id: number;
  name: string;
  iso2: string;
  iso3: string;
  phone_code: string;
  capital: string;
  native: string;
  region: string;
  subregion: string;
  emoji: string;
  hasStates: boolean;
}

export interface GeoState {
  id: number;
  name: string;
  state_code: string;
  hasCities: boolean;
}

export interface GeoCity {
  id: number;
  name: string;
}

export interface GeoLanguage {
  code: string;
  name: string;
  native: string;
}

export function useCountries() {
  return useQuery({
    queryKey: ['geo', 'countries'],
    queryFn: async () => (await GetCountries()) as GeoCountry[],
    staleTime: Infinity,
  });
}

export function useStates(countryId: number | null) {
  return useQuery({
    queryKey: ['geo', 'states', countryId],
    queryFn: async () => (await GetState(countryId)) as GeoState[],
    enabled: countryId != null,
    staleTime: Infinity,
  });
}

export function useCities(countryId: number | null, stateId: number | null) {
  return useQuery({
    queryKey: ['geo', 'cities', countryId, stateId],
    queryFn: async () => (await GetCity(countryId, stateId)) as GeoCity[],
    enabled: countryId != null && stateId != null,
    staleTime: Infinity,
  });
}

export function useLanguages() {
  return useQuery({
    queryKey: ['geo', 'languages'],
    queryFn: async () => (await GetLanguages()) as GeoLanguage[],
    staleTime: Infinity,
  });
}
