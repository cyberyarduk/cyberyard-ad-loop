// Lightweight wrapper around the Cache Storage API for offline media playback.
// Stores actual video/image bytes so the player keeps running when the
// network drops. Falls back gracefully when Cache API is unavailable.

const CACHE_NAME = 'cyberyard-media-v1';
const MAX_ITEMS = 50; // hard cap so device storage doesn't grow forever

const cacheAvailable = () =>
  typeof window !== 'undefined' && 'caches' in window;

export async function precacheUrls(urls: string[]): Promise<void> {
  if (!cacheAvailable() || urls.length === 0) return;
  try {
    const cache = await caches.open(CACHE_NAME);
    const existing = await cache.keys();
    const existingUrls = new Set(existing.map((r) => r.url));

    // Trim oldest entries first if we'd exceed the cap
    const wanted = new Set(urls);
    const toDelete = existing.filter((req) => !wanted.has(req.url));
    if (existing.length + urls.length > MAX_ITEMS) {
      for (const req of toDelete.slice(0, existing.length + urls.length - MAX_ITEMS)) {
        await cache.delete(req);
      }
    }

    await Promise.all(
      urls
        .filter((u) => !!u && !existingUrls.has(u))
        .map(async (url) => {
          try {
            const res = await fetch(url, { mode: 'cors', cache: 'no-store' });
            if (res.ok) await cache.put(url, res.clone());
          } catch (e) {
            // silent — best effort caching
            console.warn('[mediaCache] precache failed for', url, e);
          }
        }),
    );

    // Save manifest of cached URLs for quick lookup
    localStorage.setItem('cached_media_urls', JSON.stringify(Array.from(wanted)));
  } catch (e) {
    console.warn('[mediaCache] precache error', e);
  }
}

export async function getCachedBlobUrl(url: string): Promise<string | null> {
  if (!cacheAvailable() || !url) return null;
  try {
    const cache = await caches.open(CACHE_NAME);
    const res = await cache.match(url);
    if (!res) return null;
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

export async function isCached(url: string): Promise<boolean> {
  if (!cacheAvailable() || !url) return false;
  try {
    const cache = await caches.open(CACHE_NAME);
    const res = await cache.match(url);
    return !!res;
  } catch {
    return false;
  }
}
