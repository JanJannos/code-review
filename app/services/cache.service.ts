import Redis from "ioredis";
import { CACHE_TTL_SECONDS, REDIS_DEFAULT_URL } from "../config";

export class CacheService {
  private client: Redis;

  constructor(redisUrl?: string) {
    this.client = new Redis(redisUrl ?? process.env.REDIS_URL ?? REDIS_DEFAULT_URL);
  }

  async get<T>(key: string): Promise<T | null> {
    const val = await this.client.get(key);
    return val ? (JSON.parse(val) as T) : null;
  }

  async set(key: string, value: unknown, ttlSeconds = CACHE_TTL_SECONDS): Promise<void> {
    await this.client.set(key, JSON.stringify(value), "EX", ttlSeconds);
  }
}
