import React, { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/src/lib/utils';
import { SearchableSelectTrigger } from './SearchableSelectTrigger';
import { SearchableSelectDropdown } from './SearchableSelectDropdown';
import type { SearchableSelectProps, SelectOption } from './SearchableSelect.types';

export type { SelectOption } from './SearchableSelect.types';

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Sélectionnez...',
  multiple = false,
  max,
  showFlag = false,
  showMeta = false,
  loading = false,
  emptyLabel = 'Aucun résultat',
  containerClassName,
  inputClassName,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(() => {
    const list = Array.isArray(value) ? value : value ? [value] : [];
    return options.filter((o) => list.includes(o.value));
  }, [options, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.native ?? '').toLowerCase().includes(q) ||
        (o.meta ?? '').toLowerCase().includes(q)
    );
  }, [options, query]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  const toggle = (option: SelectOption) => {
    if (multiple) {
      const list = Array.isArray(value) ? [...value] : [];
      if (list.includes(option.value)) {
        onChange(list.filter((v) => v !== option.value));
      } else {
        if (max && list.length >= max) return;
        onChange([...list, option.value]);
      }
    } else {
      onChange(option.value);
      setOpen(false);
    }
  };

  const remove = (val: string) => onChange(Array.isArray(value) ? value.filter((v) => v !== val) : []);

  const isSelected = (val: string) =>
    Array.isArray(value) ? value.includes(val) : value === val;

  return (
    <div ref={rootRef} className={cn('relative', containerClassName)}>
      <SearchableSelectTrigger
        selected={selected}
        placeholder={placeholder}
        multiple={multiple}
        showFlag={showFlag}
        showMeta={showMeta}
        loading={loading}
        open={open}
        disabled={disabled}
        inputClassName={inputClassName}
        onClick={() => !disabled && setOpen((o) => !o)}
        onRemove={remove}
      />
      <SearchableSelectDropdown
        open={open}
        query={query}
        setQuery={setQuery}
        filtered={filtered}
        showFlag={showFlag}
        showMeta={showMeta}
        emptyLabel={emptyLabel}
        searchRef={searchRef}
        isSelected={isSelected}
        onToggle={toggle}
      />
    </div>
  );
};
