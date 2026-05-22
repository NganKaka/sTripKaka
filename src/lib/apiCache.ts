type CacheEntry<T> = {
  promise: Promise<T>;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL_MS = 60_000;
const DEFAULT_FETCH_TIMEOUT_MS = 8_000;
const STORAGE_PREFIX = 'stripkaka_cache:v1:';

type StoredEntry<T> = { data: T; savedAt: number };

function storageKey(url: string): string {
  return `${STORAGE_PREFIX}${url}`;
}

function readStored<T>(url: string): StoredEntry<T> | null {
  try {
    const raw = localStorage.getItem(storageKey(url));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredEntry<T>;
    if (!parsed || typeof parsed.savedAt !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStored<T>(url: string, data: T): void {
  try {
    const entry: StoredEntry<T> = { data, savedAt: Date.now() };
    localStorage.setItem(storageKey(url), JSON.stringify(entry));
  } catch {
    // ignore quota / private-mode failures
  }
}

function removeStored(url: string): void {
  try {
    localStorage.removeItem(storageKey(url));
  } catch {
    // ignore
  }
}

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
    const data = (await res.json()) as T;
    writeStored<T>(url, data);
    return data;
  }).catch((err) => {
    cache.delete(url);
    throw err;
  });

  cache.set(url, { promise, expiresAt: now + ttlMs });
  return promise;
}

export function getCachedJson<T>(url: string, ttlMs: number = DEFAULT_TTL_MS): { data: T; stale: boolean } | null {
  const stored = readStored<T>(url);
  if (!stored) return null;
  const age = Date.now() - stored.savedAt;
  return { data: stored.data, stale: age > ttlMs };
}

type SwrOptions = {
  signal?: AbortSignal;
  timeoutMs?: number;
};

export type SwrResult<T> = {
  cached: { data: T; stale: boolean } | null;
  fresh: Promise<T>;
};

export function staleWhileRevalidateFetch<T>(
  url: string,
  ttlMs: number = DEFAULT_TTL_MS,
  opts: SwrOptions = {},
): SwrResult<T> {
  const cached = getCachedJson<T>(url, ttlMs);

  const timeoutMs = opts.timeoutMs ?? DEFAULT_FETCH_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  if (opts.signal) {
    if (opts.signal.aborted) controller.abort();
    else opts.signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  const fresh = fetch(url, { signal: controller.signal })
    .then(async (res) => {
      if (!res.ok) {
        cache.delete(url);
        throw new Error(`Request failed: ${res.status}`);
      }
      const data = (await res.json()) as T;
      writeStored<T>(url, data);
      cache.set(url, { promise: Promise.resolve(data), expiresAt: Date.now() + ttlMs });
      return data;
    })
    .catch((err) => {
      cache.delete(url);
      throw err;
    })
    .finally(() => clearTimeout(timer));

  return { cached, fresh };
}

export function invalidateCache(prefix?: string) {
  if (!prefix) {
    cache.clear();
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) localStorage.removeItem(key);
      }
    } catch {
      // ignore
    }
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
  try {
    const fullPrefix = `${STORAGE_PREFIX}${prefix}`;
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(fullPrefix)) localStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}

export function clearStoredCache(url: string): void {
  removeStored(url);
}
