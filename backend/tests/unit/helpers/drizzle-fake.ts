/**
 * Chaîne drizzle factice : chaque méthode (`from`, `where`, `limit`, `set`…) renvoie la chaîne elle-même,
 * `await` résout `result`, et `calls` garde l'ordre des méthodes appelées.
 */
export function chain<T = unknown>(result: unknown): T & { calls: string[]; args: Record<string, unknown[]> } {
  const calls: string[] = [];
  const args: Record<string, unknown[]> = {};
  const proxy: unknown = new Proxy({}, {
    get(_target, prop: string) {
      if (prop === 'then') return (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) => Promise.resolve(result).then(res, rej);
      if (prop === 'calls') return calls;
      if (prop === 'args') return args;
      return (...a: unknown[]) => { calls.push(prop); args[prop] = a; return proxy; };
    },
  });
  return proxy as T & { calls: string[]; args: Record<string, unknown[]> };
}

/** Table factice : chaque colonne vaut « table.colonne » (suffisant pour eq()/and() de drizzle). */
export function fakeTable(name: string, cols: string[]): Record<string, string> {
  return Object.fromEntries(cols.map((c) => [c, `${name}.${c}`]));
}
