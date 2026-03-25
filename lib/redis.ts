/**
 * Redis client for caching. Uses REDIS_URL (e.g. redis://localhost:6379).
 * If unset, cache helpers no-op and return undefined.
 */

import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;
const CACHE_TTL_SECONDS = 60;

let redis: Redis | null = null;

function getClient(): Redis | null {
  if (!REDIS_URL) return null;
  if (!redis) {
    redis = new Redis(REDIS_URL, { maxRetriesPerRequest: null });
  }
  return redis;
}

/** Get cached string value, or null if miss / Redis unavailable */
export async function cacheGet(key: string): Promise<string | null> {
  const client = getClient();
  if (!client) return null;
  try {
    return await client.get(key);
  } catch {
    return null;
  }
}

/** Set cache key with optional TTL in seconds (default 60) */
export async function cacheSet(
  key: string,
  value: string,
  ttlSeconds: number = CACHE_TTL_SECONDS
): Promise<void> {
  const client = getClient();
  if (!client) return;
  try {
    if (ttlSeconds > 0) {
      await client.setex(key, ttlSeconds, value);
    } else {
      await client.set(key, value);
    }
  } catch (err) {
    console.warn('[Redis] cacheSet error:', err);
  }
}

/** Invalidate a key (e.g. after upload/delete so documents list is fresh) */
export async function cacheDel(key: string): Promise<void> {
  const client = getClient();
  if (!client) return;
  try {
    await client.del(key);
  } catch {
    // ignore
  }
}

/** Connection options for Bull (same Redis URL) */
export function getRedisOptions(): { host: string; port: number } | string | undefined {
  if (!REDIS_URL) return undefined;
  try {
    const u = new URL(REDIS_URL);
    return {
      host: u.hostname,
      port: parseInt(u.port || '6379', 10),
      ...(u.password && { password: u.password }),
    };
  } catch {
    return REDIS_URL;
  }
}

export function isRedisAvailable(): boolean {
  return !!REDIS_URL;
}
