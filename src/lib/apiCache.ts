export interface CacheOptions {
  key?: string;
  ttlMs?: number;
  force?: boolean;
}

interface CacheEntry<T> {
  data?: T;
  expiresAt: number;
  promise?: Promise<T>;
}

const cache = new Map<string, CacheEntry<unknown>>();

export function cachedRequest<T>(key: string, options: CacheOptions | undefined, fetcher: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const ttlMs = options?.ttlMs ?? 0;
  const entry = cache.get(key) as CacheEntry<T> | undefined;

  if (!options?.force && entry?.data !== undefined && entry.expiresAt > now) {
    return Promise.resolve(entry.data);
  }

  if (!options?.force && entry?.promise) {
    return entry.promise;
  }

  const promise = fetcher()
    .then((data) => {
      cache.set(key, { data, expiresAt: Date.now() + ttlMs });
      return data;
    })
    .catch((error) => {
      if (entry?.data !== undefined) {
        cache.set(key, { data: entry.data, expiresAt: entry.expiresAt });
      } else {
        cache.delete(key);
      }
      throw error;
    });

  cache.set(key, { data: entry?.data, expiresAt: entry?.expiresAt ?? 0, promise });
  return promise;
}

export function invalidateCache(matcher: string | ((key: string) => boolean)) {
  for (const key of cache.keys()) {
    if (typeof matcher === 'string' ? key.includes(matcher) : matcher(key)) {
      cache.delete(key);
    }
  }
}

export function clearApiCache() {
  cache.clear();
}
