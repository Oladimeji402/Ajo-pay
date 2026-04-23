import { useCallback, useEffect, useRef, useState } from 'react';
import { clientCache } from '@/lib/client-cache';

type Options = {
  /** Cache TTL in ms. Default 60 s. */
  ttl?: number;
  /** Skip fetching entirely (e.g. when a condition isn't met yet). */
  skip?: boolean;
};

type State<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

/**
 * Data-fetching hook with module-level cache.
 *
 * - First visit: shows loading spinner, fetches, caches.
 * - Return visit (cache fresh): returns data instantly, no spinner.
 * - Return visit (cache stale): returns old data instantly (no spinner),
 *   silently revalidates in background, swaps to fresh data.
 * - `mutate()` lets callers force a refetch and invalidate the cache.
 */
export function useData<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  options: Options = {},
) {
  const { ttl, skip = false } = options;
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const [state, setState] = useState<State<T>>(() => {
    if (skip) return { status: 'idle' };
    const stale = clientCache.getStale<T>(cacheKey);
    if (stale !== undefined) return { status: 'success', data: stale };
    return { status: 'loading' };
  });

  const run = useCallback(
    async (background = false) => {
      if (!background) setState({ status: 'loading' });
      try {
        const data = await fetcherRef.current();
        clientCache.set(cacheKey, data);
        setState({ status: 'success', data });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Something went wrong.';
        // Only show error state if we have nothing to show.
        setState(prev =>
          prev.status === 'success' ? prev : { status: 'error', error: msg },
        );
      }
    },
    [cacheKey],
  );

  useEffect(() => {
    if (skip) return;

    const fresh = clientCache.get<T>(cacheKey, ttl);
    if (fresh !== undefined) {
      // Cache is fresh — nothing to do.
      return;
    }

    const stale = clientCache.getStale<T>(cacheKey);
    if (stale !== undefined) {
      // Cache is stale — revalidate silently in background.
      void run(true);
    } else {
      // No cache at all — full fetch.
      void run(false);
    }
  }, [cacheKey, skip, ttl, run]);

  /** Force a fresh fetch and invalidate the cache entry. */
  const mutate = useCallback(() => {
    clientCache.invalidate(cacheKey);
    void run(false);
  }, [cacheKey, run]);

  return {
    data:    state.status === 'success' ? state.data : undefined,
    loading: state.status === 'loading',
    error:   state.status === 'error' ? state.error : undefined,
    mutate,
  };
}
