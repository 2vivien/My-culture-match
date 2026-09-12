import React from 'react';
import { SearchableSelect } from '@/src/components/ui/SearchableSelect';
import { useCities, useCountries, useStates } from '@/src/services/geo.service';

interface StepRootsProps {
  country: string;
  region: string;
  ethnicity: string;
  village: string;
  updateRoots: (roots: { country: string; region: string; ethnicity: string; village: string }) => void;
}

const inputClass =
  'w-full p-5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-primary dark:focus:border-primary rounded-2xl outline-none text-zinc-900 dark:text-white text-base transition-colors';

const labelClass =
  'text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block';

export const StepRoots: React.FC<StepRootsProps> = ({
  country,
  region,
  ethnicity,
  village,
  updateRoots,
}) => {
  const { data: countries, isLoading: countriesLoading } = useCountries();
  const selectedCountry = countries?.find((c) => c.name === country);
  const { data: states, isLoading: statesLoading } = useStates(selectedCountry?.id ?? null);
  const selectedState = states?.find((s) => s.name === region);
  const { data: cities, isLoading: citiesLoading } = useCities(
    selectedCountry?.id ?? null,
    selectedState?.id ?? null
  );

  const countryOptions = (countries ?? []).map((c) => ({
    value: c.name,
    label: c.name,
    flag: c.emoji,
    meta: `+${c.phone_code}`,
  }));

  const stateOptions = (states ?? []).map((s) => ({ value: s.name, label: s.name }));

  const cityOptions = (cities ?? []).map((c) => ({ value: c.name, label: c.name }));

  const hasStates = selectedCountry?.hasStates ?? true;
  const stateReady = hasStates ? selectedState != null : selectedCountry != null;
  const useCitySelect = stateReady && cityOptions.length > 0;

  return (
    <div className="space-y-6">
      <div className="text-center md:text-left">
        <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase rounded-full tracking-wider">
          Héritage
        </span>
        <h2 className="text-2xl sm:text-3xl font-black mt-3 text-zinc-900 dark:text-white">
          D'où venez-vous ?
        </h2>
        <p className="text-sm text-zinc-500 mt-2">
          Précisez vos origines. Plus c'est exact, plus les matchs culturels seront fins.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className={labelClass}>Pays d'origine</label>
          <SearchableSelect
            options={countryOptions}
            value={country}
            onChange={(value) => updateRoots({ country: value as string, region: '', ethnicity, village: '' })}
            placeholder="Sélectionnez votre pays..."
            showFlag
            showMeta
            loading={countriesLoading}
            inputClassName="p-5"
          />
        </div>

        {!hasStates ? (
          <div className="space-y-2">
            <label className={labelClass}>Région d'origine</label>
            <p className="text-xs text-zinc-400 font-bold px-1">
              {selectedCountry ? 'Ce pays n\'a pas de région administrative.' : 'Choisissez d\'abord un pays'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <label className={labelClass}>Région d'origine</label>
            <SearchableSelect
              options={stateOptions}
              value={region}
              onChange={(value) => updateRoots({ country, region: value as string, ethnicity, village: '' })}
              placeholder={selectedCountry ? 'Sélectionnez votre région...' : 'Choisissez d\'abord un pays'}
              loading={statesLoading}
              disabled={!selectedCountry}
              inputClassName="p-5"
            />
          </div>
        )}

        <div className="space-y-2">
          <label className={labelClass}>Ville ou Village natal</label>
          {useCitySelect ? (
            <SearchableSelect
              options={cityOptions}
              value={village}
              onChange={(value) => updateRoots({ country, region, ethnicity, village: value as string })}
              placeholder="Sélectionnez votre ville..."
              loading={citiesLoading}
              disabled={!stateReady}
              inputClassName="p-5"
            />
          ) : (
            <>
              <input
                type="text"
                value={village}
                onChange={(e) => updateRoots({ country, region, ethnicity, village: e.target.value })}
                placeholder={hasStates && !selectedState ? 'Choisissez d\'abord un pays et une région' : 'Tapez votre ville ou village natal...'}
                className={inputClass}
                disabled={!selectedCountry || (hasStates && !selectedState)}
              />
              {selectedCountry && !useCitySelect && (hasStates ? selectedState != null : true) && (
                <p className="text-xs text-zinc-400 font-bold px-1">Saisie libre : votre ville ou village n'apparaît pas dans les listes.</p>
              )}
            </>
          )}
        </div>

        <div className="space-y-2">
          <label className={labelClass}>Ethnie d'origine</label>
          <input
            type="text"
            value={ethnicity}
            onChange={(e) => updateRoots({ country, region, ethnicity: e.target.value, village })}
            placeholder="Ex: Française, Américaine, Métisse, Fon, Yoruba, Baoulé..."
            className={inputClass}
            required
          />
        </div>
      </div>
    </div>
  );
};
