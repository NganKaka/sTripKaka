type CacheEntry<T> = {
  promise: Promise<T>;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL_MS = 60_000;

export function cachedFetchJson<T>(url: string, ttlMs: number = DEFAULT_TTL_MS): Promise<T> {
  const now = Date.now();
  const existing = cache.get(url) as CacheEntry<T> | undefined;
  if (existing && existing.expiresAt > now) {
    return existing.promise;
  }

  const promise = fetch(url).then(async (res) => {
    if (!res.ok) {
      cache.delete(url);
      throw new Error(`Request failed: ${res.status}`);
    }
    return res.json() as Promise<T>;
  }).catch((err) => {
    cache.delete(url);
    throw err;
  });

  cache.set(url, { promise, expiresAt: now + ttlMs });
  return promise;
}

export function invalidateCache(prefix?: string) {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}
