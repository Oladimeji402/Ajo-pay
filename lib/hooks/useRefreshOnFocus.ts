import { useEffect } from 'react';

type Options = {
  enabled?: boolean;
  minGapMs?: number;
};

/**
 * Re-run a refresh callback when the page becomes active again.
 * Useful for client pages that otherwise only refresh on mount.
 */
export function useRefreshOnFocus(onRefresh: () => void, options: Options = {}) {
  const { enabled = true, minGapMs = 1_500 } = options;

  useEffect(() => {
    if (!enabled) return;

    let lastRefreshAt = 0;

    const runRefresh = () => {
      const now = Date.now();
      if (now - lastRefreshAt < minGapMs) return;
      lastRefreshAt = now;
      onRefresh();
    };

    const onFocus = () => runRefresh();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') runRefresh();
    };
    const onPageShow = () => runRefresh();

    window.addEventListener('focus', onFocus);
    window.addEventListener('pageshow', onPageShow);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('pageshow', onPageShow);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [enabled, minGapMs, onRefresh]);
}
