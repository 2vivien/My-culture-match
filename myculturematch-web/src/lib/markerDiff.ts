/** Différence entre les marqueurs présents et ceux voulus : on ne recrée que ce qui change. */
export function diffMarkerKeys(present: Iterable<string>, wanted: readonly string[]): { add: string[]; remove: string[] } {
  const want = new Set(wanted);
  const have = new Set(present);
  return {
    add: wanted.filter((k, i) => !have.has(k) && wanted.indexOf(k) === i),
    remove: [...have].filter((k) => !want.has(k)),
  };
}
