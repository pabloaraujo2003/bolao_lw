import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as { redis: Redis | undefined }

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: 2,
    connectTimeout: 5000,
    lazyConnect: false,
    enableOfflineQueue: false,
  })

redis.on('error', () => {})

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis
