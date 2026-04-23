/**
 * Module-level in-memory cache.
 * Survives client-side navigation (module stays alive in the browser).
 * Cleared on hard refresh, which is expected behaviour.
 */

type CacheEntry<T> = {
  data: T;
  fetchedAt: number;
};

const store = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL_MS = 60_000; // 60 s

export const clientCache = {
  get<T>(key: string, ttlMs = DEFAULT_TTL_MS): T | undefined {
    const entry = store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return undefined;
    if (Date.now() - entry.fetchedAt > ttlMs) return undefined; // stale
    return entry.data;
  },

  set<T>(key: string, data: T): void {
    store.set(key, { data, fetchedAt: Date.now() });
  },

  /** Returns stale data even if TTL has passed (for stale-while-revalidate). */
  getStale<T>(key: string): T | undefined {
    return (store.get(key) as CacheEntry<T> | undefined)?.data;
  },

  invalidate(key: string): void {
    store.delete(key);
  },

  invalidatePrefix(prefix: string): void {
    for (const k of store.keys()) {
      if (k.startsWith(prefix)) store.delete(k);
    }
  },
};
