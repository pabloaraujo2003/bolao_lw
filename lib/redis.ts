import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as { redis: Redis | undefined }

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
    commandTimeout: 2000,
    lazyConnect: true,
    enableOfflineQueue: false,
  })

redis.on('error', () => {})

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis
